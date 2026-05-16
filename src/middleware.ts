import { defineMiddleware } from 'astro:middleware';
import { verifyToken, passwordSet } from './lib/server-auth';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  const method = ctx.request.method;

  // /api/auth itself is the login endpoint — never gated
  if (pathname === '/api/auth') return next();

  if (!WRITE_METHODS.has(method)) return next();

  // Config writes require admin token — unless no admin password has been set
  // (first-run bootstrap: an open server is intentional until the user creates one)
  if (pathname === '/api/config') {
    if (!(await passwordSet('admin'))) return next();
    const token = ctx.request.headers.get('X-Admin-Token');
    if (!(await verifyToken('admin', token))) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return next();
  }

  // Posts writes require blog token (admin token also accepted) — same bootstrap rule
  if (pathname.startsWith('/api/posts')) {
    const blogConfigured = await passwordSet('blog');
    const adminConfigured = await passwordSet('admin');
    if (!blogConfigured && !adminConfigured) return next();
    const adminToken = ctx.request.headers.get('X-Admin-Token');
    const blogToken = ctx.request.headers.get('X-Blog-Token');
    const ok = (await verifyToken('blog', blogToken)) || (await verifyToken('admin', adminToken));
    if (!ok) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return next();
  }

  return next();
});
