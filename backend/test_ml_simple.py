#!/usr/bin/env python3

import requests
import json

def test_ml_dashboard_simple():
    print("ML DASHBOARD SIMPLE TEST")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Test 1: Health Check
    print("1. TESTING HEALTH CHECK...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("   [OK] Health check: PASSED")
        else:
            print(f"   [FAIL] Health check: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   [ERROR] Health check: ERROR - {e}")
        return
    
    # Test 2: Admin Login
    print("\n2. TESTING ADMIN LOGIN...")
    try:
        login_data = {
            "email": "info@kamioi.com",
            "password": "admin123"
        }
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                admin_token = result['token']
                print("   [OK] Admin login: PASSED")
                print(f"   [TOKEN] Token: {admin_token[:20]}...")
            else:
                print(f"   [FAIL] Admin login: FAILED - {result.get('error')}")
                return
        else:
            print(f"   [FAIL] Admin login: FAILED ({response.status_code})")
            return
    except Exception as e:
        print(f"   [ERROR] Admin login: ERROR - {e}")
        return
    
    # Test 3: ML Stats Endpoint
    print("\n3. TESTING ML STATS ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/ml/stats", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   [OK] ML Stats: PASSED")
                print(f"   [DATA] Model Version: {result['data'].get('modelVersion', 'N/A')}")
            else:
                print(f"   [FAIL] ML Stats: FAILED - {result.get('error')}")
        else:
            print(f"   [FAIL] ML Stats: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   [ERROR] ML Stats: ERROR - {e}")
    
    # Test 4: ML Recognize Endpoint
    print("\n4. TESTING ML RECOGNIZE ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        test_data = {"text": "Apple Store Purchase"}
        response = requests.post(f"{base_url}/api/ml/recognize", json=test_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   [OK] ML Recognize: PASSED")
                print(f"   [RESULT] Category: {result['data'].get('category', 'N/A')}")
                print(f"   [RESULT] Confidence: {result['data'].get('confidence', 'N/A')}")
            else:
                print(f"   [FAIL] ML Recognize: FAILED - {result.get('error')}")
        else:
            print(f"   [FAIL] ML Recognize: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   [ERROR] ML Recognize: ERROR - {e}")
    
    # Test 5: Admin ML Analytics
    print("\n5. TESTING ADMIN ML ANALYTICS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/analytics", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   [OK] Admin ML Analytics: PASSED")
                print(f"   [DATA] Total Mappings: {result['data'].get('total_mappings', 'N/A')}")
                print(f"   [DATA] Accuracy Rate: {result['data'].get('accuracy_rate', 'N/A')}%")
            else:
                print(f"   [FAIL] Admin ML Analytics: FAILED - {result.get('error')}")
        else:
            print(f"   [FAIL] Admin ML Analytics: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   [ERROR] Admin ML Analytics: ERROR - {e}")
    
    # Test 6: Admin ML Metrics
    print("\n6. TESTING ADMIN ML METRICS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/metrics", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   [OK] Admin ML Metrics: PASSED")
                print(f"   [DATA] Approved: {result['data'].get('approved', 'N/A')}")
                print(f"   [DATA] Pending: {result['data'].get('pending', 'N/A')}")
                print(f"   [DATA] Model Accuracy: {result['data'].get('model_accuracy', 'N/A')}")
            else:
                print(f"   [FAIL] Admin ML Metrics: FAILED - {result.get('error')}")
        else:
            print(f"   [FAIL] Admin ML Metrics: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   [ERROR] Admin ML Metrics: ERROR - {e}")
    
    print("\n" + "=" * 50)
    print("ML DASHBOARD TESTING COMPLETE!")
    print("=" * 50)

if __name__ == "__main__":
    test_ml_dashboard_simple()
