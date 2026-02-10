import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Menu,
  X,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react'
import SEO from '../components/common/SEO'

const ContactUs = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
    website: '' // honeypot
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5111'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitSuccess(true)
        setFormData({ name: '', email: '', subject: 'General Inquiry', message: '', website: '' })
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Unable to send message. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const subjectOptions = [
    'General Inquiry',
    'Technical Support',
    'Partnership',
    'Feedback',
    'Other'
  ]

  return (
    <>
      <SEO
        title="Contact Us | Kamioi - Get in Touch"
        description="Have questions about Kamioi? Get in touch with our team. We're here to help with investing questions, technical support, partnerships, and more."
        keywords="contact kamioi, customer support, investing help, fintech support"
        breadcrumbs={[
          { name: "Home", url: "https://kamioi.com/" },
          { name: "Contact", url: "https://kamioi.com/contact" }
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Kamioi",
          "description": "Get in touch with the Kamioi team",
          "url": "https://kamioi.com/contact",
          "mainEntity": {
            "@type": "Organization",
            "name": "Kamioi",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": "support@kamioi.com"
            }
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Navigation */}
        <nav className="fixed w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <button onClick={() => navigate('/')} className="text-2xl font-bold text-white">
                    Kamioi
                  </button>
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => navigate('/features')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => navigate('/how-it-works')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => navigate('/learn')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Learn
                </button>
                <button
                  onClick={() => navigate('/blog')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Blog
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Pricing
                </button>
                <button
                  onClick={() => navigate('/contact')}
                  className="text-white font-semibold transition-colors"
                >
                  Contact
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                >
                  <span>Start Building</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMenuOpen(!isMenuOpen)}
                  className="text-white"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-black/30 backdrop-blur-lg border-t border-white/10">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <button
                  onClick={() => { navigate('/features'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Features
                </button>
                <button
                  onClick={() => { navigate('/how-it-works'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  How It Works
                </button>
                <button
                  onClick={() => { navigate('/learn'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Learn
                </button>
                <button
                  onClick={() => { navigate('/blog'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Blog
                </button>
                <button
                  onClick={() => { navigate('/pricing'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Pricing
                </button>
                <button
                  onClick={() => { navigate('/contact'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
                >
                  Contact
                </button>
                <button
                  onClick={() => { navigate('/login'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Login
                </button>
                <button
                  onClick={() => { navigate('/signup'); setMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                >
                  Start Building
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Have a question, feedback, or want to explore a partnership? We'd love to hear from you.
            </p>
          </div>
        </div>

        {/* Main Content - Two Column */}
        <div className="px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Left Column - Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>

                {submitSuccess ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-white/70">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-200">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Subject *</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      >
                        {subjectOptions.map(option => (
                          <option key={option} value={option} className="bg-gray-900 text-white">
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        rows={6}
                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        required
                      />
                    </div>

                    {/* Honeypot */}
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column - Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Email Us</h3>
                    <p className="text-white/60">support@kamioi.com</p>
                  </div>
                </div>
                <p className="text-white/50 text-sm">For general inquiries, technical support, or partnership opportunities.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Response Time</h3>
                    <p className="text-white/60">Within 24 hours</p>
                  </div>
                </div>
                <p className="text-white/50 text-sm">We aim to respond to all inquiries within one business day.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Secure & Private</h3>
                    <p className="text-white/60">Your data is protected</p>
                  </div>
                </div>
                <p className="text-white/50 text-sm">All communications are encrypted and handled with strict privacy standards.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">FAQ</h3>
                    <p className="text-white/60">Quick answers</p>
                  </div>
                </div>
                <p className="text-white/50 text-sm">Check our <button onClick={() => navigate('/learn')} className="text-blue-400 hover:text-blue-300 underline">Learn page</button> for commonly asked questions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-lg border-t border-white/10 text-white">
          <div className="max-w-7xl mx-auto text-center text-white/70">
            <p>&copy; 2026 Kamioi. Making investing effortless for the next generation.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

export default ContactUs
