#!/usr/bin/env python3

import requests
import json

def test_llm_data_management():
    """Test LLM Data Management APIs"""
    print("TESTING LLM DATA MANAGEMENT APIs")
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
    
    # Test 2: System Status
    print("\n2. Testing System Status...")
    try:
        response = requests.get(f"{base_url}/api/llm-data/system-status", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] System Status:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - Total Mappings: {data.get('total_mappings', 0)}")
                print(f"    - Data Quality: {data.get('data_quality', 'unknown')}")
                print(f"    - Pipeline Health: {data.get('pipeline_health', 'unknown')}")
            else:
                print(f"[FAIL] System Status failed: {result.get('error')}")
        else:
            print(f"[FAIL] System Status status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] System Status error: {e}")
    
    # Test 3: Event Stats
    print("\n3. Testing Event Stats...")
    try:
        response = requests.get(f"{base_url}/api/llm-data/event-stats", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Event Stats:")
                print(f"    - User Events: {data.get('user_events', 0)}")
                print(f"    - Admin Events: {data.get('admin_events', 0)}")
                print(f"    - Recent Events: {data.get('recent_events', 0)}")
                print(f"    - Event Rate: {data.get('event_rate', 'unknown')}")
            else:
                print(f"[FAIL] Event Stats failed: {result.get('error')}")
        else:
            print(f"[FAIL] Event Stats status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Event Stats error: {e}")
    
    # Test 4: Vector Embeddings
    print("\n4. Testing Vector Embeddings...")
    try:
        response = requests.get(f"{base_url}/api/llm-data/vector-embeddings", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Vector Embeddings:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - Unique Merchants: {data.get('unique_merchants', 0)}")
                print(f"    - Unique Categories: {data.get('unique_categories', 0)}")
                print(f"    - Embedding Quality: {data.get('embedding_quality', 'unknown')}")
                print(f"    - Vector Dimensions: {data.get('vector_dimensions', 0)}")
            else:
                print(f"[FAIL] Vector Embeddings failed: {result.get('error')}")
        else:
            print(f"[FAIL] Vector Embeddings status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Vector Embeddings error: {e}")
    
    # Test 5: Feature Store
    print("\n5. Testing Feature Store...")
    try:
        response = requests.get(f"{base_url}/api/llm-data/feature-store", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Feature Store:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - Merchant Patterns: {data.get('merchant_patterns', 0)}")
                print(f"    - User Behavior: {data.get('user_behavior', 0)}")
                print(f"    - Transaction Features: {data.get('transaction_features', 0)}")
                print(f"    - Cache Hit Rate: {data.get('cache_hit_rate', 0)}%")
            else:
                print(f"[FAIL] Feature Store failed: {result.get('error')}")
        else:
            print(f"[FAIL] Feature Store status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Feature Store error: {e}")
    
    # Test 6: Initialize System
    print("\n6. Testing Initialize System...")
    try:
        response = requests.post(f"{base_url}/api/llm-data/initialize-system", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Initialize System:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - System Initialized: {data.get('system_initialized', False)}")
                print(f"    - Components: {len(data.get('components_initialized', []))}")
            else:
                print(f"[FAIL] Initialize System failed: {result.get('error')}")
        else:
            print(f"[FAIL] Initialize System status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Initialize System error: {e}")
    
    # Test 7: RAG Search
    print("\n7. Testing RAG Search...")
    try:
        search_data = {
            "query": "test search",
            "topK": 5,
            "threshold": 0.7
        }
        response = requests.post(f"{base_url}/api/llm-data/search", json=search_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] RAG Search:")
                print(f"    - Query: {data.get('query', 'unknown')}")
                print(f"    - Total Results: {data.get('total_results', 0)}")
                print(f"    - Search Time: {data.get('search_time', 0)}s")
                print(f"    - Passages: {len(data.get('passages', []))}")
            else:
                print(f"[FAIL] RAG Search failed: {result.get('error')}")
        else:
            print(f"[FAIL] RAG Search status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] RAG Search error: {e}")
    
    # Test 8: Feature Store Actions
    print("\n8. Testing Feature Store Actions...")
    
    # Refresh Features
    try:
        response = requests.post(f"{base_url}/api/llm-data/refresh-features", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Refresh Features:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - Features Refreshed: {data.get('features_refreshed', False)}")
            else:
                print(f"[FAIL] Refresh Features failed: {result.get('error')}")
        else:
            print(f"[FAIL] Refresh Features status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Refresh Features error: {e}")
    
    # Rebuild Cache
    try:
        response = requests.post(f"{base_url}/api/llm-data/rebuild-cache", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Rebuild Cache:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - Cache Rebuilt: {data.get('cache_rebuilt', False)}")
                print(f"    - Cache Hit Rate: {data.get('cache_hit_rate', 0)}%")
            else:
                print(f"[FAIL] Rebuild Cache failed: {result.get('error')}")
        else:
            print(f"[FAIL] Rebuild Cache status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Rebuild Cache error: {e}")
    
    # Configure
    try:
        config_data = {
            "config": {
                "cache_size": 1000,
                "refresh_interval": 3600,
                "similarity_threshold": 0.85
            }
        }
        response = requests.post(f"{base_url}/api/llm-data/configure", json=config_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Configure:")
                print(f"    - Status: {data.get('status', 'unknown')}")
                print(f"    - Configuration Updated: {data.get('configuration_updated', False)}")
            else:
                print(f"[FAIL] Configure failed: {result.get('error')}")
        else:
            print(f"[FAIL] Configure status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Configure error: {e}")
    
    print("\n" + "=" * 50)
    print("LLM DATA MANAGEMENT TEST COMPLETE")
    print("=" * 50)
    print("\nIf all tests pass, the LLM Data Management system is working!")

if __name__ == "__main__":
    test_llm_data_management()
