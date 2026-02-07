import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { Code, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Lightbulb, Star, Eye } from 'lucide-react'

const StructuredDataPanel = () => {
  const { isLightMode } = useTheme()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPage, setSelectedPage] = useState(null)

  const getTextColor = () => isLightMode ? 'text-gray-800' : 'text-white'
  const getSubtextClass = () => isLightMode ? 'text-gray-600' : 'text-gray-400'
  const getCardClass = () => isLightMode
    ? 'bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20'
  const getTableHeaderClass = () => isLightMode
    ? 'text-gray-500 border-b border-gray-200'
    : 'text-gray-400 border-b border-white/10'
  const getTableRowClass = () => isLightMode
    ? 'border-b border-gray-100 hover:bg-gray-50'
    : 'border-b border-white/5 hover:bg-white/5'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5111'
      const token = localStorage.getItem('kamioi_admin_token') || localStorage.getItem('authToken')
      const res = await fetch(`${apiBaseUrl}/api/admin/seo-geo/structured-data`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err) {
      console.error('Error fetching structured data:', err)
    } finally {
      setLoading(false)
    }
  }

  const schemaTypes = ['Organization', 'WebSite', 'SoftwareApplication', 'FAQPage', 'BreadcrumbList', 'Article', 'HowTo']

  const getCoverageColor = (pct) => {
    if (pct >= 80) return 'text-green-400'
    if (pct >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getCoverageBg = (pct) => {
    if (pct >= 80) return 'bg-green-500'
    if (pct >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

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
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className={getCardClass()}>
          <p className={`text-xs ${getSubtextClass()}`}>Total Schema Types</p>
          <p className={`text-3xl font-bold mt-1 ${getTextColor()}`}>{data.total_schema_types}</p>
        </div>
        <div className={getCardClass()}>
          <p className={`text-xs ${getSubtextClass()}`}>Active Schema Types</p>
          <p className={`text-3xl font-bold mt-1 text-green-400`}>{data.active_schema_types}</p>
        </div>
        <div className={`${getCardClass()} col-span-2 lg:col-span-1`}>
          <p className={`text-xs ${getSubtextClass()}`}>Pages with Structured Data</p>
          <p className={`text-3xl font-bold mt-1 ${getTextColor()}`}>{data.coverage_matrix?.length || 0}</p>
        </div>
      </div>

      {/* Coverage Matrix */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Schema Coverage Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={getTableHeaderClass()}>
                <th className="text-left py-3 px-3 font-medium">Page</th>
                {schemaTypes.map(type => (
                  <th key={type} className="text-center py-3 px-2 font-medium">
                    <span className="text-xs">{type.replace('SoftwareApplication', 'SoftwareApp')}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.coverage_matrix?.map((page, i) => (
                <tr key={i} className={getTableRowClass()}>
                  <td className={`py-3 px-3 font-medium ${getTextColor()}`}>
                    <div>
                      <p>{page.page_name}</p>
                      <p className={`text-xs ${getSubtextClass()}`}>{page.page}</p>
                    </div>
                  </td>
                  {schemaTypes.map(type => (
                    <td key={type} className="text-center py-3 px-2">
                      {page.schemas[type] ? (
                        <CheckCircle size={18} className="text-green-400 mx-auto" />
                      ) : (
                        <XCircle size={18} className={`mx-auto ${isLightMode ? 'text-gray-300' : 'text-gray-600'}`} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Coverage percentage row */}
              <tr className={isLightMode ? 'bg-gray-50' : 'bg-white/5'}>
                <td className={`py-3 px-3 font-semibold ${getTextColor()}`}>Coverage</td>
                {schemaTypes.map(type => {
                  const pct = data.coverage_percentages?.[type] || 0
                  return (
                    <td key={type} className="text-center py-3 px-2">
                      <span className={`text-xs font-bold ${getCoverageColor(pct)}`}>{pct}%</span>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Coverage Bars */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Coverage by Schema Type</h3>
        <div className="space-y-3">
          {schemaTypes.map(type => {
            const pct = data.coverage_percentages?.[type] || 0
            return (
              <div key={type} className="flex items-center gap-3">
                <span className={`text-sm w-40 ${getTextColor()}`}>{type}</span>
                <div className={`flex-1 h-3 rounded-full ${isLightMode ? 'bg-gray-200' : 'bg-white/10'}`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getCoverageBg(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-sm font-mono w-12 text-right ${getCoverageColor(pct)}`}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation Results */}
      <div className={getCardClass()}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextColor()}`}>Validation Results</h3>
        <div className="space-y-3">
          {data.validation_results?.map((page, i) => (
            <div key={i} className={`${isLightMode ? 'bg-gray-50 rounded-xl p-4 border border-gray-100' : 'bg-white/5 rounded-xl p-4 border border-white/10'}`}>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedPage(selectedPage === i ? null : i)}
              >
                <div>
                  <p className={`font-medium ${getTextColor()}`}>{page.page_name}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>{page.page}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${getSubtextClass()}`}>{page.schemas.length} schema{page.schemas.length !== 1 ? 's' : ''}</span>
                  {page.schemas.every(s => s.valid) ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <AlertTriangle size={18} className="text-yellow-400" />
                  )}
                  {selectedPage === i ? <ChevronUp size={16} className={getSubtextClass()} /> : <ChevronDown size={16} className={getSubtextClass()} />}
                </div>
              </div>
              {selectedPage === i && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  {page.schemas.map((schema, j) => (
                    <div key={j} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-blue-400" />
                        <span className={getTextColor()}>{schema.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={schema.valid ? 'text-green-400' : 'text-red-400'}>
                          {schema.valid ? 'Valid' : 'Invalid'}
                        </span>
                        {schema.google_rich_results_eligible && (
                          <span className={`flex items-center gap-1 text-xs ${isLightMode ? 'bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full' : 'bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full'}`}>
                            <Star size={10} /> Rich Results
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Schema Opportunities */}
      <div className={getCardClass()}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-yellow-400" />
          <h3 className={`text-lg font-semibold ${getTextColor()}`}>Missing Schema Opportunities</h3>
        </div>
        <div className="space-y-3">
          {data.opportunities?.map((opp, i) => (
            <div key={i} className={`flex items-start gap-3 ${isLightMode ? 'bg-yellow-50 rounded-xl p-4 border border-yellow-100' : 'bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20'}`}>
              <div className="flex-shrink-0 mt-0.5">
                <Code size={18} className="text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getTextColor()}`}>{opp.schema}</span>
                  <span className={`text-xs ${isLightMode ? 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' : 'bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full'}`}>
                    {opp.page}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${getSubtextClass()}`}>{opp.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StructuredDataPanel
