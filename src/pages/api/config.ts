import type { APIRoute } from 'astro';
import { z } from 'astro:schema';
import { defaultConfig } from '../../config/terminal.config';
import { readUserConfig, writeUserConfig, sha256hex } from '../../lib/server-auth';

const LinkSchema = z.object({
  label: z.string().max(100),
  url: z.string().max(2000),
});

const ProjectSchema = z.object({
  name: z.string().max(200),
  description: z.string().max(500),
});

const CustomCommandSchema = z.object({
  name: z.string().max(50),
  description: z.string().max(200).optional(),
  output: z.string().max(20000),
  enabled: z.boolean().optional(),
});

const BuiltinCommandSchema = z.object({
  id: z.string().max(50),
  name: z.string().max(50),
  description: z.string().max(200),
  enabled: z.boolean(),
});

const ConfigSchema = z.object({
  siteTitle: z.string().max(200).optional(),
  siteIconUrl: z.string().max(2000).optional(),
  username: z.string().max(50).optional(),
  hostname: z.string().max(100).optional(),
  icpNumber: z.string().max(100).optional(),
  copyrightText: z.string().max(200).optional(),
  adminCommand: z.string().max(50).optional(),
  blogCommand: z.string().max(50).optional(),
  showDotArt: z.boolean().optional(),
  showBanner: z.boolean().optional(),
  showName: z.boolean().optional(),
  dotArt: z.string().max(20000).optional(),
  bannerArt: z.string().max(20000).optional(),
  nameLines: z.array(z.string().max(500)).max(200).optional(),
  whoami: z.object({
    displayName: z.string().max(100).optional(),
    bio: z.array(z.string().max(500)).max(50).optional(),
    links: z.array(LinkSchema).max(50).optional(),
  }).optional(),
  projects: z.array(ProjectSchema).max(100).optional(),
  builtinCommands: z.array(BuiltinCommandSchema).max(50).optional(),
  customCommands: z.array(CustomCommandSchema).max(100).optional(),
  showSiteInfo: z.boolean().optional(),
  siteStartDate: z.string().max(50).optional(),
  siteInfoTemplate: z.string().max(2000).optional(),
  // Plain-text new passwords are accepted and hashed server-side.
  // The client must NEVER send adminPassHash / blogPassHash directly.
  newAdminPass: z.string().min(1).max(200).optional(),
  newBlogPass: z.string().min(1).max(200).optional(),
}).strict();

// Fields we scrub from any GET response — never leak hashes or secrets to the client.
const SECRET_FIELDS = ['adminPassHash', 'blogPassHash'] as const;

export const GET: APIRoute = async () => {
  const user = await readUserConfig();
  const merged: Record<string, unknown> = {
    ...defaultConfig,
    ...user,
    whoami: { ...defaultConfig.whoami, ...((user.whoami as object) ?? {}) },
    builtinCommands: (user.builtinCommands as unknown[]) ?? defaultConfig.builtinCommands,
  };
  for (const f of SECRET_FIELDS) delete merged[f];
  // Surface only whether a password is configured, not its value
  merged.hasAdminPass = Boolean((user.adminPassHash as string) ?? '');
  merged.hasBlogPass = Boolean((user.blogPassHash as string) ?? '');
  return Response.json(merged);
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    // Explicit reset sentinel — wipe all non-password fields back to defaults
    if (body && typeof body === 'object' && (body as Record<string, unknown>).reset === true) {
      const current = await readUserConfig();
      await writeUserConfig({
        adminPassHash: (current.adminPassHash as string) ?? '',
        blogPassHash: (current.blogPassHash as string) ?? '',
      });
      return Response.json({ ok: true });
    }

    const parsed = ConfigSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'invalid config', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const incoming = { ...parsed.data } as Record<string, unknown>;
    // Reject silent full-wipe: a non-reset PUT with no real fields is almost
    // certainly a client bug (e.g. accidental `{}`) — refuse rather than
    // overwrite the on-disk config with empty values
    if (Object.keys(incoming).length === 0) {
      return Response.json(
        { error: 'empty config body — send { reset: true } to reset' },
        { status: 400 },
      );
    }

    const newAdminPass = incoming.newAdminPass as string | undefined;
    const newBlogPass = incoming.newBlogPass as string | undefined;
    delete incoming.newAdminPass;
    delete incoming.newBlogPass;

    // Preserve existing hashes; never trust hash fields from the client.
    const current = await readUserConfig();
    const next: Record<string, unknown> = { ...incoming };
    next.adminPassHash = newAdminPass
      ? sha256hex(newAdminPass)
      : (current.adminPassHash ?? '');
    next.blogPassHash = newBlogPass
      ? sha256hex(newBlogPass)
      : (current.blogPassHash ?? '');

    await writeUserConfig(next);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
