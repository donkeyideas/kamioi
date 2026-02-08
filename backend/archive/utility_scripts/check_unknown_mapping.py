import sqlite3

conn = sqlite3.connect('kamioi.db')
cursor = conn.cursor()

# Check for UNKNOWN ONLINE SERVICE mapping
cursor.execute("SELECT id, merchant_name, ticker_symbol, ai_attempted, ai_status, ai_confidence, ai_reasoning FROM llm_mappings WHERE merchant_name = 'UNKNOWN ONLINE SERVICE' ORDER BY id DESC LIMIT 1")
result = cursor.fetchone()

if result:
    print('UNKNOWN ONLINE SERVICE mapping:')
    print(f'ID: {result[0]}')
    print(f'Merchant: {result[1]}')
    print(f'Ticker: {result[2]}')
    print(f'AI Attempted: {result[3]}')
    print(f'AI Status: {result[4]}')
    print(f'AI Confidence: {result[5]}')
    print(f'AI Reasoning: {result[6]}')
else:
    print('No UNKNOWN ONLINE SERVICE mapping found')

# Check for any mappings with TGT ticker
cursor.execute("SELECT id, merchant_name, ticker_symbol, ai_attempted, ai_status, ai_confidence FROM llm_mappings WHERE ticker_symbol = 'TGT' ORDER BY id DESC LIMIT 3")
results = cursor.fetchall()

print('\nTGT mappings:')
for result in results:
    print(f'ID: {result[0]}, Merchant: {result[1]}, Ticker: {result[2]}, AI Attempted: {result[3]}, AI Status: {result[4]}, AI Confidence: {result[5]}')

conn.close()

