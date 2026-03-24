const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ALWAYS use local DB for now
const dbPath = path.join(__dirname, "database.db");

console.log("Using DB path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
    db.run("PRAGMA foreign_keys = ON");
  }
});

module.exports = db;