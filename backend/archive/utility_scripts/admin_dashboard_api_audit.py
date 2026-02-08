#!/usr/bin/env python3

import os
import re
import json
from datetime import datetime

def audit_admin_dashboard_apis():
    """
    Comprehensive audit of Admin Dashboard API endpoints
    Checks frontend components against backend endpoints
    """
    print("=" * 80)
    print("ADMIN DASHBOARD API ENDPOINT AUDIT REPORT")
    print("=" * 80)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get project paths
    frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src')
    backend_path = os.path.dirname(__file__)
    
    # Find all backend API endpoints
    backend_endpoints = extract_backend_endpoints(backend_path)
    
    # Find all frontend API calls
    frontend_calls = extract_frontend_api_calls(frontend_path)
    
    # Analyze each admin page
    admin_pages = [
        'AdminOverview', 'AdminDashboard', 'LLMCenter', 'MLDashboard', 
        'UserManagement', 'BusinessManagement', 'FamilyManagement',
        'AdminTransactions', 'AdminAnalytics', 'AdminSettings',
        'NotificationsCenter', 'ContentManagement', 'EmployeeManagement'
    ]
    
    print("🔍 AUDIT RESULTS BY PAGE")
    print("=" * 80)
    
    total_issues = 0
    page_results = {}
    
    for page in admin_pages:
        print(f"\n📄 {page.upper()}")
        print("-" * 50)
        
        page_issues = audit_page_apis(page, frontend_calls, backend_endpoints)
        page_results[page] = page_issues
        total_issues += len(page_issues)
        
        if page_issues:
            for issue in page_issues:
                print(f"❌ {issue}")
        else:
            print("✅ All API calls are valid")
    
    print(f"\n📊 SUMMARY")
    print("=" * 80)
    print(f"Total Issues Found: {total_issues}")
    print(f"Pages Audited: {len(admin_pages)}")
    
    # Generate detailed report
    generate_detailed_report(page_results, backend_endpoints, frontend_calls)
    
    return page_results

def extract_backend_endpoints(backend_path):
    """Extract all API endpoints from backend code"""
    endpoints = {}
    app_file = os.path.join(backend_path, 'app_clean.py')
    
    if not os.path.exists(app_file):
        return endpoints
    
    with open(app_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all @app.route decorators
    route_pattern = r"@app\.route\('([^']+)',\s*methods=\[([^\]]+)\]\)"
    routes = re.findall(route_pattern, content)
    
    for route, methods in routes:
        # Clean up methods string
        methods_list = [m.strip().strip("'\"") for m in methods.split(',')]
        endpoints[route] = {
            'methods': methods_list,
            'file': 'app_clean.py',
            'line': content[:content.find(f"@app.route('{route}')")].count('\n') + 1
        }
    
    return endpoints

def extract_frontend_api_calls(frontend_path):
    """Extract all API calls from frontend components"""
    api_calls = []
    
    if not os.path.exists(frontend_path):
        return api_calls
    
    # Search through all React components
    for root, dirs, files in os.walk(frontend_path):
        for file in files:
            if file.endswith(('.jsx', '.js', '.tsx', '.ts')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Find fetch calls
                    fetch_pattern = r"fetch\s*\(\s*['\"`]([^'\"`]+)['\"`]"
                    fetches = re.findall(fetch_pattern, content)
                    
                    for url in fetches:
                        if 'localhost:5000' in url or 'api/' in url:
                            api_calls.append({
                                'url': url,
                                'file': file,
                                'path': file_path,
                                'type': 'fetch'
                            })
                    
                    # Find axios calls
                    axios_pattern = r"axios\.(get|post|put|delete)\s*\(\s*['\"`]([^'\"`]+)['\"`]"
                    axios_calls = re.findall(axios_pattern, content)
                    
                    for method, url in axios_calls:
                        if 'localhost:5000' in url or 'api/' in url:
                            api_calls.append({
                                'url': url,
                                'file': file,
                                'path': file_path,
                                'type': f'axios.{method}'
                            })
                
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return api_calls

def audit_page_apis(page_name, frontend_calls, backend_endpoints):
    """Audit API calls for a specific page"""
    issues = []
    
    # Find API calls related to this page
    page_calls = []
    for call in frontend_calls:
        if page_name.lower() in call['file'].lower() or page_name.lower() in call['path'].lower():
            page_calls.append(call)
    
    # Check each API call
    for call in page_calls:
        url = call['url']
        
        # Extract endpoint from URL
        if 'localhost:5000' in url:
            endpoint = url.split('localhost:5000')[1].split('?')[0]
        else:
            endpoint = url
        
        # Check if endpoint exists in backend
        if endpoint not in backend_endpoints:
            issues.append(f"Missing endpoint: {endpoint} (called from {call['file']})")
        else:
            # Check if method is correct (if specified)
            if call['type'].startswith('axios.'):
                method = call['type'].split('.')[1].upper()
                if method not in backend_endpoints[endpoint]['methods']:
                    issues.append(f"Wrong method: {endpoint} expects {backend_endpoints[endpoint]['methods']} but called with {method}")
    
    return issues

def generate_detailed_report(page_results, backend_endpoints, frontend_calls):
    """Generate detailed audit report"""
    report_file = os.path.join(os.path.dirname(__file__), 'ADMIN_DASHBOARD_API_AUDIT_REPORT.md')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# Admin Dashboard API Endpoint Audit Report\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## 📊 Summary\n\n")
        f.write(f"- **Total Backend Endpoints**: {len(backend_endpoints)}\n")
        f.write(f"- **Total Frontend API Calls**: {len(frontend_calls)}\n")
        f.write(f"- **Pages Audited**: {len(page_results)}\n")
        f.write(f"- **Total Issues**: {sum(len(issues) for issues in page_results.values())}\n\n")
        
        f.write("## 🔍 Backend Endpoints\n\n")
        f.write("| Endpoint | Methods | File | Line |\n")
        f.write("|----------|---------|------|------|\n")
        for endpoint, info in sorted(backend_endpoints.items()):
            f.write(f"| `{endpoint}` | {', '.join(info['methods'])} | {info['file']} | {info['line']} |\n")
        
        f.write("\n## 📱 Frontend API Calls\n\n")
        f.write("| URL | File | Type | Status |\n")
        f.write("|-----|------|------|--------|\n")
        
        for call in frontend_calls:
            url = call['url']
            if 'localhost:5000' in url:
                endpoint = url.split('localhost:5000')[1].split('?')[0]
                status = "✅ Valid" if endpoint in backend_endpoints else "❌ Missing"
            else:
                status = "⚠️ External"
            
            f.write(f"| `{url}` | {call['file']} | {call['type']} | {status} |\n")
        
        f.write("\n## 🚨 Issues by Page\n\n")
        for page, issues in page_results.items():
            if issues:
                f.write(f"### {page}\n\n")
                for issue in issues:
                    f.write(f"- ❌ {issue}\n")
                f.write("\n")
            else:
                f.write(f"### {page}\n\n✅ No issues found\n\n")
        
        f.write("## 🔧 Recommendations\n\n")
        f.write("1. **Fix Missing Endpoints**: Implement any missing API endpoints\n")
        f.write("2. **Update Frontend Calls**: Update frontend to use correct endpoints\n")
        f.write("3. **Add Error Handling**: Implement proper error handling for API calls\n")
        f.write("4. **Add Loading States**: Add loading indicators for API calls\n")
        f.write("5. **Add Retry Logic**: Implement retry logic for failed API calls\n")
    
    print(f"\n📄 Detailed report saved to: {report_file}")

if __name__ == "__main__":
    audit_admin_dashboard_apis()

