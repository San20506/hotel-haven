// Catch-all API handler for Cloudflare Pages Functions
// Routes: /api/freebie-guide, /api/booking, /api/bookings, /api/booking/:id/resend-guide
// D1 binding available via context.env.DB
// Resend API key available via context.env.RESEND_API_KEY

import { renderAdmin, generateCode } from './_admin';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST /api/freebie-guide — send island guide PDF
    if (path === '/api/freebie-guide' && request.method === 'POST') {
      const form = await request.formData();
      const name = form.get('name');
      const email = form.get('email');

      if (!name || !email) {
        return Response.json({ sent: false, error: 'Name and email required' }, { status: 400 });
      }

      // Send email via Resend
      const sent = await sendGuideEmail(env, name, email);

      // Log signup in D1
      if (env.DB) {
        await env.DB.prepare(
          'INSERT INTO guide_signups (name, email, guide_sent) VALUES (?, ?, ?)'
        ).bind(name, email, sent ? 1 : 0).run();
      }

      return Response.json({ sent, name }, { headers: corsHeaders });
    }

    // POST /api/booking — create booking + send guide
    if (path === '/api/booking' && request.method === 'POST') {
      const form = await request.formData();
      const guest_name = form.get('guest_name');
      const guest_email = form.get('guest_email');
      const guest_phone = form.get('guest_phone');
      const room_type = form.get('room_type');
      const meal_plan = form.get('meal_plan');
      const check_in = form.get('check_in');
      const check_out = form.get('check_out');
      const guests = parseInt(form.get('guests') || '2');

      // Calculate price (room rates — keep in sync with frontend)
      const ROOMS = {
        'Standard Double AC': { ep: 1200, cp: 1400, map: 2200, ap: 3000, max: 2 },
        'Semi Deluxe Double AC': { ep: 1600, cp: 1800, map: 2600, ap: 3400, max: 2 },
        'Family Semi Deluxe AC': { ep: 1800, cp: 2200, map: 3800, ap: 5400, max: 4 },
        'Family Deluxe AC': { ep: 2200, cp: 2500, map: 4100, ap: 5700, max: 4 },
        'Deluxe Double AC': { ep: 2500, cp: 2600, map: 3400, ap: 4200, max: 2 },
      };

      const room = ROOMS[room_type];
      if (!room) return Response.json({ error: 'Invalid room' }, { status: 400 });

      const ci = new Date(check_in);
      const co = new Date(check_out);
      const nights = Math.max(1, (co - ci) / (1000 * 60 * 60 * 24));
      const rate = room[meal_plan.toLowerCase()] || room.ep;
      const total = rate * nights;
      const code = generateCode();

      const result = await env.DB.prepare(
        `INSERT INTO bookings (guest_name, guest_email, guest_phone, room_type, meal_plan,
         check_in, check_out, guests, total_amount, check_in_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(guest_name, guest_email, guest_phone, room_type, meal_plan,
             check_in, check_out, guests, total, code).run();

      // Send guide email
      const guideHtml = buildGuideHtml(guest_name, room_type, check_in, check_out, meal_plan, code);
      const sent = await sendGuideEmail(env, guest_name, guest_email, guideHtml);
      if (sent) {
        await env.DB.prepare('UPDATE bookings SET guide_sent = 1 WHERE id = ?').bind(result.meta.last_row_id).run();
      }

      return Response.redirect(`${env.SITE_URL || ''}/admin?created=${result.meta.last_row_id}&sent=${sent ? 'yes' : 'no'}`, 302);
    }

    // GET /api/bookings — list all bookings (admin)
    if (path === '/api/bookings' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
      return Response.json(results, { headers: corsHeaders });
    }

    // GET /api/booking/:id — single booking
    if (path.startsWith('/api/booking/') && request.method === 'GET') {
      const id = path.split('/').pop();
      if (id === 'resend-guide') {
        // POST handled below
        return new Response('Not found', { status: 404 });
      }
      const booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(parseInt(id)).first();
      if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json(booking, { headers: corsHeaders });
    }

    // POST /api/booking/:id/resend-guide — resend guide email
    if (path.match(/\/api\/booking\/\d+\/resend-guide$/) && request.method === 'POST') {
      const id = parseInt(path.split('/').slice(-2, -1)[0]);
      const booking = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
      if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

      const guideHtml = buildGuideHtml(booking.guest_name, booking.room_type,
        booking.check_in, booking.check_out, booking.meal_plan, booking.check_in_code);
      const sent = await sendGuideEmail(env, booking.guest_name, booking.guest_email, guideHtml);
      if (sent) {
        await env.DB.prepare('UPDATE bookings SET guide_sent = 1 WHERE id = ?').bind(id).run();
      }
      return Response.json({ sent }, { headers: corsHeaders });
    }

    // GET /admin — admin dashboard (HTML)
    if (path === '/admin' && request.method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
      const created = url.searchParams.get('created');
      const sent = url.searchParams.get('sent');
      const html = renderAdmin(results, created, sent);
      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    return new Response('Not found', { status: 404 });

  } catch (err) {
    console.error('API error:', err);
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

// --- Email sender via Resend ---
async function sendGuideEmail(env, name, email, htmlContent) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set — skipping email');
    return false;
  }

  const html = htmlContent || buildFreebieHtml(name);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || 'Hotel Haven <haven@yourdomain.com>',
        to: email,
        subject: `Welcome to Hotel Haven, ${name}! — Your Island Guide`,
        html,
        attachments: [
          {
            filename: 'Island_Guide_2026.pdf',
            path: `${env.SITE_URL || 'https://yourdomain.com'}/island-guide-2026.pdf`,
          },
        ],
      }),
    });

    const data = await res.json();
    return res.ok;
  } catch (err) {
    console.error('Resend error:', err);
    return false;
  }
}

// --- Guide HTML builders ---
function buildFreebieHtml(name) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:24px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#1A1A2E,#3B66E5);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Hotel Haven</h1>
<p style="color:#E9A443;margin:8px 0 0;">Your Island Guide</p></div>
<div style="padding:24px;">
<h2 style="color:#1A1A2E;">Welcome to the Andamans, ${name}!</h2>
<p style="color:#333;line-height:1.6;">Here's your curated guide to Sri Vijaya Puram and the surrounding islands.
Check the attached PDF for the full guide with ferry schedules, hidden beaches, and local tips.</p>
<p style="color:#333;line-height:1.6;">Need help planning? Call us at <strong>8900911010</strong> or
WhatsApp <strong>9434270555</strong>.</p></div>
<div style="background:#1A1A2E;padding:20px;text-align:center;">
<p style="color:#999;font-size:12px;margin:0;">Hotel Haven — Dolly Gunj, Sri Vijaya Puram, Andaman Islands</p>
</div></div></body></html>`;
}

function buildGuideHtml(name, room, ci, co, meal, code) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;padding:24px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
<div style="background:linear-gradient(135deg,#1A1A2E,#3B66E5);padding:32px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:28px;">Hotel Haven</h1>
<p style="color:#E9A443;margin:8px 0 0;">Booking Confirmed!</p></div>
<div style="padding:24px;background:#FFF5EE;">
<h2 style="color:#1A1A2E;">Hi ${name},</h2>
<p style="color:#333;">Your stay at Hotel Haven is confirmed!</p>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:6px 0;color:#5A6B7D;">Room</td><td style="font-weight:600;">${room}</td></tr>
<tr><td style="padding:6px 0;color:#5A6B7D;">Check-in</td><td style="font-weight:600;">${ci}</td></tr>
<tr><td style="padding:6px 0;color:#5A6B7D;">Check-out</td><td style="font-weight:600;">${co}</td></tr>
<tr><td style="padding:6px 0;color:#5A6B7D;">Plan</td><td style="font-weight:600;">${meal}</td></tr>
<tr><td style="padding:6px 0;color:#5A6B7D;">Code</td><td style="font-weight:600;color:#3B66E5;">${code}</td></tr>
</table></div>
<div style="padding:24px;">
<p style="color:#333;">Your guide PDF is attached — it covers ferry schedules, local tips, and must-visit spots.</p>
<p style="color:#333;">Questions? Call <strong>8900911010</strong> or WhatsApp <strong>9434270555</strong>.</p>
</div>
<div style="background:#1A1A2E;padding:20px;text-align:center;">
<p style="color:#999;font-size:12px;margin:0;">Hotel Haven — Dolly Gunj, Sri Vijaya Puram</p></div>
</div></body></html>`;
}
