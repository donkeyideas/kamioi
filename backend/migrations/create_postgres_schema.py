"""
Create PostgreSQL schema - Phase 1 Migration
This script creates all tables in PostgreSQL with proper types and indexes
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    from config import DatabaseConfig
except ImportError as e:
    print(f"Error importing dependencies: {e}")
    print("Please install: pip install psycopg2-binary")
    sys.exit(1)

def create_postgres_schema():
    """Create all tables in PostgreSQL database"""
    
    if not DatabaseConfig.is_postgresql():
        print("ERROR: DB_TYPE is not set to 'postgresql'")
        print("Set environment variable: DB_TYPE=postgresql")
        sys.exit(1)
    
    conn = None
    cursor = None
    # Determine which host to use (in case hostname doesn't resolve)
    actual_host = DatabaseConfig.POSTGRES_HOST
    
    try:
        # Connect to PostgreSQL (to default postgres database first to create our database)
        print(f"Connecting to PostgreSQL at {DatabaseConfig.POSTGRES_HOST}:{DatabaseConfig.POSTGRES_PORT}...")
        try:
            conn = psycopg2.connect(
                host=DatabaseConfig.POSTGRES_HOST,
                port=DatabaseConfig.POSTGRES_PORT,
                user=DatabaseConfig.POSTGRES_USER,
                password=DatabaseConfig.POSTGRES_PASSWORD,
                database='postgres'  # Connect to default database first
            )
        except psycopg2.OperationalError as conn_err:
            # Try localhost if hostname fails
            if 'could not translate host name' in str(conn_err):
                print(f"Hostname '{DatabaseConfig.POSTGRES_HOST}' not resolved, trying 'localhost'...")
                try:
                    conn = psycopg2.connect(
                        host='localhost',
                        port=DatabaseConfig.POSTGRES_PORT,
                        user=DatabaseConfig.POSTGRES_USER,
                        password=DatabaseConfig.POSTGRES_PASSWORD,
                        database='postgres'
                    )
                    actual_host = 'localhost'
                    print("Connected to localhost instead")
                except:
                    raise conn_err
            else:
                raise conn_err
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        print(f"Creating database '{DatabaseConfig.POSTGRES_DB}' if it doesn't exist...")
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DatabaseConfig.POSTGRES_DB}'")
        exists = cursor.fetchone()
        if not exists:
            cursor.execute(f'CREATE DATABASE {DatabaseConfig.POSTGRES_DB}')
            print(f"[OK] Database '{DatabaseConfig.POSTGRES_DB}' created")
        else:
            print(f"[OK] Database '{DatabaseConfig.POSTGRES_DB}' already exists")
        
        cursor.close()
        conn.close()
        
        # Now connect to our database using the same host that worked
        print(f"Connecting to database '{DatabaseConfig.POSTGRES_DB}'...")
        conn = psycopg2.connect(
            host=actual_host,
            port=DatabaseConfig.POSTGRES_PORT,
            user=DatabaseConfig.POSTGRES_USER,
            password=DatabaseConfig.POSTGRES_PASSWORD,
            database=DatabaseConfig.POSTGRES_DB
        )
        cursor = conn.cursor()
        
        print("Creating tables...")
        
        # Users table (includes all columns from SQLite)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                current_tier INTEGER DEFAULT 1,
                monthly_transaction_count INTEGER DEFAULT 0,
                tier_reset_date DATE,
                loyalty_score DECIMAL(3,2) DEFAULT 0.0,
                risk_profile VARCHAR(20) DEFAULT 'medium',
                ai_fee_multiplier DECIMAL(3,2) DEFAULT 1.0,
                last_tier_check DATE,
                total_lifetime_transactions INTEGER DEFAULT 0,
                avg_monthly_transactions DECIMAL(5,2) DEFAULT 0.0,
                google_uid TEXT,
                google_photo_url TEXT,
                last_login TEXT,
                account_type VARCHAR(50) DEFAULT 'individual',
                account_number VARCHAR(50) UNIQUE,
                user_guid VARCHAR(255),
                mx_data TEXT,
                registration_completed INTEGER DEFAULT 0,
                city VARCHAR(100),
                state VARCHAR(50),
                zip_code VARCHAR(20),
                phone VARCHAR(50),
                subscription_id INTEGER,
                subscription_status VARCHAR(50) DEFAULT 'trial',
                trial_end_date TIMESTAMP,
                subscription_tier VARCHAR(50),
                round_up_amount REAL DEFAULT 1.00,
                stripe_customer_id VARCHAR(255),
                company_name VARCHAR(255),
                address TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                employer VARCHAR(255),
                occupation VARCHAR(255),
                annual_income VARCHAR(50),
                employment_status VARCHAR(50),
                dob DATE,
                ssn_last4 VARCHAR(4),
                country VARCHAR(100),
                timezone VARCHAR(100),
                risk_tolerance VARCHAR(50),
                terms_agreed BOOLEAN DEFAULT FALSE,
                privacy_agreed BOOLEAN DEFAULT FALSE,
                marketing_agreed BOOLEAN DEFAULT FALSE,
                investment_goals TEXT
            )
        ''')
        print("[OK] Created users table")

        # Add missing columns if table already exists
        cursor.execute('''
            DO $$
            BEGIN
                -- Core profile columns
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
                    ALTER TABLE users ADD COLUMN phone VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address') THEN
                    ALTER TABLE users ADD COLUMN address TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='city') THEN
                    ALTER TABLE users ADD COLUMN city VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='state') THEN
                    ALTER TABLE users ADD COLUMN state VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='zip_code') THEN
                    ALTER TABLE users ADD COLUMN zip_code VARCHAR(20);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='company_name') THEN
                    ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mx_data') THEN
                    ALTER TABLE users ADD COLUMN mx_data TEXT;
                END IF;

                -- Extended profile columns
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
                    ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_name') THEN
                    ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='employer') THEN
                    ALTER TABLE users ADD COLUMN employer VARCHAR(255);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='occupation') THEN
                    ALTER TABLE users ADD COLUMN occupation VARCHAR(255);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='annual_income') THEN
                    ALTER TABLE users ADD COLUMN annual_income VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='employment_status') THEN
                    ALTER TABLE users ADD COLUMN employment_status VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='dob') THEN
                    ALTER TABLE users ADD COLUMN dob DATE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ssn_last4') THEN
                    ALTER TABLE users ADD COLUMN ssn_last4 VARCHAR(4);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country') THEN
                    ALTER TABLE users ADD COLUMN country VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='timezone') THEN
                    ALTER TABLE users ADD COLUMN timezone VARCHAR(100);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='risk_tolerance') THEN
                    ALTER TABLE users ADD COLUMN risk_tolerance VARCHAR(50);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='terms_agreed') THEN
                    ALTER TABLE users ADD COLUMN terms_agreed BOOLEAN DEFAULT FALSE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='privacy_agreed') THEN
                    ALTER TABLE users ADD COLUMN privacy_agreed BOOLEAN DEFAULT FALSE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='marketing_agreed') THEN
                    ALTER TABLE users ADD COLUMN marketing_agreed BOOLEAN DEFAULT FALSE;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='investment_goals') THEN
                    ALTER TABLE users ADD COLUMN investment_goals TEXT;
                END IF;
            END $$;
        ''')
        
        # Transactions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                date TIMESTAMP NOT NULL,
                merchant VARCHAR(255),
                amount REAL NOT NULL,
                category VARCHAR(100),
                description TEXT,
                investable REAL DEFAULT 0,
                round_up REAL DEFAULT 0,
                total_debit REAL NOT NULL,
                ticker VARCHAR(10),
                shares REAL,
                price_per_share REAL,
                stock_price REAL,
                status VARCHAR(50) DEFAULT 'pending',
                fee REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created transactions table")
        
        # Goals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS goals (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL DEFAULT 0,
                progress REAL DEFAULT 0,
                goal_type VARCHAR(50) DEFAULT 'personal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created goals table")
        
        # Portfolios table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS portfolios (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                ticker VARCHAR(10) NOT NULL,
                shares REAL NOT NULL,
                average_price REAL NOT NULL,
                current_price REAL,
                total_value REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created portfolios table")
        
        # Notifications table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created notifications table")
        
        # Market queue table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_queue (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER,
                user_id INTEGER,
                ticker VARCHAR(10),
                amount REAL,
                status VARCHAR(50) DEFAULT 'queued',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created market_queue table")
        
        # LLM Mappings table (14M+ records - critical for performance)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS llm_mappings (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER,
                merchant_name VARCHAR(255) NOT NULL,
                ticker VARCHAR(10),
                category VARCHAR(100),
                confidence REAL DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                admin_approved INTEGER DEFAULT 0,  -- 0 = pending, 1 = approved, -1 = rejected
                ai_processed BOOLEAN DEFAULT FALSE,
                company_name VARCHAR(255),
                user_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
            )
        ''')
        print("[OK] Created llm_mappings table")
        
        # System Events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_events (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                tenant_id VARCHAR(100) NOT NULL,
                tenant_type VARCHAR(50) NOT NULL,
                data TEXT,
                correlation_id VARCHAR(255),
                source VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("[OK] Created system_events table")
        
        # Round-up Ledger table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS roundup_ledger (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                transaction_id INTEGER NOT NULL,
                round_up_amount REAL NOT NULL,
                fee_amount REAL DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                swept_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created roundup_ledger table")
        
        # Advertisements table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS advertisements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                description TEXT NOT NULL,
                offer TEXT,
                button_text VARCHAR(50) DEFAULT 'Learn More',
                link TEXT,
                gradient VARCHAR(100) DEFAULT 'from-blue-600 to-purple-600',
                target_dashboards VARCHAR(100) DEFAULT 'user,family',
                start_date TIMESTAMP,
                end_date TIMESTAMP,
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("[OK] Created advertisements table")
        
        # Statements table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS statements (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                period VARCHAR(50) NOT NULL,
                date VARCHAR(50) NOT NULL,
                size VARCHAR(50),
                format VARCHAR(10) DEFAULT 'PDF',
                file_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created statements table")
        
        # User Settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, setting_key)
            )
        ''')
        print("[OK] Created user_settings table")
        
        # Admin Settings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                setting_type VARCHAR(50) DEFAULT 'string',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("[OK] Created admin_settings table")
        
        # Subscription Plans table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                account_type VARCHAR(50) NOT NULL,
                tier VARCHAR(50) NOT NULL,
                price_monthly REAL NOT NULL,
                price_yearly REAL NOT NULL,
                features TEXT,
                limits TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("[OK] Created subscription_plans table")
        
        # User Subscriptions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                plan_id INTEGER NOT NULL,
                status VARCHAR(50) NOT NULL,
                billing_cycle VARCHAR(50) NOT NULL,
                current_period_start TIMESTAMP NOT NULL,
                current_period_end TIMESTAMP NOT NULL,
                next_billing_date TIMESTAMP,
                amount REAL NOT NULL,
                auto_renewal BOOLEAN DEFAULT TRUE,
                renewal_attempts INTEGER DEFAULT 0,
                last_renewal_attempt TIMESTAMP,
                payment_method_id VARCHAR(255),
                cancellation_requested_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created user_subscriptions table")
        
        # Renewal Queue table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS renewal_queue (
                id SERIAL PRIMARY KEY,
                subscription_id INTEGER NOT NULL,
                scheduled_date TIMESTAMP NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                attempt_count INTEGER DEFAULT 0,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subscription_id) REFERENCES user_subscriptions (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created renewal_queue table")
        
        # Renewal History table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS renewal_history (
                id SERIAL PRIMARY KEY,
                subscription_id INTEGER NOT NULL,
                renewal_date TIMESTAMP NOT NULL,
                amount REAL NOT NULL,
                status VARCHAR(50) NOT NULL,
                payment_method VARCHAR(255),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subscription_id) REFERENCES user_subscriptions (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created renewal_history table")
        
        # Subscription Analytics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subscription_analytics (
                id SERIAL PRIMARY KEY,
                plan_id INTEGER NOT NULL,
                metric_name VARCHAR(100) NOT NULL,
                metric_value REAL NOT NULL,
                date_recorded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created subscription_analytics table")
        
        # Subscription Changes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS subscription_changes (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                from_plan_id INTEGER,
                to_plan_id INTEGER NOT NULL,
                change_type VARCHAR(50) NOT NULL,
                reason TEXT,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (from_plan_id) REFERENCES subscription_plans (id) ON DELETE SET NULL,
                FOREIGN KEY (to_plan_id) REFERENCES subscription_plans (id) ON DELETE CASCADE
            )
        ''')
        print("[OK] Created subscription_changes table")
        
        # Promo Codes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS promo_codes (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) NOT NULL UNIQUE,
                description TEXT,
                discount_type VARCHAR(50) NOT NULL DEFAULT 'free_months',
                discount_value INTEGER NOT NULL,
                plan_id INTEGER,
                account_type VARCHAR(50),
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                valid_from TIMESTAMP,
                valid_until TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE SET NULL
            )
        ''')
        print("[OK] Created promo_codes table")
        
        # Promo Code Usage table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS promo_code_usage (
                id SERIAL PRIMARY KEY,
                promo_code_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                subscription_id INTEGER,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (promo_code_id) REFERENCES promo_codes (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (subscription_id) REFERENCES user_subscriptions (id) ON DELETE SET NULL
            )
        ''')
        print("[OK] Created promo_code_usage table")
        
        # Initialize default admin settings
        cursor.execute('''
            INSERT INTO admin_settings (setting_key, setting_value, setting_type, description)
            VALUES 
                ('platform_fee', '0.25', 'decimal', 'Platform fee per transaction in dollars'),
                ('confidence_threshold', '0.90', 'decimal', 'Auto-approval confidence threshold'),
                ('auto_approval_enabled', 'true', 'boolean', 'Enable automatic approval for high-confidence mappings')
            ON CONFLICT (setting_key) DO NOTHING
        ''')
        
        conn.commit()
        print("\n[OK] All tables created successfully!")
        
        # Create indexes (critical for performance)
        print("\nCreating indexes for performance...")
        create_indexes(cursor, conn)
        
        print("\n[OK] PostgreSQL schema created successfully!")
        return True
        
    except psycopg2.Error as e:
        print(f"\n[ERROR] PostgreSQL Error: {e}")
        if conn:
            conn.rollback()
        return False
    except Exception as e:
        print(f"\n[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def create_indexes(cursor, conn):
    """Create performance indexes - critical for 14M+ records"""
    
    # Transactions table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_ticker ON transactions(ticker) WHERE ticker IS NOT NULL')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transactions_pending_ticker ON transactions(id) WHERE status = \'pending\' AND ticker IS NOT NULL')
    print("[OK] Created transactions indexes")
    
    # LLM Mappings table indexes (CRITICAL - 14M+ records)
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_admin_approved ON llm_mappings(admin_approved) WHERE admin_approved = 0')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_user_id_status ON llm_mappings(user_id, status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_merchant_ticker ON llm_mappings(merchant_name, ticker)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_pending ON llm_mappings(id) WHERE admin_approved = 0 AND user_id != \'2\'')
    print("[OK] Created llm_mappings indexes")
    
    # Users table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_account_number ON users(account_number)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type)')
    print("[OK] Created users indexes")
    
    # Portfolios table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_portfolios_ticker ON portfolios(ticker)')
    print("[OK] Created portfolios indexes")
    
    # Goals table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)')
    print("[OK] Created goals indexes")
    
    # Notifications table indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read) WHERE read = FALSE')
    print("[OK] Created notifications indexes")
    
    # Market queue indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_market_queue_status ON market_queue(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_market_queue_user_id ON market_queue(user_id)')
    print("[OK] Created market_queue indexes")
    
    # Round-up ledger indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_roundup_ledger_user_id ON roundup_ledger(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_roundup_ledger_status ON roundup_ledger(status)')
    print("[OK] Created roundup_ledger indexes")
    
    # User subscriptions indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_subscriptions_next_billing ON user_subscriptions(next_billing_date) WHERE auto_renewal = TRUE')
    print("[OK] Created user_subscriptions indexes")
    
    conn.commit()
    print("\n[OK] All indexes created successfully!")

if __name__ == '__main__':
    print("=" * 60)
    print("PostgreSQL Schema Creation - Phase 1 Migration")
    print("=" * 60)
    print()
    
    success = create_postgres_schema()
    
    if success:
        print("\n" + "=" * 60)
        print("[OK] Phase 1 Schema Creation Complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Run data migration: python migrations/migrate_data.py")
        print("2. Set DB_TYPE=postgresql environment variable")
        print("3. Restart your application")
    else:
        print("\n" + "=" * 60)
        print("[ERROR] Schema creation failed. Please check errors above.")
        print("=" * 60)
        sys.exit(1)

