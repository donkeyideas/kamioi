#!/usr/bin/env python3
"""
Check the backup backend file for quality and completeness
"""
import os

def check_backup():
    file_path = r'C:\Users\beltr\100402025Kamioiv1\v10072025\backup_20251016_203213\app_backup.py'
    
    if not os.path.exists(file_path):
        print('Backup file not found')
        return
    
    file_size = os.path.getsize(file_path)
    print(f'Backup file size: {file_size:,} bytes ({file_size/1024:.1f} KB)')
    
    # Check if it's a complete Flask app
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print(f'Total lines: {len(content.splitlines())}')
    main_check = 'if __name__ == "__main__":' in content
    print(f'Contains Flask app: {main_check}')
    print(f'Contains route definitions: {content.count("@app.route")} routes')
    print(f'Contains CORS configuration: {"CORS" in content}')
    print(f'Contains database manager: {"database_manager" in content}')
    print(f'Contains LLM trainer: {"LLMTrainer" in content}')
    
    # Check for any obvious issues
    issues = []
    if 'flask_migrate' in content:
        issues.append('Contains flask_migrate dependency')
    if 'import app' in content and 'from app import' in content:
        issues.append('Contains conflicting app imports')
    if 'UnicodeEncodeError' in content:
        issues.append('Contains Unicode encoding issues')
    if 'ModuleNotFoundError' in content:
        issues.append('Contains module import errors')
    
    if issues:
        print(f'Potential issues found: {issues}')
    else:
        print('No obvious issues detected')
    
    # Check for key components
    components = {
        'Flask app creation': 'app = Flask(__name__)',
        'CORS configuration': 'CORS(app',
        'Database manager': 'database_manager',
        'LLM trainer': 'LLMTrainer',
        'Route definitions': '@app.route',
        'Main execution': 'if __name__ == "__main__"',
        'Admin endpoints': '/api/admin/',
        'User endpoints': '/api/user/',
        'Authentication': 'auth/login'
    }
    
    print('\nKey components check:')
    for component, pattern in components.items():
        found = pattern in content
        status = '[OK]' if found else '[MISSING]'
        print(f'  {status} {component}')
    
    # Check if it looks like a complete, clean backend
    route_count = content.count('@app.route')
    has_main = 'if __name__ == "__main__"' in content
    has_cors = 'CORS(app' in content
    has_db = 'database_manager' in content
    
    print(f'\nOverall assessment:')
    if route_count > 50 and has_main and has_cors and has_db:
        print('[GOOD] This appears to be a complete, clean backend')
        print('[GOOD] Ready to use as replacement')
    else:
        print('[ISSUE] This backup may be incomplete or corrupted')
        print('[ISSUE] May need additional setup')

if __name__ == '__main__':
    check_backup()
