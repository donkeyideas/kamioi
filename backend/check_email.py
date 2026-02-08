import sqlite3

# Check what email is actually in the database
conn = sqlite3.connect('kamioi.db')
cur = conn.cursor()

print("=== All Admin Users ===")
cur.execute("SELECT id, email, password, name, account_type FROM users WHERE account_type = 'admin'")
admin_users = cur.fetchall()

for user in admin_users:
    print(f"ID: {user[0]}")
    print(f"Email: '{user[1]}' (length: {len(user[1])})")
    print(f"Password: '{user[2]}' (length: {len(user[2])})")
    print(f"Name: {user[3]}")
    print(f"Type: {user[4]}")
    print(f"Email bytes: {user[1].encode()}")
    print(f"Password bytes: {user[2].encode()}")
    print("---")

conn.close()

