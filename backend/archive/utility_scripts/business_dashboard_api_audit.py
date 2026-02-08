#!/usr/bin/env python3

import os
import re
import json
from datetime import datetime

def audit_business_dashboard_apis():
    """
    Comprehensive audit of Business Dashboard API endpoints
    Checks frontend components against backend endpoints
    """
    print("=" * 80)
    print("BUSINESS DASHBOARD API ENDPOINT AUDIT REPORT")
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
    
    print("BACKEND ENDPOINTS FOUND:")
    print("-" * 50)
    for endpoint in sorted(backend_endpoints.keys()):
        print(f"  {endpoint}")
    
    print(f"\nTotal Backend Endpoints: {len(backend_endpoints)}")
    
    print("\nFRONTEND API CALLS FOUND:")
    print("-" * 50)
    for call in frontend_calls:
        print(f"  {call['url']} ({call['file']})")
    
    print(f"\nTotal Frontend API Calls: {len(frontend_calls)}")
    
    # Check for issues
    issues = []
    for call in frontend_calls:
        url = call['url']
        if 'localhost:5000' in url:
            endpoint = url.split('localhost:5000')[1].split('?')[0]
            # Skip template variables and dynamic endpoints
            if ('${' in endpoint or '<' in endpoint or '${endpoint}' in url):
                continue
            if endpoint not in backend_endpoints:
                issues.append(f"Missing endpoint: {endpoint} (called from {call['file']})")
    
    print(f"\nISSUES FOUND:")
    print("-" * 50)
    if issues:
        for issue in issues:
            print(f"  {issue}")
    else:
        print("  No issues found - all frontend calls have matching backend endpoints")
    
    print(f"\nTotal Issues: {len(issues)}")
    
    # Generate report file
    generate_report(backend_endpoints, frontend_calls, issues)

def extract_backend_endpoints(backend_path):
    """Extract all API endpoints from backend code"""
    endpoints = {}
    app_file = os.path.join(backend_path, 'app_clean.py')
    
    if not os.path.exists(app_file):
        return endpoints
    
    try:
        with open(app_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Find all @app.route decorators
        route_pattern = r"@app\.route\('([^']+)',\s*methods=\[([^\]]+)\]\)"
        routes = re.findall(route_pattern, content)
        
        for route, methods in routes:
            # Clean up methods string
            methods_list = [m.strip().strip("'\"") for m in methods.split(',')]
            endpoints[route] = {
                'methods': methods_list,
                'file': 'app_clean.py'
            }
    except Exception as e:
        print(f"Error reading backend file: {e}")
    
    return endpoints

def extract_frontend_api_calls(frontend_path):
    """Extract all API calls from frontend components"""
    api_calls = []
    
    if not os.path.exists(frontend_path):
        return api_calls
    
    # Search through business components only
    business_path = os.path.join(frontend_path, 'components', 'business')
    if os.path.exists(business_path):
        for file in os.listdir(business_path):
            if file.endswith(('.jsx', '.js')):
                file_path = os.path.join(business_path, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Find fetch calls
                    fetch_pattern = r"fetch\s*\(\s*['\"`]([^'\"`]+)['\"`]"
                    fetches = re.findall(fetch_pattern, content)
                    
                    for url in fetches:
                        if 'localhost:5000' in url or 'api/' in url:
                            api_calls.append({
                                'url': url,
                                'file': file,
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
                                'type': f'axios.{method}'
                            })
                
                except Exception as e:
                    print(f"Error reading {file}: {e}")
    
    return api_calls

def generate_report(backend_endpoints, frontend_calls, issues):
    """Generate detailed audit report"""
    report_file = os.path.join(os.path.dirname(__file__), 'BUSINESS_DASHBOARD_API_AUDIT_REPORT.md')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# Business Dashboard API Endpoint Audit Report\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## Summary\n\n")
        f.write(f"- **Total Backend Endpoints**: {len(backend_endpoints)}\n")
        f.write(f"- **Total Frontend API Calls**: {len(frontend_calls)}\n")
        f.write(f"- **Total Issues**: {len(issues)}\n\n")
        
        f.write("## Backend Endpoints\n\n")
        for endpoint in sorted(backend_endpoints.keys()):
            methods = ', '.join(backend_endpoints[endpoint]['methods'])
            f.write(f"- `{endpoint}` ({methods})\n")
        
        f.write("\n## Frontend API Calls\n\n")
        for call in frontend_calls:
            f.write(f"- `{call['url']}` ({call['file']}) - {call['type']}\n")
        
        f.write("\n## Issues Found\n\n")
        if issues:
            for issue in issues:
                f.write(f"- {issue}\n")
        else:
            f.write("- No issues found - all frontend calls have matching backend endpoints\n")
        
        f.write("\n## Recommendations\n\n")
        f.write("1. Fix any missing endpoints\n")
        f.write("2. Update frontend calls to use correct endpoints\n")
        f.write("3. Add proper error handling\n")
        f.write("4. Add loading states for API calls\n")
        f.write("5. Standardize URL patterns\n")
        f.write("6. Add API documentation\n")
    
    print(f"\nDetailed report saved to: {report_file}")

if __name__ == "__main__":
    audit_business_dashboard_apis()

