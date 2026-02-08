import sqlite3

conn = sqlite3.connect('kamioi.db')
cur = conn.cursor()
cur.execute("SELECT id, email, password, name, account_type FROM users WHERE account_type = 'admin'")
row = cur.fetchone()
print(f'ID: {row[0]}, Email: {row[1]}, Password: "{row[2]}", Name: {row[3]}, Type: {row[4]}')
print(f'Password length: {len(row[2])}')
print(f'Password bytes: {row[2].encode()}')
print(f'Password == "admin123": {row[2] == "admin123"}')
conn.close()

