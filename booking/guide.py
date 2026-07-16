"""Welcome guide content for Hotel Haven guests — sent as HTML email."""

def build_guide_html(guest_name, room_type, check_in, check_out, meal_plan, check_in_code):
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1A1A2E 0%, #3B66E5 100%); padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Hotel Haven</h1>
      <p style="color: #E9A443; margin: 8px 0 0; font-size: 16px;">Your booking is confirmed!</p>
    </div>

    <!-- Booking Details -->
    <div style="padding: 24px; background: #FFF5EE;">
      <h2 style="color: #1A1A2E; font-size: 18px; margin: 0 0 16px;">Booking Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #5A6B7D; width: 40%;">Guest</td><td style="padding: 8px 0; font-weight: 600;">{guest_name}</td></tr>
        <tr><td style="padding: 8px 0; color: #5A6B7D;">Room</td><td style="padding: 8px 0; font-weight: 600;">{room_type}</td></tr>
        <tr><td style="padding: 8px 0; color: #5A6B7D;">Check-in</td><td style="padding: 8px 0; font-weight: 600;">{check_in}</td></tr>
        <tr><td style="padding: 8px 0; color: #5A6B7D;">Check-out</td><td style="padding: 8px 0; font-weight: 600;">{check_out}</td></tr>
        <tr><td style="padding: 8px 0; color: #5A6B7D;">Meal Plan</td><td style="padding: 8px 0; font-weight: 600;">{meal_plan}</td></tr>
        <tr><td style="padding: 8px 0; color: #5A6B7D;">Code</td><td style="padding: 8px 0; font-weight: 600; color: #3B66E5;">{check_in_code}</td></tr>
      </table>
    </div>

    <!-- Welcome Guide -->
    <div style="padding: 24px;">
      <h2 style="color: #1A1A2E; font-size: 18px; margin: 0 0 16px;">Your Stay Guide</h2>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; color: #3B66E5; margin: 0 0 8px;">📍 Location</h3>
        <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">
          Govt. Polytechnic Road, Dolly Gunj, Sri Vijaya Puram<br>
          Airport: 2.5 km | Harbour: 4 km | Cellular Jail: 4 km
        </p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; color: #3B66E5; margin: 0 0 8px;">🏨 Facilities</h3>
        <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">
          ✓ In-house restaurant ✓ Free Wi-Fi ✓ Intercom ✓ 24-hr water<br>
          ✓ Geyser ✓ Laundry on call ✓ Two-wheeler rental ✓ Airport transfer
        </p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; color: #3B66E5; margin: 0 0 8px;">🛵 Explore Sri Vijaya Puram</h3>
        <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">
          • Cellular Jail & Light & Sound Show (4 km)<br>
          • Corbyn's Cove Beach (5 km)<br>
          • Anthropological Museum (3.5 km)<br>
          • Marina Park & Aquarium (4 km)<br>
          • Ferry to Swaraj Dweep / Shaheed Dweep (Neil) (from Haddo Harbour, 4 km)
        </p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; color: #3B66E5; margin: 0 0 8px;">🍽️ Meal Plans</h3>
        <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">
          <strong>EP</strong> — Room only<br>
          <strong>CP</strong> — Breakfast included<br>
          <strong>MAP</strong> — Breakfast & Dinner<br>
          <strong>AP</strong> — Breakfast, Lunch & Dinner
        </p>
      </div>

      <div style="background: #f8f9fa; border-radius: 8px; padding: 16px;">
        <h3 style="font-size: 14px; color: #3B66E5; margin: 0 0 8px;">📞 Contact</h3>
        <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.5;">
          Phone: <a href="tel:+918900911010" style="color: #3B66E5;">8900911010</a><br>
          WhatsApp: <a href="https://wa.me/919434270555" style="color: #3B66E5;">9434270555</a><br>
          Email: havenandamanreservation@gmail.com
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #1A1A2E; padding: 20px 24px; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">Hotel Haven — Dolly Gunj, Sri Vijaya Puram, Andaman Islands</p>
      <p style="color: #666; font-size: 11px; margin: 8px 0 0;">We look forward to welcoming you!</p>
    </div>
  </div>
</body>
</html>"""
