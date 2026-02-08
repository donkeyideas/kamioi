#!/usr/bin/env python3
"""
Add Admin Employee with Custom Permissions
"""

import sqlite3
import json
import hashlib

def add_admin_employee():
    """Add a new admin employee with custom permissions"""
    
    # Employee details
    email = input("Enter employee email: ").strip()
    password = input("Enter employee password: ").strip()
    name = input("Enter employee full name: ").strip()
    role = input("Enter role (admin/moderator): ").strip().lower()
    
    # Define permission templates
    permission_templates = {
        'full_access': {
            'full_access': True,
            'can_view_users': True,
            'can_edit_users': True,
            'can_view_transactions': True,
            'can_edit_transactions': True,
            'can_access_llm': True,
            'can_manage_system': True,
            'can_view_analytics': True,
            'can_manage_advertisements': True
        },
        'hr_admin': {
            'can_view_users': True,
            'can_edit_users': True,
            'can_view_transactions': False,
            'can_edit_transactions': False,
            'can_access_llm': False,
            'can_manage_system': False,
            'can_view_analytics': True,
            'can_manage_advertisements': False
        },
        'financial_admin': {
            'can_view_users': True,
            'can_edit_users': False,
            'can_view_transactions': True,
            'can_edit_transactions': True,
            'can_access_llm': True,
            'can_manage_system': False,
            'can_view_analytics': True,
            'can_manage_advertisements': False
        },
        'moderator': {
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
    
    print("\nAvailable permission templates:")
    for key, template in permission_templates.items():
        print(f"  {key}: {template}")
    
    template_choice = input("\nChoose template (or 'custom' for manual): ").strip().lower()
    
    if template_choice == 'custom':
        # Manual permission setup
        permissions = {}
        print("\nSet permissions (y/n for each):")
        for perm in ['can_view_users', 'can_edit_users', 'can_view_transactions', 
                    'can_edit_transactions', 'can_access_llm', 'can_manage_system', 
                    'can_view_analytics', 'can_manage_advertisements']:
            choice = input(f"  {perm}? (y/n): ").strip().lower()
            permissions[perm] = choice == 'y'
    else:
        permissions = permission_templates.get(template_choice, permission_templates['moderator'])
    
    # Connect to database
    conn = sqlite3.connect('kamioi.db')
    cur = conn.cursor()
    
    try:
        # Check if email already exists
        cur.execute("SELECT id FROM admins WHERE email = ?", (email,))
        if cur.fetchone():
            print(f"❌ Error: Admin with email {email} already exists!")
            return
        
        # Insert new admin
        cur.execute("""
            INSERT INTO admins (email, password, name, role, permissions, is_active)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            email,
            password,  # Store as plain text for now (you can hash this later)
            name,
            role,
            json.dumps(permissions),
            1  # is_active
        ))
        
        conn.commit()
        
        # Get the new admin ID
        admin_id = cur.lastrowid
        
        print(f"\n✅ Admin employee added successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        print(f"   Role: {role}")
        print(f"   Admin ID: {admin_id}")
        print(f"   Permissions: {json.dumps(permissions, indent=2)}")
        
        # Show login instructions
        print(f"\n🔑 Login Instructions:")
        print(f"   URL: http://localhost:3764/admin/{admin_id}/")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"❌ Error adding admin: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    add_admin_employee()
