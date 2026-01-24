# DeepSeek v3 Implementation Steps

## ✅ Complete Implementation Ready

All code has been created with your API key integrated. Follow these steps:

---

## Step 1: Database Setup

### **1.1 Run Migration**
```bash
# Run the SQL migration
mysql -u your_user -p your_database < backend/database/migrations/create_ai_responses_table.sql

# OR if using Flask-Migrate
flask db upgrade
```

### **1.2 Verify Table Created**
```sql
SHOW TABLES LIKE 'ai_responses';
DESCRIBE ai_responses;
```

---

## Step 2: Install Dependencies

```bash
cd backend
pip install flask sqlalchemy python-dotenv
```

---

## Step 3: Environment Setup

### **3.1 Add to `.env` file**
```bash
RAPIDAPI_KEY=d3e6661dd9mshaf00e45aa6a20dfp1a5136jsna699de3bb565
RAPIDAPI_HOST=deepseek-v31.p.rapidapi.com
```

### **3.2 Or use directly in code** (already set in `ai_processor.py`)
The API key is already hardcoded as fallback, but environment variable is preferred.

---

## Step 4: Copy Files to Backend

### **4.1 Copy these files:**
```
backend/services/ai_processor.py          ✅ Created
backend/services/learning_service.py      ✅ Created
backend/models/ai_response.py             ✅ Created
backend/routes/llm_processing.py          ✅ Created
```

### **4.2 Register Blueprint**
In your `backend/app.py` or main file:

```python
from routes.llm_processing import llm_processing_bp

app.register_blueprint(llm_processing_bp)
```

---

## Step 5: Update Mapping Model

### **5.1 Add AI fields to Mapping model** (if not already present):

```python
# In backend/models/mapping.py
ai_attempted = db.Column(db.Boolean, default=False)
ai_status = db.Column(db.String(50))
ai_confidence = db.Column(db.Float)
ai_reasoning = db.Column(db.Text)
ai_model_version = db.Column(db.String(50))
ai_processing_duration = db.Column(db.Integer)
ai_processing_time = db.Column(db.DateTime)
suggested_ticker = db.Column(db.String(10))
```

---

## Step 6: Test the Implementation

### **6.1 Test Processing Endpoint**
```bash
curl -X POST http://localhost:5111/api/admin/llm-center/process-mapping/1 \
  -H "Authorization: Bearer admin_token_3" \
  -H "Content-Type: application/json"
```

### **6.2 Test Learning Endpoints**
```bash
# Get accuracy
curl http://localhost:5111/api/admin/llm-center/learning/accuracy \
  -H "Authorization: Bearer admin_token_3"

# Get knowledge base
curl http://localhost:5111/api/admin/llm-center/learning/knowledge-base \
  -H "Authorization: Bearer admin_token_3"

# Get insights
curl http://localhost:5111/api/admin/llm-center/learning/insights \
  -H "Authorization: Bearer admin_token_3"
```

---

## Step 7: Integrate with Frontend

### **7.1 Update Approve/Reject Handlers**

In `LLMCenter.jsx`, update `handleApprove` and `handleReject`:

```javascript
const handleApprove = async (mappingId) => {
  try {
    // ... existing approve code ...
    
    // Record feedback for learning
    if (mapping.ai_response_id) {
      await fetch(`${apiBaseUrl}/api/admin/llm-center/learning/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ai_response_id: mapping.ai_response_id,
          admin_action: 'approved',
          correct_ticker: mapping.ticker
        })
      })
    }
  } catch (error) {
    console.error('Error recording feedback:', error)
  }
}
```

---

## Step 8: Set Up Background Worker (Optional)

### **8.1 Create Worker Script**
```python
# backend/workers/ai_worker.py
from services.ai_processor import AIProcessor
from models.mapping import Mapping
from database import db
import time

def process_pending_mappings():
    """Background worker to automatically process pending mappings"""
    ai_processor = AIProcessor()
    
    while True:
        try:
            pending = Mapping.query.filter(
                Mapping.status == 'pending',
                Mapping.ai_attempted == False
            ).limit(10).all()
            
            for mapping in pending:
                # Process with AI (automatically stores response)
                mapping_dict = {
                    'id': mapping.id,
                    'merchant_name': mapping.merchant_name,
                    'category': mapping.category,
                    'ticker': mapping.ticker,
                    'user_id': mapping.user_id
                }
                
                ai_result = ai_processor.process_mapping(mapping_dict)
                
                # Update mapping
                mapping.ai_attempted = True
                mapping.ai_status = ai_result.get('ai_status')
                mapping.ai_confidence = ai_result.get('ai_confidence')
                mapping.ai_reasoning = ai_result.get('ai_reasoning')
                # ... etc
                
                db.session.commit()
            
            time.sleep(30)  # Process every 30 seconds
            
        except Exception as e:
            print(f"Worker error: {e}")
            time.sleep(60)
```

### **8.2 Run Worker**
```bash
python backend/workers/ai_worker.py
```

---

## Step 9: Monitor Learning

### **9.1 Check Stored Responses**
```sql
SELECT COUNT(*) FROM ai_responses;
SELECT merchant_name, COUNT(*) as count 
FROM ai_responses 
GROUP BY merchant_name 
ORDER BY count DESC 
LIMIT 10;
```

### **9.2 Check Accuracy**
```bash
# Via API
curl http://localhost:5111/api/admin/llm-center/learning/accuracy?days=30
```

---

## Step 10: Verify Everything Works

### **Checklist:**
- ✅ Database table `ai_responses` exists
- ✅ API endpoints respond correctly
- ✅ AI processing works (test with sample mapping)
- ✅ Responses are stored in database
- ✅ Learning endpoints return data
- ✅ Frontend can record feedback
- ✅ Background worker processes mappings (if enabled)

---

## 🎯 What Happens Now

1. **Every AI response is stored** in `ai_responses` table
2. **Every admin action teaches the system** via feedback
3. **Accuracy improves over time** as more data is collected
4. **Knowledge base grows** with merchant → ticker mappings
5. **System gets smarter** with each processed mapping

---

## 📊 Monitoring Dashboard (Future)

You can build a dashboard showing:
- Total responses stored
- Current accuracy rate
- Top merchants analyzed
- Learning insights
- Recommendations

All data is available via the learning endpoints!

---

## 🚀 You're Ready!

The complete system is implemented:
- ✅ DeepSeek v3 integration with your API key
- ✅ Response storage for learning
- ✅ Learning service for accuracy calculation
- ✅ Knowledge base building
- ✅ Feedback loop
- ✅ All API endpoints

Just follow the steps above to deploy!

