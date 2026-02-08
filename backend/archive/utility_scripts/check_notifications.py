import sqlite3

conn = sqlite3.connect('kamioi.db')
cur = conn.cursor()

# Check if notifications table exists
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cur.fetchall()
print('Available tables:')
for table in tables:
    print(f'- {table[0]}')

# Check notifications table structure if it exists
if any('notifications' in table[0] for table in tables):
    print('\nNotifications table structure:')
    cur.execute("PRAGMA table_info(notifications)")
    columns = cur.fetchall()
    for col in columns:
        print(f'- {col[1]} ({col[2]})')
    
    # Check notifications data
    print('\nNotifications data:')
    cur.execute("SELECT * FROM notifications LIMIT 5")
    notifications = cur.fetchall()
    if notifications:
        for n in notifications:
            print(f'ID: {n[0]}, User: {n[1]}, Title: {n[2]}, Message: {n[3]}, Type: {n[4]}, Read: {n[5]}, Created: {n[6]}')
    else:
        print('No notifications found')
else:
    print('\nNotifications table does not exist!')

conn.close()


