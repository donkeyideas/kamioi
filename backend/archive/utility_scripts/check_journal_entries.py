#!/usr/bin/env python3

import sqlite3

def check_journal_entries():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Check the journal entry we created
    cursor.execute('SELECT * FROM journal_entries WHERE reference = ?', ('JE-LLM-ASSETS-001',))
    entries = cursor.fetchall()
    
    print('Journal Entries:')
    for entry in entries:
        print(f'Reference: {entry[2]}')
        print(f'Description: {entry[3]}')
        print(f'Amount: ${entry[9]:,.2f}')
        print(f'From Account: {entry[10]}')
        print(f'To Account: {entry[11]}')
        print(f'Status: {entry[12]}')
        print('---')
    
    # Check all journal entries
    cursor.execute('SELECT COUNT(*) FROM journal_entries')
    total = cursor.fetchone()[0]
    print(f'Total journal entries: {total}')
    
    conn.close()

if __name__ == "__main__":
    check_journal_entries()
