#!/usr/bin/env python3
"""
Test Flask Routes - Check if routes are working properly
"""

from app import app

def test_flask_routes():
    """Test Flask routes directly"""
    print("=== FLASK ROUTES TEST ===")
    print()
    
    with app.test_client() as client:
        # Test health endpoint
        print("1. Testing health endpoint...")
        resp = client.get('/api/health')
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.data.decode()[:100]}")
        
        # Test user login endpoint
        print("\n2. Testing user login endpoint...")
        resp = client.post('/api/user/auth/login', json={'email': 'user5@user5.com', 'password': 'user5'})
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.data.decode()[:200]}")
        
        # Test admin login endpoint
        print("\n3. Testing admin login endpoint...")
        resp = client.post('/api/admin/auth/login', json={'email': 'info@kamioi.com', 'password': 'admin123'})
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.data.decode()[:200]}")
        
        # Test user transactions endpoint (should fail without auth)
        print("\n4. Testing user transactions endpoint...")
        resp = client.get('/api/user/transactions')
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {resp.data.decode()[:200]}")
    
    print("\n=== FLASK ROUTES TEST COMPLETE ===")

if __name__ == "__main__":
    test_flask_routes()
