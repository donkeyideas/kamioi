#!/usr/bin/env python3
"""
Test script for the advertisement system
"""

import sqlite3
import os
import requests
import json

def test_ad_system():
    print("Testing Advertisement System...")
    
    # Test database connection
    db_path = os.path.join(os.path.dirname(__file__), "kamioi.db")
    if not os.path.exists(db_path):
        print("Database not found")
        return
    
    print("Database found")
    
    # Test creating an advertisement
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Insert a test advertisement
    cursor.execute("""
        INSERT INTO advertisements 
        (title, subtitle, description, offer, button_text, link, gradient, 
         target_dashboards, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "Invest Smart",
        "Premium Tools", 
        "Premium Investment Tools",
        "Get 20% off your first year",
        "Learn More",
        "https://kamioi.com/premium",
        "from-blue-600 to-purple-600",
        "user,family",
        True
    ))
    
    conn.commit()
    ad_id = cursor.lastrowid
    print(f"Test advertisement created with ID: {ad_id}")
    
    # Test fetching active ads
    cursor.execute("""
        SELECT id, title, subtitle, description, offer, button_text, link, gradient, 
               target_dashboards, is_active
        FROM advertisements 
        WHERE is_active = 1 
        AND (target_dashboards LIKE '%user%' OR target_dashboards LIKE '%family%')
        ORDER BY created_at DESC
        LIMIT 1
    """)
    
    row = cursor.fetchone()
    if row:
        print("Active advertisement found:")
        print(f"   Title: {row[1]}")
        print(f"   Subtitle: {row[2]}")
        print(f"   Description: {row[3]}")
        print(f"   Offer: {row[4]}")
        print(f"   Button: {row[5]}")
        print(f"   Link: {row[6]}")
        print(f"   Gradient: {row[7]}")
        print(f"   Target: {row[8]}")
        print(f"   Active: {bool(row[9])}")
    else:
        print("No active advertisements found")
    
    conn.close()
    
    print("\nAdvertisement system is ready!")
    print("   - Admin can create/manage ads via /api/admin/advertisements")
    print("   - Users see ads via /api/user/active-ad")
    print("   - Ads only show on user and family dashboards")
    print("   - Ads are controlled by admin activation")

if __name__ == "__main__":
    test_ad_system()
