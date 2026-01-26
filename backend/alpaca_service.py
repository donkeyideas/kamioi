"""
Alpaca Trading Service for Kamioi Platform
Handles stock purchases when mappings are approved
"""

import requests
import json
from datetime import datetime, timedelta
import os
import ssl

# Simple in-memory cache for stock prices (5 minute TTL)
_price_cache = {}
_cache_ttl = 300  # 5 minutes

class AlpacaService:
    def __init__(self):
        # Alpaca Credentials - Read from environment variables
        # Set ALPACA_USE_SANDBOX=false in production to use live trading
        use_sandbox = os.getenv('ALPACA_USE_SANDBOX', 'true').lower() == 'true'

        # Determine which API to use: Trading API (simple) or Broker API (multi-account)
        # Default to Trading API for simplicity
        use_broker_api = os.getenv('ALPACA_USE_BROKER_API', 'false').lower() == 'true'

        if use_broker_api:
            # Broker API - for fintech apps managing multiple customer accounts
            if use_sandbox:
                self.base_url = "https://broker-api.sandbox.alpaca.markets"
            else:
                self.base_url = "https://broker-api.alpaca.markets"
            self.api_type = "broker"
        else:
            # Trading API - for direct trading (paper or live)
            if use_sandbox:
                self.base_url = "https://paper-api.alpaca.markets"
            else:
                self.base_url = "https://api.alpaca.markets"
            self.api_type = "trading"

        self.data_url = "https://data.alpaca.markets"

        self.api_key = os.getenv('ALPACA_API_KEY')
        self.api_secret = os.getenv('ALPACA_API_SECRET')

        if not self.api_key or not self.api_secret:
            print("WARNING: ALPACA_API_KEY and ALPACA_API_SECRET must be set in environment variables")
        else:
            print(f"Alpaca initialized: {self.api_type} API, sandbox={use_sandbox}")

        # Headers for API requests - different auth methods for Trading vs Broker API
        if self.api_type == "broker":
            # Broker API uses HTTP Basic Authentication
            import base64
            credentials = f"{self.api_key}:{self.api_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            self.headers = {
                "Authorization": f"Basic {encoded_credentials}",
                "Content-Type": "application/json"
            }
            print(f"Broker API: Using Basic Auth")
        else:
            # Trading API uses custom headers
            self.headers = {
                "APCA-API-KEY-ID": self.api_key,
                "APCA-API-SECRET-KEY": self.api_secret,
                "Content-Type": "application/json"
            }

    def get_stock_price(self, symbol):
        """
        Get current stock price for a symbol using Alpaca Market Data API.
        Uses caching to avoid rate limits.
        Falls back to free Yahoo Finance API if needed.
        """
        global _price_cache

        # Check cache first
        cache_key = symbol.upper()
        if cache_key in _price_cache:
            cached_data = _price_cache[cache_key]
            if datetime.now().timestamp() - cached_data['timestamp'] < _cache_ttl:
                return cached_data['price']

        try:
            # Try Alpaca Market Data API first (free for Alpaca users)
            url = f"https://data.alpaca.markets/v2/stocks/{symbol}/quotes/latest"
            response = requests.get(url, headers=self.headers, timeout=5)

            if response.status_code == 200:
                data = response.json()
                if 'quote' in data and 'ap' in data['quote']:
                    price = float(data['quote']['ap'])  # Ask price
                    _price_cache[cache_key] = {'price': price, 'timestamp': datetime.now().timestamp()}
                    return price

            # Fallback: Try Alpaca bars endpoint
            url = f"https://data.alpaca.markets/v2/stocks/{symbol}/bars/latest"
            response = requests.get(url, headers=self.headers, timeout=5)

            if response.status_code == 200:
                data = response.json()
                if 'bar' in data and 'c' in data['bar']:
                    price = float(data['bar']['c'])  # Close price
                    _price_cache[cache_key] = {'price': price, 'timestamp': datetime.now().timestamp()}
                    return price

            # Fallback: Use Yahoo Finance (completely free)
            price = self._get_yahoo_price(symbol)
            if price:
                _price_cache[cache_key] = {'price': price, 'timestamp': datetime.now().timestamp()}
                return price

        except Exception as e:
            print(f"Error getting stock price for {symbol}: {e}")

        # Final fallback: estimated price based on common stocks
        return self._get_fallback_price(symbol)

    def _get_yahoo_price(self, symbol):
        """Get stock price from Yahoo Finance (free)"""
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d"
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=5)

            if response.status_code == 200:
                data = response.json()
                result = data.get('chart', {}).get('result', [])
                if result:
                    meta = result[0].get('meta', {})
                    price = meta.get('regularMarketPrice')
                    if price:
                        return float(price)
        except Exception as e:
            print(f"Yahoo Finance error for {symbol}: {e}")
        return None

    def _get_fallback_price(self, symbol):
        """Fallback prices for common stocks when APIs fail"""
        fallback_prices = {
            'AAPL': 175.00, 'AMZN': 180.00, 'GOOGL': 140.00, 'MSFT': 420.00,
            'TSLA': 250.00, 'META': 500.00, 'NVDA': 900.00, 'NFLX': 600.00,
            'SBUX': 95.00, 'WMT': 165.00, 'DIS': 110.00, 'NKE': 100.00,
            'CVS': 60.00, 'UBER': 75.00, 'CMG': 3000.00, 'TGT': 150.00,
            'COST': 850.00, 'HD': 380.00, 'LOW': 250.00, 'MCD': 290.00,
            'KO': 62.00, 'PEP': 175.00, 'JPM': 200.00, 'V': 280.00, 'MA': 450.00
        }
        return fallback_prices.get(symbol.upper(), 100.00)

    def get_multiple_prices(self, symbols):
        """Get prices for multiple symbols"""
        prices = {}
        for symbol in symbols:
            prices[symbol] = self.get_stock_price(symbol)
        return prices
    
    def get_account(self):
        """Get account info (Trading API returns single account, Broker API returns list)"""
        try:
            if self.api_type == "trading":
                # Trading API: single account at /v2/account
                response = requests.get(f"{self.base_url}/v2/account", headers=self.headers, timeout=10)
                if response.status_code == 200:
                    account = response.json()
                    print(f"Trading API account: {account.get('id')} - Status: {account.get('status')}")
                    return account
                else:
                    print(f"Error getting account: {response.status_code} - {response.text}")
                    return None
            else:
                # Broker API: multiple accounts at /v1/accounts
                response = requests.get(f"{self.base_url}/v1/accounts", headers=self.headers, verify=False, timeout=10)
                if response.status_code == 200:
                    accounts = response.json()
                    if accounts:
                        return accounts[0]  # Return first account for compatibility
                    return None
                else:
                    print(f"Error getting accounts: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            print(f"Exception getting account: {e}")
            return None

    def get_accounts(self):
        """Get all accounts (for backward compatibility)"""
        account = self.get_account()
        if account:
            return [account]  # Wrap single account in list
        return []
    
    def create_account(self, account_data):
        """Create a new trading account (only for Broker API)"""
        if self.api_type == "trading":
            # Trading API doesn't support creating accounts - use existing account
            print("Trading API: Account creation not supported. Use existing account.")
            return self.get_account()

        try:
            response = requests.post(f"{self.base_url}/v1/accounts", headers=self.headers, json=account_data, verify=False, timeout=30)
            if response.status_code in [200, 201]:
                return response.json()
            else:
                print(f"Error creating account: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Exception creating account: {e}")
            return None

    def create_customer_account(self, user_data):
        """
        Create an Alpaca brokerage account for a customer (Broker API only).

        Args:
            user_data (dict): User information including:
                - email (required)
                - first_name (required)
                - last_name (required)
                - phone (optional)
                - dob (date of birth, format: YYYY-MM-DD)
                - ssn_last4 (last 4 of SSN - for sandbox we generate full)
                - address, city, state, zip_code (optional)

        Returns:
            dict: Alpaca account object with 'id' field, or None on failure
        """
        if self.api_type != "broker":
            print("Customer account creation only supported with Broker API")
            return None

        try:
            email = user_data.get('email', '')
            first_name = user_data.get('first_name', 'Test')
            last_name = user_data.get('last_name', 'User')
            phone = user_data.get('phone', '+1-555-555-5555')
            dob = user_data.get('dob', '1990-01-01')
            ssn_last4 = user_data.get('ssn_last4', '1234')

            # For sandbox, generate a test SSN
            # Alpaca rejects SSNs starting with 000, 666, or 900-999
            # Use a valid-looking format like 123-45-xxxx for sandbox testing
            # In production, you'd need the real full SSN from the user
            test_ssn = f"123-45-{ssn_last4 if len(ssn_last4) == 4 else '6789'}"

            # Address info
            street = user_data.get('address', '123 Main Street')
            city = user_data.get('city', 'New York')
            state = user_data.get('state', 'NY')
            postal_code = user_data.get('zip_code', '10001')

            # Build the account creation payload for Alpaca Broker API
            account_payload = {
                "contact": {
                    "email_address": email,
                    "phone_number": phone.replace('-', '').replace(' ', '') if phone else "5555555555",
                    "street_address": [street],
                    "city": city,
                    "state": state if len(state) == 2 else "NY",
                    "postal_code": postal_code,
                    "country": "USA"
                },
                "identity": {
                    "given_name": first_name,
                    "family_name": last_name,
                    "date_of_birth": str(dob) if dob else "1990-01-01",
                    "tax_id": test_ssn,
                    "tax_id_type": "USA_SSN",
                    "country_of_citizenship": "USA",
                    "country_of_birth": "USA",
                    "country_of_tax_residence": "USA",
                    "funding_source": ["employment_income"]
                },
                "disclosures": {
                    "is_control_person": False,
                    "is_affiliated_exchange_or_finra": False,
                    "is_politically_exposed": False,
                    "immediate_family_exposed": False
                },
                "agreements": [
                    {
                        "agreement": "margin_agreement",
                        "signed_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "ip_address": "127.0.0.1"
                    },
                    {
                        "agreement": "account_agreement",
                        "signed_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "ip_address": "127.0.0.1"
                    },
                    {
                        "agreement": "customer_agreement",
                        "signed_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "ip_address": "127.0.0.1"
                    }
                ]
            }

            print(f"Creating Alpaca account for: {email}")
            response = requests.post(
                f"{self.base_url}/v1/accounts",
                headers=self.headers,
                json=account_payload,
                verify=False,
                timeout=30
            )

            if response.status_code in [200, 201]:
                account = response.json()
                print(f"Alpaca account created successfully: {account.get('id')} - Status: {account.get('status')}")
                return account
            elif response.status_code == 409:
                # Account already exists - try to find it by email
                print(f"Account already exists for {email}, searching for existing account...")
                existing_account = self.get_account_by_email(email)
                if existing_account:
                    print(f"Found existing account: {existing_account.get('id')} - Status: {existing_account.get('status')}")
                    return existing_account
                else:
                    print(f"Could not find existing account for {email}")
                    return None
            else:
                print(f"Error creating Alpaca account: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Exception creating customer account: {e}")
            import traceback
            traceback.print_exc()
            return None

    def get_account_by_email(self, email):
        """Find an existing account by email (Broker API)"""
        if self.api_type != "broker":
            return None

        try:
            # Alpaca Broker API allows querying accounts
            response = requests.get(
                f"{self.base_url}/v1/accounts",
                headers=self.headers,
                params={"query": email},
                verify=False,
                timeout=15
            )
            if response.status_code == 200:
                accounts = response.json()
                # Find matching account by email
                for account in accounts:
                    contact = account.get('contact', {})
                    if contact.get('email_address', '').lower() == email.lower():
                        return account
                # If no exact match found but there are results, return first
                if accounts:
                    return accounts[0]
            else:
                print(f"Error searching accounts: {response.status_code} - {response.text}")
            return None
        except Exception as e:
            print(f"Exception searching accounts: {e}")
            return None

    def get_account_by_id(self, account_id):
        """Get a specific account by ID (Broker API)"""
        if self.api_type != "broker":
            return self.get_account()

        try:
            response = requests.get(
                f"{self.base_url}/v1/accounts/{account_id}",
                headers=self.headers,
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error getting account {account_id}: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Exception getting account: {e}")
            return None

    def is_account_active(self, account_id):
        """Check if an account is ACTIVE and allowed to trade (Broker API)"""
        if self.api_type != "broker":
            return True  # Trading API doesn't have this concept

        account = self.get_account_by_id(account_id)
        if not account:
            return False

        status = account.get('status', '').upper()
        print(f"Account {account_id} status: {status}")

        # ACTIVE accounts can trade, SUBMITTED accounts need approval
        if status == 'ACTIVE':
            return True
        elif status == 'SUBMITTED':
            print(f"Account {account_id} is pending approval (SUBMITTED)")
            return False
        elif status == 'APPROVED':
            # APPROVED but not yet ACTIVE - might need funding
            print(f"Account {account_id} is APPROVED but not yet ACTIVE")
            return True  # Try anyway
        else:
            print(f"Account {account_id} has status {status} - cannot trade")
            return False

    def get_positions(self, account_id=None):
        """Get positions for the account"""
        try:
            if self.api_type == "trading":
                # Trading API: positions at /v2/positions (no account_id needed)
                response = requests.get(f"{self.base_url}/v2/positions", headers=self.headers, timeout=10)
            else:
                # Broker API: positions per account
                response = requests.get(f"{self.base_url}/v1/trading/accounts/{account_id}/positions", headers=self.headers, verify=False, timeout=10)

            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error getting positions: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"Exception getting positions: {e}")
            return []
    
    def submit_order(self, account_id=None, symbol=None, qty=None, side="buy", order_type="market", time_in_force="day", notional=None):
        """
        Submit a stock order

        Args:
            account_id (str): Account ID (only needed for Broker API)
            symbol (str): Stock symbol (e.g., 'DIS')
            qty (float): Quantity to buy (fractional shares supported)
            side (str): 'buy' or 'sell'
            order_type (str): 'market' or 'limit'
            time_in_force (str): 'day', 'gtc', etc.
            notional (float): Dollar amount for fractional shares (alternative to qty)
        """
        try:
            order_data = {
                "symbol": symbol,
                "side": side,
                "type": order_type,
                "time_in_force": time_in_force
            }

            # Use notional (dollar amount) or qty (shares)
            if notional is not None:
                order_data["notional"] = str(notional)  # Dollar amount for fractional shares
            elif qty is not None:
                order_data["qty"] = str(qty)  # Number of shares

            print(f"Submitting {self.api_type} order: {order_data}")

            if self.api_type == "trading":
                # Trading API: orders at /v2/orders (no account_id needed)
                response = requests.post(
                    f"{self.base_url}/v2/orders",
                    headers=self.headers,
                    json=order_data,
                    timeout=30
                )
            else:
                # Broker API: orders per account
                response = requests.post(
                    f"{self.base_url}/v1/trading/accounts/{account_id}/orders",
                    headers=self.headers,
                    json=order_data,
                    verify=False,
                    timeout=30
                )

            if response.status_code in [200, 201]:
                order_result = response.json()
                print(f"Order submitted successfully: {order_result}")
                return order_result
            else:
                print(f"Error submitting order: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Exception submitting order: {e}")
            return None
    
    def buy_fractional_shares(self, account_id=None, symbol=None, dollar_amount=None):
        """
        Buy fractional shares for a specific dollar amount

        Args:
            account_id (str): Account ID (only needed for Broker API)
            symbol (str): Stock symbol (e.g., 'DIS')
            dollar_amount (float): Dollar amount to invest (e.g., 1.00)
        """
        try:
            # Use 'notional' parameter for dollar-based orders (correct way for fractional shares)
            return self.submit_order(
                account_id=account_id,
                symbol=symbol,
                notional=dollar_amount,  # Use notional for dollar amount
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
            account = self.get_account()
            if account is not None:
                print("Alpaca connection successful!")
                print(f"API Type: {self.api_type}")
                print(f"Account ID: {account.get('id')}")
                print(f"Status: {account.get('status')}")
                if self.api_type == "trading":
                    print(f"Buying Power: ${account.get('buying_power', 'N/A')}")
                    print(f"Cash: ${account.get('cash', 'N/A')}")
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
