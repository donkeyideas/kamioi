"""
Test script to verify registration data is being stored correctly
"""
import requests
import json

BASE_URL = "http://localhost:5111"

def test_registration():
    """Test complete registration flow"""
    print("=" * 60)
    print("TESTING REGISTRATION FLOW")
    print("=" * 60)
    
    # Step 1: Register a user with all data
    print("\n1. Registering user with complete data...")
    registration_data = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpass123",
        "accountType": "individual",
        "phone": "555-1234",
        "address": "123 Test St",
        "city": "Test City",
        "state": "CA",
        "zipCode": "12345",
        "firstName": "Test",
        "lastName": "User",
        "annualIncome": "50000",
        "employmentStatus": "employed",
        "employer": "Test Company",
        "occupation": "Software Engineer",
        "roundUpAmount": 5.0,
        "riskTolerance": "moderate",
        "dateOfBirth": "1990-01-01",
        "ssnLast4": "1234",
        "country": "USA",
        "timezone": "America/Los_Angeles",
        "subscriptionPlanId": 1,
        "billingCycle": "monthly",
        "promoCode": "TEST2024"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/user/auth/register",
        json=registration_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if not result.get('success'):
        print("❌ Registration failed!")
        return
    
    user_guid = result.get('userGuid')
    user_id = result.get('userId')
    print(f"✅ User created: ID={user_id}, GUID={user_guid}")
    
    # Step 2: Complete registration with MX data
    print("\n2. Completing registration with MX data...")
    mx_data = {
        "accounts": [
            {
                "account_number": "1234567890",
                "account_type": "checking",
                "bank_name": "Test Bank"
            }
        ]
    }
    
    complete_data = {
        "userGuid": user_guid,
        "mxData": mx_data,
        "subscriptionPlanId": 1,
        "billingCycle": "monthly",
        "promoCode": "TEST2024"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/user/auth/complete-registration",
        json=complete_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    # Step 3: Login to get token
    print("\n3. Logging in...")
    login_data = {
        "email": "testuser@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/user/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if not result.get('success'):
        print("❌ Login failed!")
        return
    
    token = result.get('token')
    print(f"✅ Logged in, token: {token[:20]}...")
    
    # Step 4: Get user profile
    print("\n4. Fetching user profile...")
    response = requests.get(
        f"{BASE_URL}/api/user/profile",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if result.get('success'):
        profile = result.get('profile', {})
        print("\n✅ Profile Data Retrieved:")
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
    else:
        print("❌ Failed to get profile!")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_registration()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

