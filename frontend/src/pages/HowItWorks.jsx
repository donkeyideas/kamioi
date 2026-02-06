import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionLayout from '../components/common/SectionLayout'
import DemoRequestForm from '../components/DemoRequestForm'
import { 
  ArrowRight, 
  Menu,
  X,
  Rocket,
  PlayCircle,
  Shield,
  Brain,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle,
  Database,
  Settings,
  FileText,
  Smartphone,
  Banknote,
  CreditCard,
  Zap,
  Target,
  BarChart3
} from 'lucide-react'
import SEO from '../components/common/SEO'

const HowItWorks = () => {
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
            
            // Get how it works page content
            if (apiContent.how_it_works_page) {
              setFrontendContent(apiContent.how_it_works_page)
            } else {
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

  // Default how it works content
  const howItWorksData = useMemo(() => {
    if (frontendContent && Object.keys(frontendContent).length > 0) {
      return frontendContent
    }
    return {
      meta_title: "How Kamioi Works: Automatic Investing in 3 Simple Steps",
      meta_description: "Learn how Kamioi turns everyday purchases into stock ownership. Connect your bank, shop normally, and watch your portfolio grow automatically. Start in minutes.",
      h1_headline: "Automatic Investing in 3 Simple Steps",
      hero_subheading: "No stock research. No manual buying. No time commitment. Just connect your bank account and Kamioi does the rest—turning your everyday spending into a diversified investment portfolio.",
      quick_stats: [
        { icon: 'Clock', text: 'Setup: 5 minutes' },
        { icon: 'Zap', text: 'Effort: Zero' },
        { icon: 'TrendingUp', text: 'Results: Automatic wealth building' }
      ],
      steps: [
        {
          step_number: "01",
          title: "Connect Your Bank Account",
          subtitle: "Link Your Bank in 60 Seconds",
          description: "Securely connect your bank account or credit cards using our encrypted integration. This one-time setup takes less than a minute and uses read-only access—we can see transactions but never move money without your permission.",
          process: [
            "Click \"Connect Bank Account\"",
            "Search for your bank (10,000+ supported)",
            "Enter your online banking credentials",
            "Verify with two-factor authentication",
            "Done! Connection is secure and encrypted"
          ],
          security_features: [
            "256-bit bank-level encryption",
            "Read-only access (we can't move money)",
            "Never store your banking passwords",
            "Two-factor authentication required",
            "Same security as banks use"
          ],
          alternative_option: "Prefer not to connect directly? Upload bank statements manually (PDF or CSV).",
          time_required: "2-3 minutes",
          difficulty: "Easy (like connecting Mint or Venmo)"
        },
        {
          step_number: "02",
          title: "Live Your Life Normally",
          subtitle: "Shop, Subscribe, and Spend as Usual",
          description: "Go about your daily life exactly as you always do. Buy coffee, pay for streaming services, shop online, eat out—whatever your normal routine includes. There's absolutely nothing you need to change.",
          examples: [
            "Morning coffee at Starbucks → Noted",
            "Monthly Netflix subscription → Tracked",
            "Online shopping at Amazon → Recorded",
            "Grocery shopping at Whole Foods → Logged",
            "Fill up gas at Shell → Captured"
          ],
          what_we_track: [
            "Merchant name and category",
            "Purchase amount",
            "Transaction date",
            "Payment method"
          ],
          what_we_dont_track: [
            "Specific items purchased",
            "Personal details beyond transaction info",
            "Location data (beyond merchant)",
            "Browsing history"
          ],
          privacy_commitment: "Your privacy matters. We only see transaction data necessary for investing—nothing more. All data is encrypted and never sold to third parties.",
          time_required: "0 minutes (you're already doing this)",
          difficulty: "Zero effort required"
        },
        {
          step_number: "03",
          title: "Own Stocks Automatically",
          subtitle: "Watch Your Portfolio Build Itself",
          description: "Our AI analyzes your spending patterns and automatically purchases fractional shares of the companies you support. Every purchase contributes to building a diversified investment portfolio tailored to your lifestyle.",
          ai_process: [
            {
              stage: "Purchase Detection",
              description: "You buy coffee at Starbucks ($5.50)"
            },
            {
              stage: "Smart Matching",
              description: "AI identifies Starbucks (SBUX) as publicly traded, determines investment amount, checks portfolio for diversification balance"
            },
            {
              stage: "Automatic Investment",
              description: "AI purchases fractional shares of Starbucks stock. You now own 0.015 shares of SBUX. Transaction logged in your portfolio."
            },
            {
              stage: "Ongoing Optimization",
              description: "AI monitors overall portfolio balance, ensures diversification across sectors, prevents over-concentration, rebalances automatically as needed"
            }
          ],
          portfolio_growth: [
            "Week 1: 5 stocks from 5 brands",
            "Month 1: 15 stocks from your regular spending",
            "Month 6: 30+ stocks, diversified portfolio",
            "Year 1: Substantial position in brands you love"
          ],
          time_required: "0 minutes (completely automatic)",
          difficulty: "AI does all the work"
        }
      ],
      faqs: [
        {
          question: "How long does setup take?",
          answer: "About 5-10 minutes total. Connect bank (2 min), set preferences (3 min), confirm (1 min). Then you're done forever."
        },
        {
          question: "Do I need to do anything after setup?",
          answer: "Nope! That's the beauty of automatic investing. Just live normally and your portfolio builds itself."
        },
        {
          question: "How often does Kamioi invest?",
          answer: "Continuously. As soon as purchases clear your bank (1-3 days), our AI analyzes and invests."
        },
        {
          question: "Can I see what stocks I own?",
          answer: "Yes! Real-time dashboard shows every stock, share amount, value, and performance."
        },
        {
          question: "What if I want to stop?",
          answer: "Pause anytime with one click. Resume whenever you want. No penalties or fees."
        },
        {
          question: "Do you sell my data?",
          answer: "Never. Your financial data is yours. We only use it to power your investments."
        },
        {
          question: "How do I withdraw money?",
          answer: "Sell stocks through the app. Money transfers to your bank in 2-3 business days."
        },
        {
          question: "What if I change banks?",
          answer: "Simply disconnect old bank and connect new one. Takes 2 minutes."
        }
      ]
    }
  }, [frontendContent])

  // Map icon strings to React components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Clock': Clock,
      'Zap': Zap,
      'TrendingUp': TrendingUp,
      'Shield': Shield,
      'Brain': Brain,
      'ShoppingBag': ShoppingBag,
      'Banknote': Banknote,
      'CreditCard': CreditCard,
      'Database': Database,
      'Settings': Settings,
      'FileText': FileText,
      'Smartphone': Smartphone,
      'Target': Target,
      'BarChart3': BarChart3
    }
    
    if (typeof iconName === 'string') {
      const IconComponent = iconMap[iconName]
      return IconComponent ? <IconComponent className="w-6 h-6" /> : <Clock className="w-6 h-6" />
    }
    return iconName || <Clock className="w-6 h-6" />
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
        title={getContent('meta_title', howItWorksData.meta_title)}
        description={getContent('meta_description', howItWorksData.meta_description)}
        keywords="how automatic investing works, how does kamioi work, automatic stock investing"
        faq={howItWorksData.faqs}
        breadcrumbs={[
          { name: "Home", url: "https://kamioi.com/" },
          { name: "How It Works", url: "https://kamioi.com/how-it-works" }
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Start Automatic Investing with Kamioi",
          "description": "Learn how Kamioi turns everyday purchases into stock ownership in 3 simple steps.",
          "totalTime": "PT10M",
          "step": howItWorksData.steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.title,
            "text": step.description,
            "url": "https://kamioi.com/how-it-works"
          }))
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
                  className="text-white font-semibold transition-colors"
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
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    navigate('/how-it-works')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
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
              layoutType={howItWorksData.layout_type}
              images={howItWorksData.images || []}
              layoutConfig={howItWorksData.layout_config || {}}
              className={howItWorksData.layout_type ? '' : 'text-center'}
            >
              <div className={howItWorksData.layout_type ? '' : 'text-center'}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {getContent('h1_headline', howItWorksData.h1_headline)}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                  {getContent('hero_subheading', howItWorksData.hero_subheading)}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <button 
                    onClick={() => navigate('/signup')}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDemoForm(true)}
                    className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>Request Demo Access</span>
                  </button>
                </div>
              </div>
            </SectionLayout>
            
            {/* Quick Stats */}
            {howItWorksData.quick_stats && howItWorksData.quick_stats.length > 0 && (
              <div className="flex flex-wrap justify-center gap-6 text-white/80">
                {howItWorksData.quick_stats.map((stat, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {getIconComponent(stat.icon)}
                    <span className="text-sm md:text-base">{stat.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* The 3-Step Process */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-24">
              {howItWorksData.steps.map((step, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 md:p-12">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Step Number and Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl flex items-center justify-center border border-white/20 mb-4">
                        <span className="text-3xl font-bold text-white">{step.step_number}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{step.title}</h2>
                      <h3 className="text-xl md:text-2xl text-cyan-300 mb-6">{step.subtitle}</h3>
                      <p className="text-lg text-white/90 mb-8 leading-relaxed">{step.description}</p>
                      
                      {/* Process Steps */}
                      {step.process && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-white mb-4">Detailed Process:</h4>
                          <ul className="space-y-3">
                            {step.process.map((item, i) => (
                              <li key={i} className="flex items-start text-white/80">
                                <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Security Features */}
                      {step.security_features && (
                        <div className="mb-8 p-6 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                          <h4 className="text-lg font-semibold text-white mb-4">Security Assurance:</h4>
                          <ul className="space-y-2">
                            {step.security_features.map((item, i) => (
                              <li key={i} className="flex items-start text-white/80">
                                <Shield className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Examples */}
                      {step.examples && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-white mb-4">Kamioi Monitors in the Background:</h4>
                          <ul className="space-y-2">
                            {step.examples.map((item, i) => (
                              <li key={i} className="flex items-start text-white/80">
                                <span className="text-cyan-400 mr-2">→</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* What We Track */}
                      {step.what_we_track && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-white mb-4">What We Track:</h4>
                          <ul className="space-y-2">
                            {step.what_we_track.map((item, i) => (
                              <li key={i} className="flex items-start text-white/80">
                                <span className="text-cyan-400 mr-2">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* What We Don't Track */}
                      {step.what_we_dont_track && (
                        <div className="mb-8 p-6 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                          <h4 className="text-lg font-semibold text-white mb-4">What We DON&apos;T Track:</h4>
                          <ul className="space-y-2">
                            {step.what_we_dont_track.map((item, i) => (
                              <li key={i} className="flex items-start text-white/80">
                                <span className="text-red-400 mr-2">✗</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Privacy Commitment */}
                      {step.privacy_commitment && (
                        <div className="mb-8 p-6 bg-green-500/10 border border-green-400/20 rounded-lg">
                          <p className="text-white/90 italic">&ldquo;{step.privacy_commitment}&rdquo;</p>
                        </div>
                      )}
                      
                      {/* AI Process */}
                      {step.ai_process && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-white mb-4">The AI Process:</h4>
                          <div className="space-y-4">
                            {step.ai_process.map((process, i) => (
                              <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <h5 className="font-semibold text-cyan-300 mb-2">{process.stage}:</h5>
                                <p className="text-white/80">{process.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Portfolio Growth */}
                      {step.portfolio_growth && (
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-white mb-4">Portfolio Growth:</h4>
                          <ul className="space-y-2">
                            {step.portfolio_growth.map((item, i) => (
                              <li key={i} className="flex items-start text-white/80">
                                <TrendingUp className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Alternative Option */}
                      {step.alternative_option && (
                        <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-400/20 rounded-lg">
                          <p className="text-white/90"><strong>Alternative Option:</strong> {step.alternative_option}</p>
                        </div>
                      )}
                      
                      {/* Time and Difficulty */}
                      <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-white/10">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-cyan-400" />
                          <span className="text-white/80"><strong>Time Required:</strong> {step.time_required}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <span className="text-white/80"><strong>Difficulty:</strong> {step.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {howItWorksData.faqs && howItWorksData.faqs.length > 0 && (
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {howItWorksData.faqs.map((faq, index) => (
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
              Start Building Wealth Automatically
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of investors who never miss a beat. No credit card required for free trial. Cancel anytime. SIPC insured.
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

export default HowItWorks

