import sqlite3
import os

# Get the database path
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "kamioi.db")

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Creating password_reset_tokens table...")

# Create password_reset_tokens table
cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at REAL NOT NULL,
        created_at TEXT NOT NULL,
        used_at TEXT DEFAULT NULL
    )
""")

# Create index for faster lookups
cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
    ON password_reset_tokens(token)
""")

cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email 
    ON password_reset_tokens(email)
""")

# Clean up expired tokens (older than 24 hours)
cursor.execute("""
    DELETE FROM password_reset_tokens 
    WHERE expires_at < (strftime('%s', 'now') - 86400)
""")

conn.commit()
conn.close()

print("Password reset tokens table created successfully!")
print("Indexes created for performance optimization")
print("Expired tokens cleaned up")
