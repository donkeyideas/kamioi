import re

def fix_duplicate_endpoints():
    """Remove duplicate endpoint definitions from app_clean.py"""
    
    print("Fixing duplicate endpoint definitions...")
    print("=" * 50)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Find and remove duplicate family endpoints
    # Look for the duplicate section that was added
    duplicate_start = content.find('# =============================================================================\n# FAMILY DASHBOARD ENDPOINTS\n# =============================================================================')
    
    if duplicate_start != -1:
        # Find the end of the duplicate section (before the main block)
        main_block_start = content.find('if __name__ == "__main__":', duplicate_start)
        
        if main_block_start != -1:
            # Remove the duplicate section
            new_content = content[:duplicate_start] + content[main_block_start:]
            
            # Write the cleaned content
            with open('app_clean.py', 'w') as f:
                f.write(new_content)
            
            print("[OK] Duplicate endpoints removed successfully!")
            print("Removed duplicate family endpoints section")
            return True
        else:
            print("[ERROR] Could not find main block to remove duplicates")
            return False
    else:
        print("[INFO] No duplicate endpoints found")
        return True

if __name__ == "__main__":
    fix_duplicate_endpoints()
