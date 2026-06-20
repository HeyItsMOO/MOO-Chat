# ChatMOO provisioning module for WHMCS

Sell and manage ChatMOO accounts straight from WHMCS. When a client orders, this
module creates their ChatMOO account; it then suspends/unsuspends on
(non)payment, terminates on cancellation, switches plan on upgrade/downgrade, and
gives clients one-click **single sign-on** into their ChatMOO dashboard.

It talks to the ChatMOO **Provisioning API** (`POST <app>/api/provisioning`),
authenticated with your `PROVISIONING_API_KEY`.

---

## 1. Configure ChatMOO (one-time)

In your ChatMOO deployment (Vercel → Settings → Environment Variables), set a
strong shared secret, then redeploy:

```
PROVISIONING_API_KEY=<a long random string, 32+ chars>
```

Generate one with: `openssl rand -hex 32`

This key is what WHMCS uses to authenticate. Keep it secret — anyone with it can
create/manage accounts.

`AUTH_SECRET` must also be set (it already is for login) — SSO tokens are signed
with it.

## 2. Install the module

Copy this folder so the path is:

```
<whmcs>/modules/servers/chatmoo/chatmoo.php
```

## 3. Add a ChatMOO "server" in WHMCS

**Setup → Products/Services → Servers → Add New Server**

| Field | Value |
| --- | --- |
| Name | ChatMOO |
| Hostname | your ChatMOO app URL, e.g. `app.chatmoo.com` (or the full `https://…`) |
| Module | **ChatMOO** |
| Access Hash | paste your `PROVISIONING_API_KEY` |

Leave Username blank. Tick **Secure (SSL)**. Click **Test Connection** — it
should succeed (it verifies the URL + key).

> The key may be entered as either the server **Access Hash** (preferred) or the
> server **Password** field — the module accepts either.

## 4. Create products

**Setup → Products/Services → Products/Services → Create a New Product**

- Module Settings tab → **Module Name: ChatMOO**, and pick the server group
  containing your ChatMOO server.
- Set the **Plan** dropdown to the ChatMOO tier this product sells
  (`Starter`, `Growth`, `Business`, `Custom`, or `Free`).
- Make one product per plan you want to sell. For upgrades/downgrades, put the
  plans in the same product group so WHMCS can switch between them — the module
  pushes the new plan to ChatMOO on package change.

## 5. (Optional) expose the SSO login button

Single sign-on works out of the box: in the client area, the service page shows a
**Login to ChatMOO** button (WHMCS renders it because the module implements
`ServiceSingleSignOn`). Clicking it logs the client straight into their ChatMOO
dashboard via a short-lived token.

---

## What each WHMCS action does

| WHMCS action | Provisioning call | Effect in ChatMOO |
| --- | --- | --- |
| Create | `action=create` | Creates the user (if new) + an **active** tenant on the mapped plan. No trial — WHMCS handles billing. |
| Suspend | `action=suspend` | Sets tenant status `suspended` (widget stops answering). |
| Unsuspend | `action=unsuspend` | Sets tenant status `active`. |
| Terminate | `action=terminate` | Deletes the tenant (assistant, conversations, leads, domains). |
| Change Package | `action=change_plan` | Updates the tenant's plan (limits/features change immediately). |
| SSO login | `action=sso` | Returns a one-time login URL; WHMCS redirects the client to it. |

The ChatMOO **tenant id** is stored against the WHMCS service (service property
"Tenant ID", with a fallback to the service username column) so later actions
target the right account.

## Troubleshooting

- **Test Connection fails with "Authentication failed"** — the Access Hash
  doesn't match `PROVISIONING_API_KEY`.
- **"Provisioning API is not configured"** — set `PROVISIONING_API_KEY` in
  ChatMOO and redeploy.
- All API calls are logged under **Utilities → Logs → Module Log** (module
  `chatmoo`).
