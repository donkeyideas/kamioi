import requests
import time

def test_server_simple():
    print("Testing server connection...")
    
    # Wait for server to start
    time.sleep(2)
    
    try:
        # Test health endpoint
        response = requests.get('http://127.0.0.1:5000/api/health', timeout=5)
        print(f"Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print("Server is running!")
            return True
        else:
            print(f"Health response: {response.text}")
            return False
    except Exception as e:
        print(f"Server not responding: {e}")
        return False

if __name__ == "__main__":
    test_server_simple()
