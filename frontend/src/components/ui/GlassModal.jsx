import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

const GlassModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success', 
  showIcon = true,
  autoClose = true,
  autoCloseDelay = 3000,
  showConfirmButtons = false,
  onConfirm = null,
  confirmButtonText = 'Clear All',
  cancelButtonText = 'Cancel'
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-500/30'
      case 'error': return 'border-red-500/30'
      case 'warning': return 'border-yellow-500/30'
      case 'info': return 'border-blue-500/30'
      default: return 'border-gray-500/30'
    }
  }

  const getTitleColor = () => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center min-h-screen p-4" style={{ zIndex: 99999 }}>
      {/* Clean backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" style={{ zIndex: 99998 }} />
      
      {/* Clean Glass Modal - TRULY CENTERED & ON TOP */}
      <div className={`
        relative w-full max-w-md mx-auto my-auto
        bg-white/10 backdrop-blur-xl
        border border-white/20 ${getBorderColor()}
        rounded-2xl shadow-2xl
        transform transition-all duration-300 ease-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `} style={{ zIndex: 99999 }}>
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
        
        {/* Content */}
        <div className="relative p-8 text-center">
          {showIcon && getIcon()}
          
          {title && (
            <h3 className={`text-xl font-semibold mb-3 ${getTitleColor()}`}>
              {title}
            </h3>
          )}
          
          <p className="text-gray-300 text-lg leading-relaxed">
            {message}
          </p>
          
          {/* Action buttons */}
          {showConfirmButtons ? (
            <div className="mt-6 flex space-x-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-white transition-all duration-200 font-medium"
              >
                {cancelButtonText}
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 hover:text-white transition-all duration-200 font-medium"
              >
                {confirmButtonText}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              {autoClose ? 'Close' : 'OK'}
            </button>
          )}
        </div>
        
        {/* Glass shine effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl" />
      </div>
    </div>,
    document.body
  )
}

export default GlassModal
