"""Find Tesseract executable"""
import os

search_path = r'C:\Users\beltr\Kamioi\5.5.1 source code'

print(f"Searching for Tesseract in: {search_path}")
print(f"Path exists: {os.path.exists(search_path)}")

if os.path.exists(search_path):
    print("\nContents of directory:")
    try:
        items = os.listdir(search_path)
        for item in items[:20]:  # First 20 items
            item_path = os.path.join(search_path, item)
            item_type = "DIR" if os.path.isdir(item_path) else "FILE"
            print(f"  [{item_type}] {item}")
    except Exception as e:
        print(f"Error listing directory: {e}")
    
    print("\nSearching for tesseract.exe...")
    found = []
    for root, dirs, files in os.walk(search_path):
        if 'tesseract.exe' in files:
            full_path = os.path.join(root, 'tesseract.exe')
            found.append(full_path)
            print(f"  FOUND: {full_path}")
    
    if not found:
        print("  No tesseract.exe found in this directory tree")
    else:
        print(f"\nUsing: {found[0]}")
else:
    print(f"Path does not exist: {search_path}")


