"""Booking database — SQLite schema + CRUD."""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "bookings.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guest_name TEXT NOT NULL,
            guest_email TEXT NOT NULL,
            guest_phone TEXT NOT NULL,
            room_type TEXT NOT NULL,
            meal_plan TEXT NOT NULL DEFAULT 'EP',
            check_in DATE NOT NULL,
            check_out DATE NOT NULL,
            guests INTEGER NOT NULL DEFAULT 2,
            total_amount REAL,
            status TEXT NOT NULL DEFAULT 'confirmed',
            guide_sent INTEGER NOT NULL DEFAULT 0,
            check_in_code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()

def create_booking(guest_name, guest_email, guest_phone, room_type, meal_plan,
                   check_in, check_out, guests, total_amount):
    conn = get_conn()
    import random, string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    conn.execute("""
        INSERT INTO bookings (guest_name, guest_email, guest_phone, room_type,
                              meal_plan, check_in, check_out, guests, total_amount, check_in_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (guest_name, guest_email, guest_phone, room_type, meal_plan,
          check_in, check_out, guests, total_amount, code))
    booking_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.commit()
    conn.close()
    return booking_id, code

def get_all_bookings():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 50").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_booking(booking_id):
    conn = get_conn()
    row = conn.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def mark_guide_sent(booking_id):
    conn = get_conn()
    conn.execute("UPDATE bookings SET guide_sent=1 WHERE id=?", (booking_id,))
    conn.commit()
    conn.close()
