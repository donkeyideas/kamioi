// ContentManagement Component - Updated to fix export issue
import React, { useState, useEffect, useRef } from 'react'
import { Edit, Save, X, Plus, Trash2, Eye, Calendar, User, Tag, Image, FileText, Globe, Settings, Upload, Search, Filter, ChevronDown, ChevronUp, ExternalLink, BarChart3, Brain, Target, TrendingUp, AlertTriangle, Zap, Shield, Power, Rocket, Star, GraduationCap, ArrowRight, Calculator, DollarSign } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import GoogleAnalytics from './GoogleAnalytics'
import BlogEditor from './BlogEditor'
import GlassModal from '../common/GlassModal'
import prefetchRegistry from '../../services/prefetchRegistry'
import prefetchService from '../../services/prefetchService'
import ImageUpload from './ImageUpload'
import LayoutSelector, { LAYOUT_OPTIONS } from './LayoutSelector'

const ContentManagement = ({ user }) => {
  // Debug: Verify component is loading with new code
  console.log('🟢 ContentManagement component loaded - NEW CODE VERSION')
  
  const { isLightMode, isDarkMode, isCloudMode } = useTheme()
  const [activeTab, setActiveTab] = useState('pages')
  const [pageTab, setPageTab] = useState('homepage')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedContent, setSelectedContent] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [contentToDelete, setContentToDelete] = useState(null)
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
  const modalContentRef = useRef(null)

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200' : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'

  // Real content data from API
  const [pages, setPages] = useState([])
  const [blogs, setBlogs] = useState([])
  const [frontendContent, setFrontendContent] = useState([])
  const [currentFrontendContent, setCurrentFrontendContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingSection, setEditingSection] = useState(null)

  const [seoSettings, setSeoSettings] = useState({
    siteTitle: 'Kamioi - Smart Investment Platform',
    siteDescription: 'Invest your spare change automatically with AI-powered insights. Build wealth effortlessly with round-up investments.',
    siteKeywords: 'investing, round-ups, AI, wealth building, family investing',
    ogImage: '',
    twitterHandle: '@kamioi',
    googleAnalytics: '353505238',
    facebookPixel: ''
  })

  const [newContent, setNewContent] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    category: '',
    tags: '',
    excerpt: '',
    featuredImage: ''
  })

  // Scroll modal to top when it opens
  useEffect(() => {
    if (editingSection && modalContentRef.current) {
      setTimeout(() => {
        if (modalContentRef.current) {
          modalContentRef.current.scrollTop = 0
        }
      }, 50)
    }
  }, [editingSection])

  useEffect(() => {
    const fetchFn = async () => {
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const headers = { 'Authorization': `Bearer ${adminToken}` }
      
      try {
        const [pagesRes, blogsRes, frontendRes, currentContentRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/admin/content/pages`, { headers }),
          fetch(`${apiBaseUrl}/api/admin/content/blogs`, { headers }),
          fetch(`${apiBaseUrl}/api/admin/content/frontend`, { headers }),
          fetch(`${apiBaseUrl}/api/admin/content/frontend/current`, { headers })
        ])
        
        const [pagesData, blogsData, frontendData, currentContentData] = await Promise.all([
          pagesRes.ok ? pagesRes.json() : null,
          blogsRes.ok ? blogsRes.json() : null,
          frontendRes.ok ? frontendRes.json() : null,
          currentContentRes.ok ? currentContentRes.json() : null
        ])
        
        return {
          pages: pagesData?.pages || pagesData?.data || [],
          blogs: blogsData?.data?.posts || blogsData?.posts || blogsData?.blogs || blogsData?.data || [],
          frontendContent: frontendData?.content || frontendData?.data || [],
          currentFrontendContent: currentContentData?.content || currentContentData?.data || {}
        }
      } catch (e) {
        return null
      }
    }
    
    prefetchRegistry.register('content', fetchFn)
  }, [])

  // Fetch content data on component mount
  useEffect(() => {
    const cached = prefetchService.getCached('content')
    if (cached) {
      console.log('🚀 ContentManagement - Using cached data, showing immediately')
      if (cached.pages) setPages(cached.pages)
      if (cached.blogs) setBlogs(cached.blogs)
      if (cached.frontendContent) setFrontendContent(cached.frontendContent)
      if (cached.currentFrontendContent) setCurrentFrontendContent(cached.currentFrontendContent)
      setLoading(false)
      
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'content' }
      }))
      
      setTimeout(() => {
        const abortController = new AbortController()
        fetchContent(abortController.signal)
        return () => abortController.abort()
      }, 100)
      return
    }
    
    const abortController = new AbortController()
    fetchContent(abortController.signal)
    
    return () => {
      abortController.abort()
    }
  }, [])

  const fetchContent = async (signal) => {
    try {
      setLoading(true)
      setError(null)
      
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // Fetch from public endpoint to get current frontend content (this endpoint exists)
      const currentContentResponse = await fetch(`${apiBaseUrl}/api/frontend-content`, { signal: signal }).catch(() => null)
      
      // Try to fetch from admin endpoints (may not exist yet)
      const [pagesResponse, blogsResponse, frontendResponse] = await Promise.all([
        fetch(`${apiBaseUrl}/api/admin/content/pages`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          signal: signal
        }).catch(() => ({ ok: false })),
        fetch(`${apiBaseUrl}/api/admin/blog/posts?limit=1000`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          signal: signal
        }).catch(() => ({ ok: false })),
        fetch(`${apiBaseUrl}/api/admin/frontend-content`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
          signal: signal
        }).catch(() => ({ ok: false }))
      ])
      
      if (pagesResponse?.ok) {
        const pagesResult = await pagesResponse.json()
        if (pagesResult.success) {
          setPages(pagesResult.data.pages || [])
        }
      }
      
      if (blogsResponse?.ok) {
        const blogsResult = await blogsResponse.json()
        if (blogsResult.success) {
          const blogPosts = blogsResult.data?.posts || blogsResult.posts || []
          setBlogs(Array.isArray(blogPosts) ? blogPosts : [])
        }
      }
      
      // Try to get sections from admin endpoint (may not exist)
      // Build currentFrontendContent from admin endpoint (includes inactive)
      // This gives us the full picture for the admin dashboard
      if (frontendResponse?.ok) {
        const frontendResult = await frontendResponse.json()
        if (frontendResult.success) {
          const sections = frontendResult.data.sections || frontendResult.data || []
          console.log('📋 ContentManagement - Loaded frontend sections from admin API:', sections.length)
          setFrontendContent(Array.isArray(sections) ? sections : [])
          
          // Build content map for currentFrontendContent
          const contentMap = {}
          sections.forEach(section => {
            if (section.section_key && section.content_data !== undefined) {
              let parsedContent = section.content_data
              if (typeof parsedContent === 'string') {
                try {
                  parsedContent = JSON.parse(parsedContent)
                } catch (e) {
                  // Keep as string if not valid JSON
                }
              }
              contentMap[section.section_key] = parsedContent
            }
          })
          setCurrentFrontendContent(contentMap)
          console.log('📋 ContentManagement - Loaded ALL frontend content (including inactive):', Object.keys(contentMap))
        }
      } else {
        // Admin endpoint doesn't exist, set empty array
        console.log('📋 ContentManagement - Admin frontend-content endpoint not available (404)')
        setFrontendContent([])
      }
      
      // Also fetch from public endpoint to see what's currently active (for reference)
      if (currentContentResponse?.ok) {
        const currentContentResult = await currentContentResponse.json()
        if (currentContentResult.success && currentContentResult.data) {
          const activeContent = currentContentResult.data
          const contentKeys = Object.keys(activeContent).filter(key => {
            // Exclude SEO/metadata keys
            return !['homepage_seo'].includes(key) && activeContent[key] !== null && activeContent[key] !== undefined
          })
          console.log('📋 ContentManagement - Active frontend content keys (public API):', contentKeys)
        }
      } else {
        console.log('📋 ContentManagement - Failed to fetch frontend content from public API')
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching content:', error)
        setError('Failed to load content data')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
        window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
          detail: { pageId: 'content' }
        }))
      }
    }
  }

  // Load content from API when editing section changes - MUST be at top level, before early returns
  useEffect(() => {
    if (activeTab === 'frontend' && editingSection && currentFrontendContent) {
      const sectionKey = editingSection.sectionKey || editingSection.section_key
      if (sectionKey) {
        let apiContent = null
        if (pageTab === 'homepage') {
          apiContent = currentFrontendContent[sectionKey]
        } else if (pageTab === 'features') {
          const pageData = currentFrontendContent.features_page || {}
          const mappedKey = sectionKey.replace('features_page_', '')
          apiContent = pageData[mappedKey]
        } else if (pageTab === 'how-it-works') {
          const pageData = currentFrontendContent.how_it_works_page || {}
          const mappedKey = sectionKey.replace('how_it_works_page_', '')
          apiContent = pageData[mappedKey]
        } else if (pageTab === 'learn') {
          const pageData = currentFrontendContent.learn_page || {}
          const mappedKey = sectionKey.replace('learn_page_', '')
          apiContent = pageData[mappedKey]
        } else if (pageTab === 'pricing') {
          const pageData = currentFrontendContent.pricing_page || {}
          const mappedKey = sectionKey.replace('pricing_page_', '')
          apiContent = pageData[mappedKey]
        } else {
          const pageKey = `${pageTab}_page`
          const pageData = currentFrontendContent[pageKey] || {}
          apiContent = pageData[sectionKey]
        }
        
        // Always update with API content if it exists
        // But preserve isActive status from editingSection (don't overwrite it)
        if (apiContent) {
          console.log('📝 Auto-loading content from API for:', sectionKey, apiContent)
          setEditingSection(prev => ({
            ...prev,
            content: apiContent
            // Keep isActive from prev - don't overwrite it
          }))
        }
      }
    }
  }, [editingSection?.sectionKey, currentFrontendContent, pageTab, activeTab])

  // Loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading content data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">Error Loading Content</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <button 
            onClick={() => fetchContent(new AbortController().signal)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const handleSaveContent = async (event) => {
    let originalText = ''
    try {
      if (event && event.target) {
        const submitButton = event.target
        originalText = submitButton.textContent
        submitButton.textContent = 'Saving...'
        submitButton.disabled = true
      }
      
      const contentData = selectedContent || newContent
      const finalContentData = {
        ...contentData,
        type: activeTab === 'pages' ? 'page' : 'blog',
        updatedAt: new Date().toISOString()
      }
      
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/admin/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(finalContentData)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          if (activeTab === 'pages') {
            const updatedPages = selectedContent 
              ? pages.map(p => p.id === selectedContent.id ? { ...selectedContent, lastModified: new Date().toISOString().split('T')[0] } : p)
              : [...pages, { ...result.data, id: result.data.id || Date.now(), author: '', views: 0, lastModified: new Date().toISOString().split('T')[0] }]
            setPages(updatedPages)
          } else {
            const updatedBlogs = selectedContent 
              ? blogs.map(b => b.id === selectedContent.id ? { ...selectedContent, publishDate: selectedContent.status === 'published' ? new Date().toISOString().split('T')[0] : null } : b)
              : [...blogs, { ...result.data, id: result.data.id || Date.now(), author: '', views: 0, publishDate: result.data.status === 'published' ? new Date().toISOString().split('T')[0] : null }]
            setBlogs(updatedBlogs)
          }
          
          setIsEditing(false)
          setSelectedContent(null)
          setNewContent({ title: '', slug: '', content: '', status: 'draft', category: '', tags: '', excerpt: '', featuredImage: '' })
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Content saved successfully!',
            onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
          })
        } else {
          throw new Error(result.error || 'Failed to save content')
        }
      } else {
        throw new Error('Network error')
      }
      
    } catch (error) {
      console.error('Save content failed:', error)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to save content. Please try again.',
        onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
      })
    } finally {
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleDeleteContent = (id) => {
    setContentToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDeleteContent = async () => {
    if (!contentToDelete) return
    
    try {
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      const isFrontendSection = contentToDelete && (typeof contentToDelete === 'object' && (contentToDelete.sectionKey || contentToDelete.sectionType))
      
      if (isFrontendSection) {
        await handleDeleteFrontendSection(contentToDelete.id)
        return
      }
      
      let deleteUrl
      if (activeTab === 'pages') {
        deleteUrl = `${apiBaseUrl}/api/admin/content/${contentToDelete}`
      } else {
        deleteUrl = `${apiBaseUrl}/api/admin/blog/posts/${contentToDelete}`
      }
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          if (activeTab === 'pages') {
            setPages(pages.filter(p => p.id !== contentToDelete))
          } else {
            setBlogs(blogs.filter(b => b.id !== contentToDelete))
          }
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Content deleted successfully!',
            onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
          })
        } else {
          throw new Error(result.error || 'Failed to delete content')
        }
      } else {
        throw new Error('Network error')
      }
      
    } catch (error) {
      console.error('Delete content failed:', error)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete content. Please try again.',
        onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
      })
    } finally {
      setShowDeleteModal(false)
      setContentToDelete(null)
    }
  }

  const cancelDeleteContent = () => {
    setShowDeleteModal(false)
    setContentToDelete(null)
  }

  const handleToggleSection = async (sectionId, isActive) => {
    try {
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      const response = await fetch(`${apiBaseUrl}/api/admin/content/frontend/${sectionId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setFrontendContent(prev => prev.map(section =>
            section.id === sectionId ? { ...section, isActive } : section
          ))
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: `Section ${isActive ? 'activated' : 'deactivated'} successfully`,
            onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
          })
        }
      } else {
        throw new Error('Failed to update section')
      }
    } catch (error) {
      console.error('Error toggling section:', error)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update section status',
        onConfirm: () => setModal({ isOpen: false, type: 'error', title: '', message: '', onConfirm: null })
      })
    }
  }

  const handleDeleteFrontendSection = async (sectionId) => {
    try {
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      const response = await fetch(`${apiBaseUrl}/api/admin/content/frontend/${sectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setFrontendContent(prev => prev.filter(section => section.id !== sectionId))
          setShowDeleteModal(false)
          setContentToDelete(null)
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Section deleted successfully',
            onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
          })
        } else {
          throw new Error(result.error || 'Failed to delete section')
        }
      } else {
        throw new Error('Network error')
      }
    } catch (error) {
      console.error('Error deleting section:', error)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete section',
        onConfirm: () => setModal({ isOpen: false, type: 'error', title: '', message: '', onConfirm: null })
      })
    }
  }

  const handleSaveFrontendSection = async (sectionData) => {
    try {
      const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      
      // Use the correct backend endpoint - always POST (backend handles create/update)
      const url = `${apiBaseUrl}/api/admin/frontend-content`
      
      // Map frontend data format to backend format
      const sectionKey = sectionData.sectionKey || sectionData.section_key
      if (!sectionKey) {
        throw new Error('Section key is required')
      }
      
      const sectionName = sectionData.sectionName || sectionData.section_name || sectionData.title || sectionKey || 'Untitled Section'
      const contentType = sectionData.sectionType || sectionData.content_type || sectionData.type || 'object'
      
      // Get content from sectionData - it should have been updated by handleFieldChange
      // Layout data (layout_type, images, layout_config) is stored inside content
      // Content can be an object OR an array (e.g., FAQs are arrays)
      let contentData = sectionData.content !== undefined ? sectionData.content : (sectionData.content_data !== undefined ? sectionData.content_data : null)
      
      console.log('[ContentManagement] Extracting contentData from sectionData:', {
        hasContent: sectionData.content !== undefined,
        hasContentData: sectionData.content_data !== undefined,
        contentType: typeof sectionData.content,
        contentIsArray: Array.isArray(sectionData.content),
        contentLength: Array.isArray(sectionData.content) ? sectionData.content.length : (sectionData.content ? Object.keys(sectionData.content).length : 0)
      })
      
      // Handle different content types
      if (contentData === undefined || contentData === null) {
        // If no content, use empty object for object types, empty array for array types
        contentData = contentType === 'array' ? [] : {}
      } else if (typeof contentData === 'string') {
        // If content is a string, try to parse it
        try {
          contentData = JSON.parse(contentData)
        } catch (e) {
          // If it's not valid JSON, keep as string or convert based on content type
          contentData = contentType === 'array' ? [] : {}
        }
      } else if (Array.isArray(contentData)) {
        // Arrays are valid (e.g., FAQs, stats, features)
        // Keep the array as-is
      } else if (typeof contentData === 'object') {
        // Objects are valid (e.g., hero sections, SEO)
        // Keep the object as-is
      } else {
        // For any other type, convert based on content type
        contentData = contentType === 'array' ? [] : {}
      }
      
      // Layout data should already be in contentData from handleFieldChange
      // But also check top-level sectionData as fallback (for backwards compatibility)
      if (!contentData.layout_type && sectionData.layout_type) {
        contentData = {
          ...contentData,
          layout_type: sectionData.layout_type,
          images: sectionData.images || contentData.images || [],
          layout_config: sectionData.layout_config || contentData.layout_config || {}
        }
      }
      
      const isActive = sectionData.isActive !== undefined ? sectionData.isActive : (sectionData.is_active !== undefined ? sectionData.is_active : true)
      
      const finalSectionData = {
        section_key: sectionKey,
        section_name: sectionName,
        content_type: contentType,
        content_data: contentData,
        is_active: isActive
      }
      
      // Debug: Log what's being saved
      console.log('[ContentManagement] Full contentData being saved:', JSON.stringify(contentData, null, 2))
      console.log('[ContentManagement] contentData type:', typeof contentData, Array.isArray(contentData) ? '(array)' : '(object)')
      console.log('[ContentManagement] contentData length/keys:', Array.isArray(contentData) ? contentData.length : Object.keys(contentData).length)
      
      // For arrays, layout data would be stored differently - check if it's in sectionData directly
      if (Array.isArray(contentData)) {
        // Arrays can't have layout_type directly, it would need to be stored separately
        // But for now, arrays don't support layouts
        console.log('[ContentManagement] Saving array content (no layout support for arrays)')
      } else if (contentData && typeof contentData === 'object') {
        if (contentData.layout_type) {
          console.log('[ContentManagement] Saving section with layout:', {
            sectionKey,
            layout_type: contentData.layout_type,
            images_count: contentData.images?.length || 0,
            has_layout_config: !!contentData.layout_config
          })
        } else {
          console.log('[ContentManagement] Saving object content (no layout)')
        }
      }
      
      console.log('[ContentManagement] Sending request to:', url)
      console.log('[ContentManagement] Request payload:', JSON.stringify(finalSectionData, null, 2))
      
      const response = await fetch(url, {
        method: 'POST', // Backend endpoint handles both create and update
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(finalSectionData)
      })
      
      console.log('[ContentManagement] Response status:', response.status, response.statusText)

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Reload frontend content to get updated data
          const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
          const headers = { 'Authorization': `Bearer ${adminToken}` }
          
          // Reload frontend content from ADMIN endpoint (includes inactive content)
          try {
            // Use admin endpoint to get ALL content (including inactive)
            const adminContentRes = await fetch(`${apiBaseUrl}/api/admin/frontend-content`, { headers })
            if (adminContentRes.ok) {
              const adminContentData = await adminContentRes.json()
              console.log('[ContentManagement] Reloaded admin frontend content:', adminContentData)
              
              // Admin endpoint returns array of sections, convert to object format
              // Check if data is array or object with sections property
              let sections = []
              if (adminContentData && adminContentData.success) {
                if (Array.isArray(adminContentData.data)) {
                  sections = adminContentData.data
                } else if (adminContentData.data && Array.isArray(adminContentData.data.sections)) {
                  sections = adminContentData.data.sections
                } else if (adminContentData.data && typeof adminContentData.data === 'object') {
                  // If data is an object, try to extract sections
                  sections = Object.values(adminContentData.data)
                }
              }
              
              if (sections.length > 0) {
                const contentMap = {}
                sections.forEach(section => {
                  if (section.section_key && section.content_data !== undefined) {
                    // Parse content_data if it's a string
                    let parsedContent = section.content_data
                    if (typeof parsedContent === 'string') {
                      try {
                        parsedContent = JSON.parse(parsedContent)
                      } catch (e) {
                        // Keep as string if not valid JSON
                        console.warn('[ContentManagement] Could not parse content_data for', section.section_key, e)
                      }
                    }
                    contentMap[section.section_key] = parsedContent
                  }
                })
                setCurrentFrontendContent(contentMap)
                setFrontendContent(sections) // Update frontendContent with full section objects (includes is_active)
                console.log('[ContentManagement] Updated currentFrontendContent with:', Object.keys(contentMap))
                
                // If we're currently editing a section, update its isActive status from the reloaded data
                if (editingSection && editingSection.sectionKey) {
                  const updatedSection = sections.find(s => s.section_key === editingSection.sectionKey)
                  if (updatedSection) {
                    const isActive = updatedSection.is_active !== undefined ? updatedSection.is_active : true
                    setEditingSection(prev => ({
                      ...prev,
                      isActive: isActive,
                      content: contentMap[editingSection.sectionKey] || prev.content
                    }))
                    console.log('[ContentManagement] Updated editingSection.isActive to:', isActive)
                  }
                }
              } else {
                console.warn('[ContentManagement] No sections found in admin response:', adminContentData)
              }
            }
            
            // Also reload public endpoint to see what's active
            const publicContentRes = await fetch(`${apiBaseUrl}/api/frontend-content`, { headers })
            if (publicContentRes.ok) {
              const publicContentData = await publicContentRes.json()
              console.log('[ContentManagement] Active frontend content (public API):', Object.keys(publicContentData.data || {}))
            }
          } catch (e) {
            console.warn('Could not reload frontend content:', e)
          }
          
          setIsEditing(false)
          setEditingSection(null)
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: `Section saved successfully`,
            onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
          })
        } else {
          throw new Error(result.error || 'Failed to save section')
        }
      } else {
        const errorText = await response.text()
        let errorMessage = 'Network error'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('[ContentManagement] Error saving section:', error)
      console.error('[ContentManagement] Error stack:', error.stack)
      console.error('[ContentManagement] Section data that failed to save:', sectionData)
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: `Failed to save section: ${error.message || 'Unknown error'}. Check console for details.`,
        onConfirm: () => setModal({ isOpen: false, type: 'error', title: '', message: '', onConfirm: null })
      })
    }
  }

  const renderPagesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-xl font-semibold ${getTextColor()}`}>Website Pages</h3>
        <button 
          onClick={() => {
            setSelectedContent(null)
            setIsEditing(true)
          }}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Page</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left pb-3 text-gray-400 font-medium">Title</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Slug</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Status</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Last Modified</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Views</th>
              <th className="text-right pb-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages && Array.isArray(pages) && pages.map(page => (
              <tr key={page.id} className="border-b border-white/5 last:border-b-0">
                <td className="py-3 pr-3">
                  <div>
                    <p className={`${getTextColor()} font-medium`}>{page.title}</p>
                    <p className={`${getSubtextClass()} text-sm`}>by {page.author}</p>
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-300">{page.slug}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    page.status === 'published' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {page.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-300">{page.lastModified}</td>
                <td className="py-3 px-3 text-gray-300">{page.views?.toLocaleString() || '0'}</td>
                <td className="py-3 pl-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => setShowPreview(true)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedContent(page)
                        setIsEditing(true)
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContent(page.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!pages || !Array.isArray(pages) || pages.length === 0) && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No pages found. Create your first page to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderBlogsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className={`text-xl font-semibold ${getTextColor()}`}>Blog Posts</h3>
        <button 
          onClick={() => {
            setSelectedContent(null)
            setIsEditing(true)
          }}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left pb-3 text-gray-400 font-medium">Title</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Category</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Status</th>
              <th className="text-left pb-3 text-gray-400 font-medium">SEO Score</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Views</th>
              <th className="text-left pb-3 text-gray-400 font-medium">Published</th>
              <th className="text-right pb-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs && Array.isArray(blogs) && blogs.map(blog => (
              <tr key={blog.id} className="border-b border-white/5 last:border-b-0">
                <td className="py-3 pr-3">
                  <div>
                    <p className={`${getTextColor()} font-medium`}>{blog.title}</p>
                    <p className={`${getSubtextClass()} text-sm`}>{blog.excerpt}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {blog.tags && Array.isArray(blog.tags) && blog.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-300">{blog.category}</td>
                <td className="py-3 px-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    blog.status === 'published' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {blog.status}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      blog.ai_seo_score >= 80 ? 'bg-green-500/20 text-green-400' :
                      blog.ai_seo_score >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {blog.ai_seo_score || 0}
                    </div>
                    <Brain className="w-4 h-4 text-gray-400" />
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-300">{blog.views?.toLocaleString() || '0'}</td>
                <td className="py-3 px-3 text-gray-300">{blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Draft'}</td>
                <td className="py-3 pl-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => {
                        window.open(`/blog/${blog.slug}`, '_blank')
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="View Post"
                    >
                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedContent(blog)
                        setIsEditing(true)
                      }}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-blue-400" />
                    </button>
                    <button 
                      onClick={() => handleDeleteContent(blog.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!blogs || !Array.isArray(blogs) || blogs.length === 0) && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-400">
                  No blog posts found. Create your first post to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Homepage sections configuration
  const homepageSections = [
    { 
      key: 'homepage_seo', 
      name: 'Homepage SEO', 
      description: 'Meta title, description, and H1 headline for SEO',
      icon: Globe,
      type: 'object'
    },
    { 
      key: 'hero_section_2', 
      name: 'Hero Section', 
      description: 'Main headline, subheadline, CTA buttons, key benefits, and trust indicators',
      icon: Rocket,
      type: 'object'
    },
    { 
      key: 'stats', 
      name: 'Stats Section', 
      description: 'Animated statistics (users, invested amount, rating, brands)',
      icon: BarChart3,
      type: 'array'
    },
    { 
      key: 'how_it_works', 
      name: 'How It Works', 
      description: '3-step process explanation (Connect Once, Live Normally, Own Automatically)',
      icon: Zap,
      type: 'array'
    },
    { 
      key: 'educational_content', 
      name: 'Educational Content', 
      description: 'Featured topics and learning resources with modal content',
      icon: GraduationCap,
      type: 'object'
    },
    { 
      key: 'features', 
      name: 'Features Section', 
      description: '6 key features (Zero Effort, AI-Powered, Own What You Support, etc.)',
      icon: Star,
      type: 'array'
    },
    { 
      key: 'testimonials', 
      name: 'Testimonials', 
      description: 'User testimonials with ratings and avatars',
      icon: User,
      type: 'array'
    },
    { 
      key: 'faqs', 
      name: 'FAQs', 
      description: 'Frequently asked questions with expandable answers',
      icon: FileText,
      type: 'array'
    }
  ]

  // Features page sections configuration
  const featuresPageSections = [
    { 
      key: 'features_page_seo', 
      name: 'Features Page SEO', 
      description: 'Meta title, description, and H1 headline for SEO',
      icon: Globe,
      type: 'object'
    },
    { 
      key: 'features_page_hero', 
      name: 'Hero Section', 
      description: 'Main headline and subheading for the Features page',
      icon: Rocket,
      type: 'object'
    },
    { 
      key: 'features_page_features', 
      name: 'Features List', 
      description: 'Detailed feature cards with descriptions, benefits, and examples',
      icon: Star,
      type: 'array'
    },
    { 
      key: 'features_page_faqs', 
      name: 'FAQs', 
      description: 'Frequently asked questions about features',
      icon: FileText,
      type: 'array'
    }
  ]

  // How It Works page sections configuration
  const howItWorksPageSections = [
    { 
      key: 'how_it_works_page_seo', 
      name: 'How It Works Page SEO', 
      description: 'Meta title, description, and H1 headline for SEO',
      icon: Globe,
      type: 'object'
    },
    { 
      key: 'how_it_works_page_hero', 
      name: 'Hero Section', 
      description: 'Main headline, subheading, and quick stats',
      icon: Rocket,
      type: 'object'
    },
    { 
      key: 'how_it_works_page_steps', 
      name: 'Steps Section', 
      description: 'The 3-step process (Connect, Live, Own)',
      icon: Zap,
      type: 'array'
    },
    { 
      key: 'how_it_works_page_faqs', 
      name: 'FAQs', 
      description: 'Frequently asked questions about how it works',
      icon: FileText,
      type: 'array'
    }
  ]

  // Learn page sections configuration
  const learnPageSections = [
    { 
      key: 'learn_page_seo', 
      name: 'Learn Page SEO', 
      description: 'Meta title, description, and H1 headline for SEO',
      icon: Globe,
      type: 'object'
    },
    { 
      key: 'learn_page_hero', 
      name: 'Hero Section', 
      description: 'Main headline and subheading for the Learn page',
      icon: Rocket,
      type: 'object'
    },
    { 
      key: 'learn_page_beginner_path', 
      name: 'Beginner Path', 
      description: 'Step-by-step learning path for beginners',
      icon: GraduationCap,
      type: 'array'
    },
    { 
      key: 'learn_page_strategies', 
      name: 'Investment Strategies', 
      description: 'Popular investing strategies',
      icon: Target,
      type: 'array'
    },
    { 
      key: 'learn_page_investment_types', 
      name: 'Investment Types', 
      description: 'Different types of investments',
      icon: BarChart3,
      type: 'array'
    },
    { 
      key: 'learn_page_calculators', 
      name: 'Calculators', 
      description: 'Investment calculators',
      icon: Calculator,
      type: 'array'
    },
    { 
      key: 'learn_page_categories', 
      name: 'Topic Categories', 
      description: 'Content categories for browsing',
      icon: Tag,
      type: 'array'
    },
    { 
      key: 'learn_page_courses', 
      name: 'Courses', 
      description: 'Structured learning courses',
      icon: GraduationCap,
      type: 'array'
    },
    { 
      key: 'learn_page_faqs', 
      name: 'FAQs', 
      description: 'Frequently asked questions about learning',
      icon: FileText,
      type: 'array'
    }
  ]

  // Pricing page sections configuration
  const pricingPageSections = [
    { 
      key: 'pricing_page_seo', 
      name: 'Pricing Page SEO', 
      description: 'Meta title, description, and H1 headline for SEO',
      icon: Globe,
      type: 'object'
    },
    { 
      key: 'pricing_page_hero', 
      name: 'Hero Section', 
      description: 'Main headline, subheading, and trust badges',
      icon: Rocket,
      type: 'object'
    },
    { 
      key: 'pricing_page_plans', 
      name: 'Pricing Plans', 
      description: 'Individual, Family, and Business plans',
      icon: DollarSign,
      type: 'array'
    },
    { 
      key: 'pricing_page_comparison', 
      name: 'Comparison Table', 
      description: 'Feature comparison across plans',
      icon: BarChart3,
      type: 'array'
    },
    { 
      key: 'pricing_page_faqs', 
      name: 'FAQs', 
      description: 'Frequently asked questions about pricing',
      icon: FileText,
      type: 'array'
    }
  ]

  // Default content that homepage uses when API has no content
  const getDefaultContent = (sectionKey) => {
    const defaults = {
      stats: [
        { number: 10000, suffix: "+", label: "Active Investors", icon: "Users" },
        { number: 500000, prefix: "$", suffix: "+", label: "Automatically Invested", icon: "TrendingUp" },
        { number: 4.9, suffix: "/5", label: "Average Rating", icon: "Star" },
        { number: 50, suffix: "+", label: "Top Brands Available", icon: "ShoppingBag" }
      ],
      features: [
        { icon: "Zap", title: "Zero Effort Required", description: "True passive investing — Unlike traditional platforms that require constant attention, Kamioi works entirely in the background. Our AI handles purchase tracking, stock selection, and portfolio balancing automatically." },
        { icon: "Brain", title: "AI-Powered Intelligence", description: "Institutional-grade technology for everyone — Our proprietary AI processes millions of transactions daily, identifying optimal investment opportunities based on your spending patterns. Get sophisticated investing without the complexity." },
        { icon: "ShoppingBag", title: "Own What You Support", description: "Invest in brands you already love — Why let your spending stop at the transaction? Every dollar you spend with major brands can become an investment in those companies. Shop smarter, not harder." },
        { icon: "TrendingUp", title: "Fractional Share Investing", description: "Start with any amount — Don't have thousands for full shares? No problem. Kamioi offers fractional investing starting at just $1, making premium stocks accessible to everyone." },
        { icon: "User", title: "Designed for Beginners", description: "No investment experience needed — Clean interface, clear language, and zero jargon. If you can shop online, you can invest with Kamioi. Perfect for anyone taking their first steps into investing." },
        { icon: "Shield", title: "Bank-Level Security", description: "Your money is protected — 256-bit encryption, two-factor authentication, and read-only bank access. SIPC-insured up to $500,000, with the same protections as traditional brokerages." }
      ],
      how_it_works: [
        { step: "01", title: "Connect Once", description: "Link your bank account in minutes — Kamioi uses read-only access with bank-level encryption. We never store credentials or make unauthorized transactions. Set it up once, and you're done.", icon: "Upload" },
        { step: "02", title: "Live Normally", description: "No lifestyle changes needed — Shop, subscribe, and spend as you normally would. Whether it's your morning coffee, streaming subscriptions, or online shopping, every purchase becomes an opportunity.", icon: "Coffee" },
        { step: "03", title: "Own Automatically", description: "AI does the investing for you — Advanced machine learning maps your purchases to corresponding stocks. Bought a latte? You now own a fraction of Starbucks. It's wealth-building on autopilot.", icon: "TrendingUp" }
      ],
      testimonials: [
        { name: "Sarah M.", role: "Software Engineer", content: "Finally, investing that fits my lifestyle. I've always wanted to invest but never had time to research stocks. Kamioi does everything automatically. I've invested over $200 in three months without thinking about it once.", rating: 5, avatar: "SM", age: "24", verified: true, result: "$200+ in 3 months" },
        { name: "Michael T.", role: "Small Business Owner", content: "My whole family uses it now. Started with the Individual plan, loved it so much I upgraded to Family. Now my spouse and teenage kids are all learning about investing through the brands they interact with daily. Brilliant concept.", rating: 5, avatar: "MT", age: "42", verified: true, result: "Family Plan User" },
        { name: "Linda K.", role: "Retired Teacher", content: "Simplest investing I've ever done. I've been investing for 30 years, and this is the most effortless platform I've used. The AI is impressive, and I love owning more of the companies I already support. Perfect for passive income in retirement.", rating: 5, avatar: "LK", age: "58", verified: true, result: "30+ Years Experience" }
      ],
      faqs: [
        { question: "How does automatic investing work?", answer: "Automatic investing with Kamioi is simple: connect your bank account once, and our AI automatically tracks your purchases and invests in corresponding stocks. For example, if you buy coffee at Starbucks, we'll automatically purchase a fractional share of Starbucks stock for you. Investing happens in the background while you live your life—no manual work required." },
        { question: "Is automatic investing safe?", answer: "Yes. Kamioi uses bank-level 256-bit encryption and read-only access to your accounts. We never store banking credentials or make unauthorized transactions. All investments are SIPC-insured up to $500,000, and we're registered with the SEC, ensuring regulatory compliance and investor protection." },
        { question: "What's the minimum amount needed to start?", answer: "You can start with $0 minimum investment. Kamioi offers fractional share investing, meaning you can own a piece of expensive stocks like Amazon or Tesla for as little as $1. Unlike traditional investing that requires large minimums, our platform is designed for anyone who wants to start building wealth, regardless of budget." },
        { question: "Do I need investment experience?", answer: "Not at all. Kamioi is designed for people with zero investment experience. Our AI handles all the complexity—from stock selection to portfolio balancing. You don't need to understand the market, read charts, or make trading decisions. If you can link a bank account, you're ready to start." },
        { question: "What happens if I buy from a brand that's not publicly traded?", answer: "Our AI automatically maps private companies to similar public companies. For example, if you buy from a local coffee shop, we might invest in Starbucks or another publicly-traded coffee company. Our algorithm considers industry, market cap, and your investment preferences to find the best match." },
        { question: "Can I still invest manually, or is it only automatic?", answer: "Both! While Kamioi specializes in automatic investing based on your purchases, you can also make manual investments anytime through the app. Use automatic investing as your baseline wealth-building strategy, with the flexibility to buy specific stocks whenever you want." },
        { question: "How is Kamioi different from other investing apps?", answer: "Unlike traditional apps that require you to manually buy stocks or robo-advisors that need upfront deposits, Kamioi invests based on your everyday spending. We're the only platform that automatically connects purchases to stock ownership. While other apps require active participation, Kamioi works entirely in the background." },
        { question: "What fees does Kamioi charge?", answer: "Kamioi charges a simple monthly subscription ($9 for individuals) with no trading fees, no commission fees, and no hidden costs. Unlike traditional brokers that charge per trade, our subscription covers unlimited automatic and manual investments. Transparent pricing, no surprises." },
        { question: "How quickly will I see returns?", answer: "Investment returns depend on market performance and should be viewed long-term (3-5+ years minimum). Historically, the S&P 500 averages around 10% annual returns, but individual results vary. With Kamioi, you'll start building your portfolio immediately, but we recommend patience—automatic investing works best when you let compound interest work over time." },
        { question: "Is this only for young people?", answer: "Not at all! While Kamioi's simple approach appeals to first-time investors (who tend to be younger), our platform is designed for anyone who wants effortless, automatic investing—regardless of age. We have users from their 20s to their 60s who appreciate the hands-off approach to wealth building." }
      ],
      hero_section_2: {
        headline: "Automatic Investing That Works While You Live Your Life",
        subheadline: "Kamioi turns everyday spending into wealth-building opportunities. Our AI-powered platform automatically invests in the brands you love—no research, no complexity, no experience required.",
        cta_button_text: "Start Investing Automatically — Free Trial",
        key_benefits: [
          "$0 to start — No minimum investment required",
          "100% automatic — AI handles everything for you",
          "Own what you buy — Coffee at Starbucks? Own Starbucks stock",
          "Beginner-friendly — Perfect for first-time investors"
        ],
        trust_indicators: [
          "Bank-level security",
          "10,000+ investors",
          "4.9/5 rating"
        ]
      },
      homepage_seo: {
        meta_title: "Kamioi: Automatic Investing App - Own What You Buy",
        meta_description: "Turn every purchase into stock ownership with Kamioi's AI-powered automatic investing. Start with $0. No experience needed. Join 10,000+ investors building wealth effortlessly.",
        h1_headline: "Automatic Investing That Works While You Live Your Life"
      },
      educational_content: {
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
      },
      // Features page defaults
      features_page_seo: {
        meta_title: "Kamioi Features: AI-Powered Automatic Investing Platform",
        meta_description: "Discover Kamioi's powerful features: automatic investing, AI-powered stock matching, fractional shares, portfolio tracking, and bank-level security. Start building wealth effortlessly.",
        h1_headline: "Every Feature You Need to Build Wealth Automatically"
      },
      features_page_hero: {
        h1_headline: "Every Feature You Need to Build Wealth Automatically",
        hero_subheading: "Kamioi combines cutting-edge AI, seamless automation, and beginner-friendly design to make investing effortless. Discover how our platform turns everyday spending into a diversified investment portfolio."
      },
      features_page_features: [
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
      features_page_faqs: [
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
      ],
      // How It Works page defaults
      how_it_works_page_seo: {
        meta_title: "How Kamioi Works: Automatic Investing in 3 Simple Steps",
        meta_description: "Learn how Kamioi turns everyday purchases into stock ownership. Connect your bank, shop normally, and watch your portfolio grow automatically. Start in minutes.",
        h1_headline: "Automatic Investing in 3 Simple Steps"
      },
      how_it_works_page_hero: {
        h1_headline: "Automatic Investing in 3 Simple Steps",
        hero_subheading: "No stock research. No manual buying. No time commitment. Just connect your bank account and Kamioi does the rest—turning your everyday spending into a diversified investment portfolio.",
        quick_stats: [
          { icon: 'Clock', text: 'Setup: 5 minutes' },
          { icon: 'Zap', text: 'Effort: Zero' },
          { icon: 'TrendingUp', text: 'Results: Automatic wealth building' }
        ]
      },
      how_it_works_page_steps: [
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
      how_it_works_page_faqs: [
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
      ],
      // Learn page defaults
      learn_page_seo: {
        meta_title: "Learn to Invest: Free Guides, Tools & Resources | Kamioi",
        meta_description: "Master investing with our free educational resources. Beginner guides, investment calculators, glossary, and expert tips to build wealth confidently. Start learning today.",
        h1_headline: "Learn to Invest with Confidence"
      },
      learn_page_hero: {
        h1_headline: "Learn to Invest with Confidence",
        hero_subheading: "Whether you're taking your first steps into investing or leveling up your knowledge, our comprehensive resources help you understand markets, build strategies, and achieve your financial goals. All free. No jargon. Just clear, actionable advice."
      },
      learn_page_beginner_path: [
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
      learn_page_strategies: [
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
      learn_page_investment_types: [
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
      learn_page_calculators: [
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
      learn_page_categories: [
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
      learn_page_courses: [
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
      learn_page_faqs: [
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
      ],
      // Pricing page defaults
      pricing_page_seo: {
        meta_title: "Kamioi Pricing: Simple, Transparent Plans Starting at $9/Month",
        meta_description: "Choose the perfect Kamioi plan for your investing needs. Individual ($9), Family ($19), or Business ($49). No hidden fees. Cancel anytime. Start your free 14-day trial.",
        h1_headline: "Simple, Transparent Pricing for Everyone"
      },
      pricing_page_hero: {
        h1_headline: "Simple, Transparent Pricing for Everyone",
        hero_subheading: "One flat monthly fee. No commissions. No trading fees. No hidden costs. Just straightforward pricing so you can focus on building wealth, not decoding your bill.",
        trust_badges: [
          "No credit card required for trial",
          "Cancel anytime",
          "Money-back guarantee"
        ]
      },
      pricing_page_plans: [
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
          ]
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
          ]
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
          ]
        }
      ],
      pricing_page_comparison: [
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
      pricing_page_faqs: [
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
    return defaults[sectionKey] || (sectionKey === 'array' ? [] : {})
  }

  const renderHomepageContent = () => {
    // Get existing sections from currentFrontendContent
    // Note: Homepage uses hardcoded defaults when API has no content, so we show defaults as available content
    const existingSections = homepageSections.map(section => {
      const existingData = currentFrontendContent[section.key]
      const hasApiContent = existingData !== null && existingData !== undefined && 
                   (Array.isArray(existingData) ? existingData.length > 0 : 
                    typeof existingData === 'object' ? Object.keys(existingData).length > 0 : 
                    existingData !== '')
      
      // Get default content for this section
      const defaultContent = getDefaultContent(section.key)
      const hasDefaults = defaultContent && (
        Array.isArray(defaultContent) ? defaultContent.length > 0 :
        typeof defaultContent === 'object' ? Object.keys(defaultContent).length > 0 :
        defaultContent !== ''
      )
      
      // Content exists if API has it OR defaults exist (homepage always shows something)
      const hasContent = hasApiContent || hasDefaults
      
      return {
        ...section,
        hasContent: hasContent, // True if API content OR defaults exist
        hasApiContent: hasApiContent, // Track if API has content vs using defaults
        content: existingData || defaultContent, // Show API content if available, otherwise defaults
        usingDefaults: !hasApiContent && hasDefaults, // True if using homepage defaults
        defaultContent: defaultContent // Store defaults for reference
      }
    })

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>Homepage Content Sections</h3>
            <p className={`${getSubtextClass()} text-sm mt-1`}>
              All sections have content displayed on the homepage. {existingSections.filter(s => s.hasApiContent).length} sections are saved in the database, {existingSections.filter(s => s.usingDefaults).length} are using default values from the code.
              <br />
              <span className="text-blue-400">
                Click any section to view and edit its content. You can save defaults to the database to customize them.
              </span>
            </p>
          </div>
          <button
            onClick={() => window.open('/', '_blank')}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>View Homepage</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingSections.map((section) => {
            const IconComponent = section.icon
            return (
              <div 
                key={section.key} 
                className={`${getCardClass()} p-5 hover:border-blue-500/50 transition-all cursor-pointer group`}
                onClick={() => {
                  // Load content: API content if available, otherwise defaults
                  // This way the editor shows what's actually on the homepage
                  const contentToLoad = section.hasApiContent 
                    ? section.content 
                    : (section.defaultContent || (section.type === 'array' ? [] : {}))
                  
                  // Find the full section object from frontendContent to get is_active status
                  const fullSection = frontendContent.find(s => s.section_key === section.key)
                  const isActive = fullSection ? (fullSection.is_active !== undefined ? fullSection.is_active : true) : true
                  
                  setEditingSection({
                    page: 'homepage',
                    sectionKey: section.key,
                    sectionType: section.type,
                    title: section.name,
                    content: contentToLoad,
                    isActive: isActive, // Include isActive status from database
                    isNew: !section.hasApiContent, // Only "new" if no API content exists
                    usingDefaults: section.usingDefaults, // Track if using defaults
                    defaultContent: section.defaultContent // Store defaults for reference
                  })
                  setIsEditing(true)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.hasApiContent 
                        ? 'bg-green-500/20 text-green-400' 
                        : section.hasContent && section.usingDefaults
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${getTextColor()} group-hover:text-blue-400 transition-colors`}>
                        {section.name}
                      </h4>
                      <p className={`${getSubtextClass()} text-xs mt-1`}>
                        {section.type === 'array' ? 'Array' : 'Object'}
                        {section.usingDefaults && (
                          <span className="ml-2 text-yellow-400">(Defaults)</span>
                        )}
                        {section.hasApiContent && (
                          <span className="ml-2 text-green-400">(Saved)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    section.hasApiContent ? 'bg-green-400' : section.hasContent ? 'bg-yellow-400' : 'bg-gray-500'
                  }`} title={section.hasApiContent ? 'Saved in Database' : section.hasContent ? 'Using Defaults (Visible on Homepage)' : 'No Content'}></div>
                </div>
                <p className={`${getSubtextClass()} text-sm mb-3 line-clamp-2`}>
                  {section.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className={`text-xs ${
                    section.hasApiContent 
                      ? 'text-green-400' 
                      : section.hasContent 
                      ? 'text-yellow-400' 
                      : 'text-gray-500'
                  }`}>
                    {section.hasApiContent 
                      ? 'Saved in Database' 
                      : section.hasContent 
                      ? 'Using Defaults (Visible)' 
                      : 'No Content'}
                  </span>
                  <Edit className={`w-4 h-4 ${getSubtextClass()} group-hover:text-blue-400 transition-colors`} />
                </div>
              </div>
            )
          })}
        </div>

        <div className={`${getCardClass()} p-4 bg-blue-500/10 border-blue-500/30`}>
          <div className="flex items-start space-x-3">
            <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className={`font-semibold ${getTextColor()} mb-1`}>How to Edit Sections</h4>
              <p className={`${getSubtextClass()} text-sm`}>
                Click on any section card above to edit its content. Each section has its own editor tailored to its content type. 
                Changes are saved to the database and will appear on the homepage immediately after saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderFeaturesContent = () => {
    // Get existing sections from currentFrontendContent
    // Note: Features page uses hardcoded defaults when API has no content
    const existingSections = featuresPageSections.map(section => {
      // Features page content is stored under features_page key
      const featuresPageData = currentFrontendContent.features_page || {}
      const existingData = featuresPageData[section.key.replace('features_page_', '')]
      const hasApiContent = existingData !== null && existingData !== undefined && 
                   (Array.isArray(existingData) ? existingData.length > 0 : 
                    typeof existingData === 'object' ? Object.keys(existingData).length > 0 : 
                    existingData !== '')
      
      // Get default content for this section
      const defaultContent = getDefaultContent(section.key)
      const hasDefaults = defaultContent && (
        Array.isArray(defaultContent) ? defaultContent.length > 0 :
        typeof defaultContent === 'object' ? Object.keys(defaultContent).length > 0 :
        defaultContent !== ''
      )
      
      // Content exists if API has it OR defaults exist
      const hasContent = hasApiContent || hasDefaults
      
      return {
        ...section,
        hasContent: hasContent,
        hasApiContent: hasApiContent,
        content: existingData || defaultContent,
        usingDefaults: !hasApiContent && hasDefaults,
        defaultContent: defaultContent
      }
    })

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>Features Page Content Sections</h3>
            <p className={`${getSubtextClass()} text-sm mt-1`}>
              All sections have content displayed on the Features page. {existingSections.filter(s => s.hasApiContent).length} sections are saved in the database, {existingSections.filter(s => s.usingDefaults).length} are using default values from the code.
              <br />
              <span className="text-blue-400">
                Click any section to view and edit its content. You can save defaults to the database to customize them.
              </span>
            </p>
          </div>
          <button
            onClick={() => window.open('/features', '_blank')}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>View Features Page</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingSections.map((section) => {
            const IconComponent = section.icon
            return (
              <div 
                key={section.key} 
                className={`${getCardClass()} p-5 hover:border-blue-500/50 transition-all cursor-pointer group`}
                onClick={() => {
                  // Load content: API content if available, otherwise defaults
                  const contentToLoad = section.hasApiContent 
                    ? section.content 
                    : (section.defaultContent || (section.type === 'array' ? [] : {}))
                  
                  // Find the full section object from frontendContent to get is_active status
                  const fullSection = frontendContent.find(s => s.section_key === section.key)
                  const isActive = fullSection ? (fullSection.is_active !== undefined ? fullSection.is_active : true) : true
                  
                  setEditingSection({
                    page: 'features',
                    sectionKey: section.key,
                    sectionType: section.type,
                    title: section.name,
                    content: contentToLoad,
                    isActive: isActive, // Include isActive status from database
                    isNew: !section.hasApiContent,
                    usingDefaults: section.usingDefaults,
                    defaultContent: section.defaultContent
                  })
                  setIsEditing(true)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.hasApiContent 
                        ? 'bg-green-500/20 text-green-400' 
                        : section.hasContent && section.usingDefaults
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${getTextColor()} group-hover:text-blue-400 transition-colors`}>
                        {section.name}
                      </h4>
                      <p className={`${getSubtextClass()} text-xs mt-1`}>
                        {section.type === 'array' ? 'Array' : 'Object'}
                        {section.usingDefaults && (
                          <span className="ml-2 text-yellow-400">(Defaults)</span>
                        )}
                        {section.hasApiContent && (
                          <span className="ml-2 text-green-400">(Saved)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    section.hasApiContent ? 'bg-green-400' : section.hasContent ? 'bg-yellow-400' : 'bg-gray-500'
                  }`} title={section.hasApiContent ? 'Saved in Database' : section.hasContent ? 'Using Defaults (Visible on Features Page)' : 'No Content'}></div>
                </div>
                <p className={`${getSubtextClass()} text-sm mb-3 line-clamp-2`}>
                  {section.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className={`text-xs ${
                    section.hasApiContent 
                      ? 'text-green-400' 
                      : section.hasContent && section.usingDefaults
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }`}>
                    {section.hasApiContent 
                      ? 'Has API Content' 
                      : section.hasContent && section.usingDefaults
                      ? 'Using Defaults'
                      : 'No Content'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderHowItWorksContent = () => {
    const existingSections = howItWorksPageSections.map(section => {
      const pageData = currentFrontendContent.how_it_works_page || {}
      const mappedKey = section.key.replace('how_it_works_page_', '')
      const existingData = pageData[mappedKey]
      const hasApiContent = existingData !== null && existingData !== undefined && 
                   (Array.isArray(existingData) ? existingData.length > 0 : 
                    typeof existingData === 'object' ? Object.keys(existingData).length > 0 : 
                    existingData !== '')
      
      const defaultContent = getDefaultContent(section.key)
      const hasDefaults = defaultContent && (
        Array.isArray(defaultContent) ? defaultContent.length > 0 :
        typeof defaultContent === 'object' ? Object.keys(defaultContent).length > 0 :
        defaultContent !== ''
      )
      
      const hasContent = hasApiContent || hasDefaults
      
      return {
        ...section,
        hasContent,
        hasApiContent,
        content: existingData || defaultContent,
        usingDefaults: !hasApiContent && hasDefaults,
        defaultContent
      }
    })

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>How It Works Page Content Sections</h3>
            <p className={`${getSubtextClass()} text-sm mt-1`}>
              All sections have content displayed on the How It Works page. {existingSections.filter(s => s.hasApiContent).length} sections are saved in the database, {existingSections.filter(s => s.usingDefaults).length} are using default values from the code.
            </p>
          </div>
          <button
            onClick={() => window.open('/how-it-works', '_blank')}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>View How It Works Page</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingSections.map((section) => {
            const IconComponent = section.icon
            return (
              <div 
                key={section.key} 
                className={`${getCardClass()} p-5 hover:border-blue-500/50 transition-all cursor-pointer group`}
                onClick={() => {
                  const contentToLoad = section.hasApiContent 
                    ? section.content 
                    : (section.defaultContent || (section.type === 'array' ? [] : {}))
                  
                  // Find the full section object from frontendContent to get is_active status
                  const fullSection = frontendContent.find(s => s.section_key === section.key)
                  const isActive = fullSection ? (fullSection.is_active !== undefined ? fullSection.is_active : true) : true
                  
                  setEditingSection({
                    page: 'how-it-works',
                    sectionKey: section.key,
                    sectionType: section.type,
                    title: section.name,
                    content: contentToLoad,
                    isActive: isActive, // Include isActive status from database
                    isNew: !section.hasApiContent,
                    usingDefaults: section.usingDefaults,
                    defaultContent: section.defaultContent
                  })
                  setIsEditing(true)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.hasApiContent 
                        ? 'bg-green-500/20 text-green-400' 
                        : section.hasContent && section.usingDefaults
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${getTextColor()} group-hover:text-blue-400 transition-colors`}>
                        {section.name}
                      </h4>
                      <p className={`${getSubtextClass()} text-xs mt-1`}>
                        {section.type === 'array' ? 'Array' : 'Object'}
                        {section.usingDefaults && <span className="ml-2 text-yellow-400">(Defaults)</span>}
                        {section.hasApiContent && <span className="ml-2 text-green-400">(Saved)</span>}
                      </p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    section.hasApiContent ? 'bg-green-400' : section.hasContent ? 'bg-yellow-400' : 'bg-gray-500'
                  }`}></div>
                </div>
                <p className={`${getSubtextClass()} text-sm mb-3 line-clamp-2`}>
                  {section.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className={`text-xs ${
                    section.hasApiContent 
                      ? 'text-green-400' 
                      : section.hasContent && section.usingDefaults
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }`}>
                    {section.hasApiContent 
                      ? 'Has API Content' 
                      : section.hasContent && section.usingDefaults
                      ? 'Using Defaults'
                      : 'No Content'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderLearnContent = () => {
    const existingSections = learnPageSections.map(section => {
      const pageData = currentFrontendContent.learn_page || {}
      const mappedKey = section.key.replace('learn_page_', '')
      const existingData = pageData[mappedKey]
      const hasApiContent = existingData !== null && existingData !== undefined && 
                   (Array.isArray(existingData) ? existingData.length > 0 : 
                    typeof existingData === 'object' ? Object.keys(existingData).length > 0 : 
                    existingData !== '')
      
      const defaultContent = getDefaultContent(section.key)
      const hasDefaults = defaultContent && (
        Array.isArray(defaultContent) ? defaultContent.length > 0 :
        typeof defaultContent === 'object' ? Object.keys(defaultContent).length > 0 :
        defaultContent !== ''
      )
      
      const hasContent = hasApiContent || hasDefaults
      
      return {
        ...section,
        hasContent,
        hasApiContent,
        content: existingData || defaultContent,
        usingDefaults: !hasApiContent && hasDefaults,
        defaultContent
      }
    })

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>Learn Page Content Sections</h3>
            <p className={`${getSubtextClass()} text-sm mt-1`}>
              All sections have content displayed on the Learn page. {existingSections.filter(s => s.hasApiContent).length} sections are saved in the database, {existingSections.filter(s => s.usingDefaults).length} are using default values from the code.
            </p>
          </div>
          <button
            onClick={() => window.open('/learn', '_blank')}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>View Learn Page</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingSections.map((section) => {
            const IconComponent = section.icon
            return (
              <div 
                key={section.key} 
                className={`${getCardClass()} p-5 hover:border-blue-500/50 transition-all cursor-pointer group`}
                onClick={() => {
                  const contentToLoad = section.hasApiContent 
                    ? section.content 
                    : (section.defaultContent || (section.type === 'array' ? [] : {}))
                  
                  // Find the full section object from frontendContent to get is_active status
                  const fullSection = frontendContent.find(s => s.section_key === section.key)
                  const isActive = fullSection ? (fullSection.is_active !== undefined ? fullSection.is_active : true) : true
                  
                  setEditingSection({
                    page: 'learn',
                    sectionKey: section.key,
                    sectionType: section.type,
                    title: section.name,
                    content: contentToLoad,
                    isActive: isActive, // Include isActive status from database
                    isNew: !section.hasApiContent,
                    usingDefaults: section.usingDefaults,
                    defaultContent: section.defaultContent
                  })
                  setIsEditing(true)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.hasApiContent 
                        ? 'bg-green-500/20 text-green-400' 
                        : section.hasContent && section.usingDefaults
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${getTextColor()} group-hover:text-blue-400 transition-colors`}>
                        {section.name}
                      </h4>
                      <p className={`${getSubtextClass()} text-xs mt-1`}>
                        {section.type === 'array' ? 'Array' : 'Object'}
                        {section.usingDefaults && <span className="ml-2 text-yellow-400">(Defaults)</span>}
                        {section.hasApiContent && <span className="ml-2 text-green-400">(Saved)</span>}
                      </p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    section.hasApiContent ? 'bg-green-400' : section.hasContent ? 'bg-yellow-400' : 'bg-gray-500'
                  }`}></div>
                </div>
                <p className={`${getSubtextClass()} text-sm mb-3 line-clamp-2`}>
                  {section.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className={`text-xs ${
                    section.hasApiContent 
                      ? 'text-green-400' 
                      : section.hasContent && section.usingDefaults
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }`}>
                    {section.hasApiContent 
                      ? 'Has API Content' 
                      : section.hasContent && section.usingDefaults
                      ? 'Using Defaults'
                      : 'No Content'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderPricingContent = () => {
    const existingSections = pricingPageSections.map(section => {
      const pageData = currentFrontendContent.pricing_page || {}
      const mappedKey = section.key.replace('pricing_page_', '')
      const existingData = pageData[mappedKey]
      const hasApiContent = existingData !== null && existingData !== undefined && 
                   (Array.isArray(existingData) ? existingData.length > 0 : 
                    typeof existingData === 'object' ? Object.keys(existingData).length > 0 : 
                    existingData !== '')
      
      const defaultContent = getDefaultContent(section.key)
      const hasDefaults = defaultContent && (
        Array.isArray(defaultContent) ? defaultContent.length > 0 :
        typeof defaultContent === 'object' ? Object.keys(defaultContent).length > 0 :
        defaultContent !== ''
      )
      
      const hasContent = hasApiContent || hasDefaults
      
      return {
        ...section,
        hasContent,
        hasApiContent,
        content: existingData || defaultContent,
        usingDefaults: !hasApiContent && hasDefaults,
        defaultContent
      }
    })

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-xl font-semibold ${getTextColor()}`}>Pricing Page Content Sections</h3>
            <p className={`${getSubtextClass()} text-sm mt-1`}>
              All sections have content displayed on the Pricing page. {existingSections.filter(s => s.hasApiContent).length} sections are saved in the database, {existingSections.filter(s => s.usingDefaults).length} are using default values from the code.
            </p>
          </div>
          <button
            onClick={() => window.open('/pricing', '_blank')}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>View Pricing Page</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {existingSections.map((section) => {
            const IconComponent = section.icon
            return (
              <div 
                key={section.key} 
                className={`${getCardClass()} p-5 hover:border-blue-500/50 transition-all cursor-pointer group`}
                onClick={() => {
                  const contentToLoad = section.hasApiContent 
                    ? section.content 
                    : (section.defaultContent || (section.type === 'array' ? [] : {}))
                  
                  // Find the full section object from frontendContent to get is_active status
                  const fullSection = frontendContent.find(s => s.section_key === section.key)
                  const isActive = fullSection ? (fullSection.is_active !== undefined ? fullSection.is_active : true) : true
                  
                  setEditingSection({
                    page: 'pricing',
                    sectionKey: section.key,
                    sectionType: section.type,
                    title: section.name,
                    content: contentToLoad,
                    isActive: isActive, // Include isActive status from database
                    isNew: !section.hasApiContent,
                    usingDefaults: section.usingDefaults,
                    defaultContent: section.defaultContent
                  })
                  setIsEditing(true)
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      section.hasApiContent 
                        ? 'bg-green-500/20 text-green-400' 
                        : section.hasContent && section.usingDefaults
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${getTextColor()} group-hover:text-blue-400 transition-colors`}>
                        {section.name}
                      </h4>
                      <p className={`${getSubtextClass()} text-xs mt-1`}>
                        {section.type === 'array' ? 'Array' : 'Object'}
                        {section.usingDefaults && <span className="ml-2 text-yellow-400">(Defaults)</span>}
                        {section.hasApiContent && <span className="ml-2 text-green-400">(Saved)</span>}
                      </p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    section.hasApiContent ? 'bg-green-400' : section.hasContent ? 'bg-yellow-400' : 'bg-gray-500'
                  }`}></div>
                </div>
                <p className={`${getSubtextClass()} text-sm mb-3 line-clamp-2`}>
                  {section.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className={`text-xs ${
                    section.hasApiContent 
                      ? 'text-green-400' 
                      : section.hasContent && section.usingDefaults
                      ? 'text-yellow-400'
                      : 'text-gray-400'
                  }`}>
                    {section.hasApiContent 
                      ? 'Has API Content' 
                      : section.hasContent && section.usingDefaults
                      ? 'Using Defaults'
                      : 'No Content'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderFrontendContentTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1 mb-6">
          {[
            { id: 'homepage', label: 'Homepage' },
            { id: 'features', label: 'Features' },
            { id: 'how-it-works', label: 'How It Works' },
            { id: 'learn', label: 'Learn' },
            { id: 'pricing', label: 'Pricing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setPageTab(tab.id)}
              className={`px-4 py-2 rounded-md transition-all duration-200 ${
                pageTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {pageTab === 'homepage' ? renderHomepageContent() : 
         pageTab === 'features' ? renderFeaturesContent() :
         pageTab === 'how-it-works' ? renderHowItWorksContent() :
         pageTab === 'learn' ? renderLearnContent() :
         pageTab === 'pricing' ? renderPricingContent() : (
          <div className={getCardClass()}>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                Not Implemented
              </h4>
              <p className={`${getSubtextClass()} mb-4`}>
                Frontend content management for {pageTab} page is not yet implemented.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSEOTab = () => (
    <div className="space-y-6">
      <h3 className={`text-xl font-semibold ${getTextColor()}`}>SEO Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={getCardClass()}>
          <h4 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Basic SEO</h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Site Title
              </label>
              <input
                type="text"
                value={seoSettings.siteTitle}
                onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Site Description
              </label>
              <textarea
                value={seoSettings.siteDescription}
                onChange={(e) => setSeoSettings({...seoSettings, siteDescription: e.target.value})}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Site Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={seoSettings.siteKeywords}
                onChange={(e) => setSeoSettings({...seoSettings, siteKeywords: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
        </div>

        <div className={getCardClass()}>
          <h4 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Social Media SEO</h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Open Graph Image URL (for Facebook, LinkedIn)
              </label>
              <input
                type="text"
                value={seoSettings.ogImage}
                onChange={(e) => setSeoSettings({...seoSettings, ogImage: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Twitter Handle (e.g., @kamioi)
              </label>
              <input
                type="text"
                value={seoSettings.twitterHandle}
                onChange={(e) => setSeoSettings({...seoSettings, twitterHandle: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
        </div>

        <div className={getCardClass()}>
          <h4 className={`text-lg font-semibold ${getTextColor()} mb-4`}>Analytics</h4>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Google Analytics ID
              </label>
              <input
                type="text"
                value={seoSettings.googleAnalytics}
                onChange={(e) => setSeoSettings({...seoSettings, googleAnalytics: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="GA-XXXXXXXXX"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Facebook Pixel ID
              </label>
              <input
                type="text"
                value={seoSettings.facebookPixel}
                onChange={(e) => setSeoSettings({...seoSettings, facebookPixel: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="1234567890"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={async () => {
            try {
                const adminToken = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken') || 'admin_token_3'
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
                const response = await fetch(`${apiBaseUrl}/api/admin/seo-settings`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                  },
                body: JSON.stringify(seoSettings)
              })
              
              if (response.ok) {
                setModal({
                  isOpen: true,
                  type: 'success',
                  title: 'Success',
                  message: 'SEO settings saved successfully!',
                  onConfirm: () => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })
                })
              } else {
                throw new Error('Failed to save SEO settings')
              }
            } catch (error) {
              console.error('Save SEO settings failed:', error)
              setModal({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to save SEO settings. Please try again.',
                onConfirm: () => setModal({ isOpen: false, type: 'error', title: '', message: '', onConfirm: null })
              })
            }
          }}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save SEO Settings</span>
        </button>
      </div>
    </div>
  )

  const renderContentEditor = () => {
    const isFrontendSection = activeTab === 'frontend' && editingSection
    let contentToEdit = isFrontendSection ? editingSection : (selectedContent || newContent)
    
    // For frontend sections, ensure we have the latest content from API
    if (isFrontendSection && editingSection) {
      const sectionKey = editingSection.sectionKey || editingSection.section_key
      if (sectionKey && currentFrontendContent) {
        let apiContent = null
        if (pageTab === 'homepage') {
          apiContent = currentFrontendContent[sectionKey]
        } else if (pageTab === 'features') {
          const pageData = currentFrontendContent.features_page || {}
          const mappedKey = sectionKey.replace('features_page_', '')
          apiContent = pageData[mappedKey]
        } else if (pageTab === 'how-it-works') {
          const pageData = currentFrontendContent.how_it_works_page || {}
          const mappedKey = sectionKey.replace('how_it_works_page_', '')
          apiContent = pageData[mappedKey]
        } else if (pageTab === 'learn') {
          const pageData = currentFrontendContent.learn_page || {}
          const mappedKey = sectionKey.replace('learn_page_', '')
          apiContent = pageData[mappedKey]
        } else if (pageTab === 'pricing') {
          const pageData = currentFrontendContent.pricing_page || {}
          const mappedKey = sectionKey.replace('pricing_page_', '')
          apiContent = pageData[mappedKey]
        } else {
          const pageKey = `${pageTab}_page`
          const pageData = currentFrontendContent[pageKey] || {}
          apiContent = pageData[sectionKey]
        }
        
        // Merge API content with section data if API has content - prioritize API
        // BUT: Don't overwrite editingSection.content if it's been modified by the user
        // Only use API content if editingSection doesn't have content yet
        if (apiContent && (!editingSection.content || 
            (Array.isArray(editingSection.content) && editingSection.content.length === 0) ||
            (typeof editingSection.content === 'object' && !Array.isArray(editingSection.content) && Object.keys(editingSection.content).length === 0))) {
          contentToEdit = {
            ...editingSection,
            content: apiContent, // Use API content only if editingSection has no content
            // Preserve title and other metadata
            title: editingSection.title || contentToEdit.title,
            sectionKey: sectionKey,
            section_key: sectionKey
          }
        } else {
          // Keep editingSection.content if it exists (user has made changes)
          contentToEdit = {
            ...editingSection,
            content: editingSection.content || apiContent || contentToEdit.content,
            title: editingSection.title || contentToEdit.title,
            sectionKey: sectionKey,
            section_key: sectionKey
          }
        }
      }
    }

    const handleFieldChange = (field, value) => {
      console.log('[ContentManagement] handleFieldChange called:', { 
        field, 
        valueType: typeof value, 
        isArray: Array.isArray(value),
        valueLength: Array.isArray(value) ? value.length : (typeof value === 'object' && value ? Object.keys(value).length : 'N/A'),
        isFrontendSection 
      })
      if (isFrontendSection) {
        setEditingSection(prev => {
          const updated = { ...prev, [field]: value }
          console.log('[ContentManagement] Updated editingSection:', {
            ...updated,
            contentType: typeof updated.content,
            contentIsArray: Array.isArray(updated.content),
            contentLength: Array.isArray(updated.content) ? updated.content.length : (updated.content ? Object.keys(updated.content).length : 0)
          })
          return updated
        })
      } else if (selectedContent) {
        setSelectedContent(prev => ({ ...prev, [field]: value }))
      } else {
        setNewContent(prev => ({ ...prev, [field]: value }))
      }
    }

    const handleJsonContentChange = (value) => {
      try {
        const parsed = JSON.parse(value)
        handleFieldChange('content', parsed)
      } catch (e) {
        handleFieldChange('content', value)
      }
    }

    return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div ref={modalContentRef} className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${getTextColor()}`}>
              {isFrontendSection ? `Edit Section: ${editingSection.title || 'New Section'}` : (selectedContent ? 'Edit Content' : 'Create New Content')}
          </h2>
          <button 
            onClick={() => {
              setIsEditing(false)
              setSelectedContent(null)
                setEditingSection(null)
            }}
            className={`p-2 rounded-lg ${isLightMode ? 'hover:bg-gray-100' : 'hover:bg-gray-700'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
            {!isFrontendSection && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Title
              </label>
              <input
                type="text"
                    value={contentToEdit.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Slug
              </label>
              <input
                type="text"
                    value={contentToEdit.slug || ''}
                    onChange={(e) => handleFieldChange('slug', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
            )}

            {isFrontendSection && (
            <>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className={`text-sm ${getTextColor()} mb-2`}>
                  <strong>Page:</strong> {pageTab === 'homepage' ? 'Homepage' : pageTab.charAt(0).toUpperCase() + pageTab.slice(1).replace('-', ' ')}
                </p>
                {editingSection?.usingDefaults && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
                    <p className={`text-xs ${getTextColor()} flex items-center`}>
                      <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />
                      <strong>Note:</strong> This section is currently using default content from the code. 
                      Edit and save to store custom content in the database.
                    </p>
                  </div>
                )}
                <p className={`text-xs ${getSubtextClass()}`}>
                  This section will be associated with the {pageTab} page. The API will organize it into the correct structure for the frontend.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Section Title
                  </label>
                  <input
                    type="text"
                      value={contentToEdit.title || ''}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="e.g., Hero Section, Features Overview"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Section Type
                    </label>
                    <select
                      value={contentToEdit.type || contentToEdit.sectionType || ''}
                      onChange={(e) => handleFieldChange('sectionType', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">Select Type</option>
                      <option value="hero">Hero</option>
                      <option value="features">Features</option>
                      <option value="testimonials">Testimonials</option>
                      <option value="pricing">Pricing</option>
                      <option value="faq">FAQ</option>
                      <option value="cta">Call to Action</option>
                      <option value="content">General Content</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Section Key (Unique Identifier)
                  </label>
                  <input
                    type="text"
                      value={contentToEdit.sectionKey || contentToEdit.section_key || ''}
                      onChange={(e) => handleFieldChange('sectionKey', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., hero_section_2, features_hero, etc."
                  />
                    <p className={`${getSubtextClass()} text-xs mt-1`}>
                      This key must match what the frontend page expects. Use lowercase with underscores.
                    </p>
                </div>
              <div>
                <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Order
                </label>
                    <input
                      type="number"
                      value={contentToEdit.order || 0}
                      onChange={(e) => handleFieldChange('order', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                      </div>
                      <div>
                  <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                    Content Editor
                  </label>
                  {(() => {
                    // Auto-load existing content from frontend API - prioritize API content
                    const sectionKey = contentToEdit.sectionKey || contentToEdit.section_key
                    let existingContent = null
                    
                    if (currentFrontendContent && sectionKey) {
                      if (pageTab === 'homepage') {
                        existingContent = currentFrontendContent[sectionKey]
                      } else {
                        const pageKey = pageTab === 'how-it-works' ? 'how_it_works_page' : `${pageTab}_page`
                        const pageData = currentFrontendContent[pageKey] || {}
                        existingContent = pageData[sectionKey]
                      }
                    }
                    
                    // Use API content first, then section content, then defaults if using defaults
                    let contentData = existingContent || contentToEdit.content
                    
                    // If no content and using defaults, load default content
                    if (!contentData && contentToEdit.usingDefaults && contentToEdit.defaultContent) {
                      contentData = contentToEdit.defaultContent
                    }
                    
                    // Final fallback to empty object/array
                    if (!contentData) {
                      contentData = contentToEdit.sectionType === 'array' ? [] : {}
                    }
                    
                    console.log('📝 Editor - Section:', sectionKey, 'Content Data:', contentData)
                    
                    // Homepage SEO Editor
                    if (sectionKey === 'homepage_seo') {
                      const seoData = typeof contentData === 'object' && !Array.isArray(contentData) ? contentData : {}
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Title (55-60 characters recommended)</label>
                            <input
                              type="text"
                              value={seoData.meta_title || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_title: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={60}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Kamioi: Automatic Investing App - Own What You Buy"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_title?.length || 0}/60 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Description (150-160 characters recommended)</label>
                            <textarea
                              value={seoData.meta_description || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_description: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={160}
                              rows={3}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Turn every purchase into stock ownership with Kamioi's AI-powered automatic investing..."
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_description?.length || 0}/160 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline (Main Page Title)</label>
                            <input
                              type="text"
                              value={seoData.h1_headline || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, h1_headline: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Automatic Investing That Works While You Live Your Life"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              This is the main headline that appears on the homepage
                            </p>
                          </div>
                        </div>
                      )
                    }
                    
                    // Hero Section Editor
                    if (sectionKey === 'hero_section_2' || sectionKey?.includes('hero')) {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Headline</label>
                            <input
                              type="text"
                              value={contentData.headline || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, headline: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Main headline"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Subheadline</label>
                            <input
                              type="text"
                              value={contentData.subheadline || contentData.subheading || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, subheadline: e.target.value, subheading: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Subheadline text"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Description</label>
                            <textarea
                              value={contentData.description || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, description: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Description text"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>CTA Button Text</label>
                            <input
                              type="text"
                              value={contentData.cta_button_text || contentData.cta_text || contentData.button_text || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, cta_button_text: e.target.value, cta_text: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Start Investing Automatically — Free Trial"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Key Benefits (one per line)</label>
                            <textarea
                              value={Array.isArray(contentData.key_benefits) ? contentData.key_benefits.join('\n') : (contentData.key_benefits || '')}
                              onChange={(e) => {
                                const benefits = e.target.value.split('\n').filter(b => b.trim())
                                const newContent = { ...contentData, key_benefits: benefits }
                                handleFieldChange('content', newContent)
                              }}
                              rows={4}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="$0 to start — No minimum investment required&#10;100% automatic — AI handles everything for you&#10;Own what you buy — Coffee at Starbucks? Own Starbucks stock&#10;Beginner-friendly — Perfect for first-time investors"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>Enter one benefit per line</p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Trust Indicators (one per line)</label>
                            <textarea
                              value={Array.isArray(contentData.trust_indicators) ? contentData.trust_indicators.join('\n') : (contentData.trust_indicators || '')}
                              onChange={(e) => {
                                const indicators = e.target.value.split('\n').filter(i => i.trim())
                                const newContent = { ...contentData, trust_indicators: indicators }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="SIPC Insured&#10;SEC Registered&#10;Bank-Level Security"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>Enter one indicator per line</p>
                          </div>
                        </div>
                      )
                    }
                    
                    // Stats Section Editor
                    if (sectionKey === 'stats') {
                      const stats = Array.isArray(contentData) ? contentData : (contentData.stats || [])
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Statistics ({stats.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newStats = [...stats, { number: 0, label: '', prefix: '', suffix: '' }]
                                handleFieldChange('content', newStats)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add
                            </button>
                          </div>
                          {stats.map((stat, index) => (
                            <div key={index} className="bg-white/5 rounded p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs ${getSubtextClass()}`}>Stat #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStats = stats.filter((_, i) => i !== index)
                                    handleFieldChange('content', newStats)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  value={stat.number || ''}
                                  onChange={(e) => {
                                    const newStats = [...stats]
                                    newStats[index] = { ...stat, number: parseFloat(e.target.value) || 0 }
                                    handleFieldChange('content', newStats)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Number"
                                />
                                <input
                                  type="text"
                                  value={stat.label || ''}
                                  onChange={(e) => {
                                    const newStats = [...stats]
                                    newStats[index] = { ...stat, label: e.target.value }
                                    handleFieldChange('content', newStats)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Label"
                                />
                                <input
                                  type="text"
                                  value={stat.prefix || ''}
                                  onChange={(e) => {
                                    const newStats = [...stats]
                                    newStats[index] = { ...stat, prefix: e.target.value }
                                    handleFieldChange('content', newStats)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Prefix ($)"
                                />
                                <input
                                  type="text"
                                  value={stat.suffix || ''}
                                  onChange={(e) => {
                                    const newStats = [...stats]
                                    newStats[index] = { ...stat, suffix: e.target.value }
                                    handleFieldChange('content', newStats)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Suffix (+, /5)"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Features Section Editor
                    if (sectionKey === 'features' || sectionKey === 'features_overview') {
                      const features = Array.isArray(contentData) ? contentData : (contentData.features || [])
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Features ({features.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFeatures = [...features, { icon: '', title: '', description: '' }]
                                handleFieldChange('content', newFeatures)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Feature
                            </button>
                          </div>
                          {features.map((feature, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Feature #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFeatures = features.filter((_, i) => i !== index)
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Icon (e.g., Brain, Zap, Shield, TrendingUp)</label>
                                <input
                                  type="text"
                                  value={feature.icon || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, icon: e.target.value }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Icon name"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Title</label>
                                <input
                                  type="text"
                                  value={feature.title || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, title: e.target.value }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Feature title"
                                />
                              </div>
                              {feature.headline && (
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Headline</label>
                                  <input
                                    type="text"
                                    value={feature.headline || ''}
                                    onChange={(e) => {
                                      const newFeatures = [...features]
                                      newFeatures[index] = { ...feature, headline: e.target.value }
                                      handleFieldChange('content', newFeatures)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                              )}
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Description</label>
                                <textarea
                                  value={feature.description || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, description: e.target.value }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  rows={3}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Feature description"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // How It Works Section Editor
                    if (sectionKey === 'how_it_works' || sectionKey?.includes('how_it_works')) {
                      const steps = Array.isArray(contentData) ? contentData : (contentData.steps || contentData.how_it_works || [])
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Steps ({steps.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSteps = [...steps, { step: '', title: '', description: '', icon: '' }]
                                handleFieldChange('content', newSteps)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Step
                            </button>
                          </div>
                          {steps.map((step, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Step #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSteps = steps.filter((_, i) => i !== index)
                                    handleFieldChange('content', newSteps)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Step Number</label>
                                  <input
                                    type="text"
                                    value={step.step || step.step_number || ''}
                                    onChange={(e) => {
                                      const newSteps = [...steps]
                                      newSteps[index] = { ...step, step: e.target.value, step_number: e.target.value }
                                      handleFieldChange('content', newSteps)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="01"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Icon</label>
                                  <input
                                    type="text"
                                    value={step.icon || ''}
                                    onChange={(e) => {
                                      const newSteps = [...steps]
                                      newSteps[index] = { ...step, icon: e.target.value }
                                      handleFieldChange('content', newSteps)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Upload, Coffee, TrendingUp"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Title</label>
                                <input
                                  type="text"
                                  value={step.title || ''}
                                  onChange={(e) => {
                                    const newSteps = [...steps]
                                    newSteps[index] = { ...step, title: e.target.value }
                                    handleFieldChange('content', newSteps)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Step title"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Description</label>
                                <textarea
                                  value={step.description || ''}
                                  onChange={(e) => {
                                    const newSteps = [...steps]
                                    newSteps[index] = { ...step, description: e.target.value }
                                    handleFieldChange('content', newSteps)
                                  }}
                                  rows={3}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Step description"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Testimonials Section Editor
                    if (sectionKey === 'testimonials') {
                      const testimonials = Array.isArray(contentData) ? contentData : (contentData.testimonials || [])
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Testimonials ({testimonials.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newTestimonials = [...testimonials, { name: '', role: '', content: '', rating: 5, avatar: '', age: '', verified: true, result: '' }]
                                handleFieldChange('content', newTestimonials)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Testimonial
                            </button>
                          </div>
                          {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Testimonial #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTestimonials = testimonials.filter((_, i) => i !== index)
                                    handleFieldChange('content', newTestimonials)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Name</label>
                                  <input
                                    type="text"
                                    value={testimonial.name || ''}
                                    onChange={(e) => {
                                      const newTestimonials = [...testimonials]
                                      newTestimonials[index] = { ...testimonial, name: e.target.value }
                                      handleFieldChange('content', newTestimonials)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Role</label>
                                  <input
                                    type="text"
                                    value={testimonial.role || ''}
                                    onChange={(e) => {
                                      const newTestimonials = [...testimonials]
                                      newTestimonials[index] = { ...testimonial, role: e.target.value }
                                      handleFieldChange('content', newTestimonials)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Rating (1-5)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={testimonial.rating || 5}
                                    onChange={(e) => {
                                      const newTestimonials = [...testimonials]
                                      newTestimonials[index] = { ...testimonial, rating: parseInt(e.target.value) || 5 }
                                      handleFieldChange('content', newTestimonials)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Avatar (initials)</label>
                                  <input
                                    type="text"
                                    value={testimonial.avatar || ''}
                                    onChange={(e) => {
                                      const newTestimonials = [...testimonials]
                                      newTestimonials[index] = { ...testimonial, avatar: e.target.value }
                                      handleFieldChange('content', newTestimonials)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="SM"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Age</label>
                                  <input
                                    type="text"
                                    value={testimonial.age || ''}
                                    onChange={(e) => {
                                      const newTestimonials = [...testimonials]
                                      newTestimonials[index] = { ...testimonial, age: e.target.value }
                                      handleFieldChange('content', newTestimonials)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Result</label>
                                  <input
                                    type="text"
                                    value={testimonial.result || ''}
                                    onChange={(e) => {
                                      const newTestimonials = [...testimonials]
                                      newTestimonials[index] = { ...testimonial, result: e.target.value }
                                      handleFieldChange('content', newTestimonials)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="$200+ in 3 months"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Content/Testimonial Text</label>
                                <textarea
                                  value={testimonial.content || ''}
                                  onChange={(e) => {
                                    const newTestimonials = [...testimonials]
                                    newTestimonials[index] = { ...testimonial, content: e.target.value }
                                    handleFieldChange('content', newTestimonials)
                                  }}
                                  rows={4}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Testimonial text"
                                />
                              </div>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={testimonial.verified !== false}
                                  onChange={(e) => {
                                    const newTestimonials = [...testimonials]
                                    newTestimonials[index] = { ...testimonial, verified: e.target.checked }
                                    handleFieldChange('content', newTestimonials)
                                  }}
                                  className="mr-2"
                                />
                                <label className={`text-xs ${getSubtextClass()}`}>Verified</label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Learn Page SEO Editor
                    if (sectionKey === 'learn_page_seo') {
                      const seoData = typeof contentData === 'object' && !Array.isArray(contentData) ? contentData : {}
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Title (55-60 characters recommended)</label>
                            <input
                              type="text"
                              value={seoData.meta_title || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_title: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={60}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Learn to Invest: Free Guides, Tools & Resources | Kamioi"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_title?.length || 0}/60 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Description (150-160 characters recommended)</label>
                            <textarea
                              value={seoData.meta_description || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_description: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={160}
                              rows={3}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Master investing with our free educational resources..."
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_description?.length || 0}/160 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline (Main Page Title)</label>
                            <input
                              type="text"
                              value={seoData.h1_headline || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, h1_headline: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Learn to Invest with Confidence"
                            />
                          </div>
                        </div>
                      )
                    }
                    
                    // Learn Page Hero Editor
                    if (sectionKey === 'learn_page_hero') {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline</label>
                            <input
                              type="text"
                              value={contentData.h1_headline || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, h1_headline: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Learn to Invest with Confidence"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Hero Subheading</label>
                            <textarea
                              value={contentData.hero_subheading || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, hero_subheading: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Whether you're taking your first steps into investing..."
                            />
                          </div>
                        </div>
                      )
                    }
                    
                    // Pricing Page SEO Editor
                    if (sectionKey === 'pricing_page_seo') {
                      const seoData = typeof contentData === 'object' && !Array.isArray(contentData) ? contentData : {}
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Title (55-60 characters recommended)</label>
                            <input
                              type="text"
                              value={seoData.meta_title || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_title: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={60}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Kamioi Pricing: Simple, Transparent Plans Starting at $9/Month"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_title?.length || 0}/60 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Description (150-160 characters recommended)</label>
                            <textarea
                              value={seoData.meta_description || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_description: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={160}
                              rows={3}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Choose the perfect Kamioi plan for your investing needs..."
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_description?.length || 0}/160 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline (Main Page Title)</label>
                            <input
                              type="text"
                              value={seoData.h1_headline || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, h1_headline: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Simple, Transparent Pricing for Everyone"
                            />
                          </div>
                        </div>
                      )
                    }
                    
                    // How It Works Page SEO Editor
                    if (sectionKey === 'how_it_works_page_seo') {
                      const seoData = typeof contentData === 'object' && !Array.isArray(contentData) ? contentData : {}
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Title (55-60 characters recommended)</label>
                            <input
                              type="text"
                              value={seoData.meta_title || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_title: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={60}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="How Kamioi Works: Automatic Investing in 3 Simple Steps"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_title?.length || 0}/60 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Description (150-160 characters recommended)</label>
                            <textarea
                              value={seoData.meta_description || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_description: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={160}
                              rows={3}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Learn how Kamioi turns everyday purchases into stock ownership..."
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_description?.length || 0}/160 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline (Main Page Title)</label>
                            <input
                              type="text"
                              value={seoData.h1_headline || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, h1_headline: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Automatic Investing in 3 Simple Steps"
                            />
                          </div>
                        </div>
                      )
                    }
                    
                    // How It Works Page Hero Editor
                    if (sectionKey === 'how_it_works_page_hero') {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline</label>
                            <input
                              type="text"
                              value={contentData.h1_headline || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, h1_headline: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Automatic Investing in 3 Simple Steps"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Hero Subheading</label>
                            <textarea
                              value={contentData.hero_subheading || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, hero_subheading: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="No stock research. No manual buying. No time commitment..."
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Quick Stats (one per line, format: Icon|Text)</label>
                            <textarea
                              value={Array.isArray(contentData.quick_stats) ? contentData.quick_stats.map(s => `${s.icon}|${s.text}`).join('\n') : ''}
                              onChange={(e) => {
                                const stats = e.target.value.split('\n').filter(s => s.trim()).map(line => {
                                  const [icon, ...textParts] = line.split('|')
                                  return { icon: icon.trim(), text: textParts.join('|').trim() }
                                })
                                const newContent = { ...contentData, quick_stats: stats }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Clock|Setup: 5 minutes&#10;Zap|Effort: Zero&#10;TrendingUp|Results: Automatic wealth building"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>Format: IconName|Text (one per line)</p>
                          </div>
                        </div>
                      )
                    }
                    
                    // Pricing Page Hero Editor
                    if (sectionKey === 'pricing_page_hero') {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline</label>
                            <input
                              type="text"
                              value={contentData.h1_headline || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, h1_headline: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Simple, Transparent Pricing for Everyone"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Hero Subheading</label>
                            <textarea
                              value={contentData.hero_subheading || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, hero_subheading: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="One flat monthly fee. No commissions. No trading fees..."
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Trust Badges (one per line)</label>
                            <textarea
                              value={Array.isArray(contentData.trust_badges) ? contentData.trust_badges.join('\n') : ''}
                              onChange={(e) => {
                                const badges = e.target.value.split('\n').filter(b => b.trim())
                                const newContent = { ...contentData, trust_badges: badges }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="No credit card required for trial&#10;Cancel anytime&#10;Money-back guarantee"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>Enter one badge per line</p>
                          </div>
                        </div>
                      )
                    }
                    
                    // FAQ Section Editor
                    if (sectionKey === 'faqs' || sectionKey === 'faq' || sectionKey === 'features_page_faqs' || sectionKey === 'learn_page_faqs' || sectionKey === 'pricing_page_faqs' || sectionKey === 'how_it_works_page_faqs') {
                      const faqs = Array.isArray(contentData) ? contentData : (contentData.faqs || contentData.faq || [])
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>FAQs ({faqs.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFaqs = [...faqs, { question: '', answer: '' }]
                                handleFieldChange('content', newFaqs)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add FAQ
                            </button>
                          </div>
                          {faqs.map((faq, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>FAQ #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFaqs = faqs.filter((_, i) => i !== index)
                                    handleFieldChange('content', newFaqs)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Question</label>
                                <input
                                  type="text"
                                  value={faq.question || ''}
                                  onChange={(e) => {
                                    const newFaqs = [...faqs]
                                    newFaqs[index] = { ...faq, question: e.target.value }
                                    handleFieldChange('content', newFaqs)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="FAQ question"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Answer</label>
                                <textarea
                                  value={faq.answer || ''}
                                  onChange={(e) => {
                                    const newFaqs = [...faqs]
                                    newFaqs[index] = { ...faq, answer: e.target.value }
                                    handleFieldChange('content', newFaqs)
                                  }}
                                  rows={4}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="FAQ answer"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Features Page SEO Editor
                    if (sectionKey === 'features_page_seo') {
                      const seoData = typeof contentData === 'object' && !Array.isArray(contentData) ? contentData : {}
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Title (55-60 characters recommended)</label>
                            <input
                              type="text"
                              value={seoData.meta_title || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_title: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={60}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Kamioi Features: AI-Powered Automatic Investing Platform"
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_title?.length || 0}/60 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Description (150-160 characters recommended)</label>
                            <textarea
                              value={seoData.meta_description || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, meta_description: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              maxLength={160}
                              rows={3}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Discover Kamioi's powerful features: automatic investing, AI-powered stock matching..."
                            />
                            <p className={`${getSubtextClass()} text-xs mt-1`}>
                              {seoData.meta_description?.length || 0}/160 characters
                            </p>
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline (Main Page Title)</label>
                            <input
                              type="text"
                              value={seoData.h1_headline || ''}
                              onChange={(e) => {
                                const newSeo = { ...seoData, h1_headline: e.target.value }
                                handleFieldChange('content', newSeo)
                              }}
                              className={`w-full px-3 py-2 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Every Feature You Need to Build Wealth Automatically"
                            />
                          </div>
                        </div>
                      )
                    }
                    
                    // Features Page Hero Editor
                    if (sectionKey === 'features_page_hero') {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline</label>
                            <input
                              type="text"
                              value={contentData.h1_headline || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, h1_headline: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Every Feature You Need to Build Wealth Automatically"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Hero Subheading</label>
                            <textarea
                              value={contentData.hero_subheading || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, hero_subheading: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              rows={3}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Kamioi combines cutting-edge AI, seamless automation, and beginner-friendly design..."
                            />
                          </div>
                        </div>
                      )
                    }
                    
                    // Features Page Features List Editor
                    if (sectionKey === 'features_page_features') {
                      const features = Array.isArray(contentData) ? contentData : []
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Features ({features.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newFeatures = [...features, { 
                                  icon: 'Brain', 
                                  title: '', 
                                  headline: '', 
                                  description: '' 
                                }]
                                handleFieldChange('content', newFeatures)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Feature
                            </button>
                          </div>
                          {features.map((feature, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3 border border-white/10">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Feature #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFeatures = features.filter((_, i) => i !== index)
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Icon (Brain, TrendingUp, Shield, etc.)</label>
                                  <input
                                    type="text"
                                    value={feature.icon || ''}
                                    onChange={(e) => {
                                      const newFeatures = [...features]
                                      newFeatures[index] = { ...feature, icon: e.target.value }
                                      handleFieldChange('content', newFeatures)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Brain"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Title</label>
                                  <input
                                    type="text"
                                    value={feature.title || ''}
                                    onChange={(e) => {
                                      const newFeatures = [...features]
                                      newFeatures[index] = { ...feature, title: e.target.value }
                                      handleFieldChange('content', newFeatures)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="100% Automatic Investing"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Headline</label>
                                <input
                                  type="text"
                                  value={feature.headline || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, headline: e.target.value }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="True Hands-Free Investing"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Description</label>
                                <textarea
                                  value={feature.description || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, description: e.target.value }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  rows={3}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Connect your bank account once and Kamioi does everything else..."
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Benefits (one per line, optional)</label>
                                <textarea
                                  value={Array.isArray(feature.benefits) ? feature.benefits.join('\n') : ''}
                                  onChange={(e) => {
                                    const benefits = e.target.value.split('\n').filter(b => b.trim())
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, benefits: benefits }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  rows={3}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Zero manual work after setup&#10;Invest 24/7 without lifting a finger"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Use Case (optional)</label>
                                <input
                                  type="text"
                                  value={feature.use_case || ''}
                                  onChange={(e) => {
                                    const newFeatures = [...features]
                                    newFeatures[index] = { ...feature, use_case: e.target.value }
                                    handleFieldChange('content', newFeatures)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Perfect for busy professionals..."
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Learn Page Beginner Path Editor
                    if (sectionKey === 'learn_page_beginner_path') {
                      const steps = Array.isArray(contentData) ? contentData : []
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Beginner Path Steps ({steps.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newSteps = [...steps, { step: steps.length + 1, title: '', resource: '', reading_time: '', topics: [] }]
                                handleFieldChange('content', newSteps)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Step
                            </button>
                          </div>
                          {steps.map((step, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3 border border-white/10">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Step #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSteps = steps.filter((_, i) => i !== index)
                                    handleFieldChange('content', newSteps)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Step Number</label>
                                  <input
                                    type="number"
                                    value={step.step || index + 1}
                                    onChange={(e) => {
                                      const newSteps = [...steps]
                                      newSteps[index] = { ...step, step: parseInt(e.target.value) || index + 1 }
                                      handleFieldChange('content', newSteps)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Reading Time</label>
                                  <input
                                    type="text"
                                    value={step.reading_time || ''}
                                    onChange={(e) => {
                                      const newSteps = [...steps]
                                      newSteps[index] = { ...step, reading_time: e.target.value }
                                      handleFieldChange('content', newSteps)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="15 minutes"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Title</label>
                                <input
                                  type="text"
                                  value={step.title || ''}
                                  onChange={(e) => {
                                    const newSteps = [...steps]
                                    newSteps[index] = { ...step, title: e.target.value }
                                    handleFieldChange('content', newSteps)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Understanding the Basics"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Resource</label>
                                <input
                                  type="text"
                                  value={step.resource || ''}
                                  onChange={(e) => {
                                    const newSteps = [...steps]
                                    newSteps[index] = { ...step, resource: e.target.value }
                                    handleFieldChange('content', newSteps)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Complete Beginner's Guide to Investing"
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Topics (one per line)</label>
                                <textarea
                                  value={Array.isArray(step.topics) ? step.topics.join('\n') : ''}
                                  onChange={(e) => {
                                    const topics = e.target.value.split('\n').filter(t => t.trim())
                                    const newSteps = [...steps]
                                    newSteps[index] = { ...step, topics: topics }
                                    handleFieldChange('content', newSteps)
                                  }}
                                  rows={3}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="What is investing and why it matters&#10;Risk vs. reward explained"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Learn Page Strategies/Investment Types/Calculators/Categories Editors (similar structure)
                    if (sectionKey === 'learn_page_strategies' || sectionKey === 'learn_page_investment_types' || sectionKey === 'learn_page_calculators' || sectionKey === 'learn_page_categories') {
                      const items = Array.isArray(contentData) ? contentData : []
                      const sectionName = sectionKey.replace('learn_page_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>{sectionName} ({items.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...items, { icon: 'Target', title: '', description: '' }]
                                handleFieldChange('content', newItems)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Item
                            </button>
                          </div>
                          {items.map((item, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3 border border-white/10">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Item #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItems = items.filter((_, i) => i !== index)
                                    handleFieldChange('content', newItems)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Icon</label>
                                  <input
                                    type="text"
                                    value={item.icon || ''}
                                    onChange={(e) => {
                                      const newItems = [...items]
                                      newItems[index] = { ...item, icon: e.target.value }
                                      handleFieldChange('content', newItems)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Target"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Title</label>
                                  <input
                                    type="text"
                                    value={item.title || ''}
                                    onChange={(e) => {
                                      const newItems = [...items]
                                      newItems[index] = { ...item, title: e.target.value }
                                      handleFieldChange('content', newItems)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Item title"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Description</label>
                                <textarea
                                  value={item.description || ''}
                                  onChange={(e) => {
                                    const newItems = [...items]
                                    newItems[index] = { ...item, description: e.target.value }
                                    handleFieldChange('content', newItems)
                                  }}
                                  rows={2}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Item description"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Learn Page Courses Editor
                    if (sectionKey === 'learn_page_courses') {
                      const courses = Array.isArray(contentData) ? contentData : []
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Courses ({courses.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newCourses = [...courses, { title: '', duration: '', lessons: 0, level: '', description: '' }]
                                handleFieldChange('content', newCourses)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Course
                            </button>
                          </div>
                          {courses.map((course, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3 border border-white/10">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Course #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newCourses = courses.filter((_, i) => i !== index)
                                    handleFieldChange('content', newCourses)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Title</label>
                                <input
                                  type="text"
                                  value={course.title || ''}
                                  onChange={(e) => {
                                    const newCourses = [...courses]
                                    newCourses[index] = { ...course, title: e.target.value }
                                    handleFieldChange('content', newCourses)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Investing Foundations"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Duration</label>
                                  <input
                                    type="text"
                                    value={course.duration || ''}
                                    onChange={(e) => {
                                      const newCourses = [...courses]
                                      newCourses[index] = { ...course, duration: e.target.value }
                                      handleFieldChange('content', newCourses)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="2 hours"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Lessons</label>
                                  <input
                                    type="number"
                                    value={course.lessons || 0}
                                    onChange={(e) => {
                                      const newCourses = [...courses]
                                      newCourses[index] = { ...course, lessons: parseInt(e.target.value) || 0 }
                                      handleFieldChange('content', newCourses)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Level</label>
                                  <input
                                    type="text"
                                    value={course.level || ''}
                                    onChange={(e) => {
                                      const newCourses = [...courses]
                                      newCourses[index] = { ...course, level: e.target.value }
                                      handleFieldChange('content', newCourses)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Beginner"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Description</label>
                                <textarea
                                  value={course.description || ''}
                                  onChange={(e) => {
                                    const newCourses = [...courses]
                                    newCourses[index] = { ...course, description: e.target.value }
                                    handleFieldChange('content', newCourses)
                                  }}
                                  rows={2}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Complete beginner course covering all investing basics"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Pricing Page Plans Editor
                    if (sectionKey === 'pricing_page_plans') {
                      const plans = Array.isArray(contentData) ? contentData : []
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Pricing Plans ({plans.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newPlans = [...plans, { 
                                  id: `plan_${plans.length + 1}`, 
                                  name: '', 
                                  badge: '', 
                                  monthly_price: 0, 
                                  annual_price: 0, 
                                  perfect_for: '',
                                  core_features: []
                                }]
                                handleFieldChange('content', newPlans)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Plan
                            </button>
                          </div>
                          {plans.map((plan, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3 border border-white/10">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Plan #{index + 1}: {plan.name || 'Unnamed'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPlans = plans.filter((_, i) => i !== index)
                                    handleFieldChange('content', newPlans)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Plan ID</label>
                                  <input
                                    type="text"
                                    value={plan.id || ''}
                                    onChange={(e) => {
                                      const newPlans = [...plans]
                                      newPlans[index] = { ...plan, id: e.target.value }
                                      handleFieldChange('content', newPlans)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="individual"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Name</label>
                                  <input
                                    type="text"
                                    value={plan.name || ''}
                                    onChange={(e) => {
                                      const newPlans = [...plans]
                                      newPlans[index] = { ...plan, name: e.target.value }
                                      handleFieldChange('content', newPlans)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Individual"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Badge</label>
                                <input
                                  type="text"
                                  value={plan.badge || ''}
                                  onChange={(e) => {
                                    const newPlans = [...plans]
                                    newPlans[index] = { ...plan, badge: e.target.value }
                                    handleFieldChange('content', newPlans)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Most Popular for New Investors"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Monthly Price</label>
                                  <input
                                    type="number"
                                    value={plan.monthly_price || 0}
                                    onChange={(e) => {
                                      const newPlans = [...plans]
                                      newPlans[index] = { ...plan, monthly_price: parseFloat(e.target.value) || 0 }
                                      handleFieldChange('content', newPlans)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Annual Price</label>
                                  <input
                                    type="number"
                                    value={plan.annual_price || 0}
                                    onChange={(e) => {
                                      const newPlans = [...plans]
                                      newPlans[index] = { ...plan, annual_price: parseFloat(e.target.value) || 0 }
                                      handleFieldChange('content', newPlans)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Annual Savings</label>
                                  <input
                                    type="number"
                                    value={plan.annual_savings || 0}
                                    onChange={(e) => {
                                      const newPlans = [...plans]
                                      newPlans[index] = { ...plan, annual_savings: parseFloat(e.target.value) || 0 }
                                      handleFieldChange('content', newPlans)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Perfect For</label>
                                <input
                                  type="text"
                                  value={plan.perfect_for || ''}
                                  onChange={(e) => {
                                    const newPlans = [...plans]
                                    newPlans[index] = { ...plan, perfect_for: e.target.value }
                                    handleFieldChange('content', newPlans)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Solo investors, beginners..."
                                />
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Core Features (one per line)</label>
                                <textarea
                                  value={Array.isArray(plan.core_features) ? plan.core_features.join('\n') : ''}
                                  onChange={(e) => {
                                    const features = e.target.value.split('\n').filter(f => f.trim())
                                    const newPlans = [...plans]
                                    newPlans[index] = { ...plan, core_features: features }
                                    handleFieldChange('content', newPlans)
                                  }}
                                  rows={3}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Unlimited automatic investments&#10;AI-powered stock matching"
                                />
                              </div>
                              <p className={`${getSubtextClass()} text-xs`}>
                                Note: Additional plan fields (investment_features, security_support, etc.) can be edited via JSON editor if needed.
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Pricing Page Comparison Editor
                    if (sectionKey === 'pricing_page_comparison') {
                      const comparison = Array.isArray(contentData) ? contentData : []
                      return (
                        <div className="space-y-3 border border-white/10 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className={`text-sm font-medium ${getTextColor()}`}>Comparison Rows ({comparison.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newRows = [...comparison, { feature: '', individual: '', family: '', business: '' }]
                                handleFieldChange('content', newRows)
                              }}
                              className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                            >
                              <Plus className="w-3 h-3 inline mr-1" />
                              Add Row
                            </button>
                          </div>
                          {comparison.map((row, index) => (
                            <div key={index} className="bg-white/5 rounded p-4 space-y-3 border border-white/10">
                              <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium ${getTextColor()}`}>Row #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newRows = comparison.filter((_, i) => i !== index)
                                    handleFieldChange('content', newRows)
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div>
                                <label className={`block text-xs ${getSubtextClass()} mb-1`}>Feature Name</label>
                                <input
                                  type="text"
                                  value={row.feature || ''}
                                  onChange={(e) => {
                                    const newRows = [...comparison]
                                    newRows[index] = { ...row, feature: e.target.value }
                                    handleFieldChange('content', newRows)
                                  }}
                                  className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                  placeholder="Price"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Individual</label>
                                  <input
                                    type="text"
                                    value={typeof row.individual === 'boolean' ? (row.individual ? 'Yes' : 'No') : (row.individual || '')}
                                    onChange={(e) => {
                                      const newRows = [...comparison]
                                      const value = e.target.value.toLowerCase()
                                      newRows[index] = { 
                                        ...row, 
                                        individual: value === 'yes' || value === 'true' ? true : (value === 'no' || value === 'false' ? false : e.target.value)
                                      }
                                      handleFieldChange('content', newRows)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="$9/mo or true/false"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Family</label>
                                  <input
                                    type="text"
                                    value={typeof row.family === 'boolean' ? (row.family ? 'Yes' : 'No') : (row.family || '')}
                                    onChange={(e) => {
                                      const newRows = [...comparison]
                                      const value = e.target.value.toLowerCase()
                                      newRows[index] = { 
                                        ...row, 
                                        family: value === 'yes' || value === 'true' ? true : (value === 'no' || value === 'false' ? false : e.target.value)
                                      }
                                      handleFieldChange('content', newRows)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="$19/mo or true/false"
                                  />
                                </div>
                                <div>
                                  <label className={`block text-xs ${getSubtextClass()} mb-1`}>Business</label>
                                  <input
                                    type="text"
                                    value={typeof row.business === 'boolean' ? (row.business ? 'Yes' : 'No') : (row.business || '')}
                                    onChange={(e) => {
                                      const newRows = [...comparison]
                                      const value = e.target.value.toLowerCase()
                                      newRows[index] = { 
                                        ...row, 
                                        business: value === 'yes' || value === 'true' ? true : (value === 'no' || value === 'false' ? false : e.target.value)
                                      }
                                      handleFieldChange('content', newRows)
                                    }}
                                    className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="$49/mo or true/false"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    
                    // Educational Content Editor
                    if (sectionKey === 'educational_content') {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Headline</label>
                            <input
                              type="text"
                              value={contentData.headline || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, headline: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Educational content headline"
                            />
                          </div>
                          <div>
                            <label className={`block text-xs ${getSubtextClass()} mb-1`}>Introduction</label>
                            <textarea
                              value={contentData.intro || ''}
                              onChange={(e) => {
                                const newContent = { ...contentData, intro: e.target.value }
                                handleFieldChange('content', newContent)
                              }}
                              rows={4}
                              className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              placeholder="Introduction text"
                            />
                          </div>
                          {contentData.featured_topics && Array.isArray(contentData.featured_topics) && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${getTextColor()}`}>Featured Topics ({contentData.featured_topics.length})</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newContent = {
                                      ...contentData,
                                      featured_topics: [...(contentData.featured_topics || []), '']
                                    }
                                    handleFieldChange('content', newContent)
                                  }}
                                  className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded px-2 py-1 text-green-400 text-xs"
                                >
                                  <Plus className="w-3 h-3 inline mr-1" />
                                  Add Topic
                                </button>
                              </div>
                              {contentData.featured_topics.map((topic, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={topic || ''}
                                    onChange={(e) => {
                                      const newTopics = [...contentData.featured_topics]
                                      newTopics[index] = e.target.value
                                      const newContent = { ...contentData, featured_topics: newTopics }
                                      handleFieldChange('content', newContent)
                                    }}
                                    className={`flex-1 px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                    placeholder="Topic title"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTopics = contentData.featured_topics.filter((_, i) => i !== index)
                                      const newContent = { ...contentData, featured_topics: newTopics }
                                      handleFieldChange('content', newContent)
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    // Page Meta/SEO Editor (for Features, How It Works, Learn, Pricing pages)
                    if (sectionKey?.includes('meta') || sectionKey === 'h1_headline' || sectionKey === 'hero_subheading') {
                      return (
                        <div className="space-y-4 border border-white/10 rounded-lg p-4">
                          {contentData.meta_title !== undefined && (
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Title</label>
                              <input
                                type="text"
                                value={contentData.meta_title || ''}
                                onChange={(e) => {
                                  const newContent = { ...contentData, meta_title: e.target.value }
                                  handleFieldChange('content', newContent)
                                }}
                                className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              />
                            </div>
                          )}
                          {contentData.meta_description !== undefined && (
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Meta Description</label>
                              <textarea
                                value={contentData.meta_description || ''}
                                onChange={(e) => {
                                  const newContent = { ...contentData, meta_description: e.target.value }
                                  handleFieldChange('content', newContent)
                                }}
                                rows={2}
                                className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              />
                            </div>
                          )}
                          {contentData.h1_headline !== undefined && (
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>H1 Headline</label>
                              <input
                                type="text"
                                value={contentData.h1_headline || ''}
                                onChange={(e) => {
                                  const newContent = { ...contentData, h1_headline: e.target.value }
                                  handleFieldChange('content', newContent)
                                }}
                                className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              />
                            </div>
                          )}
                          {contentData.hero_subheading !== undefined && (
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Hero Subheading</label>
                              <textarea
                                value={contentData.hero_subheading || ''}
                                onChange={(e) => {
                                  const newContent = { ...contentData, hero_subheading: e.target.value }
                                  handleFieldChange('content', newContent)
                                }}
                                rows={3}
                                className={`w-full px-3 py-2 rounded ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              />
                            </div>
                          )}
                        </div>
                      )
                    }
                    
                    // Default: Show JSON editor as fallback
                    return (
                      <div>
                        <p className={`${getSubtextClass()} text-xs mb-2`}>
                          No specific editor for this section type. Use JSON editor below or contact support to add a custom editor.
                        </p>
                        <textarea
                          value={typeof contentToEdit.content === 'object' ? JSON.stringify(contentToEdit.content, null, 2) : (contentToEdit.content || '')}
                          onChange={(e) => handleJsonContentChange(e.target.value)}
                          rows={15}
                          className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm`}
                          placeholder='Enter JSON content for this section...'
                        />
                        <p className={`${getSubtextClass()} text-xs mt-1`}>
                          Enter content as valid JSON. Example: {"{"}"headline": "Welcome", "body": "..."{"}"}
                        </p>
                      </div>
                    )
                  })()}
                      </div>

                {/* Layout & Images Section */}
                {isFrontendSection && (() => {
                  // Get contentData for layout/image controls - use editingSection.content if available, otherwise fall back
                  const sectionKey = contentToEdit.sectionKey || contentToEdit.section_key
                  let existingContent = null
                  
                  if (currentFrontendContent && sectionKey) {
                    if (pageTab === 'homepage') {
                      existingContent = currentFrontendContent[sectionKey]
                    } else {
                      const pageKey = pageTab === 'how-it-works' ? 'how_it_works_page' : `${pageTab}_page`
                      const pageData = currentFrontendContent[pageKey] || {}
                      existingContent = pageData[sectionKey]
                    }
                  }
                  
                  // Use editingSection.content if it exists (most up-to-date), otherwise fall back
                  // Check editingSection first for the most current data (it updates when handleFieldChange is called)
                  const currentContent = (isFrontendSection && editingSection?.content) || contentToEdit.content || existingContent || {}
                  const contentData = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                  
                  return (
                    <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
                    <div>
                      <h3 className={`text-lg font-semibold ${getTextColor()} mb-4 flex items-center space-x-2`}>
                        <Image className="w-5 h-5" />
                        <span>Layout & Images</span>
                      </h3>
                      
                      {/* Layout Selector */}
                      <div className="mb-6">
                        <LayoutSelector
                          selectedLayout={contentData?.layout_type || ''}
                          onLayoutSelect={(layoutId) => {
                            // Get the most current content from editingSection
                            const currentContent = (isFrontendSection && editingSection?.content) || contentToEdit.content || existingContent || {}
                            const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                            const updatedContent = {
                              ...baseContent,
                              layout_type: layoutId,
                              layout_config: baseContent.layout_config || {
                                image_width: '40%',
                                content_order: 'image_first',
                                spacing: '2rem',
                                image_alignment: 'left'
                              }
                            }
                            handleFieldChange('content', updatedContent)
                          }}
                          isLightMode={isLightMode}
                        />
                      </div>

                      {/* Layout Configuration */}
                      {contentData?.layout_type && (
                        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                          <h4 className={`text-sm font-semibold ${getTextColor()} mb-3`}>Layout Settings</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Image Width</label>
                              <input
                                type="text"
                                value={contentData?.layout_config?.image_width || '40%'}
                                onChange={(e) => {
                                  const currentContent = contentToEdit.content || existingContent || {}
                                  const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                                  const updatedContent = {
                                    ...baseContent,
                                    layout_config: {
                                      ...(baseContent.layout_config || {}),
                                      image_width: e.target.value
                                    }
                                  }
                                  handleFieldChange('content', updatedContent)
                                }}
                                className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                placeholder="40% or 400px"
                              />
                            </div>
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Content Order</label>
                              <select
                                value={contentData?.layout_config?.content_order || 'image_first'}
                                onChange={(e) => {
                                  const currentContent = contentToEdit.content || existingContent || {}
                                  const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                                  const updatedContent = {
                                    ...baseContent,
                                    layout_config: {
                                      ...(baseContent.layout_config || {}),
                                      content_order: e.target.value
                                    }
                                  }
                                  handleFieldChange('content', updatedContent)
                                }}
                                className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              >
                                <option value="image_first">Image First</option>
                                <option value="content_first">Content First</option>
                              </select>
                            </div>
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Spacing</label>
                              <input
                                type="text"
                                value={contentData?.layout_config?.spacing || '2rem'}
                                onChange={(e) => {
                                  const currentContent = contentToEdit.content || existingContent || {}
                                  const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                                  const updatedContent = {
                                    ...baseContent,
                                    layout_config: {
                                      ...(baseContent.layout_config || {}),
                                      spacing: e.target.value
                                    }
                                  }
                                  handleFieldChange('content', updatedContent)
                                }}
                                className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                placeholder="2rem"
                              />
                            </div>
                            <div>
                              <label className={`block text-xs ${getSubtextClass()} mb-1`}>Image Alignment</label>
                              <select
                                value={contentData?.layout_config?.image_alignment || 'left'}
                                onChange={(e) => {
                                  const currentContent = contentToEdit.content || existingContent || {}
                                  const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                                  const updatedContent = {
                                    ...baseContent,
                                    layout_config: {
                                      ...(baseContent.layout_config || {}),
                                      image_alignment: e.target.value
                                    }
                                  }
                                  handleFieldChange('content', updatedContent)
                                }}
                                className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                              >
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                                <option value="center">Center</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Image Upload */}
                      <div className="mb-6">
                        <ImageUpload
                          onImageUploaded={(newImages, isRemoval = false) => {
                            const currentContent = contentToEdit.content || existingContent || {}
                            const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                            let updatedImages = []
                            
                            if (isRemoval) {
                              // If removal, newImages is the filtered array
                              updatedImages = newImages
                            } else {
                              // If adding, merge with existing
                              const existingImages = baseContent.images || []
                              updatedImages = [...existingImages, ...newImages]
                            }
                            
                            const updatedContent = {
                              ...baseContent,
                              images: updatedImages
                            }
                            handleFieldChange('content', updatedContent)
                          }}
                          existingImages={contentData?.images || []}
                          maxImages={contentData?.layout_type === 'image_grid' || contentData?.layout_type === 'image_carousel' ? 10 : 1}
                          label="Section Images"
                        />
                      </div>

                      {/* Image Details Editor */}
                      {contentData?.images && contentData.images.length > 0 && (
                        <div className="space-y-3">
                          <h4 className={`text-sm font-semibold ${getTextColor()}`}>Image Details</h4>
                          {contentData.images.map((image, index) => (
                            <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                              <div className="flex items-center space-x-3">
                                <div className="w-20 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                  <img src={image.url} alt={image.alt_text || ''} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <label className={`block text-xs ${getSubtextClass()} mb-1`}>Alt Text</label>
                                    <input
                                      type="text"
                                      value={image.alt_text || ''}
                                      onChange={(e) => {
                                        const currentContent = contentToEdit.content || existingContent || {}
                                        const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                                        const updatedImages = [...(baseContent.images || [])]
                                        updatedImages[index] = { ...image, alt_text: e.target.value }
                                        const updatedContent = {
                                          ...baseContent,
                                          images: updatedImages
                                        }
                                        handleFieldChange('content', updatedContent)
                                      }}
                                      className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                      placeholder="Descriptive alt text"
                                    />
                                  </div>
                                  <div>
                                    <label className={`block text-xs ${getSubtextClass()} mb-1`}>Caption (optional)</label>
                                    <input
                                      type="text"
                                      value={image.caption || ''}
                                      onChange={(e) => {
                                        const currentContent = contentToEdit.content || existingContent || {}
                                        const baseContent = typeof currentContent === 'object' && !Array.isArray(currentContent) ? currentContent : {}
                                        const updatedImages = [...(baseContent.images || [])]
                                        updatedImages[index] = { ...image, caption: e.target.value }
                                        const updatedContent = {
                                          ...baseContent,
                                          images: updatedImages
                                        }
                                        handleFieldChange('content', updatedContent)
                                      }}
                                      className={`w-full px-2 py-1 rounded text-sm ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border`}
                                      placeholder="Image caption"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                  )
                })()}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sectionActive"
                    checked={contentToEdit.isActive !== false}
                    onChange={(e) => {
                      console.log('🔵 Active checkbox changed:', e.target.checked)
                      handleFieldChange('isActive', e.target.checked)
                    }}
                    className={`mr-2 h-4 w-4 text-blue-600 rounded ${isLightMode ? 'border-gray-300' : 'border-gray-600 bg-gray-700'} focus:ring-blue-500`}
                  />
                  <label htmlFor="sectionActive" className={`text-sm font-medium ${getTextColor()}`}>
                    Active
                  </label>
                          </div>
              </>
                  )}

            {activeTab === 'blogs' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={contentToEdit.category || ''}
                      onChange={(e) => handleFieldChange('category', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(contentToEdit.tags) ? contentToEdit.tags.join(', ') : (contentToEdit.tags || '')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                        handleFieldChange('tags', tags)
                      }}
                      className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                </div>
              </div>
            </>
          )}

            {!isFrontendSection && (
              <>
          <div>
            <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                    Excerpt
            </label>
            <textarea
                    value={contentToEdit.excerpt || ''}
                    onChange={(e) => handleFieldChange('excerpt', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
              Content
            </label>
            <textarea
                    value={contentToEdit.content || ''}
                    onChange={(e) => handleFieldChange('content', e.target.value)}
              rows={10}
              className={`w-full px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Write your content here..."
            />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <label className={`block text-sm font-medium ${getTextColor()} mb-2`}>
                Status
              </label>
              <select
                      value={contentToEdit.status || 'draft'}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                className={`px-3 py-2 rounded-lg ${isLightMode ? 'bg-white border-gray-300 text-gray-800' : 'bg-white/10 border-white/20 text-white'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  setIsEditing(false)
                  setSelectedContent(null)
                        setEditingSection(null)
                }}
                className={`px-4 py-2 rounded-lg ${isLightMode ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/20'} transition-colors`}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveContent}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
              </>
            )}

            {isFrontendSection && (
              <div className="flex justify-end space-x-3">
          <button 
                  onClick={() => {
                    setIsEditing(false)
                    setEditingSection(null)
                  }}
                  className={`px-4 py-2 rounded-lg ${isLightMode ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-white/10 text-white hover:bg-white/20'} transition-colors`}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔵 SAVE BUTTON CLICKED!')
                    console.log('🔵 editingSection:', editingSection)
                    console.log('🔵 editingSection.content:', editingSection?.content)
                    console.log('🔵 editingSection.content type:', typeof editingSection?.content, Array.isArray(editingSection?.content) ? '(array)' : '(not array)')
                    console.log('🔵 editingSection.content length:', Array.isArray(editingSection?.content) ? editingSection.content.length : Object.keys(editingSection?.content || {}).length)
                    if (!editingSection) {
                      alert('No editingSection to save!')
                      return
                    }
                    handleSaveFrontendSection(editingSection).catch(err => {
                      console.error('❌ Save error:', err)
                      alert(`Save failed: ${err.message}`)
                    })
                  }}
                  className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Section</span>
          </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${getTextColor()}`}>Content Management</h1>
          <p className={`${getSubtextClass()} mt-1`}>Manage your website content, blog posts, and SEO settings</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all">
            <Globe className="w-4 h-4" />
            <span>View Site</span>
          </button>
        </div>
      </div>

      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { id: 'pages', label: 'Pages', icon: FileText },
          { id: 'blogs', label: 'Blog Posts', icon: Edit },
          { id: 'frontend', label: 'Frontend Content', icon: Globe },
          { id: 'seo', label: 'SEO Settings', icon: Settings },
          { id: 'analytics', label: 'Google Analytics', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon && React.createElement(tab.icon, { className: 'w-4 h-4' })}
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'analytics' ? (
        <GoogleAnalytics user={user} />
      ) : (
        <div className={getCardClass()}>
          {activeTab === 'pages' && renderPagesTab()}
          {activeTab === 'blogs' && renderBlogsTab()}
          {activeTab === 'frontend' && renderFrontendContentTab()}
          {activeTab === 'seo' && renderSEOTab()}
        </div>
      )}

      {isEditing && activeTab === 'blogs' && (
        <BlogEditor
          post={selectedContent}
          onSave={(data) => {
            setIsEditing(false)
            setSelectedContent(null)
            fetchContent(new AbortController().signal)
          }}
          onCancel={() => {
            setIsEditing(false)
            setSelectedContent(null)
          }}
          isEditing={!!selectedContent}
        />
      )}
      {(isEditing && activeTab === 'pages' && renderContentEditor()) || (isEditing && activeTab === 'frontend' && renderContentEditor())}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className={`text-lg font-semibold ${getTextColor()} mb-2`}>
                  Delete Content
                </h3>
                <p className={`text-sm ${getSubtextClass()}`}>
                  Are you sure you want to delete this content? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelDeleteContent}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteContent}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-center"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GlassModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText || 'OK'}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  )
}

export default ContentManagement
