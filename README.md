# Local Tomcat (LT)
An extension to reduce open explorer windows or tabs and repetitive hassle to deploy and manage applications deployed on local tomcat.

## Features
After configuring required properties. It can deploy, remove and can even open logs within few key presses. Currently 9 commands are supported to make work easier.

![Available Commands](https://raw.githubusercontent.com/snehaljha/local-tomcat/main/img/commands.png)

* LT: Verify Tomcat - Will verify the location of tomcat home / catalina home.
* LT: Remove All wars - Will remove all the deployed war from tomcat instance.
* LT: Remove War - Will ask prompt to select the war to be removed.
* LT: Open Log File - Will prompt to open different kinds of latest log file.
* LT: Clear Work Directory - Will clear work directory to remove any cache causing any sort of problem.
* LT: Run Tomcat - Will run the tomcat instance in its configured port if its not already running.
* LT: Stop Tomcat - Will stop the tomcat instance if it is running.
* LT: Run Tomcat in Debug Mode - Will run the tomcat in debug mode in its configured port if its not already running.
* LT: Deploy WAR - Will deploy the war prompting for context name.


## Requirements

* Local installed and working instance of tomcat.
* VSCode version >= 1.66.0

## Extension Settings

The only required configuration are these two keys that can be added in settings.json

![Settings](https://raw.githubusercontent.com/snehaljha/local-tomcat/main/img/settings.png)

* local-tomcat.catalinaHome (required) to be configured to tomcat home / catalina home.
* local-tomcat.warDir (optional) will contain relative path to war directory. Default value is 'target'.

## Known Issues

* Currently only supported for windows.
* Only Single war will be deployed even if target contains multiple.

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Initial release