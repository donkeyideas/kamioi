#!/usr/bin/env python3

import requests
import json

def test_ml_stats_endpoint():
    """Test the new ML stats endpoint"""
    print("TESTING ML STATS ENDPOINT")
    print("=" * 40)
    
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
    
    # Test 2: Test ML Stats Endpoint
    print("\n2. Testing ML Stats Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/ml/stats", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] ML Stats endpoint working:")
                print(f"    - System Status: {data.get('system_status', {}).get('status', 'N/A')}")
                print(f"    - Model Version: {data.get('system_status', {}).get('model_version', 'N/A')}")
                print(f"    - Total Mappings: {data.get('data_statistics', {}).get('total_mappings', 0)}")
                print(f"    - Approved Mappings: {data.get('data_statistics', {}).get('approved_mappings', 0)}")
                print(f"    - Pending Mappings: {data.get('data_statistics', {}).get('pending_mappings', 0)}")
                print(f"    - User Submissions: {data.get('data_statistics', {}).get('user_submissions', 0)}")
                print(f"    - Admin Uploads: {data.get('data_statistics', {}).get('admin_uploads', 0)}")
                print(f"    - Approval Rate: {data.get('data_statistics', {}).get('approval_rate', 0)}%")
                print(f"    - Model Accuracy: {data.get('learning_metrics', {}).get('model_accuracy', 0)}%")
            else:
                print(f"[FAIL] ML Stats failed: {result.get('error')}")
        else:
            print(f"[FAIL] ML Stats status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] ML Stats error: {e}")
    
    print("\n" + "=" * 40)
    print("ML STATS ENDPOINT TEST COMPLETE")
    print("=" * 40)

if __name__ == "__main__":
    test_ml_stats_endpoint()
