#!/usr/bin/env bun
/**
 * Declarative OS state & cleanup runner.
 *
 * Discovers TypeScript resources under resources/common and resources/<os>,
 * tests each resource for drift, applies pending resources with --apply, and
 * runs deduplicated post-install hooks once at the end.
 *
 * Usage: bun scripts/system/run.ts [--apply] [resource-name ...]
 */
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Platform, Resource, ResourceContext } from "./lib/types.ts";

function detectPlatform(): Platform {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    case "linux":
      return "linux";
    default:
      console.error(`system: unsupported platform: ${process.platform}`);
      process.exit(2);
  }
}

const args = process.argv.slice(2);
const apply = args.includes("--apply") || args.includes("-Apply");
const filters = new Set<string>();

for (const arg of args) {
  if (arg === "--apply" || arg === "-Apply") continue;
  if (arg.startsWith("-")) {
    console.error(`system: unknown argument: ${arg}`);
    process.exit(2);
  }
  filters.add(arg.replace(/\.ts$/i, "").toLowerCase());
}

const platform = detectPlatform();
const resourcesRoot = join(import.meta.dir, "resources");

async function discoverFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".ts") && !e.name.startsWith("_"))
    .map((e) => join(dir, e.name))
    .sort((a, b) => basename(a).localeCompare(basename(b)));
}

const files = [
  ...(await discoverFiles(join(resourcesRoot, "common"))),
  ...(await discoverFiles(join(resourcesRoot, platform))),
];

if (files.length === 0) {
  console.log(`No system resources configured for ${platform}.`);
  process.exit(0);
}

const postInstallHooks = new Map<string, () => Promise<void> | void>();

const ctx: ResourceContext = {
  platform,
  home: homedir(),
  apply,
  onPostInstall(name, fn) {
    if (!postInstallHooks.has(name)) {
      postInstallHooks.set(name, fn);
    }
  },
};

let changed = 0;
let ok = 0;
let failed = 0;

for (const file of files) {
  const defaultName = basename(file, ".ts");
  if (filters.size > 0 && !filters.has(defaultName.toLowerCase())) {
    continue;
  }

  let resource: Resource;
  try {
    const mod = (await import(pathToFileURL(file).href)) as { default?: Resource; resource?: Resource };
    resource = mod.default ?? mod.resource!;
    if (!resource || typeof resource.test !== "function" || typeof resource.set !== "function") {
      throw new Error("missing test() or set()");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`system: ${defaultName}: ${msg}`);
    failed++;
    continue;
  }

  const name = resource.name ?? defaultName;
  if (resource.platforms && !resource.platforms.includes(platform)) {
    continue;
  }

  try {
    const inDesiredState = await resource.test(ctx);
    if (inDesiredState) {
      console.log(`ok           ${name}`);
      ok++;
      continue;
    }

    if (!apply) {
      console.log(`pending      ${name}`);
      changed++;
      continue;
    }

    await resource.set(ctx);
    console.log(`applied      ${name}`);
    changed++;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`system: ${name}: ${msg}`);
    failed++;
  }
}

if (apply && postInstallHooks.size > 0) {
  for (const [hookName, hookFn] of postInstallHooks) {
    try {
      await hookFn();
      console.log(`postinstall  ${hookName}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`system: postinstall ${hookName}: ${msg}`);
      failed++;
    }
  }
}

console.log("");
if (apply) {
  console.log(`Applied ${changed} resource(s); ${ok} already ok; ${failed} failed.`);
} else {
  console.log(`${changed} resource(s) pending; ${ok} already ok; ${failed} failed.`);
  console.log("Re-run with --apply to apply them.");
}

if (failed > 0) {
  process.exit(1);
}
