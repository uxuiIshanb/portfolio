
# Resend + Cloudflare Pages Function for lumas.com

This folder contains a ready-to-use Cloudflare Pages Function that accepts your HTML form POST at `/api/contact`, verifies Cloudflare Turnstile, and sends the message to `connect@lumas.com` via Resend.

## Files
- `functions/api/contact.ts` — the serverless handler (Edge runtime).

## Expected HTML form (minimal example)
Use this structure on your site (e.g., `contact.html`):

```html
<form method="POST" action="/api/contact">
  <input name="name" required placeholder="Your name" />
  <input name="email" type="email" required placeholder="you@company.com" />
  <textarea name="message" required placeholder="Tell us about the project..."></textarea>

  <!-- Optional categories -->
  <label><input type="checkbox" name="help" value="Website design"> Website design</label>
  <label><input type="checkbox" name="help" value="Content creation"> Content creation</label>

  <!-- Honeypot -->
  <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />

  <!-- Turnstile -->
  <div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY"></div>
  <button type="submit">Send</button>
</form>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
```

## Setup steps

### 1) Verify your sender domain in Resend
- Add `lumas.com` in Resend → Domains.
- In Hostinger DNS, add the DKIM and return-path records exactly as shown by Resend.
- Wait for verification to pass.

### 2) Cloudflare Pages: environment variables
In **Pages → Project → Settings → Environment variables (Production)** add:
- `RESEND_API_KEY = <your Resend API key>`
- `TURNSTILE_SECRET = <your Turnstile secret key>`

### 3) Cloudflare Turnstile
- In the Cloudflare dashboard → Turnstile, create a widget for `lumas.com`.
- Put the **site key** in your form’s `data-sitekey`.

### 4) Wire up your form
- Ensure your Contact form uses `method="POST" action="/api/contact"`.
- Ensure inputs are named exactly: `name`, `email`, `message`, and optional `help` checkboxes (multiple values allowed).

### 5) Deploy
- Commit and push to your GitHub repo. Cloudflare Pages will build and publish.
- Test submissions; email should land in `connect@lumas.com`. Check headers for SPF/DKIM/DMARC = pass.

### Notes
- **From** must be your own domain (e.g., `no-reply@lumas.com`). The visitor's address goes to **Reply-To**.
- Add client-side validation + success/fail UI as desired.
