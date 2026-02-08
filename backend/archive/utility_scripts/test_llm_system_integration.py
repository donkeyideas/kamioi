#!/usr/bin/env python3

import requests
import json

def test_llm_system_integration():
    """Test the complete LLM system integration"""
    print("TESTING LLM SYSTEM INTEGRATION")
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
    
    # Test 2: Global State Management
    print("\n2. Testing Global State Management...")
    try:
        response = requests.get(f"{base_url}/api/llm/global-state", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Global state retrieved:")
                print(f"    - LLM Center: {data.get('llm_center', {}).get('total_mappings', 0)} mappings")
                print(f"    - ML Dashboard: {data.get('ml_dashboard', {}).get('categories_learned', 0)} categories")
                print(f"    - Data Management: {data.get('llm_data_management', {}).get('data_quality', 'unknown')} quality")
                print(f"    - System Health: {data.get('system_health', 'unknown')}")
            else:
                print(f"[FAIL] Global state failed: {result.get('error')}")
        else:
            print(f"[FAIL] Global state status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Global state error: {e}")
    
    # Test 3: Cross-Component Communication
    print("\n3. Testing Cross-Component Communication...")
    
    # LLM Center → ML Dashboard
    try:
        response = requests.get(f"{base_url}/api/llm-center/get-ml-status", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] LLM Center -> ML Dashboard:")
                print(f"    - Model Status: {data.get('model_status', 'unknown')}")
                print(f"    - Total Approved: {data.get('total_approved', 0)}")
                print(f"    - Performance Score: {data.get('performance_score', 0)}%")
            else:
                print(f"[FAIL] LLM Center -> ML Dashboard failed: {result.get('error')}")
        else:
            print(f"[FAIL] LLM Center -> ML Dashboard status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] LLM Center -> ML Dashboard error: {e}")
    
    # ML Dashboard → LLM Data Management
    try:
        response = requests.get(f"{base_url}/api/ml/get-data-health", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] ML Dashboard -> LLM Data Management:")
                print(f"    - Pipeline Status: {data.get('pipeline_status', 'unknown')}")
                print(f"    - Data Quality: {data.get('data_quality', 'unknown')}")
                print(f"    - Throughput: {data.get('throughput', 'unknown')}")
            else:
                print(f"[FAIL] ML Dashboard -> LLM Data Management failed: {result.get('error')}")
        else:
            print(f"[FAIL] ML Dashboard -> LLM Data Management status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] ML Dashboard -> LLM Data Management error: {e}")
    
    # LLM Data Management → LLM Center
    try:
        response = requests.get(f"{base_url}/api/llm-data/get-center-status", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] LLM Data Management -> LLM Center:")
                print(f"    - Operational Status: {data.get('operational_status', 'unknown')}")
                print(f"    - Pending Mappings: {data.get('pending_mappings', 0)}")
                print(f"    - Processing Efficiency: {data.get('processing_efficiency', 'unknown')}")
            else:
                print(f"[FAIL] LLM Data Management -> LLM Center failed: {result.get('error')}")
        else:
            print(f"[FAIL] LLM Data Management -> LLM Center status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] LLM Data Management -> LLM Center error: {e}")
    
    # Test 4: Learning Loop
    print("\n4. Testing Learning Loop...")
    
    # Feedback Pipeline
    try:
        feedback_data = {
            "feedback_data": {
                "mapping_id": 1,
                "user_feedback": "correct",
                "confidence": 0.9
            }
        }
        response = requests.post(f"{base_url}/api/learning/feedback-pipeline", json=feedback_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Feedback Pipeline:")
                print(f"    - Feedback Processed: {data.get('feedback_processed', False)}")
                print(f"    - Learning Triggered: {data.get('learning_triggered', False)}")
                print(f"    - Model Improvement: {data.get('model_improvement', 'unknown')}")
            else:
                print(f"[FAIL] Feedback Pipeline failed: {result.get('error')}")
        else:
            print(f"[FAIL] Feedback Pipeline status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Feedback Pipeline error: {e}")
    
    # Model Update
    try:
        learning_data = {
            "learning_data": {
                "patterns_count": 5,
                "confidence_improvement": 0.02
            }
        }
        response = requests.post(f"{base_url}/api/learning/model-update", json=learning_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Model Update:")
                print(f"    - Model Updated: {data.get('model_updated', False)}")
                print(f"    - New Patterns: {data.get('new_patterns_learned', 0)}")
                print(f"    - Model Version: {data.get('model_version', 'unknown')}")
            else:
                print(f"[FAIL] Model Update failed: {result.get('error')}")
        else:
            print(f"[FAIL] Model Update status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Model Update error: {e}")
    
    # Test 5: Quality Gates
    print("\n5. Testing Quality Gates...")
    
    # Quality Check
    try:
        mapping_data = {
            "mapping_data": {
                "merchant_name": "Test Merchant",
                "ticker_symbol": "TEST",
                "confidence": 0.85
            }
        }
        response = requests.post(f"{base_url}/api/learning/quality-check", json=mapping_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Quality Check:")
                print(f"    - Quality Score: {data.get('quality_score', 0):.2f}")
                print(f"    - Quality Status: {data.get('quality_status', 'unknown')}")
                print(f"    - Issues: {len(data.get('issues', []))}")
            else:
                print(f"[FAIL] Quality Check failed: {result.get('error')}")
        else:
            print(f"[FAIL] Quality Check status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Quality Check error: {e}")
    
    # Quality Metrics
    try:
        response = requests.get(f"{base_url}/api/quality/get-metrics", headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                data = result.get('data', {})
                print(f"[OK] Quality Metrics:")
                print(f"    - Total Mappings: {data.get('total_mappings', 0)}")
                print(f"    - High Confidence Rate: {data.get('high_confidence_rate', 0)}%")
                print(f"    - Overall Quality Score: {data.get('overall_quality_score', 0):.3f}")
            else:
                print(f"[FAIL] Quality Metrics failed: {result.get('error')}")
        else:
            print(f"[FAIL] Quality Metrics status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Quality Metrics error: {e}")
    
    # Test 6: Global State Update
    print("\n6. Testing Global State Update...")
    try:
        update_data = {
            "component": "test_component",
            "update_data": {
                "test_field": "test_value",
                "timestamp": "2025-10-17T20:00:00Z"
            }
        }
        response = requests.post(f"{base_url}/api/llm/update-global-state", json=update_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"[OK] Global State Update:")
                print(f"    - Message: {result.get('message', 'unknown')}")
                print(f"    - Timestamp: {result.get('timestamp', 'unknown')}")
            else:
                print(f"[FAIL] Global State Update failed: {result.get('error')}")
        else:
            print(f"[FAIL] Global State Update status: {response.status_code}")
    except Exception as e:
        print(f"[ERROR] Global State Update error: {e}")
    
    print("\n" + "=" * 50)
    print("LLM SYSTEM INTEGRATION TEST COMPLETE")
    print("=" * 50)
    print("\nIf all tests pass, the LLM system integration is working!")
    print("The three components (LLM Center, ML Dashboard, LLM Data Management)")
    print("are now connected and can communicate with each other!")

if __name__ == "__main__":
    test_llm_system_integration()
