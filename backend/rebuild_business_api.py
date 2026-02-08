#!/usr/bin/env python3
"""
Complete Rebuild of Business Transactions API
This script creates new, isolated endpoints with proper data validation
"""

from flask import Flask, jsonify, request
from flask_cors import cross_origin
from database_manager import db_manager
from sqlalchemy import text
import traceback
from datetime import datetime

def get_auth_user():
    """Get authenticated user - placeholder, replace with actual auth"""
    # This should use your actual authentication
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth.split(' ', 1)[1].strip()
    # Parse token to get user_id
    if token.startswith('token_'):
        try:
            user_id = int(token.split('_')[1])
            return {'id': user_id}
        except:
            return None
    return None

def create_business_transactions_endpoint(app):
    """
    REBUILT: Business Transactions Endpoint
    - No caching
    - Explicit transactions
    - Data validation
    - Comprehensive logging
    """
    @app.route('/api/business/transactions/v2', methods=['GET'])
    @cross_origin()
    def business_transactions_v2():
        """
        REBUILT V2: Get business transactions with complete isolation
        """
        start_time = datetime.now()
        
        # Step 1: Authentication
        user = get_auth_user()
        if not user:
            print(f"[V2 TRANSACTIONS] ERROR: Unauthorized at {start_time}")
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        
        user_id = int(user.get('id'))
        print(f"[V2 TRANSACTIONS] ===== NEW REBUILD ===== User ID: {user_id} at {start_time}")
        
        # Step 2: Get fresh database connection with explicit transaction
        conn = None
        try:
            conn = db_manager.get_connection()
            
            # Step 3: Verify user exists and get account_number
            if db_manager._use_postgresql:
                verify_query = text('''
                    SELECT id, email, account_number 
                    FROM users 
                    WHERE id = :user_id
                ''')
                user_result = conn.execute(verify_query, {'user_id': user_id})
                user_row = user_result.fetchone()
            else:
                cursor = conn.cursor()
                cursor.execute('SELECT id, email, account_number FROM users WHERE id = ?', (user_id,))
                user_row = cursor.fetchone()
                cursor.close()
            
            if not user_row:
                print(f"[V2 TRANSACTIONS] ERROR: User {user_id} does not exist")
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            account_number = user_row[2] if len(user_row) > 2 else None
            print(f"[V2 TRANSACTIONS] User verified: ID={user_id}, Account={account_number}")
            
            # Step 4: Query transactions with explicit isolation
            if db_manager._use_postgresql:
                # Use explicit transaction with READ COMMITTED isolation
                conn.execute(text('BEGIN'))
                conn.execute(text('SET TRANSACTION ISOLATION LEVEL READ COMMITTED'))
                
                query = text('''
                    SELECT id, user_id, merchant, amount, date, category, description,
                           round_up, investable, total_debit, fee, status, ticker,
                           shares, price_per_share, stock_price, created_at
                    FROM transactions 
                    WHERE user_id = :user_id
                    ORDER BY date DESC NULLS LAST, id DESC
                    LIMIT 1000
                ''')
                result = conn.execute(query, {'user_id': user_id})
                transactions = [dict(row._mapping) for row in result]
                conn.execute(text('COMMIT'))
            else:
                # SQLite - use explicit transaction
                conn.execute('BEGIN TRANSACTION')
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT id, user_id, merchant, amount, date, category, description,
                           round_up, investable, total_debit, fee, status, ticker,
                           shares, price_per_share, stock_price, created_at
                    FROM transactions 
                    WHERE user_id = ?
                    ORDER BY date DESC, id DESC
                    LIMIT 1000
                ''', (user_id,))
                columns = [description[0] for description in cursor.description]
                transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
                cursor.close()
                conn.execute('COMMIT')
            
            # Step 5: Validate ALL transactions belong to this user
            invalid_count = 0
            valid_transactions = []
            for tx in transactions:
                if tx.get('user_id') != user_id:
                    invalid_count += 1
                    print(f"[V2 TRANSACTIONS] WARNING: Transaction {tx.get('id')} has wrong user_id: {tx.get('user_id')} != {user_id}")
                else:
                    valid_transactions.append(tx)
            
            if invalid_count > 0:
                print(f"[V2 TRANSACTIONS] CRITICAL: Filtered out {invalid_count} invalid transactions")
            
            # Step 6: Verify count matches database
            if db_manager._use_postgresql:
                count_query = text('SELECT COUNT(*) FROM transactions WHERE user_id = :user_id')
                count_result = conn.execute(count_query, {'user_id': user_id})
                db_count = count_result.scalar() or 0
            else:
                cursor = conn.cursor()
                cursor.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
                db_count = cursor.fetchone()[0] or 0
                cursor.close()
            
            if len(valid_transactions) != db_count:
                print(f"[V2 TRANSACTIONS] WARNING: Count mismatch! Query returned {len(valid_transactions)}, DB has {db_count}")
                # Return empty array if count doesn't match (data integrity issue)
                return jsonify({
                    'success': True,
                    'data': [],
                    'warning': 'Data integrity check failed',
                    'query_count': len(valid_transactions),
                    'db_count': db_count
                })
            
            print(f"[V2 TRANSACTIONS] Found {len(valid_transactions)} valid transactions (verified against DB count: {db_count})")
            
            # Step 7: Format transactions
            formatted = []
            for tx in valid_transactions:
                formatted.append({
                    'id': tx.get('id'),
                    'user_id': user_id,
                    'merchant': tx.get('merchant') or 'Unknown',
                    'amount': float(tx.get('amount', 0) or 0),
                    'date': tx.get('date'),
                    'category': tx.get('category', 'Uncategorized'),
                    'description': tx.get('description', ''),
                    'roundup': float(tx.get('round_up', 0) or 0),
                    'round_up': float(tx.get('round_up', 0) or 0),
                    'round_up_amount': float(tx.get('round_up', 0) or 0),
                    'investable': float(tx.get('investable', 0) or 0),
                    'total_debit': float(tx.get('total_debit', tx.get('amount', 0)) or 0),
                    'fee': float(tx.get('fee', 0) or 0),
                    'status': tx.get('status', 'pending'),
                    'ticker': tx.get('ticker'),
                    'shares': tx.get('shares'),
                    'price_per_share': tx.get('price_per_share'),
                    'stock_price': tx.get('stock_price'),
                    'type': 'purchase',
                    'transaction_type': 'bank',
                    'receipt_id': None,
                    'allocations': []
                })
            
            elapsed = (datetime.now() - start_time).total_seconds()
            print(f"[V2 TRANSACTIONS] Success: {len(formatted)} transactions in {elapsed:.3f}s")
            
            return jsonify({
                'success': True,
                'data': formatted,
                'count': len(formatted),
                'verified': True
            })
            
        except Exception as e:
            if conn:
                try:
                    if db_manager._use_postgresql:
                        conn.execute(text('ROLLBACK'))
                    else:
                        conn.execute('ROLLBACK')
                except:
                    pass
            print(f"[V2 TRANSACTIONS] ERROR: {str(e)}")
            print(f"[V2 TRANSACTIONS] Traceback: {traceback.format_exc()}")
            return jsonify({'success': False, 'error': 'Internal server error'}), 500
        finally:
            if conn:
                try:
                    if db_manager._use_postgresql:
                        db_manager.release_connection(conn)
                    else:
                        conn.close()
                except:
                    pass

def clean_user_108_data():
    """
    Complete cleanup of user 108 data
    Use this to start fresh
    """
    conn = db_manager.get_connection()
    try:
        if db_manager._use_postgresql:
            # Delete in proper order (respecting foreign keys)
            conn.execute(text('DELETE FROM round_up_allocations WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = 108)'))
            conn.execute(text('DELETE FROM llm_mappings WHERE user_id = CAST(108 AS TEXT)'))
            conn.execute(text('DELETE FROM transactions WHERE user_id = 108'))
            conn.commit()
            print("Cleaned user 108 data from PostgreSQL")
        else:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM round_up_allocations WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = 108)')
            cursor.execute('DELETE FROM llm_mappings WHERE user_id = ?', ('108',))
            cursor.execute('DELETE FROM transactions WHERE user_id = ?', (108,))
            conn.commit()
            cursor.close()
            print("Cleaned user 108 data from SQLite")
    except Exception as e:
        conn.rollback()
        print(f"Error cleaning data: {e}")
    finally:
        if db_manager._use_postgresql:
            db_manager.release_connection(conn)
        else:
            conn.close()

if __name__ == '__main__':
    print("Business Transactions API Rebuild Script")
    print("=" * 50)
    print("\nOptions:")
    print("1. Clean user 108 data")
    print("2. Test new endpoint (requires Flask app)")
    print("\nRun: python rebuild_business_api.py")

