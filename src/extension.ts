// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Deployer } from './util/deployer';
import { Tomcat } from './util/tomcat';
import { TomcatLogs } from './util/tomcat-logs';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "local-tomcat" is now active!');

	function tomcatRun(debugMode = false) {
		if(tomcat.running) {
			vscode.window.showInformationMessage('Tomcat is already running');
			return;
		}
		vscode.commands.executeCommand('local-tomcat.stopTomcat');
		const { spawn } = require("child_process");
		let cmd;
		if(debugMode) {
			cmd = spawn(tomcat.catalinaHome+'\\bin\\catalina.bat', ['jpda', 'run']);
		} else {
			cmd = spawn(tomcat.catalinaHome+'\\bin\\catalina.bat', ['run']);
		}
		tomcat.running = true;
		outputChannel.appendLine('Starting tomcat');
		cmd.stdout.on('data', (data: string) => {
			outputChannel.appendLine(data);
		});
		cmd.stderr.on('data', (data: string) => {
			outputChannel.appendLine(data);
		});
		cmd.on('error', (data: string) => {
			outputChannel.appendLine(`error: ${data}`);
		});
		cmd.on('close', (code: string) => {
			outputChannel.appendLine(`process exited with code ${code}`);
			outputChannel.appendLine('Tomcat stopped');
			tomcat.running = false;
		});
	}
	
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let env = vscode.workspace.getConfiguration('local-tomcat');
	let tomcat = new Tomcat(env.catalinaHome);
	let tomcatLogs = new TomcatLogs(env.catalinaHome);
	const outputChannel = vscode.window.createOutputChannel('Local Tomcat');
	let cwd;
	try {
		if(vscode.workspace.workspaceFolders) {
			cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
		} else {
			cwd = '';
		}
	} catch (ex) {
		console.log(ex);
		cwd = '';
	}
	let deployer = new Deployer(cwd, env.catalinaHome, env.warDir);

	let disposable = vscode.commands.registerCommand('local-tomcat.verifyTomcat', () => {
		console.log('using ' + tomcat.catalinaHome + ' as catalina Home');
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
		let status = tomcat.verifyHome();
		if(status) {
			vscode.window.showInformationMessage('valid tomcat directory');
		} else {
			vscode.window.showErrorMessage('catalina home is invalid');
		}
	});

	let removeAllWARs = vscode.commands.registerCommand('local-tomcat.removeAllWARs', () => {
		let status = tomcat.removeAllWars();
		if(status) {
			vscode.window.showInformationMessage('Removed All wars');
		} else {
			vscode.window.showErrorMessage('Failed to remove wars');
		}
	});

	let removeWar = vscode.commands.registerCommand('local-tomcat.removeWAR', async () => {
		let deployedWars = tomcat.getDeployedWars();
		let selectedWars = await vscode.window.showQuickPick(deployedWars, {canPickMany: true});
		console.log('selected wars ', selectedWars);
		let status = tomcat.removeWars(selectedWars);
		if(status) {
			vscode.window.showInformationMessage('Removed war(s)');
		} else if(status === false) {
			vscode.window.showErrorMessage('Failed to remove war(s)');
		}
	});

	let openLogFile = vscode.commands.registerCommand('local-tomcat.openLogFile', async () => {
		const options = tomcatLogs.getFilePatterns();
		const selectedLogFile = await vscode.window.showQuickPick(options);
		const filePath = tomcatLogs.getLogFilePath(selectedLogFile+'.');

		var openPath = vscode.Uri.parse("file:///" + filePath); //A request file path
		vscode.workspace.openTextDocument(openPath).then(doc => {
			vscode.window.showTextDocument(doc);
		});
	});

	let clearWorkDir = vscode.commands.registerCommand('local-tomcat.clearWorkDir', () => {
		const status = tomcat.clearWork();
		if(status) {
			vscode.window.showInformationMessage('Work Directory cleared');
		} else {
			vscode.window.showErrorMessage('Failed to clear work directory');
		}
	});

	let runTomcat = vscode.commands.registerCommand('local-tomcat.runTomcat', async () => {
		tomcatRun();
	});

	let stopTomcat = vscode.commands.registerCommand('local-tomcat.stopTomcat', () => {
		const { spawn } = require("child_process");
		spawn(tomcat.catalinaHome+'\\bin\\catalina.bat', ["stop"]);
		tomcat.running = false;
	});

	let runTomcatDebug = vscode.commands.registerCommand('local-tomcat.runTomcatDebug', () => {
		tomcatRun(true);
	});

	let deployWar = vscode.commands.registerCommand('local-tomcat.deployWar', async () => {
		const validity = deployer.verifyDeployer();
		if(validity) {
			vscode.window.showErrorMessage(validity);
			return;
		}
		let targetappName = deployer.getTargetWarName();
		if(!targetappName) {
			vscode.window.showErrorMessage('No war Available');
			return;
		}
		let contextName = await vscode.window.showInputBox({prompt: 'App Context Name', placeHolder: 'Leave empty for default name'});
		const warPresent = deployer.checkDeployedWar(contextName);
		if(warPresent) {
			const options = ['Replace', 'Cancel'];
			const choice = await vscode.window.showQuickPick(options);
			if(choice !== options[0]) {
				return;
			}
			tomcat.removeWars([contextName+'.war']);
		}
		const status = deployer.deployWar(contextName);
		if(!status) {
			vscode.window.showErrorMessage('Deployement of war failed');
			return;
		}

		vscode.window.showInformationMessage('Moved war package');

		if(!tomcat.running) {
			const options = ['Run tomcat', 'Run tomcat in debug mode'];
			const choice = await vscode.window.showQuickPick(options);
			if(choice === options[0]) {
				tomcatRun();
			} else if(choice === options[1]){
				tomcatRun(true);
			}
		}
	});

	context.subscriptions.push(disposable, removeAllWARs, removeWar, openLogFile, clearWorkDir, runTomcat, stopTomcat,
		runTomcatDebug, deployWar);
}

// this method is called when your extension is deactivated
export function deactivate() {}