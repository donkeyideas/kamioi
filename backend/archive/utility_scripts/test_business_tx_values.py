import requests
import json

r = requests.get(
    'http://localhost:5111/api/business/transactions',
    headers={'Authorization': 'Bearer token_108'},
    timeout=5
)
data = r.json()
txs = data.get('data', [])
print(f'Transactions: {len(txs)}')

if txs:
    tx = txs[0]
    print(f'Sample transaction:')
    print(f'  round_up: {tx.get("round_up")}')
    print(f'  fee: {tx.get("fee")}')
    print(f'  ticker: {tx.get("ticker")}')
    print(f'  status: {tx.get("status")}')
    print(f'  amount: {tx.get("amount")}')
    
    round_ups_sum = sum(float(t.get('round_up', 0) or 0) for t in txs)
    fees_sum = sum(float(t.get('fee', 0) or 0) for t in txs)
    mapped_count = sum(1 for t in txs if t.get('ticker') is not None)
    
    print(f'\nAggregates:')
    print(f'  Round-ups sum: ${round_ups_sum}')
    print(f'  Fees sum: ${fees_sum}')
    print(f'  Mapped count: {mapped_count}')

