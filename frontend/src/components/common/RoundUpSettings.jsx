import React, { useState, useEffect } from 'react'
import { Percent, Save, Settings, Info, DollarSign } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const RoundUpSettings = ({ onSettingsChange }) => {
  const [roundUpAmount, setRoundUpAmount] = useState(1.00)
  const { isLightMode } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  
  // Admin-controlled settings (not user-configurable)
  const adminFeeType = 'flat' // Admin sets this
  const adminFlatFee = 0.25 // Admin sets this
  const adminFeePercentage = 12.5 // Admin sets this

  // Load ONLY user settings from localStorage on mount
  useEffect(() => {
    const savedRoundUp = localStorage.getItem('kamioi_roundup_amount')
    if (savedRoundUp) {
      setRoundUpAmount(parseFloat(savedRoundUp))
    }
  }, [])

  const handleSaveSettings = () => {
    // Save ONLY user settings to localStorage
    localStorage.setItem('kamioi_roundup_amount', roundUpAmount.toString())
    
    // Notify parent component
    if (onSettingsChange) {
      onSettingsChange({
        roundUpAmount: roundUpAmount
      })
    }
    
    setIsOpen(false)
    
    // Show success notification
    alert(`Investment amount saved: $${roundUpAmount.toFixed(2)} per transaction`)
  }

  const calculateExample = () => {
    const purchase = 100.50
    const roundUp = roundUpAmount
    const fee = adminFeeType === 'flat' ? adminFlatFee : roundUp * (adminFeePercentage / 100)
    const investable = roundUp // ENTIRE round-up goes to investment
    const total = purchase + roundUp + fee
    
    return {
      purchase,
      roundUp,
      fee,
      investable,
      total
    }
  }

  const example = calculateExample()

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isLightMode 
            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        <DollarSign className="w-4 h-4" />
        Investment Amount
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl shadow-xl ${
            isLightMode ? 'bg-white' : 'bg-gray-800'
          }`}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-xl font-bold ${
                isLightMode ? 'text-gray-900' : 'text-white'
              }`}>
                Investment Amount Settings
              </h2>
              <p className={`text-sm mt-1 ${
                isLightMode ? 'text-gray-600' : 'text-gray-400'
              }`}>
                Set how much you want to invest per transaction
              </p>
            </div>

            {/* Settings Form */}
            <div className="p-6 space-y-6">
              {/* Round-Up Amount Setting */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isLightMode ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Investment Amount per Transaction
                </label>
                <select
                  value={roundUpAmount}
                  onChange={(e) => setRoundUpAmount(parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isLightMode
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-700 border-gray-600 text-white'
                  }`}
                >
                  <option value={1.00}>$1.00</option>
                  <option value={2.00}>$2.00</option>
                  <option value={3.00}>$3.00</option>
                  <option value={4.00}>$4.00</option>
                  <option value={5.00}>$5.00</option>
                </select>
                <p className={`text-xs mt-1 ${
                  isLightMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  This amount will be added to every purchase for investment
                </p>
              </div>

              {/* Fee Information (Read-Only) */}
              <div className={`p-3 rounded-lg ${
                isLightMode ? 'bg-gray-50 border border-gray-200' : 'bg-gray-800 border border-gray-700'
              }`}>
                <label className={`block text-sm font-medium mb-1 ${
                  isLightMode ? 'text-gray-700' : 'text-gray-300'
                }`}>
                  <Info className="w-4 h-4 inline mr-1" />
                  Platform Fee (Set by Admin)
                </label>
                <p className={`text-sm ${
                  isLightMode ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  ${adminFlatFee.toFixed(2)} per transaction
                </p>
                <p className={`text-xs mt-1 ${
                  isLightMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  This fee is set by the administrator and supports platform operations
                </p>
              </div>

              {/* Example Calculation */}
              <div className={`p-4 rounded-lg ${
                isLightMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-800'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span className={`text-sm font-medium ${
                    isLightMode ? 'text-blue-800' : 'text-blue-300'
                  }`}>
                    Example: Nike Shoes Purchase
                  </span>
                </div>
                <div className={`space-y-1 text-sm ${
                  isLightMode ? 'text-blue-700' : 'text-blue-200'
                }`}>
                  <div className="flex justify-between">
                    <span>Original Purchase:</span>
                    <span>${example.purchase.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Round-Up Amount:</span>
                    <span>${example.roundUp.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kamioi Fee ({adminFeeType === 'flat' ? 'Flat' : `${adminFeePercentage}%`}):</span>
                    <span>${example.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-1 font-medium">
                    <span>Total Charged:</span>
                    <span>${example.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Invested in NKE:</span>
                    <span>${example.investable.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  isLightMode 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoundUpSettings
