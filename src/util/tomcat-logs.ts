import path = require('path');

export class TomcatLogs {
    private logPath: string;
    private defaultPatterns = ['catalina', 'localhost', 'localhost_access_log', 'manager', 'host-manager'];

    constructor(logPath: string| undefined, private customLogLocations: LogLocation[]) {
        if(logPath) {
            this.logPath = path.resolve(logPath, 'logs');
        } else {
            this.logPath = '';
        }
    }

    getDefaultLogFilePath(pattern: string) {
        const fs = require('fs');
        let files = fs.readdirSync(this.logPath);
        let rfiles = [];
        for(const f of files) {
            if(f.startsWith(pattern)) {
                rfiles.push(f);
            }
        }
        if(rfiles.length === 0) {
            return '';
        }
        rfiles = rfiles.sort();
        return path.resolve(this.logPath, rfiles[rfiles.length-1]);
    }

    getLogFilePath(name: string|undefined) {
        if(!name) {
            return;
        }

        if(this.defaultPatterns.includes(name)) {
            return this.getDefaultLogFilePath(name+'.');
        }

        return this.customLogLocations.find(i => i.name === name)?.path;
    }

    getFileNames(): string[] {
        return [...this.defaultPatterns, ...this.customLogLocations.map(i => i.name)];
    }
}