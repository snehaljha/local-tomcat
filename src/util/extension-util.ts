import { commands, window, workspace, StatusBarItem, StatusBarAlignment } from 'vscode';
import { Tomcat } from './tomcat';
import { spawn } from "child_process";
import path = require('path');
import os = require('os');

const INVALID_FIELDS_IN_INSTANCE_CONFIG = 'No Valid instance entries were found in configuration. Check name and catalinaHome fields again.';
const NO_INSTANCE_CONFIGURED = 'No Tomcat instances are configured. Configure one as per https://marketplace.visualstudio.com/items?itemName=SnehalJha.local-tomcat#extesion-settings';
const SINGLE_INSTANCE_CONFIGURED = 'Only Single Tomcat instances are configured. Configure one as per https://marketplace.visualstudio.com/items?itemName=SnehalJha.local-tomcat#extesion-settings';
const OLD_CONFIGURED_INSTANCE = 'Looks like you\'ve configured the catalina home the older way. From v1.0.0 with the support of multiple instances it can be configured as https://marketplace.visualstudio.com/items?itemName=SnehalJha.local-tomcat#extesion-settings';
const CHANGED_TOMCAT_INSTANCE_TO = 'Changed Tomcat instance to ';
const STATUS_BAR_SELECTOR_PREFIX = 'LT: ';

export class ExtensionUtil {

    env;
    tomcatInstances: Array<Tomcat>;
    cwd;
    filePathPrefix;
    catalinaScript;
    selectedInstance;
    statusBarSelector: StatusBarItem;

    constructor() {
        this.env = workspace.getConfiguration('local-tomcat');
        try {
            if(workspace.workspaceFolders) {
                this.cwd = workspace.workspaceFolders[0].uri.fsPath;
            } else {
                this.cwd = '';
            }
        } catch (ex) {
            console.log(ex);
            this.cwd = '';
        }
        this.tomcatInstances = this.initTomcatInstances();
        this.selectedInstance = this.tomcatInstances.length === 0 ? undefined : 0;
        this.filePathPrefix = os.type() === 'Windows_NT' ? 'file:///' : '';
        this.catalinaScript = os.type() === 'Windows_NT' ? 'catalina.bat' : 'catalina.sh';
        this.statusBarSelector = window.createStatusBarItem(StatusBarAlignment.Right);
        this.statusBarSelector.command = 'local-tomcat.changeSelectedTomcat';
        this.statusBarSelector.hide();
        this.statusBarSelector.tooltip = 'Change Tomcat Instance';
        if(this.selectedInstance !== undefined) {
            this.statusBarSelector.text = STATUS_BAR_SELECTOR_PREFIX + this.tomcatInstances[this.selectedInstance].name;
            this.statusBarSelector.show();
        }
    }



    initTomcatInstances = () : Array<Tomcat> => {
        if(!this.validateExtensionSettings()) {
            return [];
        }

        const instancesDetails = this.env.tomcatInstances;
        let tomcats : Array<Tomcat> = [];
        for(let instanceDetails of instancesDetails) {
            if(instanceDetails.name === undefined || instanceDetails.name === null || instanceDetails.name.trim() === '') {
                continue;
            }
            if(instanceDetails.catalinaHome === undefined || instanceDetails.catalinaHome === null || instanceDetails.catalinaHome.trim() === '') {
                continue;
            }

            tomcats.push(new Tomcat(instanceDetails.name, instanceDetails.catalinaHome, instanceDetails.deploymentPort, this.cwd, this.env.warDir));
        }

        if(tomcats.length === 0) {
            window.showErrorMessage(INVALID_FIELDS_IN_INSTANCE_CONFIG);
            return [];
        }

        return tomcats;
    };

    validateExtensionSettings = () => {
        if(this.env.tomcatInstances === undefined || this.env.tomcatInstances === null) {
            if(this.env.catalinaHome === undefined || this.env.catalinaHome === null) {
                this.showNoTomcatDialog();
                return false;
            }
            window.showErrorMessage(OLD_CONFIGURED_INSTANCE);
            return false;
        }

        return true;
    };

    changeTomcat = async () => {
        if(this.tomcatInstances.length === 0) {
            this.showNoTomcatDialog();
            return;
        }

        if(this.tomcatInstances.length === 1) {
            window.showInformationMessage(SINGLE_INSTANCE_CONFIGURED);
            return;
        }

        let selectedName = await window.showQuickPick(this.tomcatInstances.map(i => i.name));

        if(selectedName === undefined) {
            return;
        }

        for(let i=0; i<this.tomcatInstances.length; i++) {
            if(this.tomcatInstances[i].name === selectedName) {
                this.selectedInstance = i;
                break;
            }
        }

        this.statusBarSelector.text = STATUS_BAR_SELECTOR_PREFIX + selectedName;
        this.statusBarSelector.show();
        window.showInformationMessage(CHANGED_TOMCAT_INSTANCE_TO + this.tomcatInstances[this.selectedInstance!].name);
    };

    tomcatRun = (debugMode = false) => {
        if(this.selectedInstance === undefined) {
            this.showNoTomcatDialog();
            return;
        }
        const tomcat = this.tomcatInstances[this.selectedInstance];
        if(tomcat.running) {
            window.showInformationMessage('Tomcat is already running');
            return;
        }
        commands.executeCommand('local-tomcat.stopTomcat');
        let cmd;
        if(debugMode) {
            cmd = spawn(path.resolve(tomcat.catalinaHome, 'bin', this.catalinaScript), ['jpda', 'run']);
        } else {
            cmd = spawn(path.resolve(tomcat.catalinaHome, 'bin', this.catalinaScript), ['run']);
        }
        tomcat.running = true;
        tomcat.getOutputChannel().appendLine('Starting tomcat');
        cmd.stdout.on('data', (data: string) => {
            tomcat.getOutputChannel().appendLine(data);
        });
        cmd.stderr.on('data', (data: string) => {
            tomcat.getOutputChannel().appendLine(data);
        });
        cmd.on('error', (data: string) => {
            tomcat.getOutputChannel().appendLine(`error: ${data}`);
        });
        cmd.on('close', (code: string) => {
            tomcat.getOutputChannel().appendLine(`process exited with code ${code}`);
            tomcat.getOutputChannel().appendLine('Tomcat stopped');
            tomcat.running = false;
        });
    };

    deploySingleWar = async (tomcat: Tomcat, targetAppName: string, ctxtName: string | undefined = undefined) : Promise<boolean> => {

        let contextName: string | undefined;
        if(ctxtName === undefined) {
            contextName = await window.showInputBox({prompt: 'App Context Name', placeHolder: 'Leave empty for default name'});
        } else {
            contextName = ctxtName;
        }
        contextName = !contextName || contextName === '' ? targetAppName : contextName;
        const warPresent = tomcat.deployer.checkDeployedWar(contextName);
        if(warPresent) {
            const options = ['Replace', 'Cancel'];
            const choice = await window.showQuickPick(options);
            if(choice !== options[0]) {
                return false;
            }
            tomcat.removeWars([contextName+'.war']);
        }
        const status = tomcat.deployer.deployWar(targetAppName+'.war', contextName);
        if(!status) {
            window.showErrorMessage('Deployement of war failed');
        }
        return status;
    };

    deployMultipleWars = async (tomcat: Tomcat, targetAppNames: Array<string>) : Promise<boolean> => {

        let overallStatus = false;

        let selectedWars = await window.showQuickPick(targetAppNames, {canPickMany: true});
        if(!selectedWars) {
            selectedWars = [];
        }
        let contextSet: Array<string> = [];
        for(const selectedWar of selectedWars) {
            let error = false;
            let contextName: string | undefined;
            while(true) {
                contextName = await window.showInputBox({prompt: (error ? 'Name already chosen for ' : 'App Context Name for ') + selectedWar, placeHolder: 'Leave empty for default name'});
                error = true;
                if(!contextName || contextName === '') {
                    contextName = selectedWar;
                }
                if(!contextSet.includes(contextName)) {
                    break;
                }
            }
            contextSet.push(contextName);

            overallStatus = await this.deploySingleWar(tomcat, selectedWar, contextName);
        }

        return overallStatus;
    };

    disposeOutputChannels = () => {
		for(let tomcatInstance of this.tomcatInstances) {
            tomcatInstance.disposeOutputChannel();
        }
	};

    showNoTomcatDialog = () => {
        window.showErrorMessage(NO_INSTANCE_CONFIGURED);
    };

    stopTomcats = () => {
        if(this.tomcatInstances === undefined) {
            return;
        }

        for(let instance of this.tomcatInstances) {
            if(instance.running) {
                spawn(path.resolve(instance.catalinaHome, 'bin', this.catalinaScript), ["stop"]);
            }
        }
	};

}