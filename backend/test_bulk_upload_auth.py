import requests
import os

# Test the bulk upload endpoint with authentication
file_path = r'C:\Users\beltr\Dropbox\LLM Mapping\New folder\Mapping Master.10152015.v2.csv'

if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

# Test the bulk upload with authentication
url = "http://127.0.0.1:5000/api/admin/bulk-upload"
headers = {
    'Authorization': 'Bearer token_1',
    'Content-Type': 'multipart/form-data'
}

try:
    with open(file_path, 'rb') as f:
        files = {'file': (os.path.basename(file_path), f, 'text/csv')}
        response = requests.post(url, files=files, headers={'Authorization': 'Bearer token_1'})
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("SUCCESS: Bulk upload worked!")
    else:
        print("FAILED: Bulk upload failed!")
        
except Exception as e:
    print(f"Error: {e}")


