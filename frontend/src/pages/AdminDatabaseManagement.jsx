import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const AdminDatabaseManagement = () => {
  const { admin, isInitialized, loading: authLoading } = useAuth();
  const { isLightMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [deletingType, setDeletingType] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { accountType, dataType }

  // Database Health State
  const [auditResults, setAuditResults] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [cleanupInProgress, setCleanupInProgress] = useState(null);
  const [cleanupResults, setCleanupResults] = useState(null);

  useEffect(() => {
    // Wait for AuthContext to initialize before loading stats
    if (isInitialized && !authLoading) {
      // Clear stats first to force fresh load
      setStats(null);
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, authLoading]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🚀 FIX: Get token - check AuthContext first, then localStorage
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('admin_token_3') || localStorage.getItem('authToken');
      
      if (!token && !admin) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Use token from localStorage or wait a moment for it to be available
      const finalToken = token || (admin ? `admin_token_${admin.id}` : null);
      
      if (!finalToken) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
      // Add cache-busting timestamp to force fresh data
      const response = await axios.get(`${apiBaseUrl}/api/admin/database/stats?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${finalToken}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.error || 'Failed to load database statistics');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load database statistics');
    } finally {
      setLoading(false);
      // Dispatch page load completion event for Loading Report
      window.dispatchEvent(new CustomEvent('admin-page-load-complete', {
        detail: { pageId: 'database' }
      }));
    }
  };

  const handleDeleteByType = async (accountType, dataType) => {
    // Show confirmation modal instead of browser confirm
    setPendingDelete({ accountType, dataType });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    
    const { accountType, dataType } = pendingDelete;
    const confirmationKey = `${accountType}_${dataType}`;
    const confirmationText = `DELETE ${accountType.toUpperCase()} ${dataType.toUpperCase()}`;

    setShowConfirmModal(false);
    setPendingDelete(null);

    try {
      setDeletingType(confirmationKey);
      setDeleteError(null);
      setDeleteSuccess(null);
      
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('admin_token_3') || localStorage.getItem('authToken') || (admin ? `admin_token_${admin.id}` : null);
      if (!token) {
        setDeleteError('No authentication token found. Please log in again.');
        setDeletingType(null);
        return;
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
      const response = await axios.post(
        `${apiBaseUrl}/api/admin/database/delete-by-type`,
        { 
          account_type: accountType,
          data_type: dataType,
          confirmation: confirmationText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setDeleteSuccess(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} deleted successfully for ${accountType} (${response.data.deleted_count || 0} items)`);
        setTimeout(() => {
          loadStats();
        }, 1000);
      } else {
        setDeleteError(response.data.error || `Failed to delete ${dataType}`);
      }
    } catch (err) {
      setDeleteError(err.response?.data?.error || err.message || `Failed to delete ${dataType}`);
    } finally {
      setDeletingType(null);
    }
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmation !== 'DELETE ALL DATA') {
      setDeleteError('Please type "DELETE ALL DATA" to confirm');
      return;
    }

    if (!window.confirm('⚠️ WARNING: This will DELETE ALL DATA from the database. This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(null);
      
      // Use same token retrieval as other admin components
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('admin_token_3') || localStorage.getItem('authToken') || (admin ? `admin_token_${admin.id}` : null);
      if (!token) {
        setDeleteError('No authentication token found. Please log in again.');
        setDeleting(false);
        return;
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';
      const response = await axios.post(
        `${apiBaseUrl}/api/admin/database/delete-all`,
        { confirmation: 'DELETE ALL DATA' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setDeleteSuccess('All data deleted successfully');
        setDeleteConfirmation('');
        // Reload stats after deletion
        setTimeout(() => {
          loadStats();
        }, 1000);
      } else {
        setDeleteError(response.data.error || 'Failed to delete data');
      }
    } catch (err) {
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete data');
    } finally {
      setDeleting(false);
    }
  };

  // Database Health Functions
  const runFullAudit = async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);

      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('admin_token_3') || localStorage.getItem('authToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';

      const response = await axios.get(`${apiBaseUrl}/api/admin/database/full-audit`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAuditResults(response.data);
      } else {
        setAuditError(response.data.error || 'Failed to run audit');
      }
    } catch (err) {
      setAuditError(err.response?.data?.error || err.message || 'Failed to run audit');
    } finally {
      setAuditLoading(false);
    }
  };

  const runCleanup = async (table, dryRun = true) => {
    try {
      setCleanupInProgress(table);
      setCleanupResults(null);

      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('admin_token_3') || localStorage.getItem('authToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111';

      const endpoint = table === 'all'
        ? `${apiBaseUrl}/api/admin/database/cleanup/all?dry_run=${dryRun}`
        : `${apiBaseUrl}/api/admin/database/cleanup/${table}?dry_run=${dryRun}`;

      const response = await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCleanupResults(response.data);
        // Refresh audit after cleanup
        if (!dryRun) {
          setTimeout(() => runFullAudit(), 1000);
        }
      }
    } catch (err) {
      setCleanupResults({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setCleanupInProgress(null);
    }
  };

  const StatCard = ({ title, value, color = 'blue' }) => (
    <div className={`rounded-lg p-4 ${isLightMode ? 'bg-white border border-gray-200' : 'bg-white/5 border border-white/10'}`}>
      <div className={`${getSubtextClass()} text-sm mb-1`}>{title}</div>
      <div className={`text-2xl font-bold text-${color}-400`}>{value.toLocaleString()}</div>
    </div>
  );

  const RoleSection = ({ role, data, color }) => {
    const accountType = role.toLowerCase();
    const confirmationKey = (dataType) => `${accountType}_${dataType}`;
    
    return (
      <div className={getCardClass()}>
        <h3 className={`text-xl font-bold mb-4 text-${color}-400 capitalize`}>{role}</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <StatCard title="Users" value={data.users} color={color} />
          <StatCard title="Transactions" value={data.transactions} color={color} />
          <StatCard title="Goals" value={data.goals} color={color} />
          <StatCard title="Notifications" value={data.notifications} color={color} />
          <StatCard title="Round-up Allocations" value={data.round_up_allocations || 0} color={color} />
        </div>
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-bold mb-3 text-gray-300">Delete Options</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['users', 'transactions', 'goals', 'notifications', 'round_up_allocations'].map((dataType) => {
              const key = confirmationKey(dataType);
              const isDeleting = deletingType === key;
              
              // Format display name
              const displayName = dataType === 'round_up_allocations' 
                ? 'Round-up Allocations' 
                : dataType.charAt(0).toUpperCase() + dataType.slice(1);
              
              return (
                <div key={dataType} className="bg-gray-700 rounded p-3">
                  <div className="text-xs text-gray-400 mb-2">{displayName}</div>
                  <button
                    onClick={() => handleDeleteByType(accountType, dataType)}
                    disabled={isDeleting}
                    className={`w-full px-2 py-1 rounded text-xs font-bold ${
                      isDeleting
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Wait for auth to initialize
  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Management</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Initializing authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Management</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading database statistics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Database Management</h1>
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-200">Error: {error}</p>
          </div>
          <button
            onClick={loadStats}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const ConfirmModal = () => {
    if (!showConfirmModal || !pendingDelete) return null;
    
    const { accountType, dataType } = pendingDelete;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-md border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-xl font-bold text-red-400 mb-4">Confirm Deletion</h3>
          <p className="text-gray-300 mb-6">
            WARNING: This will DELETE ALL <strong className="text-white">{dataType.toUpperCase()}</strong> for{' '}
            <strong className="text-white">{accountType.toUpperCase()}</strong> account type.
            <br /><br />
            This action cannot be undone. Are you absolutely sure?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setPendingDelete(null);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getTextColor = () => (isLightMode ? 'text-gray-800' : 'text-white')
  const getSubtextClass = () => (isLightMode ? 'text-gray-600' : 'text-gray-400')
  const getCardClass = () => `glass-card p-6 ${isLightMode ? 'bg-white/80 border border-gray-200' : 'border border-white/10'}`

  return (
    <div className="space-y-6">
      <ConfirmModal />
      <div className={getCardClass()}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${getTextColor()}`}>Database Management</h1>
            <p className={`${getSubtextClass()} mt-1`}>Review and manage system data</p>
          </div>
          <button
            onClick={loadStats}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Total Statistics */}
      {stats && (
        <>
          <div className={getCardClass()}>
            <h2 className={`text-2xl font-bold mb-4 ${getTextColor()}`}>Total Database Statistics</h2>
              
              {deleteSuccess && (
                <div className={`rounded p-3 mb-4 ${isLightMode ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-green-900 text-green-200 border border-green-700'}`}>
                  <p>{deleteSuccess}</p>
                </div>
              )}
              
              {deleteError && (
                <div className={`rounded p-3 mb-4 ${isLightMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-red-800 text-red-200 border border-red-600'}`}>
                  <p>{deleteError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard title="Total Users" value={stats.total.users} color="blue" />
                <StatCard title="Total Transactions" value={stats.total.transactions} color="green" />
                <StatCard title="Total Goals" value={stats.total.goals} color="purple" />
                <StatCard title="Total Notifications" value={stats.total.notifications} color="yellow" />
                <StatCard title="Round-up Allocations" value={stats.total.round_up_allocations} color="orange" />
                <StatCard title="LLM Mappings" value={stats.total.llm_mappings} color="pink" />
              </div>
            </div>

            {/* Breakdown by Role */}
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold mb-4 ${getTextColor()}`}>Breakdown by User Type</h2>
              <RoleSection role="Individual" data={stats.individual} color="blue" />
              <RoleSection role="Family" data={stats.family} color="green" />
              <RoleSection role="Business" data={stats.business} color="purple" />
              <RoleSection role="Admin" data={stats.admin} color="yellow" />
              {stats.other && (stats.other.transactions > 0 || stats.other.users > 0 || stats.other.goals > 0 || stats.other.notifications > 0) && (
                <RoleSection role="Other (Invalid/Null account_type)" data={stats.other} color="red" />
              )}
            </div>

            {/* Users Breakdown - Shows which users have transactions */}
            {stats.users_breakdown && stats.users_breakdown.length > 0 && (
              <div className={getCardClass()}>
                <h2 className={`text-2xl font-bold mb-4 ${getTextColor()}`}>Transactions by User</h2>
                <p className={`${getSubtextClass()} mb-4 text-sm`}>
                  This shows which users have transactions. The &quot;Total Transactions&quot; above (206) is the sum across ALL users.
                  Your business dashboard shows 0 because user 108 (B8469686) has 0 transactions.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`border-b ${isLightMode ? 'border-gray-200' : 'border-gray-700'}`}>
                        <th className={`pb-2 ${getSubtextClass()}`}>User ID</th>
                        <th className={`pb-2 ${getSubtextClass()}`}>Email</th>
                        <th className={`pb-2 ${getSubtextClass()}`}>Account Number</th>
                        <th className={`pb-2 ${getSubtextClass()}`}>Account Type</th>
                        <th className={`pb-2 ${getSubtextClass()} text-right`}>Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.users_breakdown.map((user, idx) => (
                        <tr key={idx} className={`border-b ${isLightMode ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-700 hover:bg-gray-800/40'}`}>
                          <td className="py-2">{user.user_id}</td>
                          <td className="py-2">{user.email}</td>
                          <td className="py-2">{user.account_number}</td>
                          <td className="py-2 capitalize">{user.account_type}</td>
                          <td className="py-2 text-right font-bold">
                            {user.transactions > 0 ? (
                              <span className="text-green-400">{user.transactions}</span>
                            ) : (
                              <span className="text-gray-500">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Database Health Section */}
            <div className={getCardClass()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${getTextColor()}`}>🔍 Database Health Audit</h2>
                  <p className={`${getSubtextClass()} mt-1`}>Detect and clean orphaned records across all tables</p>
                </div>
                <button
                  onClick={runFullAudit}
                  disabled={auditLoading}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    auditLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {auditLoading ? 'Running Audit...' : 'Run Full Audit'}
                </button>
              </div>

              {auditError && (
                <div className={`rounded p-3 mb-4 ${isLightMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-red-800 text-red-200 border border-red-600'}`}>
                  <p>{auditError}</p>
                </div>
              )}

              {auditResults && (
                <div className="space-y-4">
                  {/* Health Status Banner */}
                  <div className={`rounded-lg p-4 ${
                    auditResults.summary.health_status === 'healthy'
                      ? (isLightMode ? 'bg-green-100 border border-green-200' : 'bg-green-900/30 border border-green-700')
                      : auditResults.summary.health_status === 'critical'
                        ? (isLightMode ? 'bg-red-100 border border-red-200' : 'bg-red-900/30 border border-red-700')
                        : (isLightMode ? 'bg-yellow-100 border border-yellow-200' : 'bg-yellow-900/30 border border-yellow-700')
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {auditResults.summary.health_status === 'healthy' ? '✅' : auditResults.summary.health_status === 'critical' ? '🚨' : '⚠️'}
                        </span>
                        <div>
                          <h3 className={`font-bold ${
                            auditResults.summary.health_status === 'healthy' ? 'text-green-600' :
                            auditResults.summary.health_status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            Database Health: {auditResults.summary.health_status.toUpperCase()}
                          </h3>
                          <p className={getSubtextClass()}>
                            {auditResults.summary.total_orphans} orphaned records found across {auditResults.summary.total_tables_audited} tables
                          </p>
                        </div>
                      </div>
                      {auditResults.summary.total_orphans > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => runCleanup('all', true)}
                            disabled={cleanupInProgress}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              cleanupInProgress ? 'bg-gray-600 text-gray-400' : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            }`}
                          >
                            {cleanupInProgress === 'all' ? 'Running...' : 'Preview Cleanup'}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('This will permanently delete all orphaned records. Continue?')) {
                                runCleanup('all', false);
                              }
                            }}
                            disabled={cleanupInProgress}
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              cleanupInProgress ? 'bg-gray-600 text-gray-400' : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            Clean All
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Issues List */}
                  {(auditResults.data.critical_issues.length > 0 || auditResults.data.warnings.length > 0) && (
                    <div className={`rounded-lg p-4 ${isLightMode ? 'bg-gray-100 border border-gray-200' : 'bg-gray-800/50 border border-gray-700'}`}>
                      {auditResults.data.critical_issues.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-red-500 font-bold mb-2">🚨 Critical Issues:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {auditResults.data.critical_issues.map((issue, idx) => (
                              <li key={idx} className="text-red-400 text-sm">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {auditResults.data.warnings.length > 0 && (
                        <div>
                          <h4 className="text-yellow-500 font-bold mb-2">⚠️ Warnings:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {auditResults.data.warnings.map((warning, idx) => (
                              <li key={idx} className="text-yellow-400 text-sm">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table-by-Table Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(auditResults.data.tables).map(([tableName, tableData]) => (
                      <div
                        key={tableName}
                        className={`rounded-lg p-4 ${
                          tableData.total_orphans > 0
                            ? (isLightMode ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-700')
                            : (isLightMode ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-700')
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold text-sm ${getTextColor()}`}>
                            {tableName.replace(/_/g, ' ')}
                          </h4>
                          {tableData.total_orphans > 0 ? (
                            <span className="text-red-500 text-xs">🔴 {tableData.total_orphans}</span>
                          ) : (
                            <span className="text-green-500 text-xs">✓</span>
                          )}
                        </div>
                        {tableData.total_orphans > 0 && (
                          <div className="text-xs text-gray-400 space-y-1">
                            {Object.entries(tableData).filter(([k]) => k !== 'total_orphans').map(([key, val]) => (
                              val > 0 && <p key={key}>{key.replace(/_/g, ' ')}: {val}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Cleanup Results */}
                  {cleanupResults && (
                    <div className={`rounded-lg p-4 ${
                      cleanupResults.success
                        ? (isLightMode ? 'bg-blue-100 border border-blue-200' : 'bg-blue-900/30 border border-blue-700')
                        : (isLightMode ? 'bg-red-100 border border-red-200' : 'bg-red-900/30 border border-red-700')
                    }`}>
                      {cleanupResults.success ? (
                        <div>
                          <h4 className="font-bold text-blue-500 mb-2">
                            {cleanupResults.dry_run ? '🔍 Preview Results (Dry Run)' : '✅ Cleanup Complete'}
                          </h4>
                          <p className={getSubtextClass()}>{cleanupResults.message}</p>
                          {cleanupResults.results && (
                            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                              {Object.entries(cleanupResults.results).map(([key, val]) => (
                                val > 0 && (
                                  <div key={key} className={`${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded p-2`}>
                                    <span className={getSubtextClass()}>{key}:</span> <span className="font-bold">{val}</span>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-bold text-red-500">❌ Cleanup Failed</h4>
                          <p className="text-red-400">{cleanupResults.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!auditResults && !auditLoading && (
                <div className={`text-center py-8 ${getSubtextClass()}`}>
                  <p>Click &quot;Run Full Audit&quot; to scan all database tables for orphaned records</p>
                </div>
              )}
            </div>

            {/* Delete All Data Section */}
            <div className={`rounded-lg p-6 ${isLightMode ? 'bg-red-50 border border-red-200' : 'bg-red-900 border-2 border-red-700'}`}>
              <h2 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-red-700' : 'text-red-200'}`}>⚠️ Danger Zone</h2>
              <p className={`${isLightMode ? 'text-red-600' : 'text-red-200'} mb-4`}>
                This will permanently delete ALL data from the database. This action cannot be undone.
              </p>
              
              {deleteSuccess && (
                <div className={`rounded p-3 mb-4 ${isLightMode ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-green-900 text-green-200 border border-green-700'}`}>
                  <p>{deleteSuccess}</p>
                </div>
              )}
              
              {deleteError && (
                <div className={`rounded p-3 mb-4 ${isLightMode ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-red-800 text-red-200 border border-red-600'}`}>
                  <p>{deleteError}</p>
                </div>
              )}

              <div className="mb-4">
                <label className={`block mb-2 ${isLightMode ? 'text-red-700' : 'text-red-200'}`}>
                  Type <strong>&quot;DELETE ALL DATA&quot;</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className={`w-full rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${isLightMode ? 'bg-white border border-red-200 text-gray-900' : 'bg-gray-800 border border-red-600 text-white'}`}
                  placeholder="DELETE ALL DATA"
                  disabled={deleting}
                />
              </div>

              <button
                onClick={handleDeleteAll}
                disabled={deleting || deleteConfirmation !== 'DELETE ALL DATA'}
                className={`px-6 py-3 rounded font-bold ${
                  deleting || deleteConfirmation !== 'DELETE ALL DATA'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {deleting ? 'Deleting...' : 'Delete All Data'}
              </button>
            </div>
          </>
        )}
    </div>
  );
};

export default AdminDatabaseManagement;

