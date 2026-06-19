=== ChatMOO ===
Contributors: heyitsmoo
Tags: chatbot, ai, chat, support, leads
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

Add your ChatMOO AI assistant to WordPress. No code — paste your public key and go live.

== Description ==

ChatMOO is an AI assistant for your website that answers customer questions, captures
leads, and hands off to your team. This plugin is the thin installer: all the AI, settings,
knowledge base and data live in your ChatMOO dashboard. The plugin only injects the embed
snippet with your public key.

== Installation ==

1. Upload the `moo-chat` folder to `/wp-content/plugins/`, or install the ZIP via
   Plugins > Add New > Upload Plugin. Activate it.
2. Go to **Settings > ChatMOO**.
3. Paste your **public key** (find it in your ChatMOO dashboard under **Install**).
4. Make sure "Enabled" is ticked and Save.
5. Visit your site — the chat bubble appears in the corner.

== Frequently Asked Questions ==

= Where do I get my public key? =
Log in to ChatMOO, open **Install**, and copy the `data-key` value (starts with `moo_`).

= The bubble isn't showing =
Check the key is correct, "Enabled" is on, and that the domain is on your allow-list in
the ChatMOO dashboard (Install > Allowed domains).

== Changelog ==

= 1.0.0 =
* Initial release — thin embed installer for the ChatMOO platform.
