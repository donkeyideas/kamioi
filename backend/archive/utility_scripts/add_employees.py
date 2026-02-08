#!/usr/bin/env python3
"""
Add Admin Employees - Simple version without Unicode
"""

import sqlite3
import json

def add_employees():
    """Add admin employees with custom permissions"""
    
    # Employee configurations
    employees = [
        {
            'email': 'hr@kamioi.com',
            'password': 'hr123',
            'name': 'HR Manager',
            'role': 'admin',
            'permissions': {
                'can_view_users': True,
                'can_edit_users': True,
                'can_view_transactions': False,
                'can_edit_transactions': False,
                'can_access_llm': False,
                'can_manage_system': False,
                'can_view_analytics': True,
                'can_manage_advertisements': False
            }
        },
        {
            'email': 'finance@kamioi.com',
            'password': 'finance123',
            'name': 'Finance Manager',
            'role': 'admin',
            'permissions': {
                'can_view_users': True,
                'can_edit_users': False,
                'can_view_transactions': True,
                'can_edit_transactions': True,
                'can_access_llm': True,
                'can_manage_system': False,
                'can_view_analytics': True,
                'can_manage_advertisements': False
            }
        },
        {
            'email': 'support@kamioi.com',
            'password': 'support123',
            'name': 'Support Moderator',
            'role': 'moderator',
            'permissions': {
                'can_view_users': True,
                'can_edit_users': False,
                'can_view_transactions': True,
                'can_edit_transactions': False,
                'can_access_llm': False,
                'can_manage_system': False,
                'can_view_analytics': True,
                'can_manage_advertisements': False
            }
        }
    ]
    
    conn = sqlite3.connect('kamioi.db')
    cur = conn.cursor()
    
    print("=== ADDING ADMIN EMPLOYEES ===")
    
    for employee in employees:
        try:
            # Check if already exists
            cur.execute("SELECT id FROM admins WHERE email = ?", (employee['email'],))
            if cur.fetchone():
                print(f"Admin {employee['email']} already exists, skipping...")
                continue
            
            # Insert admin employee
            cur.execute("""
                INSERT INTO admins (email, password, name, role, permissions, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                employee['email'],
                employee['password'],
                employee['name'],
                employee['role'],
                json.dumps(employee['permissions']),
                1
            ))
            
            admin_id = cur.lastrowid
            print(f"Added {employee['name']} ({employee['email']}) - ID: {admin_id}")
            print(f"  Login: http://localhost:3764/admin/{admin_id}/")
            print(f"  Password: {employee['password']}")
            print(f"  Permissions: {employee['permissions']}")
            print()
            
        except Exception as e:
            print(f"Error adding {employee['email']}: {e}")
    
    conn.commit()
    conn.close()
    
    print("Admin employees added successfully!")
    print("\nLogin Summary:")
    print("  Super Admin: info@kamioi.com / admin123")
    print("  HR Manager: hr@kamioi.com / hr123")
    print("  Finance Manager: finance@kamioi.com / finance123")
    print("  Support Moderator: support@kamioi.com / support123")

if __name__ == "__main__":
    add_employees()
