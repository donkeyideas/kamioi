import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionLayout from '../components/common/SectionLayout'
import DemoRequestForm from '../components/DemoRequestForm'
import { 
  ArrowRight, 
  Menu,
  X,
  Rocket,
  Shield,
  Database,
  Brain,
  TrendingUp,
  Target,
  Settings,
  FileText,
  Smartphone,
  CheckCircle
} from 'lucide-react'
import SEO from '../components/common/SEO'

const Features = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [showDemoForm, setShowDemoForm] = useState(false)
  const navigate = useNavigate()
  const [frontendContent, setFrontendContent] = useState(null)
  const [contentLoaded, setContentLoaded] = useState(false)
  const hasFetchedRef = useRef(false)

  // Fetch frontend content from API
  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const fetchContent = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        const response = await fetch(`${apiBaseUrl}/api/frontend-content`)
        
        if (response.ok) {
          const data = await response.json()
            if (data.success && data.data) {
              const contentData = data.data
              const apiContent = { ...contentData }
              
              // Get features page content
              if (apiContent.features_page) {
                setFrontendContent(apiContent.features_page)
              } else {
                // Use defaults if no API content
                setFrontendContent({})
              }
            } else {
              setFrontendContent({})
            }
        }
      } catch (error) {
        console.error('Failed to fetch frontend content:', error)
      } finally {
        setContentLoaded(true)
      }
    }

    fetchContent()
  }, [])

  // Get content with defaults
  const getContent = (key, defaultValue) => {
    if (frontendContent && frontendContent[key]) {
      return frontendContent[key]
    }
    return defaultValue
  }

  // Default features content
  const featuresData = useMemo(() => {
    if (frontendContent && Object.keys(frontendContent).length > 0) {
      return frontendContent
    }
    return {
      meta_title: "Kamioi Features: AI-Powered Automatic Investing Platform",
      meta_description: "Discover Kamioi's powerful features: automatic investing, AI-powered stock matching, fractional shares, portfolio tracking, and bank-level security. Start building wealth effortlessly.",
      h1_headline: "Every Feature You Need to Build Wealth Automatically",
      hero_subheading: "Kamioi combines cutting-edge AI, seamless automation, and beginner-friendly design to make investing effortless. Discover how our platform turns everyday spending into a diversified investment portfolio.",
      features: [
        {
          icon: 'Brain',
          title: "100% Automatic Investing",
          headline: "True Hands-Free Investing",
          description: "Connect your bank account once and Kamioi does everything else. No manual stock picking, no timing decisions, no portfolio management. Our AI automatically invests based on your spending patterns, building your portfolio while you focus on living your life.",
          benefits: [
            "Zero manual work after setup",
            "Invest 24/7 without lifting a finger",
            "No investment knowledge required",
            "Set it and forget it wealth building"
          ],
          use_case: "Perfect for busy professionals, beginners, and anyone who wants to build wealth without the complexity of traditional investing."
        },
        {
          icon: 'Brain',
          title: "AI-Powered Brand Matching",
          headline: "Smart Stock Selection Based on Your Life",
          description: "Our proprietary AI analyzes your purchases and automatically invests in the companies you already support. Buy coffee at Starbucks? Own Starbucks stock. Stream on Netflix? Own Netflix. Shop on Amazon? Own Amazon. It's investing that makes sense with your lifestyle.",
          how_it_works: [
            "AI tracks your spending patterns",
            "Identifies publicly-traded companies",
            "Automatically purchases fractional shares",
            "Handles private company purchases by matching to similar public companies",
            "Continuously optimizes your portfolio allocation"
          ],
          technical_details: "Our enterprise-grade machine learning processes millions of transactions daily, ensuring accurate matching and optimal portfolio construction."
        },
        {
          icon: 'TrendingUp',
          title: "Fractional Share Investing",
          headline: "Own Any Stock for as Little as $1",
          description: "Don't have $3,000 for one Amazon share? No problem. Kamioi offers fractional share investing, allowing you to own pieces of expensive stocks for as little as $1. Build a diversified portfolio of premium stocks regardless of your budget.",
          benefits: [
            "No minimum investment required",
            "Own shares in 50+ top companies",
            "Dollar-based investing (invest exact amounts)",
            "Automatic dividend reinvestment",
            "Build diversification on any budget"
          ],
          example: "With $100, you could own fractional shares of Apple, Microsoft, Amazon, Google, and 5 other companies—instant diversification."
        },
        {
          icon: 'TrendingUp',
          title: "Real-Time Portfolio Tracking",
          headline: "Watch Your Wealth Grow",
          description: "Beautiful, intuitive dashboard shows your portfolio performance, holdings, and investment history at a glance. Track returns, see which brands you own, and monitor your progress toward financial goals—all in one clean interface.",
          dashboard_features: [
            "Total portfolio value and returns",
            "Holdings breakdown by company/sector",
            "Investment activity timeline",
            "Performance charts (daily, monthly, yearly)",
            "Dividend tracking",
            "Goal progress indicators",
            "Tax documents (1099s)"
          ],
          mobile_app: "Full-featured iOS and Android apps let you check your portfolio anywhere, anytime."
        },
        {
          icon: 'Shield',
          title: "Bank-Level Security",
          headline: "Your Money is Protected",
          description: "We take security seriously. Kamioi uses 256-bit encryption, two-factor authentication, and read-only bank access to keep your information safe. Your investments are SIPC-insured up to $500,000, providing the same protections as traditional brokerages.",
          security_features: [
            "256-bit SSL encryption",
            "Two-factor authentication (2FA)",
            "Read-only bank account access",
            "SIPC insurance coverage ($500,000)",
            "SOC 2 Type II compliant",
            "Regular security audits",
            "Secure data storage",
            "Never store banking credentials"
          ],
          regulatory: "Kamioi is registered with the SEC and fully compliant with all financial regulations."
        },
        {
          icon: 'Target',
          title: "Smart Portfolio Diversification",
          headline: "Automatic Risk Management",
          description: "Our AI ensures your portfolio stays balanced across multiple companies, sectors, and industries. As your spending patterns change, your portfolio automatically adjusts to maintain healthy diversification.",
          diversification_features: [
            "Spread across 20-50 companies",
            "Multiple sectors (tech, consumer, finance, healthcare)",
            "Automatic rebalancing",
            "Risk assessment tools",
            "Sector allocation monitoring",
            "Prevents over-concentration"
          ],
          why_it_matters: "Diversification is the only free lunch in investing—it reduces risk without sacrificing returns."
        },
        {
          icon: 'Settings',
          title: "Flexible Investment Options",
          headline: "Invest Your Way",
          description: "While Kamioi specializes in automatic investing, you also have the flexibility to make manual investments, set contribution limits, pause investing, and customize your strategy.",
          customization_options: [
            "Set monthly investment limits",
            "Pause automatic investing anytime",
            "Make manual stock purchases",
            "Exclude specific companies",
            "Adjust risk tolerance",
            "Create investment goals",
            "Schedule one-time investments"
          ]
        },
        {
          icon: 'FileText',
          title: "Tax Optimization",
          headline: "Keep More of What You Earn",
          description: "Kamioi helps minimize your tax burden through smart investment strategies and comprehensive tax reporting. Get all the documents you need for stress-free tax filing.",
          tax_features: [
            "Tax-loss harvesting (on higher plans)",
            "Automatic 1099 generation",
            "Capital gains tracking",
            "Dividend income reporting",
            "Downloadable tax forms",
            "Tax-deferred account options",
            "Tax-efficient investment strategies"
          ]
        },
        {
          icon: 'FileText',
          title: "Educational Resources",
          headline: "Learn as You Grow",
          description: "Access our comprehensive library of educational content, guides, and tools designed to help you understand investing and make informed decisions.",
          resources: [
            "Beginner's guides to investing",
            "Video tutorials",
            "Investment glossary",
            "Compound interest calculator",
            "Goal planning tools",
            "Market insights",
            "Weekly investing tips"
          ],
          blog_note: "Visit our Learn page for in-depth articles on investing strategies, market trends, and wealth-building tips."
        },
        {
          icon: 'Smartphone',
          title: "Multi-Device Access",
          headline: "Invest Anywhere, Anytime",
          description: "Seamless experience across all your devices. Start on your phone, continue on your tablet, check your desktop—your portfolio syncs automatically.",
          platform_support: [
            "iOS app (iPhone, iPad)",
            "Android app (phone, tablet)",
            "Web dashboard (all browsers)",
            "Responsive design",
            "Automatic syncing",
            "Push notifications for important updates"
          ]
        }
      ],
      faqs: [
        {
          question: "How does automatic investing work?",
          answer: "Connect your bank account, and our AI automatically tracks your purchases and invests in corresponding stocks. No manual work required after initial setup."
        },
        {
          question: "What if I buy from a company that's not publicly traded?",
          answer: "Our AI finds similar publicly-traded companies in the same industry and invests there instead."
        },
        {
          question: "Can I still invest manually?",
          answer: "Yes! While Kamioi excels at automatic investing, you can also make manual stock purchases anytime."
        },
        {
          question: "Is fractional share investing safe?",
          answer: "Absolutely. Fractional shares have the same protections as full shares, including SIPC insurance coverage."
        },
        {
          question: "How do you keep my information secure?",
          answer: "We use 256-bit encryption, two-factor authentication, and read-only bank access. We never store your banking credentials."
        },
        {
          question: "Can I pause automatic investing?",
          answer: "Yes, you can pause or resume anytime with one click. No penalties or fees."
        },
        {
          question: "What fees do you charge?",
          answer: "Simple monthly subscription ($9 for individuals) with no trading fees, commissions, or hidden costs."
        },
        {
          question: "Do I need investment experience?",
          answer: "Not at all! Kamioi is designed for beginners. No investment knowledge required."
        }
      ]
    }
  }, [frontendContent])

  // Map icon strings to React components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Brain': Brain,
      'TrendingUp': TrendingUp,
      'Shield': Shield,
      'Target': Target,
      'Settings': Settings,
      'FileText': FileText,
      'Smartphone': Smartphone,
      'Database': Database
    }
    
    if (typeof iconName === 'string') {
      const IconComponent = iconMap[iconName]
      return IconComponent ? <IconComponent className="w-8 h-8" /> : <Brain className="w-8 h-8" />
    }
    return iconName || <Brain className="w-8 h-8" />
  }

  if (!contentLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title={getContent('meta_title', featuresData.meta_title)}
        description={getContent('meta_description', featuresData.meta_description)}
        keywords="automatic investing features, investing app features, AI investing platform"
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
                  className="text-white font-semibold transition-colors"
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
                  onClick={() => {
                    navigate('/features')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    navigate('/how-it-works')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => {
                    navigate('/learn')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Learn
                </button>
                <button 
                  onClick={() => {
                    navigate('/blog')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Blog
                </button>
                <button 
                  onClick={() => {
                    navigate('/pricing')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => {
                    navigate('/login')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    navigate('/signup')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  Start Building
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <SectionLayout
              layoutType={featuresData.layout_type}
              images={featuresData.images || []}
              layoutConfig={featuresData.layout_config || {}}
              className={featuresData.layout_type ? '' : 'text-center'}
            >
              <div className={featuresData.layout_type ? '' : 'text-center'}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {getContent('h1_headline', featuresData.h1_headline)}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                  {getContent('hero_subheading', featuresData.hero_subheading)}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => setShowDemoForm(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>Request Demo Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('/how-it-works')}
                    className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>See How It Works</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </SectionLayout>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {featuresData.features.map((feature, index) => {
                const IconComponent = getIconComponent(feature.icon)
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300">
                    <div className="flex items-start mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl flex items-center justify-center border border-white/20 mr-4 flex-shrink-0">
                        {IconComponent}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{feature.headline}</h3>
                        <p className="text-white/70 text-sm mb-4">{feature.title}</p>
                      </div>
                    </div>
                    <p className="text-white/90 mb-6 leading-relaxed">{feature.description}</p>
                    
                    {feature.benefits && (
                      <div className="mb-6">
                        <ul className="space-y-2">
                          {feature.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.how_it_works && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">How It Works:</h4>
                        <ul className="space-y-2">
                          {feature.how_it_works.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.dashboard_features && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Dashboard Features:</h4>
                        <ul className="space-y-2">
                          {feature.dashboard_features.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.security_features && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Security Features:</h4>
                        <ul className="space-y-2">
                          {feature.security_features.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <Shield className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.diversification_features && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Diversification Features:</h4>
                        <ul className="space-y-2">
                          {feature.diversification_features.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.customization_options && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Customization Options:</h4>
                        <ul className="space-y-2">
                          {feature.customization_options.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.tax_features && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Tax Features:</h4>
                        <ul className="space-y-2">
                          {feature.tax_features.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.resources && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Resources Include:</h4>
                        <ul className="space-y-2">
                          {feature.resources.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.platform_support && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Platform Support:</h4>
                        <ul className="space-y-2">
                          {feature.platform_support.map((item, i) => (
                            <li key={i} className="flex items-start text-white/80">
                              <span className="text-cyan-400 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feature.use_case && (
                      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                        <p className="text-white/90 italic">{feature.use_case}</p>
                      </div>
                    )}

                    {feature.technical_details && (
                      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                        <p className="text-white/90">{feature.technical_details}</p>
                      </div>
                    )}

                    {feature.example && (
                      <div className="mt-6 p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
                        <p className="text-white/90 font-semibold">Example:</p>
                        <p className="text-white/90">{feature.example}</p>
                      </div>
                    )}

                    {feature.mobile_app && (
                      <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-400/20 rounded-lg">
                        <p className="text-white/90">{feature.mobile_app}</p>
                      </div>
                    )}

                    {feature.regulatory && (
                      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                        <p className="text-white/90">{feature.regulatory}</p>
                      </div>
                    )}

                    {feature.why_it_matters && (
                      <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-400/20 rounded-lg">
                        <p className="text-white/90 italic">{feature.why_it_matters}</p>
                      </div>
                    )}

                    {feature.blog_note && (
                      <div className="mt-6 p-4 bg-pink-500/10 border border-pink-400/20 rounded-lg">
                        <p className="text-white/90">{feature.blog_note}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {featuresData.faqs && featuresData.faqs.length > 0 && (
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {featuresData.faqs.map((faq, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <h3 className="text-xl font-bold text-white mb-3">{faq.question}</h3>
                    <p className="text-white/80 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Experience Effortless Investing?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of investors building wealth automatically with Kamioi&apos;s powerful features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button 
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
              >
                Start Free 14-Day Trial
              </button>
              <button 
                onClick={() => navigate('/pricing')}
                className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300"
              >
                View Pricing
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
              <span>✓ No credit card required</span>
              <span>✓ Cancel anytime</span>
              <span>✓ SIPC insured</span>
              <span>✓ SEC registered</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-lg border-t border-white/10 text-white">
          <div className="max-w-7xl mx-auto text-center text-white/70">
            <p>© 2026 Kamioi. Making investing effortless for the next generation.</p>
          </div>
        </footer>

        {/* Demo Request Form Modal */}
        <DemoRequestForm
          isOpen={showDemoForm}
          onClose={() => setShowDemoForm(false)}
        />
      </div>
    </>
  )
}

export default Features

