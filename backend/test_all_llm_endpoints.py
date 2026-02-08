#!/usr/bin/env python3

import requests
import json

def test_all_llm_endpoints():
    base_url = "http://localhost:5000"
    
    print("COMPREHENSIVE LLM CENTER ENDPOINT TESTING")
    print("=" * 60)
    
    # Step 1: Login to get token
    print("\n1. Testing Authentication...")
    login_data = {"email": "info@kamioi.com", "password": "admin123"}
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                token = data.get('token')
                print(f"   Login successful: {token[:20]}...")
            else:
                print(f"   Login failed: {data.get('error')}")
                return None
        else:
            print(f"   Login request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"   Login error: {e}")
        return None
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Step 2: Test all LLM Center endpoints
    endpoints = [
        {
            'name': 'Health Check',
            'url': '/api/health',
            'method': 'GET',
            'headers': None
        },
        {
            'name': 'Admin Auth Me',
            'url': '/api/admin/auth/me',
            'method': 'GET',
            'headers': headers
        },
        {
            'name': 'LLM Queue Status',
            'url': '/api/admin/llm-center/queue',
            'method': 'GET',
            'headers': headers
        },
        {
            'name': 'LLM Mappings',
            'url': '/api/admin/llm-center/mappings',
            'method': 'GET',
            'headers': headers
        },
        {
            'name': 'LLM Processing Stats',
            'url': '/api/admin/llm-center/processing-stats',
            'method': 'GET',
            'headers': headers
        },
        {
            'name': 'Train LLM Model',
            'url': '/api/admin/train-model',
            'method': 'POST',
            'headers': headers
        },
        {
            'name': 'Bulk Upload',
            'url': '/api/admin/bulk-upload',
            'method': 'POST',
            'headers': headers,
            'test_file': True
        }
    ]
    
    results = {}
    
    for endpoint in endpoints:
        print(f"\n2. Testing {endpoint['name']}...")
        try:
            if endpoint.get('test_file', False):
                # Test bulk upload with small CSV
                test_csv = """Merchant Name,Category,Notes,Ticker Symbol,Confidence
TEST_MERCHANT,Test Category,Test notes,TEST,95.0"""
                files = {'file': ('test.csv', test_csv, 'text/csv')}
                response = requests.post(f"{base_url}{endpoint['url']}", 
                                       headers=endpoint['headers'], files=files)
            else:
                if endpoint['method'] == 'GET':
                    response = requests.get(f"{base_url}{endpoint['url']}", 
                                          headers=endpoint['headers'])
                else:
                    response = requests.post(f"{base_url}{endpoint['url']}", 
                                           headers=endpoint['headers'])
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('success', True):  # Some endpoints don't have success field
                        print(f"   SUCCESS: {endpoint['name']}")
                        results[endpoint['name']] = {
                            'status': 'success',
                            'data': data
                        }
                        
                        # Show key data for important endpoints
                        if endpoint['name'] == 'LLM Queue Status':
                            queue_data = data.get('data', {}).get('queue_status', {})
                            print(f"      Total mappings: {queue_data.get('total_mappings', 0)}")
                            print(f"      Approved: {queue_data.get('approved', 0)}")
                            
                        elif endpoint['name'] == 'LLM Mappings':
                            mappings = data.get('mappings', [])
                            print(f"      Mappings returned: {len(mappings)}")
                            print(f"      Total mappings: {data.get('total_mappings', 0)}")
                            
                        elif endpoint['name'] == 'Train LLM Model':
                            results_data = data.get('results', {})
                            print(f"      Dataset: {results_data.get('dataset_stats', {}).get('total_mappings', 0)} mappings")
                            print(f"      Accuracy: {results_data.get('training_metrics', {}).get('accuracy', 0):.1%}")
                            
                        elif endpoint['name'] == 'Bulk Upload':
                            upload_data = data.get('data', {})
                            print(f"      Processed: {upload_data.get('processed_rows', 0)} rows")
                            print(f"      Errors: {len(upload_data.get('errors', []))}")
                    else:
                        print(f"   FAILED: {endpoint['name']} - {data.get('error', 'Unknown error')}")
                        results[endpoint['name']] = {'status': 'failed', 'error': data.get('error')}
                except json.JSONDecodeError:
                    print(f"   Non-JSON: {endpoint['name']}")
                    results[endpoint['name']] = {'status': 'non_json', 'response': response.text[:100]}
            else:
                print(f"   HTTP ERROR: {endpoint['name']} - {response.status_code}")
                results[endpoint['name']] = {'status': 'http_error', 'code': response.status_code}
                
        except Exception as e:
            print(f"   ERROR: {endpoint['name']} - {e}")
            results[endpoint['name']] = {'status': 'exception', 'error': str(e)}
    
    # Step 3: Test database connectivity
    print(f"\n3. Testing Database Connectivity...")
    try:
        response = requests.get(f"{base_url}/api/admin/llm-center/mappings", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                total_mappings = data.get('total_mappings', 0)
                print(f"   Database connected: {total_mappings} mappings in database")
                
                # Test if we can read specific data
                mappings = data.get('mappings', [])
                if mappings:
                    sample = mappings[0]
                    print(f"   Sample mapping: {sample.get('merchant_name', 'N/A')} -> {sample.get('ticker_symbol', 'N/A')}")
                else:
                    print(f"   Database is empty (0 mappings)")
            else:
                print(f"   Database query failed: {data.get('error')}")
        else:
            print(f"   Database connection failed: HTTP {response.status_code}")
    except Exception as e:
        print(f"   Database test error: {e}")
    
    # Step 4: Summary
    print(f"\n4. SUMMARY")
    print("=" * 60)
    success_count = sum(1 for r in results.values() if r.get('status') == 'success')
    total_count = len(results)
    
    print(f"Successful endpoints: {success_count}/{total_count}")
    
    for name, result in results.items():
        status = result.get('status', 'unknown')
        if status == 'success':
            print(f"   SUCCESS: {name}")
        else:
            print(f"   FAILED: {name}: {status}")
    
    if success_count == total_count:
        print(f"\nALL ENDPOINTS WORKING! LLM Center is fully functional!")
    else:
        print(f"\n{total_count - success_count} endpoints need attention")
    
    return results

if __name__ == "__main__":
    test_all_llm_endpoints()
