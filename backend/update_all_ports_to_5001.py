import os
import re

def update_ports_in_file(file_path):
    """Update all port 5000 references to 5001 in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace port 5000 with 5001
        updated_content = content.replace('127.0.0.1:5000', '127.0.0.1:5001')
        updated_content = updated_content.replace('localhost:5000', 'localhost:5001')
        updated_content = updated_content.replace(':5000', ':5001')
        
        # Only write if changes were made
        if updated_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"[OK] Updated: {file_path}")
            return True
        else:
            print(f"[SKIP] No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error updating {file_path}: {e}")
        return False

def main():
    frontend_path = r"C:\Users\beltr\100402025KamioiV1\v10072025\frontend\src"
    
    print("Updating all port references from 5000 to 5001...")
    print("=" * 60)
    
    updated_files = 0
    total_files = 0
    
    # Walk through all files in the frontend src directory
    for root, dirs, files in os.walk(frontend_path):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                file_path = os.path.join(root, file)
                total_files += 1
                
                if update_ports_in_file(file_path):
                    updated_files += 1
    
    print("=" * 60)
    print(f"Summary:")
    print(f"   Total files processed: {total_files}")
    print(f"   Files updated: {updated_files}")
    print(f"   Files unchanged: {total_files - updated_files}")
    print("\nPort migration to 5001 complete!")

if __name__ == "__main__":
    main()
