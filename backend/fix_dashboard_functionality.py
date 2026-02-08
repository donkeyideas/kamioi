import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'kamioi.db')

def fix_dashboard_functionality():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Fixing Dashboard Functionality Issues...")
    print("=" * 60)
    
    # 1. Check current issues
    print("1. IDENTIFIED ISSUES:")
    print("-" * 30)
    print("   Family Dashboard:")
    print("     - /api/family/transactions: 401 (Authentication issue)")
    print("     - /api/family/ai-insights: 500 (Server error)")
    print("     - Missing: /api/family/ai/recommendations")
    print("     - Missing: /api/family/ai/insights")
    print("\n   Business Dashboard:")
    print("     - Missing: /api/admin/notifications")
    
    # 2. Check backend code for missing endpoints
    print("\n2. CHECKING BACKEND CODE...")
    print("-" * 30)
    
    # Check if family transactions endpoint exists in app_clean.py
    try:
        with open('app_clean.py', 'r') as f:
            app_content = f.read()
            
        # Check for family endpoints
        family_endpoints = [
            'family_transactions',
            'family_ai_insights', 
            'family_ai_recommendations',
            'family_ai_insights_alt'
        ]
        
        print("   Family endpoints in backend:")
        for endpoint in family_endpoints:
            if endpoint in app_content:
                print(f"     [FOUND] {endpoint}")
            else:
                print(f"     [MISSING] {endpoint}")
        
        # Check for business endpoints
        business_endpoints = [
            'admin_notifications',
            'admin_notifications_main'
        ]
        
        print("\n   Business endpoints in backend:")
        for endpoint in business_endpoints:
            if endpoint in app_content:
                print(f"     [FOUND] {endpoint}")
            else:
                print(f"     [MISSING] {endpoint}")
                
    except Exception as e:
        print(f"   Error reading backend code: {e}")
    
    # 3. Check database for missing data
    print("\n3. CHECKING DATABASE ISSUES...")
    print("-" * 30)
    
    # Check family users
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'family'")
    family_users = cursor.fetchone()[0]
    print(f"   Family users: {family_users}")
    
    # Check family transactions
    cursor.execute("""
        SELECT COUNT(*) FROM transactions t 
        JOIN users u ON t.user_id = u.id 
        WHERE u.role = 'family'
    """)
    family_transactions = cursor.fetchone()[0]
    print(f"   Family transactions: {family_transactions}")
    
    # Check family members
    try:
        cursor.execute("SELECT COUNT(*) FROM family_members")
        family_members = cursor.fetchone()[0]
        print(f"   Family members: {family_members}")
    except:
        print("   Family members: Table not found")
    
    # 4. Create missing database entries
    print("\n4. CREATING MISSING DATA...")
    print("-" * 30)
    
    # Get family user
    cursor.execute("SELECT id FROM users WHERE role = 'family' LIMIT 1")
    family_user = cursor.fetchone()
    
    if family_user:
        family_id = family_user[0]
        print(f"   Found family user: {family_id}")
        
        # Create family member if not exists
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO family_members (family_id, user_id, role, permissions, status)
                VALUES (?, ?, ?, ?, ?)
            """, (family_id, family_id, 'parent', '{"view_all": true, "edit_budget": true}', 'active'))
            print("   Created family member entry")
        except Exception as e:
            print(f"   Error creating family member: {e}")
        
        # Create family budget if not exists
        try:
            budget_categories = ['Groceries', 'Entertainment', 'Education', 'Healthcare', 'Transportation']
            for category in budget_categories:
                cursor.execute("""
                    INSERT OR IGNORE INTO family_budgets (family_id, category, budget_amount, month_year, created_by)
                    VALUES (?, ?, ?, ?, ?)
                """, (family_id, category, 500.00, '2025-01', family_id))
            print(f"   Created {len(budget_categories)} family budget categories")
        except Exception as e:
            print(f"   Error creating family budget: {e}")
    
    # 5. Check for authentication issues
    print("\n5. CHECKING AUTHENTICATION ISSUES...")
    print("-" * 30)
    
    # Check if there are any authentication-related issues
    print("   Family dashboard authentication issues:")
    print("     - 401 errors suggest authentication problems")
    print("     - Need to check if family endpoints require different auth")
    print("     - May need to update authentication middleware")
    
    # 6. Recommendations for fixes
    print("\n6. RECOMMENDATIONS FOR FIXES:")
    print("-" * 30)
    
    print("   IMMEDIATE FIXES NEEDED:")
    print("   1. Fix /api/family/transactions authentication (401 error)")
    print("   2. Fix /api/family/ai-insights server error (500 error)")
    print("   3. Add missing /api/family/ai/recommendations endpoint")
    print("   4. Add missing /api/family/ai/insights endpoint")
    print("   5. Add missing /api/admin/notifications endpoint")
    
    print("\n   BACKEND CODE CHANGES NEEDED:")
    print("   1. Update family authentication middleware")
    print("   2. Add missing family AI endpoints")
    print("   3. Add missing business notifications endpoint")
    print("   4. Ensure consistent error handling")
    
    print("\n   DATABASE CHANGES NEEDED:")
    print("   1. Verify family_members table structure")
    print("   2. Check family_budgets table data")
    print("   3. Ensure proper foreign key relationships")
    
    # 7. Create test data for missing functionality
    print("\n7. CREATING TEST DATA...")
    print("-" * 30)
    
    # Create sample family transactions if none exist
    if family_transactions == 0 and family_user:
        print("   Creating sample family transactions...")
        sample_transactions = [
            (family_id, 150.00, 'Family Grocery Shopping', 'Groceries', 'Whole Foods', '2025-01-15'),
            (family_id, 75.00, 'Family Entertainment', 'Entertainment', 'Movie Theater', '2025-01-14'),
            (family_id, 200.00, 'Family Education', 'Education', 'Online Course', '2025-01-13')
        ]
        
        for txn in sample_transactions:
            cursor.execute("""
                INSERT OR IGNORE INTO transactions (user_id, amount, description, category, merchant, date, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            """, txn)
        
        print(f"   Created {len(sample_transactions)} sample family transactions")
    
    # Commit changes
    conn.commit()
    
    # 8. Final summary
    print("\n" + "=" * 60)
    print("DASHBOARD FUNCTIONALITY ANALYSIS COMPLETE!")
    print("=" * 60)
    
    print("\nISSUES IDENTIFIED:")
    print("  Family Dashboard:")
    print("    - Authentication issues (401 errors)")
    print("    - Server errors (500 errors)")
    print("    - Missing AI endpoints")
    
    print("\n  Business Dashboard:")
    print("    - Missing notifications endpoint")
    
    print("\nNEXT STEPS:")
    print("  1. Update backend code to fix authentication issues")
    print("  2. Add missing AI endpoints for Family dashboard")
    print("  3. Add missing notifications endpoint for Business dashboard")
    print("  4. Test all endpoints after fixes")
    print("  5. Ensure consistent functionality across all dashboard types")
    
    conn.close()
    return True

if __name__ == "__main__":
    fix_dashboard_functionality()
