import React, { useEffect } from 'react'
import { useDemo } from '../../context/DemoContext'
import FamilyDashboard from '../FamilyDashboard'

const DemoFamilyDashboard = () => {
  const { enableDemoMode, setDemoAccountType } = useDemo()

  useEffect(() => {
    enableDemoMode('family')
    setDemoAccountType('family')
  }, [])

  // Render the actual FamilyDashboard - it will use demo data from DemoContext
  return <FamilyDashboard />
}

export default DemoFamilyDashboard
