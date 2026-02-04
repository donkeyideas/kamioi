import React, { useEffect } from 'react'
import { useDemo } from '../../context/DemoContext'
import BusinessDashboard from '../BusinessDashboard'

const DemoBusinessDashboard = () => {
  const { enableDemoMode, setDemoAccountType } = useDemo()

  useEffect(() => {
    enableDemoMode('business')
    setDemoAccountType('business')
  }, [])

  // Render the actual BusinessDashboard - it will use demo data from DemoContext
  return <BusinessDashboard />
}

export default DemoBusinessDashboard
