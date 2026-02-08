#!/usr/bin/env python3

import requests
import json

def test_ml_analytics_data():
    """Test the ML Analytics tab data"""
    print("TESTING ML ANALYTICS DATA")
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
    
    # Test 2: Test ML Stats Endpoint for Analytics Data
    print("\n2. Testing ML Stats for Analytics Data...")
    try:
        response = requests.get(f"{base_url}/api/ml/stats", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] ML Stats endpoint working:")
                print(f"    - Total Predictions: {data.get('totalPredictions', 0)}")
                print(f"    - Accuracy Rate: {data.get('accuracyRate', 0):.2f}")
                print(f"    - Learning History Size: {data.get('learningHistorySize', 0)}")
                print(f"    - Model Version: {data.get('modelVersion', 'N/A')}")
                print(f"    - Last Training: {data.get('lastTraining', 'N/A')}")
                print(f"    - Total Patterns: {data.get('totalPatterns', 0)}")
                
                # Check if Analytics tab will have data
                analytics_data = {
                    'totalPredictions': data.get('totalPredictions', 0),
                    'accuracyRate': data.get('accuracyRate', 0),
                    'learningHistorySize': data.get('learningHistorySize', 0),
                    'modelVersion': data.get('modelVersion', 'N/A'),
                    'lastTraining': data.get('lastTraining', 'N/A'),
                    'totalPatterns': data.get('totalPatterns', 0)
                }
                
                print(f"\n[ANALYTICS TAB DATA]:")
                print(f"    - Total Predictions: {analytics_data['totalPredictions']}")
                print(f"    - Accuracy Rate: {analytics_data['accuracyRate']:.2f}")
                print(f"    - Learning Events: {analytics_data['learningHistorySize']}")
                print(f"    - Model Version: {analytics_data['modelVersion']}")
                print(f"    - Last Training: {analytics_data['lastTraining']}")
                print(f"    - Total Patterns: {analytics_data['totalPatterns']}")
                
            else:
                print(f"[FAIL] ML Stats failed: {result.get('error')}")
        else:
            print(f"[FAIL] ML Stats status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] ML Stats error: {e}")
    
    print("\n" + "=" * 40)
    print("ML ANALYTICS DATA TEST COMPLETE")
    print("=" * 40)
    print("\nIf all tests pass, the Analytics tab should now have data!")

if __name__ == "__main__":
    test_ml_analytics_data()
