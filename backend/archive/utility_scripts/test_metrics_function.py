from database_manager import db_manager
import sys
sys.path.insert(0, '.')

# Import the function
from app import _calculate_user_metrics

user_id = 108
use_postgresql = getattr(db_manager, '_use_postgresql', False)

print(f"Testing _calculate_user_metrics for user {user_id}")
print(f"Using PostgreSQL: {use_postgresql}")

metrics = _calculate_user_metrics(user_id, use_postgresql)

print("\nMetrics returned:")
print(f"  Round-ups: ${metrics.get('round_ups', 0)}")
print(f"  Fees: ${metrics.get('fees', 0)}")
print(f"  Total Balance: ${metrics.get('total_balance', 0)}")
print(f"  AI Health: {metrics.get('ai_health', 0)}")
print(f"  Mapping Accuracy: {metrics.get('mapping_accuracy', 0)}%")
print(f"  Engagement: {metrics.get('engagement_score', 0)}")
print(f"  Activity Count: {metrics.get('activity_count', 0)}")

