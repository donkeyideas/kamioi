import requests

response = requests.get('http://127.0.0.1:5000/api/user/ai/insights', headers={'Authorization': 'Bearer user_token_1760927152574'})
data = response.json()
mappings = data.get('data', [])

print('API Response with confidence_status:')
for i, m in enumerate(mappings[:2]):
    print(f'Mapping {i}: merchant={m.get("merchant_name")}, confidence_status={m.get("confidence_status")}, mapping_id={m.get("mapping_id")}')
