import { $ } from "bun";

export type Platform = "windows" | "macos" | "linux";

export interface ResourceContext {
  platform: Platform;
  home: string;
  apply: boolean;
  /** Register a named post-apply hook (deduplicated by name across resources). */
  onPostInstall(name: string, fn: () => Promise<void> | void): void;
}

export interface Resource {
  name?: string;
  /** Platforms this resource applies to. Omit for all platforms. */
  platforms?: Platform[];
  /** Optional platform-specific shell commands for generic resources. */
  windowsCmd?: string;
  macosCmd?: string;
  linuxCmd?: string;
  /** Return true when the machine already matches the desired state. */
  test(ctx: ResourceContext): Promise<boolean> | boolean;
  /** Enforce the desired state; throw on failure. */
  set(ctx: ResourceContext): Promise<void> | void;
  /** Optional restore hook; never called by normal runs. */
  unset?(ctx: ResourceContext): Promise<void> | void;
}

export function defineResource(resource: Resource): Resource {
  return resource;
}

export function getPlatformCommand(resource: Resource, platform: Platform): string | undefined {
  switch (platform) {
    case "windows":
      return resource.windowsCmd;
    case "macos":
      return resource.macosCmd;
    case "linux":
      return resource.linuxCmd;
  }
}

export async function runPlatformCommand(resource: Resource, ctx: ResourceContext): Promise<void> {
  const cmd = getPlatformCommand(resource, ctx.platform);
  if (!cmd) {
    throw new Error(`no command defined for platform: ${ctx.platform}`);
  }
  if (ctx.platform === "windows") {
    await $`cmd /c ${cmd}`;
  } else {
    await $`sh -c ${cmd}`;
  }
}
