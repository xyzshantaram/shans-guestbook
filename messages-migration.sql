CREATE TABLE IF NOT EXISTS messages(
    name TEXT DEFAULT "an anonymous user",
    message TEXT NOT NULL,
    added_on DATETIME DEFAULT CURRENT_TIMESTAMP
);