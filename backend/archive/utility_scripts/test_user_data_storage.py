"""
Test script to verify user data is being stored and retrieved correctly
"""
import requests
import json
import sys

BASE_URL = "http://localhost:5111"

def test_user_data():
    """Test that user data is stored and retrieved correctly"""
    print("=" * 60)
    print("TESTING USER DATA STORAGE")
    print("=" * 60)
    
    # Test email - use timestamp to ensure unique
    import time
    test_email = f"testuser{int(time.time())}@example.com"
    
    # Step 1: Register a user with complete data
    print(f"\n1. Registering user: {test_email}")
    registration_data = {
        "name": "Test User Complete",
        "email": test_email,
        "password": "testpass123",
        "accountType": "individual",
        "phone": "555-1234",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "CA",
        "zipCode": "12345",
        "firstName": "Test",
        "lastName": "User",
        "annualIncome": "75000",
        "employmentStatus": "employed",
        "employer": "Test Company Inc",
        "occupation": "Software Engineer",
        "roundUpAmount": 5.0,
        "riskTolerance": "moderate",
        "dateOfBirth": "1990-05-15",
        "ssnLast4": "5678",
        "country": "USA",
        "timezone": "America/Los_Angeles",
        "subscriptionPlanId": 1,
        "billingCycle": "monthly",
        "promoCode": "TEST2024"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/user/auth/register",
            json=registration_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
            return
        
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if not result.get('success'):
                print("[ERROR] Registration failed!")
                return
        
        user_guid = result.get('userGuid')
        user_id = result.get('userId')
        print(f"[OK] User created: ID={user_id}, GUID={user_guid}")
        
        # Step 2: Complete registration with MX data
        print(f"\n2. Completing registration with MX data...")
        complete_data = {
            "userGuid": user_guid,
            "mxData": {
                "accounts": [
                    {
                        "account_number": "1234567890",
                        "account_type": "checking",
                        "bank_name": "Test Bank"
                    }
                ]
            },
            "firstName": "Test",
            "lastName": "User",
            "phone": "555-1234",
            "address": "123 Test Street",
            "city": "Test City",
            "state": "CA",
            "zipCode": "12345",
            "annualIncome": "75000",
            "employmentStatus": "employed",
            "employer": "Test Company Inc",
            "occupation": "Software Engineer",
            "roundUpAmount": 5.0,
            "riskTolerance": "moderate",
            "subscriptionPlanId": 1,
            "billingCycle": "monthly",
            "promoCode": "TEST2024"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/auth/complete-registration",
            json=complete_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Step 3: Login to get token
        print(f"\n3. Logging in...")
        login_data = {
            "email": test_email,
            "password": "testpass123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        
        if not result.get('success'):
            print(f"❌ Login failed: {result}")
            return
        
        token = result.get('token')
        print(f"[OK] Logged in, token: {token[:20]}...")
        
        # Step 4: Get user profile
        print(f"\n4. Fetching user profile...")
        response = requests.get(
            f"{BASE_URL}/api/user/profile",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"\nProfile Response:")
        print(json.dumps(result, indent=2))
        
        if result.get('success'):
            profile = result.get('profile', {})
            print("\n[OK] Profile Data Retrieved:")
            print(f"  Name: {profile.get('name')}")
            print(f"  Email: {profile.get('email')}")
            print(f"  Phone: {profile.get('phone')}")
            print(f"  Address: {profile.get('streetAddress')}")
            print(f"  City: {profile.get('city')}")
            print(f"  State: {profile.get('state')}")
            print(f"  ZIP: {profile.get('zipCode')}")
            print(f"  First Name: {profile.get('firstName')}")
            print(f"  Last Name: {profile.get('lastName')}")
            print(f"  Annual Income: {profile.get('annualIncome')}")
            print(f"  Employment: {profile.get('employmentStatus')}")
            print(f"  Employer: {profile.get('employer')}")
            print(f"  Occupation: {profile.get('occupation')}")
            print(f"  Round Up: {profile.get('roundUpAmount')}")
            print(f"  Risk Tolerance: {profile.get('riskTolerance')}")
            print(f"  Bank Connected: {profile.get('hasBankConnection')}")
            print(f"  Subscription: {profile.get('subscription')}")
            
            # Verify data matches
            issues = []
            if profile.get('phone') != '555-1234':
                issues.append(f"Phone mismatch: expected '555-1234', got '{profile.get('phone')}'")
            if profile.get('city') != 'Test City':
                issues.append(f"City mismatch: expected 'Test City', got '{profile.get('city')}'")
            if profile.get('state') != 'CA':
                issues.append(f"State mismatch: expected 'CA', got '{profile.get('state')}'")
            if profile.get('firstName') != 'Test':
                issues.append(f"First name mismatch: expected 'Test', got '{profile.get('firstName')}'")
            if profile.get('lastName') != 'User':
                issues.append(f"Last name mismatch: expected 'User', got '{profile.get('lastName')}'")
            if profile.get('employer') != 'Test Company Inc':
                issues.append(f"Employer mismatch: expected 'Test Company Inc', got '{profile.get('employer')}'")
            
            if issues:
                print("\n[ERROR] DATA MISMATCHES FOUND:")
                for issue in issues:
                    print(f"  - {issue}")
            else:
                print("\n[OK] All data matches!")
        else:
            print("[ERROR] Failed to get profile!")
        
        print("\n" + "=" * 60)
        print("TEST COMPLETE")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("[ERROR] Cannot connect to server. Make sure Flask is running on port 5111")
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_data()

