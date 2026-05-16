# Changelog

## [Unreleased] — 2026-05-16

### Added

- **Search command** — `search` in the terminal prompts for a keyword inline (same UX as password input), then matches against post title, description, and tags, outputting results with date / title link / excerpt / tags.
- **RSS feed** — `/rss.xml` endpoint (SSR, always up-to-date); `<link rel="alternate">` auto-injected in `<head>`; built-in `rss` terminal command shows the feed URL.
- **Tag archive pages** — `/tag` lists all tags by usage count; `/tag/<name>` filters posts by tag. Tag chips in the blog list and post layout are now clickable links.
- **Blog pagination** — `/blog` shows page 1; `/blog/page/<n>` handles subsequent pages. Posts-per-page is configurable from the admin panel (`postsPerPage`, default 10).
- **Three colour themes** — title-bar word cycles through **Dark** (default), **Eliana** (warm earth tones), and **Amaris** (cold blue/navy). Preference persisted in `localStorage`; page load applies theme before first paint to prevent flash.
- **Theme transition animation** — 240 ms ease on `background-color`, `color`, `border-color`, `box-shadow`; `prefers-reduced-motion` disables it.

### Changed

- **Light theme (Eliana) palette** updated: `--color-prompt` → `#FF9800`, `--color-cmd` → `#E88C3A`, `--color-whoami-link` → `#597DDA`, `--color-titlebar` → `#EAE3D2`.
- **Admin / blog-admin pages** fully themed: title bars, auth overlays, inputs, textareas, selects, table row borders and hover backgrounds, primary and danger button text now use CSS variables — no hardcoded dark colours remain.
- `Terminal.astro` shadow, input-line border, footer border, scrollbar thumb, and `link-dark` hover colour converted from hardcoded values to CSS variables.
- Blog post title links no longer change colour on hover.
- `src/pages/admin.astro` — removed stale `export const prerender = true` (page is SSR).
- Theme toggle redesigned: was an icon button, now a plain clickable word in the title bar. PC: horizontally centred with `position: absolute`; mobile: right-aligned inline.

### Fixed

- `sha256.js` de-duplicated: all four inline SHA-256 implementations replaced by a single `public/js/sha256.js` loaded via `<script src>`.
- Blog list and pagination pages migrated from `getCollection()` (build-time snapshot) to `getPostsRuntime()` (runtime readdir), so new posts appear without a rebuild.

### Removed

- Developer-facing notes ("do not commit", "勿提交", unresolved TODO reference to `docs/deployment.md`) removed from README files.
