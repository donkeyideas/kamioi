import React, { useState, useEffect } from 'react'
import {
  Target,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Lightbulb,
  Edit,
  Trash2,
  X
} from 'lucide-react'
import RechartsChart from '../common/RechartsChart'
import { useData } from '../../context/DataContext'
import notificationService from '../../services/notificationService'

// Demo family goals for demo mode
const DEMO_FAMILY_GOALS = [
  {
    id: 'demo-goal-1',
    title: 'Family Vacation Fund',
    type: 'amount',
    target: 5000,
    current: 3750,
    progress: 75,
    timeframe: 12,
    status: 'active',
    endDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    aiRecommendations: [
      'Increase round-up amount to $2 to reach goal 2 months faster',
      'Consider adding Target and Costco purchases for more round-ups'
    ]
  },
  {
    id: 'demo-goal-2',
    title: 'College Savings',
    type: 'amount',
    target: 25000,
    current: 8500,
    progress: 34,
    timeframe: 36,
    status: 'active',
    endDate: new Date(Date.now() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    aiRecommendations: [
      'You\'re on track! Current pace will reach 105% of goal',
      'Consider diversifying with education-focused ETFs'
    ]
  },
  {
    id: 'demo-goal-3',
    title: 'Emergency Fund',
    type: 'amount',
    target: 10000,
    current: 10000,
    progress: 100,
    timeframe: 18,
    status: 'completed',
    endDate: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    aiRecommendations: []
  },
  {
    id: 'demo-goal-4',
    title: 'Family Round-Up Challenge',
    type: 'count',
    target: 500,
    current: 342,
    progress: 68,
    timeframe: 6,
    status: 'active',
    endDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(),
    aiRecommendations: [
      'Great progress! 158 more transactions to reach your goal',
      'Family has averaged 57 round-ups per month'
    ]
  }
]

const FamilyGoals = ({ user }) => {
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [showEditGoal, setShowEditGoal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'amount',
    target: '',
    timeframe: '12',
    description: ''
  })

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'

  // Goals data from context
  const { setGoals } = useData()

  // Family goals state - initialize with demo data in demo mode
  const [familyGoals, setFamilyGoals] = useState([])

  // Load demo goals in demo mode
  useEffect(() => {
    if (isDemoMode && familyGoals.length === 0) {
      console.log('FamilyGoals - Demo mode detected, loading demo goals')
      setFamilyGoals(DEMO_FAMILY_GOALS)
    }
  }, [isDemoMode])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'paused': return <Clock className="w-4 h-4" />
      case 'cancelled': return <Trash2 className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getGoalTypeIcon = (type) => {
    switch (type) {
      case 'amount': return <DollarSign className="w-5 h-5" />
      case 'company': return <TrendingUp className="w-5 h-5" />
      case 'count': return <BarChart3 className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  const handleCreateGoal = async (event) => {
    let originalText = 'Create Goal'
    try {
      // Validate goal data
      if (!newGoal.title.trim()) {
        await notificationService.addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter a goal title',
          timestamp: new Date().toISOString()
        })
        return
      }
      if (!newGoal.target || parseFloat(newGoal.target) <= 0) {
        await notificationService.addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter a valid target amount',
          timestamp: new Date().toISOString()
        })
        return
      }

      // Show loading state
      if (event && event.target) {
        const submitButton = event.target
        originalText = submitButton.textContent
        submitButton.textContent = 'Creating...'
        submitButton.disabled = true
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create goal object
      const goalData = {
        id: `demo-goal-${Date.now()}`,
        title: newGoal.title.trim(),
        type: newGoal.type,
        target: parseFloat(newGoal.target),
        current: 0,
        timeframe: parseInt(newGoal.timeframe),
        description: newGoal.description.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        progress: 0,
        endDate: new Date(Date.now() + parseInt(newGoal.timeframe) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        familyId: user?.family_id || user?.id || null,
        aiRecommendations: [
          'Set up automatic round-ups to make consistent progress',
          'Track your spending to find more investment opportunities'
        ]
      }

      // Add to local familyGoals state
      setFamilyGoals(prevGoals => [...prevGoals, goalData])

      // Also update context if available
      if (setGoals) {
        setGoals(prevGoals => [...(prevGoals || []), goalData])
      }

      // Reset form and close modal
      setShowCreateGoal(false)
      setNewGoal({
        title: '',
        type: 'amount',
        target: '',
        timeframe: '12',
        description: ''
      })

      await notificationService.addNotification({
        type: 'success',
        title: 'Goal Created',
        message: 'Family goal created successfully!',
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Create goal failed:', error)
      await notificationService.addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create family goal. Please try again.',
        timestamp: new Date().toISOString()
      })
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleEditGoal = (goalId) => {
    const goal = familyGoals.find(g => g.id === goalId)
    if (goal) {
      setSelectedGoal(goal)
      setShowEditGoal(true)
    }
  }

  const handleDeleteGoal = (goalId) => {
    const goal = familyGoals.find(g => g.id === goalId)
    if (goal) {
      setSelectedGoal(goal)
      setShowDeleteConfirm(true)
    }
  }

  const handleSaveEditGoal = async (event) => {
    let originalText = 'Save Changes'
    try {
      if (!selectedGoal) {
        await notificationService.addNotification({
          type: 'error',
          title: 'No Selection',
          message: 'No goal selected',
          timestamp: new Date().toISOString()
        })
        return
      }
      
      // Show loading state
      if (event && event.target) {
        originalText = event.target.textContent
        event.target.textContent = 'Saving...'
        event.target.disabled = true
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      setFamilyGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === selectedGoal.id ? { ...goal, ...selectedGoal } : goal
        )
      )
      
      setShowEditGoal(false)
      setSelectedGoal(null)
      
      await notificationService.addNotification({
        type: 'success',
        title: 'Goal Updated',
        message: 'Family goal updated successfully!',
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Update goal failed:', error)
      await notificationService.addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update family goal. Please try again.',
        timestamp: new Date().toISOString()
      })
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const confirmDeleteGoal = async (event) => {
    let originalText = 'Delete Goal'
    try {
      if (!selectedGoal) {
        await notificationService.addNotification({
          type: 'error',
          title: 'No Selection',
          message: 'No goal selected',
          timestamp: new Date().toISOString()
        })
        return
      }
      
      // Show loading state
      if (event && event.target) {
        originalText = event.target.textContent
        event.target.textContent = 'Deleting...'
        event.target.disabled = true
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Remove from local state
      setFamilyGoals(prevGoals => 
        prevGoals.filter(goal => goal.id !== selectedGoal.id)
      )
      
      setShowDeleteConfirm(false)
      setSelectedGoal(null)
      
      await notificationService.addNotification({
        type: 'success',
        title: 'Goal Deleted',
        message: `Family goal "${selectedGoal.title}" has been deleted.`,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Delete goal failed:', error)
      await notificationService.addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete family goal. Please try again.',
        timestamp: new Date().toISOString()
      })
    } finally {
      // Reset button state
      if (event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }



  const activeGoals = familyGoals.filter(goal => goal.status === 'active')
  const completedGoals = familyGoals.filter(goal => goal.status === 'completed')
  const totalInvested = familyGoals.reduce((sum, goal) => sum + (goal.current || 0), 0)

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-white">Family Investment Goals</h1>
            <p className="text-gray-400 mt-1">Set and track your family financial objectives</p>
        </div>
          <button 
            onClick={() => setShowCreateGoal(true)}
            className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg px-4 py-2 text-green-400 flex items-center space-x-2 transition-all"
          >
          <Plus className="w-4 h-4" />
          <span>Create Family Goal</span>
        </button>
      </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Family Goals</p>
                <p className="text-2xl font-bold text-white">{activeGoals.length}</p>
                <p className="text-green-400 text-sm flex items-center mt-1">
                  <Target className="w-4 h-4 mr-1" />
                  In progress
                </p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Family Invested</p>
                <p className="text-2xl font-bold text-white">${totalInvested.toLocaleString()}</p>
                <p className="text-green-400 text-sm flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Across all family goals
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed Family Goals</p>
                <p className="text-2xl font-bold text-white">{completedGoals.length}</p>
                <p className="text-green-400 text-sm flex items-center mt-1">
                  <Award className="w-4 h-4 mr-1" />
                  Family achievements
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-6">
        {familyGoals.map((goal) => (
          <div key={goal.id} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getGoalTypeIcon(goal.type)}
                <div>
                  <h3 className="text-xl font-semibold text-white">{goal.title}</h3>
                  <p className="text-gray-400 text-sm">
                    {goal.type === 'amount' && `$${goal.target.toLocaleString()} family target`}
                    {goal.type === 'company' && `${goal.company} stock investment`}
                    {goal.type === 'count' && `${goal.target} family round-up transactions`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${getStatusColor(goal.status)}`}>
                  {getStatusIcon(goal.status)}
                  <span className="capitalize">{goal.status}</span>
                </span>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => handleEditGoal(goal.id)}
                    className="text-green-400 hover:text-green-300 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-semibold">
                  {goal.type === 'amount' && `$${goal.current.toLocaleString()}`}
                  {goal.type === 'company' && `$${goal.current.toLocaleString()}`}
                  {goal.type === 'count' && `${goal.current} family transactions`}
                </span>
                <span className="text-white font-semibold">{goal.progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Family Target</p>
                <p className="text-white font-semibold">
                  {goal.type === 'amount' && `$${goal.target.toLocaleString()}`}
                  {goal.type === 'company' && `$${goal.target.toLocaleString()}`}
                  {goal.type === 'count' && `${goal.target} transactions`}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Timeframe</p>
                <p className="text-white font-semibold">{goal.timeframe} months</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">End Date</p>
                <p className="text-white font-semibold">
                  {goal.endDate ? new Date(goal.endDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not set'}
                </p>
              </div>
            </div>

            {/* AI Recommendations */}
            {goal.aiRecommendations && goal.aiRecommendations.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-green-400" />
                  <h4 className="text-green-400 font-semibold">Family AI Recommendations</h4>
                </div>
                <ul className="space-y-1">
                  {goal.aiRecommendations.map((rec, index) => (
                    <li key={index} className="text-gray-300 text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Goal Performance Chart */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Family Goal Progress Over Time</h3>
        {familyGoals.length > 0 ? (
          <RechartsChart 
            type="line" 
            height={300}
            data={(() => {
              // Generate chart data dynamically from actual goals
              // This should ideally come from API with historical progress data
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              const chartData = months.map((month, index) => {
                const dataPoint = { month }
                familyGoals.forEach(goal => {
                  if (goal.title) {
                    // Calculate progress based on goal's current value and timeline
                    const progressRatio = goal.current && goal.target ? (goal.current / goal.target) : 0
                    const monthsSinceStart = index + 1
                    const totalMonths = goal.timeframe || 12
                    const expectedProgress = Math.min(progressRatio, monthsSinceStart / totalMonths)
                    dataPoint[goal.title] = goal.target ? Math.round(goal.target * expectedProgress) : 0
                  }
                })
                return dataPoint
              })
              return chartData
            })()}
            xAxisKey="month"
            yAxisKey="value"
            lineKey="value"
            showTooltip={true}
            showGrid={true}
            showLegend={true}
            colors={['#10B981', '#3B82F6', '#F59E0B']}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-white text-lg font-medium mb-2">No family goals yet</h4>
              <p className="text-gray-400 text-sm">Create your first family goal to see progress tracking</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Family Goal Modal */}
      {showEditGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Family Goal</h3>
              <button 
                onClick={() => setShowEditGoal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Goal Title</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter family goal title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Amount</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe (months)</label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>6</option>
                  <option>12</option>
                  <option>24</option>
                  <option>36</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowEditGoal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEditGoal}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Family Goal Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Delete Family Goal</h3>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white mb-2">Are you sure you want to delete this family goal?</p>
              <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteGoal}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Family Goal</h3>
              <button 
                onClick={() => setShowCreateGoal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Family Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="Enter goal description"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Goal Type</label>
                <select 
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="amount">Total Amount</option>
                  <option value="company">Company-Specific</option>
                  <option value="count">Number of Round-Ups</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target</label>
                <input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                  placeholder={newGoal.type === 'amount' ? '5001' : newGoal.type === 'count' ? '100' : '1000'}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe (months)</label>
                <input
                  type="number"
                  value={newGoal.timeframe}
                  onChange={(e) => setNewGoal({...newGoal, timeframe: e.target.value})}
                  placeholder="12"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Why is this family goal important?"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={handleCreateGoal}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Create Family Goal
              </button>
              <button 
                onClick={() => setShowCreateGoal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
      </div>
    </div>
      )}
    </>
  )
}

export default FamilyGoals
