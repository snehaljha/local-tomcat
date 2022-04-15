import { assert } from "console";

export class Deployer {
    warDir: string;
    webappDir: string;
    
    constructor(cwd: string, homeDir: string, warLoc: string) {
        if(cwd === '' || warLoc.trim() === '' || warLoc === undefined) {
            this.warDir = '';
        } else {
            this.warDir = cwd + '\\' + warLoc;
        }

        if(homeDir.trim() === '' || homeDir === undefined) {
            this.webappDir = '';
        } else {
            this.webappDir = homeDir + '\\webapps'; 
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
    
    getTargetWarName(): string | undefined {
        try {
            const fs = require('fs');
            let files = fs.readdirSync(this.warDir);
            let warName = undefined;
            for(const f of files) {
                if(f.endsWith('.war')) {
                    warName = f;
                    break;
                }
            }
            if(!warName) {
                return undefined;
            }
            return warName.replace('.war', '');
        } catch (ex) {
            console.log(ex);
        }
        return undefined;
    }

    deployWar(contextName: string | undefined) : boolean {
        try {
            let name = this.getTargetWarName();
            if(!contextName || contextName === '') {
                if(!name) {
                    name = '';
                }
                contextName = name + '.war';
            } else {
                if(!contextName.endsWith('.war')) {
                    contextName += '.war';
                }
            }

            assert(contextName && contextName.trim() !== '.war');

            const fs = require('fs');
            fs.copyFileSync(this.warDir+'\\'+name+'.war', this.webappDir+'\\'+contextName);
            return true;
        } catch (ex) {
            console.log(ex);
        }
        return false;
    }

    checkDeployedWar(contextName: string | undefined) : boolean {
        if(!contextName || contextName === '') {
            let name = this.getTargetWarName();
            if(!name) {
                name = '';
            }
            contextName = name + '.war';
        } else {
            if(!contextName.endsWith('.war')) {
                contextName += '.war';
            }
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