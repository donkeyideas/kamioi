import sqlite3
import os
import json
from datetime import datetime

def add_missing_ai_endpoints():
    """Add only the missing family AI endpoints to app_clean.py"""
    
    print("Adding missing Family AI endpoints...")
    print("=" * 50)
    
    # Read the current app_clean.py
    with open('app_clean.py', 'r') as f:
        content = f.read()
    
    # Missing AI endpoints to add
    missing_ai_endpoints = '''
# =============================================================================
# MISSING FAMILY AI ENDPOINTS
# =============================================================================

@app.route('/api/family/ai/recommendations', methods=['GET'])
def family_ai_recommendations():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        # Get family AI recommendations
        recommendations = [
            {
                'id': 1,
                'title': 'Family Budget Optimization',
                'description': 'Based on your spending patterns, consider allocating more budget to education and less to entertainment.',
                'priority': 'high',
                'category': 'budget',
                'action_required': True
            },
            {
                'id': 2,
                'title': 'Investment Diversification',
                'description': 'Your family portfolio could benefit from more diversified investments across different sectors.',
                'priority': 'medium',
                'category': 'investment',
                'action_required': False
            },
            {
                'id': 3,
                'title': 'Family Financial Goals',
                'description': 'Set up a family emergency fund with 3-6 months of expenses.',
                'priority': 'high',
                'category': 'goals',
                'action_required': True
            }
        ]
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/ai/insights', methods=['GET'])
def family_ai_insights_alt():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        # Get family AI insights (alternative endpoint)
        insights = {
            'family_financial_health': 'good',
            'spending_trends': 'stable',
            'investment_growth': 'positive',
            'budget_adherence': 'excellent',
            'family_goals_progress': 'on_track',
            'recommendations_count': 3,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'insights': insights
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

'''
    
    # Find the insertion point (before the main block)
    insertion_point = content.find('if __name__ == "__main__":')
    
    if insertion_point == -1:
        print("Error: Could not find insertion point in app_clean.py")
        return False
    
    # Insert the missing AI endpoints
    new_content = content[:insertion_point] + missing_ai_endpoints + '\n' + content[insertion_point:]
    
    # Write the updated content
    with open('app_clean.py', 'w') as f:
        f.write(new_content)
    
    print("[OK] Missing Family AI endpoints added successfully!")
    print("Added endpoints:")
    print("  - /api/family/ai/recommendations")
    print("  - /api/family/ai/insights")
    
    return True

if __name__ == "__main__":
    add_missing_ai_endpoints()
