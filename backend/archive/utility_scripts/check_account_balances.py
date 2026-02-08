import sqlite3

conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

print("Checking account_balances table:")
cursor.execute("SELECT account_number, balance, last_updated FROM account_balances ORDER BY account_number LIMIT 20")
rows = cursor.fetchall()

if rows:
    print(f"\nFound {len(rows)} balances:")
    print("-" * 60)
    for row in rows:
        account_num = row[0]
        balance = row[1] if row[1] is not None else 0
        last_updated = row[2] or "N/A"
        print(f"Account {account_num}: ${balance:,.2f} (Updated: {last_updated})")
else:
    print("No balances found in account_balances table")

print("\n\nChecking chart_of_accounts table:")
cursor.execute("SELECT account_number, account_name FROM chart_of_accounts WHERE account_number IN ('10100', '10150', '11000', '12000')")
accounts = cursor.fetchall()

if accounts:
    print(f"\nFound {len(accounts)} accounts:")
    for account in accounts:
        print(f"  {account[0]}: {account[1]}")

conn.close()

