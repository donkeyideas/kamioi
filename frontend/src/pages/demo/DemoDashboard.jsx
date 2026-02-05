import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useDemo } from '../../context/DemoContext'

const DemoDashboard = () => {
  const location = useLocation()
  const { setDemoAccountType, enableDemoMode } = useDemo()

  // Enable demo mode on mount with correct account type based on URL
  useEffect(() => {
    // Determine account type from URL path
    const currentView = location.pathname.split('/demo/')[1] || 'user'
    const accountType = currentView === 'family' ? 'family'
      : currentView === 'business' ? 'business'
      : 'individual'

    // Clear any cached transaction data to ensure fresh demo data loads
    localStorage.removeItem('kamioi_transactions')
    localStorage.removeItem('kamioi_holdings')
    localStorage.removeItem('kamioi_portfolio_value')
    localStorage.removeItem('kamioi_total_roundups')
    localStorage.removeItem('kamioi_total_fees')
    localStorage.removeItem('kamioi_goals')

    // Enable demo mode with correct account type
    enableDemoMode(accountType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]) // Only re-run when URL changes

  // Update account type when URL changes (for switching between demo views)
  useEffect(() => {
    const currentView = location.pathname.split('/demo/')[1] || 'user'
    if (currentView === 'user') setDemoAccountType('individual')
    else if (currentView === 'family') setDemoAccountType('family')
    else if (currentView === 'business') setDemoAccountType('business')
  }, [location.pathname, setDemoAccountType])

  // Just render the actual dashboard - no banner
  return <Outlet />
}

export default DemoDashboard
