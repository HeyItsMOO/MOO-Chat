---
title: Install on WordPress
description: Add ChatMOO to a WordPress site with the official plugin — no theme edits required.
order: 3
---

There are two ways to add ChatMOO to WordPress. The plugin is the easiest.

## Option A — the ChatMOO plugin (recommended)

1. In the dashboard, open **Install** and copy your **public key** (it looks like `moo_xxxxxxxx`).
2. In WordPress, go to **Plugins → Add New** and install the **ChatMOO** plugin (or upload the plugin zip from the `integrations/wordpress` folder).
3. Activate it, open the **ChatMOO** settings, and paste your public key.
4. Save. The assistant now loads on every page of your site.

No theme files are touched, and updates to your assistant's configuration apply automatically — the plugin only stores your key.

## Option B — the script tag

If you'd rather not use the plugin, paste the snippet from the **Install** page into your theme's footer (for example via **Appearance → Theme File Editor**, or a "header & footer scripts" plugin):

```html
<script src="https://YOUR-APP-DOMAIN/embed.js" data-key="moo_xxxxxxxx" async></script>
```

## Allowlist your domain

Make sure your WordPress site's domain is in the assistant's **domain allowlist** (set during onboarding, editable under **Install → Domains**). The widget only runs on allowlisted domains.

## Troubleshooting

- **Widget not appearing?** Confirm the public key is correct and your domain is allowlisted.
- **Caching plugins** can delay changes — clear your cache after installing.
