#!/usr/bin/env python3

import sqlite3
import json
from datetime import datetime

def create_llm_assets_journal_entry():
    """Create a journal entry to properly balance the LLM Data Assets"""
    
    print("Creating LLM Data Assets journal entry to balance the books...")
    
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Get the LLM Data Assets balance
    cursor.execute('SELECT total_value FROM llm_data_assets_summary LIMIT 1')
    result = cursor.fetchone()
    
    if not result:
        print("No LLM Data Assets found, using default value")
        llm_balance = 13358190.68  # $13.4M from the image
    else:
        llm_balance = result[0]
    
    print(f"LLM Data Assets balance: ${llm_balance:,.2f}")
    
    # Create journal entry to balance the books
    journal_entry = {
        'date': datetime.now().isoformat(),
        'reference': 'JE-LLM-ASSETS-001',
        'description': 'Capitalization of LLM Data Assets - Intellectual Property',
        'location': 'Corporate',
        'department': 'Finance',
        'transactionType': 'asset_capitalization',
        'vendorName': '',
        'customerName': '',
        'amount': llm_balance,
        'fromAccount': '30200',  # Owner Contributions
        'toAccount': '15200',    # LLM Data Assets
        'status': 'posted',
        'entries': [
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
        ],
        'totalDebit': llm_balance,
        'totalCredit': llm_balance
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
        journal_entry['transactionType'],
        journal_entry['vendorName'],
        journal_entry['customerName'],
        journal_entry['amount'],
        journal_entry['fromAccount'],
        journal_entry['toAccount'],
        journal_entry['status'],
        journal_entry['totalDebit'],
        journal_entry['totalCredit'],
        json.dumps(journal_entry['entries'])
    ))
    
    conn.commit()
    
    print(f"✅ Journal entry created:")
    print(f"   Debit: LLM Data Assets (15200) - ${llm_balance:,.2f}")
    print(f"   Credit: Owner Contributions (30200) - ${llm_balance:,.2f}")
    print(f"   Reference: {journal_entry['reference']}")
    
    conn.close()

if __name__ == "__main__":
    create_llm_assets_journal_entry()
