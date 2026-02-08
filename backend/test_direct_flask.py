#!/usr/bin/env python3
"""
Test Flask app directly using test client - bypasses HTTP server
"""
import sys
sys.path.insert(0, '.')

print("=" * 80)
print("Testing Flask app directly (bypassing HTTP server)")
print("=" * 80)
print()

try:
    from app import app
    
    print("App imported successfully")
    print("Creating test client...")
    
    with app.test_client() as client:
        print("Making request to /api/test...")
        response = client.get('/api/test')
        
        print(f"\nResponse Status Code: {response.status_code}")
        print(f"Response Data: {response.data}")
        print(f"Response Text: {response.get_data(as_text=True)}")
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Flask app is working correctly")
        else:
            print(f"\n❌ FAILED with status {response.status_code}")
            print("Check the output above for error details")
            
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)

