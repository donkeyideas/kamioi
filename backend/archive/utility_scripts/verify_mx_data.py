import sqlite3
import json

# Connect to database
conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Get MX data for each account
cursor.execute('SELECT user_guid, name, account_type, mx_data FROM users ORDER BY id DESC LIMIT 3')
results = cursor.fetchall()

print("MX Data Verification:")
print("=" * 80)

for row in results:
    user_guid, name, account_type, mx_data = row
    print(f"\n{account_type.upper()} Account: {name} ({user_guid})")
    print("-" * 50)
    
    if mx_data:
        try:
            mx_json = json.loads(mx_data)
            accounts = mx_json.get('accounts', [])
            print(f"Connected Accounts: {len(accounts)}")
            for i, account in enumerate(accounts, 1):
                print(f"  {i}. {account.get('name', 'Unknown')} ({account.get('type', 'Unknown')})")
                print(f"     Balance: ${account.get('balance', 0):,.2f}")
                print(f"     Account Number: {account.get('accountNumber', 'Unknown')}")
        except json.JSONDecodeError:
            print("Error parsing MX data")
    else:
        print("No MX data found")

conn.close()
