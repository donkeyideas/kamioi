"""
Database Manager for Kamioi Platform
Handles persistent storage and data management
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import os

class DatabaseManager:
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Use absolute path to ensure database is found
            import os
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.db_path = os.path.join(current_dir, "kamioi.db")
        else:
            self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with all required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TIMESTAMP NOT NULL,
                merchant TEXT,
                amount REAL NOT NULL,
                category TEXT,
                description TEXT,
                investable REAL DEFAULT 0,
                round_up REAL DEFAULT 0,
                total_debit REAL NOT NULL,
                ticker TEXT,
                shares REAL,
                price_per_share REAL,
                stock_price REAL,
                status TEXT DEFAULT 'pending',
                fee REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Goals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL DEFAULT 0,
                progress REAL DEFAULT 0,
                goal_type TEXT DEFAULT 'personal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Portfolios table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS portfolios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                shares REAL NOT NULL,
                average_price REAL NOT NULL,
                current_price REAL,
                total_value REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Notifications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # LLM Mappings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS llm_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER,
                merchant_name TEXT NOT NULL,
                ticker TEXT,
                category TEXT,
                confidence REAL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                admin_approved BOOLEAN DEFAULT FALSE,
                ai_processed BOOLEAN DEFAULT FALSE,
                company_name TEXT,
                user_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions (id)
            )
        ''')
        
        # Add user_id column if it doesn't exist (for existing databases)
        try:
            cursor.execute('ALTER TABLE llm_mappings ADD COLUMN user_id TEXT')
        except sqlite3.OperationalError:
            # Column already exists, ignore
            pass
        
        # System Events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                tenant_id TEXT NOT NULL,
                tenant_type TEXT NOT NULL,
                data TEXT,
                correlation_id TEXT,
                source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Round-up Ledger table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS roundup_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                transaction_id INTEGER NOT NULL,
                round_up_amount REAL NOT NULL,
                fee_amount REAL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                swept_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (transaction_id) REFERENCES transactions (id)
            )
        ''')
        
        # Advertisements table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS advertisements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                subtitle TEXT,
                description TEXT NOT NULL,
                offer TEXT,
                button_text TEXT DEFAULT 'Learn More',
                link TEXT,
                gradient TEXT DEFAULT 'from-blue-600 to-purple-600',
                target_dashboards TEXT DEFAULT 'user,family',
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Statements table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS statements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                period TEXT NOT NULL,
                date TEXT NOT NULL,
                size TEXT,
                format TEXT DEFAULT 'PDF',
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        print("Database initialized successfully")
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def seed_initial_data(self):
        """Seed database with initial data"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if data already exists
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] > 0:
            print("Database already has data, skipping seed")
            conn.close()
            return
        
        # Insert sample users
        users = [
            (1, 'user@kamioi.com', 'John User', 'user'),
            (2, 'family@kamioi.com', 'Smith Family', 'family'),
            (3, 'business@kamioi.com', 'Tech Corp', 'business'),
            (4, 'admin@kamioi.com', 'Admin User', 'admin')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO users (id, email, name, account_type)
            VALUES (?, ?, ?, ?)
        ''', users)
        
        # Insert sample transactions
        transactions = [
            (1, 1, '2025-10-08 09:00:00', 'Apple Store', 250.0, 'technology', 'Apple stock purchase', 0.5, 1.0, 251.25, 'AAPL', 0.5, 500.0, 500.0, 'completed', 0.25),
            (2, 1, '2025-10-08 10:00:00', 'Starbucks', 4.75, 'food', 'Morning coffee', 0.25, 1.0, 6.0, 'SBUX', 0.1, 47.5, 47.5, 'completed', 0.25),
            (3, 2, '2025-10-08 20:00:00', 'Family Contribution', 2000.0, 'savings', 'Family Contribution', 0, 0, 2000.0, None, None, None, None, 'completed', 0),
            (4, 3, '2025-10-08 20:00:00', 'Client Payment', 5000.0, 'revenue', 'Client Project Payment', 0, 0, 5000.0, None, None, None, None, 'completed', 0)
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO transactions 
            (id, user_id, date, merchant, amount, category, description, investable, round_up, total_debit, ticker, shares, price_per_share, stock_price, status, fee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', transactions)
        
        # Insert sample goals
        goals = [
            (1, 1, 'Emergency Fund', 10000.0, 7500.0, 75.0, 'personal'),
            (2, 2, 'Family Vacation', 10000.0, 3000.0, 30.0, 'family'),
            (3, 3, 'Expand Team', 50000.0, 10000.0, 20.0, 'business')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO goals 
            (id, user_id, title, target_amount, current_amount, progress, goal_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', goals)
        
        # Insert sample portfolios
        portfolios = [
            (1, 1, 'AAPL', 0.5, 500.0, 500.0, 250.0),
            (2, 1, 'SBUX', 0.1, 47.5, 47.5, 4.75)
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO portfolios 
            (id, user_id, ticker, shares, average_price, current_price, total_value)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', portfolios)
        
        # Insert sample notifications
        notifications = [
            (1, 1, 'Investment Complete', 'Your Apple stock purchase has been completed', 'success'),
            (2, 1, 'Round-up Ready', 'You have $1.25 ready for investment', 'info'),
            (3, 2, 'Family Goal Update', 'Family vacation fund is 30% complete', 'info'),
            (4, 3, 'Revenue Growth', 'Monthly revenue increased 25% this quarter', 'success')
        ]
        
        cursor.executemany('''
            INSERT OR IGNORE INTO notifications 
            (id, user_id, title, message, type)
            VALUES (?, ?, ?, ?, ?)
        ''', notifications)
        
        conn.commit()
        conn.close()
        print("Initial data seeded successfully")
    
    def get_user_transactions(self, user_id: int, limit: int = 50, offset: int = 0) -> List[Dict]:
        """Get user transactions from database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY date DESC 
            LIMIT ? OFFSET ?
        ''', (user_id, limit, offset))
        
        columns = [description[0] for description in cursor.description]
        transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return transactions
    
    def get_user_dashboard_overview(self, user_id: int) -> Dict:
        """Get user dashboard overview from database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get portfolio value
        cursor.execute('''
            SELECT SUM(total_value) as portfolio_value 
            FROM portfolios 
            WHERE user_id = ?
        ''', (user_id,))
        portfolio_result = cursor.fetchone()
        portfolio_value = portfolio_result[0] or 0
        
        # Get total invested
        cursor.execute('''
            SELECT SUM(round_up) as total_invested 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed'
        ''', (user_id,))
        invested_result = cursor.fetchone()
        total_invested = invested_result[0] or 0
        
        # Calculate gains
        total_gains = portfolio_value - total_invested
        gain_percentage = (total_gains / total_invested * 100) if total_invested > 0 else 0
        
        # Get goals progress
        cursor.execute('''
            SELECT * FROM goals 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        ''', (user_id,))
        goals = [dict(zip([desc[0] for desc in cursor.description], row)) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            'portfolio_value': portfolio_value,
            'total_invested': total_invested,
            'total_gains': total_gains,
            'gain_percentage': gain_percentage,
            'goals_progress': goals,
            'recent_transactions': []
        }
    
    def get_user_roundups_total(self, user_id: int) -> Dict:
        """Get user round-up totals from database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total round-ups
        cursor.execute('''
            SELECT SUM(round_up) as total_roundups 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed'
        ''', (user_id,))
        total_result = cursor.fetchone()
        total_roundups = total_result[0] or 0
        
        # Monthly round-ups
        cursor.execute('''
            SELECT SUM(round_up) as monthly_roundups 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed' 
            AND date >= datetime('now', '-30 days')
        ''', (user_id,))
        monthly_result = cursor.fetchone()
        monthly_roundups = monthly_result[0] or 0
        
        # Count
        cursor.execute('''
            SELECT COUNT(*) as roundups_count 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed' AND round_up > 0
        ''', (user_id,))
        count_result = cursor.fetchone()
        roundups_count = count_result[0] or 0
        
        conn.close()
        
        return {
            'total_roundups': total_roundups,
            'monthly_roundups': monthly_roundups,
            'roundups_count': roundups_count
        }
    
    def get_user_fees_total(self, user_id: int) -> Dict:
        """Get user fee totals from database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total fees
        cursor.execute('''
            SELECT SUM(fee) as total_fees 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed'
        ''', (user_id,))
        total_result = cursor.fetchone()
        total_fees = total_result[0] or 0
        
        # Monthly fees
        cursor.execute('''
            SELECT SUM(fee) as monthly_fees 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed' 
            AND date >= datetime('now', '-30 days')
        ''', (user_id,))
        monthly_result = cursor.fetchone()
        monthly_fees = monthly_result[0] or 0
        
        # Count
        cursor.execute('''
            SELECT COUNT(*) as fees_count 
            FROM transactions 
            WHERE user_id = ? AND status = 'completed' AND fee > 0
        ''', (user_id,))
        count_result = cursor.fetchone()
        fees_count = count_result[0] or 0
        
        conn.close()
        
        return {
            'total_fees': total_fees,
            'monthly_fees': monthly_fees,
            'fees_count': fees_count
        }
    
    def add_transaction(self, user_id: int, transaction_data: Dict) -> int:
        """Add a new transaction to the database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO transactions 
            (user_id, date, merchant, amount, category, description, investable, round_up, total_debit, ticker, shares, price_per_share, stock_price, status, fee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            transaction_data.get('date'),
            transaction_data.get('merchant'),
            transaction_data.get('amount'),
            transaction_data.get('category'),
            transaction_data.get('description'),
            transaction_data.get('investable', 0),
            transaction_data.get('round_up', 0),
            transaction_data.get('total_debit'),
            transaction_data.get('ticker'),
            transaction_data.get('shares'),
            transaction_data.get('price_per_share'),
            transaction_data.get('stock_price'),
            transaction_data.get('status', 'pending'),
            transaction_data.get('fee', 0)
        ))
        
        transaction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return transaction_id
    
    def get_all_transactions_for_admin(self) -> List[Dict]:
        """Get all transactions for admin dashboard"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT t.*, u.name as user_name, u.account_type 
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.date DESC
        ''')
        
        columns = [description[0] for description in cursor.description]
        transactions = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        conn.close()
        return transactions
    
    def log_system_event(self, event_type: str, tenant_id: str, tenant_type: str, data: Dict = None, correlation_id: str = None, source: str = None):
        """Log system event to database"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO system_events 
            (event_type, tenant_id, tenant_type, data, correlation_id, source)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            event_type,
            tenant_id,
            tenant_type,
            json.dumps(data) if data else None,
            correlation_id,
            source
        ))
        
        conn.commit()
        conn.close()
    
    def add_llm_mapping(self, transaction_id, merchant_name, ticker, category, confidence, status, admin_approved=False, ai_processed=False, company_name=None, user_id=None):
        """Add a new LLM mapping to the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO llm_mappings 
            (transaction_id, merchant_name, ticker, category, confidence, status, admin_approved, ai_processed, company_name, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            transaction_id,
            merchant_name,
            ticker,
            category,
            confidence,
            status,
            admin_approved,
            ai_processed,
            company_name,
            user_id
        ))
        
        mapping_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return mapping_id
    
    def get_llm_mappings(self, user_id=None, status=None):
        """Get LLM mappings from the database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = 'SELECT * FROM llm_mappings WHERE 1=1'
        params = []
        
        if user_id:
            query += ' AND user_id = ?'
            params.append(user_id)
        
        if status:
            query += ' AND status = ?'
            params.append(status)
        
        query += ' ORDER BY created_at DESC'
        
        cursor.execute(query, params)
        mappings = cursor.fetchall()
        
        # Convert to list of dictionaries
        columns = [description[0] for description in cursor.description]
        result = []
        for mapping in mappings:
            mapping_dict = dict(zip(columns, mapping))
            result.append(mapping_dict)
        
        conn.close()
        return result
    
    def update_llm_mapping_status(self, mapping_id, status, admin_approved=None):
        """Update the status of an LLM mapping"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if admin_approved is not None:
            cursor.execute('''
                UPDATE llm_mappings 
                SET status = ?, admin_approved = ?
                WHERE id = ?
            ''', (status, admin_approved, mapping_id))
        else:
            cursor.execute('''
                UPDATE llm_mappings 
                SET status = ?
                WHERE id = ?
            ''', (status, mapping_id))
        
        conn.commit()
        conn.close()
        
        return True
    
    def get_mapping_by_transaction_id(self, transaction_id):
        """Get mapping details by transaction ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM llm_mappings 
            WHERE transaction_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        ''', (transaction_id,))
        
        mapping = cursor.fetchone()
        
        if mapping:
            # Get column names
            cursor.execute("PRAGMA table_info(llm_mappings)")
            columns = [column[1] for column in cursor.fetchall()]
            
            # Convert to dictionary
            mapping_dict = dict(zip(columns, mapping))
            conn.close()
            return mapping_dict
        
        conn.close()
        return None
    
    def remove_llm_mapping(self, mapping_id):
        """Remove an LLM mapping by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM llm_mappings WHERE id = ?', (mapping_id,))
        conn.commit()
        conn.close()
        
        return True

# Global database manager instance
db_manager = DatabaseManager()
