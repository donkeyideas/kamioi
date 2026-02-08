#!/usr/bin/env python3

import sqlite3

def check_tables():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
    tables = cursor.fetchall()
    
    print('Database tables:')
    for table in tables:
        print(f'- {table[0]}')
    
    conn.close()

if __name__ == "__main__":
    check_tables()