import path = require('path');

export class TomcatLogs {
    private logPath: string;

    constructor(logPath: string| undefined) {
        if(logPath) {
            this.logPath = path.resolve(logPath, 'logs');
        } else {
            this.logPath = '';
        }
    }

    getLogFilePath(pattern: string) {
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

    getFilePatterns(): string[] {
        return ['catalina', 'localhost', 'localhost_access_log', 'manager', 'host-manager'];
    }
}