# Kamioi Platform - Scalability Architecture Plan

## Current State Analysis

### Current Architecture
- **Database**: SQLite (kamioi.db) - **Major bottleneck**
- **Backend**: Single-threaded Flask application
- **Caching**: In-memory Python dictionary with threading locks
- **Queue System**: None (synchronous processing)
- **Background Workers**: APScheduler (basic) - no distributed workers
- **Connection Pooling**: Basic (5 connections max)
- **Processing**: Synchronous, blocking operations

### Current Limitations
1. **SQLite cannot handle concurrent writes efficiently** at scale
2. **No horizontal scaling** - single server instance
3. **No message queue** - all operations are synchronous
4. **No distributed caching** - in-memory cache doesn't scale
5. **Database queries block** - no async processing
6. **No read replicas** - analytics queries slow down writes
7. **14+ million records** in `llm_mappings` table - queries getting slower

---

## Target Scale Requirements

### Transaction Volume
- **Current**: Thousands of transactions
- **Target**: 
  - **1M+ transactions/day** (peak)
  - **10M+ transactions/month**
  - **100M+ transactions/year**

### Data Volume
- **Current**: 14M+ LLM mappings
- **Target**: 
  - **100M+ LLM mappings**
  - **Billions of transaction records**
  - **Real-time processing** with sub-second latency

### Performance Targets
- **API Response Time**: <200ms (p95)
- **Transaction Processing**: <1s end-to-end
- **Dashboard Load**: <500ms (cached), <2s (uncached)
- **AI Processing**: <10s per batch (100 items)
- **Concurrent Users**: 10,000+ simultaneous users

---

## Scalability Architecture Plan

### Phase 1: Database Migration & Optimization (Priority: CRITICAL)

#### 1.1 Migrate from SQLite to PostgreSQL
**Why**: SQLite cannot handle concurrent writes at scale, PostgreSQL can handle millions of transactions per day.

**Migration Strategy**:
```python
# Migration script structure
1. Export data from SQLite
2. Transform schema (if needed)
3. Import to PostgreSQL
4. Validate data integrity
5. Run dual-write for transition period
6. Switch reads to PostgreSQL
7. Stop SQLite writes
```

**Benefits**:
- ✅ Concurrent writes (hundreds of connections)
- ✅ Better query optimization
- ✅ ACID compliance at scale
- ✅ Row-level locking (vs table-level in SQLite)
- ✅ Connection pooling (100+ connections)
- ✅ Replication support

**Estimated Time**: 2-3 days

#### 1.2 Add Critical Database Indexes
```sql
-- Transactions table indexes
CREATE INDEX idx_transactions_user_id_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_ticker ON transactions(ticker) WHERE ticker IS NOT NULL;
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- LLM Mappings table indexes (14M+ records)
CREATE INDEX idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC);
CREATE INDEX idx_llm_mappings_admin_approved ON llm_mappings(admin_approved) WHERE admin_approved = 0;
CREATE INDEX idx_llm_mappings_user_id_status ON llm_mappings(user_id, status);
CREATE INDEX idx_llm_mappings_merchant_ticker ON llm_mappings(merchant_name, ticker);
CREATE INDEX idx_llm_mappings_created_at ON llm_mappings(created_at DESC);

-- Partial indexes for common queries
CREATE INDEX idx_llm_mappings_pending ON llm_mappings(id) WHERE admin_approved = 0 AND user_id != '2';
CREATE INDEX idx_transactions_pending_ticker ON transactions(id) WHERE status = 'pending' AND ticker IS NOT NULL;
```

**Estimated Time**: 1 day

#### 1.3 Implement Database Connection Pooling
```python
# Using SQLAlchemy connection pool
from sqlalchemy import create_engine, pool

engine = create_engine(
    'postgresql://user:pass@host/db',
    pool_size=20,           # Base connections
    max_overflow=40,        # Additional connections
    pool_timeout=30,
    pool_recycle=3600,      # Recycle connections after 1 hour
    pool_pre_ping=True      # Verify connections before using
)
```

**Estimated Time**: 4 hours

---

### Phase 2: Caching Layer (Priority: HIGH)

#### 2.1 Implement Redis for Distributed Caching
**Why**: In-memory Python dictionaries don't scale across multiple servers.

**Architecture**:
```
Frontend → API → Redis Cache → PostgreSQL
                    ↓
              (Cache Miss)
```

**Implementation**:
```python
import redis
from functools import wraps

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

def cache_result(key_prefix, ttl=300):
    """Decorator for caching API responses"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{hash(str(args) + str(kwargs))}"
            
            # Try cache first
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Cache miss - execute function
            result = func(*args, **kwargs)
            
            # Store in cache
            redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result)
            )
            return result
        return wrapper
    return decorator

# Usage
@cache_result('llm_dashboard', ttl=900)  # 15 minutes
def get_llm_dashboard():
    # ... expensive query ...
    pass
```

**Cache Keys Strategy**:
- `llm:dashboard:{user_id}` - Dashboard data (15 min TTL)
- `llm:analytics:{date}` - Analytics data (1 hour TTL)
- `llm:mappings:{status}:{page}` - Paginated mappings (5 min TTL)
- `llm:queue:count` - Queue count (30 sec TTL)
- `transactions:user:{user_id}:{page}` - User transactions (5 min TTL)

**Estimated Time**: 1 day

#### 2.2 Cache Invalidation Strategy
```python
def invalidate_cache(pattern):
    """Invalidate cache keys matching pattern"""
    keys = redis_client.keys(f"{pattern}*")
    if keys:
        redis_client.delete(*keys)

# Invalidate on mutations
@app.route('/api/admin/llm-center/approve', methods=['POST'])
def approve_mapping():
    # ... approve logic ...
    invalidate_cache('llm:dashboard')
    invalidate_cache('llm:mappings')
    return jsonify({'success': True})
```

---

### Phase 3: Message Queue System (Priority: HIGH)

#### 3.1 Implement RabbitMQ or Redis Queue for Async Processing
**Why**: Synchronous processing blocks API responses and doesn't scale.

**Architecture**:
```
API Endpoint → Message Queue → Worker Process → Database
     ↓
  (Returns immediately)
     ↓
  (WebSocket/SSE for status updates)
```

**Implementation with Celery + Redis**:
```python
# celery_config.py
from celery import Celery

celery_app = Celery(
    'kamioi',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000
)

# tasks.py
@celery_app.task(name='process_llm_queue')
def process_llm_queue_batch(batch_size=100):
    """Process LLM mappings queue asynchronously"""
    # Get pending mappings
    # Process with AI
    # Update database
    # Return results
    pass

@celery_app.task(name='process_transaction')
def process_transaction_async(transaction_id):
    """Process transaction asynchronously"""
    # Map merchant to ticker
    # Calculate shares
    # Update portfolio
    # Send notifications
    pass

# In API endpoint
@app.route('/api/admin/ai/process-queue', methods=['POST'])
def admin_ai_process_queue():
    """Queue AI processing task"""
    task = process_llm_queue_batch.delay(batch_size=100)
    return jsonify({
        'success': True,
        'task_id': task.id,
        'status': 'queued'
    })
```

**Worker Process**:
```bash
# Start worker
celery -A celery_config worker --loglevel=info --concurrency=4

# Scale workers
celery -A celery_config worker --loglevel=info --concurrency=8
```

**Benefits**:
- ✅ Non-blocking API responses (<100ms)
- ✅ Horizontal scaling (add more workers)
- ✅ Retry logic for failed tasks
- ✅ Task prioritization
- ✅ Monitoring and metrics

**Estimated Time**: 2 days

---

### Phase 4: Background Workers & Scheduled Tasks (Priority: MEDIUM)

#### 4.1 Separate Worker Process for Heavy Operations
**Operations to Move to Workers**:
- AI/LLM processing
- Transaction processing
- Bulk operations
- Analytics calculations
- Report generation
- Email notifications

**Worker Architecture**:
```
Main API Server (Flask) - Fast, lightweight
    ↓
Message Queue (RabbitMQ/Redis)
    ↓
Worker Pool (Celery Workers)
    ├── AI Processing Workers
    ├── Transaction Processing Workers
    ├── Analytics Workers
    └── Notification Workers
```

**Estimated Time**: 1 day

#### 4.2 Scheduled Tasks Migration
Move from APScheduler to Celery Beat:
```python
# celery_beat_schedule.py
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'process-llm-queue-every-5-min': {
        'task': 'process_llm_queue',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
    'calculate-analytics-hourly': {
        'task': 'calculate_analytics',
        'schedule': crontab(minute=0),  # Every hour
    },
    'monthly-amortization': {
        'task': 'monthly_llm_amortization',
        'schedule': crontab(day_of_month=1, hour=0, minute=1),
    },
}
```

---

### Phase 5: Database Optimization for Scale (Priority: MEDIUM)

#### 5.1 Implement Table Partitioning
For large tables (transactions, llm_mappings), partition by date:
```sql
-- Partition transactions by month
CREATE TABLE transactions_y2025m01 PARTITION OF transactions
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE transactions_y2025m02 PARTITION OF transactions
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

**Benefits**:
- Faster queries (only scan relevant partitions)
- Easier maintenance (drop old partitions)
- Better index performance

**Estimated Time**: 1 day

#### 5.2 Create Materialized Views for Analytics
```sql
-- Pre-computed analytics
CREATE MATERIALIZED VIEW llm_analytics_summary AS
SELECT 
    DATE(created_at) as date,
    status,
    COUNT(*) as count,
    AVG(confidence) as avg_confidence
FROM llm_mappings
GROUP BY DATE(created_at), status;

-- Refresh periodically (via Celery Beat)
REFRESH MATERIALIZED VIEW CONCURRENTLY llm_analytics_summary;
```

**Estimated Time**: 4 hours

#### 5.3 Read Replicas for Analytics
```python
# Separate read replica for heavy analytics queries
analytics_db = create_engine(
    'postgresql://replica:pass@replica-host/db',
    pool_size=10
)

# Route read-only queries to replica
def get_analytics_data():
    # Use read replica
    with analytics_db.connect() as conn:
        # ... analytics queries ...
        pass

# Write operations still go to primary
def create_transaction():
    # Use primary database
    with primary_db.connect() as conn:
        # ... write operations ...
        pass
```

**Estimated Time**: 1 day

---

### Phase 6: API Optimization (Priority: MEDIUM)

#### 6.1 Implement Pagination & Cursor-Based Pagination
```python
@app.route('/api/admin/llm-center/mappings')
def get_llm_mappings():
    # Cursor-based pagination (more efficient than offset)
    cursor = request.args.get('cursor')
    limit = int(request.args.get('limit', 20))
    
    if cursor:
        # Fetch after cursor
        mappings = db.query(Mapping).filter(
            Mapping.id > cursor
        ).limit(limit).all()
    else:
        # First page
        mappings = db.query(Mapping).limit(limit).all()
    
    next_cursor = mappings[-1].id if mappings else None
    
    return jsonify({
        'data': mappings,
        'next_cursor': next_cursor,
        'has_more': len(mappings) == limit
    })
```

**Estimated Time**: 4 hours

#### 6.2 Implement API Response Compression
```python
from flask_compress import Compress

app = Flask(__name__)
Compress(app)  # Automatic gzip compression
```

**Estimated Time**: 30 minutes

#### 6.3 Add API Rate Limiting
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/admin/llm-center/dashboard')
@limiter.limit("10 per minute")
def llm_dashboard():
    # ... endpoint logic ...
    pass
```

**Estimated Time**: 2 hours

---

### Phase 7: Horizontal Scaling (Priority: LOW - Future)

#### 7.1 Load Balancing
```
Client → Load Balancer (Nginx/HAProxy)
    ├── API Server 1
    ├── API Server 2
    └── API Server 3
```

**Configuration**:
```nginx
# nginx.conf
upstream kamioi_backend {
    least_conn;  # Least connections load balancing
    server api1.kamioi.com;
    server api2.kamioi.com;
    server api3.kamioi.com;
}

server {
    location /api/ {
        proxy_pass http://kamioi_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 7.2 Container Orchestration (Docker + Kubernetes)
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    image: kamioi/api:latest
    replicas: 3
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
  
  worker:
    image: kamioi/worker:latest
    replicas: 5
    command: celery -A celery_config worker
  
  redis:
    image: redis:7-alpine
  
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- ✅ Database migration (SQLite → PostgreSQL)
- ✅ Add database indexes
- ✅ Implement connection pooling
- ✅ Set up Redis caching

**Expected Impact**: 
- 50-70% faster queries
- Support for concurrent writes
- Better caching performance

### Phase 2: Async Processing (Weeks 3-4)
- ✅ Set up Celery + Redis queue
- ✅ Move AI processing to workers
- ✅ Move transaction processing to workers
- ✅ Implement task monitoring

**Expected Impact**:
- API response time: 5s → <200ms
- Non-blocking operations
- Better user experience

### Phase 3: Optimization (Weeks 5-6)
- ✅ Table partitioning
- ✅ Materialized views
- ✅ Read replicas
- ✅ API optimizations

**Expected Impact**:
- Analytics queries: 10s → <1s
- Dashboard load: 2s → <500ms
- Better scalability

### Phase 4: Scale (Weeks 7-8)
- ✅ Horizontal scaling
- ✅ Load balancing
- ✅ Container orchestration
- ✅ Monitoring & alerting

**Expected Impact**:
- Handle 10,000+ concurrent users
- Process millions of transactions/day
- 99.9% uptime

---

## Cost Estimates

### Infrastructure Costs (Monthly)

| Component | Specs | Cost (AWS) |
|-----------|-------|------------|
| PostgreSQL RDS | db.r5.xlarge (4 vCPU, 32GB) | $250 |
| Redis ElastiCache | cache.r5.large (2 vCPU, 13GB) | $120 |
| API Servers (3x) | t3.medium (2 vCPU, 4GB) | $90 |
| Worker Servers (5x) | t3.large (2 vCPU, 8GB) | $250 |
| Load Balancer | Application LB | $25 |
| **Total** | | **$735/month** |

### Alternative: Self-Hosted
- VPS/Dedicated servers: $200-400/month
- Requires DevOps expertise
- More control, lower cost

---

## Monitoring & Observability

### Metrics to Track
1. **API Performance**
   - Response time (p50, p95, p99)
   - Request rate (requests/second)
   - Error rate
   - Queue depth

2. **Database Performance**
   - Query time
   - Connection pool usage
   - Slow queries
   - Lock contention

3. **Worker Performance**
   - Task processing time
   - Queue size
   - Worker utilization
   - Failed tasks

4. **Cache Performance**
   - Hit rate
   - Memory usage
   - Eviction rate

### Tools
- **Prometheus + Grafana** - Metrics & dashboards
- **Sentry** - Error tracking
- **ELK Stack** - Log aggregation
- **New Relic / Datadog** - APM (optional)

---

## Risk Mitigation

### Database Migration Risks
- **Risk**: Data loss during migration
- **Mitigation**: 
  - Full backup before migration
  - Dual-write period (write to both DBs)
  - Validate data integrity
  - Rollback plan

### Performance Regression Risks
- **Risk**: Changes slow down the system
- **Mitigation**:
  - Load testing before deployment
  - Gradual rollout (feature flags)
  - Monitor metrics closely
  - Rollback procedure

### Scaling Costs
- **Risk**: Costs increase with scale
- **Mitigation**:
  - Auto-scaling based on load
  - Cost alerts
  - Resource optimization
  - Reserved instances for baseline

---

## Success Metrics

### Performance Targets
- ✅ API response time: <200ms (p95)
- ✅ Dashboard load: <500ms (cached)
- ✅ Transaction processing: <1s end-to-end
- ✅ AI processing: <10s per batch
- ✅ Database query time: <100ms (p95)

### Scalability Targets
- ✅ Handle 1M+ transactions/day
- ✅ Support 10,000+ concurrent users
- ✅ Process 100+ AI mappings/second
- ✅ 99.9% uptime

### Cost Targets
- ✅ Infrastructure cost: <$1000/month
- ✅ Cost per transaction: <$0.001
- ✅ Cost per user: <$0.10/month

---

## Next Steps

1. **Review & Approve** this architecture plan
2. **Set up development environment** with PostgreSQL & Redis
3. **Start Phase 1** (Database migration)
4. **Set up monitoring** from day 1
5. **Load test** after each phase
6. **Iterate** based on metrics

---

## Questions & Considerations

1. **Current transaction volume** - How many transactions/day currently?
2. **Expected growth rate** - When do you expect to hit 1M transactions/day?
3. **Budget constraints** - What's the monthly infrastructure budget?
4. **Team expertise** - Do you have DevOps/DBA expertise?
5. **Timeline** - When do you need this scaled?
6. **High availability** - Do you need 99.9% uptime SLA?

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Author**: AI Architecture Analysis

