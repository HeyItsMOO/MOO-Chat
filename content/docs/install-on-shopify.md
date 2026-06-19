---
title: Install on Shopify
description: Add MOO Chat to your Shopify storefront with the theme app block — no code required.
order: 4
---

MOO Chat installs on Shopify as a **theme app block**, so you can add it from the theme editor without touching code.

## Steps

1. In the MOO Chat dashboard, open **Install** and copy your **public key** (`moo_xxxxxxxx`).
2. In Shopify, go to **Online Store → Themes → Customize**.
3. Open **App embeds** (or add the **MOO Chat** block from the `integrations/shopify` extension).
4. Enable the MOO Chat block and paste your public key.
5. **Save**. The assistant now appears on your storefront.

## Allowlist your store domain

Add your store's domain (for example `your-store.myshopify.com` and your custom domain) to the assistant's **domain allowlist** under **Install → Domains** so the widget is allowed to run there.

## Tips

- Test on a **preview** theme before publishing to be sure the placement and colors look right.
- If you use a custom domain, allowlist both it and the `myshopify.com` domain.

## Troubleshooting

- **Block not showing in the editor?** Make sure the MOO Chat extension is installed for your store.
- **Widget not loading on the live store?** Double-check the public key and that the block is enabled and saved.
