import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import SEO from '../components/common/SEO'

const BlogListing = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(6) // 6 posts per page (3 columns x 2 rows)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/blog/posts?limit=1000`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data && data.data.posts) {
            setBlogs(data.data.posts)
          } else {
            setBlogs([])
          }
        } else {
          setBlogs([])
        }
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || blog.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage
  const indexOfFirstPost = indexOfLastPost - postsPerPage
  const currentPosts = filteredBlogs.slice(indexOfFirstPost, indexOfLastPost)
  const totalPages = Math.ceil(filteredBlogs.length / postsPerPage)

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory])

  const categories = [...new Set(blogs.map(blog => blog.category).filter(Boolean))]

  return (
    <>
      <SEO
        title="Investing Blog & Financial Insights | Kamioi"
        description="Stay informed with expert insights on investing, financial literacy, and building wealth. Free articles on automatic investing, fractional shares, and more."
        keywords="investing blog, financial literacy, wealth building, fractional shares, automatic investing articles"
        breadcrumbs={[
          { name: "Home", url: "https://kamioi.com/" },
          { name: "Blog", url: "https://kamioi.com/blog" }
        ]}
        faq={[
          { question: "What topics does the Kamioi blog cover?", answer: "The Kamioi blog covers investing strategies, financial literacy, automatic investing tips, market insights, and guides for building long-term wealth through round-up investing." },
          { question: "How often is the Kamioi blog updated?", answer: "We publish new articles regularly, covering the latest in personal finance, investing trends, and tips for getting the most out of your Kamioi automatic investing experience." },
          { question: "Can I learn about investing as a beginner on the Kamioi blog?", answer: "Yes! Our blog includes beginner-friendly guides that explain investing concepts, how automatic round-up investing works, and strategies for building wealth starting with small amounts." },
          { question: "Does Kamioi provide financial advice on the blog?", answer: "Our blog provides educational content and general information about investing. For personalized financial advice, we recommend consulting a licensed financial advisor." }
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Kamioi Blog",
          "description": "Expert insights on investing, financial literacy, and building wealth for the future.",
          "url": "https://kamioi.com/blog",
          "isPartOf": {
            "@type": "WebSite",
            "@id": "https://kamioi.com/#website"
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <a href="/" className="text-3xl font-bold text-white flex items-center">
                Kamioi
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/#features" className="text-white/80 hover:text-white transition-colors text-lg">Features</a>
              <a href="/#how-it-works" className="text-white/80 hover:text-white transition-colors text-lg">How It Works</a>
              <a href="/#educational-content" className="text-white/80 hover:text-white transition-colors text-lg">Learn</a>
              <a href="/#pricing" className="text-white/80 hover:text-white transition-colors text-lg">Pricing</a>
              <a href="/blog" className="text-white font-semibold text-lg">Blog</a>
              <a href="/contact" className="text-white/80 hover:text-white transition-colors text-lg">Contact</a>
              <button onClick={() => navigate('/login')} className="text-white/80 hover:text-white transition-colors text-lg">Login</button>
              <button
                onClick={() => navigate('/signup')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
              >
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden mt-4 space-y-2">
              <button
                onClick={() => {
                  navigate('/#features')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
              >
                Features
              </button>
              <button
                onClick={() => {
                  navigate('/#how-it-works')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
              >
                How It Works
              </button>
              <button
                onClick={() => {
                  navigate('/#educational-content')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
              >
                Learn
              </button>
              <button
                onClick={() => {
                  navigate('/#pricing')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  navigate('/blog')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
              >
                Blog
              </button>
              <button
                onClick={() => {
                  navigate('/contact')
                  setMenuOpen(false)
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10"
              >
                Contact
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
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              >
                Start Building
              </button>
            </div>
          )}
        </nav>

        {/* Header */}
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Latest from Our Blog
              </h1>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Stay informed with expert insights on investing, financial literacy, and building wealth for the future.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-6 py-4 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 transition-all cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Blog Posts Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20">
                    <div className="aspect-video bg-white/10"></div>
                    <div className="p-6">
                      <div className="h-4 bg-white/10 rounded mb-3"></div>
                      <div className="h-6 bg-white/10 rounded mb-3"></div>
                      <div className="h-4 bg-white/10 rounded mb-4"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-white/10 rounded w-20"></div>
                        <div className="h-4 bg-white/10 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : currentPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPosts.map((blog, index) => (
                <article key={blog.id || index} className="group">
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 shadow-xl">
                    <div className="min-h-[200px] bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center relative overflow-hidden">
                      {blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload` ? (
                        <img 
                          src={blog.featured_image} 
                          alt={blog.title}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          style={{ objectPosition: 'center top' }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="text-center absolute inset-0 flex flex-col items-center justify-center" style={{ display: (blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload`) ? 'none' : 'flex' }}> 
                        <p className="text-white/70 text-sm">Blog Image</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        {blog.category && (
                          <span className="bg-blue-400/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium border border-white/20 mr-3">
                            {blog.category}
                          </span>
                        )}
                        <span className="text-white/70 text-sm">
                          {blog.read_time} min read
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-white/80 mb-6 leading-relaxed line-clamp-3">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="text-white/60 text-xs">
                          {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Draft'}
                        </div>
                        <button 
                          onClick={() => navigate(`/blog/${blog.slug}`)}
                          className="text-cyan-300 hover:text-cyan-200 transition-colors font-semibold"
                        >
                          Read More →
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-bold text-white mb-3">No Blog Posts Found</h3>
              <p className="text-white/70 text-lg">Try adjusting your search or filter criteria.</p>
            </div>
          )}

          {/* Pagination */}
          {filteredBlogs.length > postsPerPage && (
            <div className="mt-16">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-5 py-3 rounded-xl transition-all font-semibold ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                              : 'bg-white/10 backdrop-blur-lg border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-white/50 px-2">...</span>
                    }
                    return null
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Results count */}
          {filteredBlogs.length > 0 && (
            <div className="text-center mt-8 text-white/70 text-sm">
              Showing {indexOfFirstPost + 1}-{Math.min(indexOfLastPost, filteredBlogs.length)} of {filteredBlogs.length} posts
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-lg border-t border-white/10 text-white mt-20">
          <div className="max-w-7xl mx-auto text-center text-white/70">
            <p>© 2026 Kamioi. Making investing effortless for the next generation.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

export default BlogListing
