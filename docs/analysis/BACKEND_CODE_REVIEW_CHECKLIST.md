# Backend Code Review Checklist

## Files to Check

### 1. **API Routes/Endpoints**
Check these files for AI processing endpoints:
```
backend/routes/llm_center.py
backend/routes/admin.py
backend/api/llm_center.py
backend/api/mappings.py
```

**Look for:**
- `POST /api/admin/llm-center/process-mapping/{id}`
- `POST /api/admin/llm-center/process-batch`
- `GET /api/admin/llm-center/automation/learning`
- `GET /api/admin/llm-center/analytics`

### 2. **Service Files**
Check for AI processing logic:
```
backend/services/llm_service.py
backend/services/ai_processor.py
backend/services/mapping_processor.py
backend/services/learning_service.py
```

**Look for:**
- Functions that process mappings
- External API calls (OpenAI, Anthropic, etc.)
- Learning/accuracy calculation
- Model versioning

### 3. **Database Models**
Check schema for AI fields:
```
backend/models/mapping.py
backend/models/llm_mapping.py
backend/database/schema.py
```

**Verify these fields exist:**
```python
ai_attempted = Boolean
ai_status = String  # 'approved', 'rejected', 'review_required', 'uncertain'
ai_confidence = Float  # 0.0 to 1.0
ai_model_version = String
ai_processing_duration = Integer  # milliseconds
ai_processing_time = DateTime
ai_reasoning = Text
```

### 4. **Background Workers/Jobs**
Check for automatic processing:
```
backend/workers/llm_worker.py
backend/jobs/process_mappings.py
backend/tasks/ai_processing.py
backend/celery_tasks.py  # If using Celery
```

**Look for:**
- Scheduled jobs that process pending mappings
- Queue workers
- Automatic triggers

### 5. **Configuration Files**
Check for API keys and settings:
```
backend/config.py
backend/.env
backend/settings.py
```

**Look for:**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `RAPIDAPI_KEY`
- AI model configuration

### 6. **Learning/Analytics Logic**
Check for accuracy calculation:
```
backend/services/analytics_service.py
backend/services/learning_service.py
backend/utils/accuracy_calculator.py
```

**Look for:**
- Accuracy calculation functions
- Learning event tracking
- Model update logic

---

## Code Patterns to Search For

### **1. AI Processing Function**
```python
# Search for functions like:
def process_mapping_with_ai(mapping_id):
def analyze_mapping(mapping):
def generate_ai_reasoning(mapping):
```

### **2. External API Calls**
```python
# Search for:
import openai
import anthropic
import requests  # For RapidAPI
openai.ChatCompletion.create()
anthropic.Anthropic()
requests.post('https://api.rapidapi.com/...')
```

### **3. Learning Logic**
```python
# Search for:
def calculate_accuracy():
def update_model():
def track_learning_event():
def retrain_model():
```

### **4. Database Updates**
```python
# Search for:
mapping.ai_attempted = True
mapping.ai_status = 'approved'
mapping.ai_reasoning = "..."
db.session.commit()
```

---

## Quick Test Script

Create `test_ai_processing.py` in backend root:

```python
import requests
import os

BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5111')
TOKEN = os.getenv('ADMIN_TOKEN', 'admin_token_3')

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Test 1: Check if processing endpoint exists
print("Testing AI Processing Endpoint...")
response = requests.post(
    f'{BASE_URL}/api/admin/llm-center/process-mapping/1',
    headers=headers
)
print(f"Process endpoint: {response.status_code} - {response.text[:100]}")

# Test 2: Check analytics endpoint
print("\nTesting Analytics Endpoint...")
response = requests.get(
    f'{BASE_URL}/api/admin/llm-center/analytics',
    headers=headers
)
print(f"Analytics endpoint: {response.status_code}")
if response.ok:
    data = response.json()
    print(f"Accuracy Rate: {data.get('accuracyRate', 'N/A')}")
    print(f"Total Mappings: {data.get('totalMappings', 'N/A')}")

# Test 3: Get a mapping and check AI fields
print("\nTesting Mapping Details...")
response = requests.get(
    f'{BASE_URL}/api/admin/llm-center/mapping/1',
    headers=headers
)
if response.ok:
    mapping = response.json().get('data', {})
    print(f"AI Attempted: {mapping.get('ai_attempted', 'N/A')}")
    print(f"AI Status: {mapping.get('ai_status', 'N/A')}")
    print(f"AI Reasoning: {mapping.get('ai_reasoning', 'N/A')[:50]}...")
```

---

## Expected Findings

### **If Backend Exists:**
✅ Processing endpoint returns 200
✅ Mappings have `ai_attempted = True`
✅ `ai_reasoning` field is populated
✅ Analytics shows accuracy rate > 0

### **If Backend Doesn't Exist:**
❌ Processing endpoint returns 404
❌ All mappings have `ai_attempted = False` or `null`
❌ `ai_reasoning` is always empty
❌ Analytics accuracy is 0 or null

---

## Next Steps Based on Findings

### **If Backend Exists but Not Working:**
1. Check logs for errors
2. Verify API keys are set
3. Test external API connectivity
4. Check database for populated AI fields

### **If Backend Doesn't Exist:**
1. Use the External API Integration Plan (next document)
2. Implement processing endpoint
3. Set up background workers
4. Test with sample mappings

