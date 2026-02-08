#!/usr/bin/env python3

# Fix the pending-mappings endpoint to include AI processing fields

import re

# Read the file
with open('app_clean.py', 'r') as f:
    content = f.read()

# Find and replace the SELECT * queries in pending-mappings endpoint
# Replace the first occurrence (pending-mappings endpoint)
pattern1 = r"SELECT \* FROM llm_mappings \s+WHERE status = 'pending' AND user_id IS NOT NULL\s+AND \(merchant_name LIKE \? OR category LIKE \? OR ticker_symbol LIKE \?\)\s+ORDER BY created_at DESC\s+LIMIT \? OFFSET \?"

replacement1 = """SELECT id, transaction_id, merchant_name, ticker, category, confidence, status, admin_approved, ai_processed, company_name, user_id, created_at, notes, ticker_symbol, admin_id, ai_attempted, ai_status, ai_confidence, ai_reasoning, ai_processing_time, ai_model_version
                FROM llm_mappings 
                WHERE status = 'pending' AND user_id IS NOT NULL
                AND (merchant_name LIKE ? OR category LIKE ? OR ticker_symbol LIKE ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?"""

pattern2 = r"SELECT \* FROM llm_mappings \s+WHERE status = 'pending' AND user_id IS NOT NULL\s+ORDER BY created_at DESC\s+LIMIT \? OFFSET \?"

replacement2 = """SELECT id, transaction_id, merchant_name, ticker, category, confidence, status, admin_approved, ai_processed, company_name, user_id, created_at, notes, ticker_symbol, admin_id, ai_attempted, ai_status, ai_confidence, ai_reasoning, ai_processing_time, ai_model_version
                FROM llm_mappings 
                WHERE status = 'pending' AND user_id IS NOT NULL
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?"""

# Apply the replacements
content = re.sub(pattern1, replacement1, content, count=1)
content = re.sub(pattern2, replacement2, content, count=1)

# Also fix the mappings_list.append section to include AI fields
mappings_pattern = r"mappings_list\.append\(\{\s*'id': mapping\[0\],\s*'transaction_id': mapping\[1\],\s*'merchant_name': mapping\[2\],\s*'ticker': mapping\[3\],\s*'category': mapping\[4\],\s*'confidence': mapping\[5\],\s*'status': mapping\[6\],\s*'admin_approved': mapping\[7\],\s*'ai_processed': mapping\[8\],\s*'company_name': mapping\[9\],\s*'user_id': mapping\[10\],\s*'created_at': mapping\[11\],\s*'notes': mapping\[12\],\s*'ticker_symbol': mapping\[13\],\s*'admin_id': mapping\[14\]\s*\}\)"

mappings_replacement = """mappings_list.append({
                'id': mapping[0],
                'transaction_id': mapping[1],
                'merchant_name': mapping[2],
                'ticker': mapping[3],
                'category': mapping[4],
                'confidence': mapping[5],
                'status': mapping[6],
                'admin_approved': mapping[7],
                'ai_processed': mapping[8],
                'company_name': mapping[9],
                'user_id': mapping[10],
                'created_at': mapping[11],
                'notes': mapping[12],
                'ticker_symbol': mapping[13],
                'admin_id': mapping[14],
                'ai_attempted': mapping[15] if len(mapping) > 15 else None,
                'ai_status': mapping[16] if len(mapping) > 16 else None,
                'ai_confidence': mapping[17] if len(mapping) > 17 else None,
                'ai_reasoning': mapping[18] if len(mapping) > 18 else None,
                'ai_processing_time': mapping[19] if len(mapping) > 19 else None,
                'ai_model_version': mapping[20] if len(mapping) > 20 else None
            })"""

# Apply the mappings replacement
content = re.sub(mappings_pattern, mappings_replacement, content, count=1)

# Write the file back
with open('app_clean.py', 'w') as f:
    f.write(content)

print("Fixed pending-mappings endpoint to include AI processing fields")
