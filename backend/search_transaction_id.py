#!/usr/bin/env python3

import re

def search_transaction_id():
    with open('app_clean.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Search for transaction_id references
    matches = re.finditer(r'transaction_id', content, re.IGNORECASE)
    
    print("Found references to 'transaction_id':")
    for match in matches:
        start = max(0, match.start() - 50)
        end = min(len(content), match.end() + 50)
        context = content[start:end]
        print(f"Line {content[:match.start()].count(chr(10)) + 1}: ...{context}...")
        print()

if __name__ == "__main__":
    search_transaction_id()
