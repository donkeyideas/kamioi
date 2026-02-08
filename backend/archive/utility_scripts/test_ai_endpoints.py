#!/usr/bin/env python3
"""
Test script for AI processing endpoints
"""

import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5000'
ADMIN_TOKEN = 'kamioi_admin_token'

def test_llm_data_assets():
    """Test LLM Data Assets endpoint"""
    print("\n=== Testing LLM Data Assets Endpoint ===")
    
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f'{BASE_URL}/api/admin/llm-center/data-assets', headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                summary = data['data']['summary']
                assets = data['data']['assets']
                
                print(f"Success! Found {len(assets)} LLM Data Assets")
                print(f"Total Asset Value: ${summary['total_value']:,.2f}")
                print(f"Total Training Cost: ${summary['total_cost']:,.2f}")
                print(f"Average ROI: {summary['average_roi']:.2f}%")
                print(f"GL Account: {summary['gl_account']}")
                
                print("\nAssets:")
                for asset in assets:
                    print(f"  - {asset['asset_name']}: ${asset['current_value']:,.2f} (ROI: {asset['roi_percentage']:.0f}%)")
                
                return True
            else:
                print(f"API Error: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_ai_analytics():
    """Test AI Processing Analytics endpoint"""
    print("\n=== Testing AI Processing Analytics Endpoint ===")
    
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(f'{BASE_URL}/api/admin/llm-center/ai-analytics', headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                stats = data['data']['current_stats']
                
                print("Success! AI Processing Stats:")
                print(f"  Total Mappings: {stats['total_mappings']}")
                print(f"  AI Processed: {stats['ai_processed']}")
                print(f"  Auto Approved: {stats['auto_approved']}")
                print(f"  Pending Review: {stats['pending_review']}")
                print(f"  Average Confidence: {stats['average_confidence']:.2%}")
                print(f"  Average Processing Time: {stats['average_processing_time']:.2f}ms")
                
                return True
            else:
                print(f"API Error: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def test_process_queue():
    """Test AI Process Queue endpoint"""
    print("\n=== Testing AI Process Queue Endpoint ===")
    
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/api/admin/ai/process-queue', headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                result = data['data']
                
                print("Success! AI Processing Results:")
                print(f"  Processed: {result['processed_count']}")
                print(f"  Auto Approved: {result['auto_approved']}")
                print(f"  Review Required: {result['review_required']}")
                print(f"  Rejected: {result['rejected']}")
                print(f"  Message: {result['message']}")
                
                return True
            else:
                print(f"API Error: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def main():
    print("AI Processing System Test Suite")
    print("=" * 50)
    
    # Wait for server to start
    print("\nWaiting for server to start...")
    time.sleep(3)
    
    # Test all endpoints
    results = []
    
    results.append(("LLM Data Assets", test_llm_data_assets()))
    results.append(("AI Analytics", test_ai_analytics()))
    results.append(("AI Process Queue", test_process_queue()))
    
    # Summary
    print("\n" + "=" * 50)
    print("Test Summary:")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"  {test_name}: {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\nAll tests passed! AI processing system is working correctly.")
        return 0
    else:
        print(f"\n{total - passed} test(s) failed. Please check the errors above.")
        return 1

if __name__ == '__main__':
    exit(main())


