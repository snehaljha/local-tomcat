export class Tomcat {
    catalinaHome: string;
    private bin: string;
    running: boolean;
    webapps: string;
    private path = require('path');
    
    constructor(homeDir: string|undefined) {
        if(homeDir) {
            this.catalinaHome = homeDir as string;
        } else {
            this.catalinaHome = '';
        }
        this.bin = 'bin';
        this.webapps = 'webapps';
        this.running = false;
        
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
            
            files = fs.readdirSync(this.path.resolve(this.catalinaHome, this.bin));
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
            const files = fs.readdirSync(this.path.resolve(this.catalinaHome, this.webapps));
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
        const files = fs.readdirSync(this.path.resolve(this.catalinaHome, this.webapps));
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
            return undefined;
        }

        try {
            const fs = require('fs');
            const files = fs.readdirSync(this.path.resolve(this.catalinaHome, this.webapps));
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
                fs.unlinkSync(this.path.resolve(this.catalinaHome, this.webapps, f));
                console.log('deleted ' + f);
            }
            
            if(!this.running) {
                for(const f of deployedDirs) {
                    console.log('deleing ' + f);
                    fs.rmSync(this.path.resolve(this.catalinaHome, this.webapps, f), {recursive:true, force:true});
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
            const location = this.path.resolve(this.catalinaHome, 'work', 'Catalina', 'localhost');
            const fs = require('fs');
            const files = fs.readdirSync(location);
            for(const f of files) {
                fs.rmSync(this.path.resolve(location, f), {recursive:true, force:true});
            }
            return true;
        } catch(ex) {
            console.error(ex);
        }

        return false;
    }
}