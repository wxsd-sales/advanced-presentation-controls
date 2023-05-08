# Advanced Presentation Controls

This macro gives you greater control over how presentation media is shown on your Webex Devices displays. In a multi monitor configuration you may want to use the Main Display which is normally reserved for displaying the receiving video or call information to show the remote or local presentation. Also it gives you greater control of local preview content, by automatically restoring a local preview which was stopped due to a call or Cloud Proximity share.

![output_O7fhlZ](https://user-images.githubusercontent.com/21026209/163624199-460699de-73ec-494d-be7f-bb0416b26fdd.gif)

## Overview

This Macro provides the following features:

- Auto Preview: This causes a new video source to automatically display as a local preview while on a call or not.
- Preview Recover: This is automatically restore a local preview which was stopped due to joining a call or starting a Cloud Proximity share.
- Multi Display Presentation: Select if you wish use two or three screens to show your presentation content.

All these features can easily be enable and set to default behaviours by the configuration section in the Macro. A user controllable Panel is also included which enables a user to toggle these features with admin help. Lastly these features can be hard set where the user cannot change them by disabling the Panel.


## Setup

### Prerequisites & Dependencies: 

- A CE9.X or RoomOS Webex Device with at least two videos outputs for the Multi Display feature.
- Web admin access to the device to upload the macro.

### Installation Steps:
1. Download the ``advance-presentation-controls.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by toggling the values at the beining of the file.
3. Enable the Macro on the editor.


## Demo

*For more demos & PoCs like this, check out our [Webex Labs site](https://collabtoolbox.cisco.com/webex-labs).


## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.


## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex use cases, but are not Official Cisco Webex Branded demos.


## Questions
Please contact the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=advanced-presentation-controls) for questions. Or, if you're a Cisco internal employee, reach out to us on the Webex App via our bot (globalexpert@webex.bot). In the "Engagement Type" field, choose the "API/SDK Proof of Concept Integration Development" option to make sure you reach our team. 
