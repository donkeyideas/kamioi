#!/usr/bin/env python3

import requests
import json

def test_complete_system():
    """Test the complete system to ensure everything works"""
    print("COMPLETE SYSTEM VERIFICATION")
    print("=" * 50)
    
    base_url = "http://localhost:5000"
    
    # Login first
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
                print(f"[OK] Admin login successful")
                
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                # Test 1: ML Dashboard APIs
                print(f"\n1. TESTING ML DASHBOARD APIS")
                print("-" * 30)
                
                ml_endpoints = [
                    "/api/ml/stats",
                    "/api/ml/recognize",
                    "/api/ml/learn", 
                    "/api/ml/feedback",
                    "/api/ml/retrain",
                    "/api/ml/export"
                ]
                
                for endpoint in ml_endpoints:
                    print(f"\n[TEST] {endpoint}")
                    try:
                        if endpoint in ["/api/ml/recognize", "/api/ml/learn", "/api/ml/feedback"]:
                            # POST endpoints
                            test_data = {
                                "text": "test merchant" if endpoint == "/api/ml/recognize" else "test data",
                                "mapping_id": 1 if endpoint in ["/api/ml/learn", "/api/ml/feedback"] else None
                            }
                            response = requests.post(f"{base_url}{endpoint}", json=test_data, headers=headers)
                        else:
                            # GET endpoints
                            response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        
                        print(f"   Status: {response.status_code}")
                        if response.status_code == 200:
                            data = response.json()
                            print(f"   Success: {data.get('success', False)}")
                            if data.get('success'):
                                print(f"   [OK] Working correctly")
                            else:
                                print(f"   [WARN] API returned success=false")
                        else:
                            print(f"   [FAIL] HTTP {response.status_code}")
                    except Exception as e:
                        print(f"   [ERROR] {e}")
                
                # Test 2: LLM Data Management APIs
                print(f"\n2. TESTING LLM DATA MANAGEMENT APIS")
                print("-" * 40)
                
                llm_data_endpoints = [
                    "/api/llm-data/system-status",
                    "/api/llm-data/event-stats", 
                    "/api/llm-data/vector-embeddings",
                    "/api/llm-data/feature-store",
                    "/api/llm-data/initialize-system",
                    "/api/llm-data/search"
                ]
                
                for endpoint in llm_data_endpoints:
                    print(f"\n[TEST] {endpoint}")
                    try:
                        if endpoint == "/api/llm-data/search":
                            # POST endpoint with query
                            test_data = {"query": "test search"}
                            response = requests.post(f"{base_url}{endpoint}", json=test_data, headers=headers)
                        else:
                            # GET endpoints
                            response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        
                        print(f"   Status: {response.status_code}")
                        if response.status_code == 200:
                            data = response.json()
                            print(f"   Success: {data.get('success', False)}")
                            if data.get('success'):
                                print(f"   [OK] Working correctly")
                            else:
                                print(f"   [WARN] API returned success=false")
                        else:
                            print(f"   [FAIL] HTTP {response.status_code}")
                    except Exception as e:
                        print(f"   [ERROR] {e}")
                
                # Test 3: Feature Store Actions
                print(f"\n3. TESTING FEATURE STORE ACTIONS")
                print("-" * 35)
                
                feature_actions = [
                    "/api/llm-data/refresh-features",
                    "/api/llm-data/rebuild-cache", 
                    "/api/llm-data/configure"
                ]
                
                for endpoint in feature_actions:
                    print(f"\n[TEST] {endpoint}")
                    try:
                        response = requests.post(f"{base_url}{endpoint}", headers=headers)
                        print(f"   Status: {response.status_code}")
                        if response.status_code == 200:
                            data = response.json()
                            print(f"   Success: {data.get('success', False)}")
                            if data.get('success'):
                                print(f"   [OK] Action completed successfully")
                            else:
                                print(f"   [WARN] Action returned success=false")
                        else:
                            print(f"   [FAIL] HTTP {response.status_code}")
                    except Exception as e:
                        print(f"   [ERROR] {e}")
                
                # Test 4: LLM Center APIs
                print(f"\n4. TESTING LLM CENTER APIS")
                print("-" * 30)
                
                llm_center_endpoints = [
                    "/api/admin/llm-center/queue",
                    "/api/admin/llm-center/mappings",
                    "/api/admin/llm-center/pending-mappings",
                    "/api/admin/llm-center/approved-mappings",
                    "/api/admin/llm-center/auto-mappings"
                ]
                
                for endpoint in llm_center_endpoints:
                    print(f"\n[TEST] {endpoint}")
                    try:
                        response = requests.get(f"{base_url}{endpoint}", headers=headers)
                        print(f"   Status: {response.status_code}")
                        if response.status_code == 200:
                            data = response.json()
                            print(f"   Success: {data.get('success', False)}")
                            if data.get('success'):
                                print(f"   [OK] Working correctly")
                            else:
                                print(f"   [WARN] API returned success=false")
                        else:
                            print(f"   [FAIL] HTTP {response.status_code}")
                    except Exception as e:
                        print(f"   [ERROR] {e}")
                
                print(f"\n" + "=" * 50)
                print("SYSTEM VERIFICATION COMPLETE")
                print("=" * 50)
                print("\nIf all tests show [OK], the system is working correctly!")
                print("\nNext steps:")
                print("1. Test ML Dashboard buttons (Refresh, Retrain, Export)")
                print("2. Test LLM Data Management tabs (Overview, Vector Embeddings, Feature Store)")
                print("3. Test Feature Store buttons (Refresh Features, Rebuild Cache, Configure)")
                print("4. Verify data displays correctly in the frontend")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")

if __name__ == "__main__":
    test_complete_system()
