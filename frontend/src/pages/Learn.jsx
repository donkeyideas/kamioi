import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionLayout from '../components/common/SectionLayout'
import DemoRequestForm from '../components/DemoRequestForm'
import { 
  ArrowRight, 
  Menu,
  X,
  Search,
  BookOpen,
  Calculator,
  FileText,
  Video,
  GraduationCap,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  Shield,
  Target,
  Zap,
  Brain,
  CheckCircle
} from 'lucide-react'
import SEO from '../components/common/SEO'

const Learn = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDemoForm, setShowDemoForm] = useState(false)
  const navigate = useNavigate()
  const [frontendContent, setFrontendContent] = useState(null)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [blogs, setBlogs] = useState([])
  const hasFetchedRef = useRef(false)

  // Fetch frontend content and blogs from API
  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const fetchContent = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        
        // Fetch frontend content
        const contentResponse = await fetch(`${apiBaseUrl}/api/frontend-content`)
        if (contentResponse.ok) {
          const data = await contentResponse.json()
          if (data.success && data.data) {
            const contentData = data.data
            const apiContent = { ...contentData }
            
            if (apiContent.learn_page) {
              setFrontendContent(apiContent.learn_page)
            } else {
              setFrontendContent({})
            }
          } else {
            setFrontendContent({})
          }
        }

        // Fetch blog posts
        const blogsResponse = await fetch(`${apiBaseUrl}/api/blog/posts?limit=6`)
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json()
          if (blogsData.success && blogsData.data && blogsData.data.posts) {
            setBlogs(blogsData.data.posts)
          }
        }
      } catch (error) {
        console.error('Failed to fetch content:', error)
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

  // Default learn page content
  const learnData = useMemo(() => {
    if (frontendContent && Object.keys(frontendContent).length > 0) {
      return frontendContent
    }
    return {
      meta_title: "Learn to Invest: Free Guides, Tools & Resources | Kamioi",
      meta_description: "Master investing with our free educational resources. Beginner guides, investment calculators, glossary, and expert tips to build wealth confidently. Start learning today.",
      h1_headline: "Learn to Invest with Confidence",
      hero_subheading: "Whether you're taking your first steps into investing or leveling up your knowledge, our comprehensive resources help you understand markets, build strategies, and achieve your financial goals. All free. No jargon. Just clear, actionable advice.",
      beginner_path: [
        {
          step: 1,
          title: "Understanding the Basics",
          resource: "Complete Beginner's Guide to Investing",
          reading_time: "15 minutes",
          topics: [
            "What is investing and why it matters",
            "Risk vs. reward explained",
            "Investment account types",
            "How the stock market works"
          ]
        },
        {
          step: 2,
          title: "Building Your Foundation",
          resource: "How to Start Investing with $100",
          reading_time: "10 minutes",
          topics: [
            "Setting financial goals",
            "Creating a budget",
            "Emergency fund basics",
            "Taking your first steps"
          ]
        },
        {
          step: 3,
          title: "Understanding Key Concepts",
          resource: "Compound Interest Explained",
          reading_time: "12 minutes",
          topics: [
            "The power of time",
            "Real calculation examples",
            "Rule of 72",
            "Long-term wealth building"
          ]
        },
        {
          step: 4,
          title: "Choosing Your Strategy",
          resource: "Passive vs. Active Investing",
          reading_time: "10 minutes",
          topics: [
            "Different investing approaches",
            "Which strategy fits you",
            "Time commitment comparison",
            "Expected returns"
          ]
        },
        {
          step: 5,
          title: "Making Your First Investment",
          resource: "Your First Investment Checklist",
          reading_time: "8 minutes",
          topics: [
            "Account opening steps",
            "Choosing your first investment",
            "Common mistakes to avoid",
            "What to expect"
          ]
        }
      ],
      strategies: [
        {
          icon: "Target",
          title: "Dollar-Cost Averaging",
          description: "Invest fixed amounts regularly to reduce timing risk"
        },
        {
          icon: "BarChart3",
          title: "Index Fund Investing",
          description: "Own the entire market for consistent returns"
        },
        {
          icon: "DollarSign",
          title: "Dividend Investing",
          description: "Build passive income through dividend stocks"
        },
        {
          icon: "Zap",
          title: "Automatic Investing",
          description: "Let technology handle investing for you"
        },
        {
          icon: "Brain",
          title: "Value Investing",
          description: "Find undervalued stocks for long-term gains"
        },
        {
          icon: "TrendingUp",
          title: "Growth Investing",
          description: "Invest in high-growth companies"
        }
      ],
      investment_types: [
        {
          icon: "TrendingUp",
          title: "Stocks (Equities)",
          description: "Own shares of individual companies"
        },
        {
          icon: "BarChart3",
          title: "Index Funds & ETFs",
          description: "Diversified baskets of stocks"
        },
        {
          icon: "DollarSign",
          title: "Bonds",
          description: "Fixed-income investments"
        },
        {
          icon: "Shield",
          title: "REITs (Real Estate)",
          description: "Real estate without property management"
        },
        {
          icon: "Target",
          title: "Fractional Shares",
          description: "Own expensive stocks for $1"
        },
        {
          icon: "FileText",
          title: "Retirement Accounts",
          description: "401(k), IRA, Roth IRA explained"
        }
      ],
      calculators: [
        {
          icon: "BarChart3",
          title: "Compound Interest Calculator",
          description: "See how your investments grow over time"
        },
        {
          icon: "DollarSign",
          title: "Retirement Calculator",
          description: "How much do you need to retire?"
        },
        {
          icon: "Target",
          title: "Goal Planning Calculator",
          description: "Plan for specific financial goals"
        },
        {
          icon: "TrendingUp",
          title: "Investment Return Calculator",
          description: "Calculate potential returns"
        },
        {
          icon: "Shield",
          title: "Emergency Fund Calculator",
          description: "How much should you save?"
        },
        {
          icon: "BarChart3",
          title: "Portfolio Diversification Analyzer",
          description: "Check your portfolio balance"
        }
      ],
      categories: [
        {
          icon: "GraduationCap",
          title: "For Beginners",
          description: "Start your investing journey"
        },
        {
          icon: "DollarSign",
          title: "Saving & Budgeting",
          description: "Build your financial foundation"
        },
        {
          icon: "BarChart3",
          title: "Investment Strategies",
          description: "Find your approach"
        },
        {
          icon: "DollarSign",
          title: "Passive Income",
          description: "Build wealth streams"
        },
        {
          icon: "Target",
          title: "Goal Planning",
          description: "Invest with purpose"
        },
        {
          icon: "TrendingUp",
          title: "Market Education",
          description: "Understand the markets"
        },
        {
          icon: "Shield",
          title: "Risk Management",
          description: "Protect your investments"
        },
        {
          icon: "Brain",
          title: "Advanced Topics",
          description: "Level up your knowledge"
        }
      ],
      courses: [
        {
          title: "Investing Foundations",
          duration: "2 hours",
          lessons: 8,
          level: "Beginner",
          description: "Complete beginner course covering all investing basics"
        },
        {
          title: "Automatic Investing Mastery",
          duration: "1 hour",
          lessons: 5,
          level: "Beginner-Intermediate",
          description: "Master the art of hands-free investing"
        },
        {
          title: "Building Passive Income",
          duration: "3 hours",
          lessons: 10,
          level: "Intermediate",
          description: "Learn to build sustainable passive income streams"
        }
      ],
      faqs: [
        {
          category: "Getting Started",
          questions: [
            {
              question: "How much money do I need to start investing?",
              answer: "You can start with as little as $1 using fractional shares. Many platforms, including Kamioi, have no minimum investment requirement."
            },
            {
              question: "What's the best way to start for beginners?",
              answer: "Start with automatic investing platforms that handle the complexity for you. Focus on learning while your portfolio builds automatically."
            }
          ]
        },
        {
          category: "Strategy & Planning",
          questions: [
            {
              question: "What's the difference between active and passive investing?",
              answer: "Active investing requires regular buying and selling decisions, while passive investing uses automated strategies like index funds or automatic investing platforms."
            },
            {
              question: "How should I diversify my portfolio?",
              answer: "Diversify across different companies, sectors, and asset types. Aim for 20-50 different holdings across multiple industries."
            }
          ]
        }
      ]
    }
  }, [frontendContent])

  // Map icon strings to React components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'Target': Target,
      'BarChart3': BarChart3,
      'DollarSign': DollarSign,
      'Zap': Zap,
      'Brain': Brain,
      'TrendingUp': TrendingUp,
      'Shield': Shield,
      'FileText': FileText,
      'GraduationCap': GraduationCap,
      'Calculator': Calculator,
      'Video': Video,
      'BookOpen': BookOpen
    }
    
    if (typeof iconName === 'string') {
      const IconComponent = iconMap[iconName]
      return IconComponent ? <IconComponent className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />
    }
    return iconName || <BookOpen className="w-6 h-6" />
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
        title={getContent('meta_title', learnData.meta_title)}
        description={getContent('meta_description', learnData.meta_description)}
        keywords="learn to invest, investing education, investment resources, beginner investing"
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
                  className="text-white font-semibold transition-colors"
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
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => {
                    navigate('/learn')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
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
              layoutType={learnData.layout_type}
              images={learnData.images || []}
              layoutConfig={learnData.layout_config || {}}
              className={learnData.layout_type ? '' : 'text-center'}
            >
              <div className={learnData.layout_type ? '' : 'text-center'}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  {getContent('h1_headline', learnData.h1_headline)}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                  {getContent('hero_subheading', learnData.hero_subheading)}
                </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="What do you want to learn about?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => document.getElementById('beginners')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center space-x-2"
              >
                <BookOpen className="w-5 h-5" />
                <span>Beginner&apos;s Guide</span>
              </button>
              <button 
                onClick={() => document.getElementById('calculators')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center space-x-2"
              >
                <Calculator className="w-5 h-5" />
                <span>Investment Calculator</span>
              </button>
              <button 
                onClick={() => document.getElementById('glossary')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Glossary</span>
              </button>
              <button 
                onClick={() => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg hover:bg-white/20 transition-all flex items-center space-x-2"
              >
                <BookOpen className="w-5 h-5" />
                <span>Latest Articles</span>
              </button>
            </div>
              </div>
            </SectionLayout>
          </div>
        </section>

        {/* Start Here - For Beginners */}
        <section id="beginners" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              New to Investing? Start Here
            </h2>
            <div className="space-y-8">
              {learnData.beginner_path.map((step, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl flex items-center justify-center border border-white/20">
                        <span className="text-2xl font-bold text-white">0{step.step}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">Step {step.step}: {step.title}</h3>
                      <div className="flex items-center mb-4">
                        <BookOpen className="w-5 h-5 text-cyan-300 mr-2" />
                        <span className="text-xl text-cyan-300 font-semibold">{step.resource}</span>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {step.topics.map((topic, i) => (
                          <li key={i} className="flex items-start text-white/80">
                            <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center text-white/60 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Est. Reading Time: {step.reading_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <button 
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Start Investing with Kamioi</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Investment Strategies */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Popular Investing Strategies
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learnData.strategies.map((strategy, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 hover:border-white/30 transition-all">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-lg flex items-center justify-center border border-white/20 mr-4">
                      {getIconComponent(strategy.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{strategy.title}</h3>
                  </div>
                  <p className="text-white/80 mb-4">{strategy.description}</p>
                  <button className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center">
                    Read Guide
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Investment Types */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Understanding Different Investments
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learnData.investment_types.map((type, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-lg flex items-center justify-center border border-white/20 mr-4">
                      {getIconComponent(type.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{type.title}</h3>
                  </div>
                  <p className="text-white/80 mb-4">{type.description}</p>
                  <button className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center">
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Calculators */}
        <section id="calculators" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Free Investment Calculators
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learnData.calculators.map((calc, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-lg flex items-center justify-center border border-white/20 mr-4">
                      {getIconComponent(calc.icon)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{calc.title}</h3>
                  </div>
                  <p className="text-white/80 mb-4">{calc.description}</p>
                  <button className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center">
                    Try Calculator
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Latest Articles */}
        <section id="articles" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Latest from the Kamioi Blog
            </h2>
            {blogs && blogs.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog, index) => (
                  <article key={blog.id || index} className="group">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-lg">
                      <div className="min-h-[200px] bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center relative overflow-hidden">
                        {blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload` ? (
                          <img 
                            src={blog.featured_image} 
                            alt={blog.title}
                            className="w-full h-full object-contain object-top"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className="text-center absolute inset-0 flex flex-col items-center justify-center" style={{ display: (blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload`) ? 'none' : 'flex' }}> 
                          <FileText className="w-12 h-12 text-white/40 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">Blog Image</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center mb-3">
                          <span className="bg-blue-400/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
                            {blog.category}
                          </span>
                          <span className="text-white/70 text-sm ml-3">{blog.read_time} min read</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-white/80 mb-4 leading-relaxed">
                          {blog.excerpt}
                        </p>
                        <button 
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                          className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center"
                        >
                          Read More
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/70 py-10">
                <p>No blog posts found.</p>
              </div>
            )}
            <div className="text-center mt-8">
              <button 
                onClick={() => navigate('/blog')}
                className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300"
              >
                View All Articles
              </button>
            </div>
          </div>
        </section>

        {/* Topic Categories */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Browse by Topic
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {learnData.categories.map((category, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-lg flex items-center justify-center border border-white/20 mx-auto mb-4">
                    {getIconComponent(category.icon)}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
                  <p className="text-white/80 mb-4 text-sm">{category.description}</p>
                  <button className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center justify-center">
                    Explore
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
              Structured Learning Paths
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {learnData.courses.map((course, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 hover:bg-white/15 transition-all">
                  <div className="flex items-center mb-4">
                    <GraduationCap className="w-8 h-8 text-cyan-300 mr-3" />
                    <h3 className="text-2xl font-bold text-white">{course.title}</h3>
                  </div>
                  <div className="flex items-center space-x-4 mb-4 text-white/70 text-sm">
                    <span>{course.duration}</span>
                    <span>•</span>
                    <span>{course.lessons} Lessons</span>
                    <span>•</span>
                    <span>{course.level}</span>
                  </div>
                  <p className="text-white/80 mb-6">{course.description}</p>
                  <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                    Start Free Course
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        {learnData.faqs && learnData.faqs.length > 0 && (
          <section id="glossary" className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
                Common Questions Answered
              </h2>
              <div className="space-y-8">
                {learnData.faqs.map((category, catIndex) => (
                  <div key={catIndex} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">{category.category}</h3>
                    <div className="space-y-4">
                      {category.questions.map((faq, faqIndex) => (
                        <div key={faqIndex} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                          <h4 className="text-lg font-semibold text-white mb-2">{faq.question}</h4>
                          <p className="text-white/80 leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Investing?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Put your knowledge into practice with Kamioi&apos;s automatic investing platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

export default Learn

