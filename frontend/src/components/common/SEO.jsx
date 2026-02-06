import React from 'react'
import { Helmet } from 'react-helmet-async'

const SEO = ({
  title = "Kamioi - Smart Investment Platform",
  description = "Invest your spare change automatically with AI-powered insights. Build wealth effortlessly with round-up investments.",
  keywords = "investing, round-ups, AI, wealth building, family investing, smart investing, automatic investing",
  image = "https://kamioi.com/favicon.png",
  url = null,
  type = "website",
  structuredData = null,
  breadcrumbs = null,
  faq = null,
  article = null,
  noindex = false
}) => {
  const fullTitle = title.includes('Kamioi') ? title : `${title} | Kamioi`
  const canonicalUrl = url || `https://kamioi.com${typeof window !== 'undefined' ? window.location.pathname : '/'}`

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Kamioi" />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow"} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Kamioi" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@kamioi" />
      <meta name="twitter:creator" content="@kamioi" />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Kamioi" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Custom Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData, null, 2)}
        </script>
      )}

      {/* Breadcrumb Structured Data */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": crumb.name,
              "item": crumb.url
            }))
          }, null, 2)}
        </script>
      )}

      {/* FAQ Structured Data */}
      {faq && faq.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faq.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          }, null, 2)}
        </script>
      )}

      {/* Article Structured Data for Blog Posts */}
      {article && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.description || description,
            "image": article.image || image,
            "author": {
              "@type": "Person",
              "name": article.author || "Kamioi Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Kamioi",
              "logo": {
                "@type": "ImageObject",
                "url": "https://kamioi.com/logo.png"
              }
            },
            "datePublished": article.publishedDate,
            "dateModified": article.modifiedDate || article.publishedDate,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrl
            }
          }, null, 2)}
        </script>
      )}

      {/* Default Organization Structured Data */}
      {!structuredData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Kamioi",
            "description": "AI-powered automatic investing platform that turns everyday purchases into stock ownership",
            "url": "https://kamioi.com",
            "logo": "https://kamioi.com/favicon.png",
            "sameAs": [
              "https://twitter.com/kamioi",
              "https://linkedin.com/company/kamioi",
              "https://facebook.com/kamioi"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-555-KAMIOI",
              "contactType": "customer service",
              "availableLanguage": "English"
            }
          }, null, 2)}
        </script>
      )}

      {/* WebSite Search Structured Data */}
      {!structuredData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Kamioi",
            "url": "https://kamioi.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://kamioi.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }, null, 2)}
        </script>
      )}

      {/* SoftwareApplication Structured Data */}
      {!structuredData && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Kamioi",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web, iOS, Android",
            "offers": {
              "@type": "Offer",
              "price": "9.00",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1250"
            }
          }, null, 2)}
        </script>
      )}
    </Helmet>
  )
}

export default SEO
