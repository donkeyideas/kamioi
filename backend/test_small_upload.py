#!/usr/bin/env python3

import requests
import io
import csv

def test_small_upload():
    base_url = "http://localhost:5000"
    
    print("Testing bulk upload with small CSV data...")
    
    # Step 1: Login to get token
    login_data = {"email": "info@kamioi.com", "password": "admin123"}
    try:
        response = requests.post(f"{base_url}/api/admin/auth/login", json=login_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                token = data.get('token')
                print(f"Login successful: {token[:20]}...")
            else:
                print(f"Login failed: {data.get('error')}")
                return
        else:
            print(f"Login request failed: {response.status_code}")
            return
    except Exception as e:
        print(f"Login error: {e}")
        return
    
    # Step 2: Create a small test CSV
    test_csv_content = """Merchant Name,Category,Notes,Ticker Symbol,Confidence
STARBUCKS,Food & Dining,Coffee purchase,SBUX,95.0
MCDONALDS,Food & Dining,Fast food,MCD,90.0
WALMART,Retail,Grocery shopping,WMT,85.0"""
    
    # Step 3: Test bulk upload
    headers = {'Authorization': f'Bearer {token}'}
    files = {'file': ('test.csv', test_csv_content, 'text/csv')}
    
    try:
        print("Sending bulk upload request...")
        response = requests.post(f"{base_url}/api/admin/bulk-upload", 
                               headers=headers, files=files)
        
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("Bulk upload successful!")
                print(f"Processed rows: {data.get('data', {}).get('processed_rows', 0)}")
            else:
                print(f"Bulk upload failed: {data.get('error')}")
        else:
            print(f"Bulk upload request failed: {response.status_code}")
            
    except Exception as e:
        print(f"Bulk upload error: {e}")

if __name__ == "__main__":
    test_small_upload()
