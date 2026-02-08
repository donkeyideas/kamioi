#!/usr/bin/env python3

import requests
import json
import time

def test_ml_dashboard_complete():
    print("ML DASHBOARD COMPREHENSIVE TEST")
    print("=" * 60)
    
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
                admin_token = result['data']['token']
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
                print("   ✅ ML Stats: PASSED")
                print(f"   📊 Data: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ ML Stats: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ ML Stats: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ ML Stats: ERROR - {e}")
    
    # Test 4: ML Recognize Endpoint
    print("\n4. TESTING ML RECOGNIZE ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        test_data = {"text": "Apple Store Purchase"}
        response = requests.post(f"{base_url}/api/ml/recognize", json=test_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ ML Recognize: PASSED")
                print(f"   🎯 Result: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ ML Recognize: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ ML Recognize: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ ML Recognize: ERROR - {e}")
    
    # Test 5: ML Learn Endpoint
    print("\n5. TESTING ML LEARN ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        learn_data = {
            "merchant": "Test Merchant",
            "ticker": "TEST",
            "category": "Food & Dining",
            "confidence": 0.95
        }
        response = requests.post(f"{base_url}/api/ml/learn", json=learn_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ ML Learn: PASSED")
                print(f"   🧠 Learning: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ ML Learn: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ ML Learn: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ ML Learn: ERROR - {e}")
    
    # Test 6: ML Feedback Endpoint
    print("\n6. TESTING ML FEEDBACK ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        feedback_data = {
            "type": "positive",
            "mapping_id": 1
        }
        response = requests.post(f"{base_url}/api/ml/feedback", json=feedback_data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ ML Feedback: PASSED")
                print(f"   💬 Feedback: {result.get('message')}")
            else:
                print(f"   ❌ ML Feedback: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ ML Feedback: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ ML Feedback: ERROR - {e}")
    
    # Test 7: ML Retrain Endpoint
    print("\n7. TESTING ML RETRAIN ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        print("   ⏳ Retraining model (this may take a moment)...")
        response = requests.post(f"{base_url}/api/ml/retrain", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ ML Retrain: PASSED")
                print(f"   🔄 Retraining: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ ML Retrain: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ ML Retrain: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ ML Retrain: ERROR - {e}")
    
    # Test 8: ML Export Endpoint
    print("\n8. TESTING ML EXPORT ENDPOINT...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/ml/export", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ ML Export: PASSED")
                print(f"   📁 Export: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ ML Export: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ ML Export: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ ML Export: ERROR - {e}")
    
    # Test 9: Admin ML Analytics
    print("\n9. TESTING ADMIN ML ANALYTICS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/analytics", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ Admin ML Analytics: PASSED")
                print(f"   📈 Analytics: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ Admin ML Analytics: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ Admin ML Analytics: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Admin ML Analytics: ERROR - {e}")
    
    # Test 10: Admin ML Predictions
    print("\n10. TESTING ADMIN ML PREDICTIONS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/predictions", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ Admin ML Predictions: PASSED")
                print(f"   🔮 Predictions: {len(result['data']['predictions'])} items")
            else:
                print(f"   ❌ Admin ML Predictions: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ Admin ML Predictions: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Admin ML Predictions: ERROR - {e}")
    
    # Test 11: Admin ML Models
    print("\n11. TESTING ADMIN ML MODELS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/models", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ Admin ML Models: PASSED")
                print(f"   🤖 Models: {len(result['data']['models'])} models")
            else:
                print(f"   ❌ Admin ML Models: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ Admin ML Models: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Admin ML Models: ERROR - {e}")
    
    # Test 12: Admin ML Performance
    print("\n12. TESTING ADMIN ML PERFORMANCE...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/performance", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ Admin ML Performance: PASSED")
                print(f"   ⚡ Performance: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ Admin ML Performance: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ Admin ML Performance: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Admin ML Performance: ERROR - {e}")
    
    # Test 13: Admin ML Metrics
    print("\n13. TESTING ADMIN ML METRICS...")
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{base_url}/api/admin/ml/metrics", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("   ✅ Admin ML Metrics: PASSED")
                print(f"   📊 Metrics: {json.dumps(result['data'], indent=2)}")
            else:
                print(f"   ❌ Admin ML Metrics: FAILED - {result.get('error')}")
        else:
            print(f"   ❌ Admin ML Metrics: FAILED ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Admin ML Metrics: ERROR - {e}")
    
    print("\n" + "=" * 60)
    print("ML DASHBOARD TESTING COMPLETE!")
    print("=" * 60)

if __name__ == "__main__":
    test_ml_dashboard_complete()
