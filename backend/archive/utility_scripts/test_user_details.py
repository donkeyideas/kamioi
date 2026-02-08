import requests
import json

# Test the /api/admin/users endpoint
response = requests.get(
    'http://localhost:5111/api/admin/users',
    headers={'Authorization': 'Bearer admin_token_3'},
    timeout=5
)

print(f"Status: {response.status_code}")
data = response.json()

if data.get('success'):
    users = data.get('users', [])
    print(f"Total users: {len(users)}")
    
    # Find user 108
    user_108 = [u for u in users if u.get('id') == 108]
    if user_108:
        u = user_108[0]
        print(f"\nUser 108 (Nick Al):")
        print(f"  Round-ups: ${u.get('round_ups', 0)}")
        print(f"  Fees: ${u.get('fees', 0)}")
        print(f"  Total Balance: ${u.get('total_balance', 0)}")
        print(f"  AI Health: {u.get('ai_health', 0)}")
        print(f"  Mapping Accuracy: {u.get('mapping_accuracy', 0)}%")
        print(f"  Engagement: {u.get('engagement_score', 0)}")
        print(f"  Activity Count: {u.get('activity_count', 0)}")
        print(f"  City: {u.get('city', 'Unknown')}")
        print(f"  State: {u.get('state', 'Unknown')}")
        print(f"  ZIP: {u.get('zip_code', 'Unknown')}")
        print(f"  Phone: {u.get('phone', 'Unknown')}")
        print(f"\nAll fields in response:")
        for key in sorted(u.keys()):
            print(f"  {key}: {u[key]}")
    else:
        print("\nUser 108 not found in response")
        if users:
            print(f"Sample user fields: {list(users[0].keys())}")
else:
    print(f"Error: {data.get('error', 'Unknown error')}")

