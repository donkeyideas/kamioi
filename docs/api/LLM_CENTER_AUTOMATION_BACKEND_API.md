# LLM Center Automation - Backend API Implementation Guide

## Overview

This document provides comprehensive backend API specifications for implementing all automation improvements in the LLM Center. These endpoints enable a fully automated, intelligent transaction mapping system.

---

## 🔴 Critical Endpoints Required

### 1. Real-Time Event-Driven Processing

#### GET `/api/admin/llm-center/automation/realtime`

**Purpose:** Get real-time processing status and metrics

**Headers:**
```
Authorization: Bearer {kamioi_admin_token}
Content-Type: application/json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "activeConnections": 5,
    "transactionsProcessedToday": 1247,
    "averageProcessingTime": 245,
    "lastProcessed": "2025-01-31T01:42:07.425Z"
  },
  "status": {
    "isConnected": true,
    "processingQueue": 12,
    "activeProcesses": 3,
    "throughput": 847
  }
}
```

**Backend Implementation Notes:**
- Track active webhook connections
- Monitor transaction processing queue
- Calculate throughput (transactions/second)
- Store average processing time

#### POST `/api/admin/llm-center/automation/realtime/enable`

**Purpose:** Enable/disable real-time processing

**Body:**
```json
{
  "enabled": true
}
```

---

### 2. Batch Parallel Processing

#### GET `/api/admin/llm-center/automation/batch`

**Purpose:** Get batch processing metrics and configuration

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "batchSize": 50,
    "parallelBatches": 4,
    "queueLength": 23,
    "processingRate": 1250
  }
}
```

**Backend Implementation Notes:**
- Process transactions in batches of configurable size
- Run multiple batches in parallel
- Track queue length and processing rate
- Optimize batch size based on load

#### PUT `/api/admin/llm-center/automation/batch/settings`

**Purpose:** Update batch processing settings

**Body:**
```json
{
  "batchSize": 50,
  "parallelBatches": 4
}
```

---

### 3. Continuous Learning System

#### GET `/api/admin/llm-center/automation/learning`

**Purpose:** Get continuous learning metrics

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "totalLearningEvents": 15420,
    "accuracyImprovement": 12.5,
    "lastModelUpdate": "2025-01-31T00:00:00.000Z",
    "learningRate": 0.85
  }
}
```

**Backend Implementation Notes:**
- Track every admin approval/rejection as learning event
- Calculate accuracy improvement over time
- Store model update timestamps
- Calculate learning rate (how fast system improves)

**Learning Algorithm:**
1. When admin approves mapping → Positive signal for merchant→ticker mapping
2. When admin rejects mapping → Negative signal, try alternative mappings
3. Track pattern: If similar merchants map to same ticker repeatedly → Boost confidence
4. Calculate accuracy: (Correct predictions / Total predictions) * 100
5. Store learning events in `llm_learning_events` table

#### POST `/api/admin/llm-center/automation/learning/train`

**Purpose:** Trigger model retraining with latest data

**Response:**
```json
{
  "success": true,
  "message": "Model training initiated",
  "estimatedTime": 3600
}
```

---

### 4. Merchant Database (Historical Mappings Cache)

#### GET `/api/admin/llm-center/automation/merchants`

**Purpose:** Get merchant database statistics

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalMerchants": 15420,
    "cacheHitRate": 87.5,
    "instantMappings": 13467,
    "averageLookupTime": 2.3
  }
}
```

**Backend Implementation Notes:**
- Maintain database of merchant→ticker mappings
- Cache frequently accessed mappings
- Track cache hit rate (how often we find merchant in cache)
- Measure lookup time for performance

**Database Schema:**
```sql
CREATE TABLE merchant_mappings_cache (
  id SERIAL PRIMARY KEY,
  merchant_name VARCHAR(255) UNIQUE,
  ticker_symbol VARCHAR(10),
  category VARCHAR(100),
  confidence DECIMAL(5,2),
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_merchant_name ON merchant_mappings_cache(merchant_name);
```

#### GET `/api/admin/llm-center/automation/merchants/search?q={query}`

**Purpose:** Search merchant database

**Response:**
```json
{
  "success": true,
  "merchants": [
    {
      "merchant_name": "Amazon",
      "ticker_symbol": "AMZN",
      "category": "E-commerce",
      "confidence": 98.5,
      "usage_count": 15420
    }
  ]
}
```

---

### 5. Confidence Threshold Auto-Adjustment

#### GET `/api/admin/llm-center/automation/thresholds`

**Purpose:** Get current confidence thresholds and accuracy

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "high": 90,
    "medium": 70,
    "low": 50,
    "autoAdjustEnabled": true,
    "historicalAccuracy": 94.2
  }
}
```

**Backend Implementation Notes:**
- Auto-adjust thresholds based on historical accuracy
- If accuracy is high (>95%), lower thresholds slightly to auto-approve more
- If accuracy is low (<85%), raise thresholds to require more review
- Store threshold history for analysis

#### PUT `/api/admin/llm-center/automation/thresholds`

**Purpose:** Update confidence thresholds (manual or auto)

**Body:**
```json
{
  "high": 90,
  "medium": 70,
  "low": 50,
  "autoAdjustEnabled": true
}
```

**Auto-Adjustment Algorithm:**
```python
def adjust_thresholds(historical_accuracy, current_thresholds):
    if historical_accuracy > 95:
        # System is very accurate, can lower thresholds
        return {
            "high": max(85, current_thresholds["high"] - 2),
            "medium": max(65, current_thresholds["medium"] - 2),
            "low": max(45, current_thresholds["low"] - 2)
        }
    elif historical_accuracy < 85:
        # System needs more review, raise thresholds
        return {
            "high": min(95, current_thresholds["high"] + 2),
            "medium": min(75, current_thresholds["medium"] + 2),
            "low": min(55, current_thresholds["low"] + 2)
        }
    return current_thresholds
```

---

### 6. Multi-Model Voting System

#### GET `/api/admin/llm-center/automation/multi-model`

**Purpose:** Get multi-model voting metrics

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "activeModels": 3,
    "consensusRate": 92.5,
    "disagreementRate": 7.5
  }
}
```

**Backend Implementation Notes:**
- Run transaction through multiple AI models (e.g., GPT-4, Claude, Gemini)
- Take consensus of all models
- If all models agree → High confidence
- If models disagree → Lower confidence, flag for review
- Track consensus vs disagreement rates

**Multi-Model Voting Algorithm:**
```python
def multi_model_vote(transaction, models):
    results = []
    for model in models:
        result = model.predict(transaction)
        results.append({
            "ticker": result.ticker,
            "confidence": result.confidence,
            "category": result.category
        })
    
    # Find consensus
    ticker_votes = {}
    for result in results:
        ticker = result["ticker"]
        if ticker not in ticker_votes:
            ticker_votes[ticker] = []
        ticker_votes[ticker].append(result["confidence"])
    
    # Get most voted ticker
    consensus_ticker = max(ticker_votes.items(), key=lambda x: len(x[1]))[0]
    consensus_count = len(ticker_votes[consensus_ticker])
    consensus_rate = (consensus_count / len(models)) * 100
    
    return {
        "ticker": consensus_ticker,
        "confidence": sum(ticker_votes[consensus_ticker]) / len(ticker_votes[consensus_ticker]),
        "consensus_rate": consensus_rate,
        "disagreement": consensus_count < len(models)
    }
```

---

## 🔄 Transaction Processing Flow (Enhanced)

### Event-Driven Processing

When a transaction appears in the database (via bank sync):

1. **Webhook Trigger** (if enabled)
   ```
   POST /api/transactions/webhook
   Body: {
     "transaction_id": "string",
     "dashboard_type": "user|business|family",
     "merchant": "string",
     "amount": 0
   }
   ```

2. **Instant Processing Pipeline:**
   ```python
   async def process_transaction_real_time(transaction):
       # Step 1: Check merchant database cache
       cached_mapping = merchant_db_lookup(transaction.merchant)
       if cached_mapping and cached_mapping.confidence > 90:
           return {
               "ticker": cached_mapping.ticker,
               "confidence": cached_mapping.confidence,
               "source": "cache",
               "processing_time": 2  # ms
           }
       
       # Step 2: Multi-model voting
       if multi_model_enabled:
           results = await multi_model_vote(transaction)
           if results.consensus_rate > 90:
               # Store in merchant cache for future
               merchant_db_cache(transaction.merchant, results)
               return results
       
       # Step 3: Single model fallback
       result = await single_model_predict(transaction)
       
       # Step 4: Learning feedback
       if result.confidence > threshold:
           await add_learning_event(transaction, result, "auto_approved")
       
       return result
   ```

---

## 📊 Database Schema Additions

### Learning Events Table
```sql
CREATE TABLE llm_learning_events (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255),
  merchant_name VARCHAR(255),
  predicted_ticker VARCHAR(10),
  predicted_confidence DECIMAL(5,2),
  actual_ticker VARCHAR(10),  -- From admin approval
  admin_action VARCHAR(50),  -- 'approved', 'rejected', 'auto_approved'
  accuracy_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_merchant_learning ON llm_learning_events(merchant_name);
CREATE INDEX idx_admin_action ON llm_learning_events(admin_action);
```

### Merchant Cache Table
```sql
CREATE TABLE merchant_mappings_cache (
  id SERIAL PRIMARY KEY,
  merchant_name VARCHAR(255) UNIQUE,
  ticker_symbol VARCHAR(10),
  category VARCHAR(100),
  confidence DECIMAL(5,2),
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Model Voting Table
```sql
CREATE TABLE llm_model_votes (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(255),
  model_name VARCHAR(100),
  predicted_ticker VARCHAR(10),
  confidence DECIMAL(5,2),
  voting_result VARCHAR(50),  -- 'consensus', 'disagreement'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Real-Time Webhook Integration

### Webhook Configuration

**Endpoint:** `POST /api/webhooks/transaction`

**When:** Triggered automatically when:
- Bank sync completes
- Transaction appears in user/business/family dashboard
- Transaction status changes

**Payload:**
```json
{
  "event": "transaction.created",
  "transaction_id": "string",
  "dashboard_type": "user|business|family",
  "merchant": "string",
  "amount": 0,
  "timestamp": "2025-01-31T01:42:07.425Z"
}
```

**Processing:**
1. Webhook receives transaction
2. Immediately triggers LLM processing
3. Updates transaction status based on result
4. Stores mapping in database
5. Updates merchant cache if high confidence

---

## 📈 Performance Optimization

### Caching Strategy

1. **Merchant Cache (Redis/Memory)**
   - Cache merchant→ticker mappings
   - TTL: 24 hours
   - Update on admin approval/rejection

2. **Model Results Cache**
   - Cache LLM responses for identical merchants
   - Reduces API calls to LLM services
   - TTL: 1 hour

3. **Threshold Cache**
   - Cache confidence thresholds
   - Update only when auto-adjustment triggers
   - TTL: 5 minutes

---

## 🧪 Testing Endpoints

```bash
# Test real-time processing status
curl -X GET "http://127.0.0.1:5111/api/admin/llm-center/automation/realtime" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test batch processing
curl -X GET "http://127.0.0.1:5111/api/admin/llm-center/automation/batch" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test learning metrics
curl -X GET "http://127.0.0.1:5111/api/admin/llm-center/automation/learning" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test merchant database
curl -X GET "http://127.0.0.1:5111/api/admin/llm-center/automation/merchants" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test confidence thresholds
curl -X GET "http://127.0.0.1:5111/api/admin/llm-center/automation/thresholds" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Test multi-model voting
curl -X GET "http://127.0.0.1:5111/api/admin/llm-center/automation/multi-model" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🎯 Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ Real-time processing endpoint
2. ✅ Merchant database cache
3. ✅ Basic continuous learning tracking

### Phase 2: High Priority (Week 2)
4. ✅ Batch processing optimization
5. ✅ Confidence threshold auto-adjustment
6. ✅ Multi-model voting implementation

### Phase 3: Enhancement (Week 3)
7. ✅ Advanced learning algorithms
8. ✅ Performance optimization
9. ✅ Analytics and reporting

---

## 🔍 Key Implementation Details

### 1. Real-Time Processing
- Set up webhook listeners for transaction creation events
- Process transactions immediately upon arrival
- Track processing queue and throughput

### 2. Merchant Database
- Populate from historical mappings
- Update on every new mapping
- Use for instant lookup before LLM call

### 3. Continuous Learning
- Track every admin action
- Calculate accuracy improvements
- Update model weights based on feedback

### 4. Multi-Model Voting
- Integrate multiple LLM APIs (OpenAI, Anthropic, Google)
- Run predictions in parallel
- Take consensus or majority vote

### 5. Auto-Threshold Adjustment
- Monitor accuracy over time windows
- Adjust thresholds dynamically
- Store adjustment history

---

## 📝 Summary

**All 7 Automation Improvements Require:**

1. **Real-Time Processing:** Webhook-based event triggers
2. **Batch Processing:** Parallel batch queue system
3. **Continuous Learning:** Feedback loop and accuracy tracking
4. **Merchant Database:** Cached mapping lookup system
5. **Dynamic Thresholds:** Auto-adjusting confidence levels
6. **Multi-Model Voting:** Consensus from multiple AI models
7. **Pattern Recognition:** Learning from similar merchants

**Frontend Status:** ✅ Complete - UI ready, awaiting backend implementation

**Backend Status:** ⚠️ Implementation Required - See endpoints above

---

**Status:** Ready for Backend Implementation




