import sqlite3

# Connect to database
conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Delete all test mappings
cursor.execute("""
    DELETE FROM llm_mappings 
    WHERE merchant_name LIKE '%Test%' 
    OR merchant_name LIKE '%SMALL TECH%' 
    OR merchant_name LIKE '%UNKNOWN%' 
    OR merchant_name LIKE '%OBSCURE%'
""")

deleted_count = cursor.rowcount
print(f"Deleted {deleted_count} test mappings")

# Show remaining mappings
cursor.execute("SELECT COUNT(*) FROM llm_mappings")
remaining_count = cursor.fetchone()[0]
print(f"Remaining mappings: {remaining_count}")

# Show what's left
cursor.execute("SELECT id, merchant_name, mapping_id, user_id FROM llm_mappings LIMIT 5")
remaining_mappings = cursor.fetchall()
print("Remaining mappings:")
for mapping in remaining_mappings:
    print(f"  ID: {mapping[0]}, Merchant: {mapping[1]}, Mapping ID: {mapping[2]}, User ID: {mapping[3]}")

conn.commit()
conn.close()
print("Database cleanup complete!")

