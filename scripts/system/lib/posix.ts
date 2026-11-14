import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, parse, resolve } from "node:path";

export function testSafePath(targetPath: string): boolean {
  if (!targetPath || !targetPath.trim()) return false;
  if (!isAbsolute(targetPath)) return false;

  const full = resolve(targetPath);
  if (/(^|[\\/])\.\.([\\/]|$)/.test(full)) return false;

  const { root } = parse(full);
  if (full === root) return false;
  const normalized = full.replace(/\/+$/, "");

  const home = process.env.HOME || homedir();
  const protectedDirs = [
    home,
    home ? resolve(home, "..") : undefined,
    "/System",
    "/Library",
    "/Applications",
    "/usr",
    "/bin",
    "/sbin",
    "/etc",
    "/var",
  ];

  for (const candidate of protectedDirs) {
    if (!candidate) continue;
    if (normalized === resolve(candidate).replace(/\/+$/, "")) return false;
  }

  return true;
}

export async function removePath(targetPath: string): Promise<void> {
  if (!testSafePath(targetPath)) {
    throw new Error(`refusing unsafe path: ${targetPath}`);
  }
  if (!existsSync(targetPath)) return;
  await rm(targetPath, { recursive: true, force: true });
}
