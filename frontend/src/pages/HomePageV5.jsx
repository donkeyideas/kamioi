import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionLayout from '../components/common/SectionLayout'
import DemoRequestForm from '../components/DemoRequestForm'
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Menu,
  X,
  Zap,
  Sparkles,
  Rocket,
  Shield,
  Database,
  ChevronDown,
  ChevronRight,
  Upload,
  ShoppingBag,
  Brain,
  Coffee,
  TrendingUp,
  Smartphone,
  Users,
  Play,
  FileText,
  User,
  Building2,
  Lock,
  Award,
  BadgeCheck,
  Clock,
  BookOpen,
  GraduationCap
} from 'lucide-react'
import SEO from '../components/common/SEO'

const HomePageV5 = () => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [blogsLoading, setBlogsLoading] = useState(true)
  const [showDemoForm, setShowDemoForm] = useState(false)
  const navigate = useNavigate()
  const statsRef = useRef(null)
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    invested: 0,
    satisfaction: 0,
    rating: 0
  })
  const [frontendContent, setFrontendContent] = useState(null) // null = not loaded yet, {} = loaded with no content
  const [contentLoaded, setContentLoaded] = useState(false)
  const [apiCallSucceeded, setApiCallSucceeded] = useState(false) // Track if API call succeeded (even if empty)
  const hasFetchedRef = useRef(false)

  // Fetch frontend content and blogs from API
  useEffect(() => {
    // Prevent multiple fetches (React StrictMode causes double renders in dev)
    if (hasFetchedRef.current) {
      return
    }
    hasFetchedRef.current = true

    const fetchContent = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
        
        // Always fetch frontend content from API (it will only use active content)
        // Defaults in the code will be used if API returns no active content or fails
        try {
          const contentResponse = await fetch(`${apiBaseUrl}/api/frontend-content?t=${Date.now()}`)
          if (contentResponse.ok) {
            const contentData = await contentResponse.json()
            console.log('[HomePageV5] Raw API response:', contentData)
            
            if (contentData.success && contentData.data && typeof contentData.data === 'object') {
              // The API returns: { success: true, data: { hero_section_2: {...}, stats: [...], ... } }
              // The data object already has section keys as keys, with parsed content_data as values
              const apiContent = { ...contentData.data }
              
              // Remove old hero section if it exists (we only use hero_section_2 now)
              if (apiContent.hero) {
                console.log('[HomePageV5] Removing old hero section, using hero_section_2 only')
                delete apiContent.hero
              }
              
              // Set content (even if empty, so we know it's loaded)
              console.log('[HomePageV5] Using API content for sections:', Object.keys(apiContent))
              if (apiContent.hero_section_2) {
                console.log('[HomePageV5] Hero Section 2 full content:', JSON.stringify(apiContent.hero_section_2, null, 2))
                console.log('[HomePageV5] Hero Section 2 layout data:', {
                  layout_type: apiContent.hero_section_2.layout_type,
                  images_count: apiContent.hero_section_2.images?.length || 0,
                  has_layout_config: !!apiContent.hero_section_2.layout_config,
                  layout_config: apiContent.hero_section_2.layout_config
                })
              } else {
                console.log('[HomePageV5] No hero_section_2 found in API response')
              }
              setFrontendContent(apiContent)
              setApiCallSucceeded(true) // API call succeeded, even if some sections are missing (inactive)
            } else {
              console.log('[HomePageV5] API response missing or invalid data, using defaults')
              console.log('[HomePageV5] Response structure:', contentData)
              setFrontendContent({}) // Empty object means use defaults
              setApiCallSucceeded(false) // API call didn't succeed properly
            }
          } else {
            const errorText = await contentResponse.text()
            console.log('[HomePageV5] API returned non-OK status:', contentResponse.status, errorText)
            setFrontendContent({}) // Empty object means use defaults
            setApiCallSucceeded(false) // API call failed
          }
        } catch (error) {
          console.error('[HomePageV5] Failed to fetch frontend content:', error)
          console.log('[HomePageV5] Using defaults due to API error')
          setFrontendContent({}) // Empty object means use defaults
          setApiCallSucceeded(false) // API call failed
        } finally {
          setContentLoaded(true)
        }
        
        // Always fetch blogs (regardless of USE_NEW_DEFAULTS)
        setBlogsLoading(true)
        const blogsResponse = await fetch(`${apiBaseUrl}/api/blog/posts?limit=3`)
        if (blogsResponse.ok) {
          const blogsData = await blogsResponse.json()
          if (blogsData.success && blogsData.data && blogsData.data.posts) {
            setBlogs(blogsData.data.posts)
          } else {
            setBlogs([])
          }
        } else {
          setBlogs([])
        }
      } catch (error) {
        console.error('Failed to fetch content:', error)
        setBlogs([])
      } finally {
        setBlogsLoading(false)
      }
    }

    fetchContent()
  }, [])

  // Memoize hero data to prevent re-renders from causing flashing
  // Only use hero_section_2 (old hero section has been removed)
  // Handle null case for when content hasn't loaded yet
  const heroData = useMemo(() => {
    if (frontendContent === null) return {}
    const data = frontendContent.hero_section_2 || {}
    // Debug: Log layout data
    if (data.layout_type) {
      console.log('[HomePageV5] Hero section layout data:', {
        layout_type: data.layout_type,
        images_count: data.images?.length || 0,
        has_layout_config: !!data.layout_config
      })
    }
    return data
  }, [frontendContent])

  // Use frontend content from API if available and valid, otherwise use defaults
  // Only use API stats if they exist, are an array, and have length > 0
  // Memoize to prevent hooks order issues
  // Map icon strings to React components, or infer from label
  const getIconComponent = (iconName, label) => {
    const iconMap = {
      'Users': Users,
      'TrendingUp': TrendingUp,
      'Star': Star,
      'ShoppingBag': ShoppingBag,
      'Database': Database,
      'BarChart': Database,
      'BarChart3': Database,
      'Activity': TrendingUp,
      'DollarSign': TrendingUp,
      'Target': Star,
      'Award': Star
    }
    
    // If iconName is a string, try to map it
    if (typeof iconName === 'string') {
      const IconComponent = iconMap[iconName]
      if (IconComponent) {
        return <IconComponent className="w-5 h-5" />
      }
    }
    
    // If iconName is already a React component, return it
    if (React.isValidElement(iconName)) {
      return iconName
    }
    
    // If no icon provided, infer from label
    if (label) {
      const labelLower = label.toLowerCase()
      if (labelLower.includes('mapping') || labelLower.includes('total')) {
        return <Database className="w-5 h-5" />
      }
      if (labelLower.includes('invest') || labelLower.includes('invested')) {
        return <TrendingUp className="w-5 h-5" />
      }
      if (labelLower.includes('rating') || labelLower.includes('star')) {
        return <Star className="w-5 h-5" />
      }
      if (labelLower.includes('brand') || labelLower.includes('shop')) {
        return <ShoppingBag className="w-5 h-5" />
      }
      if (labelLower.includes('investor') || labelLower.includes('user')) {
        return <Users className="w-5 h-5" />
      }
    }
    
    // Default fallback
    return null
  }

  const stats = useMemo(() => {
    if (frontendContent && frontendContent.stats && Array.isArray(frontendContent.stats) && frontendContent.stats.length > 0) {
      // Map API stats to include proper icon components
      return frontendContent.stats.map(stat => ({
        ...stat,
        icon: getIconComponent(stat.icon, stat.label)
      }))
    }
    // If API succeeded but stats are missing, they're inactive - return empty array
    // Otherwise use defaults (API call failed)
    return apiCallSucceeded ? [] : [
      { number: 256, suffix: "-bit", label: "Bank-Level Encryption", icon: <Lock className="w-5 h-5" /> },
      { number: 0, prefix: "$", label: "Minimum to Start", icon: <TrendingUp className="w-5 h-5" /> },
      { number: 100, suffix: "%", label: "AI-Powered Automation", icon: <Brain className="w-5 h-5" /> },
      { number: 500, prefix: "$", suffix: "K", label: "SIPC Protection Ready", icon: <Shield className="w-5 h-5" /> }
    ]
  }, [frontendContent, apiCallSucceeded])

  // Format number for display with commas or M/K notation
  const formatNumber = (num) => {
    if (num >= 1000000) {
      // For millions, show as "14.6M" or "14M" if whole number
      const millions = num / 1000000
      if (millions % 1 === 0) {
        return millions.toFixed(0) + 'M'
      }
      return millions.toFixed(1) + 'M'
    } else if (num >= 1000) {
      // For thousands, show as "500K" or "500.0K" if decimal
      const thousands = num / 1000
      if (thousands % 1 === 0) {
        return thousands.toFixed(0) + 'K'
      }
      return thousands.toFixed(1) + 'K'
    } else {
      // For numbers less than 1000, show with commas if needed
      return num.toLocaleString('en-US', { maximumFractionDigits: 1 })
    }
  }

  // Animation function
  const animateValue = (start, end, duration, callback) => {
    const startTimestamp = performance.now()
    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = start + (end - start) * progress
      callback(current)
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }

  // Intersection Observer for stats animation - must be before early return
  useEffect(() => {
    // Only set up observer if stats are available and content is loaded
    if (!contentLoaded || !stats || stats.length === 0 || !statsRef.current) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            stats.forEach((stat, index) => {
              setTimeout(() => {
                animateValue(0, stat.number, 2000, (value) => {
                  setAnimatedStats(prev => ({
                    ...prev,
                    [Object.keys(prev)[index]]: value
                  }))
                })
              }, index * 200)
            })
          }
        })
      },
      { threshold: 0.5 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [contentLoaded, stats])

  // Don't render until content is loaded - but do this AFTER all hooks
  if (!contentLoaded || frontendContent === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // Only use default features if API call failed. If API succeeded but features are missing, they're inactive - don't show them
  const features = (frontendContent && frontendContent.features && Array.isArray(frontendContent.features) && frontendContent.features.length > 0)
    ? frontendContent.features.map(f => ({
        ...f,
        icon: f.icon === 'Zap' ? <Zap className="w-6 h-6 text-yellow-400" /> :
              f.icon === 'ShoppingBag' ? <ShoppingBag className="w-6 h-6 text-purple-400" /> :
              f.icon === 'Coffee' ? <Coffee className="w-6 h-6 text-green-400" /> :
              f.icon === 'Brain' ? <Brain className="w-6 h-6 text-blue-400" /> :
              f.icon === 'Shield' ? <Shield className="w-6 h-6 text-cyan-400" /> :
              f.icon === 'Smartphone' ? <Smartphone className="w-6 h-6 text-pink-400" /> :
              f.icon === 'TrendingUp' ? <TrendingUp className="w-6 h-6 text-green-400" /> :
              f.icon === 'User' ? <User className="w-6 h-6 text-blue-400" /> :
              <Zap className="w-6 h-6 text-yellow-400" />
      }))
    : (apiCallSucceeded ? [] : [
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Zero Effort Required",
      description: "True passive investing — Unlike traditional platforms that require constant attention, Kamioi works entirely in the background. Our AI handles purchase tracking, stock selection, and portfolio balancing automatically."
    },
    {
      icon: <Brain className="w-6 h-6 text-blue-400" />,
      title: "AI-Powered Intelligence",
      description: "Institutional-grade technology for everyone — Our proprietary AI processes millions of transactions daily, identifying optimal investment opportunities based on your spending patterns. Get sophisticated investing without the complexity."
    },
    {
      icon: <ShoppingBag className="w-6 h-6 text-purple-400" />,
      title: "Own What You Support",
      description: "Invest in brands you already love — Why let your spending stop at the transaction? Every dollar you spend with major brands can become an investment in those companies. Shop smarter, not harder."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-400" />,
      title: "Fractional Share Investing",
      description: "Start with any amount — Don't have thousands for full shares? No problem. Kamioi offers fractional investing starting at just $1, making premium stocks accessible to everyone."
    },
    {
      icon: <User className="w-6 h-6 text-blue-400" />,
      title: "Designed for Beginners",
      description: "No investment experience needed — Clean interface, clear language, and zero jargon. If you can shop online, you can invest with Kamioi. Perfect for anyone taking their first steps into investing."
    },
    {
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      title: "Bank-Level Security",
      description: "Your money is protected — 256-bit encryption, two-factor authentication, and read-only bank access. SIPC-insured up to $500,000, with the same protections as traditional brokerages."
    }
  ])

  const valuePropositions = [
    {
      icon: <Upload className="w-8 h-8 text-cyan-400" />,
      title: "Link Once, Own Forever",
      description: "Upload your bank statement and watch Kamioi turn your everyday spending into stock ownership. Set it and forget it."
    },
    {
      icon: <ShoppingBag className="w-8 h-8 text-purple-400" />,
      title: "Every Purchase = Ownership",
      description: "Buy coffee, Netflix, shoes, tech - everything becomes stock ownership automatically. Your lifestyle builds your portfolio."
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-400" />,
      title: "AI Does the Work",
      description: "Our AI analyzes every transaction and maps it to stock ownership. You just live your life."
    }
  ]

  // Only use default howItWorks if API call failed. If API succeeded but how_it_works are missing, they're inactive - don't show them
  const howItWorks = (frontendContent && frontendContent.how_it_works && Array.isArray(frontendContent.how_it_works) && frontendContent.how_it_works.length > 0)
    ? frontendContent.how_it_works
    : (apiCallSucceeded ? [] : [
    {
      step: "01",
      title: "Connect Once",
      description: "Link your bank account in minutes — Kamioi uses read-only access with bank-level encryption. We never store credentials or make unauthorized transactions. Set it up once, and you're done.",
      icon: <Upload className="w-12 h-12 text-cyan-400" />
    },
    {
      step: "02", 
      title: "Live Normally",
      description: "No lifestyle changes needed — Shop, subscribe, and spend as you normally would. Whether it's your morning coffee, streaming subscriptions, or online shopping, every purchase becomes an opportunity.",
      icon: <Coffee className="w-12 h-12 text-green-400" />
    },
    {
      step: "03",
      title: "Own Automatically",
      description: "AI does the investing for you — Advanced machine learning maps your purchases to corresponding stocks. Bought a latte? You now own a fraction of Starbucks. It's wealth-building on autopilot.",
      icon: <TrendingUp className="w-12 h-12 text-yellow-400" />
    }
  ])

  // Only use default testimonials if API call failed. If API succeeded but testimonials are missing, they're inactive - don't show them
  // Default testimonials are now excitement/waitlist focused instead of fake reviews
  const testimonials = (frontendContent && frontendContent.testimonials && Array.isArray(frontendContent.testimonials) && frontendContent.testimonials.length > 0)
    ? frontendContent.testimonials
    : (apiCallSucceeded ? [] : [
    {
      name: "Early Adopter",
      role: "Excited to Start",
      content: "I've been waiting for an investing app that truly understands how I spend. The concept of owning stock in brands I already buy is brilliant. Can't wait to be among the first to try Kamioi!",
      rating: 5,
      avatar: "EA",
      age: "",
      verified: false,
      result: "On the Waitlist"
    },
    {
      name: "Future Investor",
      role: "First-Time Investor",
      content: "As someone who's always been intimidated by investing, Kamioi's automatic approach is exactly what I need. No research, no complexity—just smart investing that works with my lifestyle.",
      rating: 5,
      avatar: "FI",
      age: "",
      verified: false,
      result: "Requested Demo"
    },
    {
      name: "Tech Enthusiast",
      role: "AI & Fintech Fan",
      content: "The AI-powered matching of purchases to stocks is innovative. This is the future of passive investing, and I'm excited to see it launch. Building wealth without lifting a finger!",
      rating: 5,
      avatar: "TE",
      age: "",
      verified: false,
      result: "Awaiting Launch"
    }
  ])

  // Only use default FAQs if API call failed. If API succeeded but FAQs are missing, they're inactive - don't show them
  const defaultFaqs = [
    {
      question: "How does automatic investing work?",
      answer: "Automatic investing with Kamioi is simple: connect your bank account once, and our AI automatically tracks your purchases and invests in corresponding stocks. For example, if you buy coffee at Starbucks, we'll automatically purchase a fractional share of Starbucks stock for you. Investing happens in the background while you live your life—no manual work required."
    },
    {
      question: "Is automatic investing safe?",
      answer: "Yes. Kamioi uses bank-level 256-bit encryption and read-only access to your accounts. We never store banking credentials or make unauthorized transactions. All investments are SIPC-insured up to $500,000, and we're registered with the SEC, ensuring regulatory compliance and investor protection."
    },
    {
      question: "What's the minimum amount needed to start?",
      answer: "You can start with $0 minimum investment. Kamioi offers fractional share investing, meaning you can own a piece of expensive stocks like Amazon or Tesla for as little as $1. Unlike traditional investing that requires large minimums, our platform is designed for anyone who wants to start building wealth, regardless of budget."
    },
    {
      question: "Do I need investment experience?",
      answer: "Not at all. Kamioi is designed for people with zero investment experience. Our AI handles all the complexity—from stock selection to portfolio balancing. You don't need to understand the market, read charts, or make trading decisions. If you can link a bank account, you're ready to start."
    },
    {
      question: "What happens if I buy from a brand that's not publicly traded?",
      answer: "Our AI automatically maps private companies to similar public companies. For example, if you buy from a local coffee shop, we might invest in Starbucks or another publicly-traded coffee company. Our algorithm considers industry, market cap, and your investment preferences to find the best match."
    },
    {
      question: "Can I still invest manually, or is it only automatic?",
      answer: "Both! While Kamioi specializes in automatic investing based on your purchases, you can also make manual investments anytime through the app. Use automatic investing as your baseline wealth-building strategy, with the flexibility to buy specific stocks whenever you want."
    },
    {
      question: "How is Kamioi different from other investing apps?",
      answer: "Unlike traditional apps that require you to manually buy stocks or robo-advisors that need upfront deposits, Kamioi invests based on your everyday spending. We're the only platform that automatically connects purchases to stock ownership. While other apps require active participation, Kamioi works entirely in the background."
    },
    {
      question: "What fees does Kamioi charge?",
      answer: "Kamioi charges a simple monthly subscription ($9 for individuals) with no trading fees, no commission fees, and no hidden costs. Unlike traditional brokers that charge per trade, our subscription covers unlimited automatic and manual investments. Transparent pricing, no surprises."
    },
    {
      question: "How quickly will I see returns?",
      answer: "Investment returns depend on market performance and should be viewed long-term (3-5+ years minimum). Historically, the S&P 500 averages around 10% annual returns, but individual results vary. With Kamioi, you'll start building your portfolio immediately, but we recommend patience—automatic investing works best when you let compound interest work over time."
    },
    {
      question: "Is this only for young people?",
      answer: "Not at all! While Kamioi's simple approach appeals to first-time investors (who tend to be younger), our platform is designed for anyone who wants effortless, automatic investing—regardless of age. We have users from their 20s to their 60s who appreciate the hands-off approach to wealth building."
    }
  ]

  // If API succeeded but FAQs are missing, they're inactive - return empty array
  // If API failed, use defaults
  const faqs = (frontendContent && frontendContent.faqs && Array.isArray(frontendContent.faqs) && frontendContent.faqs.length > 0)
    ? frontendContent.faqs
    : (apiCallSucceeded ? [] : defaultFaqs)

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  // Educational Content - Only use defaults if API call failed. If API succeeded but educational_content is missing, it's inactive
  const educationalContent = (frontendContent && frontendContent.educational_content) 
    ? frontendContent.educational_content
    : (apiCallSucceeded ? null : {
    headline: "Learn Smart Investing: Free Resources",
    intro: "New to investing? Kamioi isn't just an automatic investing platform—we're your partner in financial education. Explore our guides, calculators, and resources designed for anyone who wants to build wealth the smart way, whether you're just starting out or optimizing your strategy.",
    featured_topics: [
      "How to Start Investing: A Complete Beginner's Guide",
      "Automatic Investing vs. Manual Investing: Which Strategy is Right for You?",
      "Understanding Fractional Shares: Invest in Expensive Stocks for $1",
      "The Power of Compound Interest: See Your Wealth Grow Over Time",
      "5 Common Investing Mistakes Beginners Make (And How to Avoid Them)",
      "What is Passive Investing? Complete Guide to Set-and-Forget Wealth Building"
    ]
  })

  // Topic content mapping
  const topicContent = {
    "How to Start Investing: A Complete Beginner's Guide": {
      title: "How to Start Investing: A Complete Beginner's Guide",
      content: `Starting to invest doesn't have to be complicated. Here's your complete guide for beginners:

**1. Start with What You Have**
You don't need thousands of dollars to begin. Many platforms, including Kamioi, allow you to start with as little as $1. The key is consistency, not the amount. Even $20-50 per month can grow significantly over time.

**2. Understand Your Options**
- **Automatic Investing Apps (like Kamioi)**: Turn your everyday spending into stock ownership automatically
- **Index Funds**: Low-cost, diversified investments that track the entire market
- **ETFs**: Exchange-traded funds that trade like stocks but offer instant diversification
- **Individual Stocks**: Higher risk, but potential for higher returns (best for learning after you have a base)

**3. Take Advantage of Time**
Starting early gives you decades of compound interest. A $50 monthly investment starting at age 25 can grow to over $100,000 by age 65, assuming a 7% annual return. Time is your greatest asset.

**4. Keep It Simple**
Don't overthink it. Start with automatic investing or a simple index fund. You can always expand your strategy as you learn more. The best investment strategy is one you'll actually stick with.

**5. Stay Consistent**
The most successful investors invest regularly, regardless of market conditions. Set up automatic transfers and let time do the work. Market timing doesn't work—time in the market does.

**6. Start Today**
The best time to start investing was yesterday. The second best time is today. Every day you wait is a day of potential growth you're missing.`
    },
    "Automatic Investing vs. Manual Investing: Which Strategy is Right for You?": {
      title: "Automatic Investing vs. Manual Investing: Which Strategy is Right for You?",
      content: `Both automatic and manual investing have their place. Here's how to choose:

**Automatic Investing (Recommended for Beginners)**
✅ **Pros:**
- Removes emotion from investing decisions
- Saves time—no daily monitoring needed
- Builds wealth from your normal spending
- Perfect for busy professionals and beginners
- Reduces the risk of timing the market wrong
- Consistent, disciplined approach
- Works while you sleep

❌ **Cons:**
- Less control over specific stock picks
- May invest in companies you don't fully understand
- Less educational (you learn less about individual companies)

**Manual Investing**
✅ **Pros:**
- Full control over your investments
- Can target specific companies or sectors
- Educational—you learn more about markets
- Potential for higher returns if you're skilled

❌ **Cons:**
- Time-consuming research required
- Emotional decisions can hurt returns
- Easy to make mistakes as a beginner
- Requires significant knowledge and discipline
- Higher risk of poor timing

**The Best Approach:**
Start with automatic investing (like Kamioi) to build wealth from your lifestyle, then gradually learn about manual investing as you gain experience. Many successful investors use both strategies—automatic for the foundation, manual for specific opportunities.`
    },
    "Understanding Fractional Shares: Invest in Expensive Stocks for $1": {
      title: "Understanding Fractional Shares: Invest in Expensive Stocks for $1",
      content: `Fractional shares have democratized investing, making expensive stocks accessible to everyone. Here's what you need to know:

**What Are Fractional Shares?**
A fractional share is a portion of a full stock share. Instead of needing $500 to buy one share of Amazon, you can buy $1 worth—that's 0.002 shares. You still own Amazon stock, just a smaller piece.

**Why Fractional Shares Matter:**
- **Accessibility**: Invest in expensive stocks (Amazon, Google, Tesla) without thousands of dollars
- **Diversification**: Spread your money across many companies, even with small amounts
- **Flexibility**: Invest exact dollar amounts instead of whole shares
- **Lower Barriers**: Start investing with just $1

**How It Works:**
If Amazon stock costs $150 per share:
- Traditional: You need $150 minimum
- Fractional: You can invest $10, $25, $50, or any amount
- Your $10 buys 0.067 shares of Amazon
- You still benefit from price appreciation and dividends proportionally

**Real Example:**
- You invest $50 in fractional shares of Apple
- Apple stock is $200 per share
- You own 0.25 shares
- If Apple goes up 10%, your $50 becomes $55
- You get 25% of any dividends Apple pays

**Benefits for Beginners:**
1. Start immediately—no need to save up for full shares
2. Diversify easily—own pieces of many companies
3. Learn by doing—invest in companies you know
4. Build confidence—see results with small amounts

**The Bottom Line:**
Fractional shares make investing accessible to everyone. You don't need thousands of dollars to build a diversified portfolio. Start with what you have, and let it grow.`
    },
    "The Power of Compound Interest: See Your Wealth Grow Over Time": {
      title: "The Power of Compound Interest: See Your Wealth Grow Over Time",
      content: `Compound interest is often called the "eighth wonder of the world"—and for good reason. Here's why it's so powerful:

**What is Compound Interest?**
Compound interest means you earn returns on both your original investment AND on the returns you've already earned. It's interest on interest—your money makes money, and that money makes more money.

**The Math:**
If you invest $100 at 7% annual return:
- Year 1: $107 ($100 + $7)
- Year 2: $114.49 ($107 + $7.49)
- Year 3: $122.50 ($114.49 + $8.01)
- Year 10: $196.72
- Year 20: $386.97
- Year 30: $761.23

Notice how your earnings grow faster each year!

**Real-World Example:**
**Sarah starts at 25:**
- Invests $200/month from age 25-65
- Total invested: $96,000
- At 7% return: **$525,000** by age 65

**Mike starts at 35:**
- Invests $200/month from age 35-65
- Total invested: $72,000
- At 7% return: **$244,000** by age 65

**Sarah invested only $24,000 more but ended up with $281,000 more!**

**The Rule of 72:**
Divide 72 by your annual return to see how long it takes to double your money:
- At 7%: 72 ÷ 7 = ~10 years to double
- At 10%: 72 ÷ 10 = ~7 years to double

**How to Maximize Compound Interest:**
1. **Start NOW** - Every year you wait costs you thousands
2. **Invest consistently** - Regular contributions compound faster
3. **Reinvest dividends** - Don't take the cash, let it grow
4. **Stay invested** - Don't pull money out during market dips
5. **Increase contributions** - As you earn more, invest more

**The Bottom Line:**
Time is your greatest asset. Starting early, even with small amounts, can make you wealthy by retirement. The best time to start was yesterday. The second best time is today.`
    },
    "5 Common Investing Mistakes Beginners Make (And How to Avoid Them)": {
      title: "5 Common Investing Mistakes Beginners Make (And How to Avoid Them)",
      content: `Avoid these common mistakes to set yourself up for investing success:

**Mistake #1: Waiting for the "Perfect Time"**
Many beginners wait for the perfect moment to start investing, thinking they need more money or better market conditions. The truth? The best time to start is always now.

**How to Avoid:**
- Start with whatever you have, even if it's just $10
- Use dollar-cost averaging (invest regularly regardless of market conditions)
- Remember: time in the market beats timing the market

**Mistake #2: Investing Based on Emotions**
Buying when prices are high (FOMO) and selling when prices drop (panic) is a recipe for losses. Emotional investing almost always leads to poor decisions.

**How to Avoid:**
- Use automatic investing to remove emotion
- Set a strategy and stick to it
- Don't check your portfolio daily
- Remember: market downturns are normal and temporary

**Mistake #3: Not Diversifying**
Putting all your money in one stock or one sector is extremely risky. If that company or sector fails, you lose everything.

**How to Avoid:**
- Spread investments across different companies
- Invest in different industries (tech, healthcare, finance, etc.)
- Use index funds or automatic investing for instant diversification
- Don't put more than 5-10% in any single stock

**Mistake #4: Trying to Time the Market**
Beginners often try to buy low and sell high, thinking they can predict market movements. Even professional investors struggle with this.

**How to Avoid:**
- Invest consistently over time (dollar-cost averaging)
- Stay invested during market downturns
- Focus on long-term growth, not short-term gains
- Let automatic investing handle the timing

**Mistake #5: Not Starting Because You Don't Know Enough**
Many people delay investing because they feel they need to understand everything first. This is a trap—you'll never know everything, and waiting costs you money.

**How to Avoid:**
- Start with automatic investing (like Kamioi) that handles complexity for you
- Learn as you go
- Start small and increase as you learn
- Remember: perfect is the enemy of good

**The Bottom Line:**
The biggest mistake is not starting at all. Start with automatic investing, learn as you go, and avoid these common pitfalls. Your future self will thank you.`
    },
    "What is Passive Investing? Complete Guide to Set-and-Forget Wealth Building": {
      title: "What is Passive Investing? Complete Guide to Set-and-Forget Wealth Building",
      content: `Passive investing is the strategy of building wealth with minimal effort and time. Here's everything you need to know:

**What is Passive Investing?**
Passive investing means your money works for you automatically, without requiring constant monitoring, research, or decision-making. You set it up once, and it runs in the background.

**Key Characteristics:**
- Minimal time commitment
- Low maintenance
- Automatic execution
- Long-term focus
- Lower fees (usually)
- Less stress

**Types of Passive Investing:**
1. **Automatic Investing Apps** (like Kamioi)
   - Invests based on your spending automatically
   - No decisions needed
   - Works in the background

2. **Index Funds**
   - Track entire markets (S&P 500, etc.)
   - Diversified automatically
   - Low fees

3. **Robo-Advisors**
   - Automated portfolio management
   - Rebalances automatically
   - Based on your risk tolerance

4. **Target-Date Funds**
   - Automatically adjust as you approach retirement
   - Set it and forget it
   - Perfect for retirement accounts

**Why Passive Investing Works:**
- **Time**: You don't spend hours researching
- **Emotion**: Removes emotional decision-making
- **Consistency**: Automatic contributions build wealth steadily
- **Diversification**: Spreads risk across many investments
- **Lower Costs**: Fewer trades mean lower fees

**Passive vs. Active Investing:**
- **Passive**: Set it and forget it, lower fees, less time, consistent returns
- **Active**: Requires research, higher fees, more time, potential for higher returns (but often underperforms)

**Studies Show:**
Over 10+ years, passive investing strategies often outperform active strategies, especially after accounting for fees and taxes.

**How to Start Passive Investing:**
1. Choose your strategy (automatic apps, index funds, etc.)
2. Set up automatic contributions
3. Choose your risk level
4. Let it run—check quarterly, not daily
5. Increase contributions as you earn more

**The Bottom Line:**
Passive investing is perfect for busy people who want to build wealth without becoming investment experts. Set it up once, and let time and compound interest do the work.`
    }
  }

  return (
    <>
      <SEO
        title={(frontendContent.homepage_seo && frontendContent.homepage_seo.meta_title) ? frontendContent.homepage_seo.meta_title : "Kamioi - Automatic Investing App | AI-Powered Round-Up Investing"}
        description={(frontendContent.homepage_seo && frontendContent.homepage_seo.meta_description) ? frontendContent.homepage_seo.meta_description : "Turn everyday purchases into stock ownership with Kamioi's AI-powered automatic investing platform. Fractional shares, zero minimums, bank-level security. Request demo access today."}
        keywords="automatic investing, round-up investing, fractional shares, AI investing app, fintech app, passive investing, automatic stock investing, micro investing, investment automation, investing for beginners, robo advisor, automated portfolio, set and forget investing, turn purchases into stocks"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://kamioi.com/#organization",
              "name": "Kamioi",
              "url": "https://kamioi.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://kamioi.com/logo.png",
                "width": 600,
                "height": 60
              },
              "description": "AI-powered automatic investing fintech platform that turns everyday purchases into stock ownership through fractional shares",
              "foundingDate": "2024",
              "sameAs": [
                "https://twitter.com/kamioi",
                "https://linkedin.com/company/kamioi"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "availableLanguage": "English",
                "email": "support@kamioi.com"
              }
            },
            {
              "@type": "SoftwareApplication",
              "@id": "https://kamioi.com/#app",
              "name": "Kamioi",
              "applicationCategory": "FinanceApplication",
              "applicationSubCategory": "Investment App",
              "operatingSystem": "Web, iOS, Android",
              "description": "Automatic investing app with round-up investing, fractional shares, and AI-powered stock matching for effortless wealth building",
              "offers": {
                "@type": "Offer",
                "price": "9.00",
                "priceCurrency": "USD",
                "priceValidUntil": "2026-12-31",
                "availability": "https://schema.org/PreOrder"
              },
              "featureList": [
                "Automatic round-up investing",
                "Fractional share purchases",
                "AI-powered stock matching",
                "Bank-level 256-bit encryption",
                "SIPC insurance protection ready",
                "$0 minimum to start"
              ]
            },
            {
              "@type": "WebSite",
              "@id": "https://kamioi.com/#website",
              "name": "Kamioi",
              "url": "https://kamioi.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://kamioi.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@type": "FAQPage",
              "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            }
          ]
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
        {/* Navigation */}
        <nav className="fixed w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl font-bold text-white">
                    Kamioi
                  </span>
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
                  className="text-gray-600 hover:text-gray-900"
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
                    navigate('/login')
                    setMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
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
              layoutType={heroData.layout_type}
              images={heroData.images || []}
              layoutConfig={heroData.layout_config || {}}
              className={heroData.layout_type ? '' : 'text-center'}
            >
              <div className={heroData.layout_type ? '' : 'text-center'}>
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 mb-8">
                  <Sparkles className="w-4 h-4 text-cyan-300 mr-2" />
                  <span className="text-sm font-medium text-white">Perfect for First-Time Investors</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  {frontendContent.homepage_seo?.h1_headline || heroData.headline || "The Future of Automatic Investing Starts Here"}
                </h1>
                <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-3xl mx-auto leading-relaxed">
                  {heroData.subheadline || "Kamioi is an AI-powered platform that turns your everyday purchases into stock ownership. No research required, no complexity—just connect once and let our technology build your portfolio automatically."}
                </p>
                
                {/* Key Benefits */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 max-w-4xl mx-auto">
                  {((heroData.key_benefits && Array.isArray(heroData.key_benefits) && heroData.key_benefits.length > 0)
                    ? heroData.key_benefits
                    : [
                        "$0 to start — No minimum investment required",
                        "100% automatic — AI handles everything for you",
                        "Own what you buy — Coffee at Starbucks? Own Starbucks stock",
                        "Beginner-friendly — Perfect for first-time investors"
                      ]
                  ).map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 text-white/90">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm md:text-base">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <button
                    onClick={() => setShowDemoForm(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 shadow-lg"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>{heroData.cta_button_text || "Request Demo Access"}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/how-it-works')}
                    className="px-8 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center space-x-3"
                  >
                    <Play className="w-5 h-5" />
                    <span>See How It Works</span>
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mt-8">
                  {((heroData.trust_indicators && Array.isArray(heroData.trust_indicators) && heroData.trust_indicators.length > 0)
                    ? heroData.trust_indicators
                    : [
                        "Bank-level 256-bit encryption",
                        "SIPC protection ready",
                        "AI-powered automation"
                      ]
                  ).map((indicator, index) => (
                    <div key={index} className="flex items-center space-x-2 text-white/80">
                      <Shield className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium">{indicator.replace(/^(?:🔒|👥|⭐)\s*/u, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionLayout>
          </div>
        </section>

        {/* Stats Section - Only show if stats exist */}
        {stats && stats.length > 0 && (
        <section ref={statsRef} className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Built for Secure, Effortless Investing
              </h3>
            </div>
            
            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => {
                const animatedValue = Object.values(animatedStats)[index]
                const displayValue = formatNumber(animatedValue)
                
                return (
                  <div key={index} className="relative group">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:border-white/40 hover:bg-white/15 transition-all duration-300 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-lg flex items-center justify-center border border-white/20 text-white">
                          {stat.icon || <Database className="w-5 h-5" />}
                        </div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {stat.prefix || ''}{displayValue}{stat.suffix}
                      </div>
                      <div className="text-sm text-white/80 font-medium">{stat.label}</div>
                      <div className="mt-3 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        )}

        {/* How It Works Section - Only show if howItWorks exist */}
        {howItWorks && howItWorks.length > 0 && (
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                How Automatic Investing Works: 3 Simple Steps
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 shadow-lg">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-2xl flex items-center justify-center border border-white/20">
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-white/80 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Educational Content Section - Only show if educationalContent exists */}
        {educationalContent && (
        <section id="educational-content" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl mb-6 border border-emerald-400/50">
                <GraduationCap className="w-10 h-10 text-emerald-300" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                {educationalContent.headline}
              </h2>
              {educationalContent.intro && (
                <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
                  {educationalContent.intro}
                </p>
              )}
            </div>

            {educationalContent.featured_topics && 
             Array.isArray(educationalContent.featured_topics) && 
             educationalContent.featured_topics.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalContent.featured_topics.map((topic, index) => (
                  <div key={index} className="group relative">
                    <button
                      onClick={() => setSelectedTopic(topic)}
                      className="w-full bg-white/15 backdrop-blur-lg border-2 border-emerald-400/30 rounded-2xl p-8 hover:bg-white/20 hover:border-emerald-400/50 transition-all duration-300 hover:scale-105 shadow-xl min-h-[180px] flex flex-col text-left cursor-pointer"
                    >
                      <div className="flex items-start mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400/40 to-cyan-400/40 rounded-xl flex items-center justify-center border border-emerald-300/50 mr-4 group-hover:scale-110 transition-transform duration-300 text-white flex-shrink-0">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-white leading-tight flex-1">{topic}</h3>
                      </div>
                      <div className="mt-auto pt-4">
                        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        )}

        {/* Value Propositions */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Own Stocks in Everything You Buy Automatically
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Our AI-powered platform automatically analyzes every transaction and turns your lifestyle spending into real stock ownership. Coffee, streaming, tech, fashion—it all becomes part of your portfolio.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {valuePropositions.map((prop, index) => (
                <div key={index} className="group relative">
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 text-center shadow-lg">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-2xl flex items-center justify-center mb-6 border border-white/20 group-hover:scale-110 transition-transform duration-300">
                      {prop.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{prop.title}</h3>
                    <p className="text-white/80 leading-relaxed">{prop.description}</p>
                    <div className="mt-6 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="flex items-center space-x-2 text-white/80">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium">Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Lock className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Brain className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-medium">AI-Powered Automation</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium">$0 Minimum to Start</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium">SIPC Protection Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Only show if features exist */}
        {features && features.length > 0 && (
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Why Choose Kamioi for Automatic Investing
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 shadow-lg">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl flex items-center justify-center border border-white/20 mr-4 group-hover:scale-110 transition-transform duration-300 text-white">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                    </div>
                    <p className="text-white/80 leading-relaxed">{feature.description}</p>
                    <div className="mt-4 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Testimonials - Only show if testimonials exist */}
        {testimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Join the Growing Interest
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Be among the first to experience the future of automatic investing
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="group relative">
                  <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 shadow-lg">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold mr-4 group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/20">
                        <img 
                          src={`https://i.pravatar.cc/150?img=${index + 10}`}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.className = 'w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold mr-4 group-hover:scale-110 transition-transform duration-300'
                            e.target.parentElement.textContent = testimonial.avatar
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{testimonial.name}</h4>
                          {testimonial.verified && (
                            <BadgeCheck className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                        <p className="text-sm text-white/70">{testimonial.role} • {testimonial.age}</p>
                        {testimonial.result && (
                          <p className="text-xs text-green-400 font-semibold mt-1">{testimonial.result}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-300 fill-current" />
                      ))}
                    </div>
                    <p className="text-white/80 italic leading-relaxed">{testimonial.content}</p>
                    <div className="mt-4 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Subscription Plans Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple Pricing for Everyone
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Individual Plan */}
              <div className="group relative">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 shadow-lg h-full flex flex-col">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl flex items-center justify-center border border-white/20">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">Individual</h3>
                  <p className="text-white/70 text-sm mb-6 text-center">Perfect for solo investors</p>
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold text-white">$9</span>
                    <span className="text-white/70 text-lg">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Unlimited automatic investments</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">AI-powered stock matching</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Fractional share purchases</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Portfolio tracking & insights</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Mobile app access</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Email support</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Family Plan */}
              <div className="group relative">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border-2 border-blue-400/50 rounded-2xl p-8 hover:bg-gradient-to-br hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/70 transition-all duration-300 hover:scale-105 shadow-xl h-full flex flex-col relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="flex items-center justify-center mb-6 mt-2">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400/40 to-purple-400/40 rounded-xl flex items-center justify-center border border-white/30">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">Family</h3>
                  <p className="text-white/70 text-sm mb-6 text-center">Save with shared investing</p>
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold text-white">$19</span>
                    <span className="text-white/70 text-lg">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Everything in Individual</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Up to 5 family members</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Shared portfolio dashboard</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Family investment goals</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Priority support</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">15% savings vs individual plans</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Business Plan */}
              <div className="group relative">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 shadow-lg h-full flex flex-col">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-xl flex items-center justify-center border border-white/20">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 text-center">Business</h3>
                  <p className="text-white/70 text-sm mb-6 text-center">For teams & organizations</p>
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold text-white">$49</span>
                    <span className="text-white/70 text-lg">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Everything in Family</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Up to 20 users</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Advanced analytics</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Custom reporting</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">API access</span>
                    </li>
                    <li className="flex items-start text-white/80">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Dedicated account manager</span>
                    </li>
                  </ul>
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <p className="text-white/70 text-sm mb-4">Start Your 14-Day Free Trial — No Credit Card Required</p>
              <p className="text-white/60 text-xs">Cancel anytime. No hidden fees.</p>
            </div>
          </div>
        </section>

        {/* Latest Blogs Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Latest from Our Blog
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Stay informed with expert insights on investing, financial literacy, and building wealth for the future.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogsLoading ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="group animate-pulse">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden">
                      <div className="aspect-video bg-white/10"></div>
                      <div className="p-6">
                        <div className="h-4 bg-white/10 rounded mb-3"></div>
                        <div className="h-6 bg-white/10 rounded mb-3"></div>
                        <div className="h-4 bg-white/10 rounded mb-4"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-white/10 rounded-full mr-3"></div>
                            <div className="h-4 bg-white/10 rounded w-20"></div>
                          </div>
                          <div className="h-4 bg-white/10 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : blogs && blogs.length > 0 ? (
                blogs.map((blog, index) => (
                  <article key={blog.id || index} className="group">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-lg">
                      <div className="min-h-[200px] bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center overflow-hidden">
                        {blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload` ? (
                          <img 
                            src={blog.featured_image} 
                            alt={`${blog.title} - Kamioi investment blog post about ${blog.category || 'investing'}`}
                            className="w-full h-full object-contain"
                            style={{ objectPosition: 'center top' }}
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className="text-center" style={{ display: (blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload`) ? 'none' : 'flex' }}>
                          <FileText className="w-12 h-12 text-white/40 mx-auto mb-2" />
                          <p className="text-white/40 text-sm">Blog Image</p>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center mb-3">
                          <span className="bg-blue-400/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium border border-white/20">
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
                        <div className="flex items-center justify-between">
                          <div className="text-white/70 text-xs">
                            {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Draft'}
                          </div>
                          <button 
                            onClick={() => {
                              window.location.href = `/blog/${blog.slug}`
                            }}
                            className="text-cyan-300 hover:text-cyan-200 transition-colors flex items-center"
                          >
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Blog Posts Yet</h3>
                  <p className="text-white/70">Check back soon for the latest insights on investing and financial literacy.</p>
                </div>
              )}
            </div>

            <div className="text-center mt-12">
              <button 
                onClick={() => {
                  window.location.href = '/blog'
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center mx-auto"
              >
                View All Blogs
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </section>

        {/* FAQs - Only show if there are FAQs to display */}
        {faqs && faqs.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Frequently Asked Questions About Automatic Investing
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 overflow-hidden shadow-lg">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/10 transition-colors"
                  >
                    <span className="font-semibold text-white">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronDown className="w-5 h-5 text-white/70" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/70" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-white/80 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
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
              Ready to Turn Your Purchases Into Wealth?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of investors who are building their financial future automatically. No investment experience required. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 shadow-lg"
              >
                <Rocket className="w-5 h-5" />
                <span>Start Free 14-Day Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-sm text-white/80">
                No credit card required • Cancel anytime • $0 to start
              </p>
            </div>
          </div>
        </section>

         {/* Footer */}
         <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-lg border-t border-white/10 text-white">
           <div className="max-w-7xl mx-auto text-center text-white/70">
             <p>© 2026 Kamioi. Making investing effortless for the next generation.</p>
           </div>
         </footer>

         {/* Educational Topic Modal */}
         {selectedTopic && topicContent[selectedTopic] && (
           <div 
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
             onClick={() => setSelectedTopic(null)}
           >
             <div 
               className="bg-gradient-to-br from-emerald-900/95 via-teal-900/95 to-cyan-900/95 backdrop-blur-lg border-2 border-emerald-400/50 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="sticky top-0 bg-gradient-to-br from-emerald-900/95 to-cyan-900/95 backdrop-blur-lg border-b border-emerald-400/30 px-6 py-4 flex items-center justify-between">
                 <h3 className="text-2xl md:text-3xl font-bold text-white flex-1 pr-4">
                   {topicContent[selectedTopic].title}
                 </h3>
                 <button
                   onClick={() => setSelectedTopic(null)}
                   className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>
               <div className="p-6 md:p-8">
                 <div className="prose prose-invert max-w-none">
                   <div className="text-white/90 leading-relaxed whitespace-pre-line text-base md:text-lg">
                     {topicContent[selectedTopic].content}
                   </div>
                 </div>
               </div>
               <div className="sticky bottom-0 bg-gradient-to-br from-emerald-900/95 to-cyan-900/95 backdrop-blur-lg border-t border-emerald-400/30 px-6 py-4">
                 <button
                   onClick={() => setSelectedTopic(null)}
                   className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Demo Request Form Modal */}
         <DemoRequestForm
           isOpen={showDemoForm}
           onClose={() => setShowDemoForm(false)}
         />
       </div>
     </>
   )
 }

 export default HomePageV5

