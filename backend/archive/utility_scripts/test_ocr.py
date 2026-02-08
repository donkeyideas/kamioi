"""Test OCR on receipt images"""
import os
import sys
from PIL import Image

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import codecs
    import io
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

try:
    import pytesseract
    print("[OK] pytesseract imported successfully")
except ImportError as e:
    print(f"[ERROR] Failed to import pytesseract: {e}")
    sys.exit(1)

# Check if Tesseract is installed
tesseract_paths = [
    r'C:\Users\beltr\Kamioi\5.5.1 source code\tesseract.exe',  # User's custom location
    r'C:\Program Files\Tesseract-OCR\tesseract.exe',
    r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    r'C:\Users\beltr\AppData\Local\Programs\Tesseract-OCR\tesseract.exe',
]

# Search in user's custom location subdirectories
custom_path = r'C:\Users\beltr\Kamioi\5.5.1 source code'
if os.path.exists(custom_path):
    for root, dirs, files in os.walk(custom_path):
        if 'tesseract.exe' in files:
            found_path = os.path.join(root, 'tesseract.exe')
            tesseract_paths.insert(0, found_path)  # Put it first
            print(f"[FOUND] Tesseract in subdirectory: {found_path}")

tesseract_found = False
for path in tesseract_paths:
    if os.path.exists(path):
        print(f"[OK] Found Tesseract at: {path}")
        pytesseract.pytesseract.tesseract_cmd = path
        tesseract_found = True
        break

if not tesseract_found:
    print("[ERROR] Tesseract OCR not found in common locations")
    print("  Please install Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki")
    print("  Or set pytesseract.pytesseract.tesseract_cmd to the tesseract.exe path")
    sys.exit(1)

# Test images
test_images = [
    r'C:\Users\beltr\Downloads\7Xl9u54tRsXjbZRetDrdqGrbmLz8jqmeW5HsOZQA.png',
    r'C:\Users\beltr\Downloads\p_34816531_200144578_14286471.jpg',
    r'C:\Users\beltr\Downloads\EM7qVOtUYAAruRx.jpg',
    r'C:\Users\beltr\Downloads\any-way-i-can-tell-of-this-receipt-is-for-size-11-palominos-v0-3mo7vxedndpb1.jpg',
    r'C:\Users\beltr\Downloads\m_5a049f39fbf6f9cde003d3c1.jpg',
]

print("\n" + "="*80)
print("Testing OCR on receipt images...")
print("="*80 + "\n")

for img_path in test_images:
    print(f"\n[TEST] Testing: {os.path.basename(img_path)}")
    print("-" * 80)
    
    if not os.path.exists(img_path):
        print(f"[ERROR] File not found: {img_path}")
        continue
    
    try:
        # Open image
        img = Image.open(img_path)
        print(f"[OK] Image opened: {img.size[0]}x{img.size[1]} pixels, mode: {img.mode}")
        
        # Try different OCR configurations
        configs = [
            ('Default', '--oem 3 --psm 6'),  # Uniform block
            ('Single Block', '--oem 3 --psm 6'),
            ('Sparse Text', '--oem 3 --psm 11'),
            ('Single Line', '--oem 3 --psm 7'),
            ('Single Word', '--oem 3 --psm 8'),
        ]
        
        best_text = ""
        best_config = None
        
        for config_name, config in configs:
            try:
                text = pytesseract.image_to_string(img, config=config)
                text = text.strip()
                if len(text) > len(best_text):
                    best_text = text
                    best_config = config_name
                print(f"  {config_name}: {len(text)} characters")
            except Exception as e:
                print(f"  {config_name}: ERROR - {str(e)}")
        
        if best_text:
            print(f"\n[SUCCESS] Best result ({best_config}): {len(best_text)} characters")
            print(f"\nFirst 500 characters:")
            print(best_text[:500])
            if len(best_text) > 500:
                print("...")
            print(f"\nLast 200 characters:")
            print(best_text[-200:] if len(best_text) > 200 else best_text)
        else:
            print("\n[ERROR] No text extracted from any configuration")
            
    except Exception as e:
        print(f"[ERROR] Error processing image: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n" + "="*80)
print("OCR Testing Complete")
print("="*80)

