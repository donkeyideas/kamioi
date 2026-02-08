import sqlite3

# Connect to database
conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Get user ID for abeltran@basktball.com
cursor.execute('SELECT id FROM users WHERE email = ?', ('abeltran@basktball.com',))
result = cursor.fetchone()
if result:
    user_id = result[0]
    print(f'Found user abeltran@basktball.com with ID: {user_id}')
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
    tables = [row[0] for row in cursor.fetchall()]
    print('Available tables:', tables)
    
    # Clear any family-related data that exists
    family_tables = [table for table in tables if 'family' in table.lower()]
    print('Family-related tables:', family_tables)
    
    for table in family_tables:
        try:
            # Check if table has family_id column
            cursor.execute(f'PRAGMA table_info({table})')
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'family_id' in columns:
                cursor.execute(f'DELETE FROM {table} WHERE family_id = ?', (user_id,))
                count = cursor.rowcount
                if count > 0:
                    print(f'Deleted {count} entries from {table}')
            elif 'user_id' in columns:
                cursor.execute(f'DELETE FROM {table} WHERE user_id = ?', (user_id,))
                count = cursor.rowcount
                if count > 0:
                    print(f'Deleted {count} entries from {table}')
        except Exception as e:
            print(f'Could not clear {table}: {e}')
    
    # Commit changes
    conn.commit()
    print('Family data cleared successfully!')
else:
    print('User abeltran@basktball.com not found')

conn.close()
