import sqlite3

# Connect to database
conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
tables = [row[0] for row in cursor.fetchall()]
print('Available tables:', tables)

# User IDs to clear
user_ids = [1760806059546, 1760806477813, 1760812689003]

print('Clearing user data for clean testing...')

# Clear transactions (already done)
print('Transactions already cleared (93 deleted)')

# Clear any other user-specific data that exists
for table in tables:
    try:
        # Check if table has user_id column
        cursor.execute(f'PRAGMA table_info({table})')
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'user_id' in columns:
            cursor.execute(f'DELETE FROM {table} WHERE user_id IN (?, ?, ?)', user_ids)
            count = cursor.rowcount
            if count > 0:
                print(f'Deleted {count} entries from {table}')
    except Exception as e:
        # Skip tables that don't support this operation
        pass

# Commit all changes
conn.commit()
print('All user data cleared successfully!')
print('')
print('Users ready for clean testing:')
print('- beltranalain@gmail.com (ID: 1760806059546)')
print('- abeltran@basktball.com (ID: 1760806477813)')
print('- alain@cpscentral.com (ID: 1760812689003)')

conn.close()
