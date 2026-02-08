#!/usr/bin/env python3

import requests
import json

def test_llm_data_management_fixes():
    """Test the LLM Data Management fixes"""
    print("TESTING LLM DATA MANAGEMENT FIXES")
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
                
                # Test 1: System Status API
                print(f"\n1. TESTING SYSTEM STATUS API")
                print("-" * 30)
                try:
                    response = requests.get(f"{base_url}/api/llm-data/system-status", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and data.get('status'):
                            status = data['status']
                            print(f"[OK] System Status Data:")
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
                
                # Test 2: Event Stats API
                print(f"\n2. TESTING EVENT STATS API")
                print("-" * 30)
                try:
                    response = requests.get(f"{base_url}/api/llm-data/event-stats", headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('success') and data.get('events'):
                            events = data['events']
                            print(f"[OK] Event Stats Data:")
                            print(f"   - Events Today: {events.get('events_today', 'N/A')}")
                            print(f"   - Total Events: {events.get('total_events', 'N/A')}")
                            print(f"   - Success Rate: {events.get('success_rate', 'N/A')}%")
                            print(f"   - Processing Rate: {events.get('processing_rate', 'N/A')}")
                            print(f"   - Queue Size: {events.get('queue_size', 'N/A')}")
                        else:
                            print(f"[WARN] Event Stats data structure issue")
                    else:
                        print(f"[FAIL] Event Stats failed: {response.status_code}")
                except Exception as e:
                    print(f"[ERROR] Event Stats error: {e}")
                
                # Test 3: Vector Embeddings API
                print(f"\n3. TESTING VECTOR EMBEDDINGS API")
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
                
                # Test 4: Feature Store API
                print(f"\n4. TESTING FEATURE STORE API")
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
                
                print(f"\n" + "=" * 40)
                print("LLM DATA MANAGEMENT FIXES TEST COMPLETE")
                print("=" * 40)
                print("\nIf all tests show [OK], the LLM Data Management should now display real data!")
                print("\nNext steps:")
                print("1. Navigate to LLM Data Management in the frontend")
                print("2. Check that Overview tab shows real system status data")
                print("3. Check that Vector Embeddings tab shows real vector data")
                print("4. Check that Feature Store tab shows real feature store data")
                print("5. All cards should display actual values instead of being empty")
                
            else:
                print(f"[FAIL] Login failed: {result.get('error')}")
        else:
            print(f"[FAIL] Login failed with status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Login error: {e}")

if __name__ == "__main__":
    test_llm_data_management_fixes()
