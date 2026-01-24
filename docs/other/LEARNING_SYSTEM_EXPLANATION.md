# Learning System - How It Works

## 📊 Where Responses Are Stored

### **Database Table: `ai_responses`**

All AI responses from DeepSeek are stored in the `ai_responses` table with:

```sql
- id: Unique identifier
- mapping_id: Link to original mapping
- merchant_name: Merchant being analyzed
- category: Merchant category
- prompt: What we asked the AI
- raw_response: Full AI response (JSON)
- parsed_response: Extracted data (JSON)
- processing_time_ms: How long it took
- model_version: Which model was used (DeepSeek-V3-0324)
- is_error: Whether there was an error
- admin_feedback: What admin did ('approved', 'rejected')
- admin_correct_ticker: What admin says is correct
- was_ai_correct: Whether AI was right
- created_at: When response was generated
```

**Location**: `backend/models/ai_response.py` and `backend/database/migrations/create_ai_responses_table.sql`

---

## 🧠 How We Use This Data to Learn

### **1. Accuracy Calculation**

**Service**: `learning_service.calculate_accuracy()`

**How it works**:
1. Gets all responses where admin provided feedback (`was_ai_correct` is set)
2. Counts correct vs incorrect predictions
3. Calculates accuracy rate: `correct / total * 100`
4. Groups by confidence level, merchant, category

**Example**:
```python
# If we have 100 responses with feedback:
# - 85 were correct
# - 15 were incorrect
# Accuracy = 85%

# By confidence:
# - High confidence (0.8-1.0): 90% accuracy
# - Medium confidence (0.6-0.79): 75% accuracy
# - Low confidence (0.0-0.59): 50% accuracy
```

**Used for**:
- Tracking system performance over time
- Identifying which confidence levels are reliable
- Finding merchants/categories where AI struggles

---

### **2. Merchant Knowledge Base**

**Service**: `learning_service.get_merchant_knowledge_base()`

**How it works**:
1. Analyzes all stored responses for each merchant
2. Finds most common ticker for each merchant
3. Calculates average confidence
4. Prioritizes admin-verified mappings

**Example**:
```python
# After processing "Walmart" 10 times:
{
    'merchant_name': 'walmart',
    'ticker': 'WMT',
    'average_confidence': 0.95,
    'response_count': 10,
    'admin_verified': True  # Admin confirmed this is correct
}
```

**Used for**:
- Building a database of known merchant → ticker mappings
- Providing context to future AI requests
- Fast lookups for common merchants

---

### **3. Context for Future Requests**

**Service**: `ai_processor._get_learning_context()`

**How it works**:
1. When processing a new mapping, searches for similar merchants
2. Includes previous AI analyses in the prompt
3. AI learns from past decisions

**Example**:
```
Previous analyses for similar merchants:
- walmart supercenter: WMT (confidence: 0.95, status: approved)
- walmart store: WMT (confidence: 0.92, status: approved)
- target: TGT (confidence: 0.88, status: approved)
```

**Used for**:
- Improving consistency
- Learning from patterns
- Building on previous knowledge

---

### **4. Feedback Loop**

**Service**: `learning_service.record_feedback()`

**How it works**:
1. When admin approves/rejects a mapping, we record feedback
2. Compare AI's prediction with admin's decision
3. Mark `was_ai_correct` as True/False
4. Store admin's correct ticker if different

**Example**:
```python
# AI said: "Walmart" → "WMT" with 0.95 confidence
# Admin approves → was_ai_correct = True

# AI said: "Target Store" → "TGT" with 0.85 confidence
# Admin rejects and says correct ticker is "TGT" → was_ai_correct = True (ticker was right)
# But admin rejected for other reason → we learn from this
```

**Used for**:
- Measuring actual accuracy
- Identifying where AI makes mistakes
- Improving prompts based on errors

---

### **5. Learning Insights**

**Service**: `learning_service.get_learning_insights()`

**How it works**:
1. Analyzes recent responses for patterns
2. Identifies common errors
3. Finds merchants that need review
4. Generates recommendations

**Example Output**:
```json
{
    "total_responses_last_7_days": 150,
    "error_rate": 2.5,
    "incorrect_predictions": 12,
    "uncertain_merchants": {
        "new merchant xyz": 5,
        "unknown retailer": 3
    },
    "recommendations": [
        "High error rate detected. Check API connectivity.",
        "Need more data for learning. Process more mappings."
    ]
}
```

**Used for**:
- Monitoring system health
- Identifying areas for improvement
- Making data-driven decisions

---

## 🔄 Complete Learning Cycle

### **Step 1: AI Processes Mapping**
```
User submits: "Walmart Supercenter"
↓
AI analyzes → Returns: WMT, 0.95 confidence
↓
Response stored in ai_responses table
```

### **Step 2: Admin Reviews**
```
Admin sees AI suggestion: WMT
↓
Admin approves → Feedback recorded
↓
was_ai_correct = True stored
```

### **Step 3: System Learns**
```
Next time "Walmart" appears:
↓
System checks knowledge base → Finds WMT with 95% confidence
↓
Includes in prompt: "Previous analyses: Walmart → WMT (verified)"
↓
AI gets better context → More accurate prediction
```

### **Step 4: Accuracy Improves**
```
After 1000 mappings with feedback:
↓
Calculate accuracy → 87% correct
↓
Identify weak areas → Improve prompts
↓
System gets smarter over time
```

---

## 📈 How Learning Improves the System

### **1. Better Prompts**
- See what works, what doesn't
- Add examples of correct mappings
- Refine instructions based on errors

### **2. Confidence Calibration**
- Learn which confidence levels are reliable
- Adjust thresholds (e.g., only auto-approve if confidence > 0.9)
- Flag uncertain predictions for review

### **3. Merchant Database**
- Build comprehensive merchant → ticker map
- Use for fast lookups (no AI needed for known merchants)
- Improve accuracy for similar merchants

### **4. Error Prevention**
- Identify common mistakes
- Add rules to prevent known errors
- Improve handling of edge cases

---

## 🎯 Key Metrics Tracked

1. **Accuracy Rate**: % of correct predictions
2. **Confidence Accuracy**: Accuracy by confidence level
3. **Merchant Accuracy**: Which merchants AI handles well
4. **Category Accuracy**: Which categories are easier/harder
5. **Error Rate**: % of API errors
6. **Processing Time**: Average time per request
7. **Learning Rate**: How fast accuracy improves

---

## 🚀 Future Enhancements

1. **Automatic Model Retraining**: Use stored responses to fine-tune models
2. **Pattern Detection**: Identify new merchant patterns automatically
3. **Confidence Adjustment**: Automatically adjust confidence thresholds
4. **Prompt Optimization**: A/B test different prompts
5. **Merchant Clustering**: Group similar merchants for better matching

---

## 📝 Summary

**Storage**: All responses in `ai_responses` database table

**Learning Methods**:
1. ✅ Accuracy calculation from feedback
2. ✅ Merchant knowledge base building
3. ✅ Context inclusion in future requests
4. ✅ Feedback loop for continuous improvement
5. ✅ Insights and recommendations

**Result**: System gets smarter over time as more data is collected and analyzed!

