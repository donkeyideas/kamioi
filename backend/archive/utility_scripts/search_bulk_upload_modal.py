#!/usr/bin/env python3

import re

def search_bulk_upload_modal():
    with open('../frontend/src/components/admin/LLMCenter.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Search for bulk upload modal
    if 'Bulk Upload Excel/CSV' in content:
        print("Found bulk upload modal in LLMCenter.jsx")
        
        # Find the line number
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'Bulk Upload Excel/CSV' in line:
                print(f"Line {i+1}: {line.strip()}")
                
                # Show context around the modal
                start = max(0, i-5)
                end = min(len(lines), i+20)
                print("\nContext:")
                for j in range(start, end):
                    marker = ">>> " if j == i else "    "
                    print(f"{marker}{j+1:4}: {lines[j]}")
                break
    else:
        print("Bulk upload modal not found in LLMCenter.jsx")
        
        # Search for file upload handling
        if 'file' in content.lower():
            print("\nSearching for file upload handling...")
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'file' in line.lower() and ('input' in line.lower() or 'upload' in line.lower()):
                    print(f"Line {i+1}: {line.strip()}")

if __name__ == "__main__":
    search_bulk_upload_modal()
