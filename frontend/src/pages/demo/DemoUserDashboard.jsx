import React, { useEffect } from 'react'
import { useDemo } from '../../context/DemoContext'
import UserDashboard from '../UserDashboard'

const DemoUserDashboard = () => {
  const { enableDemoMode, setDemoAccountType } = useDemo()

  useEffect(() => {
    enableDemoMode('individual')
    setDemoAccountType('individual')
  }, [])

  // Render the actual UserDashboard - it will use demo data from DemoContext
  return <UserDashboard />
}

export default DemoUserDashboard
