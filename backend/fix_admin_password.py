import sqlite3
import hashlib

def fix_admin_password():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Get current admin
    cursor.execute("SELECT * FROM admins WHERE email = 'info@kamioi.com'")
    admin = cursor.fetchone()
    
    if admin:
        print(f"Current admin password: {admin[3]}")
        
        # Hash the password
        password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        print(f"New hashed password: {password_hash}")
        
        # Update the password
        cursor.execute("UPDATE admins SET password = ? WHERE email = ?", (password_hash, 'info@kamioi.com'))
        conn.commit()
        
        print("Password updated successfully!")
        
        # Verify the update
        cursor.execute("SELECT password FROM admins WHERE email = 'info@kamioi.com'")
        updated_password = cursor.fetchone()[0]
        print(f"Updated password in DB: {updated_password}")
        print(f"Hash matches: {updated_password == password_hash}")
    else:
        print("No admin found")
    
    conn.close()

if __name__ == "__main__":
    fix_admin_password()
