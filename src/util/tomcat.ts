import { OutputChannel, window } from "vscode";
import { Deployer } from "./deployer";
import { TomcatLogs } from "./tomcat-logs";

import path = require('path');

export class Tomcat {
    name: string;
    catalinaHome: string;
    deploymentPort: number;
    private bin: string;
    running: boolean;
    webapps: string;
    tomcatLogs: TomcatLogs;
    private outputChannel: OutputChannel | undefined;
    deployer: Deployer;
    
    constructor(name: string, homeDir: string, deploymentPort: number, cwd: string, warDir: string, customLogs: LogLocation[]) {
        this.catalinaHome = homeDir;
        this.name = name;
        this.deploymentPort = deploymentPort;
        this.bin = 'bin';
        this.webapps = 'webapps';
        this.running = false;
        this.tomcatLogs = new TomcatLogs(this.catalinaHome, customLogs);
        this.outputChannel = undefined;
        this.deployer = new Deployer(cwd, this.catalinaHome, warDir);
    }
    
    verifyHome(): boolean {
        if(this.catalinaHome.trim() === '') {
            return false;
        }
        try {
            const fs = require('fs');
            let files = fs.readdirSync(this.catalinaHome);
            let checkFiles = ['conf', 'logs', 'webapps'];
            let set = new Set<string>();
            let score = 0;
            for(const file of files) {
                set.add(file);
            }
            
            for(const f of checkFiles) {
                if(!set.has(f)) {
                    return false;
                }
            }
            
            files = fs.readdirSync(path.resolve(this.catalinaHome, this.bin));
            checkFiles = ['catalina.bat', 'catalina.sh', 'shutdown.bat', 'shutdown.sh'];
            set = new Set<string>();
            for(const f of files) {
                set.add(f);
            }
            
            for(const f of checkFiles) {
                if(!set.has(f)) {
                    return false;
                }
            }
            return true;
        } catch (ex) {
            console.error(ex);
        }
        return false;
    }
    
    removeAllWars(): boolean {
        try {
            const fs = require('fs');
            const files = fs.readdirSync(path.resolve(this.catalinaHome, this.webapps));
            const warFiles = [];
            for(const f of files) {
                if(f.endsWith('.war')) {
                    warFiles.push(f);
                }
            }

            let res =  this.removeWars(warFiles);
            if(res === false) {
                return false;
            }
            return true;
        } catch(ex) {
            console.error(ex);
        }
        return false;
    }
    
    getDeployedWars(): Array<string> {
        const fs = require('fs');
        const files = fs.readdirSync(path.resolve(this.catalinaHome, this.webapps));
        const wars = [];
        for(const f of files) {
            if(f.endsWith('.war')) {
                wars.push(f);
            }
        }
        
        return wars;
    }

    removeWars(selectedWars: string[] | undefined): boolean | undefined {
        if(!selectedWars) {
            return true;
        }

        try {
            const fs = require('fs');
            const files = fs.readdirSync(path.resolve(this.catalinaHome, this.webapps));
            const deployedDirs = [];
            const fileSet = new Set<string>();
            for(const f of files) {
                fileSet.add(f);
            }

            for(const f of selectedWars) {
                if(fileSet.has(f.replace('.war', ''))) {
                    deployedDirs.push(f.replace('.war', ''));
                }
                console.log('deleing ' + f);
                fs.unlinkSync(path.resolve(this.catalinaHome, this.webapps, f));
                console.log('deleted ' + f);
            }
            
            if(!this.running) {
                for(const f of deployedDirs) {
                    console.log('deleing ' + f);
                    fs.rmSync(path.resolve(this.catalinaHome, this.webapps, f), {recursive:true, force:true});
                    console.log('deleted ' + f);
                }
            }
            return true;
        } catch(ex) {
            console.error(ex);
        }
        return false;
    }

    clearWork(): boolean {
        try{
            const location = path.resolve(this.catalinaHome, 'work', 'Catalina', 'localhost');
            const fs = require('fs');
            const files = fs.readdirSync(location);
            for(const f of files) {
                fs.rmSync(path.resolve(location, f), {recursive:true, force:true});
            }
            return true;
        } catch(ex) {
            console.error(ex);
        }

        return false;
    }

    getDeployedApps(): Array<string> {
        const fs = require('fs');
        const files = fs.readdirSync(path.resolve(this.catalinaHome, this.webapps));
        const apps = [];
        for(const f of files) {
            if(f.endsWith('.war') && files.includes(f.replace('.war', ''))) {
                apps.push(f.replace('.war', ''));
            }
        }
        return apps;
    }

    getOutputChannel(): OutputChannel {
        if(this.outputChannel === undefined) {
            this.outputChannel = window.createOutputChannel(`LT - ${this.name}`);
        }
        return this.outputChannel;
    }

    disposeOutputChannel() {
        if(this.outputChannel === undefined) {
            return;
        }
        this.outputChannel.clear();
        this.outputChannel.hide();
        this.outputChannel.dispose();
    }
}