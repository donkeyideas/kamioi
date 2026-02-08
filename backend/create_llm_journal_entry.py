#!/usr/bin/env python3

import sqlite3
import json
from datetime import datetime

def create_llm_journal_entry():
    """Create a journal entry to properly balance the LLM Data Assets"""
    
    print("Creating LLM Data Assets journal entry to balance the books...")
    
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Use the LLM Data Assets balance from the image: $13,358,190.68
    llm_balance = 13358190.68
    
    print(f"LLM Data Assets balance: ${llm_balance:,.2f}")
    
    # Create journal entry to balance the books
    journal_entry = {
        'date': datetime.now().isoformat(),
        'reference': 'JE-LLM-ASSETS-001',
        'description': 'Capitalization of LLM Data Assets - Intellectual Property',
        'location': 'Corporate',
        'department': 'Finance',
        'transaction_type': 'asset_capitalization',
        'vendor_name': '',
        'customer_name': '',
        'amount': llm_balance,
        'from_account': '30200',  # Owner Contributions
        'to_account': '15200',    # LLM Data Assets
        'status': 'posted',
        'total_debit': llm_balance,
        'total_credit': llm_balance,
        'entries': json.dumps([
            {
                'account': '15200',  # LLM Data Assets
                'debit': llm_balance,
                'credit': 0,
                'description': 'Capitalization of LLM Data Assets'
            },
            {
                'account': '30200',  # Owner Contributions
                'debit': 0,
                'credit': llm_balance,
                'description': 'Owner contribution of intellectual property value'
            }
        ])
    }
    
    # Insert journal entry
    cursor.execute('''
        INSERT INTO journal_entries 
        (date, reference, description, location, department, transaction_type, 
         vendor_name, customer_name, amount, from_account, to_account, status, 
         total_debit, total_credit, entries)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        journal_entry['date'],
        journal_entry['reference'],
        journal_entry['description'],
        journal_entry['location'],
        journal_entry['department'],
        journal_entry['transaction_type'],
        journal_entry['vendor_name'],
        journal_entry['customer_name'],
        journal_entry['amount'],
        journal_entry['from_account'],
        journal_entry['to_account'],
        journal_entry['status'],
        journal_entry['total_debit'],
        journal_entry['total_credit'],
        journal_entry['entries']
    ))
    
    conn.commit()
    
    print(f"✅ Journal entry created:")
    print(f"   Debit: LLM Data Assets (15200) - ${llm_balance:,.2f}")
    print(f"   Credit: Owner Contributions (30200) - ${llm_balance:,.2f}")
    print(f"   Reference: {journal_entry['reference']}")
    print(f"   Status: {journal_entry['status']}")
    
    # Verify the entry was created
    cursor.execute('SELECT COUNT(*) FROM journal_entries WHERE reference = ?', (journal_entry['reference'],))
    count = cursor.fetchone()[0]
    print(f"✅ Journal entries in database: {count}")
    
    conn.close()

if __name__ == "__main__":
    create_llm_journal_entry()
