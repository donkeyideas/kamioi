"""Delete all transactions for user 108 to start fresh"""
from database_manager import db_manager

user_id = 108

print(f"\n=== Deleting All Transactions for User {user_id} ===")

# Get current count
transactions = db_manager.get_user_transactions(user_id, limit=1000, offset=0)
current_count = len(transactions)
print(f"Current transactions in database: {current_count}")

if current_count == 0:
    print("No transactions to delete.")
    exit(0)

# Confirm deletion
print(f"\n⚠️  WARNING: This will delete ALL {current_count} transactions for user {user_id}")
response = input("Type 'DELETE' to confirm: ")

if response != 'DELETE':
    print("Deletion cancelled.")
    exit(0)

# Delete transactions
conn = db_manager.get_connection()
try:
    if db_manager._use_postgresql:
        from sqlalchemy import text
        result = conn.execute(text('DELETE FROM transactions WHERE user_id = :uid'), {'uid': user_id})
        deleted_count = result.rowcount
        conn.commit()
        print(f"\n✅ Deleted {deleted_count} transactions from PostgreSQL")
    else:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM transactions WHERE user_id = ?', (user_id,))
        deleted_count = cursor.rowcount
        conn.commit()
        print(f"\n✅ Deleted {deleted_count} transactions from SQLite")
    
    # Verify deletion
    transactions_after = db_manager.get_user_transactions(user_id, limit=1000, offset=0)
    remaining_count = len(transactions_after)
    
    if remaining_count == 0:
        print(f"✅ Verification: All transactions deleted. Remaining: {remaining_count}")
    else:
        print(f"⚠️  Warning: {remaining_count} transactions still remain. Deletion may have failed.")
        
except Exception as e:
    import traceback
    print(f"\n❌ ERROR deleting transactions: {e}")
    print(traceback.format_exc())
    if db_manager._use_postgresql:
        conn.rollback()
    else:
        conn.rollback()
finally:
    if db_manager._use_postgresql:
        db_manager.release_connection(conn)
    else:
        conn.close()

print("\n=== Cleanup Complete ===")
print("Next steps:")
print("1. Restart backend server")
print("2. Clear browser localStorage (F12 → Application → Local Storage → Clear All)")
print("3. Refresh the page")
print("4. Upload bank file again")

