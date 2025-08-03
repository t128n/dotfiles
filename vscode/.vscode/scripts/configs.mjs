
import { copyFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { cwd } from 'process';
import readline from 'readline';

// Directory where config templates are stored (relative to this script)
const configDir = resolve(cwd(), '.vscode', 'configs');

// Dynamically read available config files from the configDir
function getConfigs() {
    try {
        return readdirSync(configDir)
            .filter((file) => {
                const fullPath = resolve(configDir, file);
                return statSync(fullPath).isFile();
            });
    } catch (err) {
        console.error(`Failed to read configs from ${configDir}:`, err);
        return [];
    }
}

function promptUser(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}


async function main() {
    const configs = getConfigs();
    if (configs.length === 0) {
        console.log(`No config files found in ${configDir}. Exiting.`);
        process.exit(0);
    }
    console.log('Available config files to copy:');
    configs.forEach((cfg, idx) => {
        console.log(`${idx + 1}. ${cfg}`);
    });
    const answer = await promptUser('Enter the number(s) of the config(s) to copy (comma-separated, or "all"): ');
    let selected = [];
    if (answer.trim().toLowerCase() === 'all') {
        selected = configs;
    } else {
        selected = answer.split(',').map((n) => configs[parseInt(n.trim(), 10) - 1]).filter(Boolean);
    }
    if (selected.length === 0) {
        console.log('No valid configs selected. Exiting.');
        process.exit(0);
    }
    for (const cfg of selected) {
        const src = resolve(configDir, cfg);
        let destName = cfg;
        if (cfg === 'biome.jsonc') {
            destName = 'biome.json';
        }
        const dest = resolve(cwd(), destName);
        if (!existsSync(src)) {
            console.warn(`Template for ${cfg} not found at ${src}. Skipping.`);
            continue;
        }
        try {
            copyFileSync(src, dest);
            console.log(`Copied ${cfg} to project root as ${destName}.`);
        } catch (err) {
            console.error(`Failed to copy ${cfg}:`, err);
        }
    }
    console.log('Done.');
}

main();
