#!/usr/bin/env python3

import shutil
import os
from datetime import datetime

def backup_key_files():
    """Create backup of key files before LLM Center architecture changes"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_llm_center_fix_{timestamp}"
    
    print(f"Creating backup: {backup_dir}")
    
    # Create backup directory
    os.makedirs(backup_dir, exist_ok=True)
    
    # Key files to backup
    key_files = [
        "app_clean.py",
        "kamioi.db"
    ]
    
    # Key directories to backup
    key_dirs = [
        "../frontend/src/components/admin/LLMCenter.jsx"
    ]
    
    # Backup files
    for file in key_files:
        if os.path.exists(file):
            shutil.copy2(file, backup_dir)
            print(f"Backed up: {file}")
        else:
            print(f"Warning: {file} not found")
    
    # Backup directories
    for dir_path in key_dirs:
        if os.path.exists(dir_path):
            dest_path = os.path.join(backup_dir, os.path.basename(dir_path))
            if os.path.isfile(dir_path):
                shutil.copy2(dir_path, backup_dir)
            else:
                shutil.copytree(dir_path, dest_path)
            print(f"Backed up: {dir_path}")
        else:
            print(f"Warning: {dir_path} not found")
    
    print(f"Backup completed: {backup_dir}")
    return backup_dir

if __name__ == "__main__":
    backup_key_files()
