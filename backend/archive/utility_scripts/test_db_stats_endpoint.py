#!/usr/bin/env python3
"""
Test the database stats endpoint to see what it actually returns
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Simulate the endpoint logic
from database_manager import db_manager, _ensure_db_manager

def test_stats():
    """Test what the stats endpoint returns"""
    print("[TEST] Testing database stats endpoint logic...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            stats = {
                'individual': {'users': 0, 'transactions': 0, 'goals': 0, 'notifications': 0, 'round_up_allocations': 0},
                'family': {'users': 0, 'transactions': 0, 'goals': 0, 'notifications': 0, 'round_up_allocations': 0},
                'business': {'users': 0, 'transactions': 0, 'goals': 0, 'notifications': 0, 'round_up_allocations': 0},
                'admin': {'users': 0, 'transactions': 0, 'goals': 0, 'notifications': 0, 'round_up_allocations': 0},
                'other': {'users': 0, 'transactions': 0, 'goals': 0, 'notifications': 0, 'round_up_allocations': 0},
                'total': {'users': 0, 'transactions': 0, 'goals': 0, 'notifications': 0, 'round_up_allocations': 0, 'llm_mappings': 0}
            }
            
            # Check if round_up_allocations table exists
            print("\n1. Checking round_up_allocations table...")
            try:
                result = conn.execute(text('SELECT COUNT(*) FROM round_up_allocations'))
                total_roundups = result.scalar() or 0
                stats['total']['round_up_allocations'] = total_roundups
                print(f"   Table exists, count: {total_roundups}")
            except Exception as e:
                stats['total']['round_up_allocations'] = 0
                print(f"   Table does not exist: {e}")
            
            # Check breakdown by account_type
            print("\n2. Checking breakdown by account_type...")
            for account_type in ['individual', 'family', 'business', 'admin']:
                try:
                    result = conn.execute(text('''
                        SELECT COUNT(*) FROM round_up_allocations ra
                        JOIN transactions t ON ra.transaction_id = t.id
                        JOIN users u ON t.user_id = u.id
                        WHERE u.account_type = :account_type
                    '''), {'account_type': account_type})
                    count = result.scalar() or 0
                    stats[account_type]['round_up_allocations'] = count
                    print(f"   {account_type}: {count}")
                except Exception as e:
                    stats[account_type]['round_up_allocations'] = 0
                    print(f"   {account_type}: 0 (error: {e})")
            
            print("\n3. Final stats:")
            print(json.dumps(stats, indent=2))
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            try:
                cursor.execute('SELECT COUNT(*) FROM round_up_allocations')
                total_roundups = cursor.fetchone()[0] or 0
                print(f"Total round_up_allocations: {total_roundups}")
            except Exception as e:
                print(f"Table does not exist: {e}")
            conn.close()
        
    except Exception as e:
        import traceback
        print(f"[ERROR] {e}")
        print(traceback.format_exc())
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    test_stats()


