#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive Admin Dashboard Endpoint Test
Tests all admin endpoints for errors and generates a detailed report.
"""

import sys
import os

# Fix Windows console encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

import requests
import json
from datetime import datetime
from typing import Dict, List, Tuple

# Configuration
BASE_URL = "http://localhost:5111"
ADMIN_TOKEN = "admin_token_3"  # Update this with your actual admin token

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}[PASS] {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}[FAIL] {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}[WARN] {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}[INFO] {text}{Colors.RESET}")

# Define all admin endpoints to test
ADMIN_ENDPOINTS = [
    # Authentication
    ("GET", "/api/admin/auth/me", "Admin Auth - Get Current User"),
    
    # Dashboard & Analytics
    ("GET", "/api/admin/dashboard", "Admin Dashboard - Main Stats"),
    ("GET", "/api/admin/financial-analytics", "Financial Analytics"),
    ("GET", "/api/admin/investment-summary", "Investment Summary"),
    ("GET", "/api/admin/investment-processing", "Investment Processing"),
    ("GET", "/api/admin/ml-dashboard", "ML Dashboard"),
    
    # Transactions
    ("GET", "/api/admin/transactions", "Admin Transactions"),
    
    # LLM Center
    ("GET", "/api/admin/llm-center/dashboard", "LLM Center Dashboard"),
    ("GET", "/api/admin/llm-center/mappings", "LLM Mappings"),
    ("GET", "/api/admin/llm-center/queue", "LLM Queue"),
    ("GET", "/api/admin/llm-center/processing-stats", "LLM Processing Stats"),
    ("GET", "/api/admin/llm-center/automation/realtime", "LLM Automation Realtime"),
    ("GET", "/api/admin/llm-center/automation/batch", "LLM Automation Batch"),
    ("GET", "/api/admin/llm-center/automation/learning", "LLM Automation Learning"),
    ("GET", "/api/admin/llm-center/automation/merchants", "LLM Automation Merchants"),
    ("GET", "/api/admin/llm-center/automation/thresholds", "LLM Automation Thresholds"),
    ("GET", "/api/admin/llm-center/automation/multi-model", "LLM Automation Multi-Model"),
    
    # User Management
    ("GET", "/api/admin/user-management", "User Management"),
    ("GET", "/api/admin/users", "Admin Users List"),
    ("GET", "/api/admin/family-users", "Family Users"),
    ("GET", "/api/admin/business-users", "Business Users"),
    ("GET", "/api/admin/user-metrics", "User Metrics"),
    
    # Employee Management
    ("GET", "/api/admin/employee-management", "Employee Management"),
    ("GET", "/api/admin/employees", "Employees List"),
    
    # Notifications
    ("GET", "/api/admin/notifications", "Admin Notifications"),
    
    # Settings
    ("GET", "/api/admin/settings/system", "System Settings"),
    ("GET", "/api/admin/settings/business", "Business Settings"),
    ("GET", "/api/admin/settings/notifications", "Notification Settings"),
    ("GET", "/api/admin/settings/security", "Security Settings"),
    ("GET", "/api/admin/settings/analytics", "Analytics Settings"),
    ("GET", "/api/admin/settings", "General Settings"),
    ("GET", "/api/admin/settings/fees", "Fee Settings"),
    
    # System
    ("GET", "/api/admin/system-health", "System Health"),
    ("GET", "/api/admin/system-settings", "System Settings (Alt)"),
    
    # Database
    ("GET", "/api/admin/database/schema", "Database Schema"),
    ("GET", "/api/admin/database/stats", "Database Stats"),
    ("GET", "/api/admin/database/connectivity-matrix", "Database Connectivity Matrix"),
    ("GET", "/api/admin/database/data-quality", "Database Data Quality"),
    ("GET", "/api/admin/database/performance", "Database Performance"),
    
    # Content Management
    ("GET", "/api/admin/content-management", "Content Management"),
    ("GET", "/api/admin/content/pages", "Content Pages"),
    ("GET", "/api/admin/content", "Content List"),
    
    # Advertisements
    ("GET", "/api/admin/advertisement", "Advertisements"),
    ("GET", "/api/admin/advertisements", "Advertisements List"),
    ("GET", "/api/admin/advertisements/campaigns", "Advertisement Campaigns"),
    
    # Google Analytics
    ("GET", "/api/admin/google-analytics", "Google Analytics"),
    
    # Families & Businesses
    ("GET", "/api/admin/families", "Families List"),
    ("GET", "/api/admin/businesses", "Businesses List"),
    
    # Demo
    ("GET", "/api/admin/demo/codes", "Demo Codes"),
    ("GET", "/api/admin/demo/users", "Demo Users"),
    
    # Feature Flags
    ("GET", "/api/admin/feature-flags", "Feature Flags"),
    
    # Messaging
    ("GET", "/api/admin/messaging/campaigns", "Messaging Campaigns"),
    
    # Badges
    ("GET", "/api/admin/badges", "Badges"),
    
    # CRM
    ("GET", "/api/admin/crm/contacts", "CRM Contacts"),
    
    # Modules
    ("GET", "/api/admin/modules", "Modules"),
    
    # Business Stress Test
    ("GET", "/api/admin/business-stress-test/status", "Business Stress Test Status"),
    ("GET", "/api/admin/business-stress-test/categories", "Business Stress Test Categories"),
    
    # Reports
    ("GET", "/api/admin/reports/ready-to-connect", "Ready to Connect Report"),
    
    # Roundup
    ("GET", "/api/admin/roundup/stats", "Roundup Stats"),
    ("GET", "/api/admin/roundup/ledger", "Roundup Ledger"),
    
    # Training
    ("GET", "/api/admin/training-sessions", "Training Sessions"),
    
    # Financial
    ("GET", "/api/admin/financial/transactions", "Financial Transactions"),
    ("GET", "/api/admin/financial/accounts", "Financial Accounts"),
    ("GET", "/api/admin/financial/accounts/categories", "Financial Account Categories"),
    
    # Journal Entries
    ("GET", "/api/admin/journal-entries", "Journal Entries"),
    
    # Subscriptions
    ("GET", "/api/admin/subscriptions/plans", "Subscription Plans"),
    ("GET", "/api/admin/subscriptions/users", "Subscription Users"),
    ("GET", "/api/admin/subscriptions/analytics/overview", "Subscription Analytics"),
    ("GET", "/api/admin/subscriptions/promo-codes", "Promo Codes"),
    ("GET", "/api/admin/subscriptions/renewal-queue", "Renewal Queue"),
    
    # LLM Data Management
    ("GET", "/api/admin/llm-data-management", "LLM Data Management"),
]

def test_endpoint(method: str, endpoint: str, description: str) -> Tuple[bool, Dict]:
    """Test a single endpoint and return success status and details"""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json={}, timeout=10)
        else:
            return False, {"error": f"Unsupported method: {method}"}
        
        status_code = response.status_code
        success = 200 <= status_code < 300
        
        result = {
            "status_code": status_code,
            "success": success,
            "url": url,
            "method": method
        }
        
        try:
            result["response"] = response.json()
        except:
            result["response"] = response.text[:500]  # First 500 chars
        
        if not success:
            result["error"] = f"HTTP {status_code}"
            if status_code == 500:
                result["error_type"] = "Internal Server Error"
            elif status_code == 401:
                result["error_type"] = "Unauthorized"
            elif status_code == 403:
                result["error_type"] = "Forbidden"
            elif status_code == 404:
                result["error_type"] = "Not Found"
        
        return success, result
        
    except requests.exceptions.ConnectionError:
        return False, {
            "error": "Connection Error",
            "error_type": "Connection Failed",
            "url": url,
            "method": method
        }
    except requests.exceptions.Timeout:
        return False, {
            "error": "Request Timeout",
            "error_type": "Timeout",
            "url": url,
            "method": method
        }
    except Exception as e:
        return False, {
            "error": str(e),
            "error_type": "Exception",
            "url": url,
            "method": method
        }

def generate_report(results: List[Tuple[str, str, bool, Dict]]):
    """Generate a comprehensive report"""
    report = []
    report.append("# Admin Dashboard Endpoint Test Report")
    report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"Base URL: {BASE_URL}")
    report.append("")
    
    # Summary
    total = len(results)
    passed = sum(1 for _, _, success, _ in results if success)
    failed = total - passed
    
    report.append("## Summary")
    report.append(f"- **Total Endpoints Tested**: {total}")
    report.append(f"- **Passed**: {passed} ({passed/total*100:.1f}%)")
    report.append(f"- **Failed**: {failed} ({failed/total*100:.1f}%)")
    report.append("")
    
    # Failed Endpoints
    failed_endpoints = [(desc, endpoint, details) for desc, endpoint, success, details in results if not success]
    
    if failed_endpoints:
        report.append("## Failed Endpoints")
        report.append("")
        
        # Group by error type
        error_groups = {}
        for desc, endpoint, details in failed_endpoints:
            error_type = details.get("error_type", "Unknown")
            if error_type not in error_groups:
                error_groups[error_type] = []
            error_groups[error_type].append((desc, endpoint, details))
        
        for error_type, endpoints in error_groups.items():
            report.append(f"### {error_type} ({len(endpoints)} endpoints)")
            report.append("")
            for desc, endpoint, details in endpoints:
                report.append(f"#### {desc}")
                report.append(f"- **Endpoint**: `{details['method']} {endpoint}`")
                report.append(f"- **Status Code**: {details.get('status_code', 'N/A')}")
                report.append(f"- **Error**: {details.get('error', 'Unknown error')}")
                
                if 'response' in details:
                    response_str = str(details['response'])
                    if len(response_str) > 200:
                        response_str = response_str[:200] + "..."
                    report.append(f"- **Response**: `{response_str}`")
                
                report.append("")
        
        report.append("## Recommended Fixes")
        report.append("")
        
        # Generate fixes based on error types
        if "Internal Server Error" in error_groups:
            report.append("### Fix Internal Server Errors (500)")
            report.append("")
            report.append("These endpoints are returning 500 errors. Common causes:")
            report.append("1. Database connection issues")
            report.append("2. Missing error handling in endpoint code")
            report.append("3. Incorrect database query syntax (PostgreSQL vs SQLite)")
            report.append("4. Missing authentication checks")
            report.append("")
            report.append("**Action Items:**")
            report.append("- Check server logs for detailed error messages")
            report.append("- Verify database connection is working")
            report.append("- Add try-except blocks around database operations")
            report.append("- Ensure `require_role('admin')` is properly implemented")
            report.append("")
        
        if "Unauthorized" in error_groups:
            report.append("### Fix Unauthorized Errors (401)")
            report.append("")
            report.append("These endpoints are returning 401 errors. Common causes:")
            report.append("1. Missing or invalid admin token")
            report.append("2. Token not being passed in Authorization header")
            report.append("3. Token format mismatch")
            report.append("")
            report.append("**Action Items:**")
            report.append("- Verify admin token format: `admin_token_<id>`")
            report.append("- Check that frontend is sending token in `Authorization: Bearer <token>` header")
            report.append("- Verify `get_auth_user()` function is working correctly")
            report.append("")
        
        if "Not Found" in error_groups:
            report.append("### Fix Not Found Errors (404)")
            report.append("")
            report.append("These endpoints are returning 404 errors. Common causes:")
            report.append("1. Endpoint route not defined in app.py")
            report.append("2. Incorrect URL path")
            report.append("3. Route defined but not registered")
            report.append("")
            report.append("**Action Items:**")
            report.append("- Verify endpoint exists in app.py")
            report.append("- Check route decorator syntax")
            report.append("- Ensure endpoint is registered before app.run()")
            report.append("")
        
        if "Connection Failed" in error_groups:
            report.append("### Fix Connection Errors")
            report.append("")
            report.append("**Action Items:**")
            report.append("- Ensure Flask server is running on port 5111")
            report.append("- Check server is accessible: `curl http://localhost:5111/api/health`")
            report.append("- Verify CORS is properly configured")
            report.append("")
    
    # Passed Endpoints
    passed_endpoints = [(desc, endpoint) for desc, endpoint, success, _ in results if success]
    
    if passed_endpoints:
        report.append("## Passed Endpoints")
        report.append("")
        report.append(f"All {len(passed_endpoints)} endpoints are working correctly:")
        report.append("")
        for desc, endpoint in passed_endpoints:
            report.append(f"- [PASS] {desc} - `{endpoint}`")
        report.append("")
    
    return "\n".join(report)

def main():
    print_header("Admin Dashboard Comprehensive Endpoint Test")
    
    print_info(f"Testing {len(ADMIN_ENDPOINTS)} admin endpoints...")
    print_info(f"Base URL: {BASE_URL}")
    print_info(f"Admin Token: {ADMIN_TOKEN[:20]}...")
    print()
    
    results = []
    
    for method, endpoint, description in ADMIN_ENDPOINTS:
        print(f"Testing: {description} ({method} {endpoint})", end=" ... ")
        success, details = test_endpoint(method, endpoint, description)
        
        if success:
            print_success(f"PASSED ({details['status_code']})")
        else:
            error_type = details.get("error_type", "Unknown")
            print_error(f"FAILED - {error_type}")
        
        results.append((description, endpoint, success, details))
    
    # Generate report
    print_header("Generating Report")
    report = generate_report(results)
    
    # Save report to file
    report_filename = f"admin_endpoint_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(report_filename, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print_success(f"Report saved to: {report_filename}")
    print()
    
    # Print summary
    total = len(results)
    passed = sum(1 for _, _, success, _ in results if success)
    failed = total - passed
    
    print_header("Test Summary")
    print_info(f"Total Endpoints: {total}")
    print_success(f"Passed: {passed} ({passed/total*100:.1f}%)")
    if failed > 0:
        print_error(f"Failed: {failed} ({failed/total*100:.1f}%)")
    
    print()
    print_info("Check the generated report file for detailed information and fixes.")
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

