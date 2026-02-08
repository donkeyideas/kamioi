"""Test receipt parsing"""
from PIL import Image
import pytesseract
import re

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

img = Image.open(r'C:\Users\beltr\Downloads\7Xl9u54tRsXjbZRetDrdqGrbmLz8jqmeW5HsOZQA.png')
text = pytesseract.image_to_string(img, config='--oem 3 --psm 11')
lines = text.split('\n')

print("=== FINDING NIKE ITEM ===")
for i, line in enumerate(lines):
    if 'nike' in line.lower():
        print(f"\nLine {i}: {repr(line)}")
        print(f"Line {i-2}: {repr(lines[i-2]) if i-2 >= 0 else 'N/A'}")
        print(f"Line {i-1}: {repr(lines[i-1]) if i-1 >= 0 else 'N/A'}")
        print(f"Line {i}: {repr(line)}")
        print(f"Line {i+1}: {repr(lines[i+1]) if i+1 < len(lines) else 'N/A'}")
        print(f"Line {i+2}: {repr(lines[i+2]) if i+2 < len(lines) else 'N/A'}")
        print(f"Line {i+3}: {repr(lines[i+3]) if i+3 < len(lines) else 'N/A'}")
        print(f"Line {i+4}: {repr(lines[i+4]) if i+4 < len(lines) else 'N/A'}")
        break

print("\n=== ALL LINES WITH PRICES ===")
for i, line in enumerate(lines):
    if re.search(r'\$?\d+\.\d{2}', line):
        print(f"Line {i}: {repr(line)}")


