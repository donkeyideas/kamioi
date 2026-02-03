import React, { useState, useRef } from 'react'
import { AlertCircle, Loader, Upload, FileText, Camera, CheckCircle, X } from 'lucide-react'

// Company logo mapping - using popular logo APIs and CDNs
const getCompanyLogo = (stockSymbol) => {
  const logoMap = {
    // Popular retailers
    'TGT': 'https://logo.clearbit.com/target.com',
    'WMT': 'https://logo.clearbit.com/walmart.com',
    'COST': 'https://logo.clearbit.com/costco.com',
    'AMZN': 'https://logo.clearbit.com/amazon.com',
    'BBY': 'https://logo.clearbit.com/bestbuy.com',
    'HD': 'https://logo.clearbit.com/homedepot.com',
    'LOW': 'https://logo.clearbit.com/lowes.com',
    'TJX': 'https://logo.clearbit.com/tjx.com',
    'FL': 'https://logo.clearbit.com/footlocker.com',
    
    // Food & Beverage
    'SBUX': 'https://logo.clearbit.com/starbucks.com',
    'PSY': 'https://logo.clearbit.com/pillsbury.com',
    'KO': 'https://logo.clearbit.com/coca-cola.com',
    'PEP': 'https://logo.clearbit.com/pepsico.com',
    
    // Technology
    'AAPL': 'https://logo.clearbit.com/apple.com',
    'MSFT': 'https://logo.clearbit.com/microsoft.com',
    'GOOGL': 'https://logo.clearbit.com/google.com',
    'HPQ': 'https://logo.clearbit.com/hp.com',
    'NKE': 'https://logo.clearbit.com/nike.com',
    
    // Payment processors
    'PYPL': 'https://logo.clearbit.com/paypal.com',
    'V': 'https://logo.clearbit.com/visa.com',
    'MA': 'https://logo.clearbit.com/mastercard.com',
  }
  
  return logoMap[stockSymbol] || null
}

// Fallback component for when logo fails to load
const StockLogo = ({ symbol, companyName }) => {
  const [logoError, setLogoError] = useState(false)
  const logoUrl = getCompanyLogo(symbol)
  
  if (!logoUrl || logoError) {
    // Fallback to text symbol if logo fails or doesn't exist
    return (
      <span className="text-white text-xs font-bold">
        {symbol}
      </span>
    )
  }
  
  return (
    <img
      src={logoUrl}
      alt={companyName || symbol}
      className="w-full h-full object-contain"
      onError={() => setLogoError(true)}
      style={{ 
        maxWidth: '100%', 
        maxHeight: '100%',
        backgroundColor: 'transparent'
      }}
    />
  )
}

const ReceiptUpload = ({ onTransactionProcessed }) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
  const [, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [processingStatus, setProcessingStatus] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [allocationPreview, setAllocationPreview] = useState(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editedData, setEditedData] = useState(null)
  const [userCorrections, setUserCorrections] = useState({})
  const [tickerSuggestions, setTickerSuggestions] = useState({}) // itemIndex -> suggestions
  const [activeTickerSearch, setActiveTickerSearch] = useState(null) // {itemIndex, field: 'brand'|'retailer'}
  const [manualData, setManualData] = useState({
    retailer: '',
    totalAmount: '',
    items: [{ name: '', amount: '', brand: '' }]
  })
  const fileInputRef = useRef(null)

  const handleFileUpload = async (file) => {
    if (!file) return

    // Validate file type - accept PNG, JPG, JPEG, PDF
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf']
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    
    const isValidExtension = allowedExtensions.includes(fileExtension)
    const isValidType = allowedTypes.includes(file.type)
    
    if (!isValidExtension && !isValidType) {
      alert(`Invalid file type: ${file.name}\n\nAccepted formats: PNG, JPG, JPEG, PDF`)
      return
    }

    setIsUploading(true)
    setProcessingStatus('uploading')
    setUploadedFile(file)

    try {
      // Get auth token once for all requests
      const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      
      // Step 1: Upload file to server
      const formData = new FormData()
      formData.append('receipt', file)
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/receipts/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }
      const receiptId = result.receiptId
      setUploadedFile({ receiptId, filename: result.filename })
      setProcessingStatus('processing')

      // Step 2: Process receipt with AI (show progress)
      setProcessingStatus('extracting')
      const processResponse = await fetch(`${apiBaseUrl}/api/receipts/${receiptId}/process`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({})  // Can pass raw_text if available
              })

      if (!processResponse.ok) throw new Error('Processing failed')

      const processResult = await processResponse.json()
      if (!processResult.success) {
        throw new Error(processResult.error || 'Processing failed')
      }
      const processedData = processResult.data
      
      // Check if OCR truly failed - only show manual entry if we got NOTHING useful
      // If we got at least retailer OR items OR total, proceed with what we have
      const hasRetailer = processedData?.retailer && processedData.retailer.name
      const hasItems = processedData?.items && processedData.items.length > 0
      const hasTotal = processedData?.totalAmount && processedData.totalAmount > 0
      
      // Only show manual entry if we got absolutely nothing useful
      if (!processedData || (processedData.needs_manual_entry && !hasRetailer && !hasItems && !hasTotal)) {
        // Offer manual entry option only if OCR completely failed
        setShowManualEntry(true)
        setProcessingStatus('manual-entry')
        return
      }
      
      // If we got ANY data (even partial), use it automatically
      // Only show manual entry if we got absolutely nothing
      if (hasRetailer || hasTotal || hasItems) {
        // We have extracted data - use it automatically
        // Ensure brand data is in correct format (object with name/stockSymbol)
        if (processedData.items) {
          processedData.items = processedData.items.map(item => {
            // If brand is a string, keep it as-is for manual entry compatibility
            // If brand is already an object, keep it
            if (item.brand && typeof item.brand === 'object') {
              return item // Already correct format
            }
            return item
          })
        }
        
                setExtractedData(processedData)
                setProcessingStatus('analyzing')
                
                // Continue to allocation step
                // Don't show manual entry form - proceed with what we extracted
              } else {
                // Complete failure - show manual entry
                setShowManualEntry(true)
                setProcessingStatus('manual-entry')
                return
              }

              // Step 3: Calculate round-up allocation (show progress)
              setProcessingStatus('analyzing')
              const allocationResponse = await fetch(`${apiBaseUrl}/api/receipts/${receiptId}/allocate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })

      if (!allocationResponse.ok) {
        const errorData = await allocationResponse.json().catch(() => ({ error: 'Allocation failed' }))
        console.error('Allocation API error:', errorData)
        throw new Error(errorData.error || 'Allocation failed')
      }

      const allocationResult = await allocationResponse.json()
      console.log('Allocation result:', allocationResult)
      
      if (!allocationResult.success) {
        console.error('Allocation failed:', allocationResult.error)
        throw new Error(allocationResult.error || 'Allocation failed')
      }
      
      // Ensure we have the expected structure
      if (!allocationResult.allocations || !Array.isArray(allocationResult.allocations)) {
        console.error('Invalid allocation result structure:', allocationResult)
        throw new Error('Invalid allocation result structure')
      }
      
      setAllocationPreview(allocationResult)
      setProcessingStatus('completed')

    } catch (error) {
      console.error('Receipt processing error:', error)
      setProcessingStatus('error')
      // If processing fails, offer manual entry
      if (uploadedFile) {
        setTimeout(() => {
          setShowManualEntry(true)
          setProcessingStatus('manual-entry')
        }, 1000)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setProcessingStatus(null)
    setExtractedData(null)
    setAllocationPreview(null)
    setShowManualEntry(false)
    setManualData({
      retailer: '',
      totalAmount: '',
      items: [{ name: '', amount: '', brand: '' }]
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleManualEntrySubmit = async () => {
    try {
      // Process manual entry data
      const totalAmount = parseFloat(manualData.totalAmount) || 0
      const items = manualData.items
        .filter(item => item.name && item.amount)
        .map(item => ({
          name: item.name,
          amount: parseFloat(item.amount) || 0,
          brand: item.brand || null
        }))

      // Create extracted data structure
      const processedData = {
        retailer: manualData.retailer ? { name: manualData.retailer, stockSymbol: null } : null,
        items: items,
        totalAmount: totalAmount,
        timestamp: new Date().toISOString()
      }

      setExtractedData(processedData)
      setShowManualEntry(false)
      setProcessingStatus('analyzing')

      // Calculate allocation if we have a receipt ID
      if (uploadedFile?.receiptId) {
        const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
        
        // First, update the receipt with the manual data
        await fetch(`${apiBaseUrl}/api/receipts/${uploadedFile.receiptId}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            raw_text: `Manual Entry: ${manualData.retailer} - Total: $${totalAmount}`
          })
        })

        // Then calculate allocation
        const allocationResponse = await fetch(`${apiBaseUrl}/api/receipts/${uploadedFile.receiptId}/allocate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })

        if (allocationResponse.ok) {
          const allocationResult = await allocationResponse.json()
          if (allocationResult.success) {
            setAllocationPreview(allocationResult)
            setProcessingStatus('completed')
          }
        }
      }
    } catch (error) {
      console.error('Manual entry processing error:', error)
      setProcessingStatus('error')
    }
  }

  const renderManualEntry = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Review & Edit Receipt Data</h3>
          <p className="text-gray-400 text-sm">
            {manualData.retailer || manualData.totalAmount ? 
              "AI extracted data from your receipt. Please review and edit if needed." :
              "OCR couldn't read your receipt. Please enter the details manually."}
          </p>
        </div>
        <button
          onClick={resetUpload}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">Retailer/Store Name</label>
          <input
            type="text"
            value={manualData.retailer}
            onChange={(e) => setManualData({ ...manualData, retailer: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="e.g., Foot Locker, Target, Nike"
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Total Amount</label>
          <input
            type="number"
            step="0.01"
            value={manualData.totalAmount}
            onChange={(e) => setManualData({ ...manualData, totalAmount: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Items (Optional - for better allocation)</label>
          {manualData.items.map((item, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={item.name}
                onChange={(e) => {
                  const newItems = [...manualData.items]
                  newItems[index].name = e.target.value
                  setManualData({ ...manualData, items: newItems })
                }}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="Item name"
              />
              <input
                type="text"
                value={typeof item.brand === 'string' ? item.brand : (item.brand?.name || '')}
                onChange={(e) => {
                  const newItems = [...manualData.items]
                  newItems[index].brand = e.target.value
                  setManualData({ ...manualData, items: newItems })
                }}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="Brand (e.g., Nike)"
              />
              <input
                type="number"
                step="0.01"
                value={item.amount}
                onChange={(e) => {
                  const newItems = [...manualData.items]
                  newItems[index].amount = e.target.value
                  setManualData({ ...manualData, items: newItems })
                }}
                className="w-24 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="Amount"
              />
              {index > 0 && (
                <button
                  onClick={() => {
                    const newItems = manualData.items.filter((_, i) => i !== index)
                    setManualData({ ...manualData, items: newItems })
                  }}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => setManualData({ ...manualData, items: [...manualData.items, { name: '', amount: '', brand: '' }] })}
            className="text-blue-400 hover:text-blue-300 text-sm mt-2"
          >
            + Add Item
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={resetUpload}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleManualEntrySubmit}
            disabled={!manualData.retailer || !manualData.totalAmount}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Receipt
          </button>
        </div>
      </div>
    </div>
  )

  const confirmTransaction = async () => {
    try {
      const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
      const response = await fetch('${apiBaseUrl}/api/transactions/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          receiptData: {...extractedData, receipt_id: uploadedFile?.receiptId},
          allocation: allocationPreview
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[ReceiptUpload] Transaction created successfully:', result)
        
        // Submit to LLM Center for learning (after successful transaction creation)
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
          console.log('[ReceiptUpload] Submitting receipt to LLM Center:', {
            receiptId: uploadedFile?.receiptId,
            hasReceiptData: !!extractedData,
            hasAllocation: !!allocationPreview
          })
          
          const llmResponse = await fetch(`${apiBaseUrl}/api/receipts/submit-to-llm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              receiptData: {...extractedData, receipt_id: uploadedFile?.receiptId},
              allocation: allocationPreview,
              receiptId: uploadedFile?.receiptId,
              rawOcrText: extractedData?.raw_text || '',
              corrections: userCorrections // User corrections from edits
            })
          })
          
          if (llmResponse.ok) {
            const llmResult = await llmResponse.json()
            console.log('[ReceiptUpload] ✅ Receipt submitted to LLM Center successfully:', llmResult)
            // Dispatch event to refresh AI Insights page
            window.dispatchEvent(new CustomEvent('receipt-mapping-created', { 
              detail: { receiptId: uploadedFile?.receiptId, mappings: llmResult.mappings || [] }
            }))
          } else {
            const llmError = await llmResponse.text()
            console.error('[ReceiptUpload] ❌ LLM submission failed:', llmResponse.status, llmError)
          }
        } catch (llmError) {
          console.error('[ReceiptUpload] ❌ Failed to submit receipt to LLM Center:', llmError)
          // Don't fail transaction creation if LLM submission fails
        }
        
        console.log('[ReceiptUpload] Calling onTransactionProcessed callback:', { result, hasCallback: !!onTransactionProcessed })
        if (result.success && onTransactionProcessed) {
          console.log('[ReceiptUpload] Calling callback with transactionId:', result.transactionId)
          onTransactionProcessed(result)
        } else {
          console.warn('[ReceiptUpload] Callback not called:', { success: result.success, hasCallback: !!onTransactionProcessed })
        }
        resetUpload()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create transaction')
      }
    } catch (error) {
      console.error('Transaction creation error:', error)
    }
  }

  const renderUploadArea = () => (
    <div
      className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,image/jpg,application/pdf"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        className="hidden"
      />
      
      <div className="space-y-4">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Upload Receipt or Invoice
          </h3>
          <p className="text-gray-400 text-sm">
            Drag and drop your receipt here, or click to browse
          </p>
        </div>
        
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span>PDF, JPG, JPEG, PNG</span>
          </span>
          <span className="flex items-center space-x-1">
            <Camera className="w-4 h-4" />
            <span>Photo receipts</span>
          </span>
        </div>
      </div>
    </div>
  )

          const renderProcessingStatus = () => {
            const statusConfig = {
              uploading: { icon: Upload, text: 'Uploading receipt...', color: 'text-blue-400', animate: false },
              processing: { icon: Loader, text: 'Processing receipt...', color: 'text-yellow-400', animate: true },
              extracting: { icon: Loader, text: 'Extracting text with OCR...', color: 'text-yellow-400', animate: true },
              'manual-entry': { icon: AlertCircle, text: 'OCR failed - Manual entry required', color: 'text-orange-400', animate: false },
              analyzing: { icon: Loader, text: 'Identifying brands and stocks...', color: 'text-purple-400', animate: true },
              completed: { icon: CheckCircle, text: 'Processing complete!', color: 'text-green-400', animate: false },
              error: { icon: AlertCircle, text: 'Processing failed', color: 'text-red-400', animate: false }
            }

            const config = statusConfig[processingStatus] || statusConfig.processing
            const Icon = config.icon

            return (
              <div className="text-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  processingStatus === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  <Icon className={`w-8 h-8 ${config.color} ${
                    config.animate ? 'animate-spin' : ''
                  }`} />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {config.text}
                  </h3>
                  {processingStatus === 'processing' && (
                    <p className="text-gray-400 text-sm">
                      Our AI is reading your receipt and identifying brands...
                    </p>
                  )}
                  {processingStatus === 'extracting' && (
                    <p className="text-gray-400 text-sm">
                      Reading text from your receipt image...
                    </p>
                  )}
                  {processingStatus === 'analyzing' && (
                    <p className="text-gray-400 text-sm">
                      Calculating round-up allocation across relevant stocks...
                    </p>
                  )}
                </div>
              </div>
            )
          }

  const renderExtractedData = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Receipt Analysis</h3>
        <button
          onClick={resetUpload}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Transaction Summary */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Retailer:</span>
            <span className="text-white">{extractedData?.retailer?.name || extractedData?.retailer || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-white">${extractedData?.totalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Round-up Amount:</span>
            <span className="text-green-400">
              {allocationPreview?.totalRoundUp ? `$${allocationPreview.totalRoundUp.toFixed(2)}` : '$0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Items Breakdown */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Items Purchased</h4>
        <div className="space-y-2">
          {extractedData?.items?.map((item, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div>
                <span className="text-white">{item.name}</span>
                {(item.brand?.name || item.brandSymbol) && (
                  <span className="text-gray-400 ml-2">
                    ({item.brand?.name || item.brandSymbol || item.brand})
                  </span>
                )}
              </div>
              <span className="text-white">${item.amount?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

              {/* Investment Allocation */}
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Investment Allocation</h4>
                <div className="space-y-3">
                  {allocationPreview?.allocations && allocationPreview.allocations.length > 0 ? (
                    allocationPreview.allocations.map((allocation, index) => {
                      const confidence = allocation.confidence || 1.0
                      const confidenceColor = confidence >= 0.9 ? 'text-green-400' : confidence >= 0.7 ? 'text-yellow-400' : 'text-red-400'
                      const confidenceLabel = confidence >= 0.9 ? 'High' : confidence >= 0.7 ? 'Medium' : 'Low'
                      
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 flex items-center justify-center">
                              <StockLogo 
                                symbol={allocation.stockSymbol} 
                                companyName={allocation.stockName || allocation.companyName}
                              />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="text-white font-medium">{allocation.stockName}</div>
                                {confidence < 1.0 && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${confidenceColor} bg-${confidence >= 0.9 ? 'green' : confidence >= 0.7 ? 'yellow' : 'red'}-500/20`}>
                                    {confidenceLabel} ({Math.round(confidence * 100)}%)
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-400 text-xs">{allocation.reason}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-400 font-medium">
                              ${allocation.amount?.toFixed(2)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {allocation.percentage?.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm">
                        {allocationPreview ? 'No allocations calculated' : 'Calculating allocations...'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Warning if low confidence mappings */}
                {allocationPreview?.allocations && allocationPreview.allocations.some(a => (a.confidence || 1.0) < 0.7) && (
                  <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs">
                    ⚠️ Some stock mappings have low confidence. Please review and edit if needed.
                  </div>
                )}
              </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={resetUpload}
          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-lg transition-all"
        >
          Upload Another
        </button>
        <button
          onClick={() => {
            setEditedData({...extractedData})
            setShowEditModal(true)
          }}
          className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 py-3 px-4 rounded-lg transition-all"
        >
          Edit Details
        </button>
        <button
          onClick={confirmTransaction}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all"
        >
          Confirm Investment
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Smart Receipt Processing
        </h2>
        <p className="text-gray-400">
          Upload your receipt and let our AI automatically invest your round-up across relevant stocks
        </p>
      </div>

      <div className="bg-white/5 rounded-lg p-6">
        {!uploadedFile && !showManualEntry && renderUploadArea()}
        {uploadedFile && !extractedData && !showManualEntry && renderProcessingStatus()}
        {showManualEntry && renderManualEntry()}
        {extractedData && !showManualEntry && renderExtractedData()}
      </div>

      {/* Example */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">How it works:</h4>
        <div className="text-sm text-gray-400 space-y-2">
          <p>1. Upload your receipt (PDF, JPG, PNG)</p>
          <p>2. AI extracts items, brands, and amounts</p>
          <p>3. System identifies relevant stocks (retailer + brands)</p>
          <p>4. Round-up is allocated across all relevant stocks</p>
          <p>5. Confirm to execute the investment</p>
        </div>
        
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
          <p className="text-blue-400 text-sm font-medium">Example:</p>
          <p className="text-gray-300 text-sm">
            $100 purchase at Foot Locker (Nike + Under Armour) = $1 round-up split between FL, NKE, and UAA stocks
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editedData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Receipt Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Retailer */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Retailer/Store Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editedData.retailer?.name || editedData.retailer || ''}
                    onChange={async (e) => {
                      const retailerValue = e.target.value
                      setEditedData({
                        ...editedData,
                        retailer: editedData.retailer && typeof editedData.retailer === 'object' 
                          ? {...editedData.retailer, name: retailerValue}
                          : {name: retailerValue, stockSymbol: null}
                      })
                      
                      // Search for ticker suggestions
                      if (retailerValue.length >= 2) {
                        setActiveTickerSearch({itemIndex: 'retailer', field: 'retailer'})
                        try {
                          const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
                          const response = await fetch(
                            `${apiBaseUrl}/api/receipts/search-ticker?q=${encodeURIComponent(retailerValue)}`,
                            {
                              headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                              }
                            }
                          )
                          
                          if (response.ok) {
                            const result = await response.json()
                            if (result.success) {
                              setTickerSuggestions(prev => ({
                                ...prev,
                                retailer: result.suggestions || []
                              }))
                            }
                          }
                        } catch (error) {
                          console.error('Error searching ticker:', error)
                        }
                      } else {
                        setTickerSuggestions(prev => {
                          const newSuggestions = {...prev}
                          delete newSuggestions.retailer
                          return newSuggestions
                        })
                        setActiveTickerSearch(null)
                      }
                    }}
                    onFocus={() => {
                      const retailerValue = editedData.retailer?.name || editedData.retailer || ''
                      if (retailerValue.length >= 2) {
                        setActiveTickerSearch({itemIndex: 'retailer', field: 'retailer'})
                      }
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Foot Locker, Target, Nike"
                  />
                  
                  {/* Ticker Suggestions Dropdown for Retailer */}
                  {activeTickerSearch?.itemIndex === 'retailer' && activeTickerSearch?.field === 'retailer' && tickerSuggestions.retailer && tickerSuggestions.retailer.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {tickerSuggestions.retailer.map((suggestion, sugIdx) => (
                        <div
                          key={sugIdx}
                          onClick={() => {
                            setEditedData({
                              ...editedData,
                              retailer: {
                                name: suggestion.company_name || suggestion.merchant_name,
                                stockSymbol: suggestion.ticker
                              }
                            })
                            setTickerSuggestions(prev => {
                              const newSuggestions = {...prev}
                              delete newSuggestions.retailer
                              return newSuggestions
                            })
                            setActiveTickerSearch(null)
                          }}
                          className="px-4 py-3 hover:bg-blue-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-blue-600">{suggestion.ticker}</span>
                                <span className="text-gray-800 font-medium">{suggestion.company_name}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {suggestion.match_reason} • {suggestion.category}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {((suggestion.confidence || 0) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Show selected ticker if available */}
                {editedData.retailer && typeof editedData.retailer === 'object' && editedData.retailer.stockSymbol && (
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Stock Ticker:</span>
                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                      {editedData.retailer.stockSymbol}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedData.totalAmount || ''}
                  onChange={(e) => setEditedData({...editedData, totalAmount: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Items Purchased</label>
                <div className="space-y-2">
                  {editedData.items?.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-4 space-y-2">
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={item.name || ''}
                            onChange={async (e) => {
                              const itemName = e.target.value
                              const newItems = [...editedData.items]
                              newItems[index].name = itemName
                              setEditedData({...editedData, items: newItems})
                              
                              // Auto-search for ticker when user types item name (e.g., "HP ENVY" → HPQ)
                              if (itemName.length >= 3 && !item.brand?.stockSymbol) {
                                try {
                                  const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
                                  const response = await fetch(
                                    `${apiBaseUrl}/api/receipts/search-ticker?q=${encodeURIComponent(itemName)}`,
                                    {
                                      headers: {
                                        'Content-Type': 'application/json',
                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                      }
                                    }
                                  )
                                  
                                  if (response.ok) {
                                    const result = await response.json()
                                    if (result.success && result.suggestions && result.suggestions.length > 0) {
                                      // Auto-select best match if confidence is high
                                      const bestMatch = result.suggestions[0]
                                      if (bestMatch.confidence > 0.8) {
                                        newItems[index].brand = {
                                          name: bestMatch.company_name,
                                          stockSymbol: bestMatch.ticker
                                        }
                                        setEditedData({...editedData, items: newItems})
                                        console.log(`Auto-mapped "${itemName}" to ${bestMatch.ticker} (${bestMatch.company_name})`)
                                      } else {
                                        // Show suggestions for user to select
                                        setTickerSuggestions(prev => ({
                                          ...prev,
                                          [`item-${index}`]: result.suggestions || []
                                        }))
                                        setActiveTickerSearch({itemIndex: `item-${index}`, field: 'item'})
                                      }
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error auto-searching ticker:', error)
                                }
                              } else {
                                // Clear suggestions if item name is too short or brand already set
                                setTickerSuggestions(prev => {
                                  const newSuggestions = {...prev}
                                  delete newSuggestions[`item-${index}`]
                                  return newSuggestions
                                })
                                if (activeTickerSearch?.itemIndex === `item-${index}`) {
                                  setActiveTickerSearch(null)
                                }
                              }
                            }}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                            placeholder="Item name (e.g., HP ENVY 4512)"
                          />
                          
                          {/* Ticker Suggestions for Item Name */}
                          {activeTickerSearch?.itemIndex === `item-${index}` && activeTickerSearch?.field === 'item' && tickerSuggestions[`item-${index}`] && tickerSuggestions[`item-${index}`].length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                              <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/10">
                                Suggested tickers for &quot;{item.name}&quot;
                              </div>
                              {tickerSuggestions[`item-${index}`].map((suggestion, sugIdx) => (
                                <div
                                  key={sugIdx}
                                  onClick={() => {
                                    const newItems = [...editedData.items]
                                    newItems[index].brand = {
                                      name: suggestion.company_name || suggestion.merchant_name,
                                      stockSymbol: suggestion.ticker
                                    }
                                    setEditedData({...editedData, items: newItems})
                                    setTickerSuggestions(prev => {
                                      const newSuggestions = {...prev}
                                      delete newSuggestions[`item-${index}`]
                                      return newSuggestions
                                    })
                                    setActiveTickerSearch(null)
                                  }}
                                  className="px-4 py-3 hover:bg-blue-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-mono font-bold text-blue-600">{suggestion.ticker}</span>
                                        <span className="text-gray-800 font-medium">{suggestion.company_name}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {suggestion.match_reason} • {suggestion.category}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {((suggestion.confidence || 0) * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount || ''}
                          onChange={(e) => {
                            const newItems = [...editedData.items]
                            newItems[index].amount = parseFloat(e.target.value) || 0
                            setEditedData({...editedData, items: newItems})
                          }}
                          className="w-24 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                          placeholder="Amount"
                        />
                        <button
                          onClick={() => {
                            const newItems = editedData.items.filter((_, i) => i !== index)
                            setEditedData({...editedData, items: newItems})
                          }}
                          className="text-red-400 hover:text-red-300 px-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={typeof item.brand === 'object' ? item.brand?.name || '' : item.brand || ''}
                          onChange={async (e) => {
                            const brandValue = e.target.value
                            const newItems = [...editedData.items]
                            newItems[index].brand = {name: brandValue, stockSymbol: null}
                            setEditedData({...editedData, items: newItems})
                            
                            // Search for ticker suggestions if user is typing
                            if (brandValue.length >= 2) {
                              setActiveTickerSearch({itemIndex: index, field: 'brand'})
                              try {
                                const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
                                const response = await fetch(
                                  `${apiBaseUrl}/api/receipts/search-ticker?q=${encodeURIComponent(brandValue)}`,
                                  {
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                    }
                                  }
                                )
                                
                                if (response.ok) {
                                  const result = await response.json()
                                  if (result.success) {
                                    setTickerSuggestions(prev => ({
                                      ...prev,
                                      [index]: result.suggestions || []
                                    }))
                                  }
                                }
                              } catch (error) {
                                console.error('Error searching ticker:', error)
                              }
                            } else {
                              setTickerSuggestions(prev => {
                                const newSuggestions = {...prev}
                                delete newSuggestions[index]
                                return newSuggestions
                              })
                              setActiveTickerSearch(null)
                            }
                          }}
                          onFocus={() => {
                            const brandValue = typeof item.brand === 'object' ? item.brand?.name || '' : item.brand || ''
                            if (brandValue.length >= 2) {
                              setActiveTickerSearch({itemIndex: index, field: 'brand'})
                            }
                          }}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                          placeholder="Brand (e.g., Nike, HP, Apple)"
                        />
                        
                        {/* Ticker Suggestions Dropdown */}
                        {activeTickerSearch?.itemIndex === index && activeTickerSearch?.field === 'brand' && tickerSuggestions[index] && tickerSuggestions[index].length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                            {tickerSuggestions[index].map((suggestion, sugIdx) => (
                              <div
                                key={sugIdx}
                                onClick={() => {
                                  const newItems = [...editedData.items]
                                  newItems[index].brand = {
                                    name: suggestion.company_name || suggestion.merchant_name,
                                    stockSymbol: suggestion.ticker
                                  }
                                  setEditedData({...editedData, items: newItems})
                                  setTickerSuggestions(prev => {
                                    const newSuggestions = {...prev}
                                    delete newSuggestions[index]
                                    return newSuggestions
                                  })
                                  setActiveTickerSearch(null)
                                }}
                                className="px-4 py-3 hover:bg-blue-500/20 cursor-pointer border-b border-white/10 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono font-bold text-blue-600">{suggestion.ticker}</span>
                                      <span className="text-gray-800 font-medium">{suggestion.company_name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {suggestion.match_reason} • {suggestion.category}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {((suggestion.confidence || 0) * 100).toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Show selected ticker if available */}
                      {item.brand && typeof item.brand === 'object' && item.brand.stockSymbol && (
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-xs text-gray-400">Stock Ticker:</span>
                          <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                            {item.brand.stockSymbol}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setEditedData({
                      ...editedData,
                      items: [...(editedData.items || []), {name: '', amount: 0, brand: null}]
                    })}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Track user corrections
                    const corrections = {
                      retailer: editedData.retailer?.name !== extractedData?.retailer?.name 
                        ? { before: extractedData?.retailer?.name, after: editedData.retailer?.name }
                        : null,
                      totalAmount: editedData.totalAmount !== extractedData?.totalAmount
                        ? { before: extractedData?.totalAmount, after: editedData.totalAmount }
                        : null,
                      items: editedData.items?.map((item, idx) => {
                        const originalItem = extractedData?.items?.[idx]
                        if (!originalItem) return null
                        return {
                          name: item.name !== originalItem.name 
                            ? { before: originalItem.name, after: item.name }
                            : null,
                          amount: item.amount !== originalItem.amount
                            ? { before: originalItem.amount, after: item.amount }
                            : null,
                          brand: (typeof item.brand === 'object' ? item.brand?.name : item.brand) !== (typeof originalItem.brand === 'object' ? originalItem.brand?.name : originalItem.brand)
                            ? { before: typeof originalItem.brand === 'object' ? originalItem.brand?.name : originalItem.brand, after: typeof item.brand === 'object' ? item.brand?.name : item.brand }
                            : null
                        }
                      }).filter(c => c && (c.name || c.amount || c.brand))
                    }
                    setUserCorrections(corrections)
                    
                    // Recalculate allocation with edited data
                    setExtractedData(editedData)
                    setShowEditModal(false)
                    
                    // Recalculate allocation
                    if (uploadedFile?.receiptId) {
                      try {
                        const token = localStorage.getItem('kamioi_business_token') || localStorage.getItem('kamioi_user_token') || localStorage.getItem('authToken')
                        
                        // Update receipt with edited data
                        await fetch(`${apiBaseUrl}/api/receipts/${uploadedFile.receiptId}/process`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          },
                          body: JSON.stringify({
                            parsed_data_override: editedData
                          })
                        })

                        // Recalculate allocation
                        const allocationResponse = await fetch(`${apiBaseUrl}/api/receipts/${uploadedFile.receiptId}/allocate`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                          }
                        })

                        if (allocationResponse.ok) {
                          const allocationResult = await allocationResponse.json()
                          if (allocationResult.success) {
                            setAllocationPreview(allocationResult)
                          }
                        }
                      } catch (error) {
                        console.error('Error recalculating allocation:', error)
                      }
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiptUpload
