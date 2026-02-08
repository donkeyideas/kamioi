#!/usr/bin/env python3

import sqlite3
import hashlib
import os

def check_admin_accounts():
    """Check existing admin accounts and create one if needed"""
    print("=" * 60)
    print("ADMIN ACCOUNT CHECKER")
    print("=" * 60)
    
    # Connect to database
    db_path = os.path.join(os.path.dirname(__file__), 'kamioi.db')
    
    if not os.path.exists(db_path):
        print("❌ Database not found!")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if admins table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'")
        if not cursor.fetchone():
            print("❌ Admins table does not exist!")
            return
        
        # Check existing admin accounts
        cursor.execute("SELECT id, email, name, role FROM admins")
        admins = cursor.fetchall()
        
        print(f"\n📊 Found {len(admins)} admin accounts:")
        print("-" * 40)
        
        if admins:
            for admin in admins:
                print(f"ID: {admin[0]}, Email: {admin[1]}, Name: {admin[2]}, Role: {admin[3]}")
        else:
            print("No admin accounts found!")
        
        # Check if we need to create a default admin
        if not admins:
            print("\n🔧 Creating default admin account...")
            
            # Create default admin
            default_email = "admin@kamioi.com"
            default_password = "admin123"
            default_name = "System Administrator"
            
            # Hash the password
            password_hash = hashlib.sha256(default_password.encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO admins (email, password, name, role, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (default_email, password_hash, default_name, 'admin'))
            
            conn.commit()
            print(f"✅ Created default admin account:")
            print(f"   Email: {default_email}")
            print(f"   Password: {default_password}")
            print(f"   Name: {default_name}")
            print(f"   Role: admin")
        
        # Test login with default credentials
        print(f"\n🧪 Testing login with default credentials...")
        cursor.execute("SELECT id, email, password FROM admins WHERE email = ?", ("admin@kamioi.com",))
        admin = cursor.fetchone()
        
        if admin:
            print(f"✅ Admin account found: {admin[1]}")
            print(f"   ID: {admin[0]}")
            print(f"   Password hash: {admin[2][:20]}...")
        else:
            print("❌ Admin account not found!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    finally:
        conn.close()
    
    print(f"\n📋 RECOMMENDATIONS:")
    print("1. Use the default admin credentials:")
    print("   Email: admin@kamioi.com")
    print("   Password: admin123")
    print("2. Change the default password after first login")
    print("3. Create additional admin accounts as needed")

if __name__ == "__main__":
    check_admin_accounts()