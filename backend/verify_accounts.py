import sqlite3
import json

# Connect to database
conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Get all users
cursor.execute('SELECT user_guid, name, email, account_type, account_number, mx_data, registration_completed FROM users ORDER BY id DESC LIMIT 3')
results = cursor.fetchall()

print("All 3 test accounts:")
print("=" * 80)

for row in results:
    user_guid, name, email, account_type, account_number, mx_data, registration_completed = row
    mx_status = "Present" if mx_data else "None"
    print(f"User GUID: {user_guid}")
    print(f"Name: {name}")
    print(f"Email: {email}")
    print(f"Account Type: {account_type}")
    print(f"Account Number: {account_number}")
    print(f"MX Data: {mx_status}")
    print(f"Registration Completed: {registration_completed}")
    print("-" * 40)

conn.close()
