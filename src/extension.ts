// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, env, ExtensionContext, Uri, window, workspace } from 'vscode';
import { spawn } from 'child_process';
import path = require('path');
import { ExtensionUtil } from './util/extension-util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
let extensionUtil: ExtensionUtil;
export function activate(context: ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	extensionUtil = new ExtensionUtil();

	const verifyTomcat = commands.registerCommand('local-tomcat.verifyTomcat', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		console.log('using ' + tomcat.catalinaHome + ' as catalina Home');
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
		let status = tomcat.verifyHome();
		if(status) {
			window.showInformationMessage('valid tomcat directory');
		} else {
			window.showErrorMessage('catalina home is invalid');
		}
	});

	const removeAllWARs = commands.registerCommand('local-tomcat.removeAllWARs', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		let status = tomcat.removeAllWars();
		if(status) {
			window.showInformationMessage('Removed All wars');
		} else {
			window.showErrorMessage('Failed to remove wars');
		}
	});

	const removeWar = commands.registerCommand('local-tomcat.removeWAR', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		let deployedWars = tomcat.getDeployedWars();
		let selectedWars = await window.showQuickPick(deployedWars, {canPickMany: true});
		console.log('selected wars ', selectedWars);
		let status = tomcat.removeWars(selectedWars);
		if(status) {
			window.showInformationMessage('Removed war(s)');
		} else if(status === false) {
			window.showErrorMessage('Failed to remove war(s)');
		}
	});

	const openLogFile = commands.registerCommand('local-tomcat.openLogFile', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		const options = tomcat.tomcatLogs.getFileNames();
		const selectedLogFile = await window.showQuickPick(options);
		const filePath = tomcat.tomcatLogs.getLogFilePath(selectedLogFile);

		var openPath = Uri.parse(extensionUtil.filePathPrefix + filePath); //A request file path
		workspace.openTextDocument(openPath).then(doc => {
			window.showTextDocument(doc);
		});
	});

	const clearWorkDir = commands.registerCommand('local-tomcat.clearWorkDir', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		const status = tomcat.clearWork();
		if(status) {
			window.showInformationMessage('Work Directory cleared');
		} else {
			window.showErrorMessage('Failed to clear work directory');
		}
	});

	const runTomcat = commands.registerCommand('local-tomcat.runTomcat', extensionUtil.tomcatRun);

	const stopTomcat = commands.registerCommand('local-tomcat.stopTomcat', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		spawn(extensionUtil.catalinaScript, ["stop"], {shell: true, cwd: path.resolve(tomcat.catalinaHome, 'bin')});
		tomcat.running = false;
	});

	const runTomcatDebug = commands.registerCommand('local-tomcat.runTomcatDebug', () => extensionUtil.tomcatRun(true));

	const deployWar = commands.registerCommand('local-tomcat.deployWar', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];

		const validity = tomcat.deployer.verifyDeployer();
		if(validity) {
			window.showErrorMessage(validity);
			return;
		}
		let targetappNames = tomcat.deployer.getTargetWarNames();
		if(!targetappNames || targetappNames?.length === 0) {
			window.showErrorMessage('No war Available');
			return;
		}

		let status = false;
		if(targetappNames.length > 1) {
			status = await extensionUtil.deployMultipleWars(tomcat, targetappNames);
		} else {
			status = await extensionUtil.deploySingleWar(tomcat, targetappNames[0]);
		}

		if(!status) {
			return;
		}


		window.showInformationMessage('Moved war package(s)');

		if(!tomcat.running) {
			const options = ['Run tomcat', 'Run tomcat in debug mode'];
			const choice = await window.showQuickPick(options);
			if(choice === options[0]) {
				extensionUtil.tomcatRun();
			} else if(choice === options[1]){
				extensionUtil.tomcatRun(true);
			} else {
				return;
			}
			tomcat.running = true;
		}
	});

	const launchWebapp = commands.registerCommand('local-tomcat.launchWebapp', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		if(!tomcat.running) {
			window.showInformationMessage('Tomcat is not running');
			return;
		}
		let deployedApps = tomcat.getDeployedApps();
		const choice = await window.showQuickPick(deployedApps);

		if(!choice) {
			return;
		}

		env.openExternal(Uri.parse('http://localhost:' + tomcat.deploymentPort + '/' + choice));

	});

	const openDeployedDir = commands.registerCommand('local-tomcat.openDeployedDir', async () => {
		if(extensionUtil.selectedInstance === undefined) {
			extensionUtil.showNoTomcatDialog();
			return;
		}
		const tomcat = extensionUtil.tomcatInstances[extensionUtil.selectedInstance];
		let deployedApps = tomcat.getDeployedApps();
		let choice = await window.showQuickPick(deployedApps);
		if(choice === undefined) {
			return;
		}
		commands.executeCommand("vscode.openFolder", Uri.file(path.resolve(tomcat.catalinaHome, tomcat.webapps, choice)), true);

	});

	const changeSelectedTomcat = commands.registerCommand('local-tomcat.changeSelectedTomcat', extensionUtil.changeTomcat);

	context.subscriptions.push(verifyTomcat, removeAllWARs, removeWar, openLogFile, clearWorkDir, runTomcat, stopTomcat,
		runTomcatDebug, deployWar, launchWebapp, openDeployedDir, changeSelectedTomcat, extensionUtil.statusBarSelector);
}

// this method is called when your extension is deactivated
export async function deactivate() {
	extensionUtil.disposeOutputChannels();
	extensionUtil.stopTomcats();
}
