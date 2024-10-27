// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.sqlite');

// Create a users table if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT CHECK(role IN ('user', 'admin')) NOT NULL
        )
    `);
});

module.exports = db;
