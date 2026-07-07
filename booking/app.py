"""Hotel Haven Booking Pipeline — FastAPI backend."""
import os, sys, json
from datetime import date, datetime
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, create_booking, get_all_bookings, get_booking, mark_guide_sent
from guide import build_guide_html
from email_sender import send_guide

app = FastAPI(title="Hotel Haven Booking Pipeline")

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

ROOMS = {
    "Standard Double AC": {"ep": 1200, "cp": 1500, "map": 2300, "ap": 3100, "max": 2},
    "Semi Deluxe Double AC": {"ep": 1600, "cp": 1800, "map": 2600, "ap": 3400, "max": 2},
    "Family Semi Deluxe AC": {"ep": 1800, "cp": 2200, "map": 3800, "ap": 5400, "max": 4},
    "Family Deluxe AC": {"ep": 2200, "cp": 2600, "map": 4200, "ap": 5800, "max": 4},
    "Deluxe Double AC": {"ep": 2500, "cp": 2800, "map": 3600, "ap": 4400, "max": 2},
}

MEAL_PLANS = {"EP": "Room Only", "CP": "Breakfast", "MAP": "Breakfast & Dinner", "AP": "All Meals"}

@app.on_event("startup")
def startup():
    init_db()

def render_admin(request, bookings=None, created=None, sent=None):
    if bookings is None:
        bookings = get_all_bookings()

    rooms_options = "".join(
        f'<option value="{name}" data-ep="{info["ep"]}" data-cp="{info["cp"]}" '
        f'data-map="{info["map"]}" data-ap="{info["ap"]}" data-max="{info["max"]}">'
        f'{name} (max {info["max"]} guests)</option>'
        for name, info in ROOMS.items()
    )

    meal_options = "".join(
        f'<option value="{k}">{k} — {v}</option>' for k, v in MEAL_PLANS.items()
    )

    alert_html = ""
    if created:
        guide_status = "✅ Guide emailed!" if sent else "⚠️ Guide failed to send"
        alert_html = f'<div class="alert success">✅ Booking #{created} created! {guide_status}</div>'

    rows_html = "".join(
        f'<tr>'
        f'<td>{b["id"]}</td>'
        f'<td>{b["guest_name"]}<br><small>{b["guest_email"]}</small></td>'
        f'<td>{b["room_type"]}</td>'
        f'<td>{b["meal_plan"]}</td>'
        f'<td>{b["check_in"]}</td>'
        f'<td>{b["check_out"]}</td>'
        f'<td>₹{b["total_amount"] or 0:.0f}</td>'
        f'<td><span class="{"sent" if b["guide_sent"] else "pending"}">{"✅ Sent" if b["guide_sent"] else "⏳ Pending"}</span></td>'
        f'<td><code>{b["check_in_code"]}</code></td>'
        f'</tr>'
        for b in bookings
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Haven — Admin</title>
  <link rel="stylesheet" href="/static/admin.css">
</head>
<body>
  <header>
    <div class="header-inner">
      <h1>🏨 Hotel Haven</h1>
      <span class="badge">Admin Panel</span>
      <a href="/" class="btn-link" target="_blank">View Site →</a>
    </div>
  </header>
  <main>
    <section class="card">
      <h2>New Booking</h2>
      {alert_html}
      <form method="POST" action="/api/booking" class="booking-form">
        <div class="form-row">
          <div class="form-group">
            <label>Guest Name</label>
            <input type="text" name="guest_name" required placeholder="Full name">
          </div>
          <div class="form-group">
            <label>Guest Email</label>
            <input type="email" name="guest_email" required placeholder="guest@email.com">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" name="guest_phone" required placeholder="Phone number">
          </div>
          <div class="form-group">
            <label>Room Type</label>
            <select name="room_type" required id="roomSelect" onchange="updatePrice()">
              {rooms_options}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Meal Plan</label>
            <select name="meal_plan" required id="mealSelect" onchange="updatePrice()">
              {meal_options}
            </select>
          </div>
          <div class="form-group">
            <label>Guests</label>
            <input type="number" name="guests" id="guestsInput" value="2" min="1" max="4" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Check-in</label>
            <input type="date" name="check_in" required>
          </div>
          <div class="form-group">
            <label>Check-out</label>
            <input type="date" name="check_out" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Total: <span id="priceDisplay">₹1,200</span> /night</label>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Create Booking & Send Guide</button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Recent Bookings</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Guest</th><th>Room</th><th>Plan</th>
              <th>Check-in</th><th>Check-out</th><th>Amount</th><th>Guide</th><th>Code</th>
            </tr>
          </thead>
          <tbody>
            {rows_html}
          </tbody>
        </table>
      </div>
    </section>
  </main>
  <script>
    const rooms = {json.dumps(ROOMS)};
    function updatePrice() {{
      const sel = document.getElementById('roomSelect');
      const meal = document.getElementById('mealSelect');
      const r = rooms[sel.value];
      if (!r) return;
      const rate = r[meal.value.toLowerCase()] || r.ep;
      document.getElementById('priceDisplay').textContent = '₹' + Number(rate).toLocaleString('en-IN');
    }}
    updatePrice();
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(el => el.min = today);
  </script>
</body>
</html>"""
    return html

@app.get("/admin", response_class=HTMLResponse)
def admin_dashboard(request: Request):
    created = request.query_params.get("created")
    sent = request.query_params.get("sent")
    if sent == "yes":
        sent = True
    elif sent == "no":
        sent = False
    else:
        sent = None
    return render_admin(request, created=created, sent=sent)

@app.post("/api/booking")
def add_booking(
    guest_name: str = Form(...),
    guest_email: str = Form(...),
    guest_phone: str = Form(...),
    room_type: str = Form(...),
    meal_plan: str = Form(...),
    check_in: str = Form(...),
    check_out: str = Form(...),
    guests: int = Form(...),
):
    room = ROOMS.get(room_type)
    if not room:
        raise HTTPException(400, "Invalid room type")

    ci = datetime.strptime(check_in, "%Y-%m-%d")
    co = datetime.strptime(check_out, "%Y-%m-%d")
    nights = (co - ci).days
    if nights < 1:
        raise HTTPException(400, "Check-out must be after check-in")

    rate_key = meal_plan.lower()
    rate = room.get(rate_key, room["ep"])
    total = rate * nights

    booking_id, code = create_booking(
        guest_name, guest_email, guest_phone, room_type,
        meal_plan, check_in, check_out, guests, total
    )

    guide_html = build_guide_html(guest_name, room_type, check_in, check_out,
                                  f"{meal_plan} ({MEAL_PLANS.get(meal_plan, '')})", code)
    sent = send_guide(guest_email, guest_name, guide_html)
    if sent:
        mark_guide_sent(booking_id)

    return RedirectResponse(url=f"/admin?created={booking_id}&sent={'yes' if sent else 'no'}", status_code=302)


@app.get("/api/bookings")
def list_bookings():
    return get_all_bookings()


@app.get("/api/booking/{booking_id}")
def get_single_booking(booking_id: int):
    b = get_booking(booking_id)
    if not b:
        raise HTTPException(404, "Booking not found")
    return b


@app.post("/api/booking/{booking_id}/resend-guide")
def resend_guide(booking_id: int):
    b = get_booking(booking_id)
    if not b:
        raise HTTPException(404, "Booking not found")

    guide_html = build_guide_html(
        b["guest_name"], b["room_type"], b["check_in"], b["check_out"],
        f"{b['meal_plan']} ({MEAL_PLANS.get(b['meal_plan'], '')})", b["check_in_code"]
    )
    sent = send_guide(b["guest_email"], b["guest_name"], guide_html)
    if sent:
        mark_guide_sent(booking_id)
    return {"sent": sent}


def main():
    uvicorn.run(app, host="0.0.0.0", port=8085)

if __name__ == "__main__":
    main()
