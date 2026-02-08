#!/usr/bin/env python3
"""
Script to add sample address data to existing users for testing
"""

import sqlite3
import random

# Sample address data
cities = [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", 
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis",
    "Seattle", "Denver", "Washington", "Boston", "El Paso", "Nashville",
    "Detroit", "Oklahoma City", "Portland", "Las Vegas", "Memphis", "Louisville"
]

states = [
    "NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA", "TX", "CA", "TX", "FL",
    "TX", "OH", "NC", "CA", "IN", "WA", "CO", "DC", "MA", "TX", "TN", "MI",
    "OK", "OR", "NV", "TN", "KY"
]

zip_codes = [
    "10001", "90210", "60601", "77001", "85001", "19101", "78201", "92101",
    "75201", "95101", "73301", "32201", "76101", "43201", "28201", "94101",
    "46201", "98101", "80201", "20001", "02101", "79901", "37201", "48201",
    "73101", "97201", "89101", "38101", "40201"
]

def add_sample_addresses():
    """Add sample address data to existing users"""
    try:
        # Connect to database
        conn = sqlite3.connect('kamioi.db')
        cursor = conn.cursor()
        
        # Get all users without address data
        cursor.execute("SELECT id FROM users WHERE city IS NULL OR city = 'Unknown'")
        users = cursor.fetchall()
        
        print(f"Found {len(users)} users to update with address data")
        
        # Update each user with random address data
        for user_id, in users:
            city = random.choice(cities)
            state = random.choice(states)
            zip_code = random.choice(zip_codes)
            phone = f"{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}"
            
            cursor.execute("""
                UPDATE users 
                SET city = ?, state = ?, zip_code = ?, phone = ?
                WHERE id = ?
            """, (city, state, zip_code, phone, user_id))
            
            print(f"Updated user {user_id}: {city}, {state} {zip_code}")
        
        conn.commit()
        conn.close()
        
        print(f"Successfully updated {len(users)} users with sample address data")
        return True
        
    except Exception as e:
        print(f"Error adding sample addresses: {e}")
        return False

if __name__ == "__main__":
    add_sample_addresses()



