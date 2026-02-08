#!/usr/bin/env python3

import sqlite3

def check_journal_schema():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    cursor.execute('PRAGMA table_info(journal_entries)')
    columns = cursor.fetchall()
    
    print('Journal Entries table schema:')
    for col in columns:
        print(f'{col[1]} ({col[2]})')
    
    conn.close()

if __name__ == "__main__":
    check_journal_schema()
