import sqlite3

conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()
cursor.execute("SELECT token FROM users WHERE role = 'admin' LIMIT 1")
result = cursor.fetchone()
print('Admin token:', result[0] if result else 'No admin found')
conn.close()


