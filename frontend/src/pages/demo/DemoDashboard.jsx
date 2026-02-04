import React, { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { User, Users, Building2, Shield, LogOut } from 'lucide-react'
import { useDemo } from '../../context/DemoContext'

const DemoDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setDemoAccountType, enableDemoMode } = useDemo()

  // Enable demo mode on mount
  useEffect(() => {
    enableDemoMode()
  }, [])

  // Determine current view from URL
  const currentView = location.pathname.split('/demo/')[1] || 'user'

  const handleViewChange = (view) => {
    if (view === 'user') setDemoAccountType('individual')
    else if (view === 'family') setDemoAccountType('family')
    else if (view === 'business') setDemoAccountType('business')
    navigate(`/demo/${view}`)
  }

  const handleExitDemo = () => {
    localStorage.removeItem('kamioi_demo_session')
    localStorage.removeItem('kamioi_demo_mode')
    navigate('/login')
  }

  const views = [
    { id: 'user', label: 'Individual', icon: User },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'business', label: 'Business', icon: Building2 },
    { id: 'admin', label: 'Admin', icon: Shield }
  ]

  return (
    <div className="min-h-screen">
      {/* Demo Mode Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white font-bold text-sm">DEMO MODE</span>
              </div>
              <span className="text-white/80 text-sm hidden sm:inline">
                Explore the platform with sample data
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleViewChange(view.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all text-sm ${
                    currentView === view.id
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <view.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{view.label}</span>
                </button>
              ))}

              <button
                onClick={handleExitDemo}
                className="flex items-center space-x-1 ml-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Render the actual dashboard */}
      <Outlet />
    </div>
  )
}

export default DemoDashboard
