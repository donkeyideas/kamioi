import React, { useEffect } from 'react'
import { useDemo } from '../../context/DemoContext'
import AdminDashboard from '../AdminDashboard'

const DemoAdminDashboard = () => {
  const { enableDemoMode, setDemoAccountType } = useDemo()

  useEffect(() => {
    enableDemoMode('admin')
    setDemoAccountType('admin')
  }, [])

  // Render the actual AdminDashboard - it will use demo data from DemoContext
  return <AdminDashboard />
}

export default DemoAdminDashboard
