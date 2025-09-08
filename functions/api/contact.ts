// functions/api/contact.ts
export const config = { runtime: 'edge' };

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[ch]);
}

export async function onRequestPost(context: {
  env: { RESEND_API_KEY: string; TURNSTILE_SECRET: string };
  request: Request;
}) {
  try {
    const form = await context.request.formData();
    const name = (form.get('name') || '').toString().trim();
    const email = (form.get('email') || '').toString().trim();
    const message = (form.get('message') || '').toString().trim();
    const helps = form.getAll('help').map(String).filter(Boolean);
    const cfToken = (form.get('cf-turnstile-response') || '').toString();
    const honey = (form.get('website') || '').toString().trim();

    if (honey) return new Response('OK', { status: 200 }); // honeypot

    if (!name || !isValidEmail(email) || !message) {
      return new Response('Invalid input', { status: 400 });
    }

    // Verify Turnstile token
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: context.env.TURNSTILE_SECRET,
        response: cfToken,
        remoteip: context.request.headers.get('CF-Connecting-IP') || ''
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const verify = await verifyRes.json() as { success: boolean };
    if (!verify.success) return new Response('Captcha failed', { status: 400 });

    // Send email via Resend
    const html = `
      <h3>New enquiry from lumas.com</h3>
      <p><b>Name:</b> ${escapeHtml(name)}</p>
      <p><b>Email:</b> ${escapeHtml(email)}</p>
      <p><b>Message:</b><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
      ${helps.length ? `<p><b>Help needed:</b> ${helps.map(escapeHtml).join(', ')}</p>` : ''}
    `;

    const payload = {
      from: 'Lumas Website <no-reply@lumas.com>',
      to: ['connect@lumas.com'],
      reply_to: [`${name} <${email}>`],
      subject: 'New contact form message',
      html
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response('Email API error: ' + text, { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response('Server error', { status: 500 });
  }
}
