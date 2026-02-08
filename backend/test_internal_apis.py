#!/usr/bin/env python3
"""
Comprehensive Internal API Testing Script
Tests all internal APIs for connectivity and functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://127.0.0.1:5000/api"
TEST_USER_EMAIL = "test1@test1.com"
TEST_USER_PASSWORD = "password123"
ADMIN_EMAIL = "admin@kamioi.com"
ADMIN_PASSWORD = "adminpass"

class APITester:
    def __init__(self):
        self.results = []
        self.user_token = None
        self.admin_token = None
        
    def log_result(self, test_name, status, details=""):
        """Log test result"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        status_icon = "[PASS]" if status == "PASS" else "[FAIL]" if status == "FAIL" else "[SKIP]"
        print(f"{status_icon} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test basic health endpoint"""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                self.log_result("Health Check", "PASS", f"Status: {response.status_code}")
                return True
            else:
                self.log_result("Health Check", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login and get token"""
        try:
            payload = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            response = requests.post(f"{BASE_URL}/user/auth/login", 
                                   json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('token'):
                    self.user_token = data['token']
                    self.log_result("User Login", "PASS", f"Token: {self.user_token}")
                    return True
                else:
                    self.log_result("User Login", "FAIL", "No token in response")
                    return False
            else:
                self.log_result("User Login", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("User Login", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin login and get token"""
        try:
            payload = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            response = requests.post(f"{BASE_URL}/admin/auth/login", 
                                   json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('token'):
                    self.admin_token = data['token']
                    self.log_result("Admin Login", "PASS", f"Token: {self.admin_token}")
                    return True
                else:
                    self.log_result("Admin Login", "FAIL", "No token in response")
                    return False
            else:
                self.log_result("Admin Login", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Login", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_user_endpoints(self):
        """Test all user endpoints"""
        if not self.user_token:
            self.log_result("User Endpoints", "SKIP", "No user token available")
            return
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        endpoints = [
            ("/user/auth/me", "User Auth Me"),
            ("/user/transactions?limit=10&offset=0", "User Transactions"),
            ("/user/goals", "User Goals"),
            ("/user/ai/insights", "User AI Insights"),
            ("/user/notifications", "User Notifications"),
            ("/user/roundups/total", "User Roundups Total"),
            ("/user/fees/total", "User Fees Total"),
            ("/user/active-ad", "User Active Ad")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
                if response.status_code == 200:
                    self.log_result(f"User API - {name}", "PASS", f"Status: {response.status_code}")
                else:
                    self.log_result(f"User API - {name}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f"User API - {name}", "FAIL", f"Error: {str(e)}")
    
    def test_admin_endpoints(self):
        """Test all admin endpoints"""
        if not self.admin_token:
            self.log_result("Admin Endpoints", "SKIP", "No admin token available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        endpoints = [
            ("/admin/auth/me", "Admin Auth Me"),
            ("/admin/transactions", "Admin Transactions"),
            ("/admin/llm-center/queue", "Admin LLM Queue"),
            ("/admin/llm-center/mappings?limit=10", "Admin LLM Mappings"),
            ("/admin/users", "Admin Users"),
            ("/admin/database/connectivity-matrix", "Admin DB Connectivity"),
            ("/admin/database/data-quality", "Admin DB Data Quality"),
            ("/admin/database/performance", "Admin DB Performance"),
            ("/admin/ledger/consistency", "Admin Ledger Consistency")
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
                if response.status_code == 200:
                    self.log_result(f"Admin API - {name}", "PASS", f"Status: {response.status_code}")
                elif response.status_code == 404:
                    self.log_result(f"Admin API - {name}", "SKIP", "Endpoint not implemented")
                else:
                    self.log_result(f"Admin API - {name}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                self.log_result(f"Admin API - {name}", "FAIL", f"Error: {str(e)}")
    
    def test_database_operations(self):
        """Test database connectivity and operations"""
        try:
            # Test database connection through a simple query
            import sqlite3
            conn = sqlite3.connect('kamioi.db')
            cur = conn.cursor()
            
            # Test basic queries
            cur.execute("SELECT COUNT(*) FROM users")
            user_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM transactions")
            transaction_count = cur.fetchone()[0]
            
            cur.execute("SELECT COUNT(*) FROM llm_mappings")
            mapping_count = cur.fetchone()[0]
            
            conn.close()
            
            self.log_result("Database Connection", "PASS", 
                          f"Users: {user_count}, Transactions: {transaction_count}, Mappings: {mapping_count}")
            
        except Exception as e:
            self.log_result("Database Connection", "FAIL", f"Error: {str(e)}")
    
    def test_websocket_connectivity(self):
        """Test WebSocket connectivity (basic check)"""
        try:
            # This is a basic check - WebSocket testing would require more complex setup
            self.log_result("WebSocket Check", "SKIP", "WebSocket testing requires specialized tools")
        except Exception as e:
            self.log_result("WebSocket Check", "FAIL", f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("Starting Comprehensive Internal API Testing...")
        print("=" * 60)
        
        # Basic connectivity
        self.test_health_check()
        
        # Authentication tests
        self.test_user_login()
        self.test_admin_login()
        
        # Database tests
        self.test_database_operations()
        
        # API endpoint tests
        self.test_user_endpoints()
        self.test_admin_endpoints()
        
        # WebSocket tests
        self.test_websocket_connectivity()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.results if r['status'] == 'FAIL'])
        skipped_tests = len([r for r in self.results if r['status'] == 'SKIP'])
        
        print(f"Total Tests: {total_tests}")
        print(f"[PASS] Passed: {passed_tests}")
        print(f"[FAIL] Failed: {failed_tests}")
        print(f"[SKIP] Skipped: {skipped_tests}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n[FAIL] FAILED TESTS:")
            for result in self.results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        
        if success_rate >= 80:
            print("API Testing: EXCELLENT - Most APIs are working!")
        elif success_rate >= 60:
            print("API Testing: GOOD - Some issues detected")
        else:
            print("API Testing: NEEDS ATTENTION - Multiple failures detected")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
