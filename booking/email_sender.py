"""Send welcome guide email via Gmail API — with optional PDF attachment."""
import os, base64, mimetypes
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
TOKEN_PATH = os.path.expanduser("/mnt/Shared/hermes-home/profiles/friday/google_token.json")
GUIDE_PDF = os.path.join(os.path.dirname(__file__), "island-guide-2026.pdf")


def send_guide(guest_email, guest_name, html_content, pdf_path=None):
    """Send the welcome guide to a guest. Optionally attach a PDF.
    Returns True on success."""
    try:
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        if not creds.valid:
            creds.refresh(Request())

        service = build('gmail', 'v1', credentials=creds)

        msg = MIMEMultipart('mixed')
        msg['To'] = guest_email
        msg['From'] = 'Hotel Haven <havenandamanreservation@gmail.com>'

        alt = MIMEMultipart('alternative')
        alt.attach(MIMEText(html_content, 'html'))
        msg.attach(alt)

        # Attach PDF guide if it exists
        pdf = pdf_path or GUIDE_PDF
        if pdf and os.path.isfile(pdf):
            msg['Subject'] = f'Welcome to Hotel Haven, {guest_name}! — Your Island Guide'
            with open(pdf, 'rb') as f:
                part = MIMEBase('application', 'pdf')
                part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', 'attachment',
                                filename='Island_Guide_2026.pdf')
                msg.attach(part)
        else:
            msg['Subject'] = f'Welcome to Hotel Haven, {guest_name}! — Your Stay Guide'

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw}).execute()
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False
