import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { FileText, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Search, Tag, Eye } from 'lucide-react'

const ContentSeoAnalysis = () => {
  const { isLightMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPost, setExpandedPost] = useState(null)
  const [sortField, setSortField] = useState('seo_score')
  const [sortDir, setSortDir] = useState('desc')

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  const getTableRowClass = () => isLightMode
    ? 'border-b border-gray-100 hover:bg-gray-50'
    : 'border-b border-white/5 hover:bg-white/5'
  const getTableHeaderClass = () => isLightMode
    ? 'text-gray-500 border-b border-gray-200'
    : 'text-gray-400 border-b border-white/10'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const res = await fetch(`${apiBaseUrl}/api/admin/seo-geo/content-audit`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err) {
      console.error('Error fetching content audit:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
    if (score >= 50) return isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400'
    return isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400'
  }

  const getSeverityBadge = (severity) => {
    const styles = {
      critical: isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400',
      warning: isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-400',
      info: isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'
    }
    return styles[severity] || styles.info
  }

  const sortedPosts = () => {
    if (!data?.posts) return []
    return [...data.posts].sort((a, b) => {
      const aVal = a[sortField] || 0
      const bVal = b[sortField] || 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const barColors = ['#ef4444', '#f59e0b', '#eab308', '#3b82f6', '#22c55e']

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`${getCardClass()} animate-pulse`}>
            <div className={`h-6 w-48 rounded ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`} />
            <div className={`h-40 mt-4 rounded ${isLightMode ? 'bg-gray-100' : 'bg-white/5'}`} />
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Posts', value: data.summary?.total_posts || 0, icon: FileText, color: 'blue' },
          { label: 'Avg SEO Score', value: data.summary?.avg_seo_score || 0, icon: TrendingUp, color: data.summary?.avg_seo_score >= 70 ? 'green' : 'yellow' },
          { label: 'Posts Scoring 80+', value: data.summary?.posts_above_80 || 0, icon: CheckCircle, color: 'green' },
          { label: 'Posts Below 50', value: data.summary?.posts_below_50 || 0, icon: AlertTriangle, color: 'red' },
        ].map((stat, i) => {
          const Icon = stat.icon
          const colorMap = { blue: 'text-blue-400', green: 'text-green-400', yellow: 'text-yellow-400', red: 'text-red-400' }
          return (
            <div key={i} className={getCardClass()}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${getSubtextClass()}`}>{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${getTextColor()}`}>{stat.value}</p>
                </div>
                <Icon size={24} className={colorMap[stat.color]} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Score Distribution Chart */}
      {data.score_distribution && data.score_distribution.some(d => d.count > 0) && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>SEO Score Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.score_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLightMode ? '#e5e7eb' : '#374151'} />
              <XAxis dataKey="range" tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: isLightMode ? '#6b7280' : '#9ca3af', fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLightMode ? '#fff' : '#1f2937',
                  border: isLightMode ? '1px solid #e5e7eb' : '1px solid #374151',
                  borderRadius: '8px',
                  color: isLightMode ? '#111' : '#fff'
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data.score_distribution.map((entry, index) => (
                  <Cell key={index} fill={barColors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Blog Posts SEO Table */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Blog Post SEO Analysis</h3>

        {data.posts?.length === 0 ? (
          <div className={`text-center py-12 ${getSubtextClass()}`}>
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No blog posts found</p>
            <p className="text-sm mt-1">Publish blog posts with SEO metadata to see analysis here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={getTableHeaderClass()}>
                  <th className="text-left py-3 px-3 font-medium">Title</th>
                  <th className="text-left py-3 px-3 font-medium">Status</th>
                  <th className="text-left py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('word_count')}>
                    <span className="flex items-center gap-1">Words {sortField === 'word_count' && (sortDir === 'desc' ? <TrendingDown size={12} /> : <TrendingUp size={12} />)}</span>
                  </th>
                  <th className="text-left py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('seo_score')}>
                    <span className="flex items-center gap-1">SEO Score {sortField === 'seo_score' && (sortDir === 'desc' ? <TrendingDown size={12} /> : <TrendingUp size={12} />)}</span>
                  </th>
                  <th className="text-left py-3 px-3 font-medium">Issues</th>
                  <th className="text-left py-3 px-3 font-medium cursor-pointer" onClick={() => handleSort('views')}>
                    <span className="flex items-center gap-1">Views {sortField === 'views' && (sortDir === 'desc' ? <TrendingDown size={12} /> : <TrendingUp size={12} />)}</span>
                  </th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts().map((post) => (
                  <React.Fragment key={post.id}>
                    <tr className={`${getTableRowClass()} cursor-pointer transition-colors`} onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}>
                      <td className={`py-3 px-3 font-medium ${getTextColor()}`}>
                        <div className="max-w-[250px] truncate">{post.title}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.status === 'published'
                            ? isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'
                            : isLightMode ? 'bg-gray-100 text-gray-600' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className={`py-3 px-3 ${getSubtextClass()}`}>{post.word_count?.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreBg(post.seo_score)}`}>
                          {post.seo_score}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {post.issues?.length > 0 ? (
                          <span className={`flex items-center gap-1 ${post.issues.some(i => i.severity === 'critical') ? 'text-red-400' : 'text-yellow-400'}`}>
                            <AlertTriangle size={14} /> {post.issues.length}
                          </span>
                        ) : (
                          <span className="text-green-400 flex items-center gap-1"><CheckCircle size={14} /> 0</span>
                        )}
                      </td>
                      <td className={`py-3 px-3 ${getSubtextClass()}`}>
                        <span className="flex items-center gap-1"><Eye size={14} /> {post.views || 0}</span>
                      </td>
                      <td className="py-3 px-3">
                        {expandedPost === post.id ? <ChevronUp size={16} className={getSubtextClass()} /> : <ChevronDown size={16} className={getSubtextClass()} />}
                      </td>
                    </tr>
                    {expandedPost === post.id && (
                      <tr>
                        <td colSpan={7} className={isLightMode ? 'bg-gray-50 px-6 py-4' : 'bg-white/5 px-6 py-4'}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className={`text-xs font-medium mb-2 ${getSubtextClass()}`}>SEO Metadata</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  {post.has_seo_title ? <CheckCircle size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-yellow-400" />}
                                  <span className={getTextColor()}>SEO Title</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {post.has_seo_description ? <CheckCircle size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-yellow-400" />}
                                  <span className={getTextColor()}>SEO Description</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {post.has_keywords ? <CheckCircle size={12} className="text-green-400" /> : <AlertTriangle size={12} className="text-yellow-400" />}
                                  <span className={getTextColor()}>Keywords</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className={`text-xs font-medium mb-2 ${getSubtextClass()}`}>Content Metrics</p>
                              <div className="space-y-1 text-xs">
                                <p className={getTextColor()}>Word Count: <span className="font-mono">{post.word_count}</span></p>
                                <p className={getTextColor()}>Readability: <span className={`font-mono ${getScoreColor(post.readability_score || 0)}`}>{post.readability_score || 'N/A'}</span></p>
                                <p className={getTextColor()}>Slug: <span className="font-mono text-blue-400">{post.slug || 'none'}</span></p>
                              </div>
                            </div>
                            <div>
                              <p className={`text-xs font-medium mb-2 ${getSubtextClass()}`}>Issues</p>
                              {post.issues?.length > 0 ? (
                                <div className="space-y-1">
                                  {post.issues.map((issue, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-xs">
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getSeverityBadge(issue.severity)}`}>
                                        {issue.severity}
                                      </span>
                                      <span className={getTextColor()}>{issue.message}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> No issues found</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Content Gaps */}
      {data.content_gaps && (
        <div className={getCardClass()}>
          <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Content Gap Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Missing SEO Description', ids: data.content_gaps.no_seo_description, icon: FileText, color: 'red' },
              { label: 'No Keywords Set', ids: data.content_gaps.no_keywords, icon: Tag, color: 'yellow' },
              { label: 'Thin Content (<300 words)', ids: data.content_gaps.thin_content, icon: AlertTriangle, color: 'orange' },
              { label: 'Missing SEO Title', ids: data.content_gaps.no_seo_title, icon: Search, color: 'yellow' },
            ].map((gap, i) => {
              const Icon = gap.icon
              const count = gap.ids?.length || 0
              return (
                <div key={i} className={`${isLightMode ? 'bg-gray-50 rounded-xl p-4 border border-gray-100' : 'bg-white/5 rounded-xl p-4 border border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} className={count > 0 ? `text-${gap.color}-400` : 'text-green-400'} />
                    <span className={`text-sm font-medium ${getTextColor()}`}>{gap.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${count > 0 ? getTextColor() : 'text-green-400'}`}>{count}</p>
                  <p className={`text-xs mt-1 ${getSubtextClass()}`}>
                    {count > 0 ? `${count} post${count !== 1 ? 's' : ''} affected` : 'All good!'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentSeoAnalysis
