#!/usr/bin/env python3
"""Test script for business bank file upload endpoint"""
import requests
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test configuration
API_BASE_URL = "http://localhost:5111"
TEST_FILE = r"C:\Users\beltr\Downloads\Business_Test_Data_With_Errors.csv"
TEST_TOKEN = "user_token_108"  # Business user token

def test_bank_upload():
    """Test the business bank file upload endpoint"""
    print("=" * 60)
    print("Testing Business Bank File Upload")
    print("=" * 60)
    
    # Check if file exists
    if not os.path.exists(TEST_FILE):
        print(f"Test file not found: {TEST_FILE}")
        return False
    
    print(f"Test file: {TEST_FILE}")
    print(f"API URL: {API_BASE_URL}/api/business/upload-bank-file")
    print(f"Token: {TEST_TOKEN[:20]}...")
    print()
    
    # Read the file
    try:
        with open(TEST_FILE, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE), f, 'text/csv')}
            headers = {
                'Authorization': f'Bearer {TEST_TOKEN}'
            }
            
            print("Uploading file...")
            response = requests.post(
                f"{API_BASE_URL}/api/business/upload-bank-file",
                files=files,
                headers=headers,
                timeout=60
            )
            
            print(f"Response status: {response.status_code}")
            print()
            
            if response.status_code == 200:
                result = response.json()
                print("Upload successful!")
                print(f"   Processed: {result.get('data', {}).get('processed', 0)} transactions")
                print(f"   Total rows: {result.get('data', {}).get('total_rows', 0)}")
                print(f"   Errors: {result.get('data', {}).get('error_count', 0)}")
                
                errors = result.get('data', {}).get('errors', [])
                if errors:
                    print(f"\nErrors ({len(errors)}):")
                    for i, error in enumerate(errors[:10], 1):  # Show first 10 errors
                        print(f"   {i}. {error}")
                    if len(errors) > 10:
                        print(f"   ... and {len(errors) - 10} more errors")
                
                return result.get('success', False)
            else:
                print(f"Upload failed!")
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except requests.exceptions.ConnectionError:
        print("Connection error - is the server running?")
        print(f"   Make sure the backend server is running on {API_BASE_URL}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_bank_upload()
    sys.exit(0 if success else 1)

