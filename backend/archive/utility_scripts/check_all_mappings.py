#!/usr/bin/env python3

import sqlite3

def check_all_mappings():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Get total count of all mappings
    cursor.execute('SELECT COUNT(*) FROM llm_mappings')
    total_mappings = cursor.fetchone()[0]
    print(f"Total mappings in database: {total_mappings}")
    
    # Get sample mappings (all statuses)
    cursor.execute('SELECT merchant_name, ticker_symbol, category, admin_approved FROM llm_mappings LIMIT 10')
    all_mappings = cursor.fetchall()
    
    print("\nSample mappings:")
    for row in all_mappings:
        status = "Approved" if row[3] == 1 else "Pending" if row[3] == 0 else "Rejected"
        print(f"{row[0]} -> {row[1]} ({row[2]}) - {status}")
    
    # Get status breakdown
    cursor.execute('SELECT admin_approved, COUNT(*) FROM llm_mappings GROUP BY admin_approved')
    status_breakdown = cursor.fetchall()
    
    print(f"\nStatus breakdown:")
    for row in status_breakdown:
        status = "Approved" if row[0] == 1 else "Pending" if row[0] == 0 else "Rejected"
        print(f"{status}: {row[1]} mappings")
    
    conn.close()

if __name__ == "__main__":
    check_all_mappings()
