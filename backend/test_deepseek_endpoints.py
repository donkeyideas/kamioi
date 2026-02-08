"""
Test script for all DeepSeek API connection points
Tests all 4 endpoints to verify they're working correctly
"""

import requests
import json
import sys
from datetime import datetime

# Fix Windows console encoding for emoji
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

BASE_URL = "http://localhost:5111"

# Test data
TEST_USER_ID = 108  # From the admin dashboard image
TEST_MAPPING_ID = 1  # Will need to find a real mapping ID

def print_test_header(test_name):
    print("\n" + "="*80)
    print(f"TEST: {test_name}")
    print("="*80)

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2)}")

def test_user_dashboard_ai_recommendations():
    """Test 1: User Dashboard - AI Recommendations"""
    print_test_header("User Dashboard - AI Recommendations")
    
    url = f"{BASE_URL}/api/ai/recommendations"
    payload = {
        "dashboard_type": "user",
        "user_id": TEST_USER_ID,
        "user_data": {
            "transactions": [
                {
                    "merchant": "Starbucks",
                    "amount": 5.50,
                    "category": "Food & Dining",
                    "date": "2024-11-15",
                    "round_up": 1.00
                }
            ],
            "portfolio": {
                "total_value": 1000.00,
                "holdings": []
            },
            "goals": [],
            "risk_tolerance": "moderate",
            "investment_history": []
        }
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Request Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=90)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Data: {json.dumps(data, indent=2)}")
            
            if data.get('success'):
                recommendations = data.get('data', {})
                if recommendations.get('recommendations'):
                    print_result(True, "User Dashboard AI Recommendations working correctly", {
                        "recommendations_count": len(recommendations.get('recommendations', [])),
                        "has_insights": bool(recommendations.get('insights'))
                    })
                    return True
                else:
                    print_result(False, "No recommendations returned", data)
                    return False
            else:
                print_result(False, f"API returned success=false: {data.get('error')}", data)
                return False
        else:
            error_text = response.text
            print_result(False, f"HTTP {response.status_code}: {error_text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 90 seconds")
        return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_family_dashboard_ai_recommendations():
    """Test 2: Family Dashboard - AI Recommendations"""
    print_test_header("Family Dashboard - AI Recommendations")
    
    url = f"{BASE_URL}/api/ai/recommendations"
    payload = {
        "dashboard_type": "family",
        "user_id": TEST_USER_ID,
        "user_data": {
            "transactions": [
                {
                    "merchant": "Target",
                    "amount": 45.00,
                    "category": "Shopping",
                    "date": "2024-11-15",
                    "round_up": 1.00
                }
            ],
            "portfolio": {
                "total_value": 2000.00,
                "holdings": []
            },
            "goals": [],
            "risk_tolerance": "moderate",
            "investment_history": []
        }
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Request Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=90)
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Data: {json.dumps(data, indent=2)}")
            
            if data.get('success'):
                recommendations = data.get('data', {})
                if recommendations.get('recommendations'):
                    print_result(True, "Family Dashboard AI Recommendations working correctly", {
                        "recommendations_count": len(recommendations.get('recommendations', [])),
                        "has_insights": bool(recommendations.get('insights'))
                    })
                    return True
                else:
                    print_result(False, "No recommendations returned", data)
                    return False
            else:
                print_result(False, f"API returned success=false: {data.get('error')}", data)
                return False
        else:
            error_text = response.text
            print_result(False, f"HTTP {response.status_code}: {error_text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 90 seconds")
        return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_business_dashboard_ai_recommendations():
    """Test 3: Business Dashboard - AI Recommendations"""
    print_test_header("Business Dashboard - AI Recommendations")
    
    url = f"{BASE_URL}/api/ai/recommendations"
    payload = {
        "dashboard_type": "business",
        "user_id": TEST_USER_ID,
        "user_data": {
            "transactions": [
                {
                    "merchant": "Office Depot",
                    "amount": 150.00,
                    "category": "Office Supplies",
                    "date": "2024-11-15",
                    "round_up": 1.00
                }
            ],
            "portfolio": {
                "total_value": 5000.00,
                "holdings": []
            },
            "goals": [],
            "risk_tolerance": "moderate",
            "investment_history": []
        }
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Request Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(url, json=payload, timeout=90)
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Data: {json.dumps(data, indent=2)}")
            
            if data.get('success'):
                recommendations = data.get('data', {})
                if recommendations.get('recommendations'):
                    print_result(True, "Business Dashboard AI Recommendations working correctly", {
                        "recommendations_count": len(recommendations.get('recommendations', [])),
                        "has_insights": bool(recommendations.get('insights'))
                    })
                    return True
                else:
                    print_result(False, "No recommendations returned", data)
                    return False
            else:
                print_result(False, f"API returned success=false: {data.get('error')}", data)
                return False
        else:
            error_text = response.text
            print_result(False, f"HTTP {response.status_code}: {error_text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 90 seconds")
        return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def get_test_mapping_id():
    """Get a test mapping ID from the database"""
    try:
        import sqlite3
        import os
        
        db_path = os.path.join(os.path.dirname(__file__), "kamioi.db")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get first pending mapping
        cursor.execute("""
            SELECT id FROM llm_mappings 
            WHERE status = 'pending' 
            LIMIT 1
        """)
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return row[0]
        return None
    except Exception as e:
        print(f"Could not get mapping ID: {e}")
        return None

def test_llm_center_receipt_mappings():
    """Test 4: Admin Dashboard - LLM Center - Receipt Mappings"""
    print_test_header("Admin Dashboard - LLM Center - Receipt Mappings")
    
    # Get a real mapping ID
    mapping_id = get_test_mapping_id()
    
    if not mapping_id:
        print_result(False, "No pending mappings found in database to test")
        print("Note: This test requires at least one pending mapping in llm_mappings table")
        return False
    
    print(f"Using mapping ID: {mapping_id}")
    
    url = f"{BASE_URL}/api/admin/llm-center/process-mapping/{mapping_id}"
    
    # Admin endpoint might need authentication
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin_token_3'  # Default admin token
    }
    
    try:
        print(f"Request URL: {url}")
        print(f"Request Headers: {json.dumps(headers, indent=2)}")
        
        response = requests.post(url, headers=headers, timeout=90)
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nResponse Data: {json.dumps(data, indent=2)}")
            
            if data.get('success'):
                result = data.get('data', {})
                # Check if AI processing was done (has ai_status or ai_processing_duration)
                if result.get('ai_status') or result.get('ai_processing_duration') or result.get('ai_confidence') is not None:
                    print_result(True, "LLM Center Receipt Mappings processing working correctly", {
                        "ai_status": result.get('ai_status'),
                        "ai_confidence": result.get('ai_confidence'),
                        "suggested_ticker": result.get('suggested_ticker'),
                        "processing_duration_ms": result.get('ai_processing_duration')
                    })
                    return True
                else:
                    print_result(False, "AI processing not attempted", data)
                    return False
            else:
                print_result(False, f"API returned success=false: {data.get('error')}", data)
                return False
        elif response.status_code == 404:
            print_result(False, f"Mapping {mapping_id} not found")
            return False
        else:
            error_text = response.text
            print_result(False, f"HTTP {response.status_code}: {error_text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print_result(False, "Request timed out after 90 seconds")
        return False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_api_tracking():
    """Check if API calls are being tracked correctly"""
    print_test_header("API Tracking Verification")
    
    url = f"{BASE_URL}/api/admin/api-usage/records?page=1&limit=5&days=1"
    headers = {
        'Authorization': 'Bearer admin_token_3'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                records = data.get('data', {}).get('records', [])
                print(f"\nFound {len(records)} recent API calls")
                
                # Check for our test page_tab labels
                page_tabs = [r.get('page_tab') for r in records]
                unique_tabs = set(page_tabs)
                
                print(f"\nPage Tab Labels Found:")
                for tab in unique_tabs:
                    count = page_tabs.count(tab)
                    print(f"  - {tab}: {count} calls")
                
                expected_tabs = [
                    "User Dashboard - AI Recommendations",
                    "Family Dashboard - AI Recommendations",
                    "Business Dashboard - AI Recommendations",
                    "LLM Center - Receipt Mappings"
                ]
                
                found_expected = [tab for tab in expected_tabs if tab in unique_tabs]
                print(f"\nExpected Page Tabs Found: {len(found_expected)}/{len(expected_tabs)}")
                
                if found_expected:
                    print_result(True, "API tracking is working", {
                        "recent_calls": len(records),
                        "unique_page_tabs": len(unique_tabs),
                        "found_expected_tabs": found_expected
                    })
                else:
                    print_result(False, "No expected page tabs found in recent records")
                
                return True
            else:
                print_result(False, f"API tracking check failed: {data.get('error')}")
                return False
        else:
            print_result(False, f"HTTP {response.status_code}: {response.text[:500]}")
            return False
            
    except Exception as e:
        print_result(False, f"Exception checking API tracking: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("DEEPSEEK API ENDPOINT TESTING")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    results = {}
    
    # Test 1: User Dashboard
    results['user_dashboard'] = test_user_dashboard_ai_recommendations()
    
    # Test 2: Family Dashboard
    results['family_dashboard'] = test_family_dashboard_ai_recommendations()
    
    # Test 3: Business Dashboard
    results['business_dashboard'] = test_business_dashboard_ai_recommendations()
    
    # Test 4: LLM Center
    results['llm_center'] = test_llm_center_receipt_mappings()
    
    # Check API Tracking
    results['api_tracking'] = check_api_tracking()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name.replace('_', ' ').title()}")
    
    print(f"\nTotal: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} test(s) failed")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    main()

