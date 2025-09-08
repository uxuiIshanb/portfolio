// functions/api/contact.ts
// Cloudflare Pages Function with diagnostics

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
    const url = new URL(context.request.url);
    const form = await context.request.formData();

    const name = (form.get("name") || "").toString().trim();
    const email = (form.get("email") || "").toString().trim();
    const message = (form.get("message") || "").toString().trim();
    const helps = form.getAll("help").map(String).filter(Boolean);
    const cfToken = (form.get("cf-turnstile-response") || "").toString();
    const honey = (form.get("website") || "").toString().trim();

    // Debug logs in Cloudflare console (not visible to visitors)
    console.log("HAS_RESEND_KEY", !!context.env.RESEND_API_KEY);
    console.log("HAS_TURNSTILE_SECRET", !!context.env.TURNSTILE_SECRET);

    // 1. Honeypot
    if (honey) {
      console.log("Honeypot filled, bot detected.");
      return new Response("OK", { status: 200 });
    }

    // 2. Input validation
    if (!name || !isValidEmail(email) || !message) {
      const missing = [
        !name ? "name" : "",
        !isValidEmail(email) ? "email" : "",
        !message ? "message" : "",
      ]
        .filter(Boolean)
        .join(", ");
      return new Response("Invalid input: " + missing, { status: 400 });
    }

    // 3. Verify Turnstile (skip if debug=1 in URL)
    const skipCaptcha = url.searchParams.get("debug") === "1";
    if (!skipCaptcha) {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: context.env.TURNSTILE_SECRET,
            response: cfToken,
            remoteip: context.request.headers.get("CF-Connecting-IP") || "",
          }),
        }
      );

      const verify = (await verifyRes.json()) as any;
      if (!verify?.success) {
        console.log("Turnstile verify failed", verify);
        return new Response("Captcha failed: " + JSON.stringify(verify), {
          status: 400,
        });
      }
    }

    // 4. Build the email payload
    const html = `
      <h3>New enquiry from lumas.studio</h3>
      <p><b>Name:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Message:</b><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      ${
        helps.length
          ? `<p><b>Help needed:</b> ${helps.map(escapeHtml).join(", ")}</p>`
          : ""
      }
    `;

    const payload = {
      from: "Lumas Website <no-reply@lumas.studio>", // must be your Resend-verified domain
      to: ["connect@lumas.com"],
      reply_to: [`${name} <${email}>`],
      subject: "New contact form message",
      html,
    };

    // 5. Send via Resend
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
      console.log("Resend error:", text);
      return new Response("Email API error: " + text, { status: 502 });
    }

    // 6. Success
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("Unhandled error:", err);
    return new Response("Server error", { status: 500 });
  }
}
