#!/usr/bin/env python3
"""
Script to calculate P&L TOTAL REVENUE from GL accounts (40100-40900)
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database_manager import db_manager, _ensure_db_manager

def calculate_pnl_revenue():
    """Calculate TOTAL REVENUE from P&L (sum of revenue accounts 40100-40900)"""
    print("[CALCULATE P&L REVENUE] Calculating TOTAL REVENUE from P&L...")
    
    global db_manager
    if db_manager is None:
        db_manager = _ensure_db_manager()
    
    conn = db_manager.get_connection()
    
    try:
        if db_manager._use_postgresql:
            from sqlalchemy import text
            
            # Calculate TOTAL REVENUE from revenue accounts (40100-40900)
            result = conn.execute(text('''
                SELECT COALESCE(SUM(ab.balance), 0) as total_revenue
                FROM account_balances ab
                JOIN chart_of_accounts coa ON ab.account_number = coa.account_number
                WHERE coa.category = 'Revenue'
                  AND coa.account_number BETWEEN '40100' AND '40900'
                  AND coa.is_active = 1
            '''))
            total_revenue = float(result.scalar() or 0)
            
            print(f"\n1. TOTAL REVENUE from P&L (Revenue accounts 40100-40900): ${total_revenue:.2f}")
            
            # Show breakdown by account
            print("\n2. Revenue account breakdown:")
            result = conn.execute(text('''
                SELECT 
                    coa.account_number,
                    coa.account_name,
                    COALESCE(ab.balance, 0) as balance
                FROM chart_of_accounts coa
                LEFT JOIN account_balances ab ON coa.account_number = ab.account_number
                WHERE coa.category = 'Revenue'
                  AND coa.account_number BETWEEN '40100' AND '40900'
                  AND coa.is_active = 1
                ORDER BY coa.account_number
            '''))
            
            for row in result:
                account_num, account_name, balance = row
                print(f"   {account_num} - {account_name}: ${float(balance):.2f}")
            
            db_manager.release_connection(conn)
        else:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT COALESCE(SUM(ab.balance), 0) as total_revenue
                FROM account_balances ab
                JOIN chart_of_accounts coa ON ab.account_number = coa.account_number
                WHERE coa.category = 'Revenue'
                  AND coa.account_number BETWEEN '40100' AND '40900'
                  AND coa.is_active = 1
            ''')
            total_revenue = float(cursor.fetchone()[0] or 0)
            print(f"\n1. TOTAL REVENUE from P&L: ${total_revenue:.2f}")
            
            cursor.execute('''
                SELECT 
                    coa.account_number,
                    coa.account_name,
                    COALESCE(ab.balance, 0) as balance
                FROM chart_of_accounts coa
                LEFT JOIN account_balances ab ON coa.account_number = ab.account_number
                WHERE coa.category = 'Revenue'
                  AND coa.account_number BETWEEN '40100' AND '40900'
                  AND coa.is_active = 1
                ORDER BY coa.account_number
            ''')
            
            for row in cursor.fetchall():
                print(f"   {row[0]} - {row[1]}: ${float(row[2]):.2f}")
            
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
    calculate_pnl_revenue()


