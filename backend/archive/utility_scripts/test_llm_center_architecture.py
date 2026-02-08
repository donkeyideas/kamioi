#!/usr/bin/env python3

import requests
import json

def test_llm_center_architecture():
    """Test the new LLM Center architecture with proper data separation"""
    print("TESTING LLM CENTER ARCHITECTURE")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Admin Login
    print("\n1. Testing Admin Login...")
    login_data = {
        "email": "info@kamioi.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result.get('token')
                print(f"[OK] Admin login successful, token: {token[:20]}...")
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
                return
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
            return
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test 2: Test Pending Mappings Endpoint
    print("\n2. Testing Pending Mappings Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/pending-mappings", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                mappings = result.get('data', {}).get('mappings', [])
                print(f"[OK] Pending mappings endpoint working: {len(mappings)} user-submitted mappings")
            else:
                print(f"[FAIL] Pending mappings failed: {result.get('error')}")
        else:
            print(f"[FAIL] Pending mappings status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Pending mappings error: {e}")
    
    # Test 3: Test Approved Mappings Endpoint
    print("\n3. Testing Approved Mappings Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/approved-mappings", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                mappings = result.get('data', {}).get('mappings', [])
                print(f"[OK] Approved mappings endpoint working: {len(mappings)} admin-approved mappings")
            else:
                print(f"[FAIL] Approved mappings failed: {result.get('error')}")
        else:
            print(f"[FAIL] Approved mappings status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Approved mappings error: {e}")
    
    # Test 4: Test Auto Mappings Endpoint
    print("\n4. Testing Auto Mappings Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/auto-mappings", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                mappings = result.get('data', {}).get('mappings', [])
                print(f"[OK] Auto mappings endpoint working: {len(mappings)} auto-generated mappings")
            else:
                print(f"[FAIL] Auto mappings failed: {result.get('error')}")
        else:
            print(f"[FAIL] Auto mappings status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Auto mappings error: {e}")
    
    # Test 5: Test User Submission Endpoint
    print("\n5. Testing User Submission Endpoint...")
    submission_data = {
        "merchant_name": "Test Store",
        "category": "Retail",
        "ticker_symbol": "TEST",
        "user_id": 1,
        "dashboard_type": "individual",
        "transaction_id": 12345,
        "notes": "Test user submission"
    }
    
    try:
        response = requests.post(f"{base_url}/api/user/submit-mapping", 
                               json=submission_data, 
                               headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"[OK] User submission working: {result.get('message')}")
                mapping_id = result.get('mapping_id')
            else:
                print(f"[FAIL] User submission failed: {result.get('error')}")
                mapping_id = None
        else:
            print(f"[FAIL] User submission status: {response.status_code}")
            mapping_id = None
    except Exception as e:
        print(f"[ERROR] User submission error: {e}")
        mapping_id = None
    
    # Test 6: Test LLM Learning Endpoint
    print("\n6. Testing LLM Learning Endpoint...")
    if mapping_id:
        try:
            learning_data = {
                "mapping_id": mapping_id,
                "learning_weight": 1.0
            }
            response = requests.post(f"{base_url}/api/llm/learn", 
                                   json=learning_data, 
                                   headers=headers)
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    metrics = result.get('metrics', {})
                    print(f"[OK] LLM learning working: {result.get('message')}")
                    print(f"    - Learning weight: {metrics.get('learning_weight')}")
                    print(f"    - Model accuracy: {metrics.get('model_accuracy')}")
                else:
                    print(f"[FAIL] LLM learning failed: {result.get('error')}")
            else:
                print(f"[FAIL] LLM learning status: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] LLM learning error: {e}")
    
    # Test 7: Test Confidence Scoring
    print("\n7. Testing Confidence Scoring...")
    try:
        confidence_data = {
            "merchant_name": "Apple Store",
            "category": "Technology",
            "ticker_symbol": "AAPL"
        }
        response = requests.post(f"{base_url}/api/llm/confidence-score", 
                               json=confidence_data, 
                               headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"[OK] Confidence scoring working:")
                print(f"    - Confidence score: {result.get('confidence_score')}")
                print(f"    - Similar mappings found: {result.get('similar_mappings_found')}")
                print(f"    - Recommendation: {result.get('recommendation')}")
            else:
                print(f"[FAIL] Confidence scoring failed: {result.get('error')}")
        else:
            print(f"[FAIL] Confidence scoring status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Confidence scoring error: {e}")
    
    print("\n" + "=" * 50)
    print("LLM CENTER ARCHITECTURE TEST COMPLETE")
    print("=" * 50)

if __name__ == "__main__":
    test_llm_center_architecture()
