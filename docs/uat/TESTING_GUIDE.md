# Kamioi Platform Testing Guide

## Overview
This guide provides comprehensive testing instructions for the Kamioi platform's new architecture and systems. All systems are now operational and ready for testing.

## Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3764` (or your configured port)
- PowerShell or curl for API testing

## System Architecture Status

### ✅ Core Systems Implemented
1. **Event Bus** - Central event management system
2. **Mapping Queue** - LLM proposal and admin review system
3. **Round-up Engine** - Automated round-up calculation and processing
4. **Auto-Mapping Pipeline** - Intelligent merchant-to-ticker mapping
5. **Auto-Insights Engine** - Automated insight generation
6. **Materialized Views** - Pre-computed dashboard views
7. **Health Monitoring** - System health and performance monitoring
8. **Audit Logging** - Comprehensive audit trail system

## Testing Instructions

### 1. Event Bus System
Test the central event management system:

```powershell
# Get event bus statistics
curl http://localhost:5000/api/admin/events/stats

# Get event history
curl http://localhost:5000/api/admin/events/history

# Publish a test event
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/events/publish" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"event_type": "TEST_EVENT", "tenant_id": "user_1", "tenant_type": "user", "data": {"test": "data"}}'
```

### 2. Mapping Queue System
Test the LLM proposal and admin review workflow:

```powershell
# Get queue status
curl http://localhost:5000/api/admin/llm-center/queue

# Submit a mapping for review
Invoke-WebRequest -Uri "http://localhost:5000/api/mappings/submit" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"transaction_id": 123, "merchant_name": "Starbucks", "ticker": "SBUX", "category": "Food & Beverage", "confidence": 0.95}'

# Approve a mapping (replace mapping_id with actual ID)
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/llm-center/approve" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"mapping_id": 1, "admin_id": "admin_1", "notes": "Approved after review"}'

# Reject a mapping
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/llm-center/reject" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"mapping_id": 1, "admin_id": "admin_1", "reason": "Incorrect ticker"}'
```

### 3. Round-up Engine
Test the automated round-up calculation system:

```powershell
# Get user round-up statistics
curl http://localhost:5000/api/roundup/stats/1

# Get admin round-up overview
curl http://localhost:5000/api/admin/roundup/stats

# Get round-up ledger
curl http://localhost:5000/api/admin/roundup/ledger

# Set user round-up preference
Invoke-WebRequest -Uri "http://localhost:5000/api/roundup/preferences/1" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"round_up_amount": 1.00, "auto_sweep": true}'

# Manual round-up sweep
Invoke-WebRequest -Uri "http://localhost:5000/api/roundup/sweep/1" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'
```

### 4. Auto-Mapping Pipeline
Test the intelligent merchant-to-ticker mapping system:

```powershell
# Get auto-mapping statistics
curl http://localhost:5000/api/admin/auto-mapping/stats

# Test a mapping
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/auto-mapping/test" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"merchant_name": "McDonald'\''s", "amount": 12.50}'

# Add a new mapping rule
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/auto-mapping/add-rule" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"pattern": "mcdonalds", "ticker": "MCD", "category": "Food & Beverage", "confidence": 0.95}'

# Auto-map a merchant
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/auto-mapping/map" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"merchant_name": "Target", "amount": 45.75}'
```

### 5. Auto-Insights Engine
Test the automated insight generation system:

```powershell
# Get auto-insights statistics
curl http://localhost:5000/api/admin/auto-insights/stats

# Generate insights for a user
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/auto-insights/generate" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"user_id": "1", "insight_types": ["spending_patterns", "investment_opportunities"]}'

# Get user-specific insights
curl http://localhost:5000/api/admin/auto-insights/user/1

# Clear old insights
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/auto-insights/clear-old" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"days_old": 30}'
```

### 6. Materialized Views
Test the pre-computed dashboard views system:

```powershell
# Get materialized views statistics
curl http://localhost:5000/api/admin/materialized-views/stats

# Get specific view data
curl http://localhost:5000/api/admin/materialized-views/mv_user_dashboard

# Refresh a specific view
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/materialized-views/mv_user_dashboard/refresh" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'

# Refresh all views
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/materialized-views/refresh-all" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{}'
```

### 7. Health Monitoring
Test the system health monitoring:

```powershell
# Get overall system health
curl http://localhost:5000/api/admin/health/overall

# Get all health checks
curl http://localhost:5000/api/admin/health/checks

# Get specific service health
curl http://localhost:5000/api/admin/health/service/database

# Get health history
curl http://localhost:5000/api/admin/health/history

# Run a specific health check
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/health/run-check" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"check_name": "database_connection"}'
```

### 8. Audit Logging
Test the comprehensive audit trail system:

```powershell
# Get audit logs
curl http://localhost:5000/api/admin/audit/logs

# Get audit statistics
curl http://localhost:5000/api/admin/audit/stats

# Get user activity logs
curl http://localhost:5000/api/admin/audit/user-activity/1

# Get admin action logs
curl http://localhost:5000/api/admin/audit/admin-actions

# Get security event logs
curl http://localhost:5000/api/admin/audit/security-events

# Export audit logs
curl http://localhost:5000/api/admin/audit/export

# Clear old audit logs
Invoke-WebRequest -Uri "http://localhost:5000/api/admin/audit/clear-old" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"days_old": 90}'
```

### 9. Transaction Processing
Test the transaction processing and round-up system:

```powershell
# Submit a new transaction
Invoke-WebRequest -Uri "http://localhost:5000/api/transactions" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"date": "2025-01-15", "merchant": "Coffee Shop", "amount": 4.75, "description": "Morning coffee"}'

# Get user transactions
curl http://localhost:5000/api/user/transactions

# Get admin aggregated transactions
curl http://localhost:5000/api/admin/transactions
```

### 10. Ticker Lookup System
Test the stock ticker lookup functionality:

```powershell
# Lookup ticker for a company
Invoke-WebRequest -Uri "http://localhost:5000/api/lookup/ticker" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"merchant_name": "Apple"}'

# Test with various company names
Invoke-WebRequest -Uri "http://localhost:5000/api/lookup/ticker" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"merchant_name": "Microsoft"}'
Invoke-WebRequest -Uri "http://localhost:5000/api/lookup/ticker" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"merchant_name": "Google"}'
```

### 11. Mapping History
Test the mapping history and AI Insights system:

```powershell
# Get mapping history
curl http://localhost:5000/api/mappings/history

# Get user AI insights
curl http://localhost:5000/api/user/ai/insights

# Get family AI insights
curl http://localhost:5000/api/family/ai/insights
```

## Frontend Testing

### 1. User Dashboard
- Navigate to `http://localhost:3764/user`
- Test CSV upload functionality
- Test transaction mapping
- Verify round-up calculations
- Check AI Insights page

### 2. Family Dashboard
- Navigate to `http://localhost:3764/family`
- Test family transaction aggregation
- Verify shared portfolio views
- Check family AI insights

### 3. Business Dashboard
- Navigate to `http://localhost:3764/business`
- Test business transaction management
- Verify team spending analytics
- Check business AI insights

### 4. Admin Dashboard
- Navigate to `http://localhost:3764/admin`
- Test Platform Overview
- Test Financial Analytics
- Test Transactions aggregation
- Test LLM Center queue management
- Test all new admin systems

## Integration Testing

### 1. End-to-End Transaction Flow
1. Upload a CSV file in User Dashboard
2. Verify transaction appears in Admin Transactions
3. Map the transaction using the mapping modal
4. Verify mapping appears in AI Insights
5. Check that mapping is queued for admin review
6. Approve/reject mapping in Admin LLM Center
7. Verify round-up calculations are applied

### 2. Event-Driven Architecture
1. Submit a transaction
2. Check event bus for INGEST_RAW event
3. Verify materialized views are refreshed
4. Check that insights are generated
5. Verify audit logs are created

### 3. Real-time Updates
1. Open multiple browser tabs
2. Submit a transaction in one tab
3. Verify updates appear in other tabs
4. Test WebSocket connections (if implemented)

## Performance Testing

### 1. Load Testing
- Submit multiple transactions simultaneously
- Test with large CSV files
- Verify system responsiveness under load

### 2. Memory Testing
- Monitor memory usage during extended operation
- Test with large datasets
- Verify garbage collection is working properly

## Security Testing

### 1. Input Validation
- Test with malformed JSON
- Test with SQL injection attempts
- Test with XSS payloads

### 2. Authentication
- Test unauthorized access attempts
- Verify session management
- Test API key validation

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure backend CORS is properly configured
2. **404 Errors**: Check that all endpoints are registered
3. **Unicode Errors**: Ensure no emoji characters in Python code
4. **Database Errors**: Verify database initialization

### Debug Commands
```powershell
# Check backend health
curl http://localhost:5000/api/health

# Check specific endpoint
curl http://localhost:5000/api/admin/events/stats

# Check frontend connectivity
curl http://localhost:3764
```

## Success Criteria

### ✅ System Integration
- All systems communicate properly
- Events flow through the event bus
- Data is synchronized across dashboards
- Real-time updates work correctly

### ✅ Functionality
- CSV upload and parsing works
- Transaction mapping is functional
- Round-up calculations are accurate
- Admin review workflow is operational
- AI insights are generated
- Audit logging is comprehensive

### ✅ Performance
- System responds within acceptable timeframes
- Memory usage is stable
- No memory leaks detected
- Concurrent operations work properly

### ✅ Security
- Input validation prevents malicious data
- Authentication is properly enforced
- Audit logs capture all actions
- No sensitive data is exposed

## Next Steps

1. **Database Integration**: Replace in-memory storage with persistent database
2. **WebSocket Implementation**: Add real-time updates via WebSockets
3. **External API Integration**: Connect to real stock price APIs
4. **Machine Learning**: Implement actual ML models for auto-mapping
5. **Production Deployment**: Deploy to production environment
6. **Monitoring**: Set up production monitoring and alerting

## Support

For issues or questions:
1. Check the console logs in both frontend and backend
2. Verify all endpoints are responding correctly
3. Check the event bus for error events
4. Review audit logs for system activity
5. Test individual components in isolation

The system is now fully operational and ready for comprehensive testing!
