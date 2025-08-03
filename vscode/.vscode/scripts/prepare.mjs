import { execSync } from "child_process";
import { platform as currentPlatform, exit } from "process";

// --- Configuration ---
// Define the packages to be installed.
// For each package, specify the identifier for each platform's package manager.
// - macos: Homebrew formula name
// - windows: Winget package ID
// - linux: APT package name
const CONFIG = {
  node: {
    windows: "NodeJS.NodeJS",
    macos: "node",
    linux: "nodejs",
  },
  git: {
    windows: "Git.Git",
    macos: "git",
    linux: "git",
  },
  just: {
    macos: "just",
    windows: "Casey.Just"
  }
};

// --- Script ---

/**
 * Executes a command and inherits stdio for real-time output.
 * @param {string} command - The command to execute.
 * @param {string} [errorMessage] - A custom error message on failure.
 */
function runCommand(command, errorMessage) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(errorMessage || `Failed to execute: "${command}"`);
    exit(1);
  }
}

/**
 * Determines the current operating system.
 * @returns {'macos' | 'windows' | 'linux' | 'unsupported'}
 */
function getPlatform() {
  switch (currentPlatform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return "unsupported";
  }
}

/**
 * Checks if the required package manager for the current OS is installed.
 * @param {string} platform - The current platform name.
 */
function checkPrerequisites(platform) {
  console.log(`Platform detected: ${platform}. Checking prerequisites...`);
  const checks = {
    macos: { tool: "Homebrew", command: "command -v brew" },
    windows: { tool: "Winget", command: "winget --version" },
    linux: { tool: "APT", command: "command -v apt" },
  };

  const check = checks[platform];
  if (!check) return; // Unsupported platforms are handled in main

  try {
    execSync(check.command, { stdio: "ignore" });
    console.log(`✅ ${check.tool} is installed.`);
  } catch (error) {
    console.error(`❌ ${check.tool} is not found. Please install it to continue.`);
    exit(1);
  }
}

/**
 * Installs packages based on the OS and configuration.
 * @param {string} platform - The current platform name.
 */
function installPackages(platform) {
  const packagesByManager = {
    brew: [],
    winget: [],
    apt: [],
  };

  const managerMap = {
    macos: "brew",
    windows: "winget",
    linux: "apt",
  };

  const manager = managerMap[platform];
  if (!manager) return;

  for (const pkg of Object.values(CONFIG)) {
    if (pkg[platform]) {
      packagesByManager[manager].push(pkg[platform]);
    }
  }

  for (const [mgr, packages] of Object.entries(packagesByManager)) {
    if (packages.length === 0) continue;

    console.log(`\nInstalling ${packages.length} packages via ${mgr}...`);
    packages.forEach((pkg) => console.log(`- ${pkg}`));

    const command = {
      brew: `brew install ${packages.join(" ")}`,
      winget: `winget install --accept-package-agreements --accept-source-agreements -e --id ${packages.join(" --id ")}`,
      apt: `sudo apt-get install -y ${packages.join(" ")}`,
    }[mgr];

    runCommand(command);
    console.log(`\n✅ Successfully installed packages with ${mgr}.`);
  }
}

/**
 * Main execution function.
 */
function main() {
  const command = process.argv[2];
  const platform = getPlatform();

  if (platform === "unsupported") {
    console.error(`Your platform "${currentPlatform}" is not supported.`);
    exit(1);
  }

  switch (command) {
    case "check":
      checkPrerequisites(platform);
      break;
    case "install":
      checkPrerequisites(platform);
      installPackages(platform);
      break;
    default:
      console.error("Usage:");
      console.error("  node prepare.mjs check    # Check for required tools");
      console.error("  node prepare.mjs install  # Install all configured packages");
      exit(1);
  }

  console.log("\nEnvironment preparation complete.");
}

main();
