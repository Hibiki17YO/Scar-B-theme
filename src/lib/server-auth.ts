import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

// SCAR_CONFIG_PATH lets ops point at a different file (containers, multi-instance)
// or lets tests target a temp file without polluting real config.
// Resolved on every call so tests can override the env var between cases.
export function getConfigPath(): string {
  return process.env.SCAR_CONFIG_PATH
    ?? join(process.cwd(), 'src', 'config', 'user.config.json');
}

// Posts directory — same env-var pattern as getConfigPath.
export function getPostsDir(): string {
  return process.env.SCAR_POSTS_DIR
    ?? join(process.cwd(), 'src', 'content', 'posts');
}

export type AuthKind = 'admin' | 'blog';

export async function readUserConfig(): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(getConfigPath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function writeUserConfig(cfg: Record<string, unknown>): Promise<void> {
  const path = getConfigPath();
  const tmp = path + '.' + randomBytes(8).toString('hex') + '.tmp';
  await writeFile(tmp, JSON.stringify(cfg, null, 2), 'utf-8');
  await rename(tmp, path);
}

export function sha256hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyToken(kind: AuthKind, token: string | null): Promise<boolean> {
  if (!token) return false;
  const cfg = await readUserConfig();
  const stored = (kind === 'admin' ? cfg.adminPassHash : cfg.blogPassHash) as string | undefined;
  if (!stored) return false;
  return constantTimeEqual(token, stored);
}

// True when this kind of password has been configured. When false, the kind
// has no auth and writes should be allowed (first-run bootstrap).
export async function passwordSet(kind: AuthKind): Promise<boolean> {
  const cfg = await readUserConfig();
  const stored = (kind === 'admin' ? cfg.adminPassHash : cfg.blogPassHash) as string | undefined;
  return Boolean(stored);
}
