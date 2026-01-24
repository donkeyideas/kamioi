"""
Alpaca Trading Service for Kamioi Platform
Handles stock purchases when mappings are approved
"""

import requests
import json
from datetime import datetime
import os
import ssl

class AlpacaService:
    def __init__(self):
        # Alpaca Credentials - Read from environment variables
        # Set ALPACA_USE_SANDBOX=false in production to use live trading
        use_sandbox = os.getenv('ALPACA_USE_SANDBOX', 'true').lower() == 'true'

        if use_sandbox:
            self.base_url = "https://broker-api.sandbox.alpaca.markets"
        else:
            self.base_url = "https://broker-api.alpaca.markets"

        self.api_key = os.getenv('ALPACA_API_KEY')
        self.api_secret = os.getenv('ALPACA_API_SECRET')

        if not self.api_key or not self.api_secret:
            print("WARNING: ALPACA_API_KEY and ALPACA_API_SECRET must be set in environment variables")
        
        # Headers for API requests
        self.headers = {
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.api_secret,
            "Content-Type": "application/json"
        }
    
    def get_accounts(self):
        """Get all accounts"""
        try:
            response = requests.get(f"{self.base_url}/v1/accounts", headers=self.headers, verify=False)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error getting accounts: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"Exception getting accounts: {e}")
            return []
    
    def create_account(self, account_data):
        """Create a new trading account"""
        try:
            response = requests.post(f"{self.base_url}/v1/accounts", headers=self.headers, json=account_data, verify=False)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error creating account: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Exception creating account: {e}")
            return None
    
    def get_positions(self, account_id):
        """Get positions for a specific account"""
        try:
            response = requests.get(f"{self.base_url}/v1/trading/accounts/{account_id}/positions", headers=self.headers, verify=False)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error getting positions: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"Exception getting positions: {e}")
            return []
    
    def submit_order(self, account_id, symbol, qty, side="buy", order_type="market", time_in_force="day"):
        """
        Submit a stock order
        
        Args:
            account_id (str): Account ID
            symbol (str): Stock symbol (e.g., 'DIS')
            qty (float): Quantity to buy (fractional shares supported)
            side (str): 'buy' or 'sell'
            order_type (str): 'market' or 'limit'
            time_in_force (str): 'day', 'gtc', etc.
        """
        try:
            order_data = {
                "symbol": symbol,
                "qty": str(qty),  # Alpaca expects string for fractional shares
                "side": side,
                "type": order_type,
                "time_in_force": time_in_force
            }
            
            print(f"Submitting order for account {account_id}: {order_data}")
            
            response = requests.post(
                f"{self.base_url}/v1/trading/accounts/{account_id}/orders",
                headers=self.headers,
                json=order_data,
                verify=False
            )
            
            if response.status_code == 200:
                order_result = response.json()
                print(f"Order submitted successfully: {order_result}")
                return order_result
            else:
                print(f"Error submitting order: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Exception submitting order: {e}")
            return None
    
    def buy_fractional_shares(self, account_id, symbol, dollar_amount):
        """
        Buy fractional shares for a specific dollar amount
        
        Args:
            account_id (str): Account ID
            symbol (str): Stock symbol (e.g., 'DIS')
            dollar_amount (float): Dollar amount to invest (e.g., 1.00)
        """
        try:
            # For fractional shares, we use the dollar amount as quantity
            # Alpaca supports fractional shares with decimal quantities
            return self.submit_order(
                account_id=account_id,
                symbol=symbol,
                qty=dollar_amount,  # This will be treated as dollar amount for fractional shares
                side="buy",
                order_type="market",
                time_in_force="day"
            )
        except Exception as e:
            print(f"Exception buying fractional shares: {e}")
            return None
    
    def test_connection(self):
        """Test the Alpaca connection"""
        try:
            accounts = self.get_accounts()
            if accounts is not None:
                print("Alpaca connection successful!")
                print(f"Found {len(accounts)} accounts")
                for account in accounts:
                    print(f"Account ID: {account.get('id')}")
                    print(f"Status: {account.get('status')}")
                return True
            else:
                print("Alpaca connection failed!")
                return False
        except Exception as e:
            print(f"Alpaca connection error: {e}")
            return False

# Test the service
if __name__ == "__main__":
    alpaca = AlpacaService()
    alpaca.test_connection()
