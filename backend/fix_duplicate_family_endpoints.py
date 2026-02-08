import re

def fix_duplicate_family_endpoints():
    """Remove duplicate family endpoint definitions from app_clean.py"""
    
    print("Fixing duplicate family endpoints...")
    print("=" * 50)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Find the duplicate section that was added
    duplicate_start = content.find('# =============================================================================\n# MISSING FAMILY AI ENDPOINTS\n# =============================================================================')
    
    if duplicate_start != -1:
        # Find the end of the duplicate section (before the main block)
        main_block_start = content.find('if __name__ == "__main__":', duplicate_start)
        
        if main_block_start != -1:
            # Remove the duplicate section
            new_content = content[:duplicate_start] + content[main_block_start:]
            
            # Write the cleaned content
            with open('app_clean.py', 'w') as f:
                f.write(new_content)
            
            print("[OK] Duplicate family endpoints removed successfully!")
            print("Removed duplicate family AI endpoints section")
            return True
        else:
            print("[ERROR] Could not find main block to remove duplicates")
            return False
    else:
        print("[INFO] No duplicate family endpoints found")
        return True

if __name__ == "__main__":
    fix_duplicate_family_endpoints()
