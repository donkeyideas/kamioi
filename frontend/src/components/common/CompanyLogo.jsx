import React, { useState, useEffect } from 'react'

const CompanyLogo = ({ symbol, name, size = 'w-8 h-8', clickable = false }) => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)

  // Get company website URL for the ticker
  const getCompanyWebsite = (symbol) => {
    const websiteMap = {
      'AAPL': 'apple.com',
      'AMZN': 'amazon.com',
      'GOOGL': 'google.com',
      'GOOG': 'google.com',
      'MSFT': 'microsoft.com',
      'TSLA': 'tesla.com',
      'META': 'meta.com',
      'NFLX': 'netflix.com',
      'NVDA': 'nvidia.com',
      'ADBE': 'adobe.com',
      'FL': 'footlocker.com',
      'BURL': 'burlington.com',
      'CHTR': 'spectrum.com',
      'DKS': 'dickssportinggoods.com',
      'EL': 'esteelauder.com',
      'SBUX': 'starbucks.com',
      'WMT': 'walmart.com',
      'SPOT': 'spotify.com',
      'UBER': 'uber.com',
      'M': 'macys.com',
      'CMG': 'chipotle.com',
      'DIS': 'disney.com',
      'NKE': 'nike.com',
      'CRM': 'salesforce.com',
      'PYPL': 'paypal.com',
      'INTC': 'intel.com',
      'AMD': 'amd.com',
      'ORCL': 'oracle.com',
      'IBM': 'ibm.com',
      'CSCO': 'cisco.com',
      'JPM': 'jpmorganchase.com',
      'BAC': 'bankofamerica.com',
      'WFC': 'wellsfargo.com',
      'GS': 'goldmansachs.com',
      'V': 'visa.com',
      'MA': 'mastercard.com',
      'JNJ': 'jnj.com',
      'PFE': 'pfizer.com',
      'UNH': 'unitedhealthgroup.com',
      'HD': 'homedepot.com',
      'LOW': 'lowes.com',
      'KO': 'coca-cola.com',
      'PEP': 'pepsi.com',
      'MCD': 'mcdonalds.com',
      'YUM': 'yum.com',
      'TGT': 'target.com',
      'COST': 'costco.com',
      'CVS': 'cvs.com',
      'ABNB': 'airbnb.com',
      'SQ': 'squareup.com',
      'SHOP': 'shopify.com',
      'SNAP': 'snap.com',
      'TWTR': 'twitter.com',
      'ZM': 'zoom.us',
      'DOCU': 'docusign.com',
      'PINS': 'pinterest.com',
      'LYFT': 'lyft.com',
      'DASH': 'doordash.com',
      'RBLX': 'roblox.com',
      'COIN': 'coinbase.com',
      'HOOD': 'robinhood.com',
      'SYK': 'stryker.com',
      'ABBV': 'abbvie.com',
      'MRK': 'merck.com',
      'LLY': 'lilly.com',
      'BMY': 'bms.com',
      'GILD': 'gilead.com',
      'AMGN': 'amgen.com',
      'BIIB': 'biogen.com',
      'REGN': 'regeneron.com',
      'VRTX': 'vrtx.com',
      'MRNA': 'modernatx.com',
      'BNTX': 'biontech.de',
      'BA': 'boeing.com',
      'LMT': 'lockheedmartin.com',
      'RTX': 'rtx.com',
      'NOC': 'northropgrumman.com',
      'GD': 'gd.com',
      'CAT': 'caterpillar.com',
      'DE': 'deere.com',
      'MMM': '3m.com',
      'HON': 'honeywell.com',
      'GE': 'ge.com',
      'UPS': 'ups.com',
      'FDX': 'fedex.com',
      'DAL': 'delta.com',
      'UAL': 'united.com',
      'AAL': 'aa.com',
      'LUV': 'southwest.com',
      'MAR': 'marriott.com',
      'HLT': 'hilton.com',
      'MGM': 'mgmresorts.com',
      'WYNN': 'wynnresorts.com',
      'DRI': 'darden.com',
      'CAKE': 'thecheesecakefactory.com',
      'T': 'att.com',
      'VZ': 'verizon.com',
      'TMUS': 't-mobile.com',
      'CMCSA': 'comcast.com',
      'DG': 'dollargeneral.com',
      'DLTR': 'dollartree.com',
      'ROST': 'rossstores.com',
      'TJX': 'tjx.com',
      'GPS': 'gap.com',
      'ANF': 'abercrombie.com',
      'AEO': 'ae.com',
      'LULU': 'lululemon.com',
      'UA': 'underarmour.com',
      'SKX': 'skechers.com',
      'CROX': 'crocs.com',
      'PVH': 'pvh.com',
      'RL': 'ralphlauren.com',
      'TPR': 'tapestry.com',
      'VFC': 'vfc.com',
      'ETSY': 'etsy.com',
      'EBAY': 'ebay.com',
      'W': 'wayfair.com',
      'CHWY': 'chewy.com',
      'BKNG': 'booking.com',
      'EXPE': 'expedia.com',
      'TRIP': 'tripadvisor.com',
      'ATVI': 'activision.com',
      'EA': 'ea.com',
      'TTWO': 'take2games.com',
      'NTDOY': 'nintendo.com',
      'SNE': 'sony.com',
      'SONY': 'sony.com'
    }
    return websiteMap[symbol?.toUpperCase()] || null
  }

  const domain = getCompanyWebsite(symbol || '')

  // Multiple logo sources to try in order
  const getLogoUrls = () => {
    if (!domain) return []

    return [
      // 1. Logo.dev - usually works well
      `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`,
      // 2. Clearbit - good quality but may have CORS
      `https://logo.clearbit.com/${domain}`,
      // 3. Google Favicon - always works but lower quality
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      // 4. DuckDuckGo icons
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    ]
  }

  const logoUrls = getLogoUrls()

  // Reset state when symbol changes
  useEffect(() => {
    setCurrentLogoIndex(0)
    setAllFailed(false)
  }, [symbol])

  const handleClick = () => {
    if (clickable && domain) {
      window.open(`https://www.${domain}`, '_blank', 'noopener,noreferrer')
    }
  }

  const handleImageError = () => {
    // Try next logo source
    if (currentLogoIndex < logoUrls.length - 1) {
      setCurrentLogoIndex(prev => prev + 1)
    } else {
      // All sources failed
      setAllFailed(true)
    }
  }

  // Render fallback letter icon with colored background based on symbol
  const renderFallback = () => {
    // Generate consistent color based on symbol
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-teal-500 to-teal-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
    ]
    const colorIndex = symbol ? symbol.charCodeAt(0) % colors.length : 0
    const bgColor = colors[colorIndex]

    return (
      <div
        className={`${size} bg-gradient-to-br ${bgColor} rounded-lg flex items-center justify-center ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
        title={name || symbol}
      >
        <span className="text-white font-bold text-sm drop-shadow-sm">
          {symbol ? symbol.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
    )
  }

  // If no domain mapping or all sources failed, show fallback
  if (!domain || allFailed || logoUrls.length === 0) {
    return renderFallback()
  }

  const currentUrl = logoUrls[currentLogoIndex]

  return (
    <div
      className={`${size} rounded-lg overflow-hidden bg-white flex items-center justify-center ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all' : ''}`}
      onClick={handleClick}
      title={name || symbol}
    >
      <img
        key={currentUrl} // Force re-render on URL change
        src={currentUrl}
        alt={`${name || symbol} logo`}
        className="w-full h-full object-contain p-0.5"
        onError={handleImageError}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  )
}

export default CompanyLogo
