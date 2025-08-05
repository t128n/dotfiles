import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

const customBindings = [
  // Toggle terminal visibility
  {
    key: "cmdCtrl+t",
    command: "workbench.action.terminal.toggleTerminal",
    description: "Toggle terminal visibility",
  },
  // Open Extensions view
  {
    key: "cmdCtrl+alt+e",
    command: "workbench.view.extensions",
    description: "Open Extensions view",
  },
  // Open Source Control (Git) view
  {
    key: "cmdCtrl+g",
    command: "workbench.view.scm",
    description: "Open Source Control (Git) view",
  },
  // Open Explorer (Files) view
  {
    key: "cmdCtrl+e",
    command: "workbench.view.explorer",
    description: "Open Explorer (Files) view",
  },
  // Select current line when in a text editor
  {
    key: "cmdCtrl+l",
    command: "expandLineSelection",
    when: "textInputFocus",
    description: "Select current line when in a text editor",
  },
  // Toggle auxiliary bar (e.g., chat, Copilot)
  {
    key: "cmdCtrl+y",
    command: "workbench.action.toggleAuxiliaryBar",
    description: "Toggle auxiliary bar (e.g., chat, Copilot)",
  },
  // Copy current line with syntax highlighting, then select the line
  {
    key: "cmdCtrl+shift+c",
    command: "runCommands",
    when: "editorTextFocus",
    args: {
      commands: [
        "editor.action.clipboardCopyWithSyntaxHighlightingAction",
        "expandLineSelection",
      ],
    },
    description:
      "Copy current line with syntax highlighting, then select the line",
  },
  // Cut current line when in a text editor
  {
    key: "cmdCtrl+k",
    command: "editor.action.clipboardCutAction",
    when: "textInputFocus",
    description: "Cut current line when in a text editor",
  },
];

// --- Script Logic ---
const keybindingsOutputFileName = '.vscode/keybindings.json';
const cheatSheetOutputFileName = '.vscode/keybindings.md';
const keybindingsOutputPath = path.resolve(cwd(), keybindingsOutputFileName);
const cheatSheetOutputPath = path.resolve(cwd(), cheatSheetOutputFileName);

// Function to process keybindings and expand 'cmdCtrl'
function processKeybindings(bindings) {
  const processed = [];
  for (const binding of bindings) {
    if (binding.key.includes('cmdCtrl')) {
      // Create a binding for macOS (using 'cmd')
      processed.push({
        ...binding,
        key: binding.key.replace('cmdCtrl', 'cmd'),
        when: `${binding.when ? `${binding.when} && ` : ''}isMac`,
      });
      // Create a binding for Windows/Linux (using 'ctrl')
      processed.push({
        ...binding,
        key: binding.key.replace('cmdCtrl', 'ctrl'),
        when: `${binding.when ? `${binding.when} && ` : ''}!isMac`,
      });
    } else {
      // Add as is if no 'cmdCtrl'
      processed.push(binding);
    }
  }
  return processed;
}

// Function to generate Markdown cheat sheet
function generateCheatSheet(bindings) {
  let markdown = `# VS Code Custom Keybindings Cheat Sheet\n\n`;
  markdown += `| Key (macOS) | Key (Win/Linux) | Description |\n`;
  markdown += `| :---------- | :-------------- | :---------- |\n`;

  for (const binding of bindings) {
    if (binding.key.includes('cmdCtrl')) {
      const macKey = binding.key.replace('cmdCtrl', 'Cmd');
      const winLinuxKey = binding.key.replace('cmdCtrl', 'Ctrl');
      markdown += `| \`${macKey}\` | \`${winLinuxKey}\` | ${binding.description} |\n`;
    } else {
      // For bindings that don't use cmdCtrl, just show the key
      markdown += `| \`${binding.key}\` | \`${binding.key}\` | ${binding.description} |\n`;
    }
  }
  return markdown;
}

try {
  // 1. Generate keybindings.json
  const finalBindings = processKeybindings(customBindings);
  fs.writeFileSync(
    keybindingsOutputPath,
    JSON.stringify(finalBindings, null, 2),
    'utf-8'
  );
  console.log(
    `Successfully generated ${keybindingsOutputFileName} at ${keybindingsOutputPath}`
  );
  console.log(
    "Please copy its content into your VS Code User Keybindings file."
  );
  console.log(
    "(File > Preferences > Keyboard Shortcuts, then click the '{}' icon in the top right)."
  );

  console.log('\n---'); // Separator for clarity

  // 2. Generate Cheat Sheet
  // To make the cheat sheet robust, we need descriptions for each binding.
  // I've added a 'description' field to your customBindings array.
  const cheatSheetContent = generateCheatSheet(customBindings);
  fs.writeFileSync(cheatSheetOutputPath, cheatSheetContent, 'utf-8');
  console.log(
    `Successfully generated cheat sheet at ${cheatSheetOutputFileName}`
  );
} catch (error) {
  console.error(
    `Error generating files:`,
    error.message
  );
}
