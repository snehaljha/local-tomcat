import { assert } from "console";
import path = require('path');

export class Deployer {
    warDir: string;
    webappDir: string;
    
    constructor(cwd: string, homeDir: string, warLoc: string) {

        console.log(cwd, homeDir, warLoc);
        if(cwd === '' || warLoc === undefined || warLoc.trim() === '') {
            this.warDir = '';
        } else {
            this.warDir = path.resolve(cwd, warLoc);
        }

        if(homeDir.trim() === '' || homeDir === undefined) {
            this.webappDir = '';
        } else {
            this.webappDir = path.resolve(homeDir, 'webapps'); 
        }
    }
    
    verifyDeployer(): string | undefined {
        if(this.warDir === '') {
            return 'No Folder is opened or invalid war directory location';
        }
        if(this.webappDir === '') {
            return 'Invalid catalina Home';
        }
        
        return undefined;
    }
    
    getTargetWarNames(): Array<string> | undefined {
        try {
            const fs = require('fs');
            let files = fs.readdirSync(this.warDir);
            let warNames = [];
            for(const f of files) {
                if(f.endsWith('.war')) {
                    warNames.push(f.replace('.war', ''));
                }
            }
            return warNames;
        } catch (ex) {
            console.log(ex);
        }
        return undefined;
    }

    deployWar(warName: string, contextName: string | undefined) : boolean {
        try {
            if(!contextName || contextName === '') {
                contextName = warName;
            } else {
                if(!contextName.endsWith('.war')) {
                    contextName += '.war';
                }
            }

            assert(contextName && contextName.trim() !== '.war');

            const fs = require('fs');
            fs.copyFileSync(path.resolve(this.warDir, warName), path.resolve(this.webappDir, contextName));
            return true;
        } catch (ex) {
            console.log(ex);
        }
        return false;
    }

    checkDeployedWar(contextName: string) : boolean {
        if(!contextName.endsWith('.war')) {
            contextName += '.war';
        }

        assert(contextName && contextName.trim() !== '.war');

        const fs = require('fs');
        let files = fs.readdirSync(this.webappDir);
        for(const f of files) {
            if(f === contextName) {
                return true;
            }
        }

        return false;
    }

}
