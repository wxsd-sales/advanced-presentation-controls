/********************************************************
 * 
 * Macro Author:      	William Mills
 *                    	Technical Solutions Specialist 
 *                    	wimills@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 1-0-0
 * Released: 04/15/22
 * 
 * This macro gives you greater control over how presenations media
 * is shown on your Webex Devices displays. In a multi monitor
 * device configuration you may want to use the Main Display which is
 * normally reserved for displaying the receiving video or call information
 * and show the remote or local presentation.
 * 
 * Additionally it also gives you a greater control of local preview content
 * by automatically restoring a local preview which is normally stopped when
 * a call is made or a Cloud Proximity share has been started.
 * 
 * By default Webex Devices will auto preview a new video signal while not
 * on a call and can be and also can be configured to do the same while on a call. 
 * This feature will toggle the in call behaviour.
 *
 * Full Readme, source code and license agreement available on Github:
 * https://github.com/wxsd-sales/advance-presentation-controls
 *
 ********************************************************/

import xapi from 'xapi';

/*********************************************************
 * Configure the settings below
**********************************************************/

const config = {
  features: {
    autoPreview: {                
      enabled: true,              // Enable/disable this feature true = enabled, false = disabled
      initial: true,              // Specify the intial value this feature
      name: "Auto Preview"        // Feature Name as it appears on the UI Panel
    },
    localRestore: {
      enabled: true,
      initial: true,
      name: "Local Restore"
    },
    dualPres: {
      enabled: true,
      initial: false,
      name: "Dual Presentation"
    },
    triplePres: {
      enabled: true,
      initial: false,
      name: "Triple Presentation"
    }
  },
  behaviour: {
    showMenu: true,               // Show the UI Panel and the feature toggles
    showNotifications: true,      // Show notifcation on the touch and OSD
    reapplyDefaults: true         // Reapply initial settings when the call ends
  },
  name: "Advanced Presentation Controls"    // Name of the UI Panel and Button
};

/*********************************************************
 * Main Function: Do not change below
**********************************************************/

// Variables to store states
let numberOfDisplays = 0;
let states = {};

// Apply initial feature states from config
function initializeStates(){
  for (const [key, feature] of Object.entries(config.features)) {
    if( feature.enabled ) {
      states[key] = feature.initial;
    }
  }
}

// This is our main function which initializes everything
async function main() {

  initializeStates();

  // Initally detect the number of displays we have
  await detectOutputs();

  // Create the panel
  createPanel();

  // Apply default value to both
  applyDefaults();

  // Update the panel values
  await syncGui();

  // Listen for all toggle events
  xapi.Event.UserInterface.Extensions.Widget.Action.on(handleUserInput);

  // Listen for all presentation events
  xapi.Event.PresentationPreviewStopped.on(presentationChange);
  xapi.Event.PresentationPreviewStarted.on(presentationChange);
  xapi.Event.PresentationStarted.on(presentationChange);
  xapi.Event.PresentationStopped.on(presentationChange);

  // Listen for call answers to apply current display preferences
  xapi.Status.Call.AnswerState.on(callAnswered);

  // Listen for call disconnects so we can reset the controls
  // back to default after a call
  xapi.Event.CallDisconnect.on(callDisconnect);
}

// Run our main function and begin monitoring events
main();


/*********************************************************
 * Below are the functions which this macro uses
**********************************************************/


// This funtion displays alerts and is called when the macro
// makes a change to the system
function alert(message){
  if(config.behaviour.showMenu){
    xapi.Command.UserInterface.Message.Alert.Display(
    { Duration: 5, Text: message, Title: config.name });
  }
  console.log('Alert: ' + message);
}

function handleUserInput(event) {
  switch (event.WidgetId) {
      case "autoPreview":
        setAutoPreview(event.Value === 'on');
        break;
      case 'localRestore':
        setLocalRestore(event.Value === 'on');
        break;
      case 'dualPres':
      case 'triplePres':
        setPresentation(event.Value === 'on', event.WidgetId);
        break;
    }
}

// This function will process all presentation change events
async function presentationChange(event) {
  // Ignore events with no causes
  if(!event.hasOwnProperty('Cause')){
    return;
  }

  // Restore the local presenation preview if the feature is eanbled
  if(event.Cause == 'enteringConference') {
    console.log('Presentation stopped due to entering conference');
    if(config.features.localRestore.enabled) {
      alert('Presentation stopped due to entering conference, restoring preview');
      xapi.Command.Presentation.Start(
      { ConnectorId: event.LocalSource, SendingMode: 'LocalOnly' });
    }
    return;
  }

  // Check if there are any on going local or remote shares
  let remoteShare = 'Off';
  let localShare = 'Off';
  try {
    remoteShare = await xapi.Status.Conference.Presentation.Mode.get();
    localShare = await xapi.Status.Conference.Presentation.LocalInstance.SendingMode.get()
  } catch {

  }
  
  console.log(`Local Pres State: ${localShare} | Remote Pres State: ${remoteShare}`);
  // If there are no presentations to display, disable the presentation preferences
  if(remoteShare == 'Off' && localShare == "Off") {
    updateOutputs(false);
    alert('No presentations, display outputs resetting');
  } else {
    // We have a presentation, now we need to verify there is an active call
    console.log('Presentation present')
    let callState = 'none';
    try {
      callState = await xapi.Status.Call.AnswerState.get();
    } catch {
      console.log('No calls, returning');
      updateOutputs(false);
      return;
    }
    // If we are in an active call, apply presentation preferences 
    if(callState == 'Answered'){
      console.log('Active call, applying presentation preferences');
      updateOutputs(true);
    }
    alert('Presentation started, applying presentation preferences');
  }
}

// This function will handle the Presentation toggles from the panel
// It will store the state selection, and apply change if a presentation is
// currently happening.
async function setPresentation(toggle, mode) {
  states[mode] = toggle;
  if(mode == 'triplePres' && states.dualPres) {
    states.dualPres = false;
  } else if(mode == 'dualPres' && states.triplePres ){
    states.triplePres = false;
  }
  const presState = await xapi.Status.Conference.Presentation.Mode.get();
  console.log('Presentation state: ' + presState);
  updateOutputs(presState != 'Off');
  syncGui();
}

// This function will update the monitor roles depending on the call state
// and the conditions of the presentation mode proferences
async function updateOutputs(mode) {
  const dualRole = (states.dualPres || states.triplePres) && mode ? 'PresentationOnly' : 'Auto';
  const tripleRole = states.triplePres && mode ? 'PresentationOnly' : 'Auto';
  xapi.Config.Video.Output.Connector[1].MonitorRole.set(dualRole);
  xapi.Config.Video.Output.Connector[2].MonitorRole.set(dualRole);
  if(numberOfDisplays == 3){
    xapi.Config.Video.Output.Connector[3].MonitorRole.set(tripleRole);
  }
  console.log(`Outputs updated: DualPres: ${dualRole} Triple: ${tripleRole}`);
}

async function callAnswered(event){
  if(event == 'Answered'){
    if(!(config.features.dualPres.enabled || config.features.triplePres.enabled)){
      return;
    }
    const presState = await xapi.Status.Conference.Presentation.Mode.get();
    console.log('Presentation state: ' + presState);
    updateOutputs(presState != 'Off');
  }
}

// This function will handle the Auto Preview toggles from the panel
async function setAutoPreview(toggle) {
  if (!config.features.autoPreview.enabled) {
    return;
  }
  states.autoPreview = toggle;
  console.log('Auto Preview set to : ' + toggle);
  const defaultSource = await xapi.Config.Video.Presentation.DefaultSource.get();
  const sourceType = await xapi.Config.Video.Input.Connector[defaultSource].InputSourceType.get();

  if (sourceType != 'camera'){
    xapi.Config.Video.Input.Connector[defaultSource].PresentationSelection.set(toggle ? 'Desktop' : 'OnConnect');
    console.log(`Source: ${defaultSource}, set to ${toggle ? 'Desktop' : 'OnConnect'}`)
  } else {
    alert('Cannot enable, the default presentation source is a camera');
    states.autoPreview = false;    
  }
  syncGui();
}

// This function will hanlde the Local Restore toggle from the panel
function setLocalRestore(toggle) {
  if(!config.features.localRestore.enabled){
    return;
  }
  states.localRestore = toggle;
  console.log('Local Preview set to : ' + toggle );
  syncGui();
}

// This function updates the UI with the correct toggle states
async function syncGui() {
  if(!config.behaviour.showMenu){return}
  for (const [key, value] of Object.entries(states)) {
    xapi.Command.UserInterface.Extensions.Widget.SetValue({
      WidgetId: key,
      Value: value ? 'on' : 'off',
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
function applyDefaults(){
  console.log('Applying defaults');
  setAutoPreview(config.features.autoPreview.initial);
  setLocalRestore(config.features.localRestore.initial);
  if(config.features.triplePres.enabled && config.features.triplePres.initial && (numberOfDisplays>2)){
    setPresentation(config.features.triplePres.initial, 'triplePres');
  } else {
    setPresentation(config.features.dualPres.initial, 'dualPres');
  }
}

// Handles call disconnects and reapply the initial defaults if the setting is enabled
function callDisconnect() {
  if(config.behaviour.reapplyDefaults) {
    alert('Call disconnected, applying defaults');
    applyDefaults();
  }
}

// This function will create our control panel and save it.
// It is felixable and will only display controls for features
// that are available or enabled. If the the admin has decided
// not to have user controls, the panel will be deleted.
function createPanel() {

  if (!config.behaviour.showMenu) {
    xapi.Command.UserInterface.Extensions.Panel.Remove(
      { PanelId: 'advanced_presentation_controls' });
      return;
  }

  let featureRows = '';
  for (const [key, feature] of Object.entries(config.features)) {
    const newRow = !feature.enabled ? '' :`
    <Row>
      <Name>${feature.name}</Name>
      <Widget>
        <WidgetId>${key}</WidgetId>
        <Type>ToggleButton</Type>
        <Options>size=1</Options>
      </Widget>
    </Row>`;
    featureRows = featureRows.concat(newRow);
  }

  const panel = `
  <Extensions>
    <Version>1.8</Version>
    <Panel>
      <Order>1</Order>
      <PanelId>advanced_presentation_controls</PanelId>
      <Type>Home</Type>
      <Location>HomeScreenAndCallControls</Location>
      <Type>Statusbar</Type>
      <Icon>Sliders</Icon>
      <Color>#CF7900</Color>
      <Name>${config.name}</Name>
      <ActivityType>Custom</ActivityType>
      <Page>
        <Name>${config.name}</Name>
        ${featureRows}
        <Options/>
      </Page>
    </Panel>
  </Extensions>`;

  xapi.Command.UserInterface.Extensions.Panel.Save(
    { PanelId: 'advanced_presentation_controls' }, 
    panel
  )
}
