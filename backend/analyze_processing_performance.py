import sqlite3
import os
import time

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def analyze_processing_performance():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Analyzing transaction processing performance...")
    print("=" * 60)
    
    # Check current database state
    cursor.execute("SELECT COUNT(*) FROM transactions")
    total_transactions = cursor.fetchone()[0]
    print(f"Total transactions: {total_transactions}")
    
    cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'pending'")
    pending_transactions = cursor.fetchone()[0]
    print(f"Pending transactions: {pending_transactions}")
    
    cursor.execute("SELECT COUNT(*) FROM llm_mappings")
    total_mappings = cursor.fetchone()[0]
    print(f"Total LLM mappings: {total_mappings}")
    
    cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
    pending_mappings = cursor.fetchone()[0]
    print(f"Pending LLM mappings: {pending_mappings}")
    
    # Check for performance bottlenecks
    print("\n" + "=" * 60)
    print("PERFORMANCE BOTTLENECKS IDENTIFIED:")
    print("=" * 60)
    
    # 1. Database indexes
    print("\n1. DATABASE INDEXES:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
    indexes = cursor.fetchall()
    print(f"   Current indexes: {len(indexes)}")
    for idx in indexes:
        print(f"   - {idx[0]}")
    
    # 2. Large tables
    print("\n2. TABLE SIZES:")
    tables_to_check = ['transactions', 'llm_mappings', 'users', 'notifications']
    for table in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table}: {count:,} records")
        except:
            print(f"   {table}: Table not found")
    
    # 3. Check for missing indexes
    print("\n3. MISSING INDEXES ANALYSIS:")
    print("   Checking for missing indexes on frequently queried columns...")
    
    # Check transactions table indexes
    cursor.execute("PRAGMA index_list(transactions)")
    transaction_indexes = cursor.fetchall()
    transaction_index_names = [idx[1] for idx in transaction_indexes]
    
    critical_indexes = [
        ('transactions', 'user_id'),
        ('transactions', 'status'),
        ('transactions', 'date'),
        ('llm_mappings', 'user_id'),
        ('llm_mappings', 'status'),
        ('llm_mappings', 'transaction_id')
    ]
    
    missing_indexes = []
    for table, column in critical_indexes:
        index_name = f"idx_{table}_{column}"
        if index_name not in [idx[1] for idx in cursor.execute(f"PRAGMA index_list({table})").fetchall()]:
            missing_indexes.append((table, column, index_name))
    
    if missing_indexes:
        print("   MISSING CRITICAL INDEXES:")
        for table, column, index_name in missing_indexes:
            print(f"   - {table}.{column} -> {index_name}")
    else:
        print("   All critical indexes present")
    
    # 4. Check for performance issues
    print("\n4. PERFORMANCE RECOMMENDATIONS:")
    print("   Based on analysis, here are the optimization opportunities:")
    
    if missing_indexes:
        print("   🔧 Add missing database indexes")
    
    if total_mappings > 1000:
        print("   🔧 Large LLM mappings table - consider archiving old records")
    
    if pending_transactions > 50:
        print("   🔧 Many pending transactions - batch processing needed")
    
    print("\n   🚀 OPTIMIZATION STRATEGIES:")
    print("   1. Add database indexes for faster queries")
    print("   2. Implement batch processing for LLM mappings")
    print("   3. Add async processing for large uploads")
    print("   4. Cache frequently accessed data")
    print("   5. Optimize database queries")
    
    conn.close()
    return missing_indexes

if __name__ == "__main__":
    missing_indexes = analyze_processing_performance()
