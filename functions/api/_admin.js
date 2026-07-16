// Admin dashboard HTML renderer
export function renderAdmin(bookings, created, sent) {
  const rows = bookings.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${escapeHtml(b.guest_name)}<br><small>${escapeHtml(b.guest_email)}</small></td>
      <td>${escapeHtml(b.room_type)}</td>
      <td>${escapeHtml(b.meal_plan)}</td>
      <td>${b.check_in}</td>
      <td>${b.check_out}</td>
      <td>₹${(b.total_amount || 0).toLocaleString('en-IN')}</td>
      <td><span class="${b.guide_sent ? 'sent' : 'pending'}">${b.guide_sent ? '✅ Sent' : '⏳ Pending'}</span></td>
      <td><code>${escapeHtml(b.check_in_code || '')}</code></td>
    </tr>
  `).join('');

  const alert = created
    ? `<div class="alert success">✅ Booking #${created} created! ${sent === 'yes' ? 'Guide sent!' : '⚠️ Guide failed'}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Hotel Haven — Admin</title>
<link rel="stylesheet" href="/admin.css">
</head>
<body>
<header><div class="header-inner">
<h1>🏨 Hotel Haven</h1>
<span class="badge">Admin Panel</span>
<a href="/" class="btn-link" target="_blank">View Site →</a>
</div></header>
<main>
<section class="card">
<h2>Bookings (${bookings.length})</h2>
${alert}
<div class="table-wrap">
<table><thead>
<tr><th>#</th><th>Guest</th><th>Room</th><th>Plan</th><th>Check-in</th><th>Check-out</th><th>Amount</th><th>Guide</th><th>Code</th>
</tr></thead><tbody>${rows}</tbody></table>
</div>
</section>
</main>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;color:#333}
header{background:linear-gradient(135deg,#1A1A2E,#3B66E5);color:#fff;padding:16px 24px}
.header-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:16px}
.badge{background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:13px}
.btn-link{color:#E9A443;margin-left:auto;text-decoration:none;font-weight:600}
main{max-width:1200px;margin:0 auto;padding:24px}
.card{background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);padding:24px;margin-bottom:24px}
h2{font-size:20px;margin-bottom:16px;color:#1A1A2E}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:14px}
th{background:#f8f9fa;padding:10px 12px;text-align:left;font-weight:600;border-bottom:2px solid #dee2e6}
td{padding:10px 12px;border-bottom:1px solid #eee}
.sent{color:#22c55e;font-weight:600}
.pending{color:#f59e0b;font-weight:600}
.alert{padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:14px}
.alert.success{background:#dcfce7;color:#166534;border:1px solid #bbf7d0}
code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px}
small{color:#666}
</style>
</body></html>`;
}

export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
