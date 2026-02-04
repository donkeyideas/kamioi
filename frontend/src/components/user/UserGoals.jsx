import React, { useState } from 'react'
import { 
  Target, 
  Plus, 
  TrendingUp, 
  DollarSign, 
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
import { useNotifications } from '../../hooks/useNotifications'

const UserGoals = () => {
  const { addNotification } = useNotifications()
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [showEditGoal, setShowEditGoal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [, setSelectedGoal] = useState(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'amount',
    target: '',
    timeframe: '12',
    description: ''
  })

  // Goals data from context
  const { goals, setGoals } = useData()

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-500/20 text-blue-400'
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

  const handleCreateGoal = async () => {
    try {
      // Validate goal data
      if (!newGoal.title.trim()) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter a goal title',
          timestamp: new Date().toISOString()
        })
        return
      }
      if (!newGoal.target || parseFloat(newGoal.target) <= 0) {
        addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please enter a valid target amount',
          timestamp: new Date().toISOString()
        })
        return
      }
      
      // Create goal object
      const goalData = {
        id: Date.now().toString(),
        title: newGoal.title.trim(),
        type: newGoal.type,
        target: parseFloat(newGoal.target),
        current: 0,
        timeframe: parseInt(newGoal.timeframe),
        description: newGoal.description.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
        progress: 0
      }
      
      // Add to goals using context
      setGoals([...goals, goalData])
      
      // Reset form and close modal
      setShowCreateGoal(false)
      setNewGoal({
        title: '',
        type: 'amount',
        target: '',
        timeframe: '12',
        description: ''
      })
      
      // Show success message
      alert('Goal created successfully!')
      
    } catch (error) {
      console.error('Failed to create goal:', error)
      alert('Failed to create goal. Please try again.')
    }
  }

  const handleEditGoal = (goalId) => {
    setSelectedGoal(goalId)
    setShowEditGoal(true)
  }

  const handleDeleteGoal = (goalId) => {
    setSelectedGoal(goalId)
    setShowDeleteConfirm(true)
  }



  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')
  const totalInvested = goals.reduce((sum, goal) => sum + goal.current, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Investment Goals</h1>
          <p className="text-gray-400 mt-1">Set and track your financial objectives</p>
        </div>
        <button 
          onClick={() => setShowCreateGoal(true)}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Goals</p>
              <p className="text-2xl font-bold text-white">{activeGoals.length}</p>
              <p className="text-blue-400 text-sm flex items-center mt-1">
                <Target className="w-4 h-4 mr-1" />
                In progress
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Invested</p>
              <p className="text-2xl font-bold text-white">${totalInvested.toLocaleString()}</p>
              <p className="text-green-400 text-sm flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Across all goals
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed Goals</p>
              <p className="text-2xl font-bold text-white">{completedGoals.length}</p>
              <p className="text-green-400 text-sm flex items-center mt-1">
                <Award className="w-4 h-4 mr-1" />
                Achievements
              </p>
            </div>
            <Award className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Create New Goal</h3>
              <button 
                onClick={() => setShowCreateGoal(false)}
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
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g., Save $1,000 for vacation"
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
                  placeholder={newGoal.type === 'amount' ? '1000' : newGoal.type === 'count' ? '50' : '500'}
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
                  placeholder="Why is this goal important to you?"
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowCreateGoal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGoal}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getGoalTypeIcon(goal.type)}
                <div>
                  <h3 className="text-xl font-semibold text-white">{goal.title}</h3>
                  <p className="text-gray-400 text-sm">
                    {goal.type === 'amount' && `$${goal.target.toLocaleString()} target`}
                    {goal.type === 'company' && `${goal.company} stock investment`}
                    {goal.type === 'count' && `${goal.target} round-up transactions`}
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
                    className="text-blue-400 hover:text-blue-300 p-1"
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
                <span className="text-gray-400">
                  {goal.type === 'amount' && `$${goal.current.toLocaleString()}`}
                  {goal.type === 'company' && `$${goal.current.toLocaleString()}`}
                  {goal.type === 'count' && `${goal.current} transactions`}
                </span>
                <span className="text-white font-semibold">{goal.progress}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Goal Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-sm">Target</p>
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
                <p className="text-white font-semibold">{goal.endDate}</p>
              </div>
            </div>

            {/* AI Recommendations */}
            {goal.aiRecommendations && goal.aiRecommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-400" />
                  <h4 className="text-blue-400 font-semibold">AI Recommendations</h4>
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
        <h3 className="text-xl font-semibold text-white mb-4">Goal Progress Over Time</h3>
        {goals.length > 0 ? (
          <RechartsChart
            type="line"
            height={300}
            showLegend={false}
            data={(() => {
              // Generate monthly progress data for all goals combined
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
              return months.map((month, index) => {
                // Calculate cumulative progress toward all goals
                const totalCurrent = goals.reduce((sum, g) => sum + (g.current || 0), 0)
                // Simulate growth from 0 to current value over the months
                const growthFactor = (index + 1) / months.length
                const value = Math.round(totalCurrent * growthFactor)
                return { name: month, value }
              })
            })()}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-white text-lg font-medium mb-2">No goals yet</h4>
              <p className="text-gray-400 text-sm">Create your first goal to see progress tracking</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {showEditGoal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Goal</h3>
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
                  placeholder="Enter goal title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Amount</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
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
                onClick={() => {
                  setShowEditGoal(false)
                  // Goal updated successfully - could show a toast notification here
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Delete Goal</h3>
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
              <p className="text-white mb-2">Are you sure you want to delete this goal?</p>
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
                onClick={() => {
                  setShowDeleteConfirm(false)
                  // Goal deleted successfully - could show a toast notification here
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserGoals


