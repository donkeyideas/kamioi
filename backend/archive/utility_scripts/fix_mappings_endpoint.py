#!/usr/bin/env python3

# Fix the /api/admin/llm-center/mappings endpoint to include AI processing fields

file_path = 'app_clean.py'

with open(file_path, 'r') as f:
    content = f.read()

# Find the specific section for the mappings endpoint
old_section = """        # Convert to list of dictionaries
        mappings_list = []
        for mapping in mappings:
            mappings_list.append({
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
                'admin_id': mapping[14]
            })"""

new_section = """        # Convert to list of dictionaries
        mappings_list = []
        for mapping in mappings:
            mappings_list.append({
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

# Replace the section
content = content.replace(old_section, new_section)

# Write the file back
with open(file_path, 'w') as f:
    f.write(content)

print("Fixed /api/admin/llm-center/mappings endpoint to include AI processing fields")
