import requests
import json

def test_server_info():
    print("Testing server information...")
    
    try:
        # Test health endpoint
        print("\n=== Health Endpoint ===")
        response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test root endpoint
        print("\n=== Root Endpoint ===")
        response = requests.get('http://127.0.0.1:5000/', timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test a non-existent endpoint to see error format
        print("\n=== Non-existent Endpoint ===")
        response = requests.get('http://127.0.0.1:5000/api/nonexistent', timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_server_info()
