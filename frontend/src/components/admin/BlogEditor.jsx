import React, { useState, useEffect } from 'react' // BlogEditor component
import { 
  Save, 
  X, 
  Eye, 
  Calendar, 
  User, 
  Tag, 
  Image as ImageIcon, 
  FileText,
  Globe,
  Settings,
  Upload,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
  Brain,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Wand2,
  List,
  PieChart
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'

const BlogEditor = ({ post, onSave, onCancel, isEditing = false }) => {
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const { addNotification } = useNotifications()
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image: '',
    status: 'published',
    category: '',
    tags: [],
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    meta_robots: 'index,follow',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    twitter_title: '',
    twitter_description: '',
    twitter_image: '',
    schema_markup: ''
  })
  
  const [seoScore, setSeoScore] = useState(0)
  const [seoSuggestions, setSeoSuggestions] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [showPreview, setShowPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [contentRef, setContentRef] = useState(null)
  const [contentHtml, setContentHtml] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkData, setLinkData] = useState({ url: '', text: '' })
  const [showImageModal, setShowImageModal] = useState(false)
  const [imageData, setImageData] = useState({ url: '', alt: '' })
  const [showChartModal, setShowChartModal] = useState(false)
  const [chartData, setChartData] = useState({ url: '', title: '' })

  useEffect(() => {
    if (post) {
      const content = post.content || ''
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: content, // Store raw markdown content
        excerpt: post.excerpt || '',
        featured_image: post.featured_image || '',
        status: post.status || 'draft',
        category: post.category || '',
        tags: Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? JSON.parse(post.tags || '[]') : []),
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        seo_keywords: post.seo_keywords || '',
        meta_robots: post.meta_robots || 'index,follow',
        canonical_url: post.canonical_url || '',
        og_title: post.og_title || '',
        og_description: post.og_description || '',
        og_image: post.og_image || '',
        twitter_title: post.twitter_title || '',
        twitter_description: post.twitter_description || '',
        twitter_image: post.twitter_image || '',
        schema_markup: post.schema_markup || ''
      })
      setSeoScore(post.ai_seo_score || 0)
      setSeoSuggestions(Array.isArray(post.ai_seo_suggestions) ? post.ai_seo_suggestions : (typeof post.ai_seo_suggestions === 'string' ? JSON.parse(post.ai_seo_suggestions || '[]') : []))
      // Set contentHtml for contentEditable display
      setContentHtml(markdownToHtml(content))
    }
  }, [post])

  // Auto-run SEO analysis when content changes (local calculation, runs fast)
  useEffect(() => {
    if (formData.title || formData.content) {
      const timeoutId = setTimeout(() => {
        runAISEOAnalysis()
      }, 500) // Short delay for smooth UX

      return () => clearTimeout(timeoutId)
    }
  }, [formData.title, formData.content, formData.seo_keywords, formData.seo_description, formData.featured_image])

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200' : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  const getInputClass = () => isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'

  const handleInputChange = (field, value) => {
    // Validate featured_image URL
    if (field === 'featured_image' && value) {
      // Clear invalid or incomplete URLs
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      if (value === `${apiBaseUrl}/upload` || 
          value === `${apiBaseUrl}/uploa` ||
          value === `${apiBaseUrl}/upload/` ||
          !value.startsWith('http') ||
          value.length < 20) {
        value = ''
      }
      // If it's a relative path, make it full
      else if (value.startsWith('/uploads/')) {
        value = `${apiBaseUrl}${value}`
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug from title
    if (field === 'title' && !formData.slug) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }

    // Auto-generate SEO fields if empty
    if (field === 'title' && !formData.seo_title) {
      setFormData(prev => ({ ...prev, seo_title: value }))
    }
    if (field === 'content' && !formData.seo_description) {
      const excerpt = value.substring(0, 160).replace(/<[^>]*>/g, '')
      setFormData(prev => ({ ...prev, seo_description: excerpt }))
    }
  }

  const handleTagAdd = (tag) => {
    if (tag && Array.isArray(formData.tags) && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(Array.isArray(prev.tags) ? prev.tags : []), tag]
      }))
    }
  }

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: Array.isArray(prev.tags) ? prev.tags.filter(tag => tag !== tagToRemove) : []
    }))
  }

  // Local SEO analysis - no backend API needed
  const runAISEOAnalysis = () => {
    setIsAnalyzing(true)

    // Calculate SEO score locally
    const title = formData.title || ''
    const content = formData.content || ''
    const seoKeywords = formData.seo_keywords || ''
    const seoDescription = formData.seo_description || ''

    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length
    const titleLength = title.length

    let score = 0
    const suggestions = []

    // Title optimization (20 points)
    if (titleLength >= 30 && titleLength <= 60) {
      score += 20
    } else if (titleLength > 0) {
      score += 5
      suggestions.push(`Title should be 30-60 characters for optimal SEO (currently ${titleLength})`)
    } else {
      suggestions.push('Add a title to your post')
    }

    // Content length (20 points)
    if (wordCount >= 300) {
      score += 20
    } else if (wordCount >= 100) {
      score += 10
      suggestions.push(`Content should be at least 300 words for better SEO (currently ${wordCount})`)
    } else {
      suggestions.push(`Add more content - aim for at least 300 words (currently ${wordCount})`)
    }

    // Keyword usage (20 points)
    if (seoKeywords) {
      const keywords = seoKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k)
      if (keywords.length > 0) {
        const contentLower = content.toLowerCase()
        const keywordFound = keywords.some(k => contentLower.includes(k))
        if (keywordFound) {
          score += 20
        } else {
          score += 5
          suggestions.push('Include your focus keywords in the content')
        }
      }
    } else {
      suggestions.push('Add SEO keywords in the SEO tab')
    }

    // Meta description (20 points)
    const metaDescLength = seoDescription.length
    if (metaDescLength >= 120 && metaDescLength <= 160) {
      score += 20
    } else if (metaDescLength > 0) {
      score += 10
      suggestions.push(`Meta description should be 120-160 characters (currently ${metaDescLength})`)
    } else {
      suggestions.push('Add a meta description in the SEO tab')
    }

    // Content structure - headings (10 points)
    if (content.includes('**') || content.includes('## ') || content.includes('### ')) {
      score += 10
    } else {
      suggestions.push('Add headings or bold text to improve content structure')
    }

    // Has featured image (10 points)
    if (formData.featured_image) {
      score += 10
    } else {
      suggestions.push('Add a featured image to increase engagement')
    }

    setSeoScore(score)
    setSeoSuggestions(suggestions)

    // Brief animation delay for UX
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 300)
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select a valid image file',
        timestamp: new Date()
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'File Too Large',
        message: 'Image size must be less than 5MB',
        timestamp: new Date()
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3'}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          handleInputChange('featured_image', `${apiBaseUrl}${data.image_url}`)
        } else {
          throw new Error(data.error || 'Upload failed')
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload image. Please try again.',
        timestamp: new Date()
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter a title',
          timestamp: new Date()
        })
        return
      }
      
      if (!formData.content.trim()) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter content',
          timestamp: new Date()
        })
        return
      }

      // Auto-generate slug if not provided
      if (!formData.slug) {
        const slug = formData.title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        setFormData(prev => ({ ...prev, slug }))
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const url = post ? 
        `${apiBaseUrl}/api/admin/blog/posts/${post.id}` : 
        `${apiBaseUrl}/api/admin/blog/posts`
      
      const method = post ? 'PUT' : 'POST'
      
      const requestData = {
        ...formData,
        status: 'published', // Always publish directly
        ai_seo_score: seoScore,
        ai_seo_suggestions: JSON.stringify(seoSuggestions)
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3' || 'admin_token_3'}`
        },
        body: JSON.stringify(requestData)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          addNotification({
            type: 'success',
            title: 'Post Saved',
            message: 'Blog post saved successfully!',
            timestamp: new Date()
          })
          onSave(data.post || data)
        } else {
          throw new Error(data.error || 'Failed to save blog post')
        }
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to save blog post: ${response.status}`)
      }
    } catch (error) {
      console.error('Save failed:', error)
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save blog post. Please try again.',
        timestamp: new Date()
      })
    }
  }

  const getSEOScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSEOScoreBg = (score) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/30'
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }

  // Content editor functions
  const insertHyperlink = () => {
    if (contentRef) {
      const start = contentRef.selectionStart
      const end = contentRef.selectionEnd
      const selectedText = formData.content.substring(start, end)
      
      // Pre-fill with selected text if available
      setLinkData({ url: '', text: selectedText || '' })
      setShowLinkModal(true)
    } else {
      setLinkData({ url: '', text: '' })
      setShowLinkModal(true)
    }
  }

  const handleLinkSubmit = () => {
    if (linkData.url.trim()) {
      const linkText = linkData.text.trim() || linkData.url
      const hyperlink = `[${linkText}](${linkData.url})`
      
      if (contentRef) {
        const start = contentRef.selectionStart
        const end = contentRef.selectionEnd
        const selectedText = formData.content.substring(start, end)
        
        // If text was selected, use it as link text
        const finalLink = selectedText ? `[${selectedText}](${linkData.url})` : hyperlink
        
        const newContent = formData.content.substring(0, start) + finalLink + formData.content.substring(end)
        handleInputChange('content', newContent)
        
        // Set cursor position after the inserted link
        setTimeout(() => {
          contentRef.focus()
          contentRef.setSelectionRange(start + finalLink.length, start + finalLink.length)
        }, 0)
      } else {
        // Fallback: append to end
        handleInputChange('content', formData.content + '\n' + hyperlink)
      }
    }
    
    setShowLinkModal(false)
    setLinkData({ url: '', text: '' })
  }

  const handleLinkCancel = () => {
    setShowLinkModal(false)
    setLinkData({ url: '', text: '' })
  }

  // Convert markdown to HTML for display
  const markdownToHtml = (markdown) => {
    if (!markdown) return ''
    let html = markdown
    
    // First, preserve chart containers
    const chartPlaceholders = []
    let chartIndex = 0
    html = html.replace(/<div[^>]*class="chart-container"[^>]*>.*?<iframe[^>]+src="([^"]+)"[^>]*>.*?<\/iframe>.*?<\/div>/gis, (match) => {
      const placeholder = `__CHART_${chartIndex}__`
      chartPlaceholders[chartIndex] = match
      chartIndex++
      return placeholder
    })
    
    // Convert bullet lists (- item) to <ul><li>
    const lines = html.split('\n')
    let inList = false
    let htmlLines = []
    
    lines.forEach((line) => {
      const trimmed = line.trim()
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
        if (trimmed) {
          // Only wrap in <p> if it doesn't already contain HTML tags
          if (trimmed.match(/^<[^>]+>/)) {
            htmlLines.push(trimmed)
          } else {
            htmlLines.push(`<div>${trimmed}</div>`)
          }
        } else if (htmlLines.length > 0) {
          // Only add <br> if previous line wasn't empty
          htmlLines.push('<br />')
        }
      }
    })
    if (inList) htmlLines.push('</ul>')
    html = htmlLines.join('')
    
    // Convert bold **text** to <strong>text</strong>
    html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    // Convert italic *text* to <em>text</em> (but not **text**)
    html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
    
    // Convert images ![alt](url) to <img> tags
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;" class="blog-image" />')
    
    // Convert links [text](url) to <a> tags
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="blog-link">$1</a>')
    
    // Restore chart placeholders
    chartPlaceholders.forEach((chart, index) => {
      html = html.replace(`__CHART_${index}__`, chart)
    })
    
    return html
  }

  // Convert HTML back to markdown
  const htmlToMarkdown = (html) => {
    if (!html) return ''
    let markdown = html
    
    // First, preserve chart containers (before other processing)
    const chartPlaceholders = []
    let chartIndex = 0
    markdown = markdown.replace(/<div[^>]*class="chart-container"[^>]*>.*?<iframe[^>]+src="([^"]+)"[^>]*>.*?<\/iframe>.*?<\/div>/gis, (match, src) => {
      const placeholder = `__CHART_${chartIndex}__`
      chartPlaceholders[chartIndex] = `\n<div class="chart-container" style="margin: 20px 0;">\n  <iframe src="${src}" width="100%" height="500" frameborder="0"></iframe>\n</div>\n`
      chartIndex++
      return placeholder
    })
    
    // Convert <ul><li> to bullet lists (preserve list structure)
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      return '\n' + items.trim() + '\n'
    })
    
    // Convert block elements - use single newline for divs, double for paragraphs
    // Remove opening tags first
    markdown = markdown.replace(/<p[^>]*>/gi, '')
    markdown = markdown.replace(/<div[^>]*>/gi, '')
    markdown = markdown.replace(/<h[1-6][^>]*>/gi, '')
    
    // Convert closing tags to newlines
    markdown = markdown.replace(/<\/p>/gi, '\n')
    markdown = markdown.replace(/<\/div>/gi, '\n')
    markdown = markdown.replace(/<\/h[1-6]>/gi, '\n\n')
    
    // Convert <strong> to **
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    // Convert <b> to **
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    
    // Convert <em> to *
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    // Convert <i> to *
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    
    // Convert <img> tags to markdown images
    markdown = markdown.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    
    // Convert <a> tags to markdown links
    markdown = markdown.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // Convert <br /> to single newlines
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
    
    // Remove remaining HTML tags (but preserve text content)
    markdown = markdown.replace(/<[^>]+>/g, '')
    
    // Restore chart placeholders
    chartPlaceholders.forEach((chart, index) => {
      markdown = markdown.replace(`__CHART_${index}__`, chart)
    })
    
    // Decode HTML entities
    const textarea = document.createElement('textarea')
    textarea.innerHTML = markdown
    markdown = textarea.value
    
    // Clean up: collapse multiple consecutive newlines to max 2
    markdown = markdown.replace(/\n{3,}/g, '\n\n')
    // Remove trailing spaces from lines
    markdown = markdown.replace(/[ \t]+$/gm, '')
    // Remove leading/trailing newlines
    markdown = markdown.replace(/^\n+|\n+$/g, '')
    
    return markdown
  }

  const insertBold = () => {
    if (contentRef) {
      document.execCommand('bold', false, null)
      // Update formData with the new content
      const newContent = htmlToMarkdown(contentRef.innerHTML)
      handleInputChange('content', newContent)
    }
  }

  const insertItalic = () => {
    if (contentRef) {
      document.execCommand('italic', false, null)
      // Update formData with the new content
      const newContent = htmlToMarkdown(contentRef.innerHTML)
      handleInputChange('content', newContent)
    }
  }

  const insertBulletList = () => {
    if (contentRef) {
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // Convert selected lines to bullet points
          const lines = selectedText.split('\n').filter(line => line.trim())
          const bulletText = lines.map(line => `- ${line.trim()}`).join('\n')
          
          range.deleteContents()
          const textNode = document.createTextNode(bulletText)
          range.insertNode(textNode)
          
          // Move cursor to end
          range.setStartAfter(textNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          // Insert bullet point at cursor
          const bulletText = '- '
          const textNode = document.createTextNode(bulletText)
          range.insertNode(textNode)
          
          // Move cursor after bullet
          range.setStartAfter(textNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        // Update content
        const newContent = htmlToMarkdown(contentRef.innerHTML)
        handleInputChange('content', newContent)
      }
    }
  }

  const insertImage = () => {
    setImageData({ url: '', alt: '' })
    setShowImageModal(true)
  }

  const handleImageSubmit = () => {
    if (imageData.url.trim()) {
      const altText = imageData.alt.trim() || 'Blog image'
      const imageMarkdown = `![${altText}](${imageData.url})`
      
      if (contentRef) {
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const textNode = document.createTextNode(imageMarkdown)
          range.insertNode(textNode)
          
          // Move cursor after image
          range.setStartAfter(textNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
          
          // Update content
          const newContent = htmlToMarkdown(contentRef.innerHTML)
          handleInputChange('content', newContent)
        }
      }
    }
    
    setShowImageModal(false)
    setImageData({ url: '', alt: '' })
  }

  const handleImageCancel = () => {
    setShowImageModal(false)
    setImageData({ url: '', alt: '' })
  }

  const insertChart = () => {
    setChartData({ url: '', title: '' })
    setShowChartModal(true)
  }

  const handleChartSubmit = () => {
    if (chartData.url.trim()) {
      const title = chartData.title.trim() || 'Chart'
      // Embed chart as iframe
      const chartMarkdown = `\n<div class="chart-container" style="margin: 20px 0;">
  <iframe src="${chartData.url}" width="100%" height="500" frameborder="0" title="${title}"></iframe>
</div>\n`
      
      if (contentRef) {
        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const div = document.createElement('div')
          div.innerHTML = chartMarkdown
          range.insertNode(div)
          
          // Move cursor after chart
          range.setStartAfter(div)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
          
          // Update content
          const newContent = htmlToMarkdown(contentRef.innerHTML)
          handleInputChange('content', newContent)
        }
      }
    }
    
    setShowChartModal(false)
    setChartData({ url: '', title: '' })
  }

  const handleChartCancel = () => {
    setShowChartModal(false)
    setChartData({ url: '', title: '' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className={`text-2xl font-bold ${getTextColor()}`}>
            {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              title="Preview"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-white/10 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* SEO Score */}
              <div className={`${getCardClass()} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold ${getTextColor()}`}>SEO Score</h3>
                  <button
                    onClick={runAISEOAnalysis}
                    disabled={isAnalyzing}
                    className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-white"
                  >
                    {isAnalyzing ? <Wand2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  </button>
                </div>
                <div className={`rounded-lg p-4 border ${getSEOScoreBg(seoScore)}`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getSEOScoreColor(seoScore)}`}>
                      {seoScore}
                    </div>
                    <div className={`text-sm ${getSubtextClass()}`}>SEO Score</div>
                  </div>
                </div>
                {Array.isArray(seoSuggestions) && seoSuggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className={`text-sm font-medium ${getTextColor()} mb-2`}>AI Suggestions</h4>
                    <div className="space-y-2">
                      {seoSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className={`text-xs ${getSubtextClass()}`}>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Post Settings */}
              <div className={`${getCardClass()} p-4`}>
                <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Post Settings</h3>
                <div className="space-y-4">
                  
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="e.g., Investing, Finance, Education"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {Array.isArray(formData.tags) && formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded flex items-center space-x-1"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => handleTagRemove(tag)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add tag and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleTagAdd(e.target.value.trim())
                          e.target.value = ''
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                    />
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className={`${getCardClass()} p-4`}>
                <h3 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Featured Image</h3>
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex-1 px-4 py-2 rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 cursor-pointer transition-colors text-center ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500/10'
                      }`}
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-blue-400">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Upload className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400">Upload Image</span>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Or enter image URL
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) => handleInputChange('featured_image', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {/* Image Preview */}
                  {formData.featured_image && (
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${getTextColor()}`}>
                        Preview
                      </label>
                      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden border border-white/10">
                        <img
                          src={formData.featured_image}
                          alt="Featured"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500" style={{ display: 'none' }}>
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Failed to load image</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleInputChange('featured_image', '')}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove Image</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex space-x-1 p-4">
                {[
                  { id: 'content', label: 'Content', icon: FileText },
                  { id: 'seo', label: 'SEO', icon: Settings }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'hover:bg-white/10 text-white/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="Enter blog post title"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="Brief description of the post"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Content *
                    </label>
                    
                    {/* Content Editor Toolbar */}
                    <div className="flex flex-wrap gap-2 mb-2 p-2 bg-white/5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => insertHyperlink()}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                        title="Insert Hyperlink - Click to add a link to your content"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">Add Link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertBold()}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                        title="Bold Text - Select text and click to make it bold"
                      >
                        <span className="text-sm font-bold">B</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertItalic()}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition-colors"
                        title="Italic Text - Select text and click to make it italic"
                      >
                        <span className="text-sm italic">I</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertBulletList()}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                        title="Bullet List - Select text to convert to list or click to insert bullet point"
                      >
                        <List className="w-4 h-4" />
                        <span className="text-sm">List</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertImage()}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                        title="Insert Image - Add an image to your blog post"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm">Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertChart()}
                        className="flex items-center space-x-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                        title="Insert Chart/Graph - Embed a chart or graph"
                      >
                        <PieChart className="w-4 h-4" />
                        <span className="text-sm">Chart</span>
                      </button>
                    </div>
                    <div className={`text-xs ${getSubtextClass()} mb-2`}>
                      💡 <strong>Tip:</strong> To add a hyperlink, click "Add Link" and enter the URL. You can also select text first to use it as the link text.
                    </div>
                    
                     <div
                       ref={(el) => {
                         setContentRef(el)
                         if (el && contentHtml && el.innerHTML !== contentHtml) {
                           // Set initial content from contentHtml state
                           el.innerHTML = contentHtml
                         }
                       }}
                       contentEditable
                       suppressContentEditableWarning
                       onInput={(e) => {
                         const html = e.target.innerHTML
                         const markdown = htmlToMarkdown(html)
                         // Update both formData and contentHtml
                         setContentHtml(html)
                         if (markdown !== formData.content) {
                           handleInputChange('content', markdown)
                         }
                       }}
                       onKeyDown={(e) => {
                         // Handle Ctrl+B or Cmd+B for bold
                         if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                           e.preventDefault()
                           insertBold()
                         }
                         // Handle Ctrl+I or Cmd+I for italic
                         if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                           e.preventDefault()
                           insertItalic()
                         }
                       }}
                       className={`w-full min-h-[400px] px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()} whitespace-pre-wrap`}
                       style={{
                         outline: 'none',
                         wordWrap: 'break-word',
                         overflowWrap: 'break-word'
                       }}
                       data-placeholder="Write your blog post content here... Use the toolbar above to add links and formatting."
                     />
                     <style>{`
                       [contenteditable][data-placeholder]:empty:before {
                         content: attr(data-placeholder);
                         color: #9ca3af;
                         pointer-events: none;
                       }
                     `}</style>
                    <div className={`text-xs ${getSubtextClass()} mt-2`}>
                      {formData.content.split(' ').length} words • ~{Math.max(1, Math.floor(formData.content.split(' ').length / 200))} min read
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={formData.seo_title}
                      onChange={(e) => handleInputChange('seo_title', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="SEO optimized title (30-60 characters)"
                    />
                    <div className={`text-xs ${getSubtextClass()} mt-1`}>
                      {formData.seo_title.length}/60 characters
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Meta Description
                    </label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => handleInputChange('seo_description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="Meta description (120-160 characters)"
                    />
                    <div className={`text-xs ${getSubtextClass()} mt-1`}>
                      {formData.seo_description.length}/160 characters
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Focus Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.seo_keywords}
                      onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={formData.canonical_url}
                      onChange={(e) => handleInputChange('canonical_url', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                      placeholder="https://kamioi.com/blog/post-url"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Meta Robots
                    </label>
                    <select
                      value={formData.meta_robots}
                      onChange={(e) => handleInputChange('meta_robots', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                    >
                      <option value="index,follow">Index, Follow</option>
                      <option value="noindex,follow">No Index, Follow</option>
                      <option value="index,nofollow">Index, No Follow</option>
                      <option value="noindex,nofollow">No Index, No Follow</option>
                    </select>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="flex justify-between items-center">
            <div className={`text-sm ${getSubtextClass()}`}>
              {formData.content.split(' ').length} words • ~{Math.max(1, Math.floor(formData.content.split(' ').length / 200))} min read
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update Post' : 'Create Post'}</span>
              </button>
            </div>
          </div>
         </div>
       </div>

       {/* Glass Modal for Image Input */}
       {showImageModal && (
         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
             <div className="space-y-4">
               <div className="text-center">
                 <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                   Insert Image
                 </h3>
                 <p className={`text-sm ${getSubtextClass()}`}>
                   Enter the image URL and optional alt text
                 </p>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                     Image URL *
                   </label>
                   <input
                     type="url"
                     value={imageData.url}
                     onChange={(e) => setImageData(prev => ({ ...prev, url: e.target.value }))}
                     className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                     placeholder="https://example.com/image.jpg"
                   />
                 </div>
                 <div>
                   <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                     Alt Text
                   </label>
                   <input
                     type="text"
                     value={imageData.alt}
                     onChange={(e) => setImageData(prev => ({ ...prev, alt: e.target.value }))}
                     className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                     placeholder="Description of the image"
                   />
                 </div>
               </div>
               
               <div className="flex space-x-3 pt-4">
                 <button
                   onClick={handleImageCancel}
                   className="flex-1 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleImageSubmit}
                   className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                 >
                   Insert Image
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Glass Modal for Chart Input */}
       {showChartModal && (
         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
             <div className="space-y-4">
               <div className="text-center">
                 <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                   Insert Chart/Graph
                 </h3>
                 <p className={`text-sm ${getSubtextClass()}`}>
                   Enter the chart URL (iframe embed URL)
                 </p>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                     Chart URL *
                   </label>
                   <input
                     type="url"
                     value={chartData.url}
                     onChange={(e) => setChartData(prev => ({ ...prev, url: e.target.value }))}
                     className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                     placeholder="https://example.com/chart-embed"
                   />
                 </div>
                 <div>
                   <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                     Chart Title
                   </label>
                   <input
                     type="text"
                     value={chartData.title}
                     onChange={(e) => setChartData(prev => ({ ...prev, title: e.target.value }))}
                     className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                     placeholder="Chart title"
                   />
                 </div>
               </div>
               
               <div className="flex space-x-3 pt-4">
                 <button
                   onClick={handleChartCancel}
                   className="flex-1 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleChartSubmit}
                   className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                 >
                   Insert Chart
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Glass Modal for Link Input */}
       {showLinkModal && (
         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
             <div className="space-y-4">
               <div className="text-center">
                 <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                   Add Hyperlink
                 </h3>
                 <p className={`text-sm ${getSubtextClass()}`}>
                   Enter the URL and optional display text for your link
                 </p>
               </div>
               
               <div className="space-y-3">
                 <div>
                   <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                     URL *
                   </label>
                   <input
                     type="url"
                     value={linkData.url}
                     onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                     className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                     placeholder="https://example.com"
                     autoFocus
                   />
                 </div>
                 
                 <div>
                   <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                     Display Text (optional)
                   </label>
                   <input
                     type="text"
                     value={linkData.text}
                     onChange={(e) => setLinkData(prev => ({ ...prev, text: e.target.value }))}
                     className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClass()}`}
                     placeholder="Link text to display"
                   />
                 </div>
               </div>
               
               <div className="flex space-x-3 pt-4">
                 <button
                   onClick={handleLinkCancel}
                   className="flex-1 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white text-center"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleLinkSubmit}
                   className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center"
                 >
                   Add Link
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }
 
 export default BlogEditor
