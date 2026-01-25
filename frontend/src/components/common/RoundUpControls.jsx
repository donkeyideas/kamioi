import React, { useState } from 'react'
import { Check, Settings, Info, DollarSign } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const RoundUpControls = ({ 
  currentAmount, 
  onAmountChange, 
  isActive, 
  onToggleActive,
  accountType = 'individual' 
}) => {
  const { isLightMode } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('')

  const presetAmounts = [1, 2, 3, 4, 5]
  
  const getTextClass = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg border-gray-200' : 'bg-white/10 backdrop-blur-lg border-white/20'

  const handleAmountSelect = (amount) => {
    onAmountChange(amount)
    setIsOpen(false)
  }

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount)
    if (amount > 0 && amount <= 100) {
      onAmountChange(amount)
      setCustomAmount('')
      setIsOpen(false)
    }
  }

  const getAccountTypeLabel = () => {
    switch(accountType) {
      case 'family': return 'Family Round-Up'
      case 'business': return 'Business Round-Up'
      default: return 'Round-Up'
    }
  }

  return (
    <div className="relative">
      {/* Round-Up Control Button */}
      <div className={`${getCardClass()} rounded-xl border p-4 transition-all hover:scale-105`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-semibold ${getTextClass()}`}>
                {getAccountTypeLabel()}
              </h3>
              <p className={`text-sm ${getSubtextClass()}`}>
                {isActive ? `$${currentAmount} per transaction` : 'Round-up disabled'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Toggle Switch */}
            <button
              onClick={onToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            
            {/* Settings Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isOpen 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-gray-500/20 text-gray-400 hover:bg-blue-500/20 hover:text-blue-400'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 ${getCardClass()} rounded-xl border p-4 z-50`}>
          <div className="space-y-4">
            <h4 className={`font-semibold ${getTextClass()}`}>Choose Round-Up Amount</h4>
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleAmountSelect(amount)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentAmount === amount
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{amount}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${getTextClass()}`}>
                Custom Amount (Max $100)
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className={`flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 ${getTextClass()} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  onClick={handleCustomAmount}
                  disabled={!customAmount || parseFloat(customAmount) <= 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Info Text */}
            <div className={`text-xs ${getSubtextClass()} bg-blue-500/10 p-3 rounded-lg`}>
              <p className="font-medium mb-1">How it works:</p>
              <p>• Round-up applies to NEW transactions only</p>
              <p>• Example: $24.50 → $25.00 (round-up: $0.50)</p>
              <p>• Kamioi fee: 25% of round-up amount</p>
              <p>• Total charged: Original + Round-up + Fee</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoundUpControls



