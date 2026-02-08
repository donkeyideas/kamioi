import sqlite3

conn = sqlite3.connect('kamioi.db')
cur = conn.cursor()

# Check what users exist
cur.execute("SELECT id, email, password, name, account_type FROM users")
users = cur.fetchall()
print('All users:')
for user in users:
    print(f'  ID: {user[0]}, Email: {user[1]}, Password: {user[2]}, Name: {user[3]}, Type: {user[4]}')

# Check for admin users specifically
cur.execute("SELECT id, email, password, name, account_type FROM users WHERE account_type = 'admin'")
admin_users = cur.fetchall()
print('\nAdmin users:')
for user in admin_users:
    print(f'  ID: {user[0]}, Email: {user[1]}, Password: {user[2]}, Name: {user[3]}, Type: {user[4]}')

conn.close()

