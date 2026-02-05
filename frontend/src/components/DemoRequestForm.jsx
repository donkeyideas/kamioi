import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Send, User, Mail, Phone, MapPin, Briefcase, MessageSquare, CheckCircle } from 'lucide-react'

const DemoRequestForm = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    interest_type: '',
    heard_from: '',
    experience_level: '',
    memo: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5111'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/demo-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        // Reset form after 3 seconds and close
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            interest_type: '',
            heard_from: '',
            experience_level: '',
            memo: ''
          })
          setSubmitSuccess(false)
          onClose()
        }, 3000)
      } else {
        setError(data.error || 'Failed to submit request. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Success state
  if (submitSuccess) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-green-500/30 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Request Submitted!</h3>
          <p className="text-gray-300 mb-2">Thank you for your interest in Kamioi.</p>
          <p className="text-gray-400 text-sm">We'll review your request and send you a demo access code soon.</p>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg my-8 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Request Demo Access</h2>
            <p className="text-sm text-gray-400 mt-1">Get early access to Kamioi's automatic investing platform</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
            />
          </div>

          {/* City/Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              City <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="New York, NY"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors"
            />
          </div>

          {/* Two columns for dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Interest Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Briefcase className="w-4 h-4 inline mr-2" />
                Interest
              </label>
              <select
                name="interest_type"
                value={formData.interest_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-800">Select...</option>
                <option value="personal" className="bg-gray-800">Personal Investing</option>
                <option value="family" className="bg-gray-800">Family Plan</option>
                <option value="business" className="bg-gray-800">Business Use</option>
                <option value="curious" className="bg-gray-800">Just Curious</option>
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Experience
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-gray-800">Select...</option>
                <option value="beginner" className="bg-gray-800">Beginner</option>
                <option value="some" className="bg-gray-800">Some Experience</option>
                <option value="experienced" className="bg-gray-800">Experienced</option>
              </select>
            </div>
          </div>

          {/* How did you hear about us */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              How did you hear about us?
            </label>
            <select
              name="heard_from"
              value={formData.heard_from}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-800">Select...</option>
              <option value="social_media" className="bg-gray-800">Social Media</option>
              <option value="search" className="bg-gray-800">Search Engine</option>
              <option value="friend" className="bg-gray-800">Friend/Referral</option>
              <option value="blog" className="bg-gray-800">Blog/Article</option>
              <option value="other" className="bg-gray-800">Other</option>
            </select>
          </div>

          {/* Message/Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Why are you interested? <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              placeholder="Tell us why you're interested in automatic investing..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Request Demo Access</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By submitting, you agree to receive communications from Kamioi about your demo request.
          </p>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default DemoRequestForm
