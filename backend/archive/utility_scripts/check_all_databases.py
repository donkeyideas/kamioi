"""Check transactions in both SQLite and PostgreSQL"""
import os
import sqlite3

print("\n=== Checking All Databases ===\n")

# Check SQLite
sqlite_paths = [
    'kamioi.db',
    'database.db',
    '../kamioi.db',
    '../database.db',
    os.path.join(os.path.dirname(__file__), 'kamioi.db'),
    os.path.join(os.path.dirname(__file__), 'database.db')
]

print("1. Checking SQLite databases...")
for db_path in sqlite_paths:
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = 108')
            count = cursor.fetchone()[0]
            if count > 0:
                print(f"   [FOUND] {count} transactions in SQLite: {db_path}")
                cursor.execute('SELECT id, merchant, amount, date, status FROM transactions WHERE user_id = 108 LIMIT 5')
                for row in cursor.fetchall():
                    print(f"      - ID: {row[0]}, Merchant: {row[1]}, Amount: ${row[2]}, Date: {row[3]}, Status: {row[4]}")
            conn.close()
        except Exception as e:
            print(f"   [ERROR] Error checking {db_path}: {e}")

# Check PostgreSQL
print("\n2. Checking PostgreSQL...")
try:
    from database_manager import db_manager
    
    # Force PostgreSQL connection
    if hasattr(db_manager, '_use_postgresql') and db_manager._use_postgresql:
        print("   [INFO] PostgreSQL is configured")
        conn = db_manager.get_connection()
        from sqlalchemy import text
        result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': 108})
        count = result.scalar() or 0
        if count > 0:
            print(f"   [FOUND] {count} transactions in PostgreSQL")
            result = conn.execute(text('SELECT id, merchant, amount, date, status FROM transactions WHERE user_id = :uid LIMIT 5'), {'uid': 108})
            for row in result:
                print(f"      - ID: {row[0]}, Merchant: {row[1]}, Amount: ${row[2]}, Date: {row[3]}, Status: {row[4]}")
        else:
            print(f"   [INFO] PostgreSQL has 0 transactions for user 108")
        db_manager.release_connection(conn)
    else:
        print("   [INFO] PostgreSQL not configured, using SQLite")
        
except Exception as e:
    print(f"   [ERROR] Error checking PostgreSQL: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Summary ===")
print("If transactions exist in SQLite but not PostgreSQL (or vice versa),")
print("there's a database mismatch. The app might be using a different database than expected.")

