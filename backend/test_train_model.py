import requests
import json

def test_train_model():
    print("Testing train model endpoint...")
    print("=" * 50)
    
    # Test admin login first
    print("1. Testing admin login...")
    login_data = {"email": "info@kamioi.com", "password": "admin123"}
    try:
        response = requests.post(
            'http://127.0.0.1:5001/api/admin/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        if response.status_code == 200:
            token = response.json()['token']
            print(f"[OK] Login successful, token: {token}")
        else:
            print(f"[FAIL] Login failed: {response.status_code} - {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"[FAIL] Login request failed: {e}")
        return False

    # Test train model endpoint
    print("\n2. Testing train model endpoint...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    try:
        response = requests.post(
            'http://127.0.0.1:5001/api/admin/train-model',
            headers=headers,
            timeout=30
        )
        print(f"Train model status: {response.status_code}")
        print(f"Train model response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"[OK] Train model successful!")
                print(f"   Dataset: {result['results']['dataset_stats']['total_mappings']} mappings")
                print(f"   Accuracy: {result['results']['training_metrics']['accuracy']}")
                print(f"   Training time: {result['results']['training_time']}")
                return True
            else:
                print(f"[FAIL] Train model failed: {result.get('error')}")
                return False
        else:
            print(f"[FAIL] Train model failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"[FAIL] Train model error: {e}")
        return False

if __name__ == "__main__":
    test_train_model()