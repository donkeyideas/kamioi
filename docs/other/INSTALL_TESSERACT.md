# Installing Tesseract OCR for Receipt Processing

## Critical: Tesseract OCR Engine Required

The receipt processing system requires **Tesseract OCR** to automatically extract text from receipt images. The Python wrapper (`pytesseract`) is installed, but you need the actual Tesseract OCR engine.

## Installation Instructions for Windows

### Option 1: Install Tesseract for Windows (Recommended)

1. **Download Tesseract OCR:**
   - Go to: https://github.com/UB-Mannheim/tesseract/wiki
   - Download the latest Windows installer (e.g., `tesseract-ocr-w64-setup-5.x.x.exe`)

2. **Install Tesseract:**
   - Run the installer
   - **IMPORTANT:** Install to default location: `C:\Program Files\Tesseract-OCR\`
   - Or note the installation path if you choose a different location

3. **Verify Installation:**
   - The system will automatically find Tesseract if installed to default location
   - If installed elsewhere, you may need to set the path in the code

### Option 2: Set Custom Tesseract Path

If Tesseract is installed in a non-standard location, you can set it in the code:

```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Path\To\Tesseract-OCR\tesseract.exe'
```

## Testing OCR Installation

After installing Tesseract, test it by running:

```bash
cd backend
python test_ocr.py
```

This will test OCR on your receipt images and show you what text is extracted.

## Alternative: Cloud OCR Services

If you prefer not to install Tesseract locally, you can use cloud OCR services:

1. **Google Cloud Vision API** - High accuracy, paid
2. **AWS Textract** - Good for receipts, paid
3. **Azure Computer Vision** - Microsoft's OCR service, paid

These would require API keys and modifying the `receipt_processing_service.py` to use their APIs instead of Tesseract.

## Current Status

- ✅ Python packages installed: `pytesseract`, `Pillow`
- ❌ Tesseract OCR engine: **NOT INSTALLED** (This is the issue!)

## Next Steps

1. Install Tesseract OCR using Option 1 above
2. Restart your backend server
3. Test receipt upload - OCR should now work automatically


