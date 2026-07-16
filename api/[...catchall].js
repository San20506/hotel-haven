// Vercel Serverless Function — Hotel Haven API
// Handles all /api/* routes + /admin
// Database: Turso (libsql) — set LIBSQL_URL + LIBSQL_AUTH_TOKEN in Vercel env vars

import { createClient } from '@libsql/client';

function getDb() {
  return createClient({
    url: process.env.LIBSQL_URL || process.env.TURSO_DATABASE_URL,
    authToken: process.env.LIBSQL_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
  });
}

const ROOMS = {
  'Standard Double AC': { ep: 1200, cp: 1400, map: 2200, ap: 3000, max: 2 },
  'Semi Deluxe Double AC': { ep: 1600, cp: 1800, map: 2600, ap: 3400, max: 2 },
  'Family Semi Deluxe AC': { ep: 1800, cp: 2200, map: 3800, ap: 5400, max: 4 },
  'Family Deluxe AC': { ep: 2200, cp: 2500, map: 4100, ap: 5700, max: 4 },
  'Deluxe Double AC': { ep: 2500, cp: 2600, map: 3400, ap: 4200, max: 2 },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Read request body for form/url-encoded POST
async function readBody(req) {
  if (req.body) return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    return res.end();
  }

  try {
    const db = getDb();

    // POST /api/freebie-guide
    if (path === '/api/freebie-guide' && req.method === 'POST') {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const name = params.get('name');
      const email = params.get('email');

      if (!name || !email) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ sent: false, error: 'Name and email required' }));
      }

      const sent = await sendGuideEmail(name, email);

      if (db) {
        await db.execute({
          sql: 'INSERT INTO guide_signups (name, email, guide_sent) VALUES (?, ?, ?)',
          args: [name, email, sent ? 1 : 0],
        });
      }

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ sent, name }));
    }

    // POST /api/booking
    if (path === '/api/booking' && req.method === 'POST') {
      const body = await readBody(req);
      const params = new URLSearchParams(body);
      const guest_name = params.get('guest_name');
      const guest_email = params.get('guest_email');
      const guest_phone = params.get('guest_phone');
      const room_type = params.get('room_type');
      const meal_plan = params.get('meal_plan');
      const check_in = params.get('check_in');
      const check_out = params.get('check_out');
      const guests = parseInt(params.get('guests') || '2');

      const room = ROOMS[room_type];
      if (!room) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid room' }));
      }

      const ci = new Date(check_in);
      const co = new Date(check_out);
      const nights = Math.max(1, (co - ci) / (1000 * 60 * 60 * 24));
      const rate = room[meal_plan?.toLowerCase()] || room.ep;
      const total = rate * nights;
      const code = generateCode();

      const result = await db.execute({
        sql: `INSERT INTO bookings (guest_name, guest_email, guest_phone, room_type, meal_plan,
             check_in, check_out, guests, total_amount, check_in_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [guest_name, guest_email, guest_phone, room_type, meal_plan,
               check_in, check_out, guests, total, code],
      });

      const bookingId = Number(result.lastInsertRowid);

      const guideHtml = buildGuideHtml(guest_name, room_type, check_in, check_out, meal_plan, code);
      const sent = await sendGuideEmail(guest_name, guest_email, guideHtml);

      if (sent && db) {
        await db.execute({
          sql: 'UPDATE bookings SET guide_sent = 1 WHERE id = ?',
          args: [bookingId],
        });
      }

      res.writeHead(302, { Location: `/admin?created=${bookingId}&sent=${sent ? 'yes' : 'no'}` });
      return res.end();
    }

    // GET /api/bookings
    if (path === '/api/bookings' && req.method === 'GET') {
      const { rows } = await db.execute('SELECT * FROM bookings ORDER BY created_at DESC');
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(rows));
    }

    // GET /api/booking/:id
    if (path.startsWith('/api/booking/') && req.method === 'GET') {
      const segments = path.split('/');
      const id = segments[segments.length - 1];
      if (id === 'resend-guide') {
        res.writeHead(404);
        return res.end('Not found');
      }
      const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [parseInt(id)] });
      if (!rows.length) {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not found' }));
      }
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(rows[0]));
    }

    // POST /api/booking/:id/resend-guide
    const resendMatch = path.match(/\/api\/booking\/(\d+)\/resend-guide$/);
    if (resendMatch && req.method === 'POST') {
      const id = parseInt(resendMatch[1]);
      const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
      if (!rows.length) {
        res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Not found' }));
      }
      const b = rows[0];
      const guideHtml = buildGuideHtml(b.guest_name, b.room_type, b.check_in, b.check_out, b.meal_plan, b.check_in_code);
      const sent = await sendGuideEmail(b.guest_name, b.guest_email, guideHtml);
      if (sent && db) {
        await db.execute({ sql: 'UPDATE bookings SET guide_sent = 1 WHERE id = ?', args: [id] });
      }
      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ sent }));
    }

    // GET /admin
    if (path === '/admin' && req.method === 'GET') {
      const { rows } = await db.execute('SELECT * FROM bookings ORDER BY created_at DESC');
      const created = url.searchParams.get('created');
      const sent = url.searchParams.get('sent');
      const html = renderAdmin(rows, created, sent);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    res.writeHead(404);
    res.end('Not found');

  } catch (err) {
    console.error('API error:', err);
    res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// --- Email sender via Resend ---
async function sendGuideEmail(name, email, htmlContent) {
  const apiKey = process.env.RESEND_API_KEY;
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
        from: process.env.RESEND_FROM || 'Hotel Haven <haven@yourdomain.com>',
        to: email,
        subject: `Welcome to Hotel Haven, ${name}! — Your Island Guide`,
        html,
        attachments: [
          {
            filename: 'Island_Guide_2026.pdf',
            path: `${process.env.SITE_URL || 'https://yourdomain.com'}/island-guide-2026.pdf`,
          },
        ],
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Resend error:', err);
    return false;
  }
}

// --- HTML builders (unchanged from original) ---
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

// --- Admin dashboard renderer ---
function renderAdmin(bookings, created, sent) {
  const roomsOptions = Object.entries(ROOMS).map(([name, info]) =>
    `<option value="${name}" data-ep="${info.ep}" data-cp="${info.cp}" data-map="${info.map}" data-ap="${info.ap}" data-max="${info.max}">${name}</option>`
  ).join('\n');

  const bookingRows = (bookings || []).map(b =>
    `<tr>
      <td>${b.id}</td>
      <td>${b.guest_name}</td>
      <td>${b.guest_email}</td>
      <td>${b.room_type}</td>
      <td>${b.check_in}</td>
      <td>${b.check_out}</td>
      <td>₹${b.total_amount}</td>
      <td><code>${b.check_in_code}</code></td>
      <td><button onclick="resendGuide(${b.id})" ${b.guest_email ? '' : 'disabled'}>Resend Guide</button></td>
    </tr>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Hotel Haven — Admin</title>
<link rel="stylesheet" href="/admin.css">
${created ? `<script>alert('Booking #${created} created! Guide ${sent === 'yes' ? 'sent' : 'NOT sent (check RESEND_API_KEY)'}');</script>` : ''}
<script>
async function resendGuide(id) {
  const res = await fetch('/api/booking/'+id+'/resend-guide', {method:'POST'});
  const data = await res.json();
  alert(data.sent ? 'Guide resent!' : 'Failed to send guide');
}
</script></head>
<body>
<div class="admin-container">
<header><h1>Hotel Haven — Admin</h1><a href="/" class="back-link">← Back to site</a></header>
<section class="booking-form"><h2>New Booking</h2>
<form action="/api/booking" method="POST">
<div class="form-row"><input name="guest_name" placeholder="Guest name" required>
<input name="guest_email" type="email" placeholder="Email" required>
<input name="guest_phone" type="tel" placeholder="Phone"></div>
<div class="form-row"><select name="room_type" id="room-type" required>${roomsOptions}</select>
<select name="meal_plan"><option value="EP">Room Only</option><option value="CP">Breakfast</option><option value="MAP">Breakfast & Dinner</option><option value="AP">All Meals</option></select></div>
<div class="form-row"><input name="check_in" type="date" required>
<input name="check_out" type="date" required>
<input name="guests" type="number" min="1" max="8" value="2"></div>
<button type="submit">Create Booking</button>
</form></section>
<section class="bookings-list"><h2>All Bookings</h2>
<table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Code</th><th></th></tr></thead>
<tbody>${bookingRows || '<tr><td colspan="9">No bookings yet</td></tr>'}</tbody></table></section></div></body></html>`;
}
