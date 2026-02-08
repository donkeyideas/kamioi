import requests
import json

print("Testing backend connectivity...")
print("=" * 50)

# Test 1: Health endpoint
try:
    response = requests.get("http://127.0.0.1:5000/api/health")
    print(f"[OK] Health endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"[FAIL] Health endpoint failed: {e}")

print()

# Test 2: User login endpoint
try:
    response = requests.post(
        "http://127.0.0.1:5000/api/user/auth/login",
        json={"email": "test@test.com", "password": "password"},
        headers={"Content-Type": "application/json"}
    )
    status = "[OK]" if response.status_code == 200 else "[FAIL]"
    print(f"{status} User login: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"[FAIL] User login failed: {e}")

print()

# Test 3: Check what routes are available
try:
    response = requests.get("http://127.0.0.1:5000/")
    print(f"[OK] Root endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"[FAIL] Root endpoint failed: {e}")
