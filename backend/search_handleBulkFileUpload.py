#!/usr/bin/env python3

import re

def search_handleBulkFileUpload():
    with open('../frontend/src/components/admin/LLMCenter.jsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Search for handleBulkFileUpload function
    if 'handleBulkFileUpload' in content:
        print("Found handleBulkFileUpload function")
        
        # Find the function definition
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'handleBulkFileUpload' in line and '=' in line:
                print(f"Line {i+1}: {line.strip()}")
                
                # Show the function
                start = i
                end = min(len(lines), i+50)
                print("\nFunction:")
                for j in range(start, end):
                    if j < len(lines):
                        print(f"{j+1:4}: {lines[j]}")
                    if j > start and '}' in lines[j] and 'const' not in lines[j]:
                        break
                break
    else:
        print("handleBulkFileUpload function not found")

if __name__ == "__main__":
    search_handleBulkFileUpload()
