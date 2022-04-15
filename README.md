# Advanced Presentation Controls
This macro gives you greater control over how presenations media is shown on your Webex Devices displays. In a multi monitor configuration you may want to use the Main Display which is normally reserved for displaying the receiving video or call information to show the remote or local presentation. Also it gives you greater control of local preview content, by automatically restoring a local preview which was stopped due to a call or Cloud Proximity share.

## Overview

This Macro provides the following features:

1. Auto Preview: This causes a new video source to automatically display as a local preview while on a call or not.
2. Preview Recover: This is automatically restore a local preview which was stopped due to joining a call or starting a Cloud Proximity share.
3. Multi Display Presentation: Select if you wish use two or three screens to show your presentation content.

All these features can easily be enable and set to default behaviours by the configuration section in the Macro. A user controllable Panel is also included which enables a user to toggle these features with admin help. Lastly these features can be hard set where the user cannot change them by disabling the Panel.

![output_O7fhlZ](https://user-images.githubusercontent.com/21026209/163624199-460699de-73ec-494d-be7f-bb0416b26fdd.gif)


## Requirements

1. A CE9.X or RoomOS Webex Device with at least two videos outputs for the Multi Display feature.
2. Web admin access to the device to uplaod the macro.

## Setup

1. Download the ``advanced-presentation-controls.js`` file and upload it to your Webex Room devices Macro editor via the web interface.
2. Configure the Macro by toggling the values at the beining of the file.
3. Enable the Macro on the editor.

## Uninstall

1. Delete the ``advanced-presentation-controls.js`` Macro from your devices Macro editor.
2. Delete the UI panel which the Macro created by going to the Webex Devices UI Editor and deleting ``Advanced Presentation Controls``


## Support

Please reach out to the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?cc=<your_cec>@cisco.com&subject=RepoName)
or contact me on Webex (<your_cec>@cisco.com).
