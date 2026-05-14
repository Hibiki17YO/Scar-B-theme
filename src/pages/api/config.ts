import type { APIRoute } from 'astro';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { defaultConfig } from '../../config/terminal.config';

const CONFIG_PATH = join(process.cwd(), 'src', 'config', 'user.config.json');

async function readUserConfig(): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const GET: APIRoute = async () => {
  const user = await readUserConfig();
  const merged = {
    ...defaultConfig,
    ...user,
    whoami: { ...defaultConfig.whoami, ...((user.whoami as object) ?? {}) },
    builtinCommands: (user.builtinCommands as unknown[]) ?? defaultConfig.builtinCommands,
  };
  return Response.json(merged);
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const tmp = CONFIG_PATH + '.' + randomBytes(4).toString('hex') + '.tmp';
    await writeFile(tmp, JSON.stringify(body, null, 2), 'utf-8');
    await rename(tmp, CONFIG_PATH);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
