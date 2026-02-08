#!/usr/bin/env python3

import requests
import json

def test_frontend_functionality():
    """Test the frontend functionality to ensure everything works"""
    print("FRONTEND FUNCTIONALITY TEST")
    print("=" * 40)
    
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
                
                # Test 1: ML Dashboard Overview Tab
                print(f"\n1. TESTING ML DASHBOARD OVERVIEW")
                print("-" * 35)
                
                try:
                    response = requests.get(f"{base_url}/api/ml/stats", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and data.get('stats'):
                            stats = data['stats']
                            print(f"[OK] ML Dashboard Overview Data:")
                            print(f"   - Active Models: {stats.get('active_models', 'N/A')}")
                            print(f"   - Total Models: {stats.get('total_models', 'N/A')}")
                            print(f"   - Training Accuracy: {stats.get('training_accuracy', 'N/A')}")
                            print(f"   - Prediction Count: {stats.get('prediction_count', 'N/A')}")
                            print(f"   - Last Training: {stats.get('last_training', 'N/A')}")
                        else:
                            print(f"[WARN] ML Stats data structure issue")
                    else:
                        print(f"[FAIL] ML Stats failed: {response.status_code}")
                except Exception as e:
                    print(f"[ERROR] ML Stats error: {e}")
                
                # Test 2: LLM Data Management Overview Tab
                print(f"\n2. TESTING LLM DATA MANAGEMENT OVERVIEW")
                print("-" * 45)
                
                try:
                    response = requests.get(f"{base_url}/api/llm-data/system-status", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and data.get('status'):
                            status = data['status']
                            print(f"[OK] LLM Data Management System Status:")
                            print(f"   - System Health: {status.get('system_health', 'N/A')}")
                            print(f"   - Active Processes: {status.get('active_processes', 'N/A')}")
                            print(f"   - Queue Size: {status.get('queue_size', 'N/A')}")
                            print(f"   - Uptime: {status.get('uptime', 'N/A')}")
                            print(f"   - Last Processed: {status.get('last_processed', 'N/A')}")
                        else:
                            print(f"[WARN] System Status data structure issue")
                    else:
                        print(f"[FAIL] System Status failed: {response.status_code}")
                except Exception as e:
                    print(f"[ERROR] System Status error: {e}")
                
                # Test 3: Feature Store Data
                print(f"\n3. TESTING FEATURE STORE DATA")
                print("-" * 30)
                
                try:
                    response = requests.get(f"{base_url}/api/llm-data/feature-store", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and data.get('data'):
                            feature_data = data['data']
                            print(f"[OK] Feature Store Data:")
                            print(f"   - Status: {feature_data.get('status', 'N/A')}")
                            print(f"   - Merchant Patterns: {feature_data.get('merchant_patterns', 'N/A')}")
                            print(f"   - User Behavior: {feature_data.get('user_behavior', 'N/A')}")
                            print(f"   - Transaction Features: {feature_data.get('transaction_features', 'N/A')}")
                            print(f"   - Cache Hit Rate: {feature_data.get('cache_hit_rate', 'N/A')}%")
                            print(f"   - Avg Compute Time: {feature_data.get('avg_compute_time', 'N/A')}ms")
                        else:
                            print(f"[WARN] Feature Store data structure issue")
                    else:
                        print(f"[FAIL] Feature Store failed: {response.status_code}")
                except Exception as e:
                    print(f"[ERROR] Feature Store error: {e}")
                
                # Test 4: Vector Embeddings Data
                print(f"\n4. TESTING VECTOR EMBEDDINGS DATA")
                print("-" * 35)
                
                try:
                    response = requests.get(f"{base_url}/api/llm-data/vector-embeddings", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and data.get('data'):
                            vector_data = data['data']
                            print(f"[OK] Vector Embeddings Data:")
                            print(f"   - Status: {vector_data.get('status', 'N/A')}")
                            print(f"   - Unique Merchants: {vector_data.get('unique_merchants', 'N/A')}")
                            print(f"   - Unique Categories: {vector_data.get('unique_categories', 'N/A')}")
                            print(f"   - Vector Dimensions: {vector_data.get('vector_dimensions', 'N/A')}")
                            print(f"   - Embedding Quality: {vector_data.get('embedding_quality', 'N/A')}")
                        else:
                            print(f"[WARN] Vector Embeddings data structure issue")
                    else:
                        print(f"[FAIL] Vector Embeddings failed: {response.status_code}")
                except Exception as e:
                    print(f"[ERROR] Vector Embeddings error: {e}")
                
                # Test 5: Feature Store Actions
                print(f"\n5. TESTING FEATURE STORE ACTIONS")
                print("-" * 35)
                
                actions = [
                    ("Refresh Features", "/api/llm-data/refresh-features"),
                    ("Rebuild Cache", "/api/llm-data/rebuild-cache")
                ]
                
                for action_name, endpoint in actions:
                    try:
                        response = requests.post(f"{base_url}{endpoint}", headers=headers)
                        if response.status_code == 200:
                            data = response.json()
                            if data.get('success'):
                                print(f"[OK] {action_name} - Success")
                            else:
                                print(f"[WARN] {action_name} - API returned success=false")
                        else:
                            print(f"[FAIL] {action_name} - HTTP {response.status_code}")
                    except Exception as e:
                        print(f"[ERROR] {action_name} - {e}")
                
                print(f"\n" + "=" * 40)
                print("FRONTEND FUNCTIONALITY TEST COMPLETE")
                print("=" * 40)
                print("\nIf all tests show [OK], the frontend should display data correctly!")
                print("\nNext steps:")
                print("1. Navigate to ML Dashboard in the frontend")
                print("2. Check that Overview tab shows data")
                print("3. Navigate to LLM Data Management in the frontend")
                print("4. Check that Overview, Vector Embeddings, and Feature Store tabs show data")
                print("5. Test the buttons (Refresh Features, Rebuild Cache, etc.)")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")

if __name__ == "__main__":
    test_frontend_functionality()
