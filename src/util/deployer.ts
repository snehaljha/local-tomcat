import { assert } from "console";

export class Deployer {
    warDir: string;
    webappDir: string;
    private path = require('path');
    
    constructor(cwd: string, homeDir: string, warLoc: string) {
        if(cwd === '' || warLoc.trim() === '' || warLoc === undefined) {
            this.warDir = '';
        } else {
            this.warDir = this.path.resolve(cwd, warLoc);
        }

        if(homeDir.trim() === '' || homeDir === undefined) {
            this.webappDir = '';
        } else {
            this.webappDir = this.path.resolve(homeDir, 'webapps'); 
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
            fs.copyFileSync(this.path.resolve(this.warDir, warName), this.path.resolve(this.webappDir, contextName));
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
