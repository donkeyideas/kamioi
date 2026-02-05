import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Mail, Eye, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useModal } from '../../context/ModalContext'
import { useNotifications } from '../../hooks/useNotifications'

// Demo family members data for demo mode
const DEMO_FAMILY_MEMBERS = [
  {
    id: 'demo-1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    role: 'Parent',
    status: 'Active',
    portfolio: '$45,230',
    portfolioValue: 45230,
    lastActive: '2 hours ago',
    joinDate: '2024-01-15',
    permissions: 'Full Access'
  },
  {
    id: 'demo-2',
    name: 'Sarah Doe',
    email: 'sarah.doe@email.com',
    role: 'Parent',
    status: 'Active',
    portfolio: '$38,450',
    portfolioValue: 38450,
    lastActive: '5 hours ago',
    joinDate: '2024-01-15',
    permissions: 'Full Access'
  },
  {
    id: 'demo-3',
    name: 'Emma Doe',
    email: 'emma.doe@email.com',
    role: 'Child',
    status: 'Active',
    portfolio: '$12,890',
    portfolioValue: 12890,
    lastActive: '1 day ago',
    joinDate: '2024-02-20',
    permissions: 'Limited Access'
  },
  {
    id: 'demo-4',
    name: 'Jake Doe',
    email: 'jake.doe@email.com',
    role: 'Child',
    status: 'Active',
    portfolio: '$8,320',
    portfolioValue: 8320,
    lastActive: '3 days ago',
    joinDate: '2024-03-10',
    permissions: 'View Only'
  }
]

const FamilyMembers = ({ user }) => {
  const { showInfoModal, showSuccessModal, showErrorModal } = useModal()
  const { addNotification } = useNotifications()
  const { isLightMode } = useTheme()
  const [showAddMember, setShowAddMember] = useState(false)
  const [showEditMember, setShowEditMember] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'child',
    permissions: 'view'
  })

  // Check if in demo mode
  const isDemoMode = localStorage.getItem('kamioi_demo_mode') === 'true'

  // Family members data from API or demo data
  const [familyMembers, setFamilyMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch family members on component mount
  useEffect(() => {
    fetchFamilyMembers()
  }, [isDemoMode])

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true)

      // In demo mode, use demo data
      if (isDemoMode) {
        console.log('FamilyMembers - Demo mode detected, loading demo family members')
        setFamilyMembers(DEMO_FAMILY_MEMBERS)
        setLoading(false)
        return
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kamioi_user_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setFamilyMembers(result.members || [])
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
      // Fallback to demo data on error if in demo mode
      if (isDemoMode) {
        setFamilyMembers(DEMO_FAMILY_MEMBERS)
      }
    } finally {
      setLoading(false)
    }
  }

  const getTextClass = () => {
    if (isLightMode) return 'text-gray-800'
    return 'text-white'
  }

  const getSubtextClass = () => {
    if (isLightMode) return 'text-gray-600'
    return 'text-white/90'
  }

  const getCardClass = () => {
    if (isLightMode) return 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    return 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-500/20 text-green-400'
      case 'Inactive': return 'bg-gray-500/20 text-gray-400'
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'Parent': return 'bg-blue-500/20 text-blue-400'
      case 'Child': return 'bg-purple-500/20 text-purple-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const handleAddMember = async (event) => {
    let originalText = 'Add Member'
    try {
      // Validate member data
      if (!newMember.name.trim()) {
        showErrorModal('Validation Error', 'Please enter the member\'s name')
        return
      }
      if (!newMember.email.trim() || !newMember.email.includes('@')) {
        showErrorModal('Validation Error', 'Please enter a valid email address')
        return
      }

      // Show loading state
      if (event && event.target) {
        const submitButton = event.target
        originalText = submitButton.textContent
        submitButton.textContent = 'Adding...'
        submitButton.disabled = true
      }

      // Create member object
      const memberData = {
        id: `demo-${Date.now()}`,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        role: newMember.role === 'parent' ? 'Parent' : 'Child',
        permissions: newMember.permissions === 'full' ? 'Full Access' : newMember.permissions === 'limited' ? 'Limited Access' : 'View Only',
        status: 'Pending',
        portfolio: '$0',
        portfolioValue: 0,
        lastActive: 'Just invited',
        joinDate: new Date().toISOString().split('T')[0],
        invitedAt: new Date().toISOString(),
        joinedAt: null
      }

      // In demo mode, add to local state directly
      if (isDemoMode) {
        setFamilyMembers(prev => [...prev, memberData])

        // Reset form and close modal
        setShowAddMember(false)
        setNewMember({
          name: '',
          email: '',
          role: 'child',
          permissions: 'view'
        })

        showSuccessModal('Success', 'Family member added successfully! An invitation has been sent.')
        addNotification({
          type: 'success',
          title: 'Family Member Added',
          message: `${memberData.name} has been added to the family.`,
          timestamp: new Date()
        })
        return
      }

      // Call backend to add member
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_token')}`
        },
        body: JSON.stringify(memberData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Add to local state
          setFamilyMembers(prev => [...prev, result.data || memberData])

          // Reset form and close modal
          setShowAddMember(false)
          setNewMember({
            name: '',
            email: '',
            role: 'child',
            permissions: 'view'
          })

          showSuccessModal('Success', 'Family member added successfully! An invitation has been sent.')
          addNotification({
            type: 'success',
            title: 'Family Member Added',
            message: `${memberData.name} has been added to the family.`,
            timestamp: new Date()
          })
        } else {
          throw new Error(result.error || 'Failed to add member')
        }
      } else {
        throw new Error('Network error')
      }

    } catch (error) {
      console.error('Add member failed:', error)
      showErrorModal('Error', 'Failed to add family member. Please try again.')
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleEditMember = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId)
    setSelectedMember(member)
    setShowEditMember(true)
  }

  const handleDeleteMember = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId)
    setSelectedMember(member)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteMember = async (event) => {
    let originalText = 'Remove Member'
    try {
      if (!selectedMember) {
        showErrorModal('Error', 'No member selected')
        return
      }

      // Show loading state
      if (event && event.target) {
        originalText = event.target.textContent
        event.target.textContent = 'Removing...'
        event.target.disabled = true
      }

      // In demo mode, remove from local state directly
      if (isDemoMode) {
        setFamilyMembers(prev => prev.filter(m => m.id !== selectedMember.id))

        showSuccessModal('Success', `${selectedMember.name} has been removed from the family.`)
        addNotification({
          type: 'info',
          title: 'Family Member Removed',
          message: `${selectedMember.name} has been removed from the family.`,
          timestamp: new Date()
        })
        setShowDeleteConfirm(false)
        setSelectedMember(null)
        return
      }

      // Call backend to remove member
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/members/${selectedMember.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_token')}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Remove from local state
          setFamilyMembers(prev => prev.filter(m => m.id !== selectedMember.id))

          showSuccessModal('Success', `${selectedMember.name} has been removed from the family.`)
          addNotification({
            type: 'info',
            title: 'Family Member Removed',
            message: `${selectedMember.name} has been removed from the family.`,
            timestamp: new Date()
          })
          setShowDeleteConfirm(false)
          setSelectedMember(null)
        } else {
          throw new Error(result.error || 'Failed to remove member')
        }
      } else {
        throw new Error('Network error')
      }

    } catch (error) {
      console.error('Remove member failed:', error)
      showErrorModal('Error', 'Failed to remove family member. Please try again.')
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  const handleViewMember = (member) => {
    // Handle both demo data format and API data format
    const portfolioValue = typeof member.portfolio === 'string'
      ? member.portfolio
      : (member.portfolioValue ? `$${member.portfolioValue.toLocaleString()}` : '$0')
    const statusLower = (member.status || 'active').toLowerCase()
    const isActive = statusLower === 'active'

    const memberDetails = (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{member.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? 'text-green-400 bg-green-400/20' : 'text-gray-400 bg-gray-400/20'
          }`}>
            {member.status || 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <p className="text-white font-medium">{member.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Role</label>
            <p className="text-white font-medium capitalize">{member.role}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Portfolio Value</label>
            <p className="text-white font-medium">{portfolioValue}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Last Active</label>
            <p className="text-white font-medium">{member.lastActive || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Join Date</label>
            <p className="text-white font-medium">{member.joinDate || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-400">Permissions</label>
            <p className="text-white font-medium">{member.permissions || 'View Only'}</p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2">Family Member Information</h4>
          <p className="text-gray-300 text-sm">
            This family member has {(member.role || 'member').toLowerCase()} access to the family account.
            {isActive ? ' They are currently active and can manage family finances.' : ' They are currently inactive.'}
          </p>
        </div>
      </div>
    )

    showInfoModal(
      'Family Member Details',
      memberDetails,
      'info'
    )
  }

  const handleSendInvite = async (memberId, event) => {
    let originalText = 'Send Invite'
    try {
      // Find the member
      const member = familyMembers.find(m => m.id === memberId)
      if (!member) {
        showErrorModal('Error', 'Member not found')
        return
      }

      // Show loading state
      if (event && event.target) {
        originalText = event.target.textContent
        event.target.textContent = 'Sending...'
        event.target.disabled = true
      }

      // In demo mode, simulate success
      if (isDemoMode) {
        // Simulate a short delay for realistic feel
        await new Promise(resolve => setTimeout(resolve, 500))

        showSuccessModal('Success', `Invitation sent successfully to ${member.email}!`)
        addNotification({
          type: 'success',
          title: 'Invitation Sent',
          message: `Invitation sent to ${member.email}`,
          timestamp: new Date()
        })
        return
      }

      // Call backend to send invite
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const response = await fetch(`${apiBaseUrl}/api/family/members/${memberId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kamioi_token')}`
        },
        body: JSON.stringify({
          email: member.email,
          name: member.name,
          familyName: 'Your Family' // This could come from family context
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          showSuccessModal('Success', `Invitation sent successfully to ${member.email}!`)
          addNotification({
            type: 'success',
            title: 'Invitation Sent',
            message: `Invitation sent to ${member.email}`,
            timestamp: new Date()
          })
        } else {
          throw new Error(result.error || 'Failed to send invitation')
        }
      } else {
        throw new Error('Network error')
      }

    } catch (error) {
      console.error('Send invite failed:', error)
      showErrorModal('Error', 'Failed to send invitation. Please try again.')
    } finally {
      // Reset button state
      if (event && event.target) {
        event.target.textContent = originalText
        event.target.disabled = false
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${getTextClass()}`}>Family Members</h1>
          <p className={`${getSubtextClass()} mt-1`}>Manage your family members and their permissions</p>
        </div>
        <button 
          onClick={() => setShowAddMember(true)}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md mx-4">
            <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Add Family Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="Enter family member name"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="Enter email address"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Role</label>
                <select 
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                </select>
              </div>

              <div>
                <label className={`block ${getSubtextClass()} text-sm mb-2`}>Permissions</label>
                <select 
                  value={newMember.permissions}
                  onChange={(e) => setNewMember({...newMember, permissions: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="view">View Only</option>
                  <option value="limited">Limited Access</option>
                  <option value="full">Full Access</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button 
                onClick={handleAddMember}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 transition-all"
              >
                Add Member
              </button>
              <button 
                onClick={() => setShowAddMember(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 py-2 text-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.map((member) => (
          <div key={member.id} className={getCardClass()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className={`${getTextClass()} font-semibold`}>{member.name}</h3>
                  <p className={`${getSubtextClass()} text-sm`}>{member.email}</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleEditMember(member.id)}
                  className="text-blue-400 hover:text-blue-300 p-1"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteMember(member.id, e)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`${getSubtextClass()} text-sm`}>Role</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(member.role)}`}>
                  {member.role}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`${getSubtextClass()} text-sm`}>Status</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`${getSubtextClass()} text-sm`}>Portfolio</span>
                <span className={`${getTextClass()} font-semibold`}>{member.portfolio}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`${getSubtextClass()} text-sm`}>Last Active</span>
                <span className={`${getSubtextClass()} text-sm`}>{member.lastActive}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className={`${getSubtextClass()} text-sm`}>Permissions</span>
                <span className={`${getSubtextClass()} text-sm`}>{member.permissions}</span>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={(e) => handleSendInvite(member.id, e)}
                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg px-3 py-2 text-blue-400 text-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Mail className="w-3 h-3" />
                  <span>Invite</span>
                </button>
                <button 
                  onClick={() => handleViewMember(member)}
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg px-3 py-2 text-gray-400 text-sm transition-all flex items-center justify-center space-x-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>View</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Family Statistics */}
      <div className={getCardClass()}>
        <h3 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Family Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{familyMembers.length}</div>
            <div className={`${getSubtextClass()} text-sm`}>Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {familyMembers.filter(m => m.status === 'Active').length}
            </div>
            <div className={`${getSubtextClass()} text-sm`}>Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {familyMembers.filter(m => m.role === 'Parent').length}
            </div>
            <div className={`${getSubtextClass()} text-sm`}>Parents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {familyMembers.filter(m => m.role === 'Child').length}
            </div>
            <div className={`${getSubtextClass()} text-sm`}>Children</div>
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      {showEditMember && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Edit Family Member</h3>
              <button 
                onClick={() => setShowEditMember(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input 
                  type="text" 
                  defaultValue={selectedMember.name}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input 
                  type="email" 
                  defaultValue={selectedMember.email}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Parent" selected={selectedMember.role === 'Parent'}>Parent</option>
                  <option value="Child" selected={selectedMember.role === 'Child'}>Child</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
                <select className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="view" selected={selectedMember.permissions === 'view'}>View Only</option>
                  <option value="limited" selected={selectedMember.permissions === 'limited'}>Limited Access</option>
                  <option value="full" selected={selectedMember.permissions === 'full'}>Full Access</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowEditMember(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Family member updated:', selectedMember.id)
                  setShowEditMember(false)
                  setSelectedMember(null)
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
      {showDeleteConfirm && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Remove Family Member</h3>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-white font-medium">Are you sure you want to remove this family member?</p>
                  <p className="text-gray-300 text-sm mt-1">
                    {selectedMember.name} ({selectedMember.email}) will be removed from the family.
                  </p>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-400 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. The member will lose access to all family data and investments.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteMember}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyMembers
