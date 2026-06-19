# MOO Chat — Shopify integration

Two ways to put MOO Chat on a Shopify store. Both use the same `<script>` embed.

## Option A — Manual install (works today, no app needed)

Best for your own clients right now.

1. In Shopify admin: **Online Store → Themes → ⋯ → Edit code**.
2. Open `layout/theme.liquid`.
3. Paste this just before `</body>` and save:

   ```html
   <script src="https://app.heyitsmoo.com/embed.js" data-key="moo_xxxxxxxx" async></script>
   ```

   (Replace the key with the store's public key from **Dashboard → Install**, and the
   domain with your deployed app URL.)

## Option B — Theme app extension (for a real Shopify App, later)

The `theme-app-extension/` folder is a ready-made **app embed block**. To ship it on the
Shopify App Store (so merchants install with one click and toggle it in the theme editor):

1. Create a Shopify Partner account and a new app (Shopify CLI: `npm init @shopify/app`).
2. Copy `theme-app-extension/` into the app's `extensions/moo-chat/` folder.
3. `shopify app dev` to preview, then `shopify app deploy` to publish.
4. Merchants enable it under **Online Store → Customize → App embeds → MOO Chat** and
   paste their public key.

A full App Store listing also needs OAuth, an app home, and (optionally) Shopify-managed
billing — that's a separate project beyond this scaffold, but the embed block is the core
of it and is done.

## Notes
- Whichever option, add the store's domain to **Install → Allowed domains** in MOO Chat,
  or the widget won't load there (anti-theft protection).
- The widget is the same one used everywhere else — branding, knowledge base, lead form,
  and live chat all come from the store's MOO Chat config.
