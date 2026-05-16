import { readFile, stat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { defaultConfig, type TerminalConfig, type BuiltinCommandConfig } from '../config/terminal.config';

// Merge builtin commands: default entries are the source of truth for the id set.
// User overrides (name/description/enabled) are applied per id.
// User entries with unknown ids are appended (forward-compatibility).
function mergeBuiltinCommands(
  defaults: BuiltinCommandConfig[],
  userList: BuiltinCommandConfig[] | undefined,
): BuiltinCommandConfig[] {
  if (!userList) return defaults;
  const userMap = new Map(userList.map(b => [b.id, b]));
  const merged = defaults.map(d => ({ ...d, ...(userMap.get(d.id) ?? {}) }));
  const defaultIds = new Set(defaults.map(d => d.id));
  for (const u of userList) {
    if (!defaultIds.has(u.id)) merged.push(u);
  }
  return merged;
}
import { getConfigPath, getPostsDir } from './server-auth';
import type { RuntimePost } from './posts-runtime';

// Module-level caches survive across SSR requests in the same Node process.
// Dev mode (import.meta.env.DEV) bypasses the cache so edits are reflected
// immediately without restarting the dev server.

export interface RuntimeConfigResult {
  config: TerminalConfig;
  hasAdminPass: boolean;
  hasBlogPass: boolean;
}

interface ConfigCache {
  mtimeMs: number;
  value: RuntimeConfigResult;
}
let _configCache: ConfigCache | null = null;

export async function getRuntimeConfig(): Promise<RuntimeConfigResult> {
  const path = getConfigPath();
  let mtimeMs = 0;
  try {
    mtimeMs = (await stat(path)).mtimeMs;
  } catch {
    // Config file may not exist on first run; mtime stays 0 (cache hit if previously empty)
  }

  if (!import.meta.env.DEV && _configCache && _configCache.mtimeMs === mtimeMs) {
    return _configCache.value;
  }

  let config: TerminalConfig = { ...defaultConfig };
  let hasAdminPass = false;
  let hasBlogPass = false;

  try {
    const raw = await readFile(path, 'utf-8');
    const user = JSON.parse(raw);
    hasAdminPass = Boolean(user.adminPassHash);
    hasBlogPass  = Boolean(user.blogPassHash);
    delete user.adminPassHash;
    delete user.blogPassHash;
    config = {
      ...defaultConfig,
      ...user,
      whoami: { ...defaultConfig.whoami, ...(user.whoami ?? {}) },
      builtinCommands: mergeBuiltinCommands(defaultConfig.builtinCommands, user.builtinCommands),
    };
  } catch { /* fall back to defaults */ }

  const value = { config, hasAdminPass, hasBlogPass };
  _configCache = { mtimeMs, value };
  return value;
}

export interface PostStats {
  totalWords: number;
}

interface StatsCache {
  fingerprint: string;
  value: PostStats;
}
let _statsCache: StatsCache | null = null;

// Build a cheap fingerprint from the posts directory: name + size + mtime per file.
// Cheaper than reading every body to count words, lets the cache hit until
// any post file actually changes.
async function postsFingerprint(): Promise<string> {
  const dir = getPostsDir();
  try {
    const files = (await readdir(dir)).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    files.sort();
    const parts: string[] = [];
    for (const f of files) {
      const s = await stat(join(dir, f));
      parts.push(`${f}:${s.size}:${s.mtimeMs}`);
    }
    return parts.join('|');
  } catch {
    return '';
  }
}

export async function getPostStats(posts: RuntimePost[]): Promise<PostStats> {
  const fingerprint = await postsFingerprint();
  if (!import.meta.env.DEV && _statsCache && _statsCache.fingerprint === fingerprint) {
    return _statsCache.value;
  }

  let totalWords = 0;
  for (const post of posts) {
    const body = post.body;
    const cjk  = (body.match(/[一-鿿぀-ヿ]/g) ?? []).length;
    const words = (body.match(/[a-zA-Z0-9]+/g) ?? []).length;
    totalWords += cjk + words;
  }

  const value = { totalWords };
  _statsCache = { fingerprint, value };
  return value;
}
