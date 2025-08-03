# Project Task Runner

This file defines common development tasks using [Mask](https://github.com/jacobdeichert/mask), a simple CLI task runner that uses markdown for its configuration.

## Getting Started

You must have the `mask` CLI installed to use the commands defined in this file.

### Installation (macOS / Linux via Homebrew)

```sh
brew install mask
```

### Installation (via Cargo)

```sh
cargo install mask
```

## VS-Code

### default

> The default task. Runs the complete environment setup.

```sh
mask setup
```

### setup

> Sets up the complete VS Code environment by running all sub-tasks.

```sh
mask configs
mask extensions
echo "✅ VS Code setup complete."
```

### configs

> Generate or update local configuration files (e.g., `.editorconfig`).

```sh
echo "🚀 Generating local configs..."
node .vscode/scripts/configs.mjs
```

### extensions

> Sync the project's recommended VS Code extensions.

```sh
echo "🚀 Syncing VS Code extensions..."
node .vscode/scripts/extensions.mjs sync
```
