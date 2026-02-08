import requests
import json

def test_port_5001():
    print("Testing server on port 5001...")
    
    try:
        # Test health endpoint
        print("\n=== Health Endpoint ===")
        response = requests.get('http://127.0.0.1:5001/api/health', timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test admin login
        print("\n=== Admin Login ===")
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        response = requests.post(
            'http://127.0.0.1:5001/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_port_5001()
