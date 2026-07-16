-- Migration 0001: Initial Hotel Haven schema
-- Cloudflare D1 (SQLite-compatible)

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    room_type TEXT NOT NULL,
    meal_plan TEXT NOT NULL DEFAULT 'CP',
    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,
    guests INTEGER NOT NULL DEFAULT 2,
    total_amount REAL,
    guide_sent INTEGER NOT NULL DEFAULT 0,
    check_in_code TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS guide_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    guide_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
