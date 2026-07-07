"""Send welcome guide email via Gmail API."""
import os, base64, json
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
TOKEN_PATH = os.path.expanduser("/mnt/Shared/hermes-home/profiles/friday/google_token.json")

def send_guide(guest_email, guest_name, html_content):
    """Send the welcome guide to a guest. Returns True on success."""
    try:
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
        if not creds.valid:
            creds.refresh(Request())

        service = build('gmail', 'v1', credentials=creds)

        msg = MIMEText(html_content, 'html')
        msg['To'] = guest_email
        msg['Subject'] = f'Welcome to Hotel Haven, {guest_name}! — Your Stay Guide'
        msg['From'] = 'Hotel Haven <havenandamanreservation@gmail.com>'

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw}).execute()
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False
