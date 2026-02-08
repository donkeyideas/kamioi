#!/usr/bin/env python3

# Fix the approved-mappings endpoint to include AI processing fields

import re

# Read the file
with open('app_clean.py', 'r') as f:
    content = f.read()

# Find and replace the SELECT * queries in approved-mappings endpoint
# Replace the first occurrence (approved-mappings endpoint)
pattern1 = r"SELECT \* FROM llm_mappings \s+WHERE status = 'approved' AND user_id IS NOT NULL\s+AND \(merchant_name LIKE \? OR category LIKE \? OR ticker_symbol LIKE \?\)\s+ORDER BY created_at DESC\s+LIMIT \? OFFSET \?"

replacement1 = """SELECT id, transaction_id, merchant_name, ticker, category, confidence, status, admin_approved, ai_processed, company_name, user_id, created_at, notes, ticker_symbol, admin_id, ai_attempted, ai_status, ai_confidence, ai_reasoning, ai_processing_time, ai_model_version
                FROM llm_mappings 
                WHERE status = 'approved' AND user_id IS NOT NULL
                AND (merchant_name LIKE ? OR category LIKE ? OR ticker_symbol LIKE ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?"""

pattern2 = r"SELECT \* FROM llm_mappings \s+WHERE status = 'approved' AND user_id IS NOT NULL\s+ORDER BY created_at DESC\s+LIMIT \? OFFSET \?"

replacement2 = """SELECT id, transaction_id, merchant_name, ticker, category, confidence, status, admin_approved, ai_processed, company_name, user_id, created_at, notes, ticker_symbol, admin_id, ai_attempted, ai_status, ai_confidence, ai_reasoning, ai_processing_time, ai_model_version
                FROM llm_mappings 
                WHERE status = 'approved' AND user_id IS NOT NULL
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?"""

# Apply the replacements
content = re.sub(pattern1, replacement1, content, count=1)
content = re.sub(pattern2, replacement2, content, count=1)

# Write the file back
with open('app_clean.py', 'w') as f:
    f.write(content)

print("Fixed approved-mappings endpoint to include AI processing fields")

