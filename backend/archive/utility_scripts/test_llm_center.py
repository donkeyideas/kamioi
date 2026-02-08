"""Test script to check LLM Center endpoints"""
import requests
import json

BASE_URL = "http://127.0.0.1:5111"

# You'll need to get a valid admin token first
# For testing, we'll try without auth first to see the error
ADMIN_TOKEN = None  # Set this if you have a token

def test_llm_center_endpoints():
    """Test LLM Center endpoints"""
    print("=" * 60)
    print("Testing LLM Center Endpoints")
    print("=" * 60)
    
    headers = {}
    if ADMIN_TOKEN:
        headers['Authorization'] = f'Bearer {ADMIN_TOKEN}'
    
    endpoints = [
        ("GET", "/api/admin/llm-center/dashboard", "LLM Center Dashboard"),
        ("GET", "/api/admin/llm-center/mappings", "LLM Mappings"),
        ("GET", "/api/admin/llm-center/queue", "LLM Queue"),
        ("GET", "/api/admin/llm-center/processing-stats", "Processing Stats"),
        ("GET", "/api/admin/llm-center/automation/realtime", "Automation Realtime"),
        ("GET", "/api/admin/llm-center/automation/batch", "Automation Batch"),
        ("GET", "/api/admin/llm-center/automation/learning", "Automation Learning"),
        ("GET", "/api/admin/llm-center/automation/merchants", "Automation Merchants"),
        ("GET", "/api/admin/llm-center/automation/thresholds", "Automation Thresholds"),
        ("GET", "/api/admin/llm-center/automation/multi-model", "Automation Multi-Model"),
    ]
    
    for method, endpoint, name in endpoints:
        print(f"\n{name} ({method} {endpoint})")
        print("-" * 60)
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            
            print(f"Status: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"[OK] Response received")
                    if isinstance(data, dict):
                        print(f"Keys: {list(data.keys())[:10]}")  # Show first 10 keys
                except:
                    print(f"[OK] Response received (not JSON)")
            elif response.status_code == 401:
                print(f"[AUTH] Authentication required")
            elif response.status_code == 500:
                print(f"[ERROR] 500 Internal Server Error")
                try:
                    error_data = response.json()
                    print(f"Error: {error_data}")
                except:
                    print(f"Error body: {response.text[:200]}")
            else:
                print(f"[WARNING] Status {response.status_code}")
                print(f"Response: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            print(f"[ERROR] Connection refused - Server not running?")
        except requests.exceptions.Timeout:
            print(f"[ERROR] Request timeout")
        except Exception as e:
            print(f"[ERROR] {type(e).__name__}: {e}")
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)
    print("\nNote: If you see 401 errors, you need to set ADMIN_TOKEN in this script")
    print("Get a token by logging in at http://localhost:4000/admin-login")

if __name__ == "__main__":
    test_llm_center_endpoints()

