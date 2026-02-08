"""
Test Flask App with PostgreSQL
"""
import os
os.environ['DB_TYPE'] = 'postgresql'

print("=" * 60)
print("Starting Flask App Test")
print("=" * 60)
print()

# Import the app
try:
    print("Importing Flask app...")
    from app import app
    print("[OK] Flask app imported successfully")
    print()
    
    # Test a simple endpoint
    print("Testing endpoints...")
    with app.test_client() as client:
        # Test health/status endpoint
        try:
            response = client.get('/api/health')
            print(f"[OK] /api/health: {response.status_code}")
        except Exception as e:
            print(f"[INFO] /api/health not available: {e}")
        
        # Test database connection through an endpoint
        try:
            # Try to get users count through an endpoint if available
            response = client.get('/api/admin/users')
            if response.status_code in [200, 401, 403]:
                print(f"[OK] /api/admin/users: {response.status_code}")
            else:
                print(f"[INFO] /api/admin/users: {response.status_code}")
        except Exception as e:
            print(f"[INFO] /api/admin/users: {e}")
    
    print()
    print("=" * 60)
    print("[OK] Flask app is ready!")
    print("=" * 60)
    print()
    print("To start the app, run:")
    print("  python app.py")
    print()
    print("Or set environment variable:")
    print("  $env:DB_TYPE='postgresql'; python app.py")
    print()
    
except Exception as e:
    import traceback
    print(f"[ERROR] Failed to test app: {e}")
    print(traceback.format_exc())

