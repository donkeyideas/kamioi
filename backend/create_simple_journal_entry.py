#!/usr/bin/env python3

import sqlite3
from datetime import datetime

def create_simple_journal_entry():
    """Create a simple journal entry to balance the LLM Data Assets"""
    
    print("Creating LLM Data Assets journal entry to balance the books...")
    
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Use the LLM Data Assets balance from the image: $13,358,190.68
    llm_balance = 13358190.68
    
    print(f"LLM Data Assets balance: ${llm_balance:,.2f}")
    
    # Create journal entry to balance the books
    cursor.execute('''
        INSERT INTO journal_entries 
        (id, date, reference, description, location, department, transaction_type, 
         vendor_name, customer_name, amount, from_account, to_account, status, 
         created_at, created_by, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        f'JE-LLM-{int(datetime.now().timestamp())}',  # id
        datetime.now().isoformat(),  # date
        'JE-LLM-ASSETS-001',  # reference
        'Capitalization of LLM Data Assets - Intellectual Property',  # description
        'Corporate',  # location
        'Finance',  # department
        'asset_capitalization',  # transaction_type
        '',  # vendor_name
        '',  # customer_name
        llm_balance,  # amount
        '30200',  # from_account (Owner Contributions)
        '15200',  # to_account (LLM Data Assets)
        'posted',  # status
        datetime.now().isoformat(),  # created_at
        'admin',  # created_by
        datetime.now().isoformat(),  # updated_at
        'admin'  # updated_by
    ))
    
    conn.commit()
    
    print(f"Journal entry created:")
    print(f"   Debit: LLM Data Assets (15200) - ${llm_balance:,.2f}")
    print(f"   Credit: Owner Contributions (30200) - ${llm_balance:,.2f}")
    print(f"   Reference: JE-LLM-ASSETS-001")
    print(f"   Status: posted")
    
    # Verify the entry was created
    cursor.execute('SELECT COUNT(*) FROM journal_entries WHERE reference = ?', ('JE-LLM-ASSETS-001',))
    count = cursor.fetchone()[0]
    print(f"Journal entries in database: {count}")
    
    conn.close()

if __name__ == "__main__":
    create_simple_journal_entry()
