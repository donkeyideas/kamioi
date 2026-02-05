import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionLayout from '../components/common/SectionLayout'
import DemoRequestForm from '../components/DemoRequestForm'
import { 
  ArrowRight, 
  Menu,
  X,
  CheckCircle,
  DollarSign
} from 'lucide-react'
import SEO from '../components/common/SEO'

const Pricing = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' or 'annual'
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
            
            if (apiContent.pricing_page) {
              setFrontendContent(apiContent.pricing_page)
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

  // Default pricing content
  const pricingData = useMemo(() => {
    if (frontendContent && Object.keys(frontendContent).length > 0) {
      return frontendContent
    }
    return {
      meta_title: "Kamioi Pricing: Simple, Transparent Plans Starting at $9/Month",
      meta_description: "Choose the perfect Kamioi plan for your investing needs. Individual ($9), Family ($19), or Business ($49). No hidden fees. Cancel anytime. Start your free 14-day trial.",
      h1_headline: "Simple, Transparent Pricing for Everyone",
      hero_subheading: "One flat monthly fee. No commissions. No trading fees. No hidden costs. Just straightforward pricing so you can focus on building wealth, not decoding your bill.",
      trust_badges: [
        "No credit card required for trial",
        "Cancel anytime",
        "Money-back guarantee"
      ],
      plans: [
        {
          id: 'individual',
          name: 'Individual',
          badge: 'Most Popular for New Investors',
          monthly_price: 9,
          annual_price: 86.40,
          annual_savings: 21.60,
          perfect_for: "Solo investors, beginners, anyone starting their investment journey",
          core_features: [
            "Unlimited automatic investments",
            "AI-powered stock matching",
            "Fractional share purchases (from $1)",
            "Real-time portfolio tracking",
            "Mobile & web app access"
          ],
          investment_features: [
            "Invest in 50+ top brands",
            "Automatic diversification",
            "Dividend reinvestment",
            "Portfolio rebalancing",
            "Manual investing option"
          ],
          security_support: [
            "Bank-level 256-bit encryption",
            "SIPC insurance ($500,000)",
            "Two-factor authentication",
            "Email support (24-hour response)",
            "Help center access"
          ],
          reporting_tools: [
            "Real-time performance tracking",
            "Transaction history",
            "Tax documents (1099s)",
            "Investment goal tracking",
            "Educational resources"
          ],
          limits: [
            "1 user account",
            "Standard support",
            "Basic reporting"
          ],
          testimonial: {
            text: "Perfect starter plan. I've invested over $500 in 3 months without even thinking about it.",
            author: "Sarah M.",
            role: "verified user"
          }
        },
        {
          id: 'family',
          name: 'Family',
          badge: 'Best Value - Most Popular Overall',
          monthly_price: 19,
          annual_price: 182.40,
          annual_savings: 45.60,
          perfect_for: "Families, couples, roommates, or anyone wanting to share investing",
          core_features: [
            "Everything in Individual",
            "Up to 5 family members/users",
            "Individual portfolios for each user",
            "Shared family dashboard",
            "Consolidated reporting"
          ],
          multi_user_features: [
            "Family investment goals",
            "Priority email support (12-hour response)",
            "Advanced tax reporting",
            "Multiple account types",
            "Custom investment limits per user"
          ],
          account_options: [
            "Individual accounts",
            "Joint accounts",
            "Custodial accounts (for minors)",
            "Mix and match"
          ],
          family_benefits: [
            "15% savings vs. 5 individual plans",
            "Teach kids about investing",
            "Coordinated family financial planning",
            "Shared educational resources"
          ],
          value_callouts: [
            "Save $54/year compared to 2 individual plans",
            "Save $216/year compared to 5 individual plans"
          ],
          testimonial: {
            text: "Game-changer for our family. Even my teenagers are excited about investing now.",
            author: "Michael T.",
            role: "Family Plan user"
          }
        },
        {
          id: 'business',
          name: 'Business',
          badge: 'For Teams & Organizations',
          monthly_price: 49,
          annual_price: 470.40,
          annual_savings: 117.60,
          perfect_for: "Investment clubs, small businesses, organizations, teams",
          core_features: [
            "Everything in Family",
            "Up to 20 users/members",
            "Admin dashboard with controls",
            "User role management",
            "Centralized billing"
          ],
          enterprise_features: [
            "Bulk management tools",
            "Custom reporting and analytics",
            "API access for integrations",
            "White-label options",
            "Advanced data exports"
          ],
          premium_support: [
            "Dedicated account manager",
            "Priority support (4-hour response)",
            "Onboarding assistance",
            "Training for team",
            "Quarterly business reviews"
          ],
          business_specific: [
            "Bulk user invitation",
            "Department/team organization",
            "Custom permissions",
            "SSO integration (single sign-on)",
            "Advanced security controls"
          ],
          value_callouts: [
            "Save $31/month compared to 5 individual plans",
            "Save $131/month compared to 20 individual plans"
          ],
          testimonial: {
            text: "Perfect for our investment club. We manage 12 members effortlessly.",
            author: "Investment Club organizer",
            role: ""
          }
        }
      ],
      comparison_features: [
        { feature: 'Price', individual: '$9/mo', family: '$19/mo', business: '$49/mo' },
        { feature: 'Users', individual: '1', family: '5', business: '20' },
        { feature: 'Automatic Investing', individual: true, family: true, business: true },
        { feature: 'AI Stock Matching', individual: true, family: true, business: true },
        { feature: 'Fractional Shares', individual: true, family: true, business: true },
        { feature: 'Portfolio Tracking', individual: true, family: true, business: true },
        { feature: 'Mobile & Web App', individual: true, family: true, business: true },
        { feature: 'Manual Investing', individual: true, family: true, business: true },
        { feature: 'SIPC Insurance', individual: true, family: true, business: true },
        { feature: 'Tax Documents', individual: true, family: true, business: true },
        { feature: 'Educational Resources', individual: true, family: true, business: true },
        { feature: 'Shared Dashboard', individual: false, family: true, business: true },
        { feature: 'Family Goals', individual: false, family: true, business: true },
        { feature: 'Custodial Accounts', individual: false, family: true, business: true },
        { feature: 'Priority Support', individual: false, family: true, business: true },
        { feature: 'Advanced Reporting', individual: false, family: true, business: true },
        { feature: 'API Access', individual: false, family: false, business: true },
        { feature: 'Admin Dashboard', individual: false, family: false, business: true },
        { feature: 'Dedicated Manager', individual: false, family: false, business: true },
        { feature: 'White-Label Options', individual: false, family: false, business: true },
        { feature: 'SSO Integration', individual: false, family: false, business: true },
        { feature: 'Support Response', individual: '24 hours', family: '12 hours', business: '4 hours' }
      ],
      faqs: [
        {
          question: "Do you charge per trade or transaction?",
          answer: "No. Your flat monthly fee covers unlimited automatic and manual investments. Trade as much as you want."
        },
        {
          question: "Are there any hidden fees?",
          answer: "None. The monthly subscription is the only cost. No trading fees, account fees, or surprise charges."
        },
        {
          question: "Can I change plans anytime?",
          answer: "Yes! Upgrade or downgrade anytime. Changes take effect immediately with prorated billing."
        },
        {
          question: "What happens if I cancel?",
          answer: "You keep all your investments and can sell them anytime. No penalties or closing fees. You can rejoin later if you want."
        },
        {
          question: "Do you charge based on portfolio size?",
          answer: "No. Unlike advisors who charge percentage of assets (1-2% AUM), we charge a flat monthly fee regardless of your portfolio size."
        },
        {
          question: "Is there a minimum investment required?",
          answer: "No minimum. Start with $1 if you want. Your subscription fee is separate from investment amounts."
        },
        {
          question: "How do I pay?",
          answer: "Credit card, debit card, or bank transfer. Billing is automatic each month."
        },
        {
          question: "Can I pause my subscription?",
          answer: "Yes. Pause anytime and resume later. Your portfolio remains invested during pause."
        },
        {
          question: "Do you offer annual billing?",
          answer: "Yes! Pay annually and save 20% (2 months free)."
        },
        {
          question: "What if I need more than 20 users (Business plan)?",
          answer: "Contact our sales team for custom enterprise pricing."
        },
        {
          question: "Are there discounts for nonprofits?",
          answer: "Yes, we offer special pricing for 501(c)(3) organizations. Contact us for details."
        },
        {
          question: "Do you offer refunds?",
          answer: "Yes. 30-day money-back guarantee, no questions asked."
        }
      ]
    }
  }, [frontendContent])

  // Calculate prices based on billing cycle
  const getPrice = (plan) => {
    if (billingCycle === 'annual') {
      return {
        price: plan.annual_price,
        period: '/year',
        savings: plan.annual_savings ? `save $${plan.annual_savings.toFixed(2)}` : null
      }
    }
    return {
      price: plan.monthly_price,
      period: '/month',
      savings: null
    }
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
        title={getContent('meta_title', pricingData.meta_title)}
        description={getContent('meta_description', pricingData.meta_description)}
        keywords="kamioi pricing, automatic investing cost, investment app pricing"
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
                  className="text-white font-semibold transition-colors"
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
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
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
              layoutType={pricingData.layout_type}
              images={pricingData.images || []}
              layoutConfig={pricingData.layout_config || {}}
              className={pricingData.layout_type ? '' : 'text-center'}
            >
              <div className={pricingData.layout_type ? '' : 'text-center'}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {getContent('h1_headline', pricingData.h1_headline)}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                  {getContent('hero_subheading', pricingData.hero_subheading)}
                </p>
                
                {/* Trust Badges */}
                {pricingData.trust_badges && pricingData.trust_badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-6 text-white/80 mb-8">
                    {pricingData.trust_badges.map((badge, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span>{badge}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionLayout>
          </div>
        </section>

        {/* Billing Cycle Toggle */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-md transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-blue-600 text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Save 20%</span>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {pricingData.plans.map((plan) => {
                const priceInfo = getPrice(plan)
                const isPopular = plan.badge && plan.badge.includes('Popular')
                
                return (
                  <div 
                    key={plan.id} 
                    className={`bg-white/10 backdrop-blur-lg rounded-2xl border ${
                      isPopular ? 'border-cyan-400/50 border-2' : 'border-white/20'
                    } p-8 relative hover:bg-white/15 transition-all ${isPopular ? 'scale-105' : ''}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-5xl font-bold text-white">${priceInfo.price.toFixed(2)}</span>
                        <span className="text-white/70 text-lg ml-2">{priceInfo.period}</span>
                      </div>
                      {priceInfo.savings && (
                        <p className="text-green-400 text-sm font-semibold">{priceInfo.savings}</p>
                      )}
                      {billingCycle === 'annual' && plan.annual_savings && (
                        <p className="text-white/60 text-sm mt-1">or ${plan.monthly_price}/month billed annually</p>
                      )}
                    </div>

                    <p className="text-white/80 text-sm mb-6 text-center">{plan.perfect_for}</p>

                    <div className="space-y-6 mb-8">
                      {plan.core_features && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Core Features:</h4>
                          <ul className="space-y-2">
                            {plan.core_features.map((feature, i) => (
                              <li key={i} className="flex items-start text-white/80 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.investment_features && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Investment Features:</h4>
                          <ul className="space-y-2">
                            {plan.investment_features.map((feature, i) => (
                              <li key={i} className="flex items-start text-white/80 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.security_support && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Security & Support:</h4>
                          <ul className="space-y-2">
                            {plan.security_support.map((feature, i) => (
                              <li key={i} className="flex items-start text-white/80 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.multi_user_features && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Multi-User Features:</h4>
                          <ul className="space-y-2">
                            {plan.multi_user_features.map((feature, i) => (
                              <li key={i} className="flex items-start text-white/80 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.enterprise_features && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Enterprise Features:</h4>
                          <ul className="space-y-2">
                            {plan.enterprise_features.map((feature, i) => (
                              <li key={i} className="flex items-start text-white/80 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.value_callouts && (
                        <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
                          <h4 className="text-white font-semibold mb-2">Value:</h4>
                          <ul className="space-y-1">
                            {plan.value_callouts.map((callout, i) => (
                              <li key={i} className="text-green-300 text-sm flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                <span>{callout}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.testimonial && (
                        <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                          <p className="text-white/90 text-sm italic mb-2">&ldquo;{plan.testimonial.text}&rdquo;</p>
                          <p className="text-white/70 text-xs">— {plan.testimonial.author}{plan.testimonial.role && `, ${plan.testimonial.role}`}</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => navigate('/signup')}
                      className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg'
                          : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                      }`}
                    >
                      Start Free 14-Day Trial
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Compare All Plans Side-by-Side
            </h2>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-4 text-white font-semibold">Feature</th>
                      <th className="text-center p-4 text-white font-semibold">Individual</th>
                      <th className="text-center p-4 text-white font-semibold">Family</th>
                      <th className="text-center p-4 text-white font-semibold">Business</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingData.comparison_features.map((row, index) => (
                      <tr key={index} className="border-b border-white/10 last:border-b-0">
                        <td className="p-4 text-white/90 font-medium">{row.feature}</td>
                        <td className="p-4 text-center">
                          {typeof row.individual === 'boolean' ? (
                            row.individual ? (
                              <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-white/40">—</span>
                            )
                          ) : (
                            <span className="text-white/80">{row.individual}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.family === 'boolean' ? (
                            row.family ? (
                              <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-white/40">—</span>
                            )
                          ) : (
                            <span className="text-white/80">{row.family}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.business === 'boolean' ? (
                            row.business ? (
                              <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                            ) : (
                              <span className="text-white/40">—</span>
                            )
                          ) : (
                            <span className="text-white/80">{row.business}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Free Trial Details */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Try Kamioi Risk-Free
            </h2>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">14-Day Free Trial Includes:</h3>
              <ul className="space-y-3 mb-8">
                {[
                  "Full access to all plan features",
                  "Real investing with real money",
                  "No credit card required to start",
                  "Cancel anytime",
                  "No obligations"
                ].map((item, i) => (
                  <li key={i} className="flex items-start text-white/80">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Money-Back Guarantee:</h4>
                <p className="text-white/90">Not satisfied? Get a full refund within first 30 days, no questions asked.</p>
              </div>

              <div className="text-center">
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {pricingData.faqs && pricingData.faqs.length > 0 && (
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
                Pricing Questions Answered
              </h2>
              <div className="space-y-6">
                {pricingData.faqs.map((faq, index) => (
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
              Ready to Start Building Wealth Automatically?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Choose your plan and request demo access to experience Kamioi's automatic investing platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button
                onClick={() => setShowDemoForm(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg"
              >
                Request Demo Access
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300"
              >
                See How It Works
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
              <span>✓ $0 minimum to start</span>
              <span>✓ No credit card required</span>
              <span>✓ Cancel anytime</span>
              <span>✓ 30-day money-back guarantee</span>
              <span>✓ SIPC protection ready</span>
              <span>✓ Bank-level encryption</span>
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

export default Pricing

