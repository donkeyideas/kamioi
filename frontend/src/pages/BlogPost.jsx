import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Share2, Clock, Calendar, FileText, Menu, X, ArrowRight } from 'lucide-react'
import SEO from '../components/common/SEO'
import { useNotifications } from '../hooks/useNotifications'

const BlogPost = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [isMenuOpen, setMenuOpen] = useState(false)
  const { addNotification } = useNotifications()

  const fetchBlogPost = useCallback(async () => {
    try {
      setLoading(true)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/blog/posts/${slug}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setBlog(data.data)
        } else {
          setError('Blog post not found')
        }
      } else {
        setError('Blog post not found')
      }
    } catch (error) {
      console.error('Failed to fetch blog post:', error)
      setError('Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }, [slug])

  const fetchRelatedPosts = useCallback(async () => {
    if (!blog) return
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/blog/posts?category=${blog.category}&limit=3`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.posts) {
          // Filter out current post and get up to 3 related posts
          const related = data.data.posts
            .filter(post => post.slug !== blog.slug)
            .slice(0, 3)
          setRelatedPosts(related)
        }
      }
    } catch (error) {
      console.error('Failed to fetch related posts:', error)
    }
  }, [blog])

  useEffect(() => {
    if (slug) {
      fetchBlogPost()
    }
  }, [slug, fetchBlogPost])

  useEffect(() => {
    if (blog) {
      fetchRelatedPosts()
    }
  }, [blog, fetchRelatedPosts])

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Link Copied',
          message: 'Blog post link copied to clipboard!',
          read: false
        })
      } catch (error) {
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Copy Failed',
          message: 'Failed to copy link to clipboard. Please try again.',
          read: false
        })
      }
    }
  }

  // Parse markdown and convert to HTML
  const parseContent = (content) => {
    if (!content) return ''
    
    let parsed = content
    
    // First, preserve chart containers
    const chartPlaceholders = []
    let chartIndex = 0
    parsed = parsed.replace(/<div[^>]*class="chart-container"[^>]*>.*?<iframe[^>]+src="([^"]+)"[^>]*>.*?<\/iframe>.*?<\/div>/gis, (match) => {
      const placeholder = `__CHART_${chartIndex}__`
      chartPlaceholders[chartIndex] = match
      chartIndex++
      return placeholder
    })
    
    // First, convert bold **text** to <strong>text</strong> (before processing lines)
    // Use placeholders to protect bold text
    const placeholders = []
    let placeholderIndex = 0
    parsed = parsed.replace(/\*\*([^*]+?)\*\*/g, (match, text) => {
      const placeholder = `__BOLD_${placeholderIndex}__`
      placeholders[placeholderIndex] = `<strong>${text}</strong>`
      placeholderIndex++
      return placeholder
    })
    
    // Convert italic *text* to <em>text</em>
    parsed = parsed.replace(/\*([^*\n]+?)\*/g, (match, text) => {
      const placeholder = `__ITALIC_${placeholderIndex}__`
      placeholders[placeholderIndex] = `<em>${text}</em>`
      placeholderIndex++
      return placeholder
    })
    
    // Convert bullet lists (- item) to <ul><li>
    const lines = parsed.split('\n')
    let inList = false
    let htmlLines = []
    
    lines.forEach((line) => {
      const trimmed = line.trim()
      const isEmpty = trimmed === ''
      
      if (trimmed.startsWith('- ')) {
        const listItem = trimmed.replace(/^-\s+/, '').trim()
        if (!inList) {
          inList = true
          htmlLines.push('<ul>')
        }
        htmlLines.push(`<li>${listItem}</li>`)
      } else {
        if (inList) {
          inList = false
          htmlLines.push('</ul>')
        }
        
        if (isEmpty) {
          // Skip empty lines - spacing will be handled by CSS margins
        } else {
          // Check if this looks like a heading
          // Headings are typically: short, contain bold placeholder, or end with colon, or are all caps
          const hasBoldPlaceholder = /__BOLD_\d+__/.test(trimmed)
          const isAllCaps = trimmed.length < 60 && trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !hasBoldPlaceholder
          const endsWithColon = trimmed.endsWith(':') && trimmed.length < 60
          const isShortLine = trimmed.length < 60 && !trimmed.includes('.') && !trimmed.includes(',')
          
          const isHeading = (hasBoldPlaceholder && isShortLine) || (isAllCaps && isShortLine) || endsWithColon
          
          if (isHeading) {
            htmlLines.push(`<h3 class="blog-heading">${trimmed}</h3>`)
          } else {
            htmlLines.push(`<p>${trimmed}</p>`)
          }
        }
      }
    })
    if (inList) htmlLines.push('</ul>')
    parsed = htmlLines.join('')
    
    // Restore placeholders (bold and italic)
    placeholders.forEach((html, index) => {
      parsed = parsed.replace(`__BOLD_${index}__`, html)
      parsed = parsed.replace(`__ITALIC_${index}__`, html)
    })
    
    // Convert images ![alt](url) to <img> tags
    parsed = parsed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;" class="blog-image" />')
    
    // Convert markdown links [text](url) to HTML links
    parsed = parsed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => {
        // Ensure URL has protocol
        let fullUrl = url
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:') && !url.startsWith('#')) {
          fullUrl = url.startsWith('/') ? url : `https://${url}`
        }
        return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="blog-link">${text}</a>`
      }
    )
    
    // Restore chart placeholders
    chartPlaceholders.forEach((chart, index) => {
      parsed = parsed.replace(`__CHART_${index}__`, chart)
    })
    
    return parsed
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading blog post...</p>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-500/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20">
            <span className="text-red-400 text-3xl">❌</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Blog Post Not Found</h1>
          <p className="text-white/70 text-lg mb-8">The blog post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => navigate('/blog')}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Blog</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO 
        title={`${blog.title} - Kamioi Blog`}
        description={blog.excerpt}
        keywords={blog.seo_keywords}
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
        <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
              <button
                onClick={() => navigate('/blog')}
                className="flex items-center text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span>Back to Blog</span>
              </button>
            </div>
            
            <div className="flex items-center mb-6">
              {blog.category && (
                <span className="bg-blue-400/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium border border-white/20 mr-4">
                  {blog.category}
                </span>
              )}
              <span className="text-white/70 text-sm flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {blog.read_time} min read
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              {blog.excerpt}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex items-center text-white/70 text-sm">
                <Calendar className="w-5 h-5 mr-2" />
                {blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Draft'}
              </div>
              <button
                onClick={sharePost}
                className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Featured Image - High Quality, Properly Sized */}
        {blog.featured_image && blog.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload` && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm">
              <img 
                src={blog.featured_image}
                alt={blog.title}
                className="w-full h-auto max-h-[600px] object-contain mx-auto"
                style={{
                  imageRendering: 'auto',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                  maxWidth: '100%',
                  height: 'auto',
                  display: 'block'
                }}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="hidden aspect-video bg-gradient-to-br from-blue-500/20 to-purple-600/20 items-center justify-center">
                <FileText className="w-16 h-16 text-white/40" />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12">
            <div 
              className="text-white/90 leading-relaxed text-lg blog-content"
              style={{
                lineHeight: '1.8',
                fontSize: '1.125rem'
              }}
              dangerouslySetInnerHTML={{ __html: parseContent(blog.content) }}
            />
            <style>{`
              .blog-content a.blog-link {
                color: #67e8f9 !important;
                text-decoration: underline;
                transition: color 0.2s ease;
                font-weight: 500;
              }
              .blog-content a.blog-link:hover {
                color: #a5f3fc !important;
                text-decoration: underline;
              }
              .blog-content a.blog-link:visited {
                color: #22d3ee !important;
              }
              .blog-content p {
                margin: 0 0 16px 0;
                line-height: 1.8;
              }
              .blog-content p:last-child {
                margin-bottom: 0;
              }
              .blog-content h3.blog-heading {
                font-size: 1.4rem;
                font-weight: 700;
                margin: 28px 0 12px 0;
                color: #ffffff;
                line-height: 1.5;
              }
              .blog-content h3.blog-heading:first-child {
                margin-top: 0;
              }
              .blog-content ul {
                list-style-type: disc;
                margin: 16px 0;
                padding-left: 30px;
              }
              .blog-content li {
                margin: 8px 0;
                line-height: 1.7;
              }
              .blog-content ul + p,
              .blog-content p + ul {
                margin-top: 16px;
              }
              .blog-content h3 + p {
                margin-top: 16px;
              }
              .blog-content p + h3 {
                margin-top: 32px;
              }
              .blog-content img.blog-image {
                max-width: 100%;
                height: auto;
                margin: 20px 0;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .blog-content .chart-container {
                margin: 20px 0;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .blog-content .chart-container iframe {
                border: none;
                display: block;
              }
            `}</style>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 flex items-center justify-center">
              <FileText className="w-8 h-8 mr-3 text-cyan-300" />
              Related Posts
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <article
                  key={relatedPost.id}
                  onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-pointer shadow-xl"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center relative overflow-hidden">
                    {relatedPost.featured_image && relatedPost.featured_image !== `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'}/upload` ? (
                      <img
                        src={relatedPost.featured_image}
                        alt={relatedPost.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        style={{
                          imageRendering: '-webkit-optimize-contrast'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="hidden absolute inset-0 items-center justify-center">
                      <FileText className="w-12 h-12 text-white/40" />
                    </div>
                  </div>
                  <div className="p-6">
                    {relatedPost.category && (
                      <span className="bg-blue-400/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium border border-white/20 mb-3 inline-block">
                        {relatedPost.category}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 hover:text-cyan-300 transition-colors">
                      {relatedPost.title}
                    </h3>
                    <p className="text-white/80 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/10">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {relatedPost.read_time} min read
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {relatedPost.published_at ? new Date(relatedPost.published_at).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/20 backdrop-blur-lg border-t border-white/10 text-white mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <button
                onClick={() => navigate('/blog')}
                className="flex items-center px-6 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all font-semibold"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Blog
              </button>
              <button
                onClick={sharePost}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Post
              </button>
            </div>
            <div className="text-center text-white/70">
              <p>© 2026 Kamioi. Making investing effortless for the next generation.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default BlogPost
