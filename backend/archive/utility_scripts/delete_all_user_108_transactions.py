"""Delete ALL transactions for user 108 from both SQLite and PostgreSQL"""
import os
import sqlite3

print("\n=== Deleting ALL Transactions for User 108 ===\n")

user_id = 108
deleted_total = 0

# 1. Delete from SQLite
sqlite_paths = [
    'kamioi.db',
    'database.db',
    os.path.join(os.path.dirname(__file__), 'kamioi.db'),
    os.path.join(os.path.dirname(__file__), 'database.db')
]

print("1. Checking SQLite databases...")
for db_path in sqlite_paths:
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
            count = cursor.fetchone()[0]
            if count > 0:
                print(f"   Found {count} transactions in: {db_path}")
                cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
                deleted = cursor.rowcount
                conn.commit()
                print(f"   Deleted {deleted} transactions from SQLite")
                deleted_total += deleted
            conn.close()
        except Exception as e:
            print(f"   Error with {db_path}: {e}")

# 2. Delete from PostgreSQL
print("\n2. Checking PostgreSQL...")
try:
    from database_manager import db_manager
    
    if hasattr(db_manager, '_use_postgresql') and db_manager._use_postgresql:
        conn = db_manager.get_connection()
        from sqlalchemy import text
        result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
        count = result.scalar() or 0
        if count > 0:
            print(f"   Found {count} transactions in PostgreSQL")
            result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
            deleted = result.rowcount
            conn.commit()
            print(f"   Deleted {deleted} transactions from PostgreSQL")
            deleted_total += deleted
        db_manager.release_connection(conn)
    else:
        print("   PostgreSQL not configured")
        
except Exception as e:
    print(f"   Error checking PostgreSQL: {e}")

print(f"\n=== Total Deleted: {deleted_total} transactions ===")
print("\nNext steps:")
print("1. Restart backend server")
print("2. Clear browser localStorage (F12 -> Application -> Local Storage -> Clear All)")
print("3. Refresh the page")
print("4. Upload bank file again")

