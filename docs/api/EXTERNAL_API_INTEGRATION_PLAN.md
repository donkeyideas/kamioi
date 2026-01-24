# External API Integration Plan

## API Comparison

### **OpenAI Text-to-Speech API** ❌
- **Purpose**: Converts text to speech (audio generation)
- **NOT suitable** for merchant mapping analysis
- **Use case**: Voice assistants, audio content
- **Why not**: We need text reasoning, not speech synthesis

### **DeepSeek v3 API** ✅ **RECOMMENDED**
- **Purpose**: Large Language Model for text generation and reasoning
- **Perfect for**: Merchant mapping analysis, reasoning generation
- **Advantages**:
  - Cost-effective (cheaper than GPT-4)
  - Good reasoning capabilities
  - Fast response times
  - Available via RapidAPI
- **Use case**: Exactly what we need - analyze merchant data and generate reasoning

### **Alternative Options:**
1. **OpenAI GPT-4** (via OpenAI directly, not RapidAPI)
   - Best reasoning quality
   - More expensive
   - Requires OpenAI account

2. **Anthropic Claude**
   - Excellent reasoning
   - Good for structured outputs
   - Requires Anthropic account

3. **Google Gemini**
   - Cost-effective
   - Good performance
   - Requires Google Cloud account

---

## Recommended: DeepSeek v3 via RapidAPI

**Why DeepSeek v3:**
- ✅ Available on RapidAPI (easy integration)
- ✅ Designed for reasoning tasks
- ✅ Cost-effective
- ✅ Fast response times
- ✅ Good for structured outputs

**RapidAPI Endpoint**: https://rapidapi.com/swift-api-swift-api-default/api/deepseek-v31

---

## Implementation Plan

### **Phase 1: Backend Service Setup**

#### **1.1 Create AI Service File**
Create `backend/services/ai_processor.py`:

```python
import requests
import os
import json
from typing import Dict, Optional
from datetime import datetime

class AIProcessor:
    def __init__(self):
        self.rapidapi_key = os.getenv('RAPIDAPI_KEY')
        self.rapidapi_host = "deepseek-v31.p.rapidapi.com"
        self.base_url = "https://deepseek-v31.p.rapidapi.com/v1/chat/completions"
        
    def process_mapping(self, mapping: Dict) -> Dict:
        """
        Process a merchant mapping with AI
        
        Returns:
            {
                'ai_status': 'approved' | 'rejected' | 'review_required' | 'uncertain',
                'ai_confidence': float (0.0 to 1.0),
                'ai_reasoning': str,
                'ai_model_version': str,
                'ai_processing_duration': int (milliseconds)
            }
        """
        start_time = datetime.now()
        
        try:
            # Build prompt for AI
            prompt = self._build_prompt(mapping)
            
            # Call DeepSeek API
            response = self._call_deepseek_api(prompt)
            
            # Parse response
            result = self._parse_response(response, mapping)
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            result['ai_processing_duration'] = int(processing_time)
            result['ai_model_version'] = 'deepseek-v3'
            result['ai_attempted'] = True
            result['ai_processing_time'] = datetime.now().isoformat()
            
            return result
            
        except Exception as e:
            print(f"Error processing mapping with AI: {e}")
            return {
                'ai_attempted': True,
                'ai_status': 'error',
                'ai_confidence': 0.0,
                'ai_reasoning': f'Error: {str(e)}',
                'ai_model_version': 'deepseek-v3',
                'ai_processing_duration': int((datetime.now() - start_time).total_seconds() * 1000)
            }
    
    def _build_prompt(self, mapping: Dict) -> str:
        """Build the prompt for AI analysis"""
        merchant_name = mapping.get('merchant_name', 'Unknown')
        category = mapping.get('category', 'Unknown')
        ticker = mapping.get('ticker', '')
        user_id = mapping.get('user_id', '')
        
        # Get context from similar mappings (if available)
        context = self._get_similar_mappings_context(merchant_name)
        
        prompt = f"""You are an expert financial analyst analyzing merchant transaction mappings for investment purposes.

MERCHANT MAPPING TO ANALYZE:
- Merchant Name: {merchant_name}
- Category: {category}
- Current Ticker: {ticker or 'Not assigned'}
- User ID: {user_id}

CONTEXT FROM SIMILAR MAPPINGS:
{context}

YOUR TASK:
1. Determine the correct stock ticker for this merchant
2. Assess confidence level (0.0 to 1.0)
3. Provide clear reasoning for your decision
4. Recommend status: 'approved', 'rejected', 'review_required', or 'uncertain'

RESPOND IN JSON FORMAT:
{{
    "ticker": "AAPL",
    "confidence": 0.95,
    "status": "approved",
    "reasoning": "Clear explanation of decision"
}}

If you're uncertain, use status "review_required" and confidence < 0.7.
If the merchant cannot be matched, use status "rejected" and explain why.
"""
        return prompt
    
    def _get_similar_mappings_context(self, merchant_name: str) -> str:
        """Get context from similar merchant mappings"""
        # TODO: Query database for similar merchants
        # For now, return empty context
        return "No similar mappings found in database."
    
    def _call_deepseek_api(self, prompt: str) -> Dict:
        """Call DeepSeek v3 API via RapidAPI"""
        headers = {
            "x-rapidapi-key": self.rapidapi_key,
            "x-rapidapi-host": self.rapidapi_host,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a financial analyst expert. Always respond in valid JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,  # Lower temperature for more consistent results
            "max_tokens": 500
        }
        
        response = requests.post(
            self.base_url,
            headers=headers,
            json=payload,
            timeout=30  # 30 second timeout
        )
        
        if response.status_code != 200:
            raise Exception(f"API returned {response.status_code}: {response.text}")
        
        return response.json()
    
    def _parse_response(self, api_response: Dict, mapping: Dict) -> Dict:
        """Parse AI response and extract structured data"""
        try:
            # Extract content from API response
            content = api_response['choices'][0]['message']['content']
            
            # Try to parse as JSON
            try:
                parsed = json.loads(content)
                return {
                    'ai_status': parsed.get('status', 'uncertain'),
                    'ai_confidence': float(parsed.get('confidence', 0.5)),
                    'ai_reasoning': parsed.get('reasoning', content),
                    'suggested_ticker': parsed.get('ticker', mapping.get('ticker', ''))
                }
            except json.JSONDecodeError:
                # If not JSON, extract from text
                return {
                    'ai_status': 'review_required',
                    'ai_confidence': 0.5,
                    'ai_reasoning': content,
                    'suggested_ticker': mapping.get('ticker', '')
                }
                
        except Exception as e:
            return {
                'ai_status': 'error',
                'ai_confidence': 0.0,
                'ai_reasoning': f'Failed to parse AI response: {str(e)}',
                'suggested_ticker': mapping.get('ticker', '')
            }
```

#### **1.2 Create API Endpoint**
Create `backend/routes/llm_processing.py`:

```python
from flask import Blueprint, request, jsonify
from services.ai_processor import AIProcessor
from models.mapping import Mapping
from database import db
from datetime import datetime

llm_processing_bp = Blueprint('llm_processing', __name__)
ai_processor = AIProcessor()

@llm_processing_bp.route('/api/admin/llm-center/process-mapping/<int:mapping_id>', methods=['POST'])
def process_mapping(mapping_id):
    """Process a single mapping with AI"""
    try:
        # Get mapping from database
        mapping = Mapping.query.get_or_404(mapping_id)
        
        # Convert to dict
        mapping_dict = {
            'id': mapping.id,
            'merchant_name': mapping.merchant_name,
            'category': mapping.category,
            'ticker': mapping.ticker,
            'user_id': mapping.user_id,
            'status': mapping.status
        }
        
        # Process with AI
        ai_result = ai_processor.process_mapping(mapping_dict)
        
        # Update mapping in database
        mapping.ai_attempted = ai_result.get('ai_attempted', True)
        mapping.ai_status = ai_result.get('ai_status', 'uncertain')
        mapping.ai_confidence = ai_result.get('ai_confidence', 0.0)
        mapping.ai_reasoning = ai_result.get('ai_reasoning', '')
        mapping.ai_model_version = ai_result.get('ai_model_version', 'deepseek-v3')
        mapping.ai_processing_duration = ai_result.get('ai_processing_duration', 0)
        mapping.ai_processing_time = datetime.now()
        
        # Update suggested ticker if provided
        if ai_result.get('suggested_ticker'):
            mapping.suggested_ticker = ai_result.get('suggested_ticker')
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'mapping_id': mapping.id,
                'ai_status': mapping.ai_status,
                'ai_confidence': mapping.ai_confidence,
                'ai_reasoning': mapping.ai_reasoning
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@llm_processing_bp.route('/api/admin/llm-center/process-batch', methods=['POST'])
def process_batch():
    """Process multiple mappings in batch"""
    try:
        mapping_ids = request.json.get('mapping_ids', [])
        results = []
        
        for mapping_id in mapping_ids:
            try:
                mapping = Mapping.query.get(mapping_id)
                if not mapping:
                    continue
                
                # Process with AI
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
                mapping.ai_status = ai_result.get('ai_status', 'uncertain')
                mapping.ai_confidence = ai_result.get('ai_confidence', 0.0)
                mapping.ai_reasoning = ai_result.get('ai_reasoning', '')
                mapping.ai_model_version = ai_result.get('ai_model_version', 'deepseek-v3')
                mapping.ai_processing_duration = ai_result.get('ai_processing_duration', 0)
                mapping.ai_processing_time = datetime.now()
                
                results.append({
                    'mapping_id': mapping.id,
                    'success': True,
                    'ai_status': mapping.ai_status
                })
                
            except Exception as e:
                results.append({
                    'mapping_id': mapping_id,
                    'success': False,
                    'error': str(e)
                })
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'processed': len(results),
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

#### **1.3 Register Blueprint**
In `backend/app.py` or main file:

```python
from routes.llm_processing import llm_processing_bp

app.register_blueprint(llm_processing_bp)
```

---

### **Phase 2: Automatic Processing**

#### **2.1 Background Worker**
Create `backend/workers/ai_worker.py`:

```python
import time
from services.ai_processor import AIProcessor
from models.mapping import Mapping
from database import db

def process_pending_mappings():
    """Background worker to process pending mappings"""
    ai_processor = AIProcessor()
    
    while True:
        try:
            # Get pending mappings that haven't been processed
            pending = Mapping.query.filter(
                Mapping.status == 'pending',
                Mapping.ai_attempted == False
            ).limit(10).all()
            
            for mapping in pending:
                try:
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
                    mapping.ai_status = ai_result.get('ai_status', 'uncertain')
                    mapping.ai_confidence = ai_result.get('ai_confidence', 0.0)
                    mapping.ai_reasoning = ai_result.get('ai_reasoning', '')
                    mapping.ai_model_version = ai_result.get('ai_model_version', 'deepseek-v3')
                    mapping.ai_processing_duration = ai_result.get('ai_processing_duration', 0)
                    
                    db.session.commit()
                    
                except Exception as e:
                    print(f"Error processing mapping {mapping.id}: {e}")
                    db.session.rollback()
            
            # Sleep for 30 seconds before next batch
            time.sleep(30)
            
        except Exception as e:
            print(f"Error in worker: {e}")
            time.sleep(60)
```

#### **2.2 Trigger on Mapping Creation**
In your mapping creation endpoint:

```python
@mappings_bp.route('/api/mappings', methods=['POST'])
def create_mapping():
    # ... create mapping ...
    
    # Trigger AI processing asynchronously
    from workers.ai_worker import process_mapping_async
    process_mapping_async.delay(mapping.id)  # If using Celery
    # OR
    # Thread(target=process_mapping_with_ai, args=(mapping.id,)).start()
    
    return jsonify({'success': True, 'mapping_id': mapping.id})
```

---

### **Phase 3: Environment Setup**

#### **3.1 Add to `.env`**
```bash
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=deepseek-v31.p.rapidapi.com
```

#### **3.2 Install Dependencies**
```bash
pip install requests python-dotenv
```

---

### **Phase 4: Testing**

#### **4.1 Test Script**
```python
import requests

BASE_URL = "http://localhost:5111"
TOKEN = "admin_token_3"

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# Test processing
response = requests.post(
    f'{BASE_URL}/api/admin/llm-center/process-mapping/1',
    headers=headers
)

print(response.json())
```

---

## Cost Estimation

**DeepSeek v3 via RapidAPI:**
- Check RapidAPI pricing page
- Typically: Pay-per-request model
- Estimate: $0.001 - $0.01 per mapping
- For 1000 mappings/day: ~$1-10/day

---

## Next Steps

1. ✅ Get RapidAPI key from https://rapidapi.com/swift-api-swift-api-default/api/deepseek-v31
2. ✅ Add to `.env` file
3. ✅ Implement `ai_processor.py`
4. ✅ Create API endpoints
5. ✅ Test with sample mapping
6. ✅ Set up background worker
7. ✅ Monitor costs and accuracy

