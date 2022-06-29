import xapi from 'xapi';

// This macro gives you greater control over how presenations media
// is shown on your Webex Devices displays. In a multi monitor
// device configuration you may want to use the Main Display which is 
// normally reserved for displaying the receiving video or call information
// and show the remote or local presentation.
//
// Additionally it also gives you a greater control of local preview content
// by automatically restoring a local preview which is normally stopped when 
// a call is made or a Cloud Proximity share has been started.


// By default Webex Devices will auto preview a new video signal while not
// on a call and can be and also can be configured to do the same while on a call. 
// This feature will toggle the in call behaviour.
const AUTO_PERVIEW_ENABLE = true;
const AUTO_PERVIEW_DEFAULT = true;

// If you are sharing a presentation locally and a Cloud Proximity share
// or a Conference call is started. The local share is automally stopped.
// This feature will automatically restore the local share as a local preview
const LOCAL_RESTORE_ENABLE = true;
const LOCAL_RESTORE_DEFAULT = true;

// These options allow you to enable the option for your output displays
// to only show presentation content. If your device have has three output
// you can also change all three to display the presentation.
const PRES_DUAL_ENABLE = true;
const PRES_TRIPLE_ENABLE = true;

// You can select the default of these options, however only one can be
// enabled at a time, if Triple mode is eanbled, then dual will be disabled
const PRES_DUAL_DEFAULT = true;
const PRES_TRIPLE_DEFAULT = false;

// The default settings can be applied once the call has ended
const RESET_DEFAULTS = true;

// The buttons and panel can be completely disabled  altogether and only 
// the default options will be enabled. The user will not be able to disable
// them from the touch device. Be sure that all behaviours are working as
// expected before disabling the menu.
const SHOW_MENU = true;

// The macro will display notifications when ever it has made a change
// to the device settings, layouts or presentations. This is useful
// to know what is default device behaviour and what was the macro.
const SHOW_NOTIFICATIONS = true;

// This name is used for the notification titles, buttons and panel
const MACRO_NAME = 'Advanced Presentation Controls';

//////////////////////////////////////////////////////////////////////////////
//////////////////////////// Do not change below /////////////////////////////
//////////////////////////////////////////////////////////////////////////////


let autoPreview = AUTO_PERVIEW_DEFAULT;
let localRestore = LOCAL_RESTORE_DEFAULT;
let presentationLayout = 'default';
let numberOfDisplays = 0;

function alert(message){

  if(SHOW_NOTIFICATIONS){
    xapi.Command.UserInterface.Message.Alert.Display(
    { Duration: 5, Text: message, Title: MACRO_NAME });
  }

  console.log(message);

}

// This function is trigger every time a presentation preview stops
async function previewStopped(event){

  if(event.hasOwnProperty('Cause')){

    const presentationState = await xapi.Status.Conference.Presentation.Mode.get();

    // If the presentation preview was stopped because we entered 
    // a conference and preview restore is enable we will restore it
    if(event.Cause == 'enteringConference' && localRestore){

      console.log('Presentation preview stopped due to entering conference ');
      console.log('Restoring preview');

      xapi.Command.Presentation.Start(
      { ConnectorId: event.LocalSource, SendingMode: 'LocalOnly' });

      alert('Preview has been restored');

      return;

    }

    // If the presentation preview was stopped because we entered 
    // a conference and preview restore is enable we will restore it

    if(!(PRES_DUAL_ENABLE || PRES_TRIPLE_ENABLE)){
      return;
    }

    console.log('Presentation State: ' +presentationState);

    if (presentationState != 'Off'){
      return;
    }

    console.log(event.Cause);

    switch(event.Cause) {
      case 'userRequested':
        console.log('User requested to stop preview');
        updateOutputs(false);
        alert('Preview has been stopped, returning to defaults');
        break;
      case 'noSignal':
        console.log('No Signal, returning to default');
        updateOutputs(false);
        alert('Preview ended due to no signal, returing to default');
        break;
      case 'disconnect':
        console.log('Source disconnected, returning to default');
        updateOutputs(false);
        alert('Preview ended due source disconnect, returing to default');
        break;
    }
  }
}

// This function is trigger every time a presentation preview starts
async function previewStarted(event){

  if(event.hasOwnProperty('Cause')){

    if(!((PRES_DUAL_ENABLE || PRES_TRIPLE_ENABLE))){
      return;
    }

    let callState = '';

    try {
      callState = await xapi.Status.Call.AnswerState.get();
    } catch {
      callState = 'none'
    }

    console.log("Call state: " +callState);

    if (callState == 'none'){
      return;
    }

    // If the presentation preview was stopped because we entered 
    // a conference and preview restore is enable we will restore it
    if(event.Cause == 'autoStartDesktop'){

      console.log('Presentation preview auto started');

      updateOutputs(true);

      alert('Presentation preview auto started, applying presentation preferences');

      return;

    }

    if(event.Cause == 'userRequested'){

      updateOutputs(true);

      console.log('Presentation preview auto started');

      alert('Presentation preview auto started, applying presentation preferences');

      return;

    }
  }
}

// This function is trigger every time a presentation preview stops
function presentationStarted(event){

  if(event.hasOwnProperty('Cause')){

    // If the presentation preview was stopped because we entered 
    // a conference and preview restore is enable we will restore it
    if(event.Cause == 'startReceiving'){

      console.log('Remote presentation started');

      updateOutputs(true);

      alert('Remote presentation started, applying presentation preferences');

    }
  }
}

// This function is trigger every time a presentation preview stops
async function presentationStopped(event){

  if(event.hasOwnProperty('Cause')){

    // If the presentation preview was stopped because we entered 
    // a conference and preview restore is enable we will restore it
    if(event.Cause == 'remoteNormal' && autoPreview){

      console.log('Remote presentation stopped');

      // First check there is a preview present
      let sendingMode = '';
      try{
        sendingMode = await xapi.Status.Conference.Presentation.LocalInstance.SendingMode.get();
      } catch {
        sendingMode = 'none'
      }

      if(sendingMode != 'none'){
        console.log('Local preview is present')

      } else {
        console.log('No local preview present, returning to defaults');
        updateOutputs(false);
        alert('Remote presentation stopped, returing to default');
      }   

    }
  }
}

// This function will handle the Presentation toggles from the panel
async function setPresentation(state, mode) {
 
  presentationLayout = state ? mode : 'default';

  console.log('Presentation set to: ' + presentationLayout);

  const presentationState = await xapi.Status.Conference.Presentation.Mode.get();

  console.log('Presentation state: ' +presentationState);

  if (presentationState == 'Off') {
    updateOutputs(false);
  } else {
    updateOutputs(state);
  }

  syncGui();
}

// This function will update the monitor roles depending on the call state
// and the conditions of the presentation mode proferences
async function updateOutputs(mode) {

  const role = mode ? 'PresentationOnly' : 'Auto';

  xapi.Config.Video.Output.Connector[1].MonitorRole.set(role);
  xapi.Config.Video.Output.Connector[2].MonitorRole.set(role);

  if(numberOfDisplays == 3){
    xapi.Config.Video.Output.Connector[3].MonitorRole.set(presentationLayout === TOGGLE_TRIPLE ? role : 'Auto');
  }

  console.log(`Outputs have been updated: ${role} | ${presentationLayout}`);

}

async function callAnswered(event){

  if(event == 'Answered'){

    if(!(PRES_DUAL_ENABLE || PRES_TRIPLE_ENABLE)){
      return;
    }
    const presentationState = await xapi.Status.Conference.Presentation.Mode.get();

    console.log('Presentation state: ' +presentationState);

    if (presentationState == 'Off') {
      updateOutputs(false);
    } else {
      updateOutputs(true);
    }

  }
  
}



// This function will handle the Auto Preview toggles from the panel
async function setAutoPreview(toggle) {

  if (!AUTO_PERVIEW_ENABLE) {
    return;
  }

  autoPreview = toggle ? true : false;
  console.log('Auto Preview set to : ' +autoPreview );
  syncGui();

  // Get the devices default presentation video source
  // Verify it isn't a camera (possible for three camera systems)
  // e.g. (Speaker track + Presenter Camera)
  const defaultSource = await xapi.Config.Video.Presentation.DefaultSource.get();
  const sourceType = await xapi.Config.Video.Input.Connector[defaultSource].InputSourceType.get();

  // Here we toggle the default presentation source between 'Desktop' and 'OnConnect'
  // OnConnect - default behaviour, wakes system up on signal and shows locally while no in call
  // Desktop - similar to OnConnect but will also share locally while on a call
  if (sourceType != 'camera'){
    xapi.Config.Video.Input.Connector[defaultSource].PresentationSelection.set(autoPreview ? 'Desktop' : 'OnConnect');
    console.log(`Source: ${defaultSource}, set to ${autoPreview ? 'Desktop' : 'OnConnect'} `)
  } else {
    alert('Cannot enable, the default presentation source is a camera');
    autoPreview = false;
    syncGui();
  }

}

// This function will hanlde the Local Restore toggle from the panel
function setLocalRestore(toggle) {

  if(!LOCAL_RESTORE_ENABLE){
    return;
  }

  localRestore = toggle;
  console.log('Local Preview set to : ' +localRestore );
  syncGui();
}

// This function updates the UI with the correct toggle states
async function syncGui() {

  if(!SHOW_MENU){
    return;
  }

  if(AUTO_PERVIEW_ENABLE){
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: TOGGLE_AUTO,
      Value: autoPreview ? 'on' : 'off',
    });
  }

  if(LOCAL_RESTORE_ENABLE){
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: TOGGLE_RESTORE,
      Value: localRestore ? 'on' : 'off',
    });
  }

  if(PRES_DUAL_ENABLE){
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: TOGGLE_DUAL,
      Value: presentationLayout === TOGGLE_DUAL ? 'on' : 'off',
    });
  }

  if(PRES_TRIPLE_ENABLE && numberOfDisplays>2){
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: TOGGLE_TRIPLE,
      Value: presentationLayout === TOGGLE_TRIPLE ? 'on' : 'off',
    });
  }
}

// This function will monitor all output video connect events
async function detectOutputs(event){
  
  const value = await xapi.Status.Video.Output.Connector.get();
  numberOfDisplays = value.length;
  console.log('Number of displays: ' +numberOfDisplays);

}


// This function is run initially to apply any default values
// to the device configuration and GUI
function setInitialDefaults(){

  console.log('Applying defaults');

  setAutoPreview(autoPreview);

  setLocalRestore(localRestore);

  if(PRES_TRIPLE_ENABLE && PRES_TRIPLE_DEFAULT && (numberOfDisplays>2)){
    setPresentation(PRES_TRIPLE_DEFAULT, TOGGLE_TRIPLE);
  } else {
    setPresentation(PRES_DUAL_DEFAULT, TOGGLE_DUAL);
  }

}

function callDisconnect() {

  if(RESET_DEFAULTS) {
    console.log('Call disconnected, applying defaults');
    setInitialDefaults();
  }

}

async function main() {

  // Initally detect the number of displays we have
  await detectOutputs();

  // Create the panel
  createPanel();

  // Apply default value to both
  setInitialDefaults();

  // Update the panel values
  await syncGui();

  // Listen for all toggle events
  xapi.Event.UserInterface.Extensions.Widget.Action.on((event) => {
    switch (event.WidgetId) {
      case TOGGLE_AUTO:
        setAutoPreview(event.Value === 'on');
        break;
      case TOGGLE_RESTORE:
        setLocalRestore(event.Value === 'on');
        break;
      case TOGGLE_DUAL:
        //setDualPresentation(event.Value === 'on');
        setPresentation(event.Value === 'on', TOGGLE_DUAL);
        break;
      case TOGGLE_TRIPLE:
        //setTriplePresentation(event.Value === 'on');
        setPresentation(event.Value === 'on', TOGGLE_TRIPLE);
        break;
    }      
  });

  // Listen for all presentation preview ending events
  xapi.Event.PresentationPreviewStopped.on(previewStopped);

  // Listen for all presentation preview starting events
  xapi.Event.PresentationPreviewStarted.on(previewStarted);
  xapi.Event.PresentationStarted.on(presentationStarted);
  xapi.Event.PresentationStopped.on(presentationStopped);

  // Listen for call answers to apply current display preferences
  xapi.Status.Call.AnswerState.on(callAnswered);

  // Listen for call disconnects so we can reset the controls
  // back to default after a call
  xapi.Event.CallDisconnect.on(callDisconnect);

}


const TOGGLE_AUTO = 'auto_preview';
const TOGGLE_RESTORE = 'local_preview';
const TOGGLE_DUAL = 'dual_presentation';
const TOGGLE_TRIPLE = 'triple_presentation';


// This function will create our control panel and save it.
// It is felixable and will only display controls for features
// that are available or enabled. If the the admin has decided
// not to have user controls, the panel will be deleted.
function createPanel() {

  const auto_row = !AUTO_PERVIEW_ENABLE ? '' :`
    <Row>
      <Name>Auto Preview</Name>
      <Widget>
        <WidgetId>${TOGGLE_AUTO}</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
    </Row>`;

  const restore_row = !LOCAL_RESTORE_ENABLE ? '' :`
    <Row>
      <Name>Preview Restore</Name>
      <Widget>
        <WidgetId>${TOGGLE_RESTORE}</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
    </Row>`;
  

  const dual_row = !PRES_DUAL_ENABLE ? '' :`
    <Row>
      <Name>Dual Presentation</Name>
      <Widget>
        <WidgetId>${TOGGLE_DUAL}</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
    </Row>`;

  
  const triple_row = !PRES_TRIPLE_ENABLE ? '' : (numberOfDisplays>2) ? `
    <Row>
      <Name>Triple Presentation</Name>
      <Widget>
        <WidgetId>${TOGGLE_TRIPLE}</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
    </Row>`: '';

  const panel = `
  <Extensions>
    <Version>1.8</Version>
    <Panel>
      <Order>1</Order>
      <PanelId>advanced_presentation_controls</PanelId>
      <Type>Statusbar</Type>
      <Icon>Sliders</Icon>
      <Color>#CF7900</Color>
      <Name>Advanced Presentation Controls</Name>
      <ActivityType>Custom</ActivityType>
      <Page>
        <Name>Advanced Presentation Controls</Name>
        ${auto_row}
        ${restore_row}
        ${dual_row}
        ${triple_row}
        <Options/>
      </Page>
    </Panel>
  </Extensions>`;

  if (SHOW_MENU) {
    xapi.Command.UserInterface.Extensions.Panel.Save(
      { PanelId: 'advanced_presentation_controls' }, 
      panel
    )
  } else {
    xapi.Command.UserInterface.Extensions.Panel.Remove(
      { PanelId: 'advanced_presentation_controls' });
  }
}

// Run our main function and begin monitoring events
main();
