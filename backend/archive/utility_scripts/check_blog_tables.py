import sqlite3

# Check if blog tables exist
conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Check for blog tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%blog%'")
blog_tables = cursor.fetchall()
print("Blog tables:", blog_tables)

# Check if blog_posts table exists and its structure
try:
    cursor.execute("PRAGMA table_info(blog_posts)")
    columns = cursor.fetchall()
    print("blog_posts columns:", columns)
except Exception as e:
    print("blog_posts table doesn't exist:", e)

conn.close()
