#!/usr/bin/env python3

import os
import re
import json
from datetime import datetime

def analyze_individual_pages():
    """
    Detailed analysis of each individual dashboard page and its API calls
    """
    print("=" * 80)
    print("INDIVIDUAL DASHBOARD PAGE-BY-PAGE API ANALYSIS")
    print("=" * 80)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Get project paths
    frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src')
    backend_path = os.path.dirname(__file__)
    
    # Find all backend API endpoints
    backend_endpoints = extract_backend_endpoints(backend_path)
    
    # Analyze each individual page
    individual_pages = {
        'Dashboard Overview': ['Dashboard.jsx', 'DashboardSidebar.jsx'],
        'AI Insights': ['AIInsights.jsx', 'AIRecommendations.jsx'],
        'Transactions': ['UserTransactions.jsx', 'TransactionHistory.jsx'],
        'Portfolio': ['Portfolio.jsx', 'StockStatus.jsx'],
        'Settings': ['Settings.jsx', 'ProfileSettings.jsx'],
        'Receipt Upload': ['ReceiptUpload.jsx', 'ReceiptProcessing.jsx'],
        'Analytics': ['UserAnalytics.jsx', 'FinancialAnalytics.jsx'],
        'Goals': ['Goals.jsx', 'GoalTracking.jsx'],
        'Rewards': ['Rewards.jsx', 'RewardHistory.jsx'],
        'Notifications': ['Notifications.jsx', 'NotificationCenter.jsx']
    }
    
    print("PAGE-BY-PAGE ANALYSIS:")
    print("=" * 80)
    
    total_issues = 0
    page_results = {}
    
    for page_name, components in individual_pages.items():
        print(f"\n{page_name.upper()}")
        print("-" * 60)
        
        page_issues = []
        page_api_calls = []
        
        # Find API calls for each component
        for component in components:
            component_path = os.path.join(frontend_path, 'components', 'user', component)
            if os.path.exists(component_path):
                api_calls = extract_component_api_calls(component_path)
                page_api_calls.extend(api_calls)
                
                print(f"  {component}:")
                if api_calls:
                    for call in api_calls:
                        # Check if endpoint exists
                        if 'localhost:5000' in call['url']:
                            endpoint = call['url'].split('localhost:5000')[1].split('?')[0]
                            if endpoint not in backend_endpoints:
                                page_issues.append(f"Missing: {endpoint}")
                                print(f"    MISSING: {call['url']}")
                            else:
                                print(f"    VALID: {call['url']}")
                        else:
                            print(f"    EXTERNAL: {call['url']}")
                else:
                    print(f"    No API calls found")
        
        page_results[page_name] = {
            'issues': page_issues,
            'api_calls': page_api_calls,
            'components': components
        }
        
        total_issues += len(page_issues)
        
        if page_issues:
            print(f"\n  Issues found: {len(page_issues)}")
            for issue in page_issues:
                print(f"    - {issue}")
        else:
            print(f"\n  No issues found")
    
    print(f"\nSUMMARY")
    print("=" * 80)
    print(f"Total Issues Found: {total_issues}")
    print(f"Pages Analyzed: {len(individual_pages)}")
    
    # Generate detailed report
    generate_page_report(page_results, backend_endpoints)
    
    return page_results

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

def extract_component_api_calls(component_path):
    """Extract API calls from a specific component"""
    api_calls = []
    
    try:
        with open(component_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Find fetch calls
        fetch_pattern = r"fetch\s*\(\s*['\"`]([^'\"`]+)['\"`]"
        fetches = re.findall(fetch_pattern, content)
        
        for url in fetches:
            if 'localhost:5000' in url or 'api/' in url:
                api_calls.append({
                    'url': url,
                    'type': 'fetch'
                })
        
        # Find axios calls
        axios_pattern = r"axios\.(get|post|put|delete)\s*\(\s*['\"`]([^'\"`]+)['\"`]"
        axios_calls = re.findall(axios_pattern, content)
        
        for method, url in axios_calls:
            if 'localhost:5000' in url or 'api/' in url:
                api_calls.append({
                    'url': url,
                    'type': f'axios.{method}'
                })
    
    except Exception as e:
        print(f"Error reading {component_path}: {e}")
    
    return api_calls

def generate_page_report(page_results, backend_endpoints):
    """Generate detailed page-by-page report"""
    report_file = os.path.join(os.path.dirname(__file__), 'INDIVIDUAL_PAGE_API_ANALYSIS.md')
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# Individual Dashboard Page-by-Page API Analysis\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("## Summary\n\n")
        total_issues = sum(len(page['issues']) for page in page_results.values())
        f.write(f"- **Total Pages Analyzed**: {len(page_results)}\n")
        f.write(f"- **Total Issues Found**: {total_issues}\n")
        f.write(f"- **Backend Endpoints Available**: {len(backend_endpoints)}\n\n")
        
        f.write("## Page-by-Page Analysis\n\n")
        
        for page_name, data in page_results.items():
            f.write(f"### {page_name}\n\n")
            f.write(f"**Components**: {', '.join(data['components'])}\n\n")
            
            if data['api_calls']:
                f.write("**API Calls**:\n")
                for call in data['api_calls']:
                    if 'localhost:5000' in call['url']:
                        endpoint = call['url'].split('localhost:5000')[1].split('?')[0]
                        status = "✅ Valid" if endpoint in backend_endpoints else "❌ Missing"
                    else:
                        status = "⚠️ External"
                    f.write(f"- `{call['url']}` ({call['type']}) - {status}\n")
            else:
                f.write("**API Calls**: None found\n")
            
            if data['issues']:
                f.write("\n**Issues**:\n")
                for issue in data['issues']:
                    f.write(f"- {issue}\n")
            else:
                f.write("\n**Issues**: None found\n")
            
            f.write("\n---\n\n")
        
        f.write("## Recommendations\n\n")
        f.write("1. **Fix Missing Endpoints**: Implement any missing API endpoints\n")
        f.write("2. **Update Frontend Calls**: Update frontend to use correct endpoints\n")
        f.write("3. **Add Error Handling**: Implement proper error handling for API calls\n")
        f.write("4. **Add Loading States**: Add loading indicators for API calls\n")
        f.write("5. **Add Retry Logic**: Implement retry logic for failed API calls\n")
        f.write("6. **Standardize URLs**: Use consistent URL patterns across components\n")
        f.write("7. **Add API Documentation**: Document all API endpoints and their usage\n")
    
    print(f"\nDetailed page analysis saved to: {report_file}")

if __name__ == "__main__":
    analyze_individual_pages()

