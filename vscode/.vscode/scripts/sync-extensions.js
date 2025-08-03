import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { cwd } from "process";

console.log("Starting VS Code extensions sync script...");
console.log(`Current working directory: ${cwd()}`);

// --- Configuration ---
const extensionsJsonPath = resolve(cwd(), ".vscode", "extensions.json");

console.log(`Using extensions configuration file: ${extensionsJsonPath}`);

/**
 * A simple JSONC parser. Reads a file, strips comments, and parses it.
 * @param {string} filePath - The path to the JSONC file.
 * @returns {object} The parsed JSON object.
 */
function parseJsonc(filePath) {
    try {
        const content = readFileSync(filePath, "utf8");
        // Remove block comments /* ... */ and then line comments // ...
        const withoutComments = content
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/(^|[^:])\/\/.*$/gm, "$1");
        return JSON.parse(withoutComments);
    } catch (error) {
        console.error(`Error reading or parsing ${filePath}:`, error);
        process.exit(1);
    }
}

/**
 * Executes a command and inherits stdio, so output is shown in real-time.
 * @param {string} command - The command to execute.
 */
function runCommand(command) {
    try {
        execSync(command, { stdio: "inherit" });
    } catch (error) {
        // The `code` command might fail if an extension is already installed/uninstalled.
        // We log it but don't exit, allowing the script to continue.
        console.warn(`Warning: Command "${command}" may have failed. Continuing...`);
    }
}

/**
 * Installs all extensions listed in the 'recommendations' array.
 */
function installRecommended() {
    console.log("Installing recommended extensions...");
    const { recommendations = [] } = parseJsonc(extensionsJsonPath);

    if (recommendations.length === 0) {
        console.log("No recommended extensions to install.");
        return;
    }

    for (const ext of recommendations) {
        runCommand(`code --install-extension ${ext}`);
    }
    console.log("Finished installing extensions.");
}

/**
 * Uninstalls any extensions that are not in the 'recommendations' list.
 */
function pruneUnrecommended() {
    console.log("Pruning unrecommended extensions...");
    const { recommendations = [] } = parseJsonc(extensionsJsonPath);
    const recommendedSet = new Set(recommendations);

    let installedStr = "";
    try {
        // Get the list of currently installed extensions
        installedStr = execSync("code --list-extensions").toString();
    } catch (error) {
        console.error("Error fetching installed extensions list.", error);
        return; // Can't proceed without the list
    }

    const installed = installedStr.split("\n").filter(Boolean); // Filter out empty lines

    const toPrune = installed.filter((ext) => !recommendedSet.has(ext));

    if (toPrune.length === 0) {
        console.log("No unrecommended extensions to prune.");
        return;
    }

    console.log("Found the following extensions to uninstall:");
    toPrune.forEach((ext) => console.log(`- ${ext}`));

    for (const ext of toPrune) {
        runCommand(`code --uninstall-extension ${ext}`);
    }
    console.log("Finished pruning extensions.");
}

// --- Main Execution ---
const command = process.argv[2]; // Expect 'install' or 'prune'

switch (command) {
    case "install":
        installRecommended();
        break;
    case "prune":
        pruneUnrecommended();
        break;
    default:
        console.error("Unknown command. Please use 'install' or 'prune'.");
        process.exit(1);
}
