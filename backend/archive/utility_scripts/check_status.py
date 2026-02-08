import sqlite3

conn = sqlite3.connect('kamioi.db')
cur = conn.cursor()

# Check transaction status
cur.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
pending = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM transactions WHERE status = 'mapped'")
mapped = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM llm_mappings")
mappings = cur.fetchone()[0]

print(f"Pending transactions: {pending}")
print(f"Mapped transactions: {mapped}")
print(f"Total mappings: {mappings}")

conn.close()


