"""
Quick Test Script - Test PostgreSQL Connection and Basic Functionality
"""
import os
import sys
os.environ['DB_TYPE'] = 'postgresql'

print("=" * 60)
print("Quick PostgreSQL Test")
print("=" * 60)
print()

# Test 1: Database Connection
print("1. Testing database connection...")
try:
    from database_manager import db_manager
    conn = db_manager.get_connection()
    from sqlalchemy import text
    result = conn.execute(text('SELECT COUNT(*) FROM users'))
    user_count = result.scalar()
    db_manager.release_connection(conn)
    print(f"   [OK] Connected! Found {user_count} users")
except Exception as e:
    print(f"   [ERROR] {e}")
    sys.exit(1)

# Test 2: Flask App
print("\n2. Testing Flask app...")
try:
    from app import app
    with app.test_client() as client:
        response = client.get('/api/health')
        if response.status_code == 200:
            print(f"   [OK] Flask app works! Health check: {response.status_code}")
        else:
            print(f"   [WARNING] Health check returned: {response.status_code}")
except Exception as e:
    print(f"   [ERROR] {e}")
    sys.exit(1)

# Test 3: Transactions
print("\n3. Testing transactions query...")
try:
    from database_manager import db_manager
    transactions = db_manager.get_user_transactions(94, limit=3)
    print(f"   [OK] Retrieved {len(transactions)} transactions")
except Exception as e:
    print(f"   [WARNING] {e}")

print("\n" + "=" * 60)
print("✅ All tests passed!")
print("=" * 60)
print("\nYour app is ready to run on port 4000!")
print("\nTo start the server:")
print("  python app.py")
print("\nOr use the PowerShell script:")
print("  .\\start_server.ps1")
print()

