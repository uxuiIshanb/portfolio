// functions/api/contact.ts
// Cloudflare Pages Function: accepts the contact form POST,
// verifies Turnstile, and sends mail via Resend to connect@lumas.com.

export const config = { runtime: "edge" };

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[ch]
  );
}

export async function onRequestPost(context: {
  env: { RESEND_API_KEY: string; TURNSTILE_SECRET: string };
  request: Request;
}) {
  try {
    const form = await context.request.formData();

    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const message = (form.get("message") || "").toString().trim();
    const helps = form.getAll("help").map(String).filter(Boolean);
    const cfToken = (form.get("cf-turnstile-response") || "").toString();
    const honey = (form.get("website") || "").toString().trim(); // honeypot

    // Optional debug (uncomment if needed):
    // console.log("HAS_RESEND_KEY", !!context.env.RESEND_API_KEY);
    // console.log("HAS_TURNSTILE_SECRET", !!context.env.TURNSTILE_SECRET);

    // 0) Honeypot: if bots fill "website", silently succeed
    if (honey) return new Response("OK", { status: 200 });

    // 1) Basic validation
    if (!name || !isValidEmail(email) || !message) {
      return new Response("Invalid input", { status: 400 });
    }

    // 2) Verify Cloudflare Turnstile
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: context.env.TURNSTILE_SECRET,
        response: cfToken,
        remoteip: context.request.headers.get("CF-Connecting-IP") || "",
      }),
    });
    const verify: { success: boolean } = await verifyRes.json();
    if (!verify.success) {
      return new Response("Captcha failed", { status: 400 });
    }

    // 3) Build the email (From must be your Resend-verified domain)
    const html = `
      <h3>New enquiry from lumas.studio</h3>
      <p><b>Name:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Message:</b><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      ${helps.length ? `<p><b>Help needed:</b> ${helps.map(escapeHtml).join(", ")}</p>` : ""}
    `;

    const payload = {
      from: "Lumas Website <no-reply@lumas.studio>", // VERIFIED domain on Resend
      to: ["connect@lumas.com"],                      // your Hostinger inbox
      reply_to: [`${name} <${email}>`],               // replying goes to the visitor
      subject: "New contact form message",
      html,
    };

    // 4) Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      // Optional: log server-side for debugging
      // console.error("Resend error:", text);
      return new Response("Email API error: " + text, { status: 502 });
    }

    // 5) Success (your front-end treats any 200 as success)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response("Server error", { status: 500 });
  }
}
