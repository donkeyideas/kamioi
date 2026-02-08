#!/usr/bin/env python3

import requests
import json

def clear_auth_tokens():
    """Clear authentication tokens to allow fresh login"""
    print("CLEARING AUTHENTICATION TOKENS")
    print("=" * 35)
    
    print("[CLEAR] To clear authentication tokens, please:")
    print("1. Open your browser's Developer Tools (F12)")
    print("2. Go to the 'Application' or 'Storage' tab")
    print("3. Find 'Local Storage' in the left sidebar")
    print("4. Click on 'http://localhost:3765'")
    print("5. Delete these keys:")
    print("   - kamioi_user_token")
    print("   - kamioi_admin_token")
    print("   - authToken")
    print("   - Any other token-related keys")
    print("6. Refresh the page (F5)")
    print("")
    print("Alternatively, you can run this in the browser console:")
    print("localStorage.clear()")
    print("")
    print("This will clear all stored authentication data and allow access to the login page fresh.")
    
    print("=" * 35)
    print("AUTHENTICATION TOKENS CLEARING INSTRUCTIONS COMPLETE")

if __name__ == "__main__":
    clear_auth_tokens()
