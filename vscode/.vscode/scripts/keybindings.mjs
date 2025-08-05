import { copyFileSync, existsSync } from 'fs';
import { cwd } from 'process';
import { resolve } from 'path';


// Path to the source keybindings file (template)
const keybindingsSrc = resolve(cwd(), '.vscode', 'keybindings.json');

// Determine the VS Code user keybindings path based on OS
function getUserKeybindingsPath() {
    const home = process.env.HOME || process.env.USERPROFILE;
    const plat = process.platform;
    if (plat === 'darwin') {
        // macOS
        return resolve(home, 'Library', 'Application Support', 'Code', 'User', 'keybindings.json');
    } else if (plat === 'win32') {
        // Windows
        return resolve(process.env.APPDATA || resolve(home, 'AppData', 'Roaming'), 'Code', 'User', 'keybindings.json');
    } else {
        // Linux and others
        return resolve(home, '.config', 'Code', 'User', 'keybindings.json');
    }
}


function backupExisting(dest) {
    if (existsSync(dest)) {
        const backupPath = dest + '.bak';
        copyFileSync(dest, backupPath);
        console.log(`Backed up existing keybindings to ${backupPath}`);
    }
}


function overwriteKeybindings() {
    if (!existsSync(keybindingsSrc)) {
        console.error(`Source keybindings file not found at ${keybindingsSrc}`);
        process.exit(1);
    }
    const userKeybindingsDest = getUserKeybindingsPath();
    backupExisting(userKeybindingsDest);
    copyFileSync(keybindingsSrc, userKeybindingsDest);
    console.log(`Copied ${keybindingsSrc} to ${userKeybindingsDest}`);
}


function main() {
    console.log('Overwriting VS Code user keybindings...');
    overwriteKeybindings();
    console.log('Done.');
}

main();
