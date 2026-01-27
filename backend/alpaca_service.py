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

    def get_account_buying_power(self, account_id):
        """Get the buying power (available cash) for an account"""
        if self.api_type == "trading":
            account = self.get_account()
            if account:
                return float(account.get('buying_power', 0))
            return 0

        # Broker API - get trading account details
        try:
            response = requests.get(
                f"{self.base_url}/v1/trading/accounts/{account_id}/account",
                headers=self.headers,
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                account_data = response.json()
                buying_power = float(account_data.get('buying_power', 0))
                cash = float(account_data.get('cash', 0))
                print(f"Account {account_id}: buying_power=${buying_power}, cash=${cash}")
                return buying_power
            else:
                print(f"Error getting buying power: {response.status_code} - {response.text}")
                return 0
        except Exception as e:
            print(f"Exception getting buying power: {e}")
            return 0

    def fund_sandbox_account(self, account_id, amount=10000):
        """
        Fund a sandbox account with simulated money (Broker API sandbox only).

        Tries multiple methods:
        1. Journal from firm account (instant)
        2. ACH transfer with sandbox completion

        Args:
            account_id (str): The account ID to fund
            amount (float): Amount to fund in dollars (default $10,000)

        Returns:
            dict: Transfer/journal object or None on failure
        """
        if self.api_type != "broker":
            print("Sandbox funding only available with Broker API")
            return None

        try:
            print(f"Funding sandbox account {account_id} with ${amount}...")

            # Method 1: Try journal from firm account (instant if firm has funds)
            journal_result = self._try_firm_journal(account_id, amount)
            if journal_result:
                return journal_result

            # Method 2: ACH transfer with sandbox completion
            print("Journal failed, trying ACH transfer...")
            return self._try_ach_transfer(account_id, amount)

        except Exception as e:
            print(f"Exception funding account: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _try_firm_journal(self, account_id, amount):
        """Try to fund via journal from firm sweep account"""
        try:
            # First, get the firm account ID
            firm_account_id = self._get_firm_account_id()
            if not firm_account_id:
                print("Could not find firm account ID")
                return None

            print(f"Creating journal from firm {firm_account_id} to {account_id}...")

            journal_data = {
                "from_account": firm_account_id,
                "to_account": account_id,
                "entry_type": "JNLC",
                "amount": str(amount),
                "description": "Sandbox funding"
            }

            response = requests.post(
                f"{self.base_url}/v1/journals",
                headers=self.headers,
                json=journal_data,
                verify=False,
                timeout=30
            )

            if response.status_code in [200, 201]:
                journal = response.json()
                print(f"Journal created: {journal}")
                return journal
            else:
                print(f"Journal failed: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Exception in firm journal: {e}")
            return None

    def _get_firm_account_id(self):
        """Get the firm/sweep account ID"""
        try:
            # Try to get accounts and find the firm account
            response = requests.get(
                f"{self.base_url}/v1/accounts",
                headers=self.headers,
                params={"query": "firm"},
                verify=False,
                timeout=15
            )

            if response.status_code == 200:
                accounts = response.json()
                # Look for firm account type
                for account in accounts:
                    if account.get('account_type') == 'firm' or 'firm' in account.get('id', '').lower():
                        print(f"Found firm account: {account.get('id')}")
                        return account.get('id')

            # Try getting firm balance which might reveal firm account
            response = requests.get(
                f"{self.base_url}/v1/firm/balance",
                headers=self.headers,
                verify=False,
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                # The response might contain firm account info
                print(f"Firm balance response: {data}")
                if 'account_id' in data:
                    return data['account_id']

            return None

        except Exception as e:
            print(f"Exception getting firm account: {e}")
            return None

    def _try_ach_transfer(self, account_id, amount):
        """Try ACH transfer with sandbox completion"""
        try:
            # Step 1: Get existing ACH relationships
            ach_relationship_id = self._get_or_create_ach_relationship(account_id)
            if not ach_relationship_id:
                print("Failed to get/create ACH relationship")
                return None

            # Step 2: Create ACH transfer with instant_amount for sandbox
            transfer_data = {
                "transfer_type": "ach",
                "relationship_id": ach_relationship_id,
                "amount": str(amount),
                "instant_amount": str(amount),
                "direction": "INCOMING"
            }

            response = requests.post(
                f"{self.base_url}/v1/accounts/{account_id}/transfers",
                headers=self.headers,
                json=transfer_data,
                verify=False,
                timeout=30
            )

            if response.status_code in [200, 201]:
                transfer = response.json()
                transfer_id = transfer.get('id')
                instant = transfer.get('instant_amount', '0')
                print(f"ACH transfer created: {transfer_id}, status: {transfer.get('status')}, instant: {instant}")

                # Check if instant amount was credited
                if float(instant) > 0:
                    print(f"Instant amount ${instant} should be available!")
                    return transfer

                # Step 3: For sandbox, try to complete the transfer
                completed = self._complete_sandbox_transfer(transfer_id)
                if completed:
                    print(f"Sandbox transfer completed!")
                    return completed
                else:
                    print(f"Transfer created but not instantly completed")
                    return transfer
            else:
                print(f"ACH transfer failed: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Exception in ACH transfer: {e}")
            return None

    def _get_or_create_ach_relationship(self, account_id):
        """Get existing ACH relationship or create one"""
        try:
            # First, try to get existing relationships
            response = requests.get(
                f"{self.base_url}/v1/accounts/{account_id}/ach_relationships",
                headers=self.headers,
                verify=False,
                timeout=15
            )

            if response.status_code == 200:
                relationships = response.json()
                # Find an active relationship
                for rel in relationships:
                    if rel.get('status') == 'APPROVED':
                        print(f"Found existing ACH relationship: {rel.get('id')}")
                        return rel.get('id')

            # No active relationship, create one
            print(f"Creating new ACH relationship for account {account_id}...")
            ach_data = {
                "account_owner_name": "Test User",
                "bank_account_type": "CHECKING",
                "bank_account_number": "123456789012",
                "bank_routing_number": "121000358",
                "nickname": "Test Bank"
            }

            response = requests.post(
                f"{self.base_url}/v1/accounts/{account_id}/ach_relationships",
                headers=self.headers,
                json=ach_data,
                verify=False,
                timeout=30
            )

            if response.status_code in [200, 201]:
                rel = response.json()
                rel_id = rel.get('id')
                print(f"ACH relationship created: {rel_id}")

                # For sandbox, approve the relationship
                self._approve_sandbox_ach_relationship(account_id, rel_id)
                return rel_id
            elif response.status_code == 409:
                # Relationship exists but maybe not approved - try to get it again
                print("ACH relationship already exists, fetching...")
                response = requests.get(
                    f"{self.base_url}/v1/accounts/{account_id}/ach_relationships",
                    headers=self.headers,
                    verify=False,
                    timeout=15
                )
                if response.status_code == 200:
                    relationships = response.json()
                    if relationships:
                        return relationships[0].get('id')
            else:
                print(f"Failed to create ACH relationship: {response.status_code} - {response.text}")

            return None

        except Exception as e:
            print(f"Exception with ACH relationship: {e}")
            return None

    def _approve_sandbox_ach_relationship(self, account_id, relationship_id):
        """Approve ACH relationship in sandbox"""
        try:
            # Sandbox endpoint to approve ACH relationship
            response = requests.post(
                f"{self.base_url}/v1/sandbox/ach_relationships/{relationship_id}/approve",
                headers=self.headers,
                verify=False,
                timeout=15
            )
            if response.status_code in [200, 201, 204]:
                print(f"ACH relationship approved in sandbox")
                return True
            else:
                print(f"ACH relationship approval: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"Exception approving ACH: {e}")
            return False

    def _complete_sandbox_transfer(self, transfer_id):
        """Complete a transfer instantly in sandbox environment"""
        # Try multiple endpoint variations that Alpaca sandbox might use
        endpoints_to_try = [
            f"{self.base_url}/v1/sandbox/simulate/transfers/{transfer_id}",
            f"{self.base_url}/v1/sandbox/transfers/{transfer_id}",
            f"{self.base_url}/v1/sandbox/transfers/{transfer_id}/complete",
        ]

        for endpoint in endpoints_to_try:
            try:
                print(f"Trying sandbox endpoint: {endpoint}")
                response = requests.post(
                    endpoint,
                    headers=self.headers,
                    json={"action": "complete", "status": "COMPLETE"},
                    verify=False,
                    timeout=15
                )

                if response.status_code in [200, 201, 204]:
                    print(f"Sandbox transfer {transfer_id} completed via {endpoint}!")
                    if response.text:
                        try:
                            return response.json()
                        except:
                            pass
                    return {"id": transfer_id, "status": "COMPLETE"}
                else:
                    print(f"Endpoint {endpoint}: {response.status_code} - {response.text[:200] if response.text else 'no response'}")

            except Exception as e:
                print(f"Exception with endpoint {endpoint}: {e}")

        # Try PATCH method as last resort
        try:
            print(f"Trying PATCH on transfer...")
            response = requests.patch(
                f"{self.base_url}/v1/transfers/{transfer_id}",
                headers=self.headers,
                json={"status": "COMPLETE"},
                verify=False,
                timeout=15
            )
            if response.status_code in [200, 201, 204]:
                print(f"Transfer completed via PATCH")
                return {"id": transfer_id, "status": "COMPLETE"}
            else:
                print(f"PATCH failed: {response.status_code} - {response.text[:200] if response.text else 'no response'}")
        except Exception as e:
            print(f"PATCH exception: {e}")

        return None

    def ensure_account_funded(self, account_id, min_amount=100):
        """
        Ensure an account has at least min_amount in buying power.
        If not, attempt to fund it (sandbox only).

        Args:
            account_id (str): The account to check/fund
            min_amount (float): Minimum required buying power

        Returns:
            bool: True if account has sufficient funds, False otherwise
        """
        buying_power = self.get_account_buying_power(account_id)

        if buying_power >= min_amount:
            print(f"Account {account_id} has sufficient buying power: ${buying_power}")
            return True

        print(f"Account {account_id} has insufficient funds (${buying_power}), attempting to fund...")

        # Try to fund the account with $10,000 (sandbox)
        result = self.fund_sandbox_account(account_id, 10000)

        if result:
            # Give it a moment then check again
            import time
            time.sleep(1)
            new_buying_power = self.get_account_buying_power(account_id)
            print(f"After funding attempt, buying power: ${new_buying_power}")
            return new_buying_power >= min_amount

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
