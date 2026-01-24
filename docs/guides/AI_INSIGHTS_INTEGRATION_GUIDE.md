# AI Insights DeepSeek Integration Guide

## ✅ What's Been Done

1. **Backend Services Created:**
   - `ai_recommendation_service.py` - DeepSeek v3 integration for recommendations
   - API endpoints: `/api/ai/recommendations` and `/api/ai/recommendations/quick`
   - All responses tracked in `api_usage` table

2. **Frontend Service Created:**
   - `aiRecommendationService.js` - Frontend service to call backend

3. **API Tracking Dashboard:**
   - `APITrackingDashboard.jsx` - Complete dashboard for monitoring API calls and costs
   - Added to AdminDashboard as 'api-tracking' tab

## 🔧 How to Integrate DeepSeek into AI Insights Pages

### **Step 1: Import the Service**

In each AI Insights component (`AIInsights.jsx`, `BusinessAIInsights.jsx`, `FamilyAIInsights.jsx`):

```javascript
import aiRecommendationService from '../../services/aiRecommendationService'
```

### **Step 2: Add State for Recommendations**

```javascript
const [aiRecommendations, setAiRecommendations] = useState(null)
const [loadingRecommendations, setLoadingRecommendations] = useState(false)
```

### **Step 3: Fetch Recommendations on Component Load**

Add this `useEffect` to fetch recommendations:

```javascript
useEffect(() => {
  const fetchAIRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      // Get user data (transactions, portfolio, etc.)
      const userData = {
        transactions: transactions || [],
        portfolio: {
          total_value: portfolioValue || 0,
          holdings: portfolioHoldings || []
        },
        goals: goals || [],
        risk_tolerance: 'moderate', // or get from user settings
        investment_history: []
      }
      
      // Get recommendations from DeepSeek
      const recommendations = await aiRecommendationService.getRecommendations(
        userData,
        'user' // or 'family' or 'business'
      )
      
      setAiRecommendations(recommendations)
    } catch (error) {
      console.error('Error fetching AI recommendations:', error)
      // Fallback recommendations are already included in service
      setAiRecommendations(aiRecommendationService.getFallbackRecommendations({}, 'user'))
    } finally {
      setLoadingRecommendations(false)
    }
  }
  
  // Only fetch if we have user data
  if (user && (transactions || portfolioValue)) {
    fetchAIRecommendations()
  }
}, [user, transactions, portfolioValue])
```

### **Step 4: Display Recommendations in UI**

Replace the empty "No AI Recommendations" sections with:

```javascript
{loadingRecommendations ? (
  <div className="text-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
    <p className={`mt-4 ${getSubtextClass()}`}>Loading AI recommendations...</p>
  </div>
) : aiRecommendations ? (
  <div className="space-y-4">
    {/* Recommendations List */}
    {aiRecommendations.recommendations && aiRecommendations.recommendations.length > 0 && (
      <div>
        <h4 className={`text-lg font-semibold ${getTextClass()} mb-3`}>Investment Recommendations</h4>
        <div className="space-y-3">
          {aiRecommendations.recommendations.map((rec, index) => (
            <div
              key={index}
              className={`${getCardClass()} p-4 rounded-lg border border-white/10`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h5 className={`font-semibold ${getTextClass()}`}>{rec.title}</h5>
                    <span className={`px-2 py-1 rounded text-xs ${
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className={`text-sm ${getSubtextClass()} mb-2`}>{rec.description}</p>
                  <p className={`text-xs ${getSubtextClass()}`}>
                    <strong>Action:</strong> {rec.action}
                  </p>
                  <p className={`text-xs ${getSubtextClass()}`}>
                    <strong>Expected Impact:</strong> {rec.expected_impact}
                  </p>
                  {rec.related_merchants && rec.related_merchants.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-xs ${getSubtextClass()}`}>Related Merchants:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.related_merchants.map((merchant, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                            {merchant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Insights */}
    {aiRecommendations.insights && aiRecommendations.insights.length > 0 && (
      <div>
        <h4 className={`text-lg font-semibold ${getTextClass()} mb-3`}>Key Insights</h4>
        <div className="space-y-2">
          {aiRecommendations.insights.map((insight, index) => (
            <div key={index} className={`${getCardClass()} p-3 rounded-lg border border-white/10`}>
              <p className={`text-sm ${getTextClass()}`}>{insight}</p>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Risk Analysis */}
    {aiRecommendations.risk_analysis && (
      <div>
        <h4 className={`text-lg font-semibold ${getTextClass()} mb-3`}>Risk Analysis</h4>
        <div className={`${getCardClass()} p-4 rounded-lg border border-white/10`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${getSubtextClass()}`}>Current Risk Level</p>
              <p className={`text-lg font-semibold ${getTextClass()}`}>
                {aiRecommendations.risk_analysis.current_risk_level}
              </p>
            </div>
            <div>
              <p className={`text-sm ${getSubtextClass()}`}>Recommended Risk Level</p>
              <p className={`text-lg font-semibold ${getTextClass()}`}>
                {aiRecommendations.risk_analysis.recommended_risk_level}
              </p>
            </div>
          </div>
          <p className={`text-sm ${getSubtextClass()} mt-3`}>
            {aiRecommendations.risk_analysis.reasoning}
          </p>
        </div>
      </div>
    )}
    
    {/* Opportunities */}
    {aiRecommendations.opportunities && aiRecommendations.opportunities.length > 0 && (
      <div>
        <h4 className={`text-lg font-semibold ${getTextClass()} mb-3`}>Investment Opportunities</h4>
        <div className="space-y-3">
          {aiRecommendations.opportunities.map((opp, index) => (
            <div
              key={index}
              className={`${getCardClass()} p-4 rounded-lg border border-white/10`}
            >
              <h5 className={`font-semibold ${getTextClass()} mb-2`}>{opp.title}</h5>
              <p className={`text-sm ${getSubtextClass()} mb-2`}>{opp.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-sm ${getSubtextClass()}`}>
                  Potential Value: <strong className={getTextClass()}>{opp.potential_value}</strong>
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  opp.effort_required === 'low' ? 'bg-green-500/20 text-green-400' :
                  opp.effort_required === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {opp.effort_required} effort
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
) : (
  <div className="text-center py-8">
    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <Brain className="w-8 h-8 text-blue-400" />
    </div>
    <h4 className={`text-lg font-medium ${getTextClass()} mb-2`}>No AI Recommendations Available</h4>
    <p className={`${getSubtextClass()} mb-4`}>
      Upload your bank statement to start receiving personalized AI recommendations
    </p>
  </div>
)}
```

## 📍 Where to Add This Code

### **User Dashboard (`AIInsights.jsx`):**
- Line ~440-470: Replace "Recent AI Recommendations" section
- Add state and useEffect at top of component

### **Business Dashboard (`BusinessAIInsights.jsx`):**
- Line ~682-705: Replace "Recent AI Recommendations" section
- Add state and useEffect at top of component

### **Family Dashboard (`FamilyAIInsights.jsx`):**
- Line ~350-372: Replace "Recent AI Recommendations" section
- Add state and useEffect at top of component

## 🎯 Quick Integration (Minimal Data)

If you don't have full user data, use the quick endpoint:

```javascript
const recommendations = await aiRecommendationService.getQuickRecommendations({
  total_spending: 1000,
  portfolio_value: 5000,
  risk_tolerance: 'moderate'
}, 'user')
```

## ✅ Summary

1. ✅ Backend DeepSeek integration complete
2. ✅ Frontend service created
3. ✅ API tracking dashboard added
4. ⏳ **Next:** Add recommendation fetching to AI Insights components (see steps above)

All the infrastructure is ready - just need to add the UI integration!

