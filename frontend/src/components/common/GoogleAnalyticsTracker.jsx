import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Google Analytics 4 tracking component
const GoogleAnalyticsTracker = () => {
  const location = useLocation()
  
  useEffect(() => {
    // Initialize Google Analytics 4
    const initGA = () => {
      // Replace with your actual GA4 Measurement ID
      // To find this: Go to Google Analytics → Admin → Data Streams → Web → Measurement ID
      const GA_MEASUREMENT_ID = 'G-SPF57B5KCR'
      
      // Load Google Analytics script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
      document.head.appendChild(script)
      
      // Initialize gtag
      window.dataLayer = window.dataLayer || []
      function gtag(){window.dataLayer.push(arguments)}
      window.gtag = gtag
      gtag('js', new Date())
      gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href
      })
    }
    
    // Track page views
    const trackPageView = () => {
      if (window.gtag) {
        window.gtag('config', 'G-SPF57B5KCR', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: location.pathname
        })
      }
    }
    
    // Initialize GA on first load
    if (!window.gtag) {
      initGA()
    }
    
    // Track page view on route change
    trackPageView()
    
    // Debug: Log to console to verify tracking is working
    console.log('Google Analytics tracking initialized for:', window.location.href)
  }, [location])
  
  // Expose tracking function globally for manual testing
  useEffect(() => {
    window.trackGAEvent = (eventName, parameters = {}) => {
      if (window.gtag) {
        window.gtag('event', eventName, parameters)
        console.log('GA Event tracked:', eventName, parameters)
      } else {
        console.log('GA not initialized yet')
      }
    }
  }, [])
  
  return null // This component doesn't render anything
}

export default GoogleAnalyticsTracker
