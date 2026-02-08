import sqlite3

def check_admin_details():
    conn = sqlite3.connect('kamioi.db')
    cursor = conn.cursor()
    
    # Get admin details
    cursor.execute("SELECT * FROM admins WHERE email = 'info@kamioi.com'")
    admin = cursor.fetchone()
    
    if admin:
        print("Admin found:")
        print(f"ID: {admin[0]}")
        print(f"Email: {admin[1]}")
        print(f"Name: {admin[2]}")
        print(f"Password: {admin[3]}")
        print(f"Role: {admin[4]}")
        print(f"Password type: {type(admin[3])}")
        print(f"Password length: {len(admin[3])}")
        
        # Test password comparison
        test_password = "admin123"
        print(f"\nTest password: '{test_password}'")
        print(f"Stored password: '{admin[3]}'")
        print(f"Passwords match: {admin[3] == test_password}")
        
        # Test SHA256 hash
        import hashlib
        password_hash = hashlib.sha256(test_password.encode()).hexdigest()
        print(f"SHA256 hash: {password_hash}")
        print(f"Hash matches stored: {admin[3] == password_hash}")
    else:
        print("No admin found")
    
    conn.close()

if __name__ == "__main__":
    check_admin_details()
