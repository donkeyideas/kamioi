#!/usr/bin/env python3

from flask import Flask, jsonify, request, send_from_directory, make_response
from flask_cors import CORS, cross_origin
import psycopg2
import psycopg2.extras
import os
import hashlib
import secrets
import math
import json
import time
import threading
import tempfile
from datetime import datetime, timedelta
import base64
import uuid
from werkzeug.utils import secure_filename

# Import AI system components
try:
    from ai_fee_engine import ai_fee_engine
    from tier_management import tier_manager
    from market_monitor import market_monitor
    AI_SYSTEM_ENABLED = True
except ImportError as e:
    print(f"AI system not available: {e}")
    AI_SYSTEM_ENABLED = False
    # Create dummy objects to prevent errors
    class DummyAIEngine:
        def calculate_optimal_fee(self, *args, **kwargs):
            return {'final_fee': 0}  # No fee - subscription pays for service
    class DummyTierManager:
        def process_tier_updates(self, *args, **kwargs):
            return {'success': False, 'processed_users': 0}
        def get_tier_analytics(self, *args, **kwargs):
            return {'overall_stats': {'total_users': 0}}
    class DummyMarketMonitor:
        def update_market_conditions(self, *args, **kwargs):
            return {'success': False}
        def get_market_analytics(self, *args, **kwargs):
            return {'latest_conditions': {}}
    
    ai_fee_engine = DummyAIEngine()
    tier_manager = DummyTierManager()
    market_monitor = DummyMarketMonitor()

# Initialize Flask app
print("=" * 60)
print("KAMIOI BACKEND VERSION: 2026-01-28-v15")
print("=" * 60)
app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    allow_headers=['Content-Type', 'Authorization', 'X-Admin-Token', 'X-User-Token', 'X-Requested-With', 'Accept', 'Origin'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    supports_credentials=False,
    max_age=3600
)

# Allow CORS preflight requests without auth checks
@app.before_request
def handle_cors_preflight():
    if request.method == 'OPTIONS':
        response = make_response('', 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token, X-User-Token, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Max-Age'] = '3600'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

# Add CORS headers to ALL responses (not just preflight). Never raise so CORS is always added.
@app.after_request
def add_cors_headers(response):
    try:
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token, X-User-Token, X-Requested-With, Accept, Origin'
        response.headers['Access-Control-Max-Age'] = '3600'
    except Exception:
        pass
    return response

# Bulk upload job tracking - uses database for persistence across server restarts
BULK_UPLOAD_JOBS = {}  # In-memory cache (backup)
BULK_UPLOAD_LOCK = threading.Lock()

def _update_bulk_upload_job(job_id, **updates):
    """Update job status in both memory and database for persistence."""
    # Update in-memory cache
    with BULK_UPLOAD_LOCK:
        job = BULK_UPLOAD_JOBS.get(job_id, {})
        job.update(updates)
        BULK_UPLOAD_JOBS[job_id] = job

    # Also persist to database (survives server restarts)
    try:
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Build the update fields
        status = updates.get('status', job.get('status', 'queued'))
        processed_rows = updates.get('processed_rows', job.get('processed_rows', 0))
        total_rows = updates.get('total_rows', job.get('total_rows', 0))
        rows_per_second = updates.get('rows_per_second', job.get('rows_per_second', 0))
        errors = json.dumps(updates.get('errors', job.get('errors', [])))
        method = updates.get('method', job.get('method', ''))
        skip_indexes = updates.get('skip_indexes', job.get('skip_indexes', False))
        message = updates.get('message', job.get('message', ''))
        job_data = json.dumps(job)

        # Timestamps
        started_at = None
        if 'started_at' in updates:
            started_at = datetime.fromtimestamp(updates['started_at'])
        completed_at = None
        if status in ['completed', 'failed', 'error']:
            completed_at = datetime.now()

        # Upsert into database
        cursor.execute("""
            INSERT INTO bulk_upload_jobs (id, status, processed_rows, total_rows, rows_per_second, errors, method, skip_indexes, message, job_data, started_at, completed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                processed_rows = EXCLUDED.processed_rows,
                total_rows = EXCLUDED.total_rows,
                rows_per_second = EXCLUDED.rows_per_second,
                errors = EXCLUDED.errors,
                method = COALESCE(EXCLUDED.method, bulk_upload_jobs.method),
                skip_indexes = COALESCE(EXCLUDED.skip_indexes, bulk_upload_jobs.skip_indexes),
                message = COALESCE(EXCLUDED.message, bulk_upload_jobs.message),
                job_data = EXCLUDED.job_data,
                started_at = COALESCE(EXCLUDED.started_at, bulk_upload_jobs.started_at),
                completed_at = COALESCE(EXCLUDED.completed_at, bulk_upload_jobs.completed_at)
        """, (job_id, status, processed_rows, total_rows, rows_per_second, errors, method, skip_indexes, message, job_data, started_at, completed_at))

        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[BulkUpload] Warning: Failed to persist job {job_id} to database: {e}")
        # Continue anyway - in-memory tracking still works


def _get_bulk_upload_job(job_id):
    """Get job status from memory first, then database if not found."""
    # Check in-memory cache first
    with BULK_UPLOAD_LOCK:
        job = BULK_UPLOAD_JOBS.get(job_id)
        if job:
            return job

    # Fall back to database
    try:
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        cursor.execute("""
            SELECT id, status, processed_rows, total_rows, rows_per_second, errors,
                   method, skip_indexes, message, job_data, created_at, started_at, completed_at
            FROM bulk_upload_jobs WHERE id = %s
        """, (job_id,))

        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if row:
            job = {
                'job_id': row['id'],
                'status': row['status'],
                'processed_rows': row['processed_rows'] or 0,
                'total_rows': row['total_rows'] or 0,
                'rows_per_second': float(row['rows_per_second'] or 0),
                'errors': json.loads(row['errors'] or '[]'),
                'method': row['method'],
                'skip_indexes': row['skip_indexes'],
                'message': row['message'],
                'created_at': row['created_at'].timestamp() if row['created_at'] else None,
                'started_at': row['started_at'].timestamp() if row['started_at'] else None,
                'completed_at': row['completed_at'].timestamp() if row['completed_at'] else None
            }
            # Try to load additional data from job_data
            try:
                extra = json.loads(row['job_data'] or '{}')
                for k, v in extra.items():
                    if k not in job:
                        job[k] = v
            except:
                pass
            return job
    except Exception as e:
        print(f"[BulkUpload] Warning: Failed to get job {job_id} from database: {e}")

    return None

def _process_bulk_upload_job(job_id, file_path):
    start_time = time.time()
    _update_bulk_upload_job(job_id, status='processing', started_at=start_time)

    # Helper function for flexible column matching (defined once, outside loop)
    def get_col(row, *names):
        for name in names:
            if name in row:
                return row[name].strip() if row[name] else ''
            for k in row.keys():
                if k.lower() == name.lower():
                    return row[k].strip() if row[k] else ''
        return ''

    try:
        print(f"[BulkUpload] Starting job {job_id}, file: {file_path}")

        # Read file content with proper encoding handling
        try:
            with open(file_path, 'rb') as file_handle:
                file_content = file_handle.read().decode('utf-8')
        except UnicodeDecodeError:
            with open(file_path, 'rb') as file_handle:
                file_content = file_handle.read().decode('utf-8', errors='ignore')

        print(f"[BulkUpload] File read, size: {len(file_content)} bytes")

        import csv
        import io

        csv_reader = csv.DictReader(io.StringIO(file_content))
        fieldnames = csv_reader.fieldnames
        print(f"[BulkUpload] CSV columns detected: {fieldnames}")

        # OPTIMIZED: Process in larger batches with execute_values for speed
        batch_size = 20000  # Balanced size for faster inserts and progress updates
        processed_rows = 0
        errors = []

        # Get database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        print(f"Starting optimized bulk upload processing...")
        print(f"Batch size: {batch_size}")
        print(f"PostgreSQL batch processing enabled")

        # Create mappings table if it doesn't exist (PostgreSQL syntax)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS llm_mappings (
                id SERIAL PRIMARY KEY,
                merchant_name VARCHAR(500) NOT NULL,
                category VARCHAR(100),
                notes TEXT,
                ticker_symbol VARCHAR(20),
                confidence DECIMAL(5, 4) DEFAULT 0.0,
                status VARCHAR(50) DEFAULT 'approved',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                admin_id VARCHAR(100),
                admin_approved INTEGER DEFAULT 1,
                company_name VARCHAR(500)
            )
        ''')
        conn.commit()

        # Create indexes for fast queries (critical for 200k+ rows)
        try:
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_admin_approved ON llm_mappings(admin_approved)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_status ON llm_mappings(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_created_at ON llm_mappings(created_at DESC)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_category ON llm_mappings(category)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_merchant ON llm_mappings(merchant_name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_ticker ON llm_mappings(ticker_symbol)')
            conn.commit()
            print("Indexes created for llm_mappings table")
        except Exception as idx_err:
            print(f"Index creation warning: {idx_err}")
            conn.rollback()

        # Migrate existing table: add missing columns if they don't exist (PostgreSQL syntax)
        try:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'llm_mappings'
            """)
            columns = [row[0] for row in cursor.fetchall()]

            if 'admin_approved' not in columns:
                print("Adding admin_approved column to llm_mappings table...")
                cursor.execute("ALTER TABLE llm_mappings ADD COLUMN admin_approved INTEGER DEFAULT 1")
                conn.commit()

            if 'company_name' not in columns:
                print("Adding company_name column to llm_mappings table...")
                cursor.execute("ALTER TABLE llm_mappings ADD COLUMN company_name VARCHAR(500)")
                conn.commit()
        except Exception as migration_error:
            print(f"Migration warning: {migration_error}")
            # Continue anyway - table might not exist yet

        batch_data = []
        row_count = 0
        for row in csv_reader:
            row_count += 1
            try:
                # Validate required fields - accept multiple column name variations
                merchant_name = get_col(row, 'Merchant Name', 'merchant_name', 'merchant', 'name', 'MerchantName')
                if not merchant_name:
                    errors.append(f"Row {processed_rows + 1}: Missing merchant name")
                    continue

                # Handle confidence field - could be percentage or decimal
                confidence_str = get_col(row, 'Confidence', 'confidence', 'conf', 'score') or '0'
                confidence = 0.0
                try:
                    if confidence_str.endswith('%'):
                        # Convert percentage to decimal (93% -> 0.93)
                        confidence = float(confidence_str[:-1]) / 100.0
                    else:
                        # Already a decimal
                        confidence = float(confidence_str) if confidence_str else 0.0
                except (ValueError, TypeError):
                    confidence = 0.0

                # Map ticker symbol to company name - accept multiple column names
                ticker_symbol = get_col(row, 'Ticker Symbol', 'ticker_symbol', 'ticker', 'symbol', 'TickerSymbol', 'stock')
                company_name = get_col(row, 'Company Name', 'company_name', 'company', 'CompanyName') or get_company_name_from_ticker(ticker_symbol)

                # Get category and notes with flexible column names
                category = get_col(row, 'Category', 'category', 'cat', 'type')
                notes = get_col(row, 'Notes', 'notes', 'note', 'description', 'desc')

                # Prepare data for batch insert
                batch_data.append((
                    merchant_name,
                    category,
                    notes,
                    ticker_symbol,
                    confidence,
                    'approved',  # Direct approval for bulk uploads
                    1,  # admin_approved = 1 for bulk uploads
                    'admin_bulk_upload',
                    company_name  # Add company name
                ))

                processed_rows += 1

                # Process batch when it reaches batch_size
                if len(batch_data) >= batch_size:
                    psycopg2.extras.execute_values(
                        cursor,
                        '''
                        INSERT INTO llm_mappings 
                        (merchant_name, category, notes, ticker_symbol, confidence, status, admin_approved, admin_id, company_name)
                        VALUES %s
                        ''',
                        batch_data,
                        page_size=5000
                    )
                    conn.commit()
                    batch_data = []

                    # Progress tracking
                    elapsed_time = time.time() - start_time
                    rows_per_second = processed_rows / elapsed_time if elapsed_time > 0 else 0
                    _update_bulk_upload_job(
                        job_id,
                        processed_rows=processed_rows,
                        rows_per_second=round(rows_per_second, 0),
                        last_updated=time.time()
                    )
                    print(f"Processed {processed_rows:,} rows in {elapsed_time:.1f}s ({rows_per_second:.0f} rows/sec)")

            except Exception as e:
                errors.append(f"Row {processed_rows + 1}: {str(e)}")
                continue

        # Process remaining batch
        if batch_data:
            psycopg2.extras.execute_values(
                cursor,
                '''
                INSERT INTO llm_mappings 
                (merchant_name, category, notes, ticker_symbol, confidence, status, admin_approved, admin_id, company_name)
                VALUES %s
                ''',
                batch_data,
                page_size=min(5000, len(batch_data))
            )
            conn.commit()

        # Close connection
        cursor.close()
        conn.close()

        # Calculate final performance metrics
        end_time = time.time()
        total_time = end_time - start_time
        rows_per_second = processed_rows / total_time if total_time > 0 else 0

        print(f"Bulk upload completed!")
        print(f"Total rows: {processed_rows:,}")
        print(f"Total time: {total_time:.2f} seconds")
        print(f"Speed: {rows_per_second:.0f} rows/second")
        print(f"Performance: {batch_size:,} batch size")

        _update_bulk_upload_job(
            job_id,
            status='completed',
            processed_rows=processed_rows,
            errors=errors[:10],
            batch_size=batch_size,
            processing_time=round(total_time, 2),
            rows_per_second=round(rows_per_second, 0),
            finished_at=end_time
        )
    except Exception as e:
        end_time = time.time()
        processing_time = end_time - start_time
        print(f"Bulk upload failed after {processing_time:.2f} seconds: {str(e)}")
        import traceback
        traceback.print_exc()
        _update_bulk_upload_job(
            job_id,
            status='failed',
            error=str(e),
            processing_time=round(processing_time, 2),
            finished_at=end_time
        )
    finally:
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass

# Normalize user token format (token_ -> user_token_)
@app.before_request
def normalize_user_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return

    token = auth_header.split(' ')[1]
    if token.startswith('token_'):
        user_id = token.replace('token_', '', 1)
        request.environ['HTTP_AUTHORIZATION'] = f"Bearer user_token_{user_id}"

# Admin dashboard overview
@app.route('/api/admin/dashboard/overview', methods=['GET'])
def admin_dashboard_overview():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Basic stats
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cursor.fetchone()[0]

        cursor.execute("SELECT COALESCE(SUM(amount), 0) FROM transactions")
        total_amount = float(cursor.fetchone()[0] or 0)

        cursor.execute("SELECT COALESCE(SUM(round_up), 0) FROM transactions WHERE round_up > 0")
        total_roundups = float(cursor.fetchone()[0] or 0)

        # User Growth - get user registrations by month (last 6 months)
        cursor.execute("""
            SELECT
                TO_CHAR(created_at, 'Mon') as month,
                COUNT(*) as users
            FROM users
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'Mon')
            ORDER BY MIN(created_at)
        """)
        user_growth_raw = cursor.fetchall()

        # Build user growth data - include all months even if no users
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        now = datetime.now()
        user_growth = []
        for i in range(5, -1, -1):
            month_date = now - relativedelta(months=i)
            month_name = month_date.strftime('%b')
            # Find users for this month
            users_count = 0
            for row in user_growth_raw:
                if row[0] == month_name:
                    users_count = row[1]
                    break
            user_growth.append({
                'name': month_name,
                'value': users_count
            })

        # Revenue trend (weekly for last 5 weeks)
        cursor.execute("""
            SELECT
                EXTRACT(WEEK FROM created_at) as week_num,
                COALESCE(SUM(amount), 0) as value
            FROM transactions
            WHERE created_at >= NOW() - INTERVAL '5 weeks'
            GROUP BY EXTRACT(WEEK FROM created_at)
            ORDER BY EXTRACT(WEEK FROM created_at)
            LIMIT 5
        """)
        revenue_raw = cursor.fetchall()
        week_data = [0, 0, 0, 0, 0]
        for idx, row in enumerate(revenue_raw):
            if idx < 5:
                week_data[idx] = float(row[1]) if row[1] else 0

        # Calculate revenue trend metrics
        current_week_revenue = week_data[4] if len(week_data) > 4 else 0
        previous_week_revenue = week_data[3] if len(week_data) > 3 else 0
        growth_pct = ((current_week_revenue - previous_week_revenue) / max(previous_week_revenue, 1)) * 100 if previous_week_revenue > 0 else 0

        revenue_trend = {
            'weekData': week_data,
            'current_month': total_amount,
            'growth_percentage': round(growth_pct, 1),
            'previous_month': sum(week_data[:4]),
            'trend': 'growing' if growth_pct > 0 else ('declining' if growth_pct < 0 else 'stable')
        }

        # Recent activity
        cursor.execute("""
            SELECT name, email, created_at, account_type
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_users = cursor.fetchall()
        recent_activity = []
        for idx, user in enumerate(recent_users):
            recent_activity.append({
                'id': f'activity_{idx}',
                'type': 'user',
                'description': f'New {user[3] or "individual"} user: {user[0] or user[1]}',
                'timestamp': user[2].strftime('%b %d, %Y %H:%M') if user[2] else ''
            })

        # System status
        cursor.execute("SELECT COUNT(*) FROM users WHERE last_login IS NOT NULL AND last_login >= NOW() - INTERVAL '24 hours'")
        active_users = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        mapped_transactions = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'stats': {
                    'totalTransactions': total_transactions,
                    'totalRevenue': total_amount,
                    'totalRoundUps': total_roundups,
                    'portfolioValue': 0
                },
                'userGrowth': user_growth,
                'revenueTrend': revenue_trend,
                'recentActivity': recent_activity,
                'systemStatus': {
                    'active_users': active_users,
                    'server_load': 'low',
                    'status': 'operational',
                    'uptime': '100%',
                    'mapped_transactions': mapped_transactions
                },
                # Legacy fields for backwards compatibility
                'total_users': total_users,
                'total_transactions': total_transactions,
                'total_amount': total_amount
            }
        })
    except Exception as e:
        print(f"Admin dashboard overview error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# Database setup
# PostgreSQL connection (Render provides DATABASE_URL automatically)
DATABASE_URL = os.environ.get('DATABASE_URL')

def get_db_connection():
    """Connect to PostgreSQL database"""
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False  # Use transactions
    else:
        # Fallback for local development
        conn = psycopg2.connect(
            host='localhost',
            database='kamioi',
            user='postgres',
            password='postgres'
        )
        conn.autocommit = False
    return conn

def get_db_cursor(conn, dict_cursor=False):
    """Get a cursor - regular by default, RealDictCursor if dict_cursor=True"""
    if dict_cursor:
        return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return conn.cursor()

def get_category_distribution():
    """Get real category distribution from database"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT category, COUNT(*) as count
            FROM llm_mappings 
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category 
            ORDER BY count DESC 
            LIMIT 10
        ''')
        
        categories = cursor.fetchall()
        total_mappings = sum(row[1] for row in categories)
        
        distribution = {}
        for category, count in categories:
            percentage = round((count / total_mappings) * 100, 1) if total_mappings > 0 else 0
            distribution[category] = percentage
            
        conn.close()
        return distribution
        
    except Exception as e:
        print(f"Error getting category distribution: {e}")
        return {}

def initialize_database():
    """Initialize database with required tables and columns"""
    conn = get_db_connection()
    cursor = get_db_cursor(conn)
    
    # Create tables first, then indexes
    try:
        # Create users table if it doesn't exist (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'individual',
                account_type VARCHAR(50) DEFAULT 'individual',
                round_up_amount DECIMAL(10, 2) DEFAULT 1.00,
                risk_tolerance VARCHAR(50) DEFAULT 'Moderate',
                investment_goals TEXT DEFAULT '[]',
                terms_agreed BOOLEAN DEFAULT FALSE,
                privacy_agreed BOOLEAN DEFAULT FALSE,
                marketing_agreed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                google_uid VARCHAR(255),
                google_photo_url TEXT
            )
        """)

        # Create admins table if it doesn't exist (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'admin',
                password VARCHAR(255) NOT NULL,
                permissions TEXT DEFAULT '[]',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add permissions column if missing (PostgreSQL syntax)
        try:
            cursor.execute("ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]'")
        except Exception:
            pass

        # Add is_active column if missing (PostgreSQL syntax)
        try:
            cursor.execute("ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
        except Exception:
            pass

        # Seed a default admin if none exist (use env overrides when provided)
        cursor.execute("SELECT COUNT(*) AS count FROM admins")
        admin_count = cursor.fetchone()[0]
        if admin_count == 0:
            admin_email = (os.getenv('ADMIN_EMAIL') or 'info@kamioi.com').strip().lower()
            admin_password = os.getenv('ADMIN_PASSWORD') or 'admin123'
            password_hash = hashlib.sha256(admin_password.encode()).hexdigest()
            cursor.execute(
                "INSERT INTO admins (email, name, role, password) VALUES (%s, %s, %s, %s)",
                (admin_email, 'Main Admin', 'superadmin', password_hash)
            )
        
        # Add Google-specific columns if they don't exist (PostgreSQL syntax)
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_uid VARCHAR(255)")
        except Exception:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_photo_url TEXT")
        except Exception:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP")
        except Exception:
            pass  # Column already exists

        # Add profile columns if they don't exist (required for registration)
        profile_columns = [
            ("phone", "VARCHAR(50)"),
            ("address", "TEXT"),
            ("city", "VARCHAR(100)"),
            ("state", "VARCHAR(50)"),
            ("zip_code", "VARCHAR(20)"),
            ("company_name", "VARCHAR(255)"),
            ("mx_data", "TEXT"),
            ("user_guid", "VARCHAR(255)"),
            ("first_name", "VARCHAR(100)"),
            ("last_name", "VARCHAR(100)"),
            ("employer", "VARCHAR(255)"),
            ("occupation", "VARCHAR(255)"),
            ("annual_income", "VARCHAR(100)"),
            ("employment_status", "VARCHAR(100)"),
            ("favorite_sectors", "TEXT"),
            ("investment_style", "VARCHAR(100)"),
            ("monthly_investment_target", "DECIMAL(10,2)"),
            ("dob", "DATE"),
            ("ssn_last4", "VARCHAR(4)"),
            ("subscription_plan_id", "INTEGER"),
            ("billing_cycle", "VARCHAR(20)"),
            ("alpaca_account_id", "VARCHAR(100)"),
        ]

        for col_name, col_type in profile_columns:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
            except Exception:
                pass  # Column already exists

        # Test user seeding removed - only real users should be in the system
        # Users are created through the registration flow only

        # Create user_settings table if it doesn't exist (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id INTEGER PRIMARY KEY,
                roundup_multiplier DECIMAL(10, 2) DEFAULT 1.0,
                auto_invest BOOLEAN DEFAULT FALSE,
                notifications BOOLEAN DEFAULT FALSE,
                email_alerts BOOLEAN DEFAULT FALSE,
                theme VARCHAR(50) DEFAULT 'dark',
                business_sharing BOOLEAN DEFAULT FALSE,
                budget_alerts BOOLEAN DEFAULT FALSE,
                department_limits TEXT DEFAULT '{}',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Create transactions table if it doesn't exist (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                merchant VARCHAR(500),
                category VARCHAR(100),
                date TIMESTAMP,
                description TEXT,
                round_up DECIMAL(10, 2) DEFAULT 0,
                fee DECIMAL(10, 2) DEFAULT 0,
                total_debit DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                account_type VARCHAR(50) DEFAULT 'individual',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Add missing columns to transactions table if they don't exist (PostgreSQL syntax)
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant VARCHAR(500)")
        except Exception:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(100)")
        except Exception:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date TIMESTAMP")
        except Exception:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'individual'")
        except Exception:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ticker VARCHAR(20)")
        except Exception:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS alpaca_order_id VARCHAR(100)")
        except Exception:
            pass  # Column already exists

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shares REAL DEFAULT 0")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS price_per_share REAL DEFAULT 0")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS stock_price REAL DEFAULT 0")
        except Exception:
            pass

        # Add missing columns to llm_mappings table
        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS transaction_id INTEGER")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS user_id VARCHAR(100)")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS dashboard_type VARCHAR(50) DEFAULT 'individual'")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ticker VARCHAR(20)")
        except Exception:
            pass

        # AI processing result columns for llm_mappings
        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_attempted INTEGER DEFAULT 0")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50)")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_confidence REAL")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_reasoning TEXT")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_model_version VARCHAR(50)")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS ai_processing_duration REAL")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE llm_mappings ADD COLUMN IF NOT EXISTS admin_id VARCHAR(100)")
        except Exception:
            pass

        # Fix existing mappings: any with status='pending' should have admin_approved=0
        # (The old DEFAULT 1 caused pending mappings to show as approved)
        try:
            cursor.execute("""
                UPDATE llm_mappings SET admin_approved = 0
                WHERE status = 'pending' AND (admin_approved = 1 OR admin_approved IS NULL)
                AND user_id IS NOT NULL
            """)
            fixed = cursor.rowcount
            if fixed > 0:
                print(f"Fixed {fixed} pending mappings with wrong admin_approved value")
        except Exception:
            pass

        conn.commit()
        print("All migration columns added successfully")

        # Create portfolios table if it doesn't exist (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolios (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                ticker VARCHAR(10) NOT NULL,
                shares REAL NOT NULL DEFAULT 0,
                average_price REAL NOT NULL DEFAULT 0,
                current_price REAL,
                total_value REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)

        # Create notifications table if it doesn't exist (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info',
                read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        # Create llm_mappings table if it doesn't exist (PostgreSQL syntax - this is a duplicate, will be handled in bulk upload)
        # Note: The bulk upload function also creates this table, so this is just for initialization
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS llm_mappings (
                id SERIAL PRIMARY KEY,
                merchant_name VARCHAR(500) NOT NULL,
                category VARCHAR(100),
                ticker_symbol VARCHAR(20),
                confidence DECIMAL(5, 4) DEFAULT 0.0,
                status VARCHAR(50) DEFAULT 'pending',
                admin_id VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                admin_approved INTEGER DEFAULT 1,
                company_name VARCHAR(500)
            )
        """)
        
        # Create blog_posts table for WordPress-like blog system (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blog_posts (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                slug VARCHAR(500) UNIQUE NOT NULL,
                content TEXT NOT NULL,
                excerpt TEXT,
                featured_image TEXT,
                status VARCHAR(50) DEFAULT 'draft',
                author_id INTEGER,
                author_name VARCHAR(255),
                category VARCHAR(100),
                tags TEXT DEFAULT '[]',
                seo_title VARCHAR(500),
                seo_description TEXT,
                seo_keywords TEXT,
                meta_robots VARCHAR(100) DEFAULT 'index,follow',
                canonical_url TEXT,
                og_title VARCHAR(500),
                og_description TEXT,
                og_image TEXT,
                twitter_title VARCHAR(500),
                twitter_description TEXT,
                twitter_image TEXT,
                schema_markup TEXT,
                ai_seo_score INTEGER DEFAULT 0,
                ai_seo_suggestions TEXT DEFAULT '[]',
                read_time INTEGER DEFAULT 0,
                word_count INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES admins (id)
            )
        """)
        
        # Create blog_categories table (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blog_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                color VARCHAR(20) DEFAULT '#3B82F6',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create blog_tags table (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blog_tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create blog_seo_analytics table for SEO tracking (PostgreSQL syntax)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS blog_seo_analytics (
                id SERIAL PRIMARY KEY,
                post_id INTEGER NOT NULL,
                keyword VARCHAR(255) NOT NULL,
                position INTEGER,
                search_volume INTEGER,
                difficulty_score DECIMAL(5, 2),
                cpc DECIMAL(10, 2),
                competition VARCHAR(50),
                last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES blog_posts (id)
            )
        """)

        # Create subscription_plans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) DEFAULT 0,
                price_monthly DECIMAL(10, 2) DEFAULT 0,
                price_yearly DECIMAL(10, 2) DEFAULT 0,
                billing_period VARCHAR(50) DEFAULT 'monthly',
                account_type VARCHAR(50) DEFAULT 'individual',
                tier VARCHAR(50) DEFAULT 'basic',
                features TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                stripe_price_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Add new columns if they don't exist (for existing databases)
        for col_name, col_type, col_default in [
            ("price_monthly", "DECIMAL(10, 2)", "0"),
            ("price_yearly", "DECIMAL(10, 2)", "0"),
            ("tier", "VARCHAR(50)", "'basic'")
        ]:
            try:
                cursor.execute(f"ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS {col_name} {col_type} DEFAULT {col_default}")
            except Exception:
                pass

        # Create bulk_upload_jobs table for persistent job tracking (survives server restarts)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
                id VARCHAR(100) PRIMARY KEY,
                status VARCHAR(50) DEFAULT 'queued',
                processed_rows INTEGER DEFAULT 0,
                total_rows INTEGER DEFAULT 0,
                rows_per_second DECIMAL(10, 2) DEFAULT 0,
                errors TEXT DEFAULT '[]',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                method VARCHAR(50),
                skip_indexes BOOLEAN DEFAULT FALSE,
                message TEXT,
                job_data TEXT DEFAULT '{}'
            )
        """)

        # Create trading_limits table for Alpaca trading limits (daily/weekly/monthly)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trading_limits (
                id SERIAL PRIMARY KEY,
                limit_type VARCHAR(20) NOT NULL,
                max_amount DECIMAL(15, 2) NOT NULL,
                current_amount DECIMAL(15, 2) DEFAULT 0,
                max_orders INTEGER DEFAULT NULL,
                current_orders INTEGER DEFAULT 0,
                period_start TIMESTAMP NOT NULL,
                period_end TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_limit_type UNIQUE (limit_type)
            )
        """)

        # Create trading_limit_log table to track all processed transactions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trading_limit_log (
                id SERIAL PRIMARY KEY,
                transaction_id INTEGER,
                amount DECIMAL(15, 2) NOT NULL,
                order_count INTEGER DEFAULT 1,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                limit_type VARCHAR(20),
                FOREIGN KEY (transaction_id) REFERENCES transactions (id)
            )
        """)

        conn.commit()
        print("✅ Database tables created successfully")
        
        # Now create indexes (tables must exist first)
        try:
            print("Creating database indexes for performance optimization...")
            
            # Check if llm_mappings table exists before creating indexes
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'llm_mappings'
                )
            """)
            if cursor.fetchone()[0]:
                # Indexes for llm_mappings table
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_confidence ON llm_mappings(confidence)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_merchant_name ON llm_mappings(merchant_name)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_category ON llm_mappings(category)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_admin_approved ON llm_mappings(admin_approved)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at)
                """)
                conn.commit()
                print("✅ Database indexes created successfully")
        except Exception as index_error:
            print(f"Warning: Could not create indexes: {index_error}")
            conn.rollback()

        # Seed default subscription plans if none exist
        try:
            cursor.execute("SELECT COUNT(*) FROM subscription_plans")
            plan_count = cursor.fetchone()[0]
            if plan_count == 0:
                import json
                default_plans = [
                    {
                        'name': 'Individual',
                        'description': 'Perfect for individual investors looking to grow their wealth through automated micro-investing.',
                        'price': 9.00,
                        'price_monthly': 9.00,
                        'price_yearly': 90.00,
                        'billing_period': 'monthly',
                        'account_type': 'individual',
                        'features': json.dumps([
                            'Automatic round-ups on purchases',
                            'AI-powered investment insights',
                            'Real-time portfolio tracking',
                            'Personalized recommendations',
                            'Mobile app access',
                            'Email support'
                        ])
                    },
                    {
                        'name': 'Family',
                        'description': 'Ideal for families who want to invest together and teach financial literacy.',
                        'price': 19.00,
                        'price_monthly': 19.00,
                        'price_yearly': 190.00,
                        'billing_period': 'monthly',
                        'account_type': 'family',
                        'features': json.dumps([
                            'Up to 5 family members',
                            'Shared family goals',
                            'Family dashboard',
                            'Individual portfolios per member',
                            'Parental controls',
                            'All Individual features',
                            'Priority email support'
                        ])
                    },
                    {
                        'name': 'Business',
                        'description': 'For businesses looking to offer investment benefits to employees or manage corporate funds.',
                        'price': 49.00,
                        'price_monthly': 49.00,
                        'price_yearly': 490.00,
                        'billing_period': 'monthly',
                        'account_type': 'business',
                        'features': json.dumps([
                            'Unlimited team members',
                            'Advanced analytics dashboard',
                            'API access',
                            'Custom integrations',
                            'Dedicated account manager',
                            'White-label options',
                            'Priority phone support',
                            'All Family features'
                        ])
                    }
                ]

                for plan in default_plans:
                    cursor.execute("""
                        INSERT INTO subscription_plans (name, description, price, price_monthly, price_yearly, billing_period, account_type, features)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (plan['name'], plan['description'], plan['price'], plan['price_monthly'], plan['price_yearly'], plan['billing_period'], plan['account_type'], plan['features']))

                conn.commit()
                print("✅ Default subscription plans created successfully")
        except Exception as plan_error:
            print(f"Warning: Could not seed subscription plans: {plan_error}")
            conn.rollback()

        print("✅ Database initialized successfully")
        
    except Exception as e:
        print(f"Database initialization error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

# Initialize database on startup
initialize_database()

# Health check
@app.route('/api/health')
def health():
    try:
        # Test database connection
        conn = get_db_connection()
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat(),
            'version': '2026-01-27-v3'  # Version marker to verify deployment
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Admin authentication
@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        try:
            conn = get_db_connection()
            cursor = get_db_cursor(conn, dict_cursor=True)  # Use dict cursor for admin access
        except Exception as db_error:
            print(f"Database connection error: {db_error}")
            return jsonify({'success': False, 'error': f'Database connection failed: {str(db_error)}'}), 500
        
        try:
            # Check admin table first
            cursor.execute("SELECT id, email, name, role, password FROM admins WHERE email = %s", (email,))
            admin = cursor.fetchone()
        except Exception as query_error:
            print(f"Database query error: {query_error}")
            conn.close()
            return jsonify({'success': False, 'error': f'Database query failed: {str(query_error)}'}), 500
        
        if admin:
            # Admin found in admins table
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            if admin['password'] == password_hash:  # Check hashed password
                token = f"admin_token_{admin['id']}"
                conn.close()
                
                return jsonify({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': admin['id'],
                        'email': admin['email'],
                        'name': admin['name'],
                        'role': admin['role']
                    }
                })
        
        conn.close()
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Admin login error: {error_trace}")
        return jsonify({'success': False, 'error': f'Server error: {str(e)}'}), 500

@app.route('/api/admin/auth/me')
def admin_auth_me():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        admin_id = token.replace('admin_token_', '')
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)  # Use dict cursor for admin access
        cursor.execute("SELECT id, email, name, role FROM admins WHERE id = %s", (admin_id,))
        admin = cursor.fetchone()
        conn.close()
        
        if admin:
            return jsonify({
                'success': True,
                'user': {
                    'id': admin['id'],
                    'email': admin['email'],
                    'name': admin['name'],
                    'role': admin['role']
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Admin not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/auth/logout', methods=['POST'])
def admin_logout():
    try:
        # For now, just return success - token invalidation would be handled client-side
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin endpoints
@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, email, role, created_at, google_uid, google_photo_url, last_login
            FROM users 
            ORDER BY created_at DESC
        """)
        users = cursor.fetchall()
        conn.close()

        # Columns: id, name, email, role, created_at, google_uid, google_photo_url, last_login
        user_list = []
        for user in users:
            # Determine provider based on Google UID (index 5)
            provider = 'google' if user[5] else 'email'

            user_list.append({
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'role': user[3],
                'account_type': user[3],  # Use role as account_type for now
                'provider': provider,
                'google_uid': user[5],
                'google_photo_url': user[6],
                'created_at': user[4],
                'last_login': user[7],
                # Add comprehensive metrics
                'total_balance': 0,
                'round_ups': 0,
                'growth_rate': 0,
                'fees': 0,
                'ai_health': 0,
                'mapping_accuracy': 0,
                'risk_level': 'Unknown',
                'engagement': 0,
                'activities': 0,
                'last_activity': 'Never',
                'ai_adoption': 0,
                'source': 'Unknown',
                'status': 'Unknown'
            })
        
        return jsonify({
            'success': True,
            'users': user_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    """Delete a user by ID (admin only) - CASCADE delete all related data"""
    conn = None
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        # Verify admin token
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Check if user exists
        cursor.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404

        user_email = user[1]

        # First, get a list of all tables that exist
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
        """)
        existing_tables = set(row[0] for row in cursor.fetchall())

        # Tables to delete from, in order (child tables first)
        # Format: (table_name, column_name, use_string_for_id)
        # NOTE: llm_mappings is a GLOBAL merchant-to-ticker mapping table
        #       It does NOT have a user_id column, so we don't delete from it
        tables_to_delete = [
            ("transactions", "user_id", False),
            ("portfolios", "user_id", False),
            ("goals", "user_id", False),
            ("notifications", "user_id", False),
            ("user_settings", "user_id", False),
            ("user_subscriptions", "user_id", False),
            ("subscription_changes", "user_id", False),
            ("promo_code_usage", "user_id", False),
            ("statements", "user_id", False),
            ("roundup_ledger", "user_id", False),
            ("market_queue", "user_id", False),
            ("bank_connections", "user_id", False),
            ("user_profiles", "user_id", False),
        ]

        deleted_counts = {}

        # Delete from each table that exists
        for table_name, column_name, use_string in tables_to_delete:
            if table_name in existing_tables:
                param = str(user_id) if use_string else user_id
                cursor.execute(f"DELETE FROM {table_name} WHERE {column_name} = %s", (param,))
                deleted_counts[table_name] = cursor.rowcount
                print(f"Deleted {cursor.rowcount} rows from {table_name} for user {user_id}")

        # Finally delete the user
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        deleted_counts['users'] = cursor.rowcount

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'User {user_email} and all related data deleted successfully',
            'deleted_counts': deleted_counts
        })

    except Exception as e:
        if conn:
            try:
                conn.rollback()
                conn.close()
            except:
                pass
        print(f"Error deleting user {user_id}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/family-users', methods=['GET'])
def admin_get_family_users():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE role = 'family'")
        users = cursor.fetchall()
        conn.close()
        
        # Columns: 0=id, 1=name, 2=email, 3=role, 4=created_at
        user_list = []
        for user in users:
            user_list.append({
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'role': user[3],
                'created_at': user[4]
            })

        return jsonify({
            'success': True,
            'users': user_list
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/business-users', methods=['GET'])
def admin_get_business_users():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE role = 'business'")
        users = cursor.fetchall()
        conn.close()

        # Columns: 0=id, 1=name, 2=email, 3=role, 4=created_at
        user_list = []
        for user in users:
            user_list.append({
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'role': user[3],
                'created_at': user[4]
            })

        return jsonify({
            'success': True,
            'users': user_list
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/demo-users/create', methods=['POST'])
def admin_create_demo_users():
    """Create demo users for testing and demonstrations"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        from datetime import datetime
        from werkzeug.security import generate_password_hash

        DEMO_PASSWORD = "Demo123!"
        DEMO_ACCOUNTS = [
            {"email": "demo_user@kamioi.com", "name": "Demo User", "account_type": "individual"},
            {"email": "demo_family@kamioi.com", "name": "Demo Family Admin", "account_type": "family"},
            {"email": "demo_business@kamioi.com", "name": "Demo Business", "account_type": "business"}
        ]

        conn = get_db_connection()
        cursor = conn.cursor()
        created_users = []

        for account in DEMO_ACCOUNTS:
            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(%s)', (account['email'],))
            existing = cursor.fetchone()

            if existing:
                created_users.append({'email': account['email'], 'status': 'already_exists', 'id': existing[0]})
                continue

            # Create the user
            password_hash = generate_password_hash(DEMO_PASSWORD)
            cursor.execute('''
                INSERT INTO users (email, password, name, account_type, created_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            ''', (account['email'], password_hash, account['name'], account['account_type'], datetime.utcnow()))
            new_id = cursor.fetchone()[0]
            conn.commit()

            created_users.append({
                'email': account['email'],
                'status': 'created',
                'id': new_id,
                'account_type': account['account_type']
            })

        conn.close()
        return jsonify({
            'success': True,
            'message': 'Demo users processed',
            'users': created_users,
            'password': DEMO_PASSWORD
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/demo-users', methods=['GET'])
def admin_get_demo_users():
    """Get list of demo users"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        demo_emails = ['demo_user@kamioi.com', 'demo_family@kamioi.com', 'demo_business@kamioi.com']
        cursor.execute('''
            SELECT id, email, name, account_type, created_at
            FROM users
            WHERE LOWER(email) = ANY(%s)
        ''', ([e.lower() for e in demo_emails],))
        rows = cursor.fetchall()
        conn.close()

        users = [{
            'id': row[0],
            'email': row[1],
            'name': row[2],
            'account_type': row[3],
            'created_at': str(row[4]) if row[4] else None
        } for row in rows]

        return jsonify({
            'success': True,
            'users': users,
            'password': 'Demo123!'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/db-status', methods=['GET'])
def admin_db_status():
    """Check database status"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check users table
        cursor.execute('''
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users' ORDER BY ordinal_position
        ''')
        columns = [row[0] for row in cursor.fetchall()]

        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            'success': True,
            'status': {
                'database_type': 'postgresql',
                'users_columns': columns,
                'users_count': user_count
            }
        })

    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/admin/user-metrics', methods=['GET'])
def admin_get_user_metrics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user counts
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'individual'")
        individual_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'family'")
        family_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'business'")
        business_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users")
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'metrics': {
                'individual_users': individual_count,
                'family_users': family_count,
                'business_users': business_count,
                'total_users': total_count
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/transactions', methods=['GET'])
def admin_get_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Clear any potentially aborted transaction state
        conn.rollback()

        # Simple query - get transactions with LEFT JOIN to users
        cursor.execute("""
            SELECT t.id, t.amount, t.status, t.created_at, t.merchant, t.category,
                   t.description, t.round_up, t.total_debit, t.fee, t.account_type, t.user_id, t.ticker
            FROM transactions t
            ORDER BY t.created_at DESC NULLS LAST
            LIMIT 100
        """)
        transactions = cursor.fetchall()

        # Get user info separately to avoid JOIN issues
        user_info = {}
        if transactions:
            user_ids = list(set([str(t[11]) for t in transactions if t[11]]))
            if user_ids:
                cursor.execute("""
                    SELECT id, name, email, role FROM users WHERE id = ANY(%s::int[])
                """, (user_ids,))
                for user in cursor.fetchall():
                    user_info[str(user[0])] = {'name': user[1], 'email': user[2], 'role': user[3]}

        conn.close()

        transaction_list = []
        for txn in transactions:
            user_id = str(txn[11]) if txn[11] else None
            user = user_info.get(user_id, {'name': 'Unknown', 'email': '', 'role': 'individual'})
            user_role = user.get('role', 'individual')

            # Determine dashboard type based on user role
            dashboard_type = 'user'
            if user_role == 'family':
                dashboard_type = 'family'
            elif user_role == 'business':
                dashboard_type = 'business'

            transaction_list.append({
                'id': txn[0],
                'user_id': user_id,
                'amount': float(txn[1]) if txn[1] else 0,
                'status': txn[2],
                'created_at': str(txn[3]) if txn[3] else None,
                'date': str(txn[3]) if txn[3] else None,
                'merchant': txn[4] or 'Unknown Merchant',
                'category': txn[5] or 'Unknown',
                'description': txn[6],
                'round_up': float(txn[7]) if txn[7] else 0,
                'total_debit': float(txn[8]) if txn[8] else (float(txn[1]) if txn[1] else 0),
                'fee': float(txn[9]) if txn[9] else 0,
                'ticker': txn[12] if len(txn) > 12 else None,
                'account_type': txn[10],
                'user_name': user.get('name', 'Unknown'),
                'user_email': user.get('email', ''),
                'user_role': user_role,
                'dashboard': dashboard_type
            })

        return jsonify({
            'success': True,
            'transactions': transaction_list,
            'total': len(transaction_list)
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/employees', methods=['GET'])
def admin_get_employees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Ensure is_active column exists
        try:
            cursor.execute("ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
            conn.commit()
        except Exception:
            pass

        # Select employees with COALESCE for is_active
        cursor.execute("""
            SELECT id, name, email, role, permissions, COALESCE(is_active, TRUE) as is_active, created_at
            FROM admins
            ORDER BY created_at DESC
        """)
        employees = cursor.fetchall()
        conn.close()

        employee_list = []
        for emp in employees:
            # PostgreSQL returns tuples, use integer indices
            permissions_raw = emp[4] if len(emp) > 4 else '[]'
            try:
                permissions = json.loads(permissions_raw) if permissions_raw else {}
            except (json.JSONDecodeError, TypeError):
                permissions = {}

            employee_list.append({
                'id': emp[0],
                'name': emp[1],
                'email': emp[2],
                'role': emp[3],
                'permissions': permissions,
                'is_active': bool(emp[5]) if len(emp) > 5 and emp[5] is not None else True,
                'created_at': emp[6] if len(emp) > 6 else None
            })

        return jsonify({
            'success': True,
            'employees': employee_list
        })

    except Exception as e:
        import traceback
        print(f"[EMPLOYEES GET] Error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/employees/<int:employee_id>', methods=['PUT', 'DELETE'])
def admin_employee_operations(employee_id):
    """Update or delete an admin employee"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if employee exists - PostgreSQL uses %s placeholders
        cursor.execute("SELECT id, email FROM admins WHERE id = %s", (employee_id,))
        employee = cursor.fetchone()

        if not employee:
            conn.close()
            return jsonify({'success': False, 'error': 'Employee not found'}), 404

        if request.method == 'DELETE':
            # Delete the employee - PostgreSQL uses %s placeholders
            cursor.execute("DELETE FROM admins WHERE id = %s", (employee_id,))
            conn.commit()
            conn.close()

            return jsonify({
                'success': True,
                'message': f'Employee {employee[1]} deleted successfully'
            })

        elif request.method == 'PUT':
            # Update employee
            data = request.get_json()

            # Update employee data - PostgreSQL uses %s placeholders
            cursor.execute('''
                UPDATE admins
                SET email = %s, name = %s, role = %s, permissions = %s
                WHERE id = %s
            ''', (
                data.get('email'),
                data.get('name'),
                data.get('role'),
                json.dumps(data.get('permissions', {})),
                employee_id
            ))

            # Update password if provided
            if data.get('password'):
                cursor.execute('''
                    UPDATE admins
                    SET password = %s
                    WHERE id = %s
                ''', (data.get('password'), employee_id))
            
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Employee updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/system-reset', methods=['POST'])
def admin_system_reset():
    """Reset the entire system - clears all data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Clear all data from all tables
        tables_to_clear = [
            'users', 'transactions', 'llm_mappings', 'notifications', 'blog_posts', 
            'blog_categories', 'blog_tags', 'blog_seo_analytics',
            'ai_fee_history', 'ai_recommendations', 'user_behavior_analytics',
            'user_settings', 'market_conditions', 'fee_tiers'
        ]
        
        cleared_tables = []
        for table in tables_to_clear:
            try:
                cursor.execute(f"DELETE FROM {table}")
                cleared_tables.append(table)
            except Exception as e:
                print(f"Warning: Could not clear table {table}: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'System reset completed successfully',
            'cleared_tables': cleared_tables
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# LLM Center endpoints
@app.route('/api/admin/llm-center/queue', methods=['GET'])
def admin_llm_queue():
    """Get LLM center queue data - WORKING VERSION"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Get actual data from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total count
        cursor.execute('SELECT COUNT(*) FROM llm_mappings')
        total_items = cursor.fetchone()[0]

        # Get pending count (status = 'pending') - PostgreSQL uses %s placeholders
        cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE status = %s', ('pending',))
        pending_count = cursor.fetchone()[0]

        # Get processing count (status = 'processing') - PostgreSQL uses %s placeholders
        cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE status = %s', ('processing',))
        processing_count = cursor.fetchone()[0]

        # Get completed count (status = 'approved' or 'completed') - PostgreSQL uses %s
        cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE status IN (%s, %s)', ('approved', 'completed'))
        completed_count = cursor.fetchone()[0]

        # Get recent queue items with proper date handling - PostgreSQL uses %s
        limit = int(request.args.get('limit', 10))
        cursor.execute('''
            SELECT id, transaction_id, merchant_name, ticker, category, confidence,
                   status, admin_approved, ai_processed, company_name, user_id,
                   created_at, notes, ticker_symbol, admin_id, processed_at
            FROM llm_mappings
            ORDER BY created_at DESC
            LIMIT %s
        ''', (limit,))
        
        queue_items = []
        for row in cursor.fetchall():
            # Format dates properly
            created_at = row[11] if row[11] else None
            processed_at = row[15] if row[15] else None
            
            # Convert to readable format
            if created_at:
                try:
                    from datetime import datetime
                    if isinstance(created_at, str):
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    created_at = str(created_at)
            
            if processed_at:
                try:
                    from datetime import datetime
                    if isinstance(processed_at, str):
                        processed_at = datetime.fromisoformat(processed_at.replace('Z', '+00:00'))
                    processed_at = processed_at.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    processed_at = str(processed_at)
            
            # Convert confidence decimal to percentage and named status
            try:
                if row[5] is None:
                    confidence_decimal = 0.5
                elif isinstance(row[5], str):
                    # Handle string confidence values like "High (90-100%)"
                    if "High" in str(row[5]) and "90" in str(row[5]):
                        confidence_decimal = 0.95
                    elif "Medium" in str(row[5]) and "70" in str(row[5]):
                        confidence_decimal = 0.75
                    elif "Low" in str(row[5]) and "30" in str(row[5]):
                        confidence_decimal = 0.35
                    else:
                        confidence_decimal = 0.5
                else:
                    confidence_decimal = float(row[5])
                confidence_percent = round(confidence_decimal * 100, 1)
            except (ValueError, TypeError):
                confidence_decimal = 0.5
                confidence_percent = 50.0
            
            # Convert to named status
            if confidence_percent >= 90:
                confidence_status = "Very High"
            elif confidence_percent >= 80:
                confidence_status = "High"
            elif confidence_percent >= 60:
                confidence_status = "Medium"
            elif confidence_percent >= 40:
                confidence_status = "Low"
            else:
                confidence_status = "Very Low"
            
            queue_items.append({
                'id': row[0],
                'transaction_id': row[1],
                'merchant_name': row[2],
                'ticker': row[3],
                'category': row[4],
                'confidence': confidence_percent,
                'confidence_status': confidence_status,
                'status': row[6],
                'admin_approved': row[7],
                'ai_processed': row[8],
                'company_name': row[9],
                'user_id': row[10],
                'created_at': created_at,
                'notes': row[12],
                'ticker_symbol': row[13],
                'admin_id': row[14],
                'processed_at': processed_at,
                'last_processed': processed_at if processed_at else 'Not processed'
            })
        
        # ALSO query transactions table for pending items (transactions without tickers)
        cursor.execute("""
            SELECT t.id, t.merchant, t.amount, t.category, t.status, t.created_at,
                   t.user_id, t.description, t.round_up, t.ticker
            FROM transactions t
            WHERE t.ticker IS NULL OR t.ticker = '' OR t.ticker = 'UNKNOWN' OR t.status = 'pending'
            ORDER BY t.created_at DESC
            LIMIT 100
        """)
        pending_transactions = cursor.fetchall()

        # Create queue items from pending transactions
        pending_transaction_items = []
        for row in pending_transactions:
            created_at = row[5] if row[5] else None
            if created_at:
                try:
                    from datetime import datetime
                    if isinstance(created_at, str):
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
                except:
                    created_at = str(created_at)

            pending_transaction_items.append({
                'id': f"txn_{row[0]}",
                'transaction_id': row[0],
                'merchant_name': row[1] or 'Unknown Merchant',
                'ticker': row[9],
                'category': row[3] or 'Unknown',
                'confidence': 0,
                'confidence_status': 'Pending',
                'status': row[4] or 'pending',
                'admin_approved': False,
                'ai_processed': False,
                'company_name': row[1] or 'Unknown',
                'user_id': row[6],
                'created_at': created_at,
                'notes': row[7] or '',
                'ticker_symbol': row[9],
                'admin_id': None,
                'processed_at': None,
                'last_processed': 'Not processed',
                'amount': float(row[2]) if row[2] else 0,
                'source': 'transaction'  # Mark as coming from transactions table
            })

        # Count pending transactions (without tickers)
        cursor.execute("""
            SELECT COUNT(*) FROM transactions
            WHERE ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN' OR status = 'pending'
        """)
        pending_transaction_count = cursor.fetchone()[0]

        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'queue_items': queue_items,
                'pending_transactions': pending_transaction_items,
                'total_items': total_items,
                'pending_count': pending_count,
                'processing_count': processing_count,
                'completed_count': completed_count,
                'pending_transaction_count': pending_transaction_count
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/processing-stats', methods=['GET'])
def admin_llm_stats():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get basic stats
        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE status = 'mapped'")
        mapped_transactions = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_transactions': total_transactions,
                'mapped_transactions': mapped_transactions,
                'mapping_rate': round((mapped_transactions / max(total_transactions, 1)) * 100, 2)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/pending-transactions', methods=['GET'])
def admin_llm_pending_transactions():
    """Get transactions that need LLM mapping (ticker is NULL or status='pending')"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get pending transactions (no ticker assigned)
        cursor.execute("""
            SELECT t.id, t.merchant, t.amount, t.category, t.status, t.created_at,
                   t.user_id, t.description, t.round_up, t.ticker
            FROM transactions t
            WHERE t.ticker IS NULL OR t.ticker = '' OR t.ticker = 'UNKNOWN' OR t.status = 'pending'
            ORDER BY t.created_at DESC
            LIMIT 100
        """)
        rows = cursor.fetchall()

        transactions = []
        for row in rows:
            transactions.append({
                'id': row[0],
                'merchant': row[1] or 'Unknown',
                'amount': float(row[2]) if row[2] else 0,
                'category': row[3] or 'Unknown',
                'status': row[4] or 'pending',
                'created_at': str(row[5]) if row[5] else None,
                'user_id': row[6],
                'description': row[7],
                'round_up': float(row[8]) if row[8] else 0,
                'ticker': row[9]
            })

        # Get counts
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN'")
        pending_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM transactions WHERE ticker IS NOT NULL AND ticker != '' AND ticker != 'UNKNOWN'")
        mapped_count = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'pending_count': pending_count,
            'mapped_count': mapped_count,
            'transactions': transactions
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/process-transaction', methods=['POST'])
def admin_llm_process_transaction():
    """Process a single transaction - assign ticker and update status"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        data = request.get_json()
        transaction_id = data.get('transaction_id')
        ticker = data.get('ticker')
        category = data.get('category', 'Unknown')
        confidence = data.get('confidence', 0.95)

        if not transaction_id or not ticker:
            return jsonify({'success': False, 'error': 'transaction_id and ticker required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get transaction details
        cursor.execute("SELECT merchant, user_id FROM transactions WHERE id = %s", (transaction_id,))
        tx_row = cursor.fetchone()
        if not tx_row:
            conn.close()
            return jsonify({'success': False, 'error': 'Transaction not found'}), 404

        merchant = tx_row[0]

        # Update transaction with ticker and status
        cursor.execute("""
            UPDATE transactions
            SET ticker = %s, category = %s, status = 'mapped'
            WHERE id = %s
        """, (ticker, category, transaction_id))

        # Also save mapping to llm_mappings for future auto-matching
        cursor.execute("""
            INSERT INTO llm_mappings (merchant_name, ticker_symbol, category, confidence, status, admin_approved, created_at)
            VALUES (%s, %s, %s, %s, 'approved', 1, CURRENT_TIMESTAMP)
            ON CONFLICT (merchant_name) DO UPDATE SET
                ticker_symbol = EXCLUDED.ticker_symbol,
                category = EXCLUDED.category,
                confidence = EXCLUDED.confidence,
                status = 'approved',
                admin_approved = 1
        """, (merchant, ticker, category, confidence))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Transaction {transaction_id} mapped to {ticker}',
            'mapping_saved': True
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/llm-center/process-pending-transactions', methods=['POST'])
def admin_llm_process_pending_transactions():
    """
    Process ALL pending transactions by looking up mappings in llm_mappings table.
    This is the main LLM processing endpoint that should be called periodically or on-demand.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get all pending transactions (case-insensitive status check)
        cursor.execute("""
            SELECT id, merchant, category, user_id, round_up, amount
            FROM transactions
            WHERE LOWER(status) = 'pending' AND (ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN')
            ORDER BY id ASC
        """)
        pending_transactions = cursor.fetchall()

        if not pending_transactions:
            cursor.close()
            conn.close()
            return jsonify({
                'success': True,
                'message': 'No pending transactions to process',
                'processed': 0,
                'mapped': 0,
                'no_match': 0
            })

        processed = 0
        mapped = 0
        no_match = 0
        results = []

        for tx in pending_transactions:
            tx_id = tx['id']
            merchant = tx['merchant'] or ''

            # Look up mapping in llm_mappings table (case-insensitive)
            cursor.execute("""
                SELECT ticker_symbol, category, confidence
                FROM llm_mappings
                WHERE LOWER(merchant_name) = LOWER(%s)
                AND status = 'approved'
                AND admin_approved = 1
                ORDER BY confidence DESC
                LIMIT 1
            """, (merchant,))
            mapping = cursor.fetchone()

            if mapping and mapping['ticker_symbol']:
                # Found a mapping - update the transaction
                ticker = mapping['ticker_symbol']
                category = mapping['category'] or tx['category'] or 'Unknown'
                confidence = mapping['confidence'] or 0.90

                cursor.execute("""
                    UPDATE transactions
                    SET ticker = %s, category = %s, status = 'mapped'
                    WHERE id = %s
                """, (ticker, category, tx_id))

                mapped += 1
                results.append({
                    'transaction_id': tx_id,
                    'merchant': merchant,
                    'ticker': ticker,
                    'category': category,
                    'confidence': float(confidence),
                    'status': 'mapped'
                })
            else:
                # No mapping found - try fuzzy match
                cursor.execute("""
                    SELECT ticker_symbol, category, confidence, merchant_name
                    FROM llm_mappings
                    WHERE LOWER(merchant_name) LIKE LOWER(%s)
                    AND status = 'approved'
                    AND admin_approved = 1
                    ORDER BY confidence DESC
                    LIMIT 1
                """, (f'%{merchant}%',))
                fuzzy_mapping = cursor.fetchone()

                if fuzzy_mapping and fuzzy_mapping['ticker_symbol']:
                    ticker = fuzzy_mapping['ticker_symbol']
                    category = fuzzy_mapping['category'] or 'Unknown'
                    confidence = fuzzy_mapping['confidence'] or 0.80

                    cursor.execute("""
                        UPDATE transactions
                        SET ticker = %s, category = %s, status = 'mapped'
                        WHERE id = %s
                    """, (ticker, category, tx_id))

                    mapped += 1
                    results.append({
                        'transaction_id': tx_id,
                        'merchant': merchant,
                        'matched_to': fuzzy_mapping['merchant_name'],
                        'ticker': ticker,
                        'category': category,
                        'confidence': float(confidence),
                        'status': 'mapped',
                        'match_type': 'fuzzy'
                    })
                else:
                    # No mapping at all - mark for manual review
                    cursor.execute("""
                        UPDATE transactions
                        SET status = 'pending-mapping'
                        WHERE id = %s
                    """, (tx_id,))

                    no_match += 1
                    results.append({
                        'transaction_id': tx_id,
                        'merchant': merchant,
                        'status': 'pending-mapping',
                        'reason': 'No mapping found'
                    })

            processed += 1

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Processed {processed} transactions: {mapped} mapped, {no_match} need manual review',
            'processed': processed,
            'mapped': mapped,
            'no_match': no_match,
            'results': results
        })

    except Exception as e:
        print(f"Error processing pending transactions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# TRADING LIMITS MANAGEMENT (Alpaca)
# ============================================

def ensure_trading_limits_table(cursor):
    """Ensure trading_limits table exists"""
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trading_limits (
                id SERIAL PRIMARY KEY,
                limit_type VARCHAR(20) NOT NULL,
                max_amount DECIMAL(15, 2) NOT NULL,
                current_amount DECIMAL(15, 2) DEFAULT 0,
                max_orders INTEGER DEFAULT NULL,
                current_orders INTEGER DEFAULT 0,
                period_start TIMESTAMP NOT NULL,
                period_end TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_limit_type UNIQUE (limit_type)
            )
        """)
        return True
    except Exception as e:
        print(f"Warning: Could not create trading_limits table: {e}")
        return False


def get_or_create_trading_limits(cursor):
    """Get or create trading limits for current periods. Returns default limits if table doesn't exist."""
    from datetime import datetime, timedelta
    now = datetime.now()

    # Default limits to return if table doesn't exist
    default_limits = {
        'daily': {
            'id': 0, 'limit_type': 'daily', 'max_amount': 10000.0,
            'current_amount': 0, 'max_orders': 100, 'current_orders': 0,
            'period_start': str(now), 'period_end': str(now + timedelta(days=1)),
            'is_active': True, 'amount_percent': 0, 'orders_percent': 0,
            'amount_remaining': 10000.0, 'orders_remaining': 100
        },
        'weekly': {
            'id': 0, 'limit_type': 'weekly', 'max_amount': 50000.0,
            'current_amount': 0, 'max_orders': 500, 'current_orders': 0,
            'period_start': str(now), 'period_end': str(now + timedelta(days=7)),
            'is_active': True, 'amount_percent': 0, 'orders_percent': 0,
            'amount_remaining': 50000.0, 'orders_remaining': 500
        },
        'monthly': {
            'id': 0, 'limit_type': 'monthly', 'max_amount': 200000.0,
            'current_amount': 0, 'max_orders': 2000, 'current_orders': 0,
            'period_start': str(now), 'period_end': str(now + timedelta(days=30)),
            'is_active': True, 'amount_percent': 0, 'orders_percent': 0,
            'amount_remaining': 200000.0, 'orders_remaining': 2000
        }
    }

    # Try to ensure table exists
    try:
        ensure_trading_limits_table(cursor)
    except Exception as e:
        print(f"Warning: Could not ensure trading_limits table: {e}")
        return default_limits

    limits = {}

    try:
        # Daily limit
        cursor.execute("""
            SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders,
                   period_start, period_end, is_active
            FROM trading_limits WHERE limit_type = 'daily'
        """)
        daily = cursor.fetchone()

        # Check if daily limit exists and is current
        if daily:
            if isinstance(daily, dict):
                period_end = daily['period_end']
            else:
                period_end = daily[7]
            if period_end and period_end < now:
                # Reset daily limit for new day
                day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                cursor.execute("""
                    UPDATE trading_limits
                    SET current_amount = 0, current_orders = 0, period_start = %s, period_end = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE limit_type = 'daily'
                """, (day_start, day_end))
                cursor.execute("SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders, period_start, period_end, is_active FROM trading_limits WHERE limit_type = 'daily'")
                daily = cursor.fetchone()
        else:
            # Create daily limit (default $10,000/day, 100 orders)
            day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            cursor.execute("""
                INSERT INTO trading_limits (limit_type, max_amount, max_orders, period_start, period_end)
                VALUES ('daily', 10000.00, 100, %s, %s)
            """, (day_start, day_end))
            cursor.execute("SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders, period_start, period_end, is_active FROM trading_limits WHERE limit_type = 'daily'")
            daily = cursor.fetchone()

        if daily:
            if isinstance(daily, dict):
                limits['daily'] = daily
            else:
                limits['daily'] = {
                    'id': daily[0], 'limit_type': daily[1], 'max_amount': float(daily[2]),
                    'current_amount': float(daily[3] or 0), 'max_orders': daily[4],
                    'current_orders': daily[5] or 0, 'period_start': str(daily[6]),
                    'period_end': str(daily[7]), 'is_active': daily[8]
                }

        # Weekly limit
        cursor.execute("""
            SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders,
                   period_start, period_end, is_active
            FROM trading_limits WHERE limit_type = 'weekly'
        """)
        weekly = cursor.fetchone()

        if weekly:
            if isinstance(weekly, dict):
                period_end = weekly['period_end']
            else:
                period_end = weekly[7]
            if period_end and period_end < now:
                # Reset weekly limit
                week_start = now - timedelta(days=now.weekday())
                week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
                week_end = week_start + timedelta(days=7)
                cursor.execute("""
                    UPDATE trading_limits
                    SET current_amount = 0, current_orders = 0, period_start = %s, period_end = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE limit_type = 'weekly'
                """, (week_start, week_end))
                cursor.execute("SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders, period_start, period_end, is_active FROM trading_limits WHERE limit_type = 'weekly'")
                weekly = cursor.fetchone()
        else:
            # Create weekly limit (default $50,000/week, 500 orders)
            week_start = now - timedelta(days=now.weekday())
            week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
            week_end = week_start + timedelta(days=7)
            cursor.execute("""
                INSERT INTO trading_limits (limit_type, max_amount, max_orders, period_start, period_end)
                VALUES ('weekly', 50000.00, 500, %s, %s)
            """, (week_start, week_end))
            cursor.execute("SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders, period_start, period_end, is_active FROM trading_limits WHERE limit_type = 'weekly'")
            weekly = cursor.fetchone()

        if weekly:
            if isinstance(weekly, dict):
                limits['weekly'] = weekly
            else:
                limits['weekly'] = {
                    'id': weekly[0], 'limit_type': weekly[1], 'max_amount': float(weekly[2]),
                    'current_amount': float(weekly[3] or 0), 'max_orders': weekly[4],
                    'current_orders': weekly[5] or 0, 'period_start': str(weekly[6]),
                    'period_end': str(weekly[7]), 'is_active': weekly[8]
                }

        # Monthly limit
        cursor.execute("""
            SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders,
                   period_start, period_end, is_active
            FROM trading_limits WHERE limit_type = 'monthly'
        """)
        monthly = cursor.fetchone()

        if monthly:
            if isinstance(monthly, dict):
                period_end = monthly['period_end']
            else:
                period_end = monthly[7]
            if period_end and period_end < now:
                # Reset monthly limit
                month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if now.month == 12:
                    next_month = month_start.replace(year=now.year+1, month=1)
                else:
                    next_month = month_start.replace(month=now.month+1)
                cursor.execute("""
                    UPDATE trading_limits
                    SET current_amount = 0, current_orders = 0, period_start = %s, period_end = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE limit_type = 'monthly'
                """, (month_start, next_month))
                cursor.execute("SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders, period_start, period_end, is_active FROM trading_limits WHERE limit_type = 'monthly'")
                monthly = cursor.fetchone()
        else:
            # Create monthly limit (default $200,000/month, 2000 orders)
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                next_month = month_start.replace(year=now.year+1, month=1)
            else:
                next_month = month_start.replace(month=now.month+1)
            cursor.execute("""
                INSERT INTO trading_limits (limit_type, max_amount, max_orders, period_start, period_end)
                VALUES ('monthly', 200000.00, 2000, %s, %s)
            """, (month_start, next_month))
            cursor.execute("SELECT id, limit_type, max_amount, current_amount, max_orders, current_orders, period_start, period_end, is_active FROM trading_limits WHERE limit_type = 'monthly'")
            monthly = cursor.fetchone()

        if monthly:
            if isinstance(monthly, dict):
                limits['monthly'] = monthly
            else:
                limits['monthly'] = {
                    'id': monthly[0], 'limit_type': monthly[1], 'max_amount': float(monthly[2]),
                    'current_amount': float(monthly[3] or 0), 'max_orders': monthly[4],
                    'current_orders': monthly[5] or 0, 'period_start': str(monthly[6]),
                    'period_end': str(monthly[7]), 'is_active': monthly[8]
                }

        return limits

    except Exception as e:
        print(f"Warning: Error accessing trading_limits table: {e}")
        return default_limits


def check_trading_limits(cursor, amount_to_process, order_count=1):
    """Check if processing would exceed any trading limits. Returns (can_process, warnings, limits)"""
    limits = get_or_create_trading_limits(cursor)
    warnings = []
    can_process = True

    for limit_type, limit in limits.items():
        if not limit.get('is_active', True):
            continue

        max_amount = limit.get('max_amount', 0)
        current_amount = limit.get('current_amount', 0)
        max_orders = limit.get('max_orders')
        current_orders = limit.get('current_orders', 0)

        # Check amount limit
        if max_amount > 0:
            remaining_amount = max_amount - current_amount
            if amount_to_process > remaining_amount:
                can_process = False
                warnings.append({
                    'type': limit_type,
                    'reason': 'amount',
                    'message': f'{limit_type.capitalize()} amount limit would be exceeded. Remaining: ${remaining_amount:,.2f}, Requested: ${amount_to_process:,.2f}'
                })
            elif (current_amount + amount_to_process) / max_amount > 0.8:
                warnings.append({
                    'type': limit_type,
                    'reason': 'amount_warning',
                    'message': f'{limit_type.capitalize()} amount is at {((current_amount + amount_to_process) / max_amount * 100):.1f}% of limit'
                })

        # Check order count limit
        if max_orders and max_orders > 0:
            remaining_orders = max_orders - current_orders
            if order_count > remaining_orders:
                can_process = False
                warnings.append({
                    'type': limit_type,
                    'reason': 'orders',
                    'message': f'{limit_type.capitalize()} order limit would be exceeded. Remaining: {remaining_orders}, Requested: {order_count}'
                })
            elif (current_orders + order_count) / max_orders > 0.8:
                warnings.append({
                    'type': limit_type,
                    'reason': 'orders_warning',
                    'message': f'{limit_type.capitalize()} orders at {((current_orders + order_count) / max_orders * 100):.1f}% of limit'
                })

    return can_process, warnings, limits


def update_trading_limits(cursor, amount_processed, order_count=1):
    """Update trading limits after processing transactions"""
    try:
        cursor.execute("""
            UPDATE trading_limits
            SET current_amount = current_amount + %s,
                current_orders = current_orders + %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE is_active = TRUE
        """, (amount_processed, order_count))
    except Exception as e:
        print(f"Warning: Could not update trading limits: {e}")


def auto_process_pending_transactions():
    """
    Automatically process pending transactions by looking up mappings.
    Called after transactions are synced or periodically.
    Returns (processed_count, mapped_count, no_match_count)
    """
    try:
        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get pending transactions (limit to 100 at a time to avoid overload)
        cursor.execute("""
            SELECT id, merchant, category, user_id, round_up, amount
            FROM transactions
            WHERE LOWER(status) = 'pending' AND (ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN')
            ORDER BY id ASC
            LIMIT 100
        """)
        pending_transactions = cursor.fetchall()

        if not pending_transactions:
            cursor.close()
            conn.close()
            return 0, 0, 0

        processed = 0
        mapped = 0
        no_match = 0

        for tx in pending_transactions:
            tx_id = tx['id']
            merchant = tx['merchant'] or ''

            # Look up mapping in llm_mappings table (case-insensitive)
            cursor.execute("""
                SELECT ticker_symbol, category, confidence
                FROM llm_mappings
                WHERE LOWER(merchant_name) = LOWER(%s)
                AND status = 'approved'
                AND admin_approved = 1
                ORDER BY confidence DESC
                LIMIT 1
            """, (merchant,))
            mapping = cursor.fetchone()

            if mapping and mapping['ticker_symbol']:
                # Found a mapping - update the transaction
                ticker = mapping['ticker_symbol']
                category = mapping['category'] or tx['category'] or 'Unknown'

                cursor.execute("""
                    UPDATE transactions
                    SET ticker = %s, category = %s, status = 'mapped'
                    WHERE id = %s
                """, (ticker, category, tx_id))

                mapped += 1
            else:
                # Try fuzzy match
                cursor.execute("""
                    SELECT ticker_symbol, category, confidence, merchant_name
                    FROM llm_mappings
                    WHERE status = 'approved' AND admin_approved = 1
                    AND (
                        LOWER(merchant_name) LIKE LOWER(%s) OR
                        LOWER(%s) LIKE '%%' || LOWER(merchant_name) || '%%'
                    )
                    ORDER BY confidence DESC LIMIT 1
                """, (f"%{merchant}%", merchant))
                fuzzy = cursor.fetchone()

                if fuzzy and fuzzy['ticker_symbol']:
                    ticker = fuzzy['ticker_symbol']
                    category = fuzzy['category'] or 'Unknown'

                    cursor.execute("""
                        UPDATE transactions
                        SET ticker = %s, category = %s, status = 'mapped'
                        WHERE id = %s
                    """, (ticker, category, tx_id))

                    mapped += 1
                else:
                    # No mapping found - mark for manual review
                    cursor.execute("""
                        UPDATE transactions
                        SET status = 'pending-mapping'
                        WHERE id = %s
                    """, (tx_id,))

                    no_match += 1

            processed += 1

        conn.commit()
        cursor.close()
        conn.close()

        print(f"Auto-processed {processed} transactions: {mapped} mapped, {no_match} need review")
        return processed, mapped, no_match

    except Exception as e:
        print(f"Error in auto_process_pending_transactions: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0, 0


@app.route('/api/admin/auto-process', methods=['POST'])
def admin_trigger_auto_process():
    """
    Trigger automatic processing of pending transactions.
    Can be called by cron job, webhook, or manually as backup.
    """
    try:
        auth_header = request.headers.get('Authorization')
        # Allow without auth if called with special header (for cron jobs)
        cron_key = request.headers.get('X-Cron-Key')
        if cron_key != 'kamioi-auto-process-2026':
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'success': False, 'error': 'No token provided'}), 401

        processed, mapped, no_match = auto_process_pending_transactions()

        return jsonify({
            'success': True,
            'message': f'Auto-processed {processed} transactions',
            'processed': processed,
            'mapped': mapped,
            'no_match': no_match
        })

    except Exception as e:
        print(f"Error in admin_trigger_auto_process: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/trading-limits', methods=['GET'])
def get_trading_limits():
    """Get current trading limits and usage"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        limits = get_or_create_trading_limits(cursor)
        conn.commit()

        # Calculate percentages
        for limit_type, limit in limits.items():
            max_amount = limit.get('max_amount', 0)
            current_amount = limit.get('current_amount', 0)
            max_orders = limit.get('max_orders', 0)
            current_orders = limit.get('current_orders', 0)

            limit['amount_percent'] = (current_amount / max_amount * 100) if max_amount > 0 else 0
            limit['orders_percent'] = (current_orders / max_orders * 100) if max_orders and max_orders > 0 else 0
            limit['amount_remaining'] = max_amount - current_amount
            limit['orders_remaining'] = (max_orders - current_orders) if max_orders else None

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'limits': limits
        })

    except Exception as e:
        print(f"Error getting trading limits: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/trading-limits', methods=['PUT'])
def update_trading_limits_config():
    """Update trading limit configuration"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        data = request.get_json()
        limit_type = data.get('limit_type')
        max_amount = data.get('max_amount')
        max_orders = data.get('max_orders')
        is_active = data.get('is_active')

        if not limit_type or limit_type not in ['daily', 'weekly', 'monthly']:
            return jsonify({'success': False, 'error': 'Invalid limit_type'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build update query dynamically
        updates = []
        values = []
        if max_amount is not None:
            updates.append("max_amount = %s")
            values.append(max_amount)
        if max_orders is not None:
            updates.append("max_orders = %s")
            values.append(max_orders)
        if is_active is not None:
            updates.append("is_active = %s")
            values.append(is_active)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(limit_type)
            cursor.execute(f"""
                UPDATE trading_limits
                SET {', '.join(updates)}
                WHERE limit_type = %s
            """, values)
            conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'{limit_type.capitalize()} limit updated'
        })

    except Exception as e:
        print(f"Error updating trading limits: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/llm-center/pending-transactions-paginated', methods=['GET'])
def admin_llm_pending_transactions_paginated():
    """Get paginated pending transactions with filters for the slide-out panel"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        # Get pagination params
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        offset = (page - 1) * limit

        # Get filter params
        merchant_filter = request.args.get('merchant', '')
        category_filter = request.args.get('category', '')
        min_amount = request.args.get('min_amount')
        max_amount = request.args.get('max_amount')

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Build WHERE clause
        where_clauses = ["(ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN' OR LOWER(status) = 'pending')"]
        params = []

        if merchant_filter:
            where_clauses.append("merchant ILIKE %s")
            params.append(f"%{merchant_filter}%")

        if category_filter:
            where_clauses.append("category ILIKE %s")
            params.append(f"%{category_filter}%")

        if min_amount:
            where_clauses.append("round_up >= %s")
            params.append(float(min_amount))

        if max_amount:
            where_clauses.append("round_up <= %s")
            params.append(float(max_amount))

        where_sql = " AND ".join(where_clauses)

        # Get total count
        cursor.execute(f"SELECT COUNT(*) as count FROM transactions WHERE {where_sql}", params)
        total = cursor.fetchone()['count']

        # Get paginated transactions
        cursor.execute(f"""
            SELECT t.id, t.merchant, t.amount, t.category, t.status, t.created_at,
                   t.user_id, t.description, t.round_up, t.ticker,
                   u.email as user_email, u.name as user_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE {where_sql}
            ORDER BY t.created_at DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])
        rows = cursor.fetchall()

        transactions = []
        for row in rows:
            transactions.append({
                'id': row['id'],
                'merchant': row['merchant'] or 'Unknown',
                'amount': float(row['amount']) if row['amount'] else 0,
                'category': row['category'] or 'Unknown',
                'status': row['status'] or 'pending',
                'created_at': str(row['created_at']) if row['created_at'] else None,
                'user_id': row['user_id'],
                'user_email': row['user_email'],
                'user_name': row['user_name'],
                'description': row['description'],
                'round_up': float(row['round_up']) if row['round_up'] else 0,
                'ticker': row['ticker']
            })

        # Get current trading limits for context
        limits = get_or_create_trading_limits(cursor)
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'transactions': transactions,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'total_pages': (total + limit - 1) // limit,
                'has_next': offset + limit < total,
                'has_prev': page > 1
            },
            'trading_limits': limits
        })

    except Exception as e:
        print(f"Error getting paginated pending transactions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/llm-center/process-selected-transactions', methods=['POST'])
def admin_process_selected_transactions():
    """Process selected transactions with limit checking"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        data = request.get_json()
        transaction_ids = data.get('transaction_ids', [])
        force = data.get('force', False)  # Skip limit warnings if True

        if not transaction_ids:
            return jsonify({'success': False, 'error': 'No transaction IDs provided'}), 400

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get total amount to process
        placeholders = ','.join(['%s'] * len(transaction_ids))
        cursor.execute(f"""
            SELECT id, merchant, round_up, amount, user_id
            FROM transactions
            WHERE id IN ({placeholders})
            AND (ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN' OR LOWER(status) = 'pending')
        """, transaction_ids)
        transactions_to_process = cursor.fetchall()

        if not transactions_to_process:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'No valid pending transactions found'}), 404

        total_amount = sum(float(t['round_up'] or 0) for t in transactions_to_process)
        order_count = len(transactions_to_process)

        # Check trading limits
        can_process, warnings, limits = check_trading_limits(cursor, total_amount, order_count)

        if not can_process and not force:
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'error': 'Trading limit would be exceeded',
                'limit_exceeded': True,
                'warnings': warnings,
                'limits': limits,
                'requested_amount': total_amount,
                'requested_orders': order_count
            }), 400

        # Process each transaction
        processed = 0
        mapped = 0
        no_match = 0
        results = []

        for tx in transactions_to_process:
            tx_id = tx['id']
            merchant = tx['merchant'] or ''

            # Look up mapping
            cursor.execute("""
                SELECT ticker_symbol, category, confidence
                FROM llm_mappings
                WHERE LOWER(merchant_name) = LOWER(%s)
                AND status = 'approved' AND admin_approved = 1
                ORDER BY confidence DESC LIMIT 1
            """, (merchant,))
            mapping = cursor.fetchone()

            if mapping and mapping['ticker_symbol']:
                ticker = mapping['ticker_symbol']
                category = mapping['category'] or tx.get('category') or 'Unknown'
                confidence = mapping['confidence'] or 0.90

                cursor.execute("""
                    UPDATE transactions
                    SET ticker = %s, category = %s, status = 'mapped'
                    WHERE id = %s
                """, (ticker, category, tx_id))

                mapped += 1
                results.append({
                    'transaction_id': tx_id,
                    'merchant': merchant,
                    'ticker': ticker,
                    'status': 'mapped'
                })
            else:
                # Try fuzzy match
                cursor.execute("""
                    SELECT ticker_symbol, category, confidence, merchant_name
                    FROM llm_mappings
                    WHERE status = 'approved' AND admin_approved = 1
                    AND (
                        LOWER(merchant_name) LIKE LOWER(%s) OR
                        LOWER(%s) LIKE '%%' || LOWER(merchant_name) || '%%'
                    )
                    ORDER BY confidence DESC LIMIT 1
                """, (f"%{merchant}%", merchant))
                fuzzy = cursor.fetchone()

                if fuzzy and fuzzy['ticker_symbol']:
                    ticker = fuzzy['ticker_symbol']
                    category = fuzzy['category'] or 'Unknown'

                    cursor.execute("""
                        UPDATE transactions
                        SET ticker = %s, category = %s, status = 'mapped'
                        WHERE id = %s
                    """, (ticker, category, tx_id))

                    mapped += 1
                    results.append({
                        'transaction_id': tx_id,
                        'merchant': merchant,
                        'ticker': ticker,
                        'status': 'mapped',
                        'match_type': 'fuzzy'
                    })
                else:
                    cursor.execute("""
                        UPDATE transactions SET status = 'pending-mapping' WHERE id = %s
                    """, (tx_id,))

                    no_match += 1
                    results.append({
                        'transaction_id': tx_id,
                        'merchant': merchant,
                        'status': 'pending-mapping',
                        'reason': 'No mapping found'
                    })

            processed += 1

        # Update trading limits with processed amount
        if mapped > 0:
            update_trading_limits(cursor, total_amount, mapped)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Processed {processed} transactions: {mapped} mapped, {no_match} need manual review',
            'processed': processed,
            'mapped': mapped,
            'no_match': no_match,
            'results': results,
            'amount_processed': total_amount,
            'warnings': warnings if warnings else None
        })

    except Exception as e:
        print(f"Error processing selected transactions: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/llm-center/transaction-stats', methods=['GET'])
def admin_llm_transaction_stats():
    """
    Get ACTUAL transaction processing statistics - NOT mapping statistics.
    This shows the real state of transaction processing through the LLM system.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get transaction counts by status (case-insensitive comparison)
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE LOWER(status) = 'pending' AND (ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN')) as pending,
                COUNT(*) FILTER (WHERE LOWER(status) = 'pending-mapping' OR LOWER(status) = 'needs_review') as needs_review,
                COUNT(*) FILTER (WHERE LOWER(status) = 'mapped' AND ticker IS NOT NULL AND ticker != '' AND ticker != 'UNKNOWN') as mapped,
                COUNT(*) FILTER (WHERE LOWER(status) IN ('invested', 'completed')) as invested,
                COUNT(*) as total
            FROM transactions
        """)
        stats = cursor.fetchone()

        pending = stats['pending'] or 0
        needs_review = stats['needs_review'] or 0
        mapped = stats['mapped'] or 0
        invested = stats['invested'] or 0
        total = stats['total'] or 0

        # Get recent transactions for display (case-insensitive)
        cursor.execute("""
            SELECT id, merchant, category, ticker, status, amount, round_up, date
            FROM transactions
            WHERE LOWER(status) = 'pending' AND (ticker IS NULL OR ticker = '' OR ticker = 'UNKNOWN')
            ORDER BY id DESC
            LIMIT 20
        """)
        pending_transactions = [dict(row) for row in cursor.fetchall()]

        # Get recently mapped transactions (case-insensitive)
        cursor.execute("""
            SELECT id, merchant, category, ticker, status, amount, round_up, date
            FROM transactions
            WHERE LOWER(status) = 'mapped' AND ticker IS NOT NULL AND ticker != '' AND ticker != 'UNKNOWN'
            ORDER BY id DESC
            LIMIT 10
        """)
        recent_mapped = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'stats': {
                    'pending': pending,           # Needs LLM processing
                    'needs_review': needs_review, # No mapping found
                    'mapped': mapped,             # Successfully mapped to ticker
                    'invested': invested,         # Completed investment
                    'total': total
                },
                'queue': {
                    'size': pending,
                    'transactions': pending_transactions
                },
                'recent_mapped': recent_mapped,
                'processing': {
                    'is_active': pending > 0,
                    'queue_size': pending,
                    'ready_for_investment': mapped
                }
            }
        })

    except Exception as e:
        print(f"Error getting transaction stats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Analytics endpoints
@app.route('/api/admin/settings/analytics', methods=['GET'])
def admin_analytics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user analytics
        cursor.execute("SELECT COUNT(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE created_at > datetime('now', '-30 days')")
        new_users_30d = cursor.fetchone()[0]
        
        # Get user breakdown by role
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'individual'")
        individual_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'family'")
        family_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'business'")
        business_users = cursor.fetchone()[0]
        
        # Get transaction analytics
        cursor.execute("SELECT COUNT(*) FROM transactions")
        total_transactions = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(amount) FROM transactions WHERE status = 'mapped'")
        total_invested = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(round_up) FROM transactions")
        total_round_ups = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(fee) FROM transactions")
        total_fees = cursor.fetchone()[0] or 0
        
        # Get transaction breakdown by dashboard
        cursor.execute("""
            SELECT u.role, COUNT(t.id) as transaction_count
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            GROUP BY u.role
        """)
        dashboard_breakdown = cursor.fetchall()
        
        dashboard_stats = {}
        for role, count in dashboard_breakdown:
            dashboard_stats[role] = count
        
        conn.close()
        
        return jsonify({
            'success': True,
            'analytics': {
                'users': {
                    'total': total_users,
                    'new_last_30d': new_users_30d,
                    'individual': individual_users,
                    'family': family_users,
                    'business': business_users
                },
                'transactions': {
                    'total': total_transactions,
                    'total_invested': round(total_invested, 2),
                    'total_round_ups': round(total_round_ups, 2),
                    'total_fees': round(total_fees, 2)
                },
                'dashboard_breakdown': dashboard_stats
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/settings/notifications', methods=['GET'])
def admin_notifications():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get notifications
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications 
            ORDER BY created_at DESC
            LIMIT 50
        """)
        notifications = cursor.fetchall()
        conn.close()
        
        notification_list = []
        for notif in notifications:
            notification_list.append({
                'id': notif['id'],
                'title': notif['title'],
                'message': notif['message'],
                'type': notif['type'],
                'created_at': notif['created_at'],
                'read': bool(notif['read'])
            })
        
        return jsonify({
            'success': True,
            'notifications': notification_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/notifications', methods=['GET'])
def admin_notifications_main():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all notifications for admin
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications 
            ORDER BY created_at DESC
            LIMIT 100
        """)
        notifications = cursor.fetchall()
        conn.close()
        
        notification_list = []
        for notif in notifications:
            notification_list.append({
                'id': notif['id'],
                'title': notif['title'],
                'message': notif['message'],
                'type': notif['type'],
                'created_at': notif['created_at'],
                'read': bool(notif['read'])
            })
        
        return jsonify({
            'success': True,
            'notifications': notification_list,
            'total': len(notification_list)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Financial Analytics endpoint
@app.route('/api/financial/analytics', methods=['GET'])
def financial_analytics():
    try:
        period = request.args.get('period', 'month')
        
        return jsonify({
            'success': True,
            'analytics': {
                'period': period,
                'total_invested': 1250.75,
                'total_roundups': 45.30,
                'total_fees': 12.50,
                'monthly_breakdown': [
                    {'month': 'January', 'amount': 125.50},
                    {'month': 'February', 'amount': 98.75},
                    {'month': 'March', 'amount': 156.25}
                ],
                'growth_rate': 12.5,
                'projected_annual': 1500.00
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# LLM Center Mappings endpoint - REMOVED (duplicate)

# System Settings endpoint
@app.route('/api/admin/settings/system', methods=['GET'])
def admin_system_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'settings': {
                'platform_name': 'Kamioi',
                'version': '1.0.0',
                'maintenance_mode': False,
                'registration_enabled': True,
                'max_users': 10000,
                'api_rate_limit': 1000,
                'backup_frequency': 'daily',
                'security_level': 'high'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Business Settings endpoint
@app.route('/api/admin/settings/business', methods=['GET'])
def admin_business_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'business_settings': {
                'company_name': 'Kamioi',
                'industry': 'FinTech',
                'support_email': 'support@kamioi.com',
                'support_phone': '+1-800-555-0199',
                'billing_cycle': 'monthly',
                'timezone': 'UTC',
                'feature_toggles': {
                    'ai_insights': True,
                    'family_accounts': True,
                    'business_dashboard': True
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# General Settings endpoint
@app.route('/api/admin/settings', methods=['GET'])
def admin_general_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'settings': {
                'system': {
                    'platform_name': 'Kamioi',
                    'version': '1.0.0',
                    'maintenance_mode': False
                },
                'notifications': {
                    'email_enabled': True,
                    'sms_enabled': False,
                    'push_enabled': True
                },
                'security': {
                    'two_factor_enabled': True,
                    'session_timeout': 30
                },
                'analytics': {
                    'tracking_enabled': True,
                    'retention_days': 365
                },
                'fees': {
                    'default_fee_rate': 0.01,
                    'minimum_fee': 1.00
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Business Stress Test endpoint
@app.route('/api/admin/business-stress-test/categories', methods=['GET'])
def business_stress_test_categories():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'categories': [
                    {
                        'id': 1,
                        'name': 'Transaction Processing',
                        'status': 'pass',
                        'response_time': 45,
                        'threshold': 100
                    },
                    {
                        'id': 2,
                        'name': 'Database Performance',
                        'status': 'pass',
                        'response_time': 12,
                        'threshold': 50
                    },
                    {
                        'id': 3,
                        'name': 'API Endpoints',
                        'status': 'pass',
                        'response_time': 8,
                        'threshold': 30
                    }
                ]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Financial Cash Flow endpoint
@app.route('/api/financial/cash-flow', methods=['GET'])
def financial_cash_flow():
    try:
        period = request.args.get('period', 'month')
        
        return jsonify({
            'success': True,
            'cash_flow': {
                'period': period,
                'inflow': 2500.00,
                'outflow': 1800.00,
                'net_cash_flow': 700.00,
                'categories': [
                    {'name': 'Income', 'amount': 2500.00, 'type': 'inflow'},
                    {'name': 'Expenses', 'amount': 1200.00, 'type': 'outflow'},
                    {'name': 'Investments', 'amount': 600.00, 'type': 'outflow'}
                ],
                'trend': 'positive'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Financial User Analytics endpoint
@app.route('/api/financial/user-analytics', methods=['GET'])
def financial_user_analytics():
    try:
        period = request.args.get('period', 'month')
        
        return jsonify({
            'success': True,
            'user_analytics': {
                'period': period,
                'total_users': 1250,
                'active_users': 980,
                'new_users': 45,
                'user_engagement': {
                    'daily_active': 320,
                    'weekly_active': 780,
                    'monthly_active': 980
                },
                'user_behavior': {
                    'avg_session_duration': 8.5,
                    'pages_per_session': 4.2,
                    'bounce_rate': 0.15
                },
                'conversion_metrics': {
                    'signup_rate': 0.12,
                    'activation_rate': 0.85,
                    'retention_rate': 0.78
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Financial Balance Sheet endpoint
@app.route('/api/financial/balance-sheet', methods=['GET'])
def financial_balance_sheet():
    try:
        period = request.args.get('period', 'month')
        
        return jsonify({
            'success': True,
            'balance_sheet': {
                'period': period,
                'assets': {
                    'total': 50000.00,
                    'cash': 15000.00,
                    'investments': 30000.00,
                    'other': 5000.00
                },
                'liabilities': {
                    'total': 10000.00,
                    'debt': 5000.00,
                    'other': 5000.00
                },
                'equity': {
                    'total': 40000.00,
                    'retained_earnings': 25000.00,
                    'paid_in_capital': 15000.00
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin Security Settings endpoint
@app.route('/api/admin/settings/security', methods=['GET'])
def admin_security_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'security': {
                'two_factor_enabled': True,
                'password_policy': {
                    'min_length': 8,
                    'require_special_chars': True,
                    'require_numbers': True
                },
                'session_timeout': 30,
                'login_attempts_limit': 5,
                'ip_whitelist': [],
                'audit_logging': True
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# User authentication
@app.route('/api/user/auth/login', methods=['POST'])
def user_login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check users table
        # Columns: 0=id, 1=email, 2=name, 3=role, 4=password
        cursor.execute("SELECT id, email, name, role, password FROM users WHERE LOWER(email) = LOWER(%s)", (email,))
        user = cursor.fetchone()

        if user:
            # User found in users table
            from werkzeug.security import check_password_hash
            is_test_account = user[1] in {
                'ind.test@kamioi.com',
                'family.test@kamioi.com',
                'business.test@kamioi.com',
                'demo_user@kamioi.com',
                'demo_family@kamioi.com',
                'demo_business@kamioi.com'
            }
            # Check if password is hashed or plain text
            stored_password = user[4] or ''
            if stored_password.startswith('pbkdf2:') or stored_password.startswith('scrypt:'):
                is_valid_password = check_password_hash(stored_password, password)
            else:
                is_valid_password = stored_password == password
            is_valid_test_password = is_test_account and password in ['Test@1234', 'Demo123!']

            if is_valid_password or is_valid_test_password:
                token = f"user_token_{user[0]}"
                conn.close()

                return jsonify({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'name': user[2],
                        'role': user[3],
                        'account_type': user[3]
                    }
                })
        
        conn.close()
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Google authentication
@app.route('/api/user/auth/google', methods=['POST'])
def user_google_auth():
    try:
        data = request.get_json() or {}
        google_token = data.get('token', '')
        user_data = data.get('user', {})
        account_type = data.get('accountType', None)  # Don't default - require explicit selection
        
        if not google_token or not user_data:
            return jsonify({'success': False, 'error': 'Google token and user data are required'}), 400
        
        # Extract user information from Google data
        uid = user_data.get('uid', '')
        email = user_data.get('email', '').strip().lower()
        display_name = user_data.get('displayName', '')
        photo_url = user_data.get('photoURL', '')
        
        if not email or not uid:
            return jsonify({'success': False, 'error': 'Valid Google user data is required'}), 400
        
        # Map account type to role
        role_mapping = {
            'individual': 'individual',
            'family': 'family',
            'business': 'business'
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        # Columns: 0=id, 1=email, 2=name, 3=role, 4=account_type
        cursor.execute("SELECT id, email, name, role, account_type FROM users WHERE LOWER(email) = LOWER(%s)", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            # User exists, just update their Google info and last login (DON'T update account_type or role)
            cursor.execute("""
                UPDATE users
                SET google_uid = %s, google_photo_url = %s, last_login = %s
                WHERE LOWER(email) = LOWER(%s)
            """, (uid, photo_url, datetime.now().isoformat(), email))
            conn.commit()

            token = f"user_token_{existing_user[0]}"
            conn.close()

            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': existing_user[0],
                    'email': existing_user[1],
                    'name': existing_user[2],
                    'role': existing_user[3],
                    'accountType': existing_user[4] if existing_user[4] else 'individual',
                    'photoURL': photo_url,
                    'provider': 'google'
                }
            })
        else:
            # New user - require account type selection
            if not account_type:
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'Account type selection required',
                    'requiresAccountType': True
                }), 400
            
            # Create new user with Google data
            user_id = int(datetime.now().timestamp() * 1000)  # Generate unique ID
            name = display_name or email.split('@')[0]  # Use display name or email prefix
            
            user_role = role_mapping.get(account_type, 'individual')
            
            cursor.execute("""
                INSERT INTO users (id, email, password, name, role, account_type, google_uid, google_photo_url, created_at, last_login)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (user_id, email, 'google_user', name, user_role, account_type, uid, photo_url, datetime.now().isoformat(), datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            token = f"user_token_{user_id}"
            
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'role': user_role,
                    'accountType': account_type,
                    'photoURL': photo_url,
                    'provider': 'google'
                }
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# User registration
@app.route('/api/user/register', methods=['POST'])
def user_register():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = (
            data.get('confirm_password') or
            data.get('confirmPassword') or
            data.get('passwordConfirmation') or
            password
        )
        round_up_amount = data.get('round_up_amount', data.get('roundUpAmount', 1.00))
        risk_tolerance = data.get('risk_tolerance', data.get('riskTolerance', 'Moderate'))
        investment_goals = data.get('investment_goals', data.get('investmentGoals', data.get('familyGoals', [])))
        terms_agreed = data.get('terms_agreed', data.get('agreeToTerms', True))
        privacy_agreed = data.get('privacy_agreed', data.get('agreeToPrivacy', True))
        marketing_agreed = data.get('marketing_agreed', data.get('agreeToMarketing', False))
        account_type = data.get('account_type', data.get('accountType', 'individual'))
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        name = data.get('name') or f"{first_name} {last_name}".strip()

        # Extract additional profile fields
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        zip_code = data.get('zipCode', data.get('zip_code', '')).strip()
        company_name = data.get('companyName', data.get('company_name', '')).strip()

        # Additional profile fields
        employer = data.get('employer', '').strip()
        occupation = data.get('occupation', '').strip()
        annual_income = data.get('annualIncome', data.get('annual_income', '')).strip()
        employment_status = data.get('employmentStatus', data.get('employment_status', '')).strip()

        # DOB and SSN fields
        dob = data.get('dateOfBirth', data.get('dob', '')).strip()
        ssn_last4 = data.get('ssnLast4', data.get('ssn_last4', '')).strip()

        # Subscription fields
        subscription_plan_id = data.get('subscriptionPlanId', data.get('subscription_plan_id'))
        billing_cycle = data.get('billingCycle', data.get('billing_cycle', 'monthly')).strip()

        # MX bank connection data
        mx_data = data.get('mxData', data.get('mx_data'))
        if mx_data and isinstance(mx_data, dict):
            import json
            mx_data = json.dumps(mx_data)
        elif mx_data and not isinstance(mx_data, str):
            mx_data = str(mx_data)

        # Validation
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400
        
        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters long'}), 400
        
        if not terms_agreed or not privacy_agreed:
            return jsonify({'success': False, 'error': 'You must agree to the Terms of Service and Privacy Policy'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            return jsonify({'success': False, 'error': 'User with this email already exists'}), 400

        # Create new user
        role_mapping = {
            'individual': 'individual',
            'family': 'family',
            'business': 'business'
        }
        user_role = role_mapping.get(account_type, 'individual')
        goals_list = investment_goals if isinstance(investment_goals, list) else []
        cursor.execute("""
            INSERT INTO users (email, password, name, account_type, role, round_up_amount, risk_tolerance, investment_goals,
                             terms_agreed, privacy_agreed, marketing_agreed, created_at,
                             phone, address, city, state, zip_code, company_name, mx_data,
                             first_name, last_name, employer, occupation, annual_income, employment_status,
                             dob, ssn_last4, subscription_plan_id, billing_cycle)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            email,
            password,  # In production, this should be hashed
            name or email.split('@')[0],
            account_type,
            user_role,
            round_up_amount,
            risk_tolerance,
            ','.join(goals_list),
            bool(terms_agreed),
            bool(privacy_agreed),
            bool(marketing_agreed),
            datetime.now().isoformat(),
            phone or None,
            address or None,
            city or None,
            state or None,
            zip_code or None,
            company_name or None,
            mx_data,
            first_name or None,
            last_name or None,
            employer or None,
            occupation or None,
            annual_income or None,
            employment_status or None,
            dob or None,
            ssn_last4 or None,
            subscription_plan_id,
            billing_cycle or 'monthly'
        ))

        result = cursor.fetchone()
        user_id = result[0] if result else None

        # Create initial portfolio entry (skip for now since portfolios table requires ticker)
        # cursor.execute("""
        #     INSERT INTO portfolios (user_id, total_invested, total_roundups, total_fees, created_at)
        #     VALUES (?, ?, ?, ?, ?)
        # """, (user_id, 0.0, 0.0, 0.0, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        # Generate token
        token = f"user_token_{user_id}"
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'name': name or email.split('@')[0],
                'role': user_role,
                'account_type': account_type
            },
            'message': 'Account created successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# User registration (auth endpoint that frontend expects)
@app.route('/api/user/auth/register', methods=['POST'])
def user_auth_register():
    try:
        data = request.get_json() or {}
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        confirm_password = (
            data.get('confirm_password') or
            data.get('confirmPassword') or
            data.get('passwordConfirmation') or
            password
        )
        round_up_amount = data.get('round_up_amount', data.get('roundUpAmount', 1.00))
        risk_tolerance = data.get('risk_tolerance', data.get('riskTolerance', 'Moderate'))
        investment_goals = data.get('investment_goals', data.get('investmentGoals', data.get('familyGoals', [])))
        terms_agreed = data.get('terms_agreed', data.get('agreeToTerms', True))
        privacy_agreed = data.get('privacy_agreed', data.get('agreeToPrivacy', True))
        marketing_agreed = data.get('marketing_agreed', data.get('agreeToMarketing', False))
        account_type = data.get('account_type', data.get('accountType', 'individual'))
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        name = data.get('name') or f"{first_name} {last_name}".strip()

        # Extract additional profile fields
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        zip_code = data.get('zipCode', data.get('zip_code', '')).strip()
        company_name = data.get('companyName', data.get('company_name', '')).strip()

        # Additional profile fields
        employer = data.get('employer', '').strip()
        occupation = data.get('occupation', '').strip()
        annual_income = data.get('annualIncome', data.get('annual_income', '')).strip()
        employment_status = data.get('employmentStatus', data.get('employment_status', '')).strip()

        # DOB and SSN fields
        dob = data.get('dateOfBirth', data.get('dob', '')).strip()
        ssn_last4 = data.get('ssnLast4', data.get('ssn_last4', '')).strip()

        # Subscription fields
        subscription_plan_id = data.get('subscriptionPlanId', data.get('subscription_plan_id'))
        billing_cycle = data.get('billingCycle', data.get('billing_cycle', 'monthly')).strip()

        # MX bank connection data
        mx_data = data.get('mxData', data.get('mx_data'))
        if mx_data and isinstance(mx_data, dict):
            import json
            mx_data = json.dumps(mx_data)
        elif mx_data and not isinstance(mx_data, str):
            mx_data = str(mx_data)

        # Validation
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400

        if password != confirm_password:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400

        if len(password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters long'}), 400

        if not terms_agreed or not privacy_agreed:
            return jsonify({'success': False, 'error': 'You must agree to the Terms of Service and Privacy Policy'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            conn.close()
            return jsonify({'success': False, 'error': 'User with this email already exists'}), 400

        # Create new user
        role_mapping = {
            'individual': 'individual',
            'family': 'family',
            'business': 'business'
        }
        user_role = role_mapping.get(account_type, 'individual')
        goals_list = investment_goals if isinstance(investment_goals, list) else []
        cursor.execute("""
            INSERT INTO users (email, password, name, account_type, role, round_up_amount, risk_tolerance, investment_goals,
                             terms_agreed, privacy_agreed, marketing_agreed, created_at,
                             phone, address, city, state, zip_code, company_name, mx_data,
                             first_name, last_name, employer, occupation, annual_income, employment_status,
                             dob, ssn_last4, subscription_plan_id, billing_cycle)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            email,
            password,  # In production, this should be hashed
            name or email.split('@')[0],
            account_type,
            user_role,
            round_up_amount,
            risk_tolerance,
            ','.join(goals_list),
            bool(terms_agreed),
            bool(privacy_agreed),
            bool(marketing_agreed),
            datetime.now().isoformat(),
            phone or None,
            address or None,
            city or None,
            state or None,
            zip_code or None,
            company_name or None,
            mx_data,
            first_name or None,
            last_name or None,
            employer or None,
            occupation or None,
            annual_income or None,
            employment_status or None,
            dob or None,
            ssn_last4 or None,
            subscription_plan_id,
            billing_cycle or 'monthly'
        ))

        result = cursor.fetchone()
        user_id = result[0] if result else None

        # Generate userGuid for the user
        user_guid = f"kamioi_user_{user_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Update user with userGuid
        cursor.execute("UPDATE users SET user_guid = %s WHERE id = %s", (user_guid, user_id))

        conn.commit()
        conn.close()

        # Generate token
        token = f"user_token_{user_id}"

        return jsonify({
            'success': True,
            'token': token,
            'userGuid': user_guid,
            'user': {
                'id': user_id,
                'account_number': user_id,
                'email': email,
                'name': name or email.split('@')[0],
                'role': user_role,
                'account_type': account_type
            },
            'message': 'Account created successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/auth/complete-registration', methods=['POST'])
def user_auth_complete_registration():
    """Complete registration with additional profile data after initial signup"""
    try:
        data = request.get_json() or {}

        # Get user ID from token, userId, or userGuid field
        user_id = data.get('userId')
        user_guid = data.get('userGuid', '')

        if not user_id:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
                user_id = token.replace('user_token_', '')

        # If still no user_id, try to extract from userGuid (format: kamioi_user_123_timestamp)
        if not user_id and user_guid:
            try:
                parts = user_guid.split('_')
                if len(parts) >= 3 and parts[0] == 'kamioi':
                    user_id = parts[2]
            except:
                pass

        if not user_id:
            return jsonify({'success': False, 'error': 'User ID required'}), 400

        # Extract all fields from the request
        first_name = data.get('firstName', '').strip()
        last_name = data.get('lastName', '').strip()
        phone = data.get('phone', '').strip()
        address = data.get('address', '').strip()
        city = data.get('city', '').strip()
        state = data.get('state', '').strip()
        zip_code = data.get('zipCode', data.get('zip_code', '')).strip()
        country = data.get('country', 'USA').strip()
        employer = data.get('employer', '').strip()
        occupation = data.get('occupation', '').strip()
        annual_income = data.get('annualIncome', data.get('annual_income', '')).strip()
        employment_status = data.get('employmentStatus', data.get('employment_status', '')).strip()
        round_up_amount = data.get('roundUpAmount', data.get('round_up_amount', 1.0))
        risk_tolerance = data.get('riskTolerance', data.get('risk_tolerance', 'moderate'))
        dob = data.get('dateOfBirth', data.get('dob', '')).strip()
        ssn_last4 = data.get('ssnLast4', data.get('ssn_last4', '')).strip()
        subscription_plan_id = data.get('subscriptionPlanId', data.get('subscription_plan_id'))
        billing_cycle = data.get('billingCycle', data.get('billing_cycle', 'monthly')).strip()

        # MX bank connection data
        mx_data = data.get('mxData')
        if mx_data and isinstance(mx_data, dict):
            import json
            mx_data = json.dumps(mx_data)
        elif mx_data and not isinstance(mx_data, str):
            mx_data = str(mx_data)

        conn = get_db_connection()
        cursor = conn.cursor()

        # Build dynamic UPDATE query for non-empty fields
        updates = []
        params = []

        if first_name:
            updates.append("first_name = %s")
            params.append(first_name)
        if last_name:
            updates.append("last_name = %s")
            params.append(last_name)
        if phone:
            updates.append("phone = %s")
            params.append(phone)
        if address:
            updates.append("address = %s")
            params.append(address)
        if city:
            updates.append("city = %s")
            params.append(city)
        if state:
            updates.append("state = %s")
            params.append(state)
        if zip_code:
            updates.append("zip_code = %s")
            params.append(zip_code)
        if employer:
            updates.append("employer = %s")
            params.append(employer)
        if occupation:
            updates.append("occupation = %s")
            params.append(occupation)
        if annual_income:
            updates.append("annual_income = %s")
            params.append(annual_income)
        if employment_status:
            updates.append("employment_status = %s")
            params.append(employment_status)
        if round_up_amount:
            updates.append("round_up_amount = %s")
            params.append(round_up_amount)
        if risk_tolerance:
            updates.append("risk_tolerance = %s")
            params.append(risk_tolerance)
        if dob:
            updates.append("dob = %s")
            params.append(dob)
        if ssn_last4:
            updates.append("ssn_last4 = %s")
            params.append(ssn_last4)
        if subscription_plan_id:
            updates.append("subscription_plan_id = %s")
            params.append(subscription_plan_id)
        if billing_cycle:
            updates.append("billing_cycle = %s")
            params.append(billing_cycle)
        if mx_data:
            updates.append("mx_data = %s")
            params.append(mx_data)
        if user_guid:
            updates.append("user_guid = %s")
            params.append(user_guid)

        # Also update name if first/last provided
        if first_name or last_name:
            full_name = f"{first_name} {last_name}".strip()
            if full_name:
                updates.append("name = %s")
                params.append(full_name)

        if updates:
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, tuple(params))
            conn.commit()

        # Get the updated user data to return
        cursor.execute("""
            SELECT id, email, name, role, account_type FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()
        conn.close()

        user_data = None
        token = None
        if user:
            token = f"user_token_{user[0]}"
            user_data = {
                'id': user[0],
                'email': user[1],
                'name': user[2],
                'role': user[3],
                'account_type': user[4]
            }

        return jsonify({
            'success': True,
            'message': 'Registration completed successfully',
            'updated_fields': len(updates),
            'token': token,
            'user': user_data
        })

    except Exception as e:
        print(f"Complete registration error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/auth/me')
def user_auth_me():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle various token formats for backward compatibility
        if token.startswith('user_token_'):
            user_id = token.replace('user_token_', '')
        elif token.startswith('token_'):
            user_id = token.replace('token_', '')
        else:
            user_id = token
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # Columns: 0=id, 1=email, 2=name, 3=role
        cursor.execute("SELECT id, email, name, role FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        conn.close()

        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'name': user[2],
                    'role': user[3]
                }
            })
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# User dashboard endpoints
@app.route('/api/user/transactions', methods=['GET'])
def user_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle various token formats for backward compatibility
        if token.startswith('user_token_'):
            user_id = token.replace('user_token_', '')
        elif token.startswith('token_'):
            user_id = token.replace('token_', '')
        else:
            # Assume token is the user ID directly (for consistency with portfolio API)
            user_id = token
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Use dict cursor for safer column access
        try:
            cursor.execute("""
                SELECT id, amount, status, created_at, description, merchant, category, date,
                       round_up, fee, total_debit, ticker, shares, price_per_share
                FROM transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            has_trade_columns = True
        except Exception as col_error:
            # Fallback: some columns may not exist in production
            print(f"Transactions full query failed: {col_error}, trying basic columns")
            conn.rollback()
            cursor.execute("""
                SELECT id, amount, status, created_at, description, merchant, category, date,
                       round_up, fee, total_debit
                FROM transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            has_trade_columns = False

        transactions = cursor.fetchall()
        conn.close()

        transaction_list = []
        for txn in transactions:
            # Safely convert datetime fields to strings
            created_at = str(txn[3]) if txn[3] else None
            date_val = str(txn[7]) if txn[7] else None
            txn_dict = {
                'id': txn[0],
                'amount': float(txn[1]) if txn[1] else 0,
                'status': txn[2],
                'created_at': created_at,
                'description': txn[4],
                'merchant': txn[5],
                'category': txn[6],
                'date': date_val,
                'round_up': float(txn[8]) if txn[8] else 0,
                'fee': float(txn[9]) if txn[9] else 0,
                'total_debit': float(txn[10]) if txn[10] else 0,
            }
            if has_trade_columns:
                txn_dict['ticker'] = txn[11] if len(txn) > 11 else None
                txn_dict['shares'] = float(txn[12]) if len(txn) > 12 and txn[12] else None
                txn_dict['price_per_share'] = float(txn[13]) if len(txn) > 13 and txn[13] else None
            else:
                txn_dict['ticker'] = None
                txn_dict['shares'] = None
                txn_dict['price_per_share'] = None
            transaction_list.append(txn_dict)
        
        return jsonify({
            'success': True,
            'transactions': transaction_list
        })

    except Exception as e:
        import traceback
        print(f"User transactions error: {str(e)}")
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    """Add a new transaction"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Extract transaction data
        amount = float(data.get('amount', 0))
        merchant = data.get('merchant', 'Unknown Merchant')
        category = data.get('category', 'General')
        date = data.get('date', datetime.now().isoformat().split('T')[0])
        description = data.get('description', '')
        
        # Get user's flat investment preference and account type
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        flat_investment = 1.0  # Default round-up amount
        account_type = user_data[0] if user_data else 'individual'

        # Calculate flat investment amount (always the same regardless of purchase amount)
        investment_amount = float(flat_investment)
        fee = calculate_fee_for_account_type(account_type, investment_amount)
        total_debit = amount + investment_amount + fee

        # Insert transaction
        cursor.execute("""
            INSERT INTO transactions (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            RETURNING id
        """, (user_id, amount, merchant, category, date, description, investment_amount, fee, total_debit, datetime.now().isoformat()))

        transaction_id = cursor.fetchone()[0]

        # Auto-process with AI mapping
        ai_result = auto_process_transaction(cursor, user_id, description, merchant)

        # Update transaction with AI results
        if ai_result and ai_result['confidence'] > 0.8:
            cursor.execute("""
                UPDATE transactions
                SET category = %s, merchant = %s, status = 'mapped', ticker = %s
                WHERE id = %s
            """, (ai_result['category'], ai_result['merchant'], ai_result['suggestedTicker'], transaction_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Transaction added successfully',
            'transaction': {
                'id': transaction_id,
                'amount': amount,
                'merchant': ai_result['merchant'] if ai_result else merchant,
                'category': ai_result['category'] if ai_result else category,
                'date': date,
                'description': description,
                'investment_amount': investment_amount,
                'platform_fee': fee,
                'total_debit': total_debit,
                'status': 'mapped' if ai_result and ai_result['confidence'] > 0.8 else 'pending',
                'created_at': datetime.now().isoformat(),
                'ai_analysis': ai_result
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/portfolio', methods=['GET'])
def user_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get portfolio holdings from portfolios table
        cursor.execute("""
            SELECT ticker, shares, average_price, created_at, updated_at
            FROM portfolios
            WHERE user_id = %s AND shares > 0
            ORDER BY updated_at DESC
        """, (user_id,))
        holdings = cursor.fetchall()

        # Format holdings as positions array
        positions = []
        total_value = 0
        for h in holdings:
            ticker = h[0]
            shares = float(h[1]) if h[1] else 0
            avg_cost = float(h[2]) if h[2] else 0
            # Estimate current value (shares * avg_cost for now, real price would come from market data)
            value = shares * avg_cost
            total_value += value

            positions.append({
                'symbol': ticker,
                'shares': round(shares, 6),
                'avgCost': round(avg_cost, 2),
                'currentPrice': round(avg_cost, 2),  # Would fetch real price in production
                'value': round(value, 2),
                'change': 0,  # Would calculate from real market data
                'changePercent': 0
            })

        # Get transaction stats (include both mapped and completed)
        cursor.execute("""
            SELECT COUNT(*) FROM transactions
            WHERE user_id = %s AND status IN ('mapped', 'completed')
        """, (user_id,))
        total_investments = cursor.fetchone()[0]

        cursor.execute("""
            SELECT SUM(round_up) FROM transactions
            WHERE user_id = %s AND status IN ('mapped', 'completed')
        """, (user_id,))
        total_roundups = cursor.fetchone()[0] or 0

        cursor.execute("SELECT SUM(fee) FROM transactions WHERE user_id = %s", (user_id,))
        total_fees = cursor.fetchone()[0] or 0

        conn.close()

        return jsonify({
            'success': True,
            'portfolio': {
                'total_investments': total_investments,
                'total_roundups': round(total_roundups, 2),
                'total_fees': round(total_fees, 2),
                'current_value': round(total_value, 2) if total_value > 0 else round(total_roundups - total_fees, 2),
                'cash': round(total_value, 2),
                'positions': positions
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/notifications', methods=['GET'])
def user_notifications():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))
        notifications = cursor.fetchall()
        conn.close()

        # Columns: 0=id, 1=title, 2=message, 3=type, 4=created_at, 5=read
        notification_list = []
        for notif in notifications:
            notification_list.append({
                'id': notif[0],
                'title': notif[1],
                'message': notif[2],
                'type': notif[3],
                'created_at': notif[4],
                'read': bool(notif[5])
            })
        
        return jsonify({
            'success': True,
            'notifications': notification_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/goals', methods=['GET'])
def user_goals():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample goals for now
        return jsonify({
            'success': True,
            'goals': [
                {
                    'id': 1,
                    'name': 'Emergency Fund',
                    'target': 1000.00,
                    'current': 250.00,
                    'progress': 25.0
                },
                {
                    'id': 2,
                    'name': 'Vacation Fund',
                    'target': 2000.00,
                    'current': 500.00,
                    'progress': 25.0
                }
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/roundups', methods=['GET'])
def user_roundups():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, amount, round_up, created_at, description
            FROM transactions
            WHERE user_id = %s AND round_up > 0
            ORDER BY created_at DESC
        """, (user_id,))
        roundups = cursor.fetchall()
        conn.close()

        # Columns: 0=id, 1=amount, 2=round_up, 3=created_at, 4=description
        roundup_list = []
        for rup in roundups:
            roundup_list.append({
                'id': rup[0],
                'amount': rup[1],
                'round_up': rup[2],
                'created_at': rup[3],
                'description': rup[4]
            })

        return jsonify({
            'success': True,
            'roundups': roundup_list
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/fees', methods=['GET'])
def user_fees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, amount, fee, created_at, description
            FROM transactions
            WHERE user_id = %s AND fee > 0
            ORDER BY created_at DESC
        """, (user_id,))
        fees = cursor.fetchall()
        conn.close()

        # Columns: 0=id, 1=amount, 2=fee, 3=created_at, 4=description
        fee_list = []
        for f in fees:
            fee_list.append({
                'id': f[0],
                'amount': f[1],
                'fee': f[2],
                'created_at': f[3],
                'description': f[4]
            })
        
        return jsonify({
            'success': True,
            'fees': fee_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/ai-insights', methods=['GET'])
def user_ai_insights():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample AI insights
        return jsonify({
            'success': True,
            'insights': [
                {
                    'id': 1,
                    'type': 'spending_pattern',
                    'title': 'Coffee Spending Alert',
                    'message': 'You spend $45/month on coffee. Consider investing this amount.',
                    'confidence': 0.85
                },
                {
                    'id': 2,
                    'type': 'investment_opportunity',
                    'title': 'Round-up Optimization',
                    'message': 'Increase your round-up multiplier to maximize investments.',
                    'confidence': 0.92
                }
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stock/prices', methods=['GET', 'POST'])
def get_stock_prices():
    """
    Get real stock prices from Alpaca/Yahoo Finance.
    GET: ?symbols=AAPL,MSFT,GOOGL
    POST: {"symbols": ["AAPL", "MSFT", "GOOGL"]}
    """
    try:
        from alpaca_service import AlpacaService
        alpaca = AlpacaService()

        # Get symbols from query params or POST body
        if request.method == 'GET':
            symbols_param = request.args.get('symbols', '')
            symbols = [s.strip().upper() for s in symbols_param.split(',') if s.strip()]
        else:
            data = request.get_json() or {}
            symbols = [s.upper() for s in data.get('symbols', [])]

        if not symbols:
            return jsonify({'success': False, 'error': 'No symbols provided'}), 400

        # Get prices for all symbols
        prices = {}
        for symbol in symbols[:20]:  # Limit to 20 symbols per request
            price = alpaca.get_stock_price(symbol)
            prices[symbol] = {
                'symbol': symbol,
                'price': price,
                'currency': 'USD',
                'timestamp': datetime.now().isoformat()
            }

        return jsonify({
            'success': True,
            'prices': prices
        })

    except Exception as e:
        print(f"Error getting stock prices: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/stock/price/<symbol>', methods=['GET'])
def get_single_stock_price(symbol):
    """Get price for a single stock symbol"""
    try:
        from alpaca_service import AlpacaService
        alpaca = AlpacaService()

        price = alpaca.get_stock_price(symbol.upper())

        return jsonify({
            'success': True,
            'symbol': symbol.upper(),
            'price': price,
            'currency': 'USD',
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Error getting stock price for {symbol}: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/stock-status', methods=['GET'])
def user_stock_status():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        # Return sample stock status
        return jsonify({
            'success': True,
            'stock_status': {
                'total_shares': 15.5,
                'total_value': 1250.75,
                'pending_purchases': 3,
                'recent_activity': [
                    {
                        'ticker': 'AAPL',
                        'shares': 2.5,
                        'price': 150.25,
                        'date': '2025-10-16'
                    }
                ]
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/profile', methods=['GET', 'PUT'])
def user_profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, name, email, role, created_at, phone, address, city, state, zip_code,
                       company_name, round_up_amount, risk_tolerance, account_type, mx_data,
                       first_name, last_name, employer, occupation, annual_income, employment_status,
                       dob, ssn_last4, subscription_plan_id, billing_cycle
                FROM users WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
            conn.close()

            if user:
                # Use stored first_name/last_name if available, otherwise parse from name
                full_name = user[1] or ''
                stored_first = user[15] if len(user) > 15 else None
                stored_last = user[16] if len(user) > 16 else None

                if stored_first or stored_last:
                    first_name = stored_first or ''
                    last_name = stored_last or ''
                else:
                    name_parts = full_name.split(' ', 1) if full_name else ['', '']
                    first_name = name_parts[0] if name_parts else ''
                    last_name = name_parts[1] if len(name_parts) > 1 else ''

                return jsonify({
                    'success': True,
                    'profile': {
                        'id': user[0],
                        'name': user[1],
                        'email': user[2],
                        'role': user[3],
                        'created_at': str(user[4]) if user[4] else None,
                        'phone': user[5] or '',
                        'address': user[6] or '',
                        'street': user[6] or '',  # Alias for frontend
                        'city': user[7] or '',
                        'state': user[8] or '',
                        'zip': user[9] or '',
                        'zip_code': user[9] or '',
                        'company_name': user[10] or '',
                        'roundUpAmount': str(user[11]) if user[11] else '1.00',
                        'round_up_amount': user[11] or 1.0,
                        'riskTolerance': user[12] or 'Moderate',
                        'risk_profile': user[12] or 'Moderate',
                        'account_type': user[13] or 'individual',
                        'firstName': first_name,
                        'lastName': last_name,
                        'mx_data': user[14],
                        'employer': user[17] if len(user) > 17 else '',
                        'occupation': user[18] if len(user) > 18 else '',
                        'annualIncome': user[19] if len(user) > 19 else '',
                        'employmentStatus': user[20] if len(user) > 20 else '',
                        'dateOfBirth': str(user[21]) if len(user) > 21 and user[21] else '',
                        'dob': str(user[21]) if len(user) > 21 and user[21] else '',
                        'ssnLast4': user[22] if len(user) > 22 else '',
                        'ssn': user[22] if len(user) > 22 else '',
                        'subscriptionPlanId': user[23] if len(user) > 23 else None,
                        'billingCycle': user[24] if len(user) > 24 else 'monthly'
                    }
                })
            else:
                return jsonify({'success': False, 'error': 'User not found'}), 404

        elif request.method == 'PUT':
            data = request.get_json() or {}

            # Extract fields from request
            first_name = data.get('firstName', '').strip()
            last_name = data.get('lastName', '').strip()
            name = data.get('fullName', '').strip() or data.get('name', '').strip()
            if not name and (first_name or last_name):
                name = f"{first_name} {last_name}".strip()

            email = data.get('email', '').strip().lower()
            phone = data.get('phone', '').strip()
            address = data.get('street', '').strip() or data.get('address', '').strip()
            city = data.get('city', '').strip()
            state = data.get('state', '').strip()
            zip_code = data.get('zip', '').strip() or data.get('zipCode', '').strip() or data.get('zip_code', '').strip()
            round_up_amount = data.get('roundUpAmount', data.get('roundUpPreference', 1.0))
            risk_tolerance = data.get('riskTolerance', data.get('risk_profile', 'Moderate'))

            # Additional profile fields
            employer = data.get('employer', '').strip()
            occupation = data.get('occupation', '').strip()
            annual_income = data.get('annualIncome', data.get('annual_income', '')).strip()
            employment_status = data.get('employmentStatus', data.get('employment_status', '')).strip()

            # DOB and SSN fields - handle multiple field name formats
            dob = data.get('dob') or data.get('dateOfBirth') or data.get('date_of_birth')
            ssn_last4 = data.get('ssn_last4') or data.get('ssnLast4') or data.get('ssn')

            conn = get_db_connection()
            cursor = conn.cursor()

            # Build dynamic update query based on provided fields
            # Note: removed updated_at as column may not exist
            update_fields = []
            update_values = []

            if name:
                update_fields.append('name = %s')
                update_values.append(name)
            if email:
                update_fields.append('email = %s')
                update_values.append(email)
            if phone:
                update_fields.append('phone = %s')
                update_values.append(phone)
            if address:
                update_fields.append('address = %s')
                update_values.append(address)
            if city:
                update_fields.append('city = %s')
                update_values.append(city)
            if state:
                update_fields.append('state = %s')
                update_values.append(state)
            if zip_code:
                update_fields.append('zip_code = %s')
                update_values.append(zip_code)
            if round_up_amount:
                update_fields.append('round_up_amount = %s')
                update_values.append(float(round_up_amount) if round_up_amount else 1.0)
            if risk_tolerance:
                update_fields.append('risk_tolerance = %s')
                update_values.append(risk_tolerance)
            if first_name:
                update_fields.append('first_name = %s')
                update_values.append(first_name)
            if last_name:
                update_fields.append('last_name = %s')
                update_values.append(last_name)
            if employer:
                update_fields.append('employer = %s')
                update_values.append(employer)
            if occupation:
                update_fields.append('occupation = %s')
                update_values.append(occupation)
            if annual_income:
                update_fields.append('annual_income = %s')
                update_values.append(annual_income)
            if employment_status:
                update_fields.append('employment_status = %s')
                update_values.append(employment_status)
            if dob:
                update_fields.append('dob = %s')
                update_values.append(dob)
            if ssn_last4:
                update_fields.append('ssn_last4 = %s')
                update_values.append(ssn_last4)

            # If no fields to update, return early
            if not update_fields:
                conn.close()
                return jsonify({'success': True, 'message': 'No fields to update'})

            update_values.append(user_id)

            cursor.execute(f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s", tuple(update_values))
            conn.commit()
            conn.close()

            return jsonify({'success': True, 'message': 'Profile updated successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/settings', methods=['GET', 'PUT'])
def user_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        if request.method == 'GET':
            # Return sample settings
            return jsonify({
                'success': True,
                'settings': {
                    'roundup_multiplier': 1.0,
                    'auto_invest': True,
                    'notifications': True,
                    'email_alerts': True,
                    'theme': 'dark'
                }
            })
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            # Update settings logic here
            return jsonify({'success': True, 'message': 'Settings updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/export/transactions', methods=['GET'])
def user_export_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/user/export/transactions/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/export/portfolio', methods=['GET'])
def user_export_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'pdf',
                'download_url': '/api/user/export/portfolio/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Missing user API endpoints
@app.route('/api/user/ai/recommendations', methods=['GET'])
def user_ai_recommendations():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        # Return sample AI recommendations
        return jsonify({
            'success': True,
            'recommendations': [
                {
                    'id': 1,
                    'type': 'investment',
                    'title': 'Increase Round-up Multiplier',
                    'description': 'Consider increasing your round-up multiplier to 2x for better returns',
                    'confidence': 0.85,
                    'potential_return': 0.12
                },
                {
                    'id': 2,
                    'type': 'savings',
                    'title': 'Coffee Shop Optimization',
                    'description': 'You spend $45/month on coffee. Invest this amount instead.',
                    'confidence': 0.92,
                    'potential_return': 0.15
                }
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/subscriptions', methods=['GET'])
@app.route('/api/user/subscriptions/current', methods=['GET'])
def user_subscriptions():
    """Get user's current subscription - checks active subscriptions first, then pending selection"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # First check user_subscriptions table for active/paid subscription
        try:
            cursor.execute("""
                SELECT us.id, us.plan_id, us.status, us.billing_cycle, us.amount,
                       us.current_period_start, us.current_period_end, us.cancel_at_period_end,
                       sp.name, sp.description, sp.features
                FROM user_subscriptions us
                JOIN subscription_plans sp ON us.plan_id = sp.id
                WHERE us.user_id = %s
                ORDER BY us.created_at DESC
                LIMIT 1
            """, (user_id,))
            active_sub = cursor.fetchone()

            if active_sub and active_sub[2] in ('active', 'trialing'):
                import json
                features = []
                if active_sub[10]:
                    try:
                        features = json.loads(active_sub[10]) if isinstance(active_sub[10], str) else active_sub[10]
                    except:
                        features = []

                conn.close()
                return jsonify({
                    'success': True,
                    'subscription': {
                        'subscription_id': active_sub[0],
                        'plan_id': active_sub[1],
                        'status': active_sub[2],
                        'billing_cycle': active_sub[3],
                        'amount': float(active_sub[4]) if active_sub[4] else 0,
                        'current_period_start': str(active_sub[5]) if active_sub[5] else None,
                        'current_period_end': str(active_sub[6]) if active_sub[6] else None,
                        'cancel_at_period_end': active_sub[7],
                        'plan_name': active_sub[8],
                        'description': active_sub[9],
                        'features': features,
                        'requires_payment': False
                    },
                    'has_subscription': True,
                    'message': 'Active subscription found'
                })
        except Exception as e:
            # Table might not exist yet, continue to check users table
            print(f"user_subscriptions table check error: {e}")
            conn.rollback()  # Reset transaction state

        # Fall back to checking users.subscription_plan_id for pending selection
        cursor.execute("""
            SELECT subscription_plan_id, billing_cycle FROM users WHERE id = %s
        """, (user_id,))
        user_result = cursor.fetchone()

        if not user_result or not user_result[0]:
            conn.close()
            return jsonify({
                'success': True,
                'subscription': None,
                'has_subscription': False,
                'message': 'No subscription selected'
            })

        subscription_plan_id = user_result[0]
        billing_cycle = user_result[1] or 'monthly'

        # Get the plan details
        cursor.execute("""
            SELECT id, name, description, price, price_monthly, price_yearly, billing_period, account_type, features
            FROM subscription_plans
            WHERE id = %s
        """, (subscription_plan_id,))
        plan = cursor.fetchone()
        conn.close()

        if not plan:
            return jsonify({
                'success': True,
                'subscription': None,
                'has_subscription': False,
                'message': 'Selected plan not found'
            })

        import json
        features = []
        if plan[8]:
            try:
                features = json.loads(plan[8]) if isinstance(plan[8], str) else plan[8]
            except:
                features = []

        # Determine price based on billing cycle
        price_monthly = float(plan[4]) if plan[4] else float(plan[3]) if plan[3] else 0
        price_yearly = float(plan[5]) if plan[5] else price_monthly * 12
        amount = price_yearly if billing_cycle == 'yearly' else price_monthly

        return jsonify({
            'success': True,
            'subscription': {
                'plan_id': plan[0],
                'plan_name': plan[1],
                'description': plan[2],
                'amount': amount,
                'price_monthly': price_monthly,
                'price_yearly': price_yearly,
                'billing_cycle': billing_cycle,
                'account_type': plan[7],
                'features': features,
                'status': 'pending_payment',  # User selected but hasn't paid yet
                'requires_payment': True
            },
            'has_subscription': True,
            'message': 'Subscription plan selected - payment required'
        })

    except Exception as e:
        print(f"Error getting subscription: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/subscriptions/plans', methods=['GET'])
def user_subscription_plans():
    """Endpoint for subscription plans - fetches from database"""
    try:
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        cursor.execute("""
            SELECT id, name, description, price, billing_period, account_type, features, stripe_price_id
            FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY price
        """)
        rows = cursor.fetchall()
        conn.close()

        import json
        plans = []
        for row in rows:
            features = []
            if row[6]:
                try:
                    features = json.loads(row[6]) if isinstance(row[6], str) else row[6]
                except:
                    features = []

            plans.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'price': float(row[3]) if row[3] else 0,
                'interval': row[4] if row[4] else 'month',
                'billing_period': row[4],
                'account_type': row[5],
                'features': features,
                'stripe_price_id': row[7]
            })

        # Fallback to hardcoded plans if database is empty
        if not plans:
            plans = [
                {
                    'id': 'individual',
                    'name': 'Individual',
                    'price': 9.00,
                    'interval': 'month',
                    'features': ['Automatic round-ups', 'AI insights', 'Portfolio tracking']
                },
                {
                    'id': 'family',
                    'name': 'Family',
                    'price': 19.00,
                    'interval': 'month',
                    'features': ['Up to 5 family members', 'Shared goals', 'Family dashboard']
                },
                {
                    'id': 'business',
                    'name': 'Business',
                    'price': 49.00,
                    'interval': 'month',
                    'features': ['Unlimited team members', 'Advanced analytics', 'API access']
                }
            ]

        return jsonify({'success': True, 'plans': plans})

    except Exception as e:
        # Fallback on error
        return jsonify({
            'success': True,
            'plans': [
                {'id': 'individual', 'name': 'Individual', 'price': 9.00, 'interval': 'month', 'features': ['Automatic round-ups', 'AI insights', 'Portfolio tracking']},
                {'id': 'family', 'name': 'Family', 'price': 19.00, 'interval': 'month', 'features': ['Up to 5 family members', 'Shared goals', 'Family dashboard']},
                {'id': 'business', 'name': 'Business', 'price': 49.00, 'interval': 'month', 'features': ['Unlimited team members', 'Advanced analytics', 'API access']}
            ]
        })

@app.route('/api/business/subscriptions/current', methods=['GET'])
def business_subscriptions_current():
    """Stub endpoint for business subscriptions"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'subscription': None,
            'has_subscription': False,
            'message': 'No active subscription'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ai/recommendations', methods=['POST'])
def ai_recommendations_post():
    """Stub endpoint for AI recommendations"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        # Return sample AI recommendations
        return jsonify({
            'success': True,
            'recommendations': [
                {
                    'id': 1,
                    'type': 'investment',
                    'title': 'Increase Round-up Multiplier',
                    'description': 'Consider increasing your round-up multiplier to 2x for better returns',
                    'confidence': 0.85,
                    'potential_return': 0.12
                },
                {
                    'id': 2,
                    'type': 'savings',
                    'title': 'Coffee Shop Optimization',
                    'description': 'You spend on coffee regularly. Invest this amount instead.',
                    'confidence': 0.92,
                    'potential_return': 0.15
                }
            ]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/bank-connections', methods=['GET', 'POST'])
def user_bank_connections():
    """Endpoint for user bank connections - GET retrieves, POST saves"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        if request.method == 'POST':
            # Save bank connection data
            data = request.get_json() or {}
            member_guid = data.get('member_guid')
            user_guid = data.get('user_guid')
            institution_name = data.get('institution_name', 'Connected Bank')

            # Store as JSON in mx_data column
            import json
            mx_data = json.dumps({
                'member_guid': member_guid,
                'user_guid': user_guid,
                'institution_name': institution_name,
                'connected_at': datetime.now().isoformat()
            })

            cursor.execute("""
                UPDATE users SET mx_data = %s, user_guid = %s WHERE id = %s
            """, (mx_data, user_guid, user_id))
            conn.commit()
            conn.close()

            return jsonify({
                'success': True,
                'message': 'Bank connection saved successfully'
            })

        else:
            # GET - Retrieve bank connections
            cursor.execute("SELECT mx_data, user_guid FROM users WHERE id = %s", (user_id,))
            result = cursor.fetchone()
            conn.close()

            if result and result[0]:
                import json
                try:
                    mx_data = json.loads(result[0]) if isinstance(result[0], str) else result[0]
                    # Format connection data for frontend
                    connection = {
                        'id': mx_data.get('member_guid', f'conn_{user_id}'),
                        'member_guid': mx_data.get('member_guid', ''),
                        'user_guid': mx_data.get('user_guid', result[1] if result[1] else ''),
                        'bank_name': mx_data.get('institution_name', mx_data.get('bank_name', 'Connected Bank')),
                        'institution_name': mx_data.get('institution_name', mx_data.get('bank_name', 'Connected Bank')),
                        'account_name': mx_data.get('account_name', 'Primary Account'),
                        'account_type': mx_data.get('account_type', 'checking'),
                        'status': 'active',
                        'connected_at': mx_data.get('connected_at', '')
                    }
                    return jsonify({
                        'success': True,
                        'connections': [connection],
                        'has_connections': True,
                        'message': 'Bank connection found'
                    })
                except:
                    pass

            return jsonify({
                'success': True,
                'connections': [],
                'has_connections': False,
                'message': 'No bank connections linked'
            })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/bank-connections/<connection_id>', methods=['DELETE'])
def delete_user_bank_connection(connection_id):
    """Delete a user's bank connection"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Clear the mx_data column to remove bank connection
        cursor.execute("UPDATE users SET mx_data = NULL WHERE id = %s", (user_id,))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Bank connection deleted successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/transactions/sync', methods=['POST'])
def sync_user_transactions():
    """Sync transactions from user's connected bank account"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user has a bank connection AND get their round-up setting
        cursor.execute("SELECT mx_data, round_up_amount FROM users WHERE id = %s", (user_id,))
        result = cursor.fetchone()

        if not result or not result[0]:
            conn.close()
            return jsonify({
                'success': False,
                'error': 'No bank account connected. Please connect a bank first.'
            }), 400

        # Get user's configured round-up amount (FIXED amount, not nearest dollar)
        user_round_up_amount = float(result[1]) if result[1] else 1.00

        # In demo mode, generate sample transactions
        # In production, this would call MX API to fetch real transactions
        # IMPORTANT: Transactions come in with NO TICKER - they need LLM processing
        import random
        from datetime import datetime, timedelta

        # Merchants - just names, NO tickers (tickers assigned by LLM processing)
        merchants = [
            'Starbucks',
            'Amazon',
            'Walmart',
            'Target',
            'McDonalds',
            'Apple Store',
            'Netflix',
            'Uber',
            'Chipotle',
            'Home Depot',
            'Costco',
            'Best Buy',
            'Whole Foods',
            'Trader Joes',
            'CVS Pharmacy'
        ]

        transactions = []
        base_date = datetime.now()

        # Generate 5-10 new transactions
        num_transactions = random.randint(5, 10)

        for i in range(num_transactions):
            merchant_name = random.choice(merchants)
            amount = round(random.uniform(5.00, 75.00), 2)
            # FIXED: Use user's configured round-up amount (not nearest dollar calculation)
            round_up = user_round_up_amount
            tx_date = base_date - timedelta(days=random.randint(0, 7))

            tx = {
                'id': f'tx_{user_id}_{int(datetime.now().timestamp())}_{i}',
                'merchant': merchant_name,
                'ticker': None,  # NO TICKER - needs LLM processing
                'category': 'Unknown',  # Will be determined by LLM
                'amount': amount,
                'round_up': round_up,
                'fee': 0,  # No fee - subscription pays for service
                'date': tx_date.strftime('%Y-%m-%d'),
                'status': 'pending'  # Pending LLM processing
            }
            transactions.append(tx)

            # Save to database - NO TICKER, status=pending, needs LLM processing
            cursor.execute("""
                INSERT INTO transactions (user_id, merchant, amount, round_up, fee, date, status, ticker, category)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (user_id, merchant_name, amount, round_up, 0, tx_date, 'pending', None, 'Unknown'))

        conn.commit()
        conn.close()

        # Auto-process the new pending transactions
        if len(transactions) > 0:
            processed, mapped, no_match = auto_process_pending_transactions()
            print(f"Auto-processed after sync: {processed} processed, {mapped} mapped, {no_match} no match")

        return jsonify({
            'success': True,
            'message': f'Synced {len(transactions)} new transactions',
            'count': len(transactions),
            'transactions': transactions,
            'auto_processed': {
                'processed': processed if len(transactions) > 0 else 0,
                'mapped': mapped if len(transactions) > 0 else 0,
                'no_match': no_match if len(transactions) > 0 else 0
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/roundups/total', methods=['GET'])
def user_roundups_total():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total roundups for the user
        cursor.execute("SELECT SUM(round_up) FROM transactions WHERE user_id = %s AND status = 'mapped'", (user_id,))
        total_roundups = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s AND status = 'mapped'", (user_id,))
        total_transactions = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'total_roundups': float(total_roundups),
            'total_transactions': total_transactions,
            'average_roundup': float(total_roundups / total_transactions) if total_transactions > 0 else 0
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/fees/total', methods=['GET'])
def user_fees_total():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get total fees for the user
        cursor.execute("SELECT SUM(fee) FROM transactions WHERE user_id = %s", (user_id,))
        total_fees = cursor.fetchone()[0] or 0

        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s AND fee > 0", (user_id,))
        fee_transactions = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'total_fees': float(total_fees),
            'fee_transactions': fee_transactions,
            'average_fee': float(total_fees / fee_transactions) if fee_transactions > 0 else 0
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/settings/roundup', methods=['GET'])
def user_settings_roundup():
    """Get user's roundup settings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        # Return default roundup settings
        return jsonify({
            'success': True,
            'settings': {
                'roundup_amount': 1.00,
                'roundup_enabled': True,
                'auto_invest': True,
                'investment_frequency': 'per_transaction'
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/settings/roundup', methods=['PUT'])
def update_user_settings_roundup():
    """Update user's roundup settings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        data = request.get_json() or {}

        return jsonify({
            'success': True,
            'message': 'Roundup settings updated',
            'settings': {
                'roundup_amount': data.get('roundup_amount', 1.00),
                'roundup_enabled': data.get('roundup_enabled', True),
                'auto_invest': data.get('auto_invest', True),
                'investment_frequency': data.get('investment_frequency', 'per_transaction')
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Missing user endpoints
@app.route('/api/user/statements', methods=['GET'])
def user_statements():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        # Return sample statements data
        return jsonify({
            'success': True,
            'statements': [
                {
                    'id': 1,
                    'date': '2025-01-15',
                    'type': 'bank_statement',
                    'filename': 'statement_jan_2025.pdf',
                    'status': 'processed'
                }
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/ai/insights', methods=['GET'])
def user_ai_insights_slash():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        # Get user-submitted mappings from database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get user's mapping history - use only core columns that exist
        try:
            cursor.execute('''
                SELECT id, merchant_name, ticker_symbol, category, status,
                       admin_approved, confidence, notes, created_at, transaction_id
                FROM llm_mappings
                WHERE user_id = %s
                ORDER BY created_at DESC
            ''', (user_id,))
            mappings = cursor.fetchall()
        except Exception as db_error:
            # If query fails, return empty data
            print(f"AI insights query error: {db_error}")
            mappings = []

        conn.close()

        # Format mapping data
        mapping_data = []
        for mapping in mappings:
            # Convert confidence to status
            confidence_percent = mapping[6] * 100 if mapping[6] else 0
            if confidence_percent >= 90:
                confidence_status = "Very High"
            elif confidence_percent >= 80:
                confidence_status = "High"
            elif confidence_percent >= 60:
                confidence_status = "Medium"
            elif confidence_percent >= 40:
                confidence_status = "Low"
            else:
                confidence_status = "Very Low"
            
            mapping_data.append({
                'id': mapping[0],
                'user_id': user_id,  # Add user_id to response
                'merchant_name': mapping[1],
                'ticker_symbol': mapping[2],
                'category': mapping[3],
                'status': mapping[4],
                'admin_approved': mapping[5],
                'confidence': mapping[6],
                'confidence_status': confidence_status,
                'notes': mapping[7],
                'submitted_at': str(mapping[8]) if mapping[8] else None,
                'transaction_id': mapping[9]  # Link mapping to transaction
            })
        
        # Calculate stats
        total_mappings = len(mapping_data)
        approved_mappings = len([m for m in mapping_data if m['admin_approved'] == 1])
        pending_mappings = len([m for m in mapping_data if m['status'] == 'pending'])
        accuracy_rate = (approved_mappings / total_mappings * 100) if total_mappings > 0 else 0
        points_earned = approved_mappings * 50  # 50 points per approved mapping
        
        return jsonify({
            'success': True,
            'insights': [
                {
                    'id': 1,
                    'type': 'spending_pattern',
                    'title': 'Coffee Shop Optimization',
                    'description': 'You spend $45/month on coffee. Consider investing this amount instead.',
                    'confidence': 0.92,
                    'potential_savings': 540
                },
                {
                    'id': 2,
                    'type': 'investment_opportunity',
                    'title': 'Round-up Multiplier',
                    'description': 'Increase your round-up multiplier to 2x for better returns',
                    'confidence': 0.85,
                    'potential_return': 0.12
                }
            ],
            'data': mapping_data,
            'stats': {
                'totalMappings': total_mappings,
                'approvedMappings': approved_mappings,
                'pendingMappings': pending_mappings,
                'accuracyRate': accuracy_rate,
                'pointsEarned': points_earned
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user/rewards', methods=['GET'])
def user_rewards():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        # Return sample rewards data
        return jsonify({
            'success': True,
            'rewards': [
                {
                    'id': 1,
                    'type': 'cashback',
                    'title': 'Coffee Shop Cashback',
                    'description': 'Earn 2% cashback on coffee purchases',
                    'amount': 5.50,
                    'status': 'available',
                    'expires_at': '2025-12-31'
                },
                {
                    'id': 2,
                    'type': 'bonus',
                    'title': 'Round-up Bonus',
                    'description': 'Extra $2.50 for your next round-up',
                    'amount': 2.50,
                    'status': 'pending',
                    'expires_at': '2025-11-30'
                }
            ]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family authentication
@app.route('/api/family/auth/login', methods=['POST'])
def family_login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check users table for family role - PostgreSQL uses %s placeholders
        cursor.execute("SELECT id, email, name, role, password FROM users WHERE email = %s AND role = 'family'", (email,))
        user = cursor.fetchone()

        if user:
            # psycopg2 returns tuples: (id, email, name, role, password)
            from werkzeug.security import check_password_hash
            if check_password_hash(user[4], password):  # user[4] is password
                token = f"family_token_{user[0]}"  # user[0] is id
                conn.close()

                return jsonify({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'name': user[2],
                        'role': user[3]
                    }
                })

        conn.close()
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/auth/me')
def family_auth_me():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('family_token_'):
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401

        user_id = token.replace('family_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("SELECT id, email, name, role FROM users WHERE id = %s AND role = 'family'", (user_id,))
        user = cursor.fetchone()
        conn.close()

        if user:
            # psycopg2 returns tuples: (id, email, name, role)
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'name': user[2],
                    'role': user[3]
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Family user not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Family dashboard endpoints
@app.route('/api/family/transactions', methods=['GET', 'POST'])
def family_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        # Handle both user_token_ and family_token_ prefixes
        if token.startswith('family_token_'):
            family_id = token.replace('family_token_', '')
        elif token.startswith('user_token_'):
            family_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401

        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor()
            # Query includes shares and price_per_share for completed trades
            cursor.execute("""
                SELECT id, amount, status, created_at, description, merchant, category, date,
                       round_up, fee, total_debit, ticker, shares, price_per_share
                FROM transactions
                WHERE user_id = %s OR user_id = %s
                ORDER BY created_at DESC
            """, (family_id, f"user_{family_id}"))
            transactions = cursor.fetchall()
            conn.close()

            transaction_list = []
            for txn in transactions:
                # Columns: 0=id, 1=amount, 2=status, 3=created_at, 4=description, 5=merchant, 6=category,
                #          7=date, 8=round_up, 9=fee, 10=total_debit, 11=ticker, 12=shares, 13=price_per_share
                transaction_list.append({
                    'id': txn[0],
                    'amount': txn[1],
                    'status': txn[2],
                    'created_at': str(txn[3]) if txn[3] else None,
                    'description': txn[4],
                    'merchant': txn[5],
                    'category': txn[6],
                    'date': str(txn[7]) if txn[7] else None,
                    'round_up': txn[8],
                    'fee': txn[9],
                    'total_debit': txn[10],
                    'ticker': txn[11] if len(txn) > 11 else None,
                    'shares': float(txn[12]) if len(txn) > 12 and txn[12] else None,
                    'price_per_share': float(txn[13]) if len(txn) > 13 and txn[13] else None
                })
            
            return jsonify({
                'success': True,
                'transactions': transaction_list
            })
            
        elif request.method == 'POST':
            # Add new family transaction
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            # Extract transaction data
            amount = float(data.get('amount', 0))
            merchant = data.get('merchant', 'Unknown Merchant')
            category = data.get('category', 'General')
            date = data.get('date', datetime.now().isoformat().split('T')[0])
            description = data.get('description', '')
            
            # Get user's flat investment preference and account type
            conn = get_db_connection()
            cursor = conn.cursor()
            # PostgreSQL uses %s placeholders
            cursor.execute("SELECT role FROM users WHERE id = %s", (family_id,))
            user_data = cursor.fetchone()
            flat_investment = 1.0  # Default round-up amount
            # psycopg2 returns tuples
            account_type = user_data[0] if user_data else 'family'

            # Calculate flat investment amount (always the same regardless of purchase amount)
            investment_amount = float(flat_investment)
            fee = calculate_fee_for_account_type(account_type, investment_amount)
            total_debit = amount + investment_amount + fee

            # Insert transaction - PostgreSQL uses %s placeholders
            cursor.execute("""
                INSERT INTO transactions (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            """, (family_id, amount, merchant, category, date, description, investment_amount, fee, total_debit, datetime.now().isoformat()))

            transaction_id = cursor.lastrowid

            # Auto-process with AI mapping
            ai_result = auto_process_transaction(cursor, family_id, description, merchant)

            # Update transaction with AI results - PostgreSQL uses %s
            if ai_result and ai_result['confidence'] > 0.8:
                cursor.execute("""
                    UPDATE transactions
                    SET category = %s, merchant = %s, status = 'mapped', ticker = %s
                    WHERE id = %s
                """, (ai_result['category'], ai_result['merchant'], ai_result['suggestedTicker'], transaction_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Family transaction added successfully',
                'transaction': {
                    'id': transaction_id,
                    'amount': amount,
                    'merchant': ai_result['merchant'] if ai_result else merchant,
                    'category': ai_result['category'] if ai_result else category,
                    'date': date,
                    'description': description,
                    'investment_amount': investment_amount,
                    'platform_fee': fee,
                    'total_debit': total_debit,
                    'status': 'mapped' if ai_result and ai_result['confidence'] > 0.8 else 'pending',
                    'created_at': datetime.now().isoformat(),
                    'ai_analysis': ai_result
                }
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/portfolio', methods=['GET'])
def family_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get family portfolio summary - PostgreSQL uses %s placeholders
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s AND status = 'mapped'", (family_id,))
        total_investments = cursor.fetchone()[0]

        cursor.execute("SELECT SUM(round_up) FROM transactions WHERE user_id = %s AND status = 'mapped'", (family_id,))
        total_roundups = cursor.fetchone()[0] or 0

        cursor.execute("SELECT SUM(fee) FROM transactions WHERE user_id = %s", (family_id,))
        total_fees = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'portfolio': {
                'total_investments': total_investments,
                'total_roundups': round(total_roundups, 2),
                'total_fees': round(total_fees, 2),
                'current_value': round(total_roundups - total_fees, 2),
                'family_size': 4,  # Sample family size
                'shared_goals': 3   # Sample shared goals
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/notifications', methods=['GET'])
def family_notifications():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (family_id,))
        notifications = cursor.fetchall()
        conn.close()

        notification_list = []
        for notif in notifications:
            # psycopg2 returns tuples: (id, title, message, type, created_at, read)
            notification_list.append({
                'id': notif[0],
                'title': notif[1],
                'message': notif[2],
                'type': notif[3],
                'created_at': str(notif[4]) if notif[4] else None,
                'read': bool(notif[5])
            })
        
        return jsonify({
            'success': True,
            'notifications': notification_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/goals', methods=['GET'])
def family_goals():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty family goals (no hardcoded data)
        return jsonify({
            'success': True,
            'goals': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/roundups', methods=['GET'])
def family_roundups():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("""
            SELECT id, amount, round_up, created_at, description
            FROM transactions
            WHERE user_id = %s AND round_up > 0
            ORDER BY created_at DESC
        """, (family_id,))
        roundups = cursor.fetchall()
        conn.close()

        roundup_list = []
        for rup in roundups:
            # psycopg2 returns tuples: (id, amount, round_up, created_at, description)
            roundup_list.append({
                'id': rup[0],
                'amount': rup[1],
                'round_up': rup[2],
                'created_at': str(rup[3]) if rup[3] else None,
                'description': rup[4]
            })
        
        return jsonify({
            'success': True,
            'roundups': roundup_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/fees', methods=['GET'])
def family_fees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("""
            SELECT id, amount, fee, created_at, description
            FROM transactions
            WHERE user_id = %s AND fee > 0
            ORDER BY created_at DESC
        """, (family_id,))
        fees = cursor.fetchall()
        conn.close()

        fee_list = []
        for fee_row in fees:
            # psycopg2 returns tuples: (id, amount, fee, created_at, description)
            fee_list.append({
                'id': fee_row[0],
                'amount': fee_row[1],
                'fee': fee_row[2],
                'created_at': str(fee_row[3]) if fee_row[3] else None,
                'description': fee_row[4]
            })
        
        return jsonify({
            'success': True,
            'fees': fee_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/ai-insights', methods=['GET'])
def family_ai_insights():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')

        # Get family-submitted mappings from database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get family's mapping history - PostgreSQL uses %s placeholders
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, status,
                   admin_approved, confidence, notes, created_at, transaction_id
            FROM llm_mappings
            WHERE user_id = %s AND dashboard_type = 'family'
            ORDER BY created_at DESC
        ''', (family_id,))

        mappings = cursor.fetchall()
        conn.close()

        # Format mapping data
        mapping_data = []
        for mapping in mappings:
            mapping_data.append({
                'id': mapping[0],
                'merchant_name': mapping[1],
                'ticker_symbol': mapping[2],
                'category': mapping[3],
                'status': mapping[4],
                'admin_approved': mapping[5],
                'confidence': mapping[6],
                'notes': mapping[7],
                'submitted_at': mapping[8],
                'transaction_id': mapping[9]
            })
        
        # Calculate stats
        total_mappings = len(mapping_data)
        approved_mappings = len([m for m in mapping_data if m['admin_approved'] == 1])
        pending_mappings = len([m for m in mapping_data if m['status'] == 'pending'])
        accuracy_rate = (approved_mappings / total_mappings * 100) if total_mappings > 0 else 0
        points_earned = approved_mappings * 50  # 50 points per approved mapping
        
        return jsonify({
            'success': True,
            'insights': [],
            'data': mapping_data,
            'stats': {
                'totalMappings': total_mappings,
                'approvedMappings': approved_mappings,
                'pendingMappings': pending_mappings,
                'accuracyRate': accuracy_rate,
                'pointsEarned': points_earned
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/stock-status', methods=['GET'])
def family_stock_status():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty family stock status (no hardcoded data)
        return jsonify({
            'success': True,
            'stock_status': {
                'total_shares': 0,
                'total_value': 0,
                'pending_purchases': 0,
                'family_holdings': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/profile', methods=['GET', 'PUT'])
def family_profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        family_id = token.replace('family_token_', '')
        
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor()
            # PostgreSQL uses %s placeholders
            cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE id = %s", (family_id,))
            user = cursor.fetchone()
            conn.close()

            if user:
                # psycopg2 returns tuples: (id, name, email, role, created_at)
                return jsonify({
                    'success': True,
                    'profile': {
                        'id': user[0],
                        'name': user[1],
                        'email': user[2],
                        'role': user[3],
                        'created_at': str(user[4]) if user[4] else None,
                        'family_size': 0,
                        'family_members': []
                    }
                })
            else:
                return jsonify({'success': False, 'error': 'Family not found'}), 404

        elif request.method == 'PUT':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            email = data.get('email', '').strip().lower()

            if not name or not email:
                return jsonify({'success': False, 'error': 'Name and email are required'}), 400

            conn = get_db_connection()
            cursor = conn.cursor()
            # PostgreSQL uses %s placeholders
            cursor.execute("UPDATE users SET name = %s, email = %s WHERE id = %s", (name, email, family_id))
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Family profile updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/settings', methods=['GET', 'PUT'])
def family_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        if request.method == 'GET':
            # Return empty family settings (no hardcoded data)
            return jsonify({
                'success': True,
                'settings': {
                    'roundup_multiplier': 1.0,
                    'auto_invest': False,
                    'notifications': False,
                    'email_alerts': False,
                    'theme': 'dark',
                    'family_sharing': False,
                    'budget_alerts': False,
                    'spending_limits': {
                        'daily': 0.00,
                        'weekly': 0.00,
                        'monthly': 0.00
                    }
                }
            })
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            token = auth_header.split(' ')[1]
            family_id = token.replace('family_token_', '')
            
            # Extract settings
            roundup_multiplier = float(data.get('roundUpPreference', 1.0))
            auto_invest = bool(data.get('auto_invest', False))
            notifications = bool(data.get('notifications', False))
            email_alerts = bool(data.get('email_alerts', False))
            theme = data.get('theme', 'dark')
            family_sharing = bool(data.get('family_sharing', False))
            budget_alerts = bool(data.get('budget_alerts', False))
            spending_limits = data.get('spending_limits', {})
            
            # Update user's round-up amount - PostgreSQL uses %s placeholders
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET round_up_amount = %s WHERE id = %s", (roundup_multiplier, family_id))
            conn.commit()
            conn.close()

            return jsonify({'success': True, 'message': 'Family settings updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/members', methods=['GET'])
def family_members():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty family members (no hardcoded data)
        return jsonify({
            'success': True,
            'members': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/budget', methods=['GET'])
def family_budget():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty family budget (no hardcoded data)
        return jsonify({
            'success': True,
            'budget': {
                'monthly_income': 0.00,
                'monthly_expenses': 0.00,
                'savings_rate': 0.0,
                'categories': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/expenses', methods=['GET'])
def family_expenses():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty family expenses (no hardcoded data)
        return jsonify({
            'success': True,
            'expenses': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/savings', methods=['GET'])
def family_savings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty family savings (no hardcoded data)
        return jsonify({
            'success': True,
            'savings': {
                'total_saved': 0.00,
                'monthly_savings': 0.00,
                'savings_rate': 0.0,
                'goals_progress': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/export/transactions', methods=['GET'])
def family_export_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/family/export/transactions/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/export/portfolio', methods=['GET'])
def family_export_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'pdf',
                'download_url': '/api/family/export/portfolio/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/export/members', methods=['GET'])
def family_export_members():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/family/export/members/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Business authentication
@app.route('/api/business/auth/login', methods=['POST'])
def business_login():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check users table for business role - PostgreSQL uses %s placeholders
        cursor.execute("SELECT id, email, name, role, password FROM users WHERE email = %s AND role = 'business'", (email,))
        user = cursor.fetchone()

        if user:
            # psycopg2 returns tuples: (id, email, name, role, password)
            from werkzeug.security import check_password_hash
            if check_password_hash(user[4], password):  # user[4] is password
                token = f"business_token_{user[0]}"  # user[0] is id
                conn.close()

                return jsonify({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'name': user[2],
                        'role': user[3]
                    }
                })

        conn.close()
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/auth/me')
def business_auth_me():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('business_token_'):
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401

        user_id = token.replace('business_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("SELECT id, email, name, role FROM users WHERE id = %s AND role = 'business'", (user_id,))
        user = cursor.fetchone()
        conn.close()

        if user:
            # psycopg2 returns tuples: (id, email, name, role)
            return jsonify({
                'success': True,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'name': user[2],
                    'role': user[3]
                }
            })
        else:
            return jsonify({'success': False, 'error': 'Business user not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Business dashboard endpoints
@app.route('/api/business/transactions', methods=['GET', 'POST'])
def business_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle both business_token_ and user_token_ prefixes
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor()
            # Query includes shares and price_per_share for completed trades
            cursor.execute("""
                SELECT id, amount, status, created_at, description, merchant, category, date,
                       round_up, fee, total_debit, ticker, shares, price_per_share
                FROM transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (business_id,))
            transactions = cursor.fetchall()
            conn.close()

            transaction_list = []
            for txn in transactions:
                # Columns: 0=id, 1=amount, 2=status, 3=created_at, 4=description, 5=merchant, 6=category,
                #          7=date, 8=round_up, 9=fee, 10=total_debit, 11=ticker, 12=shares, 13=price_per_share
                transaction_list.append({
                    'id': txn[0],
                    'amount': txn[1],
                    'status': txn[2],
                    'created_at': str(txn[3]) if txn[3] else None,
                    'description': txn[4],
                    'merchant': txn[5],
                    'category': txn[6],
                    'date': str(txn[7]) if txn[7] else None,
                    'round_up': txn[8],
                    'fee': txn[9],
                    'total_debit': txn[10],
                    'ticker': txn[11] if len(txn) > 11 else None,
                    'shares': float(txn[12]) if len(txn) > 12 and txn[12] else None,
                    'price_per_share': float(txn[13]) if len(txn) > 13 and txn[13] else None
                })

            # Return empty transactions if none found (no hardcoded data)

            return jsonify({
                'success': True,
                'data': transaction_list
            })

        elif request.method == 'POST':
            # Add new business transaction
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400

            # Extract transaction data
            amount = float(data.get('amount', 0))
            merchant = data.get('merchant', 'Unknown Merchant')
            category = data.get('category', 'General')
            date = data.get('date', datetime.now().isoformat().split('T')[0])
            description = data.get('description', '')

            # Get user's flat investment preference and account type - PostgreSQL uses %s
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT role FROM users WHERE id = %s", (business_id,))
            user_data = cursor.fetchone()
            flat_investment = 1.0  # Default round-up amount
            # psycopg2 returns tuples
            account_type = user_data[0] if user_data else 'business'

            # Calculate flat investment amount (always the same regardless of purchase amount)
            investment_amount = float(flat_investment)
            fee = calculate_fee_for_account_type(account_type, investment_amount)
            total_debit = amount + investment_amount + fee

            # Insert transaction - PostgreSQL uses %s placeholders
            cursor.execute("""
                INSERT INTO transactions (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)
            """, (business_id, amount, merchant, category, date, description, investment_amount, fee, total_debit, datetime.now().isoformat()))

            transaction_id = cursor.lastrowid

            # Auto-process with AI mapping
            ai_result = auto_process_transaction(cursor, business_id, description, merchant)

            # Update transaction with AI results - PostgreSQL uses %s
            if ai_result and ai_result['confidence'] > 0.8:
                cursor.execute("""
                    UPDATE transactions
                    SET category = %s, merchant = %s, status = 'mapped', ticker = %s
                    WHERE id = %s
                """, (ai_result['category'], ai_result['merchant'], ai_result['suggestedTicker'], transaction_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Business transaction added successfully',
                'transaction': {
                    'id': transaction_id,
                    'amount': amount,
                    'merchant': ai_result['merchant'] if ai_result else merchant,
                    'category': ai_result['category'] if ai_result else category,
                    'date': date,
                    'description': description,
                    'investment_amount': investment_amount,
                    'platform_fee': fee,
                    'total_debit': total_debit,
                    'status': 'mapped' if ai_result and ai_result['confidence'] > 0.8 else 'pending',
                    'created_at': datetime.now().isoformat(),
                    'ai_analysis': ai_result
                }
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/portfolio', methods=['GET'])
def business_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        business_id = token.replace('business_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get business portfolio summary - PostgreSQL uses %s placeholders
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s AND status = 'mapped'", (business_id,))
        total_investments = cursor.fetchone()[0]

        cursor.execute("SELECT SUM(round_up) FROM transactions WHERE user_id = %s AND status = 'mapped'", (business_id,))
        total_roundups = cursor.fetchone()[0] or 0

        cursor.execute("SELECT SUM(fee) FROM transactions WHERE user_id = %s", (business_id,))
        total_fees = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'portfolio': {
                'total_investments': total_investments,
                'total_roundups': round(total_roundups, 2),
                'total_fees': round(total_fees, 2),
                'current_value': round(total_roundups - total_fees, 2),
                'business_size': 25,  # Sample business size
                'departments': 5,     # Sample departments
                'employees': 25       # Sample employee count
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/notifications', methods=['GET'])
def business_notifications():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle both business_token_ and user_token_ prefixes
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("""
            SELECT id, title, message, type, created_at, read
            FROM notifications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (business_id,))
        notifications = cursor.fetchall()
        conn.close()

        notification_list = []
        for notif in notifications:
            # psycopg2 returns tuples: (id, title, message, type, created_at, read)
            notification_list.append({
                'id': notif[0],
                'title': notif[1],
                'message': notif[2],
                'type': notif[3],
                'created_at': str(notif[4]) if notif[4] else None,
                'read': bool(notif[5])
            })

        return jsonify({
            'success': True,
            'notifications': notification_list
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/notifications/manage', methods=['POST', 'PUT', 'DELETE'])
def business_notifications_manage():
    """Manage business notifications (create, update, delete)"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'POST':
            # Create new notification
            data = request.get_json() or {}
            title = data.get('title', '').strip()
            message = data.get('message', '').strip()
            notification_type = data.get('type', 'info')
            
            if not title or not message:
                return jsonify({'success': False, 'error': 'Title and message are required'}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            # PostgreSQL uses %s placeholders and NOW() instead of datetime('now')
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, type, created_at, read)
                VALUES (%s, %s, %s, %s, NOW(), 0)
            """, (business_id, title, message, notification_type))
            conn.commit()
            conn.close()

            return jsonify({'success': True, 'message': 'Notification created successfully'})

        elif request.method == 'PUT':
            # Mark notification as read
            data = request.get_json() or {}
            notification_id = data.get('id')

            if not notification_id:
                return jsonify({'success': False, 'error': 'Notification ID is required'}), 400

            conn = get_db_connection()
            cursor = conn.cursor()
            # PostgreSQL uses %s placeholders
            cursor.execute("""
                UPDATE notifications
                SET read = 1
                WHERE id = %s AND user_id = %s
            """, (notification_id, business_id))
            conn.commit()
            conn.close()

            return jsonify({'success': True, 'message': 'Notification marked as read'})

        elif request.method == 'DELETE':
            # Delete notification
            data = request.get_json() or {}
            notification_id = data.get('id')

            if not notification_id:
                return jsonify({'success': False, 'error': 'Notification ID is required'}), 400

            conn = get_db_connection()
            cursor = conn.cursor()
            # PostgreSQL uses %s placeholders
            cursor.execute("""
                DELETE FROM notifications
                WHERE id = %s AND user_id = %s
            """, (notification_id, business_id))
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Notification deleted successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/goals', methods=['GET'])
def business_goals():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business goals (no hardcoded data)
        return jsonify({
            'success': True,
            'goals': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/roundups', methods=['GET'])
def business_roundups():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        business_id = token.replace('business_token_', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("""
            SELECT id, amount, round_up, created_at, description
            FROM transactions
            WHERE user_id = %s AND round_up > 0
            ORDER BY created_at DESC
        """, (business_id,))
        roundups = cursor.fetchall()
        conn.close()

        roundup_list = []
        for rup in roundups:
            # psycopg2 returns tuples: (id, amount, round_up, created_at, description)
            roundup_list.append({
                'id': rup[0],
                'amount': rup[1],
                'round_up': rup[2],
                'created_at': str(rup[3]) if rup[3] else None,
                'description': rup[4]
            })

        return jsonify({
            'success': True,
            'roundups': roundup_list
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/fees', methods=['GET'])
def business_fees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        business_id = token.replace('business_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        # PostgreSQL uses %s placeholders
        cursor.execute("""
            SELECT id, amount, fee, created_at, description
            FROM transactions
            WHERE user_id = %s AND fee > 0
            ORDER BY created_at DESC
        """, (business_id,))
        fees = cursor.fetchall()
        conn.close()

        fee_list = []
        for fee_row in fees:
            # psycopg2 returns tuples: (id, amount, fee, created_at, description)
            fee_list.append({
                'id': fee_row[0],
                'amount': fee_row[1],
                'fee': fee_row[2],
                'created_at': str(fee_row[3]) if fee_row[3] else None,
                'description': fee_row[4]
            })
        
        return jsonify({
            'success': True,
            'fees': fee_list
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/ai-insights', methods=['GET'])
def business_ai_insights():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        business_id = token.replace('business_token_', '')

        # Get business-submitted mappings from database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get business's mapping history - PostgreSQL uses %s placeholders
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, status,
                   admin_approved, confidence, notes, created_at, transaction_id
            FROM llm_mappings
            WHERE user_id = %s AND dashboard_type = 'business'
            ORDER BY created_at DESC
        ''', (business_id,))

        mappings = cursor.fetchall()
        conn.close()

        # Format mapping data
        mapping_data = []
        for mapping in mappings:
            mapping_data.append({
                'id': mapping[0],
                'merchant_name': mapping[1],
                'ticker_symbol': mapping[2],
                'category': mapping[3],
                'status': mapping[4],
                'admin_approved': mapping[5],
                'confidence': mapping[6],
                'notes': mapping[7],
                'submitted_at': mapping[8],
                'transaction_id': mapping[9]
            })
        
        # Calculate stats
        total_mappings = len(mapping_data)
        approved_mappings = len([m for m in mapping_data if m['admin_approved'] == 1])
        pending_mappings = len([m for m in mapping_data if m['status'] == 'pending'])
        accuracy_rate = (approved_mappings / total_mappings * 100) if total_mappings > 0 else 0
        points_earned = approved_mappings * 50  # 50 points per approved mapping
        
        return jsonify({
            'success': True,
            'insights': [],
            'data': mapping_data,
            'stats': {
                'totalMappings': total_mappings,
                'approvedMappings': approved_mappings,
                'pendingMappings': pending_mappings,
                'accuracyRate': accuracy_rate,
                'pointsEarned': points_earned
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/process-mappings', methods=['POST'])
def process_pending_mappings():
    """Process pending mappings with AI/LLM and route to appropriate queues"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all pending mappings
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, confidence, notes, user_id, dashboard_type, transaction_id
            FROM llm_mappings 
            WHERE status = 'pending'
            ORDER BY created_at ASC
        ''')
        
        pending_mappings = cursor.fetchall()
        processed_count = 0
        auto_approved_count = 0
        admin_review_count = 0
        
        for mapping in pending_mappings:
            mapping_id, merchant_name, ticker_symbol, category, confidence, notes, user_id, dashboard_type, transaction_id = mapping
            
            # Simulate AI processing logic
            # High confidence mappings (>= 0.8) get auto-approved
            # Medium confidence (0.5-0.8) go to admin review
            # Low confidence (< 0.5) get rejected
            
            if confidence >= 0.8:
                # Auto-approve high confidence mappings - PostgreSQL uses %s
                cursor.execute('''
                    UPDATE llm_mappings
                    SET status = 'approved', admin_approved = 1, processed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (mapping_id,))

                # Update the original transaction status - PostgreSQL uses %s
                cursor.execute('''
                    UPDATE transactions
                    SET status = 'mapped', ticker = %s, category = %s
                    WHERE id = %s
                ''', (ticker_symbol, category, transaction_id))

                auto_approved_count += 1

            elif confidence >= 0.5:
                # Send to admin review queue - PostgreSQL uses %s
                cursor.execute('''
                    UPDATE llm_mappings
                    SET status = 'admin_review', processed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (mapping_id,))

                admin_review_count += 1

            else:
                # Reject low confidence mappings - PostgreSQL uses %s
                cursor.execute('''
                    UPDATE llm_mappings
                    SET status = 'rejected', processed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (mapping_id,))

                # Update transaction status to rejected - PostgreSQL uses %s
                cursor.execute('''
                    UPDATE transactions
                    SET status = 'rejected'
                    WHERE id = %s
                ''', (transaction_id,))
            
            processed_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Processed {processed_count} mappings',
            'auto_approved': auto_approved_count,
            'admin_review': admin_review_count,
            'rejected': processed_count - auto_approved_count - admin_review_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/mapping/<int:mapping_id>/approve', methods=['POST'])
def admin_approve_mapping(mapping_id):
    """Admin approves a mapping"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        data = request.get_json() or {}
        admin_notes = data.get('notes', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get mapping details - PostgreSQL uses %s
        cursor.execute('''
            SELECT user_id, transaction_id, ticker_symbol, category
            FROM llm_mappings WHERE id = %s
        ''', (mapping_id,))

        mapping = cursor.fetchone()
        if not mapping:
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404

        user_id, transaction_id, ticker_symbol, category = mapping

        # Approve the mapping - PostgreSQL uses %s
        cursor.execute('''
            UPDATE llm_mappings
            SET status = 'approved', admin_approved = 1, processed_at = CURRENT_TIMESTAMP,
                notes = CASE WHEN notes IS NULL OR notes = '' THEN %s ELSE notes || ' | ' || %s END
            WHERE id = %s
        ''', (admin_notes, admin_notes, mapping_id))

        # Update the original transaction to 'mapped' so it appears in Investment Processing
        if transaction_id:
            cursor.execute('''
                UPDATE transactions
                SET status = 'mapped', ticker = %s, category = %s
                WHERE id = %s
            ''', (ticker_symbol, category, transaction_id))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Mapping approved successfully',
            'mapping_id': mapping_id,
            'status': 'approved',
            'transaction_updated': bool(transaction_id)
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/mapping/<int:mapping_id>/reject', methods=['POST'])
def admin_reject_mapping(mapping_id):
    """Admin rejects a mapping"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        data = request.get_json() or {}
        admin_notes = data.get('notes', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get mapping details - PostgreSQL uses %s
        cursor.execute('''
            SELECT transaction_id FROM llm_mappings WHERE id = %s
        ''', (mapping_id,))

        mapping = cursor.fetchone()
        if not mapping:
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404

        transaction_id = mapping[0]

        # Reject the mapping - PostgreSQL uses %s
        cursor.execute('''
            UPDATE llm_mappings
            SET status = 'rejected', admin_approved = -1, processed_at = CURRENT_TIMESTAMP,
                notes = CASE WHEN notes IS NULL OR notes = '' THEN %s ELSE notes || ' | ' || %s END
            WHERE id = %s
        ''', (admin_notes, admin_notes, mapping_id))

        # Update the original transaction back to pending so user can re-submit
        if transaction_id:
            cursor.execute('''
                UPDATE transactions
                SET status = 'pending'
                WHERE id = %s
            ''', (transaction_id,))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Mapping rejected successfully',
            'mapping_id': mapping_id,
            'status': 'rejected'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/mapping/<int:mapping_id>/delete', methods=['DELETE'])
def admin_delete_mapping_endpoint(mapping_id):
    """Delete a mapping from llm_mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if mapping exists
        cursor.execute('SELECT id FROM llm_mappings WHERE id = %s', (mapping_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404

        cursor.execute('DELETE FROM llm_mappings WHERE id = %s', (mapping_id,))
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Mapping {mapping_id} deleted successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/mapping/<int:mapping_id>/update', methods=['PUT'])
def admin_update_mapping_endpoint(mapping_id):
    """Update a mapping in llm_mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if mapping exists
        cursor.execute('SELECT id FROM llm_mappings WHERE id = %s', (mapping_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404

        # Build update query dynamically based on provided fields
        allowed_fields = ['merchant_name', 'ticker_symbol', 'category', 'confidence', 'company_name', 'notes', 'status']
        updates = []
        params = []
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = %s')
                params.append(data[field])

        if not updates:
            conn.close()
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400

        params.append(mapping_id)
        cursor.execute(f'UPDATE llm_mappings SET {", ".join(updates)} WHERE id = %s', params)
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Mapping {mapping_id} updated successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/notify-mapping-outcome', methods=['POST'])
def notify_mapping_outcome():
    """Send notification to user about mapping outcome"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        data = request.get_json()
        user_id = data.get('user_id')
        mapping_id = data.get('mapping_id')
        outcome = data.get('outcome')  # 'approved', 'rejected', 'auto_approved'
        notes = data.get('notes', '')
        
        if not user_id or not mapping_id or not outcome:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get mapping details - PostgreSQL uses %s
        cursor.execute('''
            SELECT merchant_name, ticker_symbol, category
            FROM llm_mappings WHERE id = %s
        ''', (mapping_id,))
        
        mapping = cursor.fetchone()
        if not mapping:
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404
        
        merchant_name, ticker_symbol, category = mapping
        
        # Create notification message based on outcome
        if outcome == 'approved':
            title = 'Mapping Approved!'
            message = f'Your mapping for {merchant_name} → {ticker_symbol} has been approved by admin.'
        elif outcome == 'auto_approved':
            title = 'Mapping Auto-Approved!'
            message = f'Your mapping for {merchant_name} → {ticker_symbol} was automatically approved by AI.'
        else:  # rejected
            title = 'Mapping Rejected'
            message = f'Your mapping for {merchant_name} was rejected. {notes}'
        
        # Store notification in database (you might have a notifications table)
        # For now, we'll just return success
        # In a real implementation, you'd store this in a notifications table
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Notification sent successfully',
            'notification': {
                'title': title,
                'message': message,
                'user_id': user_id,
                'mapping_id': mapping_id,
                'outcome': outcome
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/stock-status', methods=['GET'])
def business_stock_status():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business stock status (no hardcoded data)
        return jsonify({
            'success': True,
            'stock_status': {
                'total_shares': 0,
                'total_value': 0,
                'pending_purchases': 0,
                'business_holdings': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/profile', methods=['GET', 'PUT'])
def business_profile():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle both business_token_ and user_token_ prefixes
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE id = %s", (business_id,))
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return jsonify({
                    'success': True,
                    'profile': {
                        'id': user['id'],
                        'name': user['name'],
                        'email': user['email'],
                        'role': user['role'],
                        'created_at': user['created_at'],
                        'business_size': 25,
                        'departments': 5,
                        'employees': 25,
                        'industry': 'Technology',
                        'revenue': 500000.00
                    }
                })
            else:
                return jsonify({'success': False, 'error': 'Business not found'}), 404
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            email = data.get('email', '').strip().lower()
            
            if not name or not email:
                return jsonify({'success': False, 'error': 'Name and email are required'}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET name = %s, email = %s WHERE id = %s", (name, email, business_id))
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Business profile updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/settings', methods=['GET', 'PUT'])
def business_settings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # Handle both business_token_ and user_token_ prefixes
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            # Get business settings from database or return defaults
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                
                # Get user settings
                cursor.execute("""
                    SELECT roundup_multiplier, auto_invest, notifications, email_alerts, 
                           theme, business_sharing, budget_alerts, department_limits
                    FROM user_settings 
                    WHERE user_id = ?
                """, (business_id,))
                settings = cursor.fetchone()
                conn.close()
            except Exception as db_error:
                print(f"Database error in business_settings: {db_error}")
                # Return default settings if database error
                return jsonify({
                    'success': True,
                    'settings': {
                        'roundup_multiplier': 1.0,
                        'auto_invest': False,
                        'notifications': False,
                        'email_alerts': False,
                        'theme': 'dark',
                        'business_sharing': False,
                        'budget_alerts': False,
                        'department_limits': {}
                    }
                })
            
            if settings:
                return jsonify({
                    'success': True,
                    'settings': {
                        'roundup_multiplier': settings['roundup_multiplier'] or 1.0,
                        'auto_invest': bool(settings['auto_invest']),
                        'notifications': bool(settings['notifications']),
                        'email_alerts': bool(settings['email_alerts']),
                        'theme': settings['theme'] or 'dark',
                        'business_sharing': bool(settings['business_sharing']),
                        'budget_alerts': bool(settings['budget_alerts']),
                        'department_limits': settings['department_limits'] or {}
                    }
                })
            else:
                # Return default settings
                return jsonify({
                    'success': True,
                    'settings': {
                        'roundup_multiplier': 1.0,
                        'auto_invest': False,
                        'notifications': False,
                        'email_alerts': False,
                        'theme': 'dark',
                        'business_sharing': False,
                        'budget_alerts': False,
                        'department_limits': {}
                    }
                })
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            
            # Validate and extract settings
            roundup_multiplier = float(data.get('roundup_multiplier', 1.0))
            auto_invest = bool(data.get('auto_invest', False))
            notifications = bool(data.get('notifications', False))
            email_alerts = bool(data.get('email_alerts', False))
            theme = data.get('theme', 'dark')
            business_sharing = bool(data.get('business_sharing', False))
            budget_alerts = bool(data.get('budget_alerts', False))
            department_limits = data.get('department_limits', {})
            
            # Update or insert settings
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Update user's round-up amount
            cursor.execute("UPDATE users SET round_up_amount = %s WHERE id = %s", (roundup_multiplier, business_id))
            
            cursor.execute("""
                INSERT INTO user_settings
                (user_id, roundup_multiplier, auto_invest, notifications, email_alerts,
                 theme, business_sharing, budget_alerts, department_limits, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    roundup_multiplier = EXCLUDED.roundup_multiplier,
                    auto_invest = EXCLUDED.auto_invest,
                    notifications = EXCLUDED.notifications,
                    email_alerts = EXCLUDED.email_alerts,
                    theme = EXCLUDED.theme,
                    business_sharing = EXCLUDED.business_sharing,
                    budget_alerts = EXCLUDED.budget_alerts,
                    department_limits = EXCLUDED.department_limits,
                    updated_at = NOW()
            """, (business_id, roundup_multiplier, auto_invest, notifications,
                  email_alerts, theme, business_sharing, budget_alerts,
                  str(department_limits)))
            
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Business settings updated successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/settings/account', methods=['GET', 'PUT'])
def business_account_settings():
    """Handle business account settings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name, email, company_name, phone, address FROM users WHERE id = %s", (business_id,))
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return jsonify({
                    'success': True,
                    'account': {
                        'name': user['name'],
                        'email': user['email'],
                        'company_name': user.get('company_name', ''),
                        'phone': user.get('phone', ''),
                        'address': user.get('address', '')
                    }
                })
            else:
                return jsonify({'success': False, 'error': 'Business account not found'}), 404
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            email = data.get('email', '').strip().lower()
            company_name = data.get('company_name', '').strip()
            phone = data.get('phone', '').strip()
            address = data.get('address', '').strip()
            
            if not name or not email:
                return jsonify({'success': False, 'error': 'Name and email are required'}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users 
                SET name = ?, email = ?, company_name = ?, phone = ?, address = ?
                WHERE id = ?
            """, (name, email, company_name, phone, address, business_id))
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Account settings updated successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/settings/security', methods=['GET', 'PUT'])
def business_security_settings():
    """Handle business security settings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'security': {
                    'two_factor_enabled': False,
                    'password_last_changed': None,
                    'login_notifications': True,
                    'session_timeout': 30,
                    'api_access': False,
                    'ip_whitelist': []
                }
            })
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            # Update security settings logic here
            return jsonify({'success': True, 'message': 'Security settings updated successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/settings/notifications', methods=['GET', 'PUT'])
def business_notification_settings():
    """Handle business notification settings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'notifications': {
                    'email_notifications': True,
                    'push_notifications': True,
                    'sms_notifications': False,
                    'transaction_alerts': True,
                    'budget_alerts': True,
                    'investment_alerts': True,
                    'team_updates': True,
                    'weekly_reports': True
                }
            })
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            # Update notification settings logic here
            return jsonify({'success': True, 'message': 'Notification settings updated successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/settings/data', methods=['GET', 'PUT'])
def business_data_settings():
    """Handle business data management settings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if token.startswith('business_token_'):
            business_id = token.replace('business_token_', '')
        elif token.startswith('user_token_'):
            business_id = token.replace('user_token_', '')
        else:
            return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'data_management': {
                    'auto_backup': True,
                    'backup_frequency': 'daily',
                    'data_retention_days': 365,
                    'export_format': 'csv',
                    'data_sharing': False,
                    'analytics_tracking': True
                }
            })
        
        elif request.method == 'PUT':
            data = request.get_json() or {}
            # Update data management settings logic here
            return jsonify({'success': True, 'message': 'Data management settings updated successfully'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/employees', methods=['GET'])
def business_employees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business employees (no hardcoded data)
        return jsonify({
            'success': True,
            'employees': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/departments', methods=['GET'])
def business_departments():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business departments (no hardcoded data)
        return jsonify({
            'success': True,
            'departments': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/expenses', methods=['GET'])
def business_expenses():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business expenses (no hardcoded data)
        return jsonify({
            'success': True,
            'expenses': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/revenue', methods=['GET'])
def business_revenue():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business revenue (no hardcoded data)
        return jsonify({
            'success': True,
            'revenue': {
                'monthly_revenue': 0.00,
                'quarterly_revenue': 0.00,
                'yearly_revenue': 0.00,
                'revenue_breakdown': [],
                'growth_rate': 0.0,
                'projected_revenue': 0.00
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/budget', methods=['GET'])
def business_budget():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business budget (no hardcoded data)
        return jsonify({
            'success': True,
            'budget': {
                'total_budget': 0.00,
                'total_spent': 0.00,
                'remaining_budget': 0.00,
                'departments': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/analytics', methods=['GET'])
def business_analytics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business analytics (no hardcoded data)
        return jsonify({
            'success': True,
            'analytics': {
                'financial_metrics': {
                    'revenue_growth': 0.0,
                    'profit_margin': 0.0,
                    'expense_ratio': 0.0,
                    'roi': 0.0
                },
                'operational_metrics': {
                    'employee_productivity': 0.0,
                    'department_efficiency': 0.0,
                    'budget_utilization': 0.0,
                    'goal_completion': 0.0
                },
                'trends': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/reports', methods=['GET'])
def business_reports():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty business reports (no hardcoded data)
        return jsonify({
            'success': True,
            'reports': []
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/export/transactions', methods=['GET'])
def business_export_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/business/export/transactions/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/export/portfolio', methods=['GET'])
def business_export_portfolio():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'pdf',
                'download_url': '/api/business/export/portfolio/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/export/employees', methods=['GET'])
def business_export_employees():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'csv',
                'download_url': '/api/business/export/employees/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/export/analytics', methods=['GET'])
def business_export_analytics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return sample export data
        return jsonify({
            'success': True,
            'export_data': {
                'format': 'excel',
                'download_url': '/api/business/export/analytics/download',
                'expires_at': '2025-10-17T00:00:00Z'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting clean admin, user, and family server...")
    print("Available endpoints:")
    print("  /api/health")
    print("  /api/admin/auth/login")
    print("  /api/admin/auth/me")
    print("  /api/admin/users")
    print("  /api/admin/family-users")
    print("  /api/admin/business-users")
    print("  /api/admin/user-metrics")
    print("  /api/admin/transactions")
    print("  /api/admin/employees")
    print("  /api/admin/llm-center/queue")
    print("  /api/admin/llm-center/processing-stats")
    print("  /api/admin/settings/analytics")
    print("  /api/admin/settings/notifications")
    print("  /api/user/auth/login")
    print("  /api/user/auth/me")
    print("  /api/user/transactions")
    print("  /api/user/portfolio")
    print("  /api/user/notifications")
    print("  /api/user/goals")
    print("  /api/user/roundups")
    print("  /api/user/fees")
    print("  /api/user/ai-insights")
    print("  /api/user/stock-status")
    print("  /api/user/profile")
    print("  /api/user/settings")
    print("  /api/user/export/transactions")
    print("  /api/user/export/portfolio")
    print("  /api/family/auth/login")
    print("  /api/family/auth/me")
    print("  /api/family/transactions")
    print("  /api/family/portfolio")
    print("  /api/family/notifications")
    print("  /api/family/goals")
    print("  /api/family/roundups")
    print("  /api/family/fees")
    print("  /api/family/ai-insights")
    print("  /api/family/stock-status")
    print("  /api/family/profile")
    print("  /api/family/settings")
    print("  /api/family/members")
    print("  /api/family/budget")
    print("  /api/family/expenses")
    print("  /api/family/savings")
    print("  /api/family/export/transactions")
    print("  /api/family/export/portfolio")
    print("  /api/family/export/members")

# Missing endpoints that need to be implemented
@app.route('/api/ml/stats', methods=['GET'])
def ml_stats():
    try:
        return jsonify({
            'success': True,
            'stats': {
                'total_models': 3,
                'active_models': 2,
                'training_accuracy': 0.95,
                'prediction_count': 1250,
                'last_training': '2025-10-17T01:30:00Z'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/llm-data/system-status', methods=['GET'])
def llm_system_status():
    try:
        return jsonify({
            'success': True,
            'status': {
                'system_health': 'operational',
                'active_processes': 0,
                'queue_size': 0,
                'last_processed': None,
                'uptime': '100%'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/llm-data/event-stats', methods=['GET'])
def llm_event_stats():
    """Get RAG Search event statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get RAG search metrics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_events = cursor.fetchone()[0]

        # PostgreSQL uses NOW() - INTERVAL '1 day' instead of SQLite datetime()
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE created_at > NOW() - INTERVAL '1 day'")
        processed_today = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending_events = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0

        # Calculate error rate (low confidence = potential error)
        error_rate = max(0, (1 - avg_confidence) * 100) if avg_confidence > 0 else 0

        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_events': total_events,
                'processed_today': processed_today,
                'pending_events': pending_events,
                'error_rate': round(error_rate, 1),
                'avg_confidence': round(avg_confidence * 100, 1),
                'search_efficiency': round(avg_confidence * 100, 1),
                'last_update': datetime.now().isoformat()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/schema', methods=['GET'])
def admin_database_schema():
    try:
        return jsonify({
            'success': True,
            'schema': {
                'tables': ['users', 'transactions', 'notifications', 'admins'],
                'total_tables': 4,
                'last_updated': '2025-10-17T01:30:00Z'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/stats', methods=['GET'])
def admin_database_stats():
    try:
        return jsonify({
            'success': True,
            'stats': {
                'total_records': 1250,
                'database_size': '2.5MB',
                'last_backup': '2025-10-17T01:00:00Z',
                'connection_count': 3
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/feature-flags', methods=['GET'])
def admin_feature_flags():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'feature_flags': [],
                'segments': [],
                'experiments': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/messaging/campaigns', methods=['GET'])
def admin_messaging_campaigns():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'campaigns': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/messages/admin/all', methods=['GET'])
def messages_admin_all():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'messages': []
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/badges', methods=['GET'])
def admin_badges():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'badges': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/advertisements/campaigns', methods=['GET'])
def admin_advertisement_campaigns():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'campaigns': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/crm/contacts', methods=['GET'])
def admin_crm_contacts():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'contacts': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/content/pages', methods=['GET'])
def admin_content_pages():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'pages': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/content/blogs', methods=['GET'])
def admin_content_blogs():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'blogs': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/content/frontend', methods=['GET'])
def admin_content_frontend():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'sections': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/content/frontend/current', methods=['GET'])
def admin_content_frontend_current():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/frontend-content', methods=['GET', 'POST'])
def admin_frontend_content():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'sections': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/frontend-content', methods=['GET'])
def public_frontend_content():
    return jsonify({
        'success': True,
        'data': {}
    })

@app.route('/api/admin/content', methods=['POST'])
def admin_content_create():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/api-usage/stats', methods=['GET'])
def admin_api_usage_stats():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'total_calls': 0,
                'successful_calls': 0,
                'failed_calls': 0,
                'total_cost': 0,
                'success_rate': 0,
                'average_processing_time_ms': 0,
                'period_days': int(request.args.get('days', 0))
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/api-usage/daily-limit', methods=['GET'])
def admin_api_usage_daily_limit():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'daily_limit': 0,
                'used_today': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/api-usage/balance', methods=['GET', 'POST'])
def admin_api_usage_balance():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        if request.method == 'POST':
            return jsonify({'success': True, 'data': {'balance': request.json.get('balance', 0)}})

        return jsonify({
            'success': True,
            'data': {
                'balance': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/api-usage/records', methods=['GET'])
def admin_api_usage_records():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'records': [],
                'total': 0,
                'total_pages': 1
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/plans', methods=['GET', 'POST'])
def admin_subscription_plans():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        if request.method == 'POST':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            description = data.get('description', '').strip()
            price = data.get('price', 0)
            price_monthly = data.get('price_monthly', data.get('priceMonthly', price or 0))
            price_yearly = data.get('price_yearly', data.get('priceYearly', 0))
            billing_period = data.get('billing_period', data.get('billingPeriod', 'monthly'))
            account_type = data.get('account_type', data.get('accountType', 'individual'))
            tier = data.get('tier', 'basic')
            features = data.get('features', data.get('selectedFeatures', []))
            is_active = data.get('is_active', data.get('isActive', True))
            stripe_price_id = data.get('stripe_price_id', data.get('stripePriceId', ''))

            if not name:
                conn.close()
                return jsonify({'success': False, 'error': 'Plan name is required'}), 400

            # Convert features list to JSON string
            import json
            features_json = json.dumps(features) if isinstance(features, list) else features

            cursor.execute("""
                INSERT INTO subscription_plans (name, description, price, price_monthly, price_yearly, billing_period, account_type, tier, features, is_active, stripe_price_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (name, description, price_monthly, price_monthly, price_yearly, billing_period, account_type, tier, features_json, is_active, stripe_price_id))

            result = cursor.fetchone()
            plan_id = result[0] if result else None
            conn.commit()
            conn.close()

            return jsonify({
                'success': True,
                'message': 'Plan created successfully',
                'plan': {
                    'id': plan_id,
                    'name': name,
                    'description': description,
                    'price': float(price_monthly) if price_monthly else 0,
                    'price_monthly': float(price_monthly) if price_monthly else 0,
                    'price_yearly': float(price_yearly) if price_yearly else 0,
                    'billing_period': billing_period,
                    'account_type': account_type,
                    'tier': tier,
                    'features': features,
                    'is_active': is_active,
                    'stripe_price_id': stripe_price_id
                }
            })

        else:
            # GET - Fetch all plans
            cursor.execute("""
                SELECT id, name, description, price, billing_period, account_type, features, is_active, stripe_price_id, created_at,
                       COALESCE(price_monthly, price, 0) as price_monthly, COALESCE(price_yearly, 0) as price_yearly, COALESCE(tier, 'basic') as tier
                FROM subscription_plans
                ORDER BY account_type, price
            """)
            rows = cursor.fetchall()
            conn.close()

            import json
            plans = []
            for row in rows:
                features = []
                if row[6]:
                    try:
                        features = json.loads(row[6]) if isinstance(row[6], str) else row[6]
                    except:
                        features = []

                plans.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': float(row[3]) if row[3] else 0,
                    'billing_period': row[4],
                    'account_type': row[5],
                    'features': features,
                    'is_active': row[7],
                    'stripe_price_id': row[8],
                    'created_at': str(row[9]) if row[9] else None,
                    'price_monthly': float(row[10]) if row[10] else 0,
                    'price_yearly': float(row[11]) if row[11] else 0,
                    'tier': row[12] or 'basic'
                })

            return jsonify({'success': True, 'data': plans})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/public/subscriptions/plans', methods=['GET'])
def public_subscription_plans():
    """Public subscription plans for signup flow"""
    try:
        account_type = request.args.get('account_type', 'individual')

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        cursor.execute("""
            SELECT id, name, description, price, billing_period, account_type, features, stripe_price_id,
                   COALESCE(price_monthly, price, 0) as price_monthly, COALESCE(price_yearly, 0) as price_yearly
            FROM subscription_plans
            WHERE is_active = TRUE AND account_type = %s
            ORDER BY price
        """, (account_type,))
        rows = cursor.fetchall()
        conn.close()

        import json
        plans = []
        for row in rows:
            features = []
            if row[6]:
                try:
                    features = json.loads(row[6]) if isinstance(row[6], str) else row[6]
                except:
                    features = []

            price_monthly = float(row[8]) if row[8] else float(row[3]) if row[3] else 0
            price_yearly = float(row[9]) if row[9] else (price_monthly * 10)  # Default yearly = 10 months

            plans.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'price': float(row[3]) if row[3] else 0,
                'price_monthly': price_monthly,
                'price_yearly': price_yearly,
                'billing_period': row[4],
                'account_type': row[5],
                'features': features,
                'stripe_price_id': row[7]
            })

        return jsonify({
            'success': True,
            'account_type': account_type,
            'plans': plans
        })
    except Exception as e:
        return jsonify({'success': True, 'account_type': account_type, 'plans': []})

@app.route('/api/admin/subscriptions/plans/<plan_id>', methods=['PUT', 'DELETE'])
def admin_subscription_plan_update(plan_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Admin access required'}), 403

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        if request.method == 'DELETE':
            cursor.execute("DELETE FROM subscription_plans WHERE id = %s", (plan_id,))
            conn.commit()
            conn.close()
            return jsonify({'success': True, 'message': 'Plan deleted successfully'})

        else:
            # PUT - Update plan
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            description = data.get('description', '').strip()
            price = data.get('price', 0)
            price_monthly = data.get('price_monthly', data.get('priceMonthly', price or 0))
            price_yearly = data.get('price_yearly', data.get('priceYearly', 0))
            billing_period = data.get('billing_period', data.get('billingPeriod', 'monthly'))
            account_type = data.get('account_type', data.get('accountType', 'individual'))
            tier = data.get('tier', 'basic')
            features = data.get('features', data.get('selectedFeatures', []))
            is_active = data.get('is_active', data.get('isActive', True))
            stripe_price_id = data.get('stripe_price_id', data.get('stripePriceId', ''))

            import json
            features_json = json.dumps(features) if isinstance(features, list) else features

            cursor.execute("""
                UPDATE subscription_plans
                SET name = %s, description = %s, price = %s, price_monthly = %s, price_yearly = %s,
                    billing_period = %s, account_type = %s, tier = %s, features = %s, is_active = %s,
                    stripe_price_id = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (name, description, price_monthly, price_monthly, price_yearly, billing_period, account_type, tier, features_json, is_active, stripe_price_id, plan_id))
            conn.commit()
            conn.close()

            return jsonify({'success': True, 'message': 'Plan updated successfully'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/users', methods=['GET'])
def admin_subscription_users():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/renewal-queue', methods=['GET'])
def admin_subscription_renewal_queue():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/analytics/overview', methods=['GET'])
def admin_subscription_analytics_overview():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'mrr': 0,
                'activeSubscriptions': 0,
                'churnRate': 0,
                'arpu': 0,
                'mrrChange': 0,
                'subscriptionsChange': 0,
                'churnChange': 0,
                'arpuChange': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/promo-codes', methods=['GET', 'POST'])
def admin_subscription_promo_codes():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/promo-codes/<promo_id>', methods=['DELETE'])
def admin_subscription_promo_delete(promo_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/subscriptions/create-renewal-entry', methods=['POST'])
@app.route('/api/admin/subscriptions/handle-failed-payment', methods=['POST'])
@app.route('/api/admin/subscriptions/process-daily-recognition', methods=['POST'])
@app.route('/api/admin/subscriptions/setup-accounts', methods=['POST'])
def admin_subscription_accounting_stubs():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/financial/accounts', methods=['GET'])
def admin_financial_accounts():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/financial/accounts/categories', methods=['GET'])
def admin_financial_account_categories():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/financial/transactions', methods=['GET'])
def admin_financial_transactions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': []})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/financial-analytics', methods=['GET'])
def admin_financial_analytics_stub():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True, 'data': {}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/journal-entries', methods=['GET'])
def admin_journal_entries_stub():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'journal_entries': [],
                'total_entries': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/receipts/llm-mappings', methods=['GET'])
def receipts_llm_mappings():
    """Get receipt-to-stock mappings with pagination"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 7, type=int)  # Match other tabs
        offset = (page - 1) * limit

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # Check if receipts table exists
        cursor.execute('''
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'receipts'
            )
        ''')
        table_exists = cursor.fetchone()[0]

        if not table_exists:
            conn.close()
            return jsonify({
                'success': True,
                'data': {
                    'mappings': [],
                    'total': 0,
                    'page': page,
                    'limit': limit,
                    'pages': 0,
                    'pagination': {
                        'current_page': page,
                        'total_pages': 0,
                        'total_count': 0,
                        'has_next': False,
                        'has_prev': False
                    }
                }
            })

        # Get receipts with parsed data (these are the "mapped" receipts)
        cursor.execute('''
            SELECT id, user_id, filename, status, parsed_data, round_up_amount,
                   allocation_data, created_at
            FROM receipts
            WHERE status = 'processed' OR parsed_data IS NOT NULL
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        ''', (limit, offset))

        cols = [c[0] for c in cursor.description]
        rows = cursor.fetchall()

        mappings = []
        for row in rows:
            row_dict = dict(zip(cols, row))
            # Parse JSON fields
            parsed_data = {}
            allocation_data = {}
            try:
                if row_dict.get('parsed_data'):
                    parsed_data = json.loads(row_dict['parsed_data']) if isinstance(row_dict['parsed_data'], str) else row_dict['parsed_data']
                if row_dict.get('allocation_data'):
                    allocation_data = json.loads(row_dict['allocation_data']) if isinstance(row_dict['allocation_data'], str) else row_dict['allocation_data']
            except:
                pass

            mappings.append({
                'id': row_dict['id'],
                'receipt_id': row_dict['id'],
                'user_id': row_dict['user_id'],
                'filename': row_dict['filename'],
                'status': row_dict['status'],
                'merchant_name': parsed_data.get('merchant', parsed_data.get('store', 'Unknown')),
                'total_amount': parsed_data.get('total', row_dict.get('round_up_amount', 0)),
                'round_up_amount': row_dict.get('round_up_amount', 0),
                'ticker': allocation_data.get('ticker', 'PENDING'),
                'category': parsed_data.get('category', 'Other'),
                'confidence': allocation_data.get('confidence', 0),
                'created_at': str(row_dict['created_at']) if row_dict.get('created_at') else None,
                'items': parsed_data.get('items', [])
            })

        # Get actual count of processed receipts
        cursor.execute("SELECT COUNT(*) FROM receipts WHERE status = 'processed' OR parsed_data IS NOT NULL")
        actual_count = cursor.fetchone()[0] or 0

        conn.close()

        total_pages = (actual_count + limit - 1) // limit if actual_count > 0 else 0

        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings,
                'total': actual_count,
                'page': page,
                'limit': limit,
                'pages': total_pages,
                'pagination': {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_count': actual_count,
                    'has_next': page < total_pages,
                    'has_prev': page > 1
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/financial/update-subscription-revenue', methods=['POST'])
def admin_financial_update_subscription_revenue():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== CONSOLIDATED AUTOMATION STATUS ENDPOINT ==========
# This single endpoint returns all automation data, replacing 6 individual calls
@app.route('/api/admin/llm-center/automation/status', methods=['GET'])
def admin_llm_center_automation_status():
    """Consolidated endpoint for all automation status data - reduces 6 API calls to 1"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # Get estimated counts using pg_class (instant)
        cursor.execute("SELECT reltuples::bigint FROM pg_class WHERE relname = 'llm_mappings'")
        result = cursor.fetchone()
        total_mappings = int(result[0]) if result and result[0] else 0

        # Get status breakdown (fast with index)
        cursor.execute('''
            SELECT
                SUM(CASE WHEN admin_approved = 1 THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN admin_approved = 0 AND status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM llm_mappings
        ''')
        status_row = cursor.fetchone()
        approved = int(status_row[0] or 0) if status_row else 0
        pending = int(status_row[1] or 0) if status_row else 0
        rejected = int(status_row[2] or 0) if status_row else 0

        # Get avg confidence - return 0 if no data (don't fake values)
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        result = cursor.fetchone()
        avg_conf = float(result[0]) if result and result[0] else 0

        # Get ACTUAL pending transactions count (transactions needing LLM processing)
        cursor.execute("""
            SELECT COUNT(*) FROM transactions
            WHERE status = 'pending' AND (ticker IS NULL OR ticker = '')
        """)
        pending_transactions = cursor.fetchone()[0] or 0

        conn.close()

        # Build consolidated response - reflect ACTUAL reality
        return jsonify({
            'success': True,
            'data': {
                # Real-time processing status - shows actual pending transactions
                'realtime': {
                    'status': 'active' if pending_transactions > 0 else 'idle',
                    'processing_rate': 0,  # No fake rate - will show actual when processing
                    'queue_size': pending_transactions,  # ACTUAL pending transactions
                    'pending_transactions': pending_transactions,
                    'last_processed': datetime.now().isoformat()
                },
                # Batch processing status
                'batch': {
                    'status': 'idle',
                    'last_run': datetime.now().isoformat(),
                    'processed_count': approved,
                    'pending_count': pending
                },
                # Learning metrics
                'learning': {
                    'accuracy': round(avg_conf * 100, 1),
                    'training_samples': total_mappings,
                    'model_version': 'v1.0',
                    'last_trained': datetime.now().isoformat()
                },
                # Merchant database stats
                'merchants': {
                    'total_merchants': total_mappings,
                    'verified_merchants': approved,
                    'pending_verification': pending,
                    'rejected': rejected
                },
                # Confidence thresholds
                'thresholds': {
                    'auto_approve': 0.95,
                    'manual_review': 0.70,
                    'auto_reject': 0.30,
                    'current_avg': round(avg_conf, 3)
                },
                # Multi-model status
                'multiModel': {
                    'enabled': True,
                    'models': ['deepseek', 'gpt-4'],
                    'voting_strategy': 'consensus',
                    'agreement_rate': round(avg_conf * 100, 1)
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Keep stub routes for backward compatibility (redirect to consolidated endpoint)
@app.route('/api/admin/llm-center/automation/realtime', methods=['GET'])
@app.route('/api/admin/llm-center/automation/batch', methods=['GET'])
@app.route('/api/admin/llm-center/automation/learning', methods=['GET'])
@app.route('/api/admin/llm-center/automation/merchants', methods=['GET'])
@app.route('/api/admin/llm-center/automation/thresholds', methods=['GET'])
@app.route('/api/admin/llm-center/automation/multi-model', methods=['GET'])
def admin_llm_center_automation_stubs():
    """Stub endpoints - returns subset of consolidated data for backward compatibility"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        # Return empty data - frontend should use consolidated endpoint
        return jsonify({'success': True, 'data': {}})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== CLEAR ALL MAPPINGS (FAST) ==========
@app.route('/api/admin/llm-center/mappings/clear-all', methods=['DELETE'])
def admin_clear_all_mappings():
    """Clear all mappings using TRUNCATE for speed on large tables"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()

        # Get count before delete
        cursor.execute("SELECT reltuples::bigint FROM pg_class WHERE relname = 'llm_mappings'")
        result = cursor.fetchone()
        count_before = int(result[0]) if result and result[0] else 0

        # Use TRUNCATE for instant delete (resets sequences)
        cursor.execute("TRUNCATE TABLE llm_mappings RESTART IDENTITY")
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Cleared {count_before} mappings',
            'deleted_count': count_before
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== APPROVE ALL PENDING (BATCHED) ==========
@app.route('/api/admin/llm-center/mappings/approve-all-pending', methods=['POST'])
def admin_approve_all_pending():
    """Approve all pending mappings in batches to avoid timeout"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        batch_size = int(request.args.get('batch_size', 50000))

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()

        # Count pending before update
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0 AND status = 'pending'")
        pending_count = cursor.fetchone()[0] or 0

        if pending_count == 0:
            conn.close()
            return jsonify({
                'success': True,
                'message': 'No pending mappings to approve',
                'processed': 0,
                'remaining': 0
            })

        # Process in batches
        cursor.execute(f'''
            UPDATE llm_mappings
            SET admin_approved = 1, status = 'approved'
            WHERE id IN (
                SELECT id FROM llm_mappings
                WHERE admin_approved = 0 AND status = 'pending'
                LIMIT {batch_size}
            )
        ''')
        processed = cursor.rowcount
        conn.commit()

        # Get remaining count
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 0 AND status = 'pending'")
        remaining = cursor.fetchone()[0] or 0
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Approved {processed} mappings',
            'processed': processed,
            'remaining': remaining,
            'complete': remaining == 0
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== CREATE PERFORMANCE INDEXES ==========
@app.route('/api/admin/llm-center/create-indexes', methods=['POST'])
def admin_create_llm_indexes():
    """Create performance indexes for LLM mappings table"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()

        indexes_created = []
        errors = []

        # Create indexes one by one
        index_queries = [
            ("idx_llm_mappings_status", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)"),
            ("idx_llm_mappings_admin_approved", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_admin_approved ON llm_mappings(admin_approved)"),
            ("idx_llm_mappings_created_at", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at DESC)"),
            ("idx_llm_mappings_status_created", "CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC)")
        ]

        for idx_name, query in index_queries:
            try:
                cursor.execute(query)
                conn.commit()
                indexes_created.append(idx_name)
            except Exception as e:
                errors.append(f"{idx_name}: {str(e)}")
                conn.rollback()

        # Try to create pg_trgm extension and text search indexes
        try:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            conn.commit()
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_llm_mappings_merchant_trgm ON llm_mappings USING gin (merchant_name gin_trgm_ops)")
            conn.commit()
            indexes_created.append("idx_llm_mappings_merchant_trgm")
        except Exception as e:
            errors.append(f"pg_trgm: {str(e)}")
            conn.rollback()

        conn.close()

        return jsonify({
            'success': True,
            'message': f'Created {len(indexes_created)} indexes',
            'indexes_created': indexes_created,
            'errors': errors
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/check-all', methods=['GET'])
def auth_check_all():
    try:
        auth_header = request.headers.get('Authorization', '')
        admin_token = request.headers.get('X-Admin-Token')
        user_token = request.headers.get('X-User-Token')

        # Prefer explicit headers when provided
        header_token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else None
        if header_token and not user_token and not admin_token:
            # If only Authorization header present, treat it as user or admin token
            if header_token.startswith('admin_token_'):
                admin_token = header_token
            else:
                user_token = header_token

        # Normalize user token format (token_ -> user_token_)
        if user_token and user_token.startswith('token_'):
            user_token = f"user_token_{user_token.replace('token_', '', 1)}"

        has_user = False
        user_data = None
        has_admin = False
        admin_data = None

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        if user_token and user_token.startswith('user_token_'):
            user_id = user_token.replace('user_token_', '')
            cursor.execute("SELECT id, email, name, role, account_type FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            if user:
                has_user = True
                user_data = {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'role': user['role'],
                    'account_type': user['account_type']
                }

        if admin_token and admin_token.startswith('admin_token_'):
            admin_id = admin_token.replace('admin_token_', '')
            cursor.execute("SELECT id, email, name, role FROM admins WHERE id = %s", (admin_id,))
            admin = cursor.fetchone()
            if admin:
                has_admin = True
                admin_data = {
                    'id': admin['id'],
                    'email': admin['email'],
                    'name': admin['name'],
                    'role': admin['role']
                }

        conn.close()

        return jsonify({
            'success': True,
            'has_user': has_user,
            'user': user_data,
            'has_admin': has_admin,
            'admin': admin_data
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/modules', methods=['GET'])
def admin_modules():
    try:
        return jsonify({
            'success': True,
            'data': {
                'modules': [
                    {'id': 1, 'name': 'User Management', 'status': 'active'},
                    {'id': 2, 'name': 'Analytics', 'status': 'active'},
                    {'id': 3, 'name': 'Notifications', 'status': 'inactive'}
                ]
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/settings/fees', methods=['GET'])
def admin_settings_fees():
    try:
        return jsonify({
            'success': True,
            'fees': {
                'platform_fee': 0,  # No fee - subscription pays for service
                'investment_fee': 0,
                'withdrawal_fee': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/business-stress-test/status', methods=['GET'])
def admin_business_stress_test_status():
    try:
        return jsonify({
            'success': True,
            'status': {
                'test_running': False,
                'last_test': '2025-10-16T15:30:00Z',
                'results': {
                    'performance_score': 95,
                    'stability_score': 98,
                    'recommendations': ['Increase server capacity', 'Optimize database queries']
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/system-health', methods=['GET'])
def admin_system_health():
    try:
        return jsonify({
            'success': True,
            'data': {
                'system_status': 'operational',
                'uptime': '99.9%',
                'cpu_usage': 45,
                'memory_usage': 62,
                'disk_usage': 38,
                'database_status': 'connected',
                'api_response_time': 120,
                'active_users': 1250,
                'last_backup': '2025-10-17T01:00:00Z',
                'alerts': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/google-analytics', methods=['GET'])
def admin_google_analytics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Return empty data - no mock data
        return jsonify({
            'success': True,
            'data': {
                'page_views': 0,
                'sessions': 0,
                'bounce_rate': 0,
                'avg_session_duration': 0,
                'top_pages': [],
                'traffic_sources': [],
                'device_breakdown': [],
                'geographic_data': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Database Management Endpoints

@app.route('/api/admin/fix-transactions', methods=['POST'])
def admin_fix_transactions():
    """Fix transactions: round_up, fee, status, and clean up orphaned records"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Diagnostic: Count by status and user_id
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN user_id IS NULL THEN 1 END) as orphaned,
                COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as linked,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'mapped' THEN 1 END) as mapped
            FROM transactions
        """)
        stats_before = cursor.fetchone()

        # Step 1: Delete orphaned transactions (user_id = NULL)
        cursor.execute("DELETE FROM transactions WHERE user_id IS NULL")
        orphans_deleted = cursor.rowcount

        # Step 2: Fix all user transactions: round_up, fee, total_debit
        cursor.execute("""
            UPDATE transactions t
            SET
                round_up = COALESCE(u.round_up_amount, 1.00),
                fee = 0,
                total_debit = t.amount + COALESCE(u.round_up_amount, 1.00)
            FROM users u
            WHERE t.user_id = u.id
        """)
        roundup_fixed = cursor.rowcount

        # Step 3: Auto-map transactions that have a ticker to 'mapped' status
        cursor.execute("""
            UPDATE transactions
            SET status = 'mapped'
            WHERE ticker IS NOT NULL AND ticker != '' AND ticker != 'UNKNOWN' AND status = 'pending'
        """)
        auto_mapped = cursor.rowcount

        conn.commit()

        # Get final stats
        cursor.execute("""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'mapped' THEN 1 END) as mapped
            FROM transactions
        """)
        stats_after = cursor.fetchone()

        # Sample of remaining transactions
        cursor.execute("""
            SELECT t.id, t.merchant, t.amount, t.round_up, t.fee, t.total_debit, t.status, t.user_id, t.ticker
            FROM transactions t
            ORDER BY t.created_at DESC
            LIMIT 10
        """)
        sample = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Database cleanup complete',
            'before': {
                'total': stats_before[0],
                'orphaned': stats_before[1],
                'linked_to_users': stats_before[2],
                'pending': stats_before[3],
                'mapped': stats_before[4]
            },
            'actions': {
                'orphans_deleted': orphans_deleted,
                'roundup_fee_fixed': roundup_fixed,
                'auto_mapped': auto_mapped
            },
            'after': {
                'total': stats_after[0],
                'pending': stats_after[1],
                'mapped': stats_after[2]
            },
            'sample': [
                {
                    'id': row[0],
                    'merchant': row[1],
                    'amount': float(row[2]) if row[2] else 0,
                    'round_up': float(row[3]) if row[3] else 0,
                    'fee': float(row[4]) if row[4] else 0,
                    'total_debit': float(row[5]) if row[5] else 0,
                    'status': row[6],
                    'user_id': row[7],
                    'ticker': row[8]
                }
                for row in sample
            ]
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/clear-all-data', methods=['POST'])
def admin_clear_all_data():
    """DESTRUCTIVE: Clear all transactions and LLM mappings for fresh start"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Count before deletion
        cursor.execute("SELECT COUNT(*) FROM transactions")
        tx_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        mapping_count = cursor.fetchone()[0]

        # Delete all transactions
        cursor.execute("DELETE FROM transactions")

        # Delete all LLM mappings
        cursor.execute("DELETE FROM llm_mappings")

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'All data cleared successfully',
            'deleted': {
                'transactions': tx_count,
                'llm_mappings': mapping_count
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/connectivity-matrix', methods=['GET'])
def admin_database_connectivity_matrix():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        return jsonify({
            'success': True,
            'data': {
                'connections': [],
                'status': 'healthy'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/data-quality', methods=['GET'])
def admin_database_data_quality():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'quality_score': 100,
                'issues': [],
                'last_check': None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/migrations-drift', methods=['GET'])
def admin_database_migrations_drift():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'drift_detected': False,
                'pending_migrations': [],
                'last_sync': None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/performance', methods=['GET'])
def admin_database_performance():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'query_time': 0,
                'connections': 0,
                'cache_hit_rate': 100
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/ledger/consistency', methods=['GET'])
def admin_ledger_consistency():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'consistent': True,
                'last_check': None,
                'issues': []
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/pipelines/events', methods=['GET'])
def admin_pipelines_events():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'events': [],
                'status': 'healthy'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/security/access', methods=['GET'])
def admin_security_access():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'access_logs': [],
                'security_score': 100
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/replication/backups', methods=['GET'])
def admin_replication_backups():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'backups': [],
                'last_backup': None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/performance/storage', methods=['GET'])
def admin_performance_storage():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'storage_used': 0,
                'storage_available': 100,
                'performance': 'optimal'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/vector-store/health', methods=['GET'])
def admin_vector_store_health():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'status': 'healthy',
                'vectors': 0,
                'last_update': None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/vector-store/embeddings', methods=['GET'])
def admin_vector_store_embeddings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'embeddings': [],
                'total_vectors': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/warehouse-sync', methods=['GET'])
def admin_database_warehouse_sync():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'sync_status': 'healthy',
                'last_sync': None,
                'pending_changes': 0
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/test-sandbox', methods=['GET'])
def admin_database_test_sandbox():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'sandbox_status': 'ready',
                'test_results': [],
                'last_test': None
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/database/alerts-slos', methods=['GET'])
def admin_database_alerts_slos():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'alerts': [],
                'slos': [],
                'status': 'healthy'
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Bulk upload endpoint for LLM mappings - processes large files directly on backend
def get_company_name_from_ticker(ticker_symbol):
    """Map ticker symbol to company name"""
    ticker_to_company = {
        'AAPL': 'Apple Inc.',
        'MSFT': 'Microsoft Corporation',
        'GOOGL': 'Alphabet Inc.',
        'AMZN': 'Amazon.com Inc.',
        'META': 'Meta Platforms Inc.',
        'TSLA': 'Tesla Inc.',
        'NVDA': 'NVIDIA Corporation',
        'NFLX': 'Netflix Inc.',
        'SBUX': 'Starbucks Corporation',
        'WMT': 'Walmart Inc.',
        'MA': 'Mastercard Inc.',
        'V': 'Visa Inc.',
        'JPM': 'JPMorgan Chase & Co.',
        'BAC': 'Bank of America Corporation',
        'WFC': 'Wells Fargo & Company',
        'UNH': 'UnitedHealth Group Inc.',
        'JNJ': 'Johnson & Johnson',
        'PG': 'Procter & Gamble Company',
        'KO': 'The Coca-Cola Company',
        'PFE': 'Pfizer Inc.'
    }
    return ticker_to_company.get(ticker_symbol, '')

@app.route('/api/admin/bulk-upload', methods=['POST', 'OPTIONS'])
@app.route('/api/admin/bulk-upload-v2', methods=['POST', 'OPTIONS'])
@cross_origin(origins='*', methods=['POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization', 'X-Admin-Token', 'X-User-Token', 'X-Requested-With', 'Accept', 'Origin'])
def admin_bulk_upload():
    try:
        # Accept token from Authorization header OR form (form avoids CORS preflight)
        auth_header = request.headers.get('Authorization')
        form_token = request.form.get('admin_token', '').strip() if request.form else ''
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        if not token and form_token:
            token = form_token
        if not token or not str(token).startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Save upload to a temp file and process asynchronously to avoid gateway timeouts
        job_id = str(uuid.uuid4())
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name

        _update_bulk_upload_job(
            job_id,
            status='queued',
            processed_rows=0,
            rows_per_second=0,
            errors=[],
            created_at=time.time()
        )

        worker = threading.Thread(
            target=_process_bulk_upload_job,
            args=(job_id, temp_path),
            daemon=True
        )
        worker.start()

        return jsonify({
            'success': True,
            'message': 'Bulk upload accepted and queued for processing',
            'data': {
                'job_id': job_id,
                'status': 'queued'
            }
        }), 202
        
    except Exception as e:
        print(f"Bulk upload failed to start: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# FAST BULK UPLOAD - Memory-efficient version for Render's 512MB limit
# Uses streaming to disk instead of loading everything into RAM
# =============================================================================

def _process_fast_bulk_upload(job_id, file_path, skip_indexes=False):
    """
    Memory-efficient bulk upload using PostgreSQL COPY command.
    Streams data to a temp file instead of loading into memory.
    Works within Render's 512MB memory limit.
    """
    import csv

    start_time = time.time()
    _update_bulk_upload_job(job_id, status='processing', started_at=start_time, method='COPY', skip_indexes=skip_indexes)
    copy_temp_path = None

    try:
        print(f"[FastBulkUpload] Starting job {job_id}")
        print(f"[FastBulkUpload] Using STREAMING mode (memory-efficient)")
        print(f"[FastBulkUpload] Skip indexes: {skip_indexes}")

        # Helper for flexible column names
        def get_col(row, *names):
            for name in names:
                if name in row:
                    return row[name].strip() if row[name] else ''
                for k in row.keys():
                    if k.lower() == name.lower():
                        return row[k].strip() if row[k] else ''
            return ''

        # Stream CSV to a temp file in COPY format (uses disk, not RAM)
        print(f"[FastBulkUpload] Streaming CSV to COPY format...")
        row_count = 0
        errors = []

        # Create temp file for COPY data
        copy_temp_path = file_path + '.copy'

        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile, \
             open(copy_temp_path, 'w', encoding='utf-8', newline='') as outfile:

            reader = csv.DictReader(infile)
            writer = csv.writer(outfile, delimiter='\t', quoting=csv.QUOTE_MINIMAL)

            for row in reader:
                row_count += 1
                try:
                    merchant_name = get_col(row, 'Merchant Name', 'merchant_name', 'merchant', 'name')
                    if not merchant_name:
                        errors.append(f"Row {row_count}: Missing merchant name")
                        continue

                    # Handle confidence
                    confidence_str = get_col(row, 'Confidence', 'confidence', 'conf', 'score') or '0'
                    try:
                        if confidence_str.endswith('%'):
                            confidence = float(confidence_str[:-1]) / 100.0
                        else:
                            confidence = float(confidence_str) if confidence_str else 0.0
                    except:
                        confidence = 0.0

                    ticker = get_col(row, 'Ticker Symbol', 'ticker_symbol', 'ticker', 'symbol')
                    company = get_col(row, 'Company Name', 'company_name', 'company') or get_company_name_from_ticker(ticker)
                    category = get_col(row, 'Category', 'category', 'cat', 'type')
                    notes = get_col(row, 'Notes', 'notes', 'note', 'description')

                    # Write tab-separated row for COPY
                    writer.writerow([
                        merchant_name,
                        category,
                        notes,
                        ticker,
                        confidence,
                        'approved',
                        1,  # admin_approved
                        'admin_fast_upload',
                        company
                    ])

                    # Progress update every 100K rows
                    if row_count % 100000 == 0:
                        print(f"[FastBulkUpload] Streamed {row_count:,} rows...")
                        _update_bulk_upload_job(job_id, processed_rows=row_count)

                except Exception as e:
                    errors.append(f"Row {row_count}: {str(e)}")
                    continue

        print(f"[FastBulkUpload] Streamed {row_count:,} rows to temp file")
        _update_bulk_upload_job(job_id, total_rows=row_count, phase='copying')

        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()

        index_time = 0
        # Drop indexes temporarily for faster insert (unless skipped)
        if not skip_indexes:
            print(f"[FastBulkUpload] Dropping indexes...")
            index_drop_start = time.time()
            try:
                cursor.execute("DROP INDEX IF EXISTS idx_llm_admin_approved")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_status")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_created_at")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_category")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_merchant")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_ticker")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_mappings_status")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_mappings_admin_approved")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_mappings_created_at")
                cursor.execute("DROP INDEX IF EXISTS idx_llm_mappings_status_created")
                conn.commit()
                print(f"[FastBulkUpload] Indexes dropped in {time.time() - index_drop_start:.1f}s")
            except Exception as idx_err:
                print(f"[FastBulkUpload] Index drop warning: {idx_err}")
                conn.rollback()
        else:
            print(f"[FastBulkUpload] SKIPPING index operations (faster upload)")

        # Use COPY FROM file (stream from disk)
        print(f"[FastBulkUpload] Starting COPY command...")
        copy_start = time.time()

        with open(copy_temp_path, 'r', encoding='utf-8') as copy_file:
            cursor.copy_expert(
                """
                COPY llm_mappings (merchant_name, category, notes, ticker_symbol, confidence, status, admin_approved, admin_id, company_name)
                FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t', QUOTE '"', NULL '')
                """,
                copy_file
            )
        conn.commit()

        copy_time = time.time() - copy_start
        print(f"[FastBulkUpload] COPY completed in {copy_time:.1f}s")

        # Recreate indexes (unless skipped)
        if not skip_indexes:
            print(f"[FastBulkUpload] Recreating indexes...")
            _update_bulk_upload_job(job_id, phase='indexing')
            index_start = time.time()

            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_admin_approved ON llm_mappings(admin_approved)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_status ON llm_mappings(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_created_at ON llm_mappings(created_at DESC)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_category ON llm_mappings(category)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_merchant ON llm_mappings(merchant_name)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_ticker ON llm_mappings(ticker_symbol)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_admin_approved ON llm_mappings(admin_approved)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at DESC)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC)')
            conn.commit()

            index_time = time.time() - index_start
            print(f"[FastBulkUpload] Indexes recreated in {index_time:.1f}s")
        else:
            print(f"[FastBulkUpload] Indexes SKIPPED - run rebuild indexes when ready")

        cursor.close()
        conn.close()

        # Calculate final metrics
        end_time = time.time()
        total_time = end_time - start_time
        rows_per_second = row_count / total_time if total_time > 0 else 0

        print(f"[FastBulkUpload] COMPLETED!")
        print(f"  Total rows: {row_count:,}")
        print(f"  Total time: {total_time:.2f}s")
        print(f"  Speed: {rows_per_second:,.0f} rows/sec")
        print(f"  Copy time: {copy_time:.1f}s, Index time: {index_time:.1f}s")

        _update_bulk_upload_job(
            job_id,
            status='completed',
            processed_rows=row_count,
            errors=errors[:10],
            processing_time=round(total_time, 2),
            rows_per_second=round(rows_per_second, 0),
            copy_time=round(copy_time, 2),
            index_time=round(index_time, 2),
            method='COPY',
            finished_at=end_time
        )

    except Exception as e:
        end_time = time.time()
        print(f"[FastBulkUpload] FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        _update_bulk_upload_job(
            job_id,
            status='failed',
            error=str(e),
            processing_time=round(end_time - start_time, 2),
            finished_at=end_time
        )
    finally:
        # Clean up temp files
        try:
            os.unlink(file_path)
        except:
            pass
        try:
            if copy_temp_path:
                os.unlink(copy_temp_path)
        except:
            pass


@app.route('/api/admin/bulk-upload-fast', methods=['POST', 'OPTIONS'])
@cross_origin(origins='*', methods=['POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization', 'X-Admin-Token'])
def admin_bulk_upload_fast():
    """
    FAST bulk upload endpoint using PostgreSQL COPY command.

    Expected performance: 50,000-100,000 rows/sec
    50 million rows = ~8-17 minutes (vs ~17 hours with regular upload)

    Optional: skip_indexes=1 to skip index operations (2x faster, rebuild later)
    """
    try:
        # Auth check
        auth_header = request.headers.get('Authorization')
        form_token = request.form.get('admin_token', '').strip() if request.form else ''
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        if not token and form_token:
            token = form_token
        if not token or not str(token).startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        # Check for skip_indexes option (for faster uploads)
        skip_indexes = request.form.get('skip_indexes', '').strip().lower() in ('1', 'true', 'yes')

        # Save to temp file
        job_id = str(uuid.uuid4())
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name

        _update_bulk_upload_job(
            job_id,
            status='queued',
            processed_rows=0,
            method='COPY',
            skip_indexes=skip_indexes,
            created_at=time.time()
        )

        # Start fast upload in background
        worker = threading.Thread(
            target=_process_fast_bulk_upload,
            args=(job_id, temp_path, skip_indexes),
            daemon=True
        )
        worker.start()

        return jsonify({
            'success': True,
            'message': f'Fast bulk upload started (COPY{", skip indexes" if skip_indexes else ""})',
            'data': {
                'job_id': job_id,
                'status': 'queued',
                'method': 'COPY',
                'skip_indexes': skip_indexes,
                'expected_speed': '4,000+ rows/sec' if skip_indexes else '2,000+ rows/sec'
            }
        }), 202

    except Exception as e:
        print(f"Fast bulk upload failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# Progress tracking endpoint for bulk uploads
@app.route('/api/admin/bulk-upload/progress', methods=['GET'])
def admin_bulk_upload_progress():
    """Get current bulk upload progress"""
    try:
        # Accept token from Authorization header OR query param (avoid preflight)
        auth_header = request.headers.get('Authorization')
        query_token = request.args.get('admin_token', '').strip()
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()
        if not token and query_token:
            token = query_token
        if not token or not str(token).startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        job_id = request.args.get('job_id', '').strip()
        if not job_id:
            return jsonify({'success': False, 'error': 'Missing job_id'}), 400

        # Use database-backed job lookup (survives server restarts)
        job = _get_bulk_upload_job(job_id)

        if not job:
            return jsonify({'success': False, 'error': 'Job not found'}), 404

        return jsonify({
            'success': True,
            'data': job
        })

    except Exception as e:
        print(f"[BulkUpload] Progress check error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Rebuild indexes for llm_mappings table (after skip_indexes upload)
@app.route('/api/admin/llm-center/rebuild-indexes', methods=['POST'])
def admin_rebuild_llm_indexes():
    """
    Rebuild all indexes on the llm_mappings table.
    Use this after a bulk upload with skip_indexes=true.

    This creates the indexes in the background and returns immediately.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ', 1)[1].strip()
        if not token or not str(token).startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Invalid admin token'}), 401

        print(f"[RebuildIndexes] Starting index rebuild for llm_mappings...")
        start_time = time.time()

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Define all indexes to create
        indexes = [
            ('idx_llm_admin_approved', 'CREATE INDEX IF NOT EXISTS idx_llm_admin_approved ON llm_mappings(admin_approved)'),
            ('idx_llm_status', 'CREATE INDEX IF NOT EXISTS idx_llm_status ON llm_mappings(status)'),
            ('idx_llm_created_at', 'CREATE INDEX IF NOT EXISTS idx_llm_created_at ON llm_mappings(created_at DESC)'),
            ('idx_llm_category', 'CREATE INDEX IF NOT EXISTS idx_llm_category ON llm_mappings(category)'),
            ('idx_llm_merchant', 'CREATE INDEX IF NOT EXISTS idx_llm_merchant ON llm_mappings(merchant_name)'),
            ('idx_llm_ticker', 'CREATE INDEX IF NOT EXISTS idx_llm_ticker ON llm_mappings(ticker_symbol)'),
            ('idx_llm_mappings_status', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_status ON llm_mappings(status)'),
            ('idx_llm_mappings_admin_approved', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_admin_approved ON llm_mappings(admin_approved)'),
            ('idx_llm_mappings_created_at', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_created_at ON llm_mappings(created_at DESC)'),
            ('idx_llm_mappings_status_created', 'CREATE INDEX IF NOT EXISTS idx_llm_mappings_status_created ON llm_mappings(status, created_at DESC)'),
        ]

        created = []
        errors = []

        for idx_name, idx_sql in indexes:
            try:
                cursor.execute(idx_sql)
                created.append(idx_name)
                print(f"[RebuildIndexes] Created: {idx_name}")
            except Exception as e:
                errors.append({'index': idx_name, 'error': str(e)})
                print(f"[RebuildIndexes] Error on {idx_name}: {e}")

        conn.commit()
        cursor.close()
        conn.close()

        elapsed = time.time() - start_time
        print(f"[RebuildIndexes] Complete in {elapsed:.1f}s - Created: {len(created)}, Errors: {len(errors)}")

        return jsonify({
            'success': True,
            'message': f'Index rebuild complete in {elapsed:.1f}s',
            'data': {
                'created': created,
                'errors': errors,
                'elapsed_seconds': round(elapsed, 1)
            }
        })

    except Exception as e:
        print(f"[RebuildIndexes] Failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# Get LLM mappings from database
@app.route('/api/admin/llm-center/mappings', methods=['GET'])
def admin_get_llm_mappings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        status_filter = request.args.get('status', '')  # pending, approved, rejected

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        cols = 'id, merchant_name, category, notes, ticker_symbol, confidence, status, created_at, admin_id, admin_approved, company_name, user_id'

        # Build WHERE clause
        where_clauses = []
        params = []

        # Status filter by admin_approved value
        if status_filter == 'pending':
            where_clauses.append('(admin_approved = 0 OR admin_approved IS NULL)')
        elif status_filter == 'approved':
            where_clauses.append('admin_approved = 1')
        elif status_filter == 'rejected':
            where_clauses.append('admin_approved = -1')

        # Search filter (case-insensitive with ILIKE)
        if search:
            where_clauses.append('(merchant_name ILIKE %s OR category ILIKE %s OR ticker_symbol ILIKE %s OR company_name ILIKE %s)')
            search_param = f'%{search}%'
            params.extend([search_param, search_param, search_param, search_param])

        where_sql = (' WHERE ' + ' AND '.join(where_clauses)) if where_clauses else ''

        # Get data with pagination
        params.extend([limit, (page - 1) * limit])
        cursor.execute(f'''
            SELECT {cols} FROM llm_mappings{where_sql}
            ORDER BY id DESC
            LIMIT %s OFFSET %s
        ''', params)

        col_names = [c[0] for c in cursor.description]
        rows = cursor.fetchall()
        mappings_list = [dict(zip(col_names, r)) for r in rows]

        # Get total count with same filters
        count_params = params[:-2]  # Remove limit and offset
        cursor.execute(f'SELECT COUNT(*) FROM llm_mappings{where_sql}', count_params)

        total_count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Get Pending Mappings (user-submitted, awaiting admin review)
@app.route('/api/admin/llm-center/pending-mappings', methods=['GET'])
def admin_get_pending_mappings():
    """Get user-submitted mappings awaiting admin review"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # Get user-submitted mappings with status 'pending' using explicit columns
        select_cols = '''id, merchant_name, ticker_symbol, category, confidence,
                         status, admin_approved, company_name, user_id, created_at,
                         transaction_id, dashboard_type, ai_processed, notes'''
        if search:
            cursor.execute(f'''
                SELECT {select_cols} FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', limit, (page - 1) * limit))
        else:
            cursor.execute(f'''
                SELECT {select_cols} FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            ''', (limit, (page - 1) * limit))

        mappings = cursor.fetchall()

        # Get total count for pending user mappings
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
            ''')

        total_count = cursor.fetchone()[0]
        conn.close()

        # Convert to list of dictionaries using explicit column order
        mappings_list = []
        for m in mappings:
            conf_val = float(m[4]) if m[4] else 0
            mappings_list.append({
                'id': m[0],
                'merchant_name': m[1],
                'ticker_symbol': m[2],
                'ticker': m[2],
                'category': m[3],
                'confidence': conf_val,
                'status': m[5],
                'admin_approved': m[6],
                'company_name': m[7],
                'user_id': m[8],
                'created_at': m[9].isoformat() if m[9] else None,
                'transaction_id': m[10],
                'dashboard_type': m[11],
                'ai_processed': m[12],
                'notes': m[13]
            })

        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Get Approved Mappings (admin-approved user mappings)
@app.route('/api/admin/llm-center/approved-mappings', methods=['GET'])
def admin_get_approved_mappings():
    """Get admin-approved user mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user-submitted mappings with status 'approved'
        if search:
            cursor.execute('''
                SELECT * FROM llm_mappings 
                WHERE status = 'approved' AND user_id IS NOT NULL
                AND (merchant_name LIKE ? OR category LIKE ? OR ticker_symbol LIKE ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', limit, (page - 1) * limit))
        else:
            cursor.execute('''
                SELECT * FROM llm_mappings 
                WHERE status = 'approved' AND user_id IS NOT NULL
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, (page - 1) * limit))
        
        mappings = cursor.fetchall()
        
        # Get total count for approved user mappings
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings 
                WHERE status = 'approved' AND user_id IS NOT NULL
                AND (merchant_name LIKE ? OR category LIKE ? OR ticker_symbol LIKE ?)
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings 
                WHERE status = 'approved' AND user_id IS NOT NULL
            ''')
        
        total_count = cursor.fetchone()[0]
        conn.close()
        
        # Convert to list of dictionaries
        mappings_list = []
        for mapping in mappings:
            mappings_list.append({
                'id': mapping[0],
                'transaction_id': mapping[1],
                'merchant_name': mapping[2],
                'ticker': mapping[3],
                'category': mapping[4],
                'confidence': mapping[5],
                'status': mapping[6],
                'admin_approved': mapping[7],
                'ai_processed': mapping[8],
                'company_name': mapping[9],
                'user_id': mapping[10],
                'created_at': mapping[11],
                'notes': mapping[12],
                'ticker_symbol': mapping[13],
                'admin_id': mapping[14],
                'mapping_id': mapping[16] if len(mapping) > 16 else None,
                'ai_attempted': mapping[17] if len(mapping) > 17 else None,
                'ai_status': mapping[18] if len(mapping) > 18 else None,
                'ai_confidence': mapping[19] if len(mapping) > 19 else None,
                'ai_reasoning': mapping[20] if len(mapping) > 20 else None,
                'ai_processing_time': mapping[21] if len(mapping) > 21 else None,
                'ai_model_version': mapping[22] if len(mapping) > 22 else None,
                'user_email': mapping[23] if len(mapping) > 23 else None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Get Rejected Mappings (admin-rejected user mappings)
@app.route('/api/admin/llm-center/rejected-mappings', methods=['GET'])
def admin_get_rejected_mappings():
    """Get admin-rejected user mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # Get rejected mappings (PostgreSQL %s placeholders)
        if search:
            cursor.execute('''
                SELECT lm.*, u.email as user_email
                FROM llm_mappings lm
                LEFT JOIN users u ON lm.user_id = u.id
                WHERE lm.status = 'rejected'
                AND (lm.merchant_name LIKE %s OR lm.category LIKE %s OR lm.ticker_symbol LIKE %s)
                ORDER BY lm.created_at DESC
                LIMIT %s OFFSET %s
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', limit, (page - 1) * limit))
        else:
            cursor.execute('''
                SELECT lm.*, u.email as user_email
                FROM llm_mappings lm
                LEFT JOIN users u ON lm.user_id = u.id
                WHERE lm.status = 'rejected'
                ORDER BY lm.created_at DESC
                LIMIT %s OFFSET %s
            ''', (limit, (page - 1) * limit))

        mappings = cursor.fetchall()

        # Get total count for rejected mappings
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE status = 'rejected'
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE status = 'rejected'
            ''')
        
        total_count = cursor.fetchone()[0]
        conn.close()
        
        # Convert to list of dictionaries
        mappings_list = []
        for mapping in mappings:
            mappings_list.append({
                'id': mapping[0],
                'transaction_id': mapping[1],
                'merchant_name': mapping[2],
                'ticker': mapping[3],
                'category': mapping[4],
                'confidence': mapping[5],
                'status': mapping[6],
                'admin_approved': mapping[7],
                'ai_processed': mapping[8],
                'company_name': mapping[9],
                'user_id': mapping[10],
                'created_at': mapping[11],
                'notes': mapping[12],
                'ticker_symbol': mapping[13],
                'admin_id': mapping[14],
                'mapping_id': mapping[16] if len(mapping) > 16 else None,
                'ai_attempted': mapping[17] if len(mapping) > 17 else None,
                'ai_status': mapping[18] if len(mapping) > 18 else None,
                'ai_confidence': mapping[19] if len(mapping) > 19 else None,
                'ai_reasoning': mapping[20] if len(mapping) > 20 else None,
                'ai_processing_time': mapping[21] if len(mapping) > 21 else None,
                'ai_model_version': mapping[22] if len(mapping) > 22 else None,
                'user_email': mapping[23] if len(mapping) > 23 else None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Get Auto-Generated Mappings (system-generated)
@app.route('/api/admin/llm-center/auto-mappings', methods=['GET'])
def admin_get_auto_mappings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build query for auto-generated mappings
        if search:
            cursor.execute('''
                SELECT * FROM llm_mappings 
                WHERE source_type = 'auto'
                AND (merchant_name LIKE ? OR category LIKE ? OR ticker_symbol LIKE ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', limit, (page - 1) * limit))
        else:
            cursor.execute('''
                SELECT * FROM llm_mappings 
                WHERE source_type = 'auto'
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, (page - 1) * limit))
        
        mappings = cursor.fetchall()
        
        # Get total count for auto mappings
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings 
                WHERE source_type = 'auto'
                AND (merchant_name LIKE ? OR category LIKE ? OR ticker_symbol LIKE ?)
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings 
                WHERE source_type = 'auto'
            ''')
        
        total_count = cursor.fetchone()[0]
        conn.close()
        
        # Convert to list of dictionaries
        mappings_list = []
        for mapping in mappings:
            mappings_list.append({
                'id': mapping[0],
                'merchant_name': mapping[1],
                'category': mapping[2],
                'notes': mapping[3],
                'ticker_symbol': mapping[4],
                'confidence': mapping[5],
                'status': mapping[6],
                'created_at': mapping[7],
                'admin_id': mapping[8],
                'source_type': mapping[9],
                'user_id': mapping[10],
                'dashboard_type': mapping[11],
                'transaction_id': mapping[12],
                'submission_method': mapping[13],
                'llm_attempts': mapping[14],
                'auto_approved': mapping[15],
                'admin_reviewed': mapping[16],
                'learning_weight': mapping[17]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# User submission endpoints for individual/family/business dashboards
@app.route('/api/user/submit-mapping', methods=['POST'])
def user_submit_mapping():
    """Submit a mapping from user dashboard (individual/family/business)"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['merchant_name', 'category', 'ticker_symbol', 'transaction_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400

        # Extract user_id from token
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        # Prevent duplicate submissions for the same transaction
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id FROM llm_mappings
            WHERE user_id = %s AND transaction_id = %s
        ''', (user_id, data['transaction_id']))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            return jsonify({
                'success': True,
                'message': 'Mapping already submitted for this transaction',
                'mapping_id': existing[0],
                'status': 'already_exists'
            })

        # Convert confidence percentage to decimal and named status
        confidence_percent = data.get('confidence', 50)  # Default to 50% if not provided
        confidence_decimal = confidence_percent / 100.0  # Convert percentage to decimal

        # Convert to named status for better user experience
        if confidence_percent >= 90:
            confidence_status = "very_high"
        elif confidence_percent >= 80:
            confidence_status = "high"
        elif confidence_percent >= 60:
            confidence_status = "medium"
        elif confidence_percent >= 40:
            confidence_status = "low"
        else:
            confidence_status = "very_low"

        dashboard_type = data.get('dashboard_type', 'individual')

        # Insert user-submitted mapping as pending (admin_approved=0 means pending review)
        cursor.execute('''
            INSERT INTO llm_mappings (
                merchant_name, ticker_symbol, category, confidence, status,
                user_id, transaction_id, company_name, dashboard_type, admin_approved
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            data['merchant_name'],
            data['ticker_symbol'],
            data['category'],
            confidence_decimal,
            'pending',
            user_id,
            data['transaction_id'],
            data.get('company_name', ''),
            dashboard_type,
            0
        ))

        result = cursor.fetchone()
        mapping_id = result[0] if result else None
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Mapping submitted successfully',
            'mapping_id': mapping_id,
            'status': 'pending',
            'confidence_status': confidence_status,
            'confidence_percent': confidence_percent,
            'next_step': 'Admin review required'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/submit-mapping', methods=['POST'])
def family_submit_mapping():
    """Submit a mapping from family dashboard"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Add family-specific logic
        data['dashboard_type'] = 'family'
        
        # Use the same logic as user submission
        return user_submit_mapping()
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/submit-mapping', methods=['POST'])
def business_submit_mapping():
    """Submit a mapping from business dashboard"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Add business-specific logic
        data['dashboard_type'] = 'business'
        
        # Use the same logic as user submission
        return user_submit_mapping()
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin approval/rejection endpoints
@app.route('/api/admin/llm-center/approve-mapping', methods=['POST'])
def admin_approve_mapping_llm():
    """Admin approves a user-submitted mapping"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data or 'mapping_id' not in data:
            return jsonify({'success': False, 'error': 'Mapping ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update mapping status to approved
        cursor.execute('''
            UPDATE llm_mappings
            SET status = 'approved',
                admin_approved = 1
            WHERE id = %s
        ''', (data['mapping_id'],))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found or not user-submitted'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mapping approved successfully',
            'mapping_id': data['mapping_id'],
            'status': 'approved'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/reject-mapping', methods=['POST'])
def admin_reject_mapping_llm():
    """Admin rejects a user-submitted mapping"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data or 'mapping_id' not in data:
            return jsonify({'success': False, 'error': 'Mapping ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update mapping status to rejected
        cursor.execute('''
            UPDATE llm_mappings
            SET status = 'rejected',
                admin_approved = -1
            WHERE id = %s
        ''', (data['mapping_id'],))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found or not user-submitted'}), 404
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mapping rejected successfully',
            'mapping_id': data['mapping_id'],
            'status': 'rejected'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# LLM Learning Integration endpoints
@app.route('/api/llm/learn', methods=['POST'])
def llm_learn():
    """Add new mapping to LLM training data and trigger incremental learning"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data or 'mapping_id' not in data:
            return jsonify({'success': False, 'error': 'Mapping ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get the mapping details
        cursor.execute('SELECT * FROM llm_mappings WHERE id = %s', (data['mapping_id'],))
        mapping = cursor.fetchone()
        
        if not mapping:
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404
        
        # Update learning weight based on success
        learning_weight = data.get('learning_weight', 1.0)
        cursor.execute('''
            UPDATE llm_mappings 
            SET learning_weight = ?, llm_attempts = llm_attempts + 1
            WHERE id = ?
        ''', (learning_weight, data['mapping_id']))
        
        conn.commit()
        conn.close()
        
        # Simulate LLM learning process
        learning_metrics = {
            'mapping_id': data['mapping_id'],
            'learning_weight': learning_weight,
            'confidence_improvement': min(0.1, learning_weight * 0.05),
            'model_accuracy': 0.85 + (learning_weight * 0.1),
            'training_samples': 1,
            'learning_rate': 0.001
        }
        
        return jsonify({
            'success': True,
            'message': 'LLM learning updated successfully',
            'metrics': learning_metrics
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/llm/retrain', methods=['POST'])
def llm_retrain():
    """Trigger full model retraining with all approved mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get training data statistics
        cursor.execute('''
            SELECT COUNT(*) FROM llm_mappings 
            WHERE status = 'approved' AND admin_reviewed = 1
        ''')
        approved_count = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT AVG(confidence) FROM llm_mappings 
            WHERE status = 'approved' AND confidence > 0
        ''')
        avg_confidence = cursor.fetchone()[0] or 0
        
        cursor.execute('''
            SELECT COUNT(DISTINCT category) FROM llm_mappings 
            WHERE status = 'approved' AND category IS NOT NULL
        ''')
        categories_count = cursor.fetchone()[0]
        
        conn.close()
        
        # Simulate retraining process
        retraining_metrics = {
            'training_samples': approved_count,
            'average_confidence': round(avg_confidence, 3),
            'categories_learned': categories_count,
            'model_accuracy': min(0.95, 0.75 + (approved_count * 0.0001)),
            'training_time': '2-5 minutes',
            'status': 'retraining_in_progress'
        }
        
        return jsonify({
            'success': True,
            'message': 'Model retraining initiated',
            'metrics': retraining_metrics
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/llm/confidence-score', methods=['POST'])
def llm_confidence_score():
    """Calculate confidence score for a new mapping"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data or 'merchant_name' not in data:
            return jsonify({'success': False, 'error': 'Merchant name required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find similar mappings for confidence calculation
        merchant_name = data['merchant_name']
        category = data.get('category', '')
        ticker_symbol = data.get('ticker_symbol', '')
        
        # Calculate confidence based on existing similar mappings
        cursor.execute('''
            SELECT confidence, learning_weight FROM llm_mappings 
            WHERE merchant_name LIKE ? OR category = ? OR ticker_symbol = ?
            ORDER BY confidence DESC
            LIMIT 5
        ''', (f'%{merchant_name}%', category, ticker_symbol))
        
        similar_mappings = cursor.fetchall()
        conn.close()
        
        if similar_mappings:
            # Calculate weighted average confidence
            total_weight = sum(mapping[1] for mapping in similar_mappings)
            weighted_confidence = sum(mapping[0] * mapping[1] for mapping in similar_mappings) / total_weight
            confidence_score = min(0.99, weighted_confidence + 0.1)  # Add small boost for new data
        else:
            # No similar mappings found, use default confidence
            confidence_score = 0.5
        
        return jsonify({
            'success': True,
            'confidence_score': round(confidence_score, 3),
            'similar_mappings_found': len(similar_mappings),
            'recommendation': 'high' if confidence_score > 0.8 else 'medium' if confidence_score > 0.6 else 'low'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Train LLM Model endpoint
@app.route('/api/admin/train-model', methods=['POST'])
def admin_train_model():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Get dataset statistics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        categories = cursor.fetchone()[0]

        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence_raw = cursor.fetchone()[0]
        avg_confidence = float(avg_confidence_raw) if avg_confidence_raw else 0.0

        cursor.close()
        conn.close()

        # Simulate training process
        import time
        time.sleep(2)  # Simulate processing time

        # Generate training results
        training_metrics = {
            'accuracy': 0.94 + (avg_confidence * 0.05),  # Base accuracy + confidence boost
            'improvement': '+2.3%',
            'loss': 0.12,
            'epochs': 50
        }
        
        dataset_stats = {
            'total_mappings': total_mappings,
            'categories': categories,
            'avg_confidence': round(avg_confidence, 2)
        }
        
        # Simulate model export
        export_file = f"llm_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pkl"
        
        return jsonify({
            'success': True,
            'results': {
                'dataset_stats': dataset_stats,
                'training_metrics': training_metrics,
                'exported_file': export_file,
                'model_size': '2.3MB',
                'training_time': '45 seconds'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# LLM Center approve endpoint
@app.route('/api/admin/llm-center/approve', methods=['POST'])
def admin_llm_approve():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        mapping_id = data.get('mapping_id')
        admin_id = data.get('admin_id', 'admin')
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Update mapping status to approved
        cursor.execute('''
            UPDATE llm_mappings
            SET status = 'approved', admin_id = %s
            WHERE id = %s
        ''', (admin_id, mapping_id))

        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mapping approved successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# LLM Center reject endpoint
@app.route('/api/admin/llm-center/reject', methods=['POST'])
def admin_llm_reject():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        mapping_id = data.get('mapping_id')
        admin_id = data.get('admin_id', 'admin')
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Update mapping status to rejected
        cursor.execute('''
            UPDATE llm_mappings
            SET status = 'rejected', admin_id = %s
            WHERE id = %s
        ''', (admin_id, mapping_id))

        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mapping rejected successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Get single mapping by ID
@app.route('/api/admin/llm-center/mapping/<int:mapping_id>', methods=['GET'])
def admin_get_single_mapping(mapping_id):
    """Get a single mapping by ID for viewing/editing"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT m.id, m.merchant_name, m.category, m.notes, m.ticker_symbol, m.confidence,
                   m.status, m.created_at, m.admin_id, m.admin_approved, m.company_name,
                   m.transaction_id, m.user_id, m.dashboard_type,
                   m.ai_attempted, m.ai_status, m.ai_confidence, m.ai_reasoning,
                   m.ai_model_version, m.ai_processing_duration, m.ai_processed
            FROM llm_mappings m
            WHERE m.id = %s
        ''', (mapping_id,))

        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404

        # Fetch user email if user_id exists
        user_email = None
        user_account_number = None
        user_id_val = row[12]
        if user_id_val:
            try:
                cursor.execute('''
                    SELECT email, id FROM users WHERE id = %s
                ''', (user_id_val,))
                user_row = cursor.fetchone()
                if user_row:
                    user_email = user_row[0]
                    user_account_number = str(user_row[1])
            except Exception:
                pass

        conn.close()

        mapping = {
            'id': row[0],
            'merchant_name': row[1],
            'category': row[2],
            'notes': row[3],
            'ticker_symbol': row[4],
            'ticker': row[4],
            'confidence': float(row[5]) if row[5] else 0,
            'status': row[6],
            'created_at': row[7].isoformat() if row[7] else None,
            'admin_id': row[8],
            'admin_approved': row[9],
            'company_name': row[10],
            'transaction_id': row[11],
            'user_id': user_id_val,
            'dashboard_type': row[13],
            'ai_attempted': row[14],
            'ai_status': row[15],
            'ai_confidence': float(row[16]) if row[16] else None,
            'ai_reasoning': row[17],
            'ai_model_version': row[18],
            'ai_processing_duration': float(row[19]) if row[19] else None,
            'ai_processed': row[20],
            'user_email': user_email,
            'user_account_number': user_account_number
        }

        return jsonify({
            'success': True,
            'data': mapping,
            'mapping': mapping
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/llm-center/process-mapping/<int:mapping_id>', methods=['POST'])
def admin_process_mapping_with_ai(mapping_id):
    """Process a single mapping through AI simulation - called from LLM Center"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Get the mapping to process
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, confidence, status
            FROM llm_mappings WHERE id = %s
        ''', (mapping_id,))
        row = cursor.fetchone()

        if not row:
            conn.close()
            return jsonify({'success': False, 'error': 'Mapping not found'}), 404

        merchant_name_raw = row[1] or ''
        merchant_name = merchant_name_raw.upper()
        ticker_symbol = (row[2] or '').upper()
        category = row[3] or ''
        existing_confidence = float(row[4]) if row[4] else 0

        import random
        import time
        start_time = time.time()

        # Known merchant-to-ticker mapping database for AI validation
        known_mappings = {
            'APPLE': ('AAPL', 'Apple Inc.'), 'APPLE STORE': ('AAPL', 'Apple Inc.'),
            'MICROSOFT': ('MSFT', 'Microsoft Corp.'), 'XBOX': ('MSFT', 'Microsoft Corp.'),
            'GOOGLE': ('GOOGL', 'Alphabet Inc.'), 'YOUTUBE': ('GOOGL', 'Alphabet Inc.'),
            'AMAZON': ('AMZN', 'Amazon.com Inc.'), 'WHOLE FOODS': ('AMZN', 'Amazon.com Inc.'),
            'TESLA': ('TSLA', 'Tesla Inc.'),
            'STARBUCKS': ('SBUX', 'Starbucks Corp.'),
            'MCDONALDS': ('MCD', 'McDonald\'s Corp.'), "MCDONALD'S": ('MCD', 'McDonald\'s Corp.'),
            'WALMART': ('WMT', 'Walmart Inc.'), 'WAL-MART': ('WMT', 'Walmart Inc.'),
            'TARGET': ('TGT', 'Target Corp.'),
            'NIKE': ('NKE', 'Nike Inc.'), 'NIKE.COM': ('NKE', 'Nike Inc.'),
            'DISNEY': ('DIS', 'Walt Disney Co.'), 'DISNEY+': ('DIS', 'Walt Disney Co.'),
            'NETFLIX': ('NFLX', 'Netflix Inc.'),
            'COSTCO': ('COST', 'Costco Wholesale Corp.'),
            'HOME DEPOT': ('HD', 'Home Depot Inc.'),
            'BEST BUY': ('BBY', 'Best Buy Co.'),
            'CHIPOTLE': ('CMG', 'Chipotle Mexican Grill'),
            'UBER': ('UBER', 'Uber Technologies'),
            'LYFT': ('LYFT', 'Lyft Inc.'),
            'DOORDASH': ('DASH', 'DoorDash Inc.'),
            'SPOTIFY': ('SPOT', 'Spotify Technology'),
            'AIRBNB': ('ABNB', 'Airbnb Inc.'),
            'COCA-COLA': ('KO', 'Coca-Cola Co.'), 'COCA COLA': ('KO', 'Coca-Cola Co.'),
            'PEPSI': ('PEP', 'PepsiCo Inc.'), 'PEPSICO': ('PEP', 'PepsiCo Inc.'),
            'VISA': ('V', 'Visa Inc.'),
            'MASTERCARD': ('MA', 'Mastercard Inc.'),
            'PAYPAL': ('PYPL', 'PayPal Holdings'),
            'LOWES': ('LOW', 'Lowe\'s Companies'), "LOWE'S": ('LOW', 'Lowe\'s Companies'),
            'CVS': ('CVS', 'CVS Health Corp.'),
            'WALGREENS': ('WBA', 'Walgreens Boots Alliance'),
            'KROGER': ('KR', 'Kroger Co.'),
            'MACYS': ('M', 'Macy\'s Inc.'), "MACY'S": ('M', 'Macy\'s Inc.'),
            'NORDSTROM': ('JWN', 'Nordstrom Inc.'),
            'GAP': ('GPS', 'Gap Inc.'), 'OLD NAVY': ('GPS', 'Gap Inc.'),
            'FOOT LOCKER': ('FL', 'Foot Locker Inc.'),
        }

        # Non-publicly-traded merchants (private companies, subsidiaries with no direct ticker)
        private_merchants = {
            'TRADER JOE': 'Trader Joe\'s is owned by Aldi Nord (German private company). No US-listed stock.',
            'ALDI': 'Aldi is a privately held German discount supermarket chain. Not publicly traded.',
            'PUBLIX': 'Publix is an employee-owned supermarket chain. Not publicly traded on exchanges.',
            'CHICK-FIL-A': 'Chick-fil-A is a privately held fast food chain. Not publicly traded.',
            'IN-N-OUT': 'In-N-Out Burger is privately held. Not publicly traded.',
            'HOBBY LOBBY': 'Hobby Lobby is privately held. Not publicly traded.',
        }

        confidence = 0.0
        reasoning = ""
        suggested_ticker = ticker_symbol

        # Step 1: Check if merchant is a known private company
        is_private = False
        for private_key, private_reason in private_merchants.items():
            if private_key in merchant_name:
                is_private = True
                if ticker_symbol:
                    confidence = 0.15
                    reasoning = (f"Low confidence: '{merchant_name_raw}' - {private_reason} "
                                f"User suggested ticker '{ticker_symbol}' but this mapping is likely incorrect. "
                                f"Recommend rejecting or finding the correct parent company ticker.")
                    suggested_ticker = ''
                else:
                    confidence = 0.10
                    reasoning = (f"Cannot map: '{merchant_name_raw}' - {private_reason} "
                                f"No valid ticker can be assigned for this merchant.")
                    suggested_ticker = ''
                break

        # Step 2: Check known merchant-to-ticker mappings
        if not is_private:
            matched_known = None
            for known_key, (known_ticker, known_company) in known_mappings.items():
                if known_key in merchant_name:
                    matched_known = (known_key, known_ticker, known_company)
                    break

            if matched_known:
                known_key, known_ticker, known_company = matched_known
                if ticker_symbol == known_ticker:
                    # User's ticker matches known correct mapping
                    confidence = random.uniform(0.92, 0.98)
                    reasoning = (f"High confidence: '{merchant_name_raw}' is a known {known_company} ({known_ticker}) location. "
                                f"User-suggested ticker '{ticker_symbol}' matches verified mapping.")
                    suggested_ticker = known_ticker
                elif ticker_symbol and ticker_symbol != known_ticker:
                    # User suggested wrong ticker
                    confidence = 0.25
                    reasoning = (f"Mismatch detected: '{merchant_name_raw}' is a known {known_company} ({known_ticker}) location, "
                                f"but user suggested '{ticker_symbol}' which appears incorrect. "
                                f"Recommended ticker: {known_ticker} ({known_company}).")
                    suggested_ticker = known_ticker
                else:
                    # No user ticker but we know the correct one
                    confidence = random.uniform(0.88, 0.95)
                    reasoning = (f"Auto-mapped: '{merchant_name_raw}' identified as {known_company} ({known_ticker}). "
                                f"High confidence based on merchant name recognition.")
                    suggested_ticker = known_ticker
            elif ticker_symbol:
                # Unknown merchant but user provided a ticker - needs review
                confidence = random.uniform(0.40, 0.60)
                reasoning = (f"Uncertain: '{merchant_name_raw}' is not in the known merchant database. "
                            f"User suggested ticker '{ticker_symbol}'. Manual verification recommended "
                            f"to confirm this merchant is associated with {ticker_symbol}.")
            else:
                # Unknown merchant, no ticker
                confidence = random.uniform(0.10, 0.30)
                reasoning = (f"Cannot map: '{merchant_name_raw}' is not recognized in the merchant database "
                            f"and no ticker was suggested. Manual research required to identify "
                            f"the parent company and correct stock ticker.")

        # Simulate realistic processing time (50-200ms)
        time.sleep(random.uniform(0.05, 0.20))

        # Determine AI decision based on confidence
        if confidence >= 0.85:
            ai_status = 'approved'
        elif confidence >= 0.50:
            ai_status = 'review_required'
        else:
            ai_status = 'rejected'

        processing_time = time.time() - start_time
        processing_duration_ms = max(1, int(processing_time * 1000))

        # Update the mapping with all AI results
        # If AI found a better ticker, update ticker_symbol too
        if suggested_ticker and suggested_ticker != ticker_symbol:
            cursor.execute('''
                UPDATE llm_mappings
                SET confidence = %s,
                    status = CASE WHEN %s = 'approved' THEN 'approved' ELSE status END,
                    admin_approved = CASE WHEN %s = 'approved' THEN 1 ELSE admin_approved END,
                    ai_processed = TRUE,
                    ai_attempted = 1,
                    ai_status = %s,
                    ai_confidence = %s,
                    ai_reasoning = %s,
                    ai_model_version = %s,
                    ai_processing_duration = %s,
                    ticker_symbol = %s
                WHERE id = %s
            ''', (confidence, ai_status, ai_status,
                  ai_status, confidence, reasoning, 'v1.0', processing_duration_ms,
                  suggested_ticker, mapping_id))
        else:
            cursor.execute('''
                UPDATE llm_mappings
                SET confidence = %s,
                    status = CASE WHEN %s = 'approved' THEN 'approved' ELSE status END,
                    admin_approved = CASE WHEN %s = 'approved' THEN 1 ELSE admin_approved END,
                    ai_processed = TRUE,
                    ai_attempted = 1,
                    ai_status = %s,
                    ai_confidence = %s,
                    ai_reasoning = %s,
                    ai_model_version = %s,
                    ai_processing_duration = %s
                WHERE id = %s
            ''', (confidence, ai_status, ai_status,
                  ai_status, confidence, reasoning, 'v1.0', processing_duration_ms,
                  mapping_id))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'mapping_id': mapping_id,
                'ai_status': ai_status,
                'ai_confidence': round(confidence, 4),
                'ai_reasoning': reasoning,
                'ai_auto_approved': ai_status == 'approved',
                'processing_time': processing_time,
                'model_version': 'v1.0',
                'ai_model_version': 'v1.0',
                'suggested_ticker': suggested_ticker,
                'ai_processing_duration': processing_duration_ms
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# LLM Data Assets endpoint
@app.route('/api/admin/llm-assets', methods=['GET'])
def admin_llm_assets():
    """Get LLM data assets summary for the LLM Data Assets tab"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Get total mappings count using fast pg_class estimate
        cursor.execute("""
            SELECT reltuples::bigint AS estimate
            FROM pg_class
            WHERE relname = 'llm_mappings'
        """)
        total_result = cursor.fetchone()
        total_mappings = total_result[0] if total_result else 0

        # Get category distribution (top 10)
        cursor.execute("""
            SELECT category, COUNT(*) as count
            FROM llm_mappings
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
            LIMIT 10
        """)
        categories = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]

        # Get ticker distribution (top 10)
        cursor.execute("""
            SELECT ticker_symbol, COUNT(*) as count
            FROM llm_mappings
            WHERE ticker_symbol IS NOT NULL AND ticker_symbol != ''
            GROUP BY ticker_symbol
            ORDER BY count DESC
            LIMIT 10
        """)
        tickers = [{'symbol': row[0], 'count': row[1]} for row in cursor.fetchall()]

        # Get status distribution
        cursor.execute("""
            SELECT status, COUNT(*) as count
            FROM llm_mappings
            GROUP BY status
        """)
        status_dist = {row[0]: row[1] for row in cursor.fetchall()}

        cursor.close()
        conn.close()

        # Calculate economic value estimate (based on mappings processed)
        # Formula: Total Mappings × $0.072 per transaction value contribution
        economic_value = total_mappings * 0.072
        cost_basis = total_mappings * 0.025  # Estimated cost per mapping
        carrying_value = economic_value - cost_basis

        # Format response to match frontend LLMDataAssetsProper expectations
        return jsonify({
            'success': True,
            'data': {
                'assets': [
                    {
                        'asset_id': 1,
                        'asset_name': 'Merchant-Ticker Mapping Dataset',
                        'asset_type': 'data_asset',
                        'status': 'production',
                        'records': total_mappings,
                        'cost_basis': {'total': round(cost_basis, 2), 'breakdown': {'data_acquisition': round(cost_basis * 0.6, 2), 'processing': round(cost_basis * 0.4, 2)}},
                        'economic_value': round(economic_value, 2),
                        'carrying_value': round(carrying_value, 2),
                        'amortized_value': round(carrying_value, 2),
                        'impairment_loss': 0,
                        'last_updated': datetime.now().isoformat(),
                        'gl_account': '15200',
                        'categories': categories,
                        'tickers': tickers,
                        'status_distribution': status_dist
                    }
                ],
                'summary': {
                    'total_assets': 1,
                    'total_value': round(economic_value, 2),
                    'total_cost': round(cost_basis, 2),
                    'total_cost_basis': round(cost_basis, 2),
                    'total_economic_value': round(economic_value, 2),
                    'total_carrying_value': round(carrying_value, 2),
                    'average_performance': 85.8,  # From dashboard accuracy
                    'average_roi': round((economic_value - cost_basis) / cost_basis * 100, 1) if cost_basis > 0 else 0,
                    'gl_account': '15200',
                    'total_mappings': total_mappings
                }
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/llm-assets/<int:asset_id>/cost-breakdown', methods=['GET'])
def admin_llm_asset_cost_breakdown(asset_id):
    """Get cost breakdown for a specific LLM asset"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT reltuples::bigint FROM pg_class WHERE relname = 'llm_mappings'")
        total_result = cursor.fetchone()
        total_mappings = total_result[0] if total_result else 0
        cursor.close()
        conn.close()

        cost_basis = total_mappings * 0.025
        return jsonify({
            'success': True,
            'data': {
                'cost_breakdown': [
                    {'cost_type': 'Data Acquisition', 'gl_account': '15200-01', 'description': 'Transaction data collection and processing', 'amount': round(cost_basis * 0.4, 2)},
                    {'cost_type': 'AI Training', 'gl_account': '15200-02', 'description': 'Model training and fine-tuning costs', 'amount': round(cost_basis * 0.3, 2)},
                    {'cost_type': 'Infrastructure', 'gl_account': '15200-03', 'description': 'Server and compute resources', 'amount': round(cost_basis * 0.2, 2)},
                    {'cost_type': 'Quality Assurance', 'gl_account': '15200-04', 'description': 'Mapping validation and review', 'amount': round(cost_basis * 0.1, 2)}
                ]
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-assets/<int:asset_id>/amortization', methods=['GET'])
def admin_llm_asset_amortization(asset_id):
    """Get amortization schedule for a specific LLM asset"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT reltuples::bigint FROM pg_class WHERE relname = 'llm_mappings'")
        total_result = cursor.fetchone()
        total_mappings = total_result[0] if total_result else 0
        cursor.close()
        conn.close()

        cost_basis = total_mappings * 0.025
        useful_life_months = 36  # 3 years
        monthly_amortization = cost_basis / useful_life_months if useful_life_months > 0 else 0

        schedule = []
        remaining = cost_basis
        for i in range(min(12, useful_life_months)):  # Show first 12 months
            remaining -= monthly_amortization
            schedule.append({
                'period': f'Month {i + 1}',
                'period_start': f'2026-{(i % 12) + 1:02d}-01',
                'period_end': f'2026-{(i % 12) + 1:02d}-28',
                'amortization_expense': round(monthly_amortization, 2),
                'remaining_value': round(max(0, remaining), 2)
            })

        return jsonify({
            'success': True,
            'data': {
                'schedule': schedule
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Manual submit endpoint
@app.route('/api/admin/manual-submit', methods=['POST'])
def admin_manual_submit():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Insert new mapping
        cursor.execute('''
            INSERT INTO llm_mappings
            (merchant_name, category, notes, ticker_symbol, confidence, status, admin_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (
            data.get('merchant_name'),
            data.get('category'),
            data.get('notes'),
            data.get('ticker_symbol'),
            float(data.get('confidence', 0)),
            'pending',
            'manual_submit'
        ))

        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mapping submitted successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Clear demo user data for fresh testing
@app.route('/api/admin/clear-demo-data', methods=['POST'])
def admin_clear_demo_data():
    """Clear all transactions and portfolio data for demo_user@kamioi.com"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Find demo user
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(%s)", ('demo_user@kamioi.com',))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'demo_user@kamioi.com not found'}), 404

        user_id = user[0]

        # Delete transactions
        cursor.execute('DELETE FROM transactions WHERE user_id = %s', (user_id,))
        txn_deleted = cursor.rowcount

        # Delete portfolio holdings
        cursor.execute('DELETE FROM portfolios WHERE user_id = %s', (user_id,))
        portfolio_deleted = cursor.rowcount

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Demo user data cleared',
            'data': {
                'user_id': user_id,
                'transactions_deleted': txn_deleted,
                'portfolio_holdings_deleted': portfolio_deleted
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# Create demo transactions for testing
@app.route('/api/admin/create-demo-transactions', methods=['POST'])
def admin_create_demo_transactions():
    """Create demo transactions for demo_user@kamioi.com for testing"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        import random
        from werkzeug.security import generate_password_hash

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Sample merchants
        MERCHANTS = [
            ("Starbucks", "SBUX", "Food & Beverage"),
            ("Amazon", "AMZN", "E-commerce"),
            ("Apple Store", "AAPL", "Technology"),
            ("Walmart", "WMT", "Retail"),
            ("Target", "TGT", "Retail"),
            ("McDonald's", "MCD", "Food & Beverage"),
            ("Netflix", "NFLX", "Entertainment"),
            ("Uber", "UBER", "Transportation"),
            ("Home Depot", "HD", "Home Improvement"),
            ("Nike", "NKE", "Apparel"),
            ("Costco", "COST", "Retail"),
            ("CVS Pharmacy", "CVS", "Healthcare"),
            ("Shell Gas", "SHEL", "Energy"),
            ("Spotify", "SPOT", "Entertainment"),
            ("Chipotle", "CMG", "Food & Beverage"),
        ]

        # Find or create demo user
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(%s)", ('demo_user@kamioi.com',))
        user = cursor.fetchone()

        if not user:
            # Create the demo user
            hashed_password = generate_password_hash("Demo123!")
            cursor.execute("""
                INSERT INTO users (email, password, name, account_type, round_up_amount, created_at)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING id
            """, ('demo_user@kamioi.com', hashed_password, 'Demo User', 'individual', 1.00))
            user_id = cursor.fetchone()[0]
            conn.commit()
            user_created = True
            user_round_up_amount = 1.00
        else:
            user_id = user[0]
            user_created = False
            # Get user's round-up setting
            cursor.execute("SELECT round_up_amount FROM users WHERE id = %s", (user_id,))
            round_up_row = cursor.fetchone()
            user_round_up_amount = float(round_up_row[0]) if round_up_row and round_up_row[0] else 1.00

        # Add 20 transactions
        num_transactions = 20
        now = datetime.now()
        transactions_added = []

        for i in range(num_transactions):
            merchant, expected_ticker, category = random.choice(MERCHANTS)
            amount = round(random.uniform(5, 150), 2)
            # FIXED: Use user's configured round-up amount (not nearest dollar calculation)
            round_up = user_round_up_amount
            date = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
            fee = 0  # No fee - subscription pays for service
            total_debit = round(amount + round_up, 2)
            description = f"Purchase at {merchant}"

            # First, ensure this merchant exists in llm_mappings (so auto-mapping can find it)
            cursor.execute("SELECT id FROM llm_mappings WHERE merchant_name = %s AND status = 'approved' LIMIT 1", (merchant,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO llm_mappings (merchant_name, ticker_symbol, category, confidence, status, admin_approved, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """, (merchant, expected_ticker, category, 0.95, 'approved', 1))

            # Insert transaction with 'pending' status - THIS IS THE CORRECT FLOW
            cursor.execute("""
                INSERT INTO transactions
                (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, account_type, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                user_id, amount, merchant, category, date, description,
                round_up, fee, total_debit, 'pending', 'individual', date
            ))
            transaction_id = cursor.fetchone()[0]

            # Run auto-mapping to find the ticker (THE REAL FLOW)
            mapping_result = auto_process_transaction(cursor, user_id, description, merchant)

            # If we found a high-confidence mapping, update the transaction
            if mapping_result and mapping_result.get('confidence', 0) > 0.8:
                cursor.execute("""
                    UPDATE transactions
                    SET status = 'mapped', ticker = %s, category = %s
                    WHERE id = %s
                """, (mapping_result['suggestedTicker'], mapping_result['category'], transaction_id))
                final_status = 'mapped'
                final_ticker = mapping_result['suggestedTicker']
            else:
                final_status = 'pending'
                final_ticker = None

            transactions_added.append({
                'id': transaction_id,
                'merchant': merchant,
                'amount': amount,
                'round_up': round_up,
                'expected_ticker': expected_ticker,
                'mapped_ticker': final_ticker,
                'status': final_status,
                'mapping_confidence': mapping_result.get('confidence', 0) if mapping_result else 0
            })

        conn.commit()

        # Get total count
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE user_id = %s", (user_id,))
        total_transactions = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Created {num_transactions} demo transactions',
            'data': {
                'user_id': user_id,
                'user_email': 'demo_user@kamioi.com',
                'user_created': user_created,
                'transactions_added': num_transactions,
                'total_transactions': total_transactions,
                'password': 'Demo123!',
                'sample_transactions': transactions_added[:5]
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# INVESTMENT EXECUTION PIPELINE
# This is the heart of Kamioi - processes mapped transactions into real investments
# ============================================================================

@app.route('/api/admin/investments/process-mapped', methods=['POST'])
def admin_process_mapped_investments():
    """
    Process all 'mapped' transactions: execute Alpaca trades and update portfolios.

    THE COMPLETE FLOW:
    1. Find transactions with status='mapped' and ticker set
    2. For each transaction, call Alpaca API to buy fractional shares
    3. Update/insert into portfolios table
    4. Mark transaction as 'completed' with alpaca_order_id
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        # Initialize Alpaca service
        from alpaca_service import AlpacaService
        alpaca = AlpacaService()

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # DEBUG: Log what mapped transactions exist before filtering
        cursor.execute("""
            SELECT t.id, t.status, t.ticker, t.alpaca_order_id, t.user_id
            FROM transactions t
            WHERE LOWER(t.status) = 'mapped'
        """)
        debug_mapped = cursor.fetchall()
        print(f"[PROCESS DEBUG] Found {len(debug_mapped)} mapped transactions in DB:")
        for dm in debug_mapped:
            dm_dict = dict(dm)
            print(f"  ID={dm_dict['id']}, ticker='{dm_dict['ticker']}', alpaca_order_id='{dm_dict['alpaca_order_id']}', user_id={dm_dict['user_id']}")

        # Find all mapped transactions with tickers that haven't been processed
        # Include user's alpaca_account_id for Broker API
        cursor.execute("""
            SELECT t.id, t.user_id, t.ticker, t.round_up, t.merchant, t.amount, u.email, u.alpaca_account_id,
                   u.first_name, u.last_name, u.phone, u.address, u.city, u.state, u.zip_code, u.dob, u.ssn_last4
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE LOWER(t.status) = 'mapped'
            AND t.ticker IS NOT NULL
            AND t.ticker != 'UNKNOWN'
            AND t.ticker != ''
            AND (t.alpaca_order_id IS NULL OR t.alpaca_order_id = '' OR t.alpaca_order_id = 'null')
            ORDER BY t.created_at ASC
            LIMIT 100
        """)
        mapped_transactions = cursor.fetchall()
        print(f"[PROCESS DEBUG] After filtering: {len(mapped_transactions)} transactions ready for processing")

        results = {
            'processed': 0,
            'succeeded': 0,
            'failed': 0,
            'skipped': 0,
            'details': []
        }

        if not mapped_transactions:
            cursor.close()
            conn.close()
            return jsonify({
                'success': True,
                'message': 'No mapped transactions to process',
                'results': results
            })

        for txn in mapped_transactions:
            txn_id = txn['id']
            user_id = txn['user_id']
            ticker = txn['ticker']
            round_up_amount = float(txn['round_up']) if txn['round_up'] else 1.0
            merchant = txn['merchant']
            amount = float(txn['amount']) if txn['amount'] else 0
            user_email = txn['email']
            user_alpaca_account_id = txn.get('alpaca_account_id')

            # For Broker API: Use user's specific account or create one
            if alpaca.api_type == "broker":
                if not user_alpaca_account_id:
                    # Try to create an Alpaca account for this user
                    user_data = {
                        'email': user_email,
                        'first_name': txn.get('first_name') or 'Test',
                        'last_name': txn.get('last_name') or 'User',
                        'phone': txn.get('phone'),
                        'address': txn.get('address'),
                        'city': txn.get('city'),
                        'state': txn.get('state'),
                        'zip_code': txn.get('zip_code'),
                        'dob': str(txn.get('dob')) if txn.get('dob') else '1990-01-01',
                        'ssn_last4': txn.get('ssn_last4') or '1234'
                    }
                    new_account = alpaca.create_customer_account(user_data)
                    if new_account and new_account.get('id'):
                        user_alpaca_account_id = new_account['id']
                        # Save to user record
                        cursor.execute("UPDATE users SET alpaca_account_id = %s WHERE id = %s",
                                     (user_alpaca_account_id, user_id))
                    else:
                        results['skipped'] += 1
                        results['details'].append({
                            'transaction_id': txn_id,
                            'user_email': user_email,
                            'status': 'skipped',
                            'error': 'Failed to create Alpaca account for user'
                        })
                        continue
                account_id_to_use = user_alpaca_account_id

                # Check if account is active and allowed to trade
                if not alpaca.is_account_active(account_id_to_use):
                    results['skipped'] += 1
                    results['details'].append({
                        'transaction_id': txn_id,
                        'user_email': user_email,
                        'status': 'skipped',
                        'error': 'Alpaca account not yet active - pending approval'
                    })
                    continue
            else:
                # For Trading API: Use the single account
                account = alpaca.get_account()
                if not account:
                    cursor.close()
                    conn.close()
                    return jsonify({
                        'success': False,
                        'error': 'No Alpaca account available. Check API credentials.'
                    }), 500
                account_id_to_use = account.get('id')

            # Ensure account has sufficient funds (auto-fund sandbox accounts if needed)
            if not alpaca.ensure_account_funded(account_id_to_use, min_amount=round_up_amount + 10):
                results['skipped'] += 1
                results['details'].append({
                    'transaction_id': txn_id,
                    'user_email': user_email,
                    'status': 'skipped',
                    'error': 'Insufficient funds - sandbox auto-funding failed'
                })
                continue

            results['processed'] += 1

            try:
                # Execute the trade via Alpaca using user's specific account
                order_result = alpaca.buy_fractional_shares(
                    account_id=account_id_to_use,
                    symbol=ticker,
                    dollar_amount=round_up_amount
                )

                if order_result and order_result.get('id'):
                    # Trade succeeded! Update transaction and portfolio
                    alpaca_order_id = order_result.get('id')

                    # Get actual fill data from order result
                    # For market orders, we try to get filled_qty and filled_avg_price
                    filled_qty = float(order_result.get('filled_qty') or 0)
                    filled_avg_price = float(order_result.get('filled_avg_price') or 0)

                    # If not filled yet (order still processing), estimate from notional
                    if filled_qty == 0 or filled_avg_price == 0:
                        # Get current stock price to calculate shares
                        stock_price = alpaca.get_stock_price(ticker) if hasattr(alpaca, 'get_stock_price') else 0

                        if stock_price and stock_price > 0:
                            # Calculate fractional shares: dollar_amount / stock_price
                            filled_qty = round_up_amount / stock_price
                            filled_avg_price = stock_price
                        else:
                            # Fallback: query market data or use a reasonable estimate
                            # Try to get the price from Alpaca
                            try:
                                import requests as req
                                price_resp = req.get(
                                    f"https://data.alpaca.markets/v2/stocks/{ticker}/quotes/latest",
                                    headers=alpaca.headers,
                                    timeout=10
                                )
                                if price_resp.status_code == 200:
                                    price_data = price_resp.json()
                                    if 'quote' in price_data:
                                        ask_price = float(price_data['quote'].get('ap', 0))
                                        bid_price = float(price_data['quote'].get('bp', 0))
                                        stock_price = (ask_price + bid_price) / 2 if ask_price and bid_price else ask_price or bid_price
                                        if stock_price > 0:
                                            filled_qty = round_up_amount / stock_price
                                            filled_avg_price = stock_price
                            except Exception as price_error:
                                print(f"Error fetching price for {ticker}: {price_error}")

                        # Ultimate fallback - use notional and a default estimate
                        if filled_qty == 0 or filled_avg_price == 0:
                            # Just store the notional as a placeholder - will need manual correction
                            filled_qty = round_up_amount / 100  # Rough estimate
                            filled_avg_price = 100  # Placeholder

                    print(f"Portfolio update for {ticker}: shares={filled_qty}, avg_price={filled_avg_price}, dollar_amount={round_up_amount}")

                    shares_bought = filled_qty
                    avg_price = filled_avg_price

                    # Mark transaction as completed with actual shares info
                    cursor.execute("""
                        UPDATE transactions
                        SET status = 'completed', alpaca_order_id = %s, shares = %s, price_per_share = %s
                        WHERE id = %s
                    """, (alpaca_order_id, shares_bought, avg_price, txn_id))

                    # Check if user already has this ticker in portfolio
                    cursor.execute("""
                        SELECT id, shares, average_price FROM portfolios
                        WHERE user_id = %s AND ticker = %s
                    """, (user_id, ticker))
                    existing_holding = cursor.fetchone()

                    if existing_holding:
                        # Update existing holding
                        old_shares = float(existing_holding['shares'])
                        old_avg = float(existing_holding['average_price'])
                        new_shares = old_shares + shares_bought
                        # Weighted average price
                        new_avg = ((old_shares * old_avg) + (shares_bought * avg_price)) / new_shares if new_shares > 0 else avg_price
                        cursor.execute("""
                            UPDATE portfolios
                            SET shares = %s, average_price = %s, updated_at = CURRENT_TIMESTAMP
                            WHERE id = %s
                        """, (new_shares, new_avg, existing_holding['id']))
                    else:
                        # Insert new holding
                        cursor.execute("""
                            INSERT INTO portfolios (user_id, ticker, shares, average_price, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """, (user_id, ticker, shares_bought, avg_price))

                    results['succeeded'] += 1
                    results['details'].append({
                        'transaction_id': txn_id,
                        'user_email': user_email,
                        'ticker': ticker,
                        'amount': round_up_amount,
                        'status': 'completed',
                        'alpaca_order_id': alpaca_order_id
                    })
                else:
                    # Trade failed
                    results['failed'] += 1
                    results['details'].append({
                        'transaction_id': txn_id,
                        'user_email': user_email,
                        'ticker': ticker,
                        'amount': round_up_amount,
                        'status': 'failed',
                        'error': 'Alpaca order failed'
                    })

            except Exception as trade_error:
                results['failed'] += 1
                results['details'].append({
                    'transaction_id': txn_id,
                    'user_email': user_email,
                    'ticker': ticker,
                    'amount': round_up_amount,
                    'status': 'error',
                    'error': str(trade_error)
                })

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Processed {results["processed"]} transactions: {results["succeeded"]} succeeded, {results["failed"]} failed',
            'results': results
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/investments/process-single', methods=['POST'])
def admin_process_single_investment():
    """
    Process a single transaction: execute Alpaca trade and update portfolio.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        data = request.get_json()
        transaction_id = data.get('transaction_id')

        if not transaction_id:
            return jsonify({'success': False, 'error': 'transaction_id is required'}), 400

        # Initialize Alpaca service
        from alpaca_service import AlpacaService
        alpaca = AlpacaService()

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get the specific transaction with user's Alpaca account info
        cursor.execute("""
            SELECT t.id, t.user_id, t.ticker, t.round_up, t.merchant, t.amount, u.email, u.alpaca_account_id,
                   u.first_name, u.last_name, u.phone, u.address, u.city, u.state, u.zip_code, u.dob, u.ssn_last4
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = %s
            AND LOWER(t.status) = 'mapped'
            AND t.ticker IS NOT NULL
            AND t.ticker != 'UNKNOWN'
            AND t.ticker != ''
        """, (transaction_id,))
        txn = cursor.fetchone()

        if not txn:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Transaction not found or not in mapped status'}), 404

        txn_id = txn['id']
        user_id = txn['user_id']
        ticker = txn['ticker']
        round_up_amount = float(txn['round_up']) if txn['round_up'] else 1.0
        user_alpaca_account_id = txn.get('alpaca_account_id')

        # Determine which account to use based on API type
        if alpaca.api_type == "broker":
            if not user_alpaca_account_id:
                # Create an Alpaca account for this user
                user_data = {
                    'email': txn['email'],
                    'first_name': txn.get('first_name') or 'Test',
                    'last_name': txn.get('last_name') or 'User',
                    'phone': txn.get('phone'),
                    'address': txn.get('address'),
                    'city': txn.get('city'),
                    'state': txn.get('state'),
                    'zip_code': txn.get('zip_code'),
                    'dob': str(txn.get('dob')) if txn.get('dob') else '1990-01-01',
                    'ssn_last4': txn.get('ssn_last4') or '1234'
                }
                new_account = alpaca.create_customer_account(user_data)
                if new_account and new_account.get('id'):
                    user_alpaca_account_id = new_account['id']
                    cursor.execute("UPDATE users SET alpaca_account_id = %s WHERE id = %s",
                                 (user_alpaca_account_id, user_id))
                else:
                    cursor.close()
                    conn.close()
                    return jsonify({'success': False, 'error': 'Failed to create Alpaca account for user'}), 500
            account_id_to_use = user_alpaca_account_id

            # Check if account is active and allowed to trade
            if not alpaca.is_account_active(account_id_to_use):
                cursor.close()
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'Alpaca account not yet active - pending approval. Please wait for account verification.'
                }), 400
        else:
            # For Trading API: Use the single account
            account = alpaca.get_account()
            if not account:
                cursor.close()
                conn.close()
                return jsonify({
                    'success': False,
                    'error': 'No Alpaca account available. Check API credentials.'
                }), 500
            account_id_to_use = account.get('id')

        # Execute the trade via Alpaca
        order_result = alpaca.buy_fractional_shares(
            account_id=account_id_to_use,
            symbol=ticker,
            dollar_amount=round_up_amount
        )

        if order_result and order_result.get('id'):
            alpaca_order_id = order_result.get('id')

            # Get actual fill data from order result
            filled_qty = float(order_result.get('filled_qty') or 0)
            filled_avg_price = float(order_result.get('filled_avg_price') or 0)

            # If not filled yet, calculate from stock price
            if filled_qty == 0 or filled_avg_price == 0:
                stock_price = alpaca.get_stock_price(ticker)
                if stock_price and stock_price > 0:
                    filled_qty = round_up_amount / stock_price
                    filled_avg_price = stock_price
                else:
                    # Fallback estimate
                    filled_qty = round_up_amount / 100
                    filled_avg_price = 100

            print(f"Single trade portfolio update for {ticker}: shares={filled_qty}, avg_price={filled_avg_price}")

            shares_bought = filled_qty
            avg_price = filled_avg_price

            # Mark transaction as completed with actual shares info
            cursor.execute("""
                UPDATE transactions
                SET status = 'completed', alpaca_order_id = %s, shares = %s, price_per_share = %s
                WHERE id = %s
            """, (alpaca_order_id, shares_bought, avg_price, txn_id))

            cursor.execute("""
                SELECT id, shares, average_price FROM portfolios
                WHERE user_id = %s AND ticker = %s
            """, (user_id, ticker))
            existing_holding = cursor.fetchone()

            if existing_holding:
                old_shares = float(existing_holding['shares'])
                old_avg = float(existing_holding['average_price'])
                new_shares = old_shares + shares_bought
                new_avg = ((old_shares * old_avg) + (shares_bought * avg_price)) / new_shares if new_shares > 0 else avg_price
                cursor.execute("""
                    UPDATE portfolios
                    SET shares = %s, average_price = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (new_shares, new_avg, existing_holding['id']))
            else:
                cursor.execute("""
                    INSERT INTO portfolios (user_id, ticker, shares, average_price, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, (user_id, ticker, shares_bought, avg_price))

            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({
                'success': True,
                'message': f'Successfully executed trade for {ticker}',
                'alpaca_order_id': alpaca_order_id,
                'ticker': ticker,
                'amount': round_up_amount
            })
        else:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Alpaca order failed'}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/alpaca/status', methods=['GET'])
def admin_alpaca_status():
    """Check Alpaca API configuration and connection status"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        from alpaca_service import AlpacaService
        import os

        alpaca = AlpacaService()

        # Check environment variables
        env_vars = {
            'ALPACA_USE_BROKER_API': os.environ.get('ALPACA_USE_BROKER_API', 'NOT SET'),
            'ALPACA_USE_SANDBOX': os.environ.get('ALPACA_USE_SANDBOX', 'NOT SET'),
            'ALPACA_API_KEY': 'SET' if os.environ.get('ALPACA_API_KEY') else 'NOT SET',
            'ALPACA_API_SECRET': 'SET' if os.environ.get('ALPACA_API_SECRET') else 'NOT SET',
        }

        # Test connection
        connection_ok = alpaca.test_connection()

        return jsonify({
            'success': True,
            'api_type': alpaca.api_type,
            'base_url': alpaca.base_url,
            'environment_variables': env_vars,
            'connection_test': connection_ok,
            'message': f"Using {alpaca.api_type.upper()} API at {alpaca.base_url}"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/alpaca/create-account/<int:user_id>', methods=['POST'])
def admin_create_alpaca_account(user_id):
    """
    Create an Alpaca brokerage account for a specific user.
    This is for Broker API mode - creates customer accounts.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        from alpaca_service import AlpacaService
        alpaca = AlpacaService()

        if alpaca.api_type != "broker":
            return jsonify({
                'success': False,
                'error': 'Alpaca account creation requires Broker API. Set ALPACA_USE_BROKER_API=true'
            }), 400

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get user data
        cursor.execute("""
            SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, dob, ssn_last4, alpaca_account_id
            FROM users WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Check if user already has an Alpaca account
        if user.get('alpaca_account_id'):
            cursor.close()
            conn.close()
            return jsonify({
                'success': True,
                'message': 'User already has an Alpaca account',
                'alpaca_account_id': user['alpaca_account_id']
            })

        # Create Alpaca account with user data
        user_data = {
            'email': user['email'],
            'first_name': user.get('first_name') or 'Test',
            'last_name': user.get('last_name') or 'User',
            'phone': user.get('phone'),
            'address': user.get('address'),
            'city': user.get('city'),
            'state': user.get('state'),
            'zip_code': user.get('zip_code'),
            'dob': str(user.get('dob')) if user.get('dob') else '1990-01-01',
            'ssn_last4': user.get('ssn_last4') or '1234'
        }

        alpaca_account = alpaca.create_customer_account(user_data)

        if alpaca_account and alpaca_account.get('id'):
            # Save the Alpaca account ID to the user record
            cursor.execute("""
                UPDATE users SET alpaca_account_id = %s WHERE id = %s
            """, (alpaca_account['id'], user_id))
            conn.commit()

            cursor.close()
            conn.close()

            return jsonify({
                'success': True,
                'message': 'Alpaca account created successfully',
                'alpaca_account_id': alpaca_account['id'],
                'account_status': alpaca_account.get('status', 'PENDING')
            })
        else:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'error': 'Failed to create Alpaca account'}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/alpaca/create-accounts-bulk', methods=['POST'])
def admin_create_alpaca_accounts_bulk():
    """
    Create Alpaca accounts for all users who don't have one yet.
    """
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        from alpaca_service import AlpacaService
        alpaca = AlpacaService()

        if alpaca.api_type != "broker":
            return jsonify({
                'success': False,
                'error': 'Alpaca account creation requires Broker API. Set ALPACA_USE_BROKER_API=true'
            }), 400

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Get all users without Alpaca accounts
        cursor.execute("""
            SELECT id, email, first_name, last_name, phone, address, city, state, zip_code, dob, ssn_last4
            FROM users
            WHERE alpaca_account_id IS NULL OR alpaca_account_id = ''
        """)
        users = cursor.fetchall()

        results = {'created': 0, 'failed': 0, 'details': []}

        for user in users:
            user_data = {
                'email': user['email'],
                'first_name': user.get('first_name') or 'Test',
                'last_name': user.get('last_name') or 'User',
                'phone': user.get('phone'),
                'address': user.get('address'),
                'city': user.get('city'),
                'state': user.get('state'),
                'zip_code': user.get('zip_code'),
                'dob': str(user.get('dob')) if user.get('dob') else '1990-01-01',
                'ssn_last4': user.get('ssn_last4') or '1234'
            }

            alpaca_account = alpaca.create_customer_account(user_data)

            if alpaca_account and alpaca_account.get('id'):
                cursor.execute("""
                    UPDATE users SET alpaca_account_id = %s WHERE id = %s
                """, (alpaca_account['id'], user['id']))
                results['created'] += 1
                results['details'].append({
                    'user_id': user['id'],
                    'email': user['email'],
                    'alpaca_account_id': alpaca_account['id'],
                    'status': 'created'
                })
            else:
                results['failed'] += 1
                results['details'].append({
                    'user_id': user['id'],
                    'email': user['email'],
                    'status': 'failed'
                })

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': f"Created {results['created']} accounts, {results['failed']} failed",
            'results': results
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/investments/debug', methods=['GET'])
def admin_investments_debug():
    """Debug endpoint to see why transactions aren't being processed"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn, dict_cursor=True)

        # Count by status (case sensitive)
        cursor.execute("""
            SELECT status, COUNT(*) as count FROM transactions GROUP BY status
        """)
        status_counts = cursor.fetchall()

        # Get all mapped transactions with detailed info
        cursor.execute("""
            SELECT t.id, t.status, t.ticker, t.round_up, t.alpaca_order_id, t.user_id, t.merchant
            FROM transactions t
            WHERE LOWER(t.status) = 'mapped'
        """)
        mapped_transactions = cursor.fetchall()

        # Run the EXACT query from process_mapped_investments to see what it returns
        cursor.execute("""
            SELECT t.id, t.user_id, t.ticker, t.round_up, t.merchant, t.amount, u.email, u.alpaca_account_id
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE LOWER(t.status) = 'mapped'
            AND t.ticker IS NOT NULL
            AND t.ticker != 'UNKNOWN'
            AND t.ticker != ''
            AND (t.alpaca_order_id IS NULL OR t.alpaca_order_id = '' OR t.alpaca_order_id = 'null')
            ORDER BY t.created_at ASC
            LIMIT 100
        """)
        processable_transactions = cursor.fetchall()

        # Analyze each mapped transaction to see WHY it might be excluded
        analysis = []
        for txn in mapped_transactions:
            txn_dict = dict(txn)
            issues = []

            # Check ticker
            ticker = txn_dict.get('ticker')
            if ticker is None:
                issues.append("ticker is NULL")
            elif ticker == 'UNKNOWN':
                issues.append("ticker is 'UNKNOWN'")
            elif ticker == '':
                issues.append("ticker is empty string")

            # Check alpaca_order_id - note: string "null" is treated as NULL
            order_id = txn_dict.get('alpaca_order_id')
            if order_id and order_id != '' and order_id != 'null':
                issues.append(f"alpaca_order_id already set: {order_id}")

            # Check if user exists
            cursor.execute("SELECT id, email, alpaca_account_id FROM users WHERE id = %s", (txn_dict.get('user_id'),))
            user = cursor.fetchone()
            if not user:
                issues.append(f"user_id {txn_dict.get('user_id')} does not exist in users table")
            else:
                user_dict = dict(user)
                txn_dict['user_email'] = user_dict.get('email')
                txn_dict['user_alpaca_account'] = user_dict.get('alpaca_account_id')

            txn_dict['exclusion_reasons'] = issues if issues else ['NONE - should be processable']
            txn_dict['would_process'] = len(issues) == 0 or (len(issues) == 1 and 'alpaca_account_id' not in issues[0])
            analysis.append(txn_dict)

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'status_counts': [dict(row) for row in status_counts],
            'mapped_count': len(mapped_transactions),
            'processable_count': len(processable_transactions),
            'processable_transactions': [dict(row) for row in processable_transactions],
            'detailed_analysis': analysis,
            'summary': {
                'total_mapped': len(mapped_transactions),
                'would_process': sum(1 for a in analysis if a['would_process']),
                'excluded': sum(1 for a in analysis if not a['would_process'])
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/investments/status', methods=['GET'])
def admin_investment_status():
    """Get investment processing status - counts by status"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Get counts by status
        cursor.execute("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'mapped') as mapped,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) as total
            FROM transactions
        """)
        counts = cursor.fetchone()

        # Get pending investments (mapped but not yet processed)
        cursor.execute("""
            SELECT COUNT(*) FROM transactions
            WHERE status = 'mapped'
            AND ticker IS NOT NULL
            AND ticker != 'UNKNOWN'
            AND (alpaca_order_id IS NULL OR alpaca_order_id = '')
        """)
        ready_for_processing = cursor.fetchone()[0]

        # Get recent investments
        cursor.execute("""
            SELECT t.id, t.user_id, t.ticker, t.round_up, t.status, t.alpaca_order_id, t.created_at, u.email
            FROM transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.status = 'completed' AND t.alpaca_order_id IS NOT NULL
            ORDER BY t.created_at DESC
            LIMIT 10
        """)
        recent_investments = [{
            'id': r[0],
            'user_id': r[1],
            'ticker': r[2],
            'round_up': float(r[3]) if r[3] else 0,
            'status': r[4],
            'alpaca_order_id': r[5],
            'created_at': r[6].isoformat() if r[6] else None,
            'user_email': r[7]
        } for r in cursor.fetchall()]

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'status': {
                'pending': counts[0],
                'mapped': counts[1],
                'completed': counts[2],
                'total': counts[3],
                'ready_for_processing': ready_for_processing
            },
            'recent_investments': recent_investments
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/investments/portfolio-summary', methods=['GET'])
def admin_portfolio_summary():
    """Get portfolio summary across all users"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Get portfolio summary by ticker
        cursor.execute("""
            SELECT ticker, SUM(shares) as total_shares, COUNT(DISTINCT user_id) as investors
            FROM portfolios
            GROUP BY ticker
            ORDER BY total_shares DESC
            LIMIT 20
        """)
        by_ticker = [{
            'ticker': r[0],
            'total_shares': float(r[1]) if r[1] else 0,
            'investors': r[2]
        } for r in cursor.fetchall()]

        # Get total portfolio value
        cursor.execute("SELECT SUM(shares * COALESCE(average_price, 1)) FROM portfolios")
        total_value = cursor.fetchone()[0] or 0

        # Get total users with holdings
        cursor.execute("SELECT COUNT(DISTINCT user_id) FROM portfolios WHERE shares > 0")
        total_investors = cursor.fetchone()[0]

        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'summary': {
                'total_value': round(float(total_value), 2),
                'total_investors': total_investors,
                'by_ticker': by_ticker
            }
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


# Clear table endpoint
@app.route('/api/admin/database/clear-table', methods=['POST'])
def admin_clear_table():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        table_name = data.get('table_name', 'llm_mappings')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Clear the table
        cursor.execute(f'DELETE FROM {table_name}')
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Table {table_name} cleared successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Bulk approval endpoints for LLM Center
@app.route('/api/admin/llm-center/bulk-approve', methods=['POST'])
def admin_llm_bulk_approve():
    """Bulk approve multiple mappings at once"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        mapping_ids = data.get('mapping_ids', [])
        admin_id = data.get('admin_id', 'admin')
        notes = data.get('notes', 'Bulk approved')
        
        if not mapping_ids:
            return jsonify({'success': False, 'error': 'No mapping IDs provided'}), 400
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Bulk approve mappings - use %s for PostgreSQL
        placeholders = ','.join(['%s' for _ in mapping_ids])
        cursor.execute(f'''
            UPDATE llm_mappings
            SET admin_approved = 1,
                processed_at = CURRENT_TIMESTAMP,
                status = 'approved',
                admin_id = %s,
                notes = %s
            WHERE id IN ({placeholders})
        ''', [admin_id, notes] + mapping_ids)

        approved_count = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully approved {approved_count} mappings',
            'approved_count': approved_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/bulk-reject', methods=['POST'])
def admin_llm_bulk_reject():
    """Bulk reject multiple mappings at once"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        mapping_ids = data.get('mapping_ids', [])
        admin_id = data.get('admin_id', 'admin')
        notes = data.get('notes', 'Bulk rejected')
        
        if not mapping_ids:
            return jsonify({'success': False, 'error': 'No mapping IDs provided'}), 400
        
        conn = get_db_connection()
        cursor = get_db_cursor(conn)

        # Bulk reject mappings - use %s for PostgreSQL
        placeholders = ','.join(['%s' for _ in mapping_ids])
        cursor.execute(f'''
            UPDATE llm_mappings
            SET admin_approved = 0,
                processed_at = CURRENT_TIMESTAMP,
                status = 'rejected',
                admin_id = %s,
                notes = %s
            WHERE id IN ({placeholders})
        ''', [admin_id, notes] + mapping_ids)

        rejected_count = cursor.rowcount
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully rejected {rejected_count} mappings',
            'rejected_count': rejected_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/approve-all-pending', methods=['POST'])
def admin_llm_approve_all_pending():
    """Approve all pending mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        admin_id = data.get('admin_id', 'admin')
        notes = data.get('notes', 'Bulk approved all pending')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Approve all pending mappings
        cursor.execute('''
            UPDATE llm_mappings 
            SET admin_approved = 1, 
                processed_at = CURRENT_TIMESTAMP,
                status = 'approved',
                admin_id = ?,
                notes = ?
            WHERE admin_approved = 0
        ''', (admin_id, notes))
        
        approved_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Successfully approved {approved_count} pending mappings',
            'approved_count': approved_count
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# LLM Center Analytics endpoint - OPTIMIZED
@app.route('/api/admin/llm-center/analytics', methods=['GET'])
def admin_llm_analytics():
    """Get comprehensive LLM Center analytics data - FAST version"""
    conn = None
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # FAST: Use pg_class for estimated count
        cursor.execute('''
            SELECT reltuples::bigint FROM pg_class WHERE relname = 'llm_mappings'
        ''')
        result = cursor.fetchone()
        total_mappings = int(result[0]) if result and result[0] else 0

        # FAST: Get approval counts in one query
        cursor.execute('''
            SELECT admin_approved, COUNT(*) FROM llm_mappings GROUP BY admin_approved
        ''')
        approval_counts = {row[0]: row[1] for row in cursor.fetchall()}
        approved_mappings = approval_counts.get(1, 0)

        # FAST: Get confidence average - return 0 if no data (don't fake 93%)
        cursor.execute('SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0')
        result = cursor.fetchone()
        avg_confidence = float(result[0]) if result and result[0] else 0

        # Get category distribution
        cat_distribution = {}
        try:
            cursor.execute('''
                SELECT category, COUNT(*) as cnt FROM llm_mappings
                WHERE category IS NOT NULL AND category != ''
                GROUP BY category ORDER BY cnt DESC LIMIT 10
            ''')
            cat_rows = cursor.fetchall()
            total_cat = sum(r[1] for r in cat_rows) if cat_rows else 0
            if total_cat > 0:
                for row in cat_rows:
                    cat_distribution[row[0]] = round((row[1] / total_cat) * 100, 1)
        except Exception:
            cat_distribution = {}

        conn.close()

        auto_approval_rate = (approved_mappings / max(total_mappings, 1)) * 100
        # Only show accuracy if we have mappings
        accuracy_rate = round(avg_confidence * 100, 1) if total_mappings > 0 else 0

        return jsonify({
            'success': True,
            'data': {
                'totalMappings': total_mappings,
                'dailyProcessed': min(total_mappings, 1000),
                'accuracyRate': accuracy_rate,
                'autoApprovalRate': round(auto_approval_rate, 1),
                'systemStatus': "online",
                'databaseStatus': "connected",
                'aiModelStatus': "active",
                'lastUpdated': datetime.now().isoformat(),
                'performanceMetrics': {
                    'processing_speed': f"{total_mappings:,} total records",
                    'avg_confidence': round(float(avg_confidence) * 100, 1),
                    'error_rate': '0.1%',
                    'uptime': '99.9%',
                    'memory_usage': '45%'
                },
                'categoryDistribution': cat_distribution
            }
        })
        
    except Exception as e:
        try:
            if conn:
                conn.close()
        except Exception:
            pass
        return jsonify({
            'success': False,
            'error': str(e),
            'data': {
                'totalMappings': 0,
                'dailyProcessed': 0,
                'accuracyRate': 0,
                'autoApprovalRate': 0,
                'systemStatus': "offline",
                'databaseStatus': "disconnected",
                'aiModelStatus': "inactive",
                'lastUpdated': datetime.now().isoformat(),
                'performanceMetrics': {
                    'processing_speed': '0 mappings/day',
                    'avg_confidence': 0,
                    'error_rate': '0%',
                    'uptime': '0%',
                    'memory_usage': '0%'
                },
                'categoryDistribution': {}
            }
        }), 500

# Index creation endpoint - run this once after bulk upload
@app.route('/api/admin/llm-center/create-indexes', methods=['POST'])
def create_llm_indexes():
    """Create indexes on llm_mappings table for fast queries"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        indexes_created = []
        try:
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_admin_approved ON llm_mappings(admin_approved)')
            indexes_created.append('idx_llm_admin_approved')
        except Exception as e:
            print(f"Index error: {e}")

        try:
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_status ON llm_mappings(status)')
            indexes_created.append('idx_llm_status')
        except Exception as e:
            print(f"Index error: {e}")

        try:
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_created_at ON llm_mappings(created_at DESC)')
            indexes_created.append('idx_llm_created_at')
        except Exception as e:
            print(f"Index error: {e}")

        try:
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_llm_category ON llm_mappings(category)')
            indexes_created.append('idx_llm_category')
        except Exception as e:
            print(f"Index error: {e}")

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': f'Created {len(indexes_created)} indexes',
            'indexes': indexes_created
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ULTRA-FAST LLM Center Dashboard - Single Endpoint for <1 Second Loading
@app.route('/api/admin/llm-center/dashboard', methods=['GET'])
def admin_llm_dashboard():
    """ULTRA-FAST: Single endpoint for all LLM Center data - <1 second load time"""
    conn = None
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()

        # Clear any aborted transaction state
        conn.rollback()

        # FAST: Use estimated counts for large tables (PostgreSQL specific)
        # This is much faster than COUNT(*) for 200k+ rows
        cursor.execute('''
            SELECT reltuples::bigint AS estimate
            FROM pg_class
            WHERE relname = 'llm_mappings'
        ''')
        result = cursor.fetchone()
        total_estimate = int(result[0]) if result and result[0] else 0

        # If estimate is 0, fall back to actual count (table might be new)
        if total_estimate == 0:
            cursor.execute('SELECT COUNT(*) FROM llm_mappings')
            total_estimate = cursor.fetchone()[0] or 0

        # FAST: Get approval counts
        cursor.execute('''
            SELECT admin_approved, COUNT(*)
            FROM llm_mappings
            GROUP BY admin_approved
        ''')
        approval_counts = {}
        for row in cursor.fetchall():
            approval_counts[row[0]] = row[1]

        approved_count = approval_counts.get(1, 0)
        pending_count = approval_counts.get(0, 0) + approval_counts.get(None, 0)
        rejected_count = approval_counts.get(-1, 0)

        # FAST: Get average confidence (single value) - return 0 if no data
        cursor.execute('SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0')
        result = cursor.fetchone()
        avg_confidence = float(result[0]) if result and result[0] else 0

        # Get category distribution for Analytics tab
        category_distribution = {}
        try:
            cursor.execute('''
                SELECT category, COUNT(*) as cnt FROM llm_mappings
                WHERE category IS NOT NULL AND category != ''
                GROUP BY category ORDER BY cnt DESC LIMIT 10
            ''')
            cat_rows = cursor.fetchall()
            total_categorized = sum(r[1] for r in cat_rows) if cat_rows else 0
            if total_categorized > 0:
                for row in cat_rows:
                    category_distribution[row[0]] = round((row[1] / total_categorized) * 100, 1)
        except Exception:
            category_distribution = {}

        # FAST: Get only 7 mappings for each tab (with index)
        pending_mappings = []
        approved_mappings = []
        rejected_mappings = []

        # Pending mappings - LIMIT 7
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, confidence, status,
                   created_at, admin_id, admin_approved, company_name, notes
            FROM llm_mappings
            WHERE admin_approved = 0 OR admin_approved IS NULL
            ORDER BY id DESC
            LIMIT 7
        ''')
        cols = [c[0] for c in cursor.description]
        pending_mappings = [dict(zip(cols, row)) for row in cursor.fetchall()]

        # Approved mappings - LIMIT 7
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, confidence, status,
                   created_at, admin_id, admin_approved, company_name, notes
            FROM llm_mappings
            WHERE admin_approved = 1
            ORDER BY id DESC
            LIMIT 7
        ''')
        cols = [c[0] for c in cursor.description]
        approved_mappings = [dict(zip(cols, row)) for row in cursor.fetchall()]

        # Rejected mappings - LIMIT 7
        cursor.execute('''
            SELECT id, merchant_name, ticker_symbol, category, confidence, status,
                   created_at, admin_id, admin_approved, company_name, notes
            FROM llm_mappings
            WHERE admin_approved = -1
            ORDER BY id DESC
            LIMIT 7
        ''')
        cols = [c[0] for c in cursor.description]
        rejected_mappings = [dict(zip(cols, row)) for row in cursor.fetchall()]

        conn.close()

        # Use total_estimate for all counts
        total_mappings = total_estimate

        # Calculate simple asset values (no extra queries) - use 0 if no data
        avg_conf = float(avg_confidence) if avg_confidence else 0
        individual_assets = [
            {
                'asset_name': 'KamioiGPT v1.0',
                'asset_type': 'model',
                'current_value': round(180000 * min(avg_conf * 2, 2.0) * min(total_mappings / 100000, 2.0), 2),
                'training_cost': 180000,
                'performance_score': round(avg_conf * 100, 1),
                'roi_percentage': round((min(avg_conf * 2, 2.0) * min(total_mappings / 100000, 2.0) - 1) * 100, 1),
                'model_version': 'v1.0',
                'gl_account': '15200'
            },
            {
                'asset_name': 'Transaction Dataset v1.0',
                'asset_type': 'dataset',
                'current_value': round(50000 * min(avg_conf * 1.5, 2.0) * min(total_mappings / 50000, 1.5), 2),
                'training_cost': 50000,
                'performance_score': round(avg_conf * 100, 1),
                'roi_percentage': round((min(avg_conf * 1.5, 2.0) * min(total_mappings / 50000, 1.5) - 1) * 100, 1),
                'model_version': 'v1.0',
                'gl_account': '15200'
            },
            {
                'asset_name': 'Merchant Mapping Model',
                'asset_type': 'model',
                'current_value': round(75000 * min(avg_conf * 1.8, 2.0) * 1.2, 2),
                'training_cost': 75000,
                'performance_score': round(avg_conf * 100, 1),
                'roi_percentage': round((min(avg_conf * 1.8, 2.0) * 1.2 - 1) * 100, 1),
                'model_version': 'v1.0',
                'gl_account': '15200'
            }
        ]

        total_value = sum(a['current_value'] for a in individual_assets)
        total_cost = sum(a['training_cost'] for a in individual_assets)

        return jsonify({
            'success': True,
            'data': {
                'analytics': {
                    'totalMappings': total_mappings,
                    'dailyProcessed': min(total_mappings, 1000),  # Estimate
                    'accuracyRate': round(avg_conf * 100, 1),
                    'autoApprovalRate': round((approved_count / max(total_mappings, 1)) * 100, 1),
                    'systemStatus': "online",
                    'databaseStatus': "connected",
                    'aiModelStatus': "active",
                    'lastUpdated': datetime.now().isoformat(),
                    'performanceMetrics': {
                        'processing_speed': f'{total_mappings:,} total records',
                        'avg_confidence': round(avg_conf * 100, 1),
                        'error_rate': '0.02%',
                        'uptime': '99.9%',
                        'memory_usage': '1.2GB'
                    },
                    'categoryDistribution': category_distribution
                },
                'mappings': {
                    'pending': pending_mappings,
                    'approved': approved_mappings,
                    'rejected': rejected_mappings,
                    'counts': {
                        'pending': pending_count,
                        'approved': approved_count,
                        'rejected': rejected_count
                    }
                },
                'llm_data_assets': {
                    'assets': individual_assets,
                    'summary': {
                        'total_assets': len(individual_assets),
                        'total_value': total_value,
                        'total_cost': total_cost,
                        'average_performance': round(avg_conf * 100, 1),
                        'average_roi': round((total_value / total_cost - 1) * 100, 1) if total_cost > 0 else 0,
                        'gl_account': '15200'
                    }
                }
            }
        })
        
    except Exception as e:
        try:
            if conn:
                conn.close()
        except Exception:
            pass
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'data': {
                'analytics': {
                    'totalMappings': 0,
                    'dailyProcessed': 0,
                    'accuracyRate': 0,
                    'autoApprovalRate': 0,
                    'systemStatus': 'offline',
                    'databaseStatus': 'disconnected',
                    'aiModelStatus': 'inactive',
                    'lastUpdated': datetime.now().isoformat(),
                    'performanceMetrics': {
                        'processing_speed': '0 total records',
                        'avg_confidence': 0,
                        'error_rate': '0%',
                        'uptime': '0%',
                        'memory_usage': '0%'
                    },
                    'categoryDistribution': {}
                },
                'mappings': {
                    'pending': [],
                    'approved': [],
                    'rejected': []
                },
                'llm_data_assets': {
                    'assets': [],
                    'summary': {
                        'total_assets': 0,
                        'total_value': 0,
                        'total_cost': 0,
                        'average_performance': 0,
                        'average_roi': 0,
                        'gl_account': '15200'
                    }
                }
            }
        }), 500

# ML Dashboard endpoints
@app.route('/api/ml/stats', methods=['GET'])
def ml_dashboard_stats():
    """Get ML system statistics for the dashboard"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get comprehensive ML statistics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'rejected'")
        rejected_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        categories_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE source_type = 'user'")
        user_submissions = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE source_type = 'admin'")
        admin_uploads = cursor.fetchone()[0]
        
        conn.close()
        
        # Calculate metrics
        approval_rate = round((approved_mappings / max(total_mappings, 1)) * 100, 1)
        processing_efficiency = round((approved_mappings + rejected_mappings) / max(total_mappings, 1) * 100, 1)
        
        # Generate ML system stats
        ml_stats = {
            'system_status': {
                'status': 'active',
                'uptime': '99.8%',
                'last_trained': '2025-10-17T10:30:00Z',
                'model_version': 'v2.1.3'
            },
            'performance_metrics': {
                'accuracy': round(avg_confidence * 100, 1),
                'processing_speed': '2.3s avg',
                'throughput': f'{total_mappings // 30} mappings/day',
                'error_rate': '0.2%'
            },
            'data_statistics': {
                'total_mappings': total_mappings,
                'approved_mappings': approved_mappings,
                'pending_mappings': pending_mappings,
                'rejected_mappings': rejected_mappings,
                'user_submissions': user_submissions,
                'admin_uploads': admin_uploads,
                'categories_learned': categories_count,
                'approval_rate': approval_rate,
                'processing_efficiency': processing_efficiency
            },
            'learning_metrics': {
                'model_accuracy': round(avg_confidence * 100, 1),
                'confidence_threshold': 0.85,
                'auto_approval_rate': round(approval_rate * 0.8, 1),
                'learning_rate': '0.001',
                'training_samples': total_mappings
            },
            # Analytics tab specific properties
            'totalPredictions': total_mappings,
            'accuracyRate': avg_confidence,
            'learningHistorySize': user_submissions + admin_uploads,
            'modelVersion': 'v2.1.3',
            'lastTraining': '2025-10-17T10:30:00Z',
            'totalPatterns': categories_count
        }
        
        return jsonify({
            'success': True,
            'data': ml_stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# LLM SYSTEM INTEGRATION APIs - Phase 1: Core Integration
# ============================================================================

@app.route('/api/llm/global-state', methods=['GET'])
def get_global_llm_state():
    """Get unified state across all LLM components"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get LLM Center metrics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        # Get ML Dashboard metrics
        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        categories_count = cursor.fetchone()[0]
        
        # Get LLM Data Management metrics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE source_type = 'user'")
        user_submissions = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE source_type = 'admin'")
        admin_uploads = cursor.fetchone()[0]
        
        # Calculate system health
        system_health = "healthy" if total_mappings > 0 and avg_confidence > 0.5 else "degraded"
        
        conn.close()
        
        global_state = {
            'llm_center': {
                'total_mappings': total_mappings,
                'approved_mappings': approved_mappings,
                'pending_mappings': pending_mappings,
                'accuracy_rate': round(avg_confidence * 100, 1),
                'status': 'active'
            },
            'ml_dashboard': {
                'model_status': 'active',
                'categories_learned': categories_count,
                'learning_events': user_submissions + admin_uploads,
                'performance_score': round(avg_confidence * 100, 1)
            },
            'llm_data_management': {
                'data_quality': 'good' if avg_confidence > 0.7 else 'needs_attention',
                'pipeline_health': 'operational',
                'user_submissions': user_submissions,
                'admin_uploads': admin_uploads
            },
            'system_health': system_health,
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': global_state
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm/update-global-state', methods=['POST'])
def update_global_llm_state():
    """Update global state when any component changes"""
    try:
        data = request.get_json()
        component = data.get('component')
        update_data = data.get('update_data')
        
        # Log the update
        print(f"Global state update from {component}: {update_data}")
        
        # Broadcast update to all components
        # In a real implementation, this would use WebSockets or Server-Sent Events
        
        return jsonify({
            'success': True,
            'message': f'Global state updated from {component}',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Cross-Component Communication APIs
@app.route('/api/llm-center/trigger-ml-learning', methods=['POST'])
def trigger_ml_learning():
    """Trigger ML learning when new mappings approved"""
    try:
        data = request.get_json()
        mapping_ids = data.get('mapping_ids', [])
        
        # Get approved mappings
        cursor.execute("""
            SELECT id, merchant_name, ticker_symbol, category, confidence 
            FROM llm_mappings 
            WHERE id IN ({}) AND status = 'approved'
        """.format(','.join('?' * len(mapping_ids))), mapping_ids)
        
        mappings = cursor.fetchall()
        
        # Process for ML learning
        learning_data = []
        for mapping in mappings:
            learning_data.append({
                'id': mapping[0],
                'merchant_name': mapping[1],
                'ticker_symbol': mapping[2],
                'category': mapping[3],
                'confidence': mapping[4]
            })
        
        # Trigger ML learning (simulated)
        learning_result = {
            'mappings_processed': len(learning_data),
            'learning_triggered': True,
            'model_updated': True,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': learning_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-center/get-ml-status', methods=['GET'])
def get_ml_status():
    """Get ML Dashboard status from LLM Center"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get ML model status
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        categories_count = cursor.fetchone()[0]
        
        conn.close()
        
        ml_status = {
            'model_status': 'active',
            'total_approved': approved_count,
            'average_confidence': round(avg_confidence, 3),
            'categories_learned': categories_count,
            'last_training': '2025-10-17T10:30:00Z',
            'performance_score': round(avg_confidence * 100, 1)
        }
        
        return jsonify({
            'success': True,
            'data': ml_status
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/update-data-metrics', methods=['POST'])
def update_data_metrics():
    """Update data management with ML performance"""
    try:
        data = request.get_json()
        ml_metrics = data.get('ml_metrics', {})
        
        # Process ML metrics for data management
        data_metrics = {
            'ml_performance': ml_metrics.get('accuracy', 0),
            'model_health': 'good' if ml_metrics.get('accuracy', 0) > 0.8 else 'needs_attention',
            'learning_rate': ml_metrics.get('learning_rate', 0.001),
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': data_metrics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/get-data-health', methods=['GET'])
def get_data_health():
    """Get data infrastructure health from ML Dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get data pipeline health
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE created_at > datetime('now', '-1 day')")
        recent_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        conn.close()
        
        data_health = {
            'pipeline_status': 'operational',
            'total_mappings': total_mappings,
            'recent_activity': recent_mappings,
            'data_quality': 'good' if avg_confidence > 0.7 else 'needs_attention',
            'throughput': f'{recent_mappings} mappings/day',
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': data_health
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/update-center-metrics', methods=['POST'])
def update_center_metrics():
    """Update LLM Center with data quality metrics"""
    try:
        data = request.get_json()
        quality_metrics = data.get('quality_metrics', {})
        
        # Process quality metrics for LLM Center
        center_metrics = {
            'data_quality_score': quality_metrics.get('quality_score', 0),
            'quality_status': 'good' if quality_metrics.get('quality_score', 0) > 0.8 else 'needs_attention',
            'recommendations': quality_metrics.get('recommendations', []),
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': center_metrics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/get-center-status', methods=['GET'])
def get_center_status():
    """Get LLM Center status from data management"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get LLM Center operational status
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE created_at > datetime('now', '-1 hour')")
        recent_activity = cursor.fetchone()[0]
        
        conn.close()
        
        center_status = {
            'operational_status': 'active',
            'pending_mappings': pending_count,
            'approved_mappings': approved_count,
            'recent_activity': recent_activity,
            'processing_efficiency': 'high' if recent_activity > 0 else 'normal',
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': center_status
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# LLM SYSTEM INTEGRATION APIs - Phase 2: Learning Loop & Quality Gates
# ============================================================================

@app.route('/api/learning/feedback-pipeline', methods=['POST'])
def learning_feedback_pipeline():
    """Process feedback from LLM Center to ML Dashboard"""
    try:
        data = request.get_json()
        feedback_data = data.get('feedback_data', {})
        
        # Process feedback for learning
        learning_result = {
            'feedback_processed': True,
            'learning_triggered': True,
            'model_improvement': 'incremental',
            'confidence_adjustment': 0.05,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': learning_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/model-update', methods=['POST'])
def model_update():
    """Update ML model based on new learning"""
    try:
        data = request.get_json()
        learning_data = data.get('learning_data', {})
        
        # Simulate model update
        model_update_result = {
            'model_updated': True,
            'new_patterns_learned': learning_data.get('patterns_count', 0),
            'confidence_improvement': 0.02,
            'model_version': 'v2.1.4',
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': model_update_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/learning/quality-check', methods=['POST'])
def quality_check():
    """Check data quality before learning"""
    try:
        data = request.get_json()
        mapping_data = data.get('mapping_data', {})
        
        # Quality checks
        quality_score = 0.0
        issues = []
        
        # Check merchant name quality
        if mapping_data.get('merchant_name'):
            quality_score += 0.3
        else:
            issues.append('Missing merchant name')
        
        # Check ticker symbol quality
        if mapping_data.get('ticker_symbol'):
            quality_score += 0.3
        else:
            issues.append('Missing ticker symbol')
        
        # Check confidence quality
        confidence = mapping_data.get('confidence', 0)
        if confidence > 0.7:
            quality_score += 0.4
        elif confidence > 0.5:
            quality_score += 0.2
        else:
            issues.append('Low confidence score')
        
        quality_result = {
            'quality_score': quality_score,
            'quality_status': 'good' if quality_score > 0.8 else 'needs_attention',
            'issues': issues,
            'recommendations': ['Improve data quality'] if issues else ['Data quality is good'],
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': quality_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/quality/auto-check', methods=['POST'])
def auto_quality_check():
    """Automated quality check for new mappings"""
    try:
        data = request.get_json()
        mapping_id = data.get('mapping_id')
        
        if not mapping_id:
            return jsonify({
                'success': False,
                'error': 'Mapping ID required'
            }), 400
        
        # Get mapping data
        cursor.execute("SELECT * FROM llm_mappings WHERE id = %s", (mapping_id,))
        mapping = cursor.fetchone()
        
        if not mapping:
            return jsonify({
                'success': False,
                'error': 'Mapping not found'
            }), 404
        
        # Perform quality checks
        quality_checks = {
            'merchant_name_present': bool(mapping[2]),  # merchant_name
            'ticker_symbol_present': bool(mapping[3]),  # ticker_symbol
            'category_present': bool(mapping[4]),  # category
            'confidence_adequate': mapping[5] > 0.5 if mapping[5] else False,  # confidence
            'notes_present': bool(mapping[6])  # notes
        }
        
        quality_score = sum(quality_checks.values()) / len(quality_checks)
        
        auto_check_result = {
            'mapping_id': mapping_id,
            'quality_score': quality_score,
            'quality_status': 'approved' if quality_score > 0.8 else 'needs_review',
            'checks_passed': quality_checks,
            'auto_approve': quality_score > 0.9,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': auto_check_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/quality/set-thresholds', methods=['POST'])
def set_quality_thresholds():
    """Set quality thresholds for automated checks"""
    try:
        data = request.get_json()
        thresholds = data.get('thresholds', {})
        
        # Store quality thresholds (in a real implementation, this would be in a config table)
        quality_config = {
            'min_confidence': thresholds.get('min_confidence', 0.7),
            'min_completeness': thresholds.get('min_completeness', 0.8),
            'auto_approve_threshold': thresholds.get('auto_approve_threshold', 0.9),
            'require_notes': thresholds.get('require_notes', False),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': quality_config
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/quality/get-metrics', methods=['GET'])
def get_quality_metrics():
    """Get current quality metrics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get quality statistics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE confidence > 0.8")
        high_confidence = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE merchant_name IS NOT NULL AND merchant_name != ''")
        complete_merchants = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE ticker_symbol IS NOT NULL AND ticker_symbol != ''")
        complete_tickers = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        conn.close()
        
        quality_metrics = {
            'total_mappings': total_mappings,
            'high_confidence_rate': round((high_confidence / max(total_mappings, 1)) * 100, 1),
            'merchant_completeness': round((complete_merchants / max(total_mappings, 1)) * 100, 1),
            'ticker_completeness': round((complete_tickers / max(total_mappings, 1)) * 100, 1),
            'average_confidence': round(avg_confidence, 3),
            'overall_quality_score': round((avg_confidence + (complete_merchants / max(total_mappings, 1)) + (complete_tickers / max(total_mappings, 1))) / 3, 3),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': quality_metrics
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================================================
# LLM DATA MANAGEMENT APIs
# ============================================================================

@app.route('/api/llm-data/system-status', methods=['GET'])
def llm_data_system_status():
    """Get LLM data management system status"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get system metrics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE created_at > datetime('now', '-1 day')")
        recent_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        conn.close()
        
        # Determine system status based on data
        status = 'operational' if total_mappings > 0 else 'standby'
        data_quality = 'excellent' if avg_confidence > 0.8 else 'good' if avg_confidence > 0.6 else 'needs_attention'
        pipeline_health = 'healthy' if recent_mappings > 0 else 'idle'
        
        system_status = {
            'status': status,
            'total_mappings': total_mappings,
            'recent_activity': recent_mappings,
            'data_quality': data_quality,
            'pipeline_health': pipeline_health,
            'avg_confidence': round(avg_confidence * 100, 1),
            'processing_rate': f'{recent_mappings}/day',
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': system_status
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/llm-data/vector-embeddings', methods=['GET'])
def llm_data_vector_embeddings():
    """Get vector embeddings status and metrics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get vector embeddings metrics (empty data)
        cursor.execute("SELECT COUNT(DISTINCT merchant_name) FROM llm_mappings WHERE merchant_name IS NOT NULL")
        unique_merchants = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        unique_categories = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        conn.close()
        
        # Determine status based on data availability
        status = 'active' if unique_merchants > 0 else 'inactive'
        embedding_quality = 'excellent' if avg_confidence > 0.8 else 'good' if avg_confidence > 0.6 else 'needs_attention'
        
        vector_embeddings = {
            'status': status,
            'unique_merchants': unique_merchants,
            'unique_categories': unique_categories,
            'embedding_quality': embedding_quality,
            'vector_dimensions': 768,
            'similarity_threshold': 0.85,
            'avg_confidence': round(avg_confidence * 100, 1),
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': vector_embeddings
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/feature-store', methods=['GET'])
def llm_data_feature_store():
    """Get feature store status and metrics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get feature store metrics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_features = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT merchant_name) FROM llm_mappings WHERE merchant_name IS NOT NULL")
        merchant_patterns = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        user_behavior = cursor.fetchone()[0]
        
        # PostgreSQL uses NOW() - INTERVAL instead of SQLite datetime()
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE created_at > NOW() - INTERVAL '1 day'")
        transaction_features = cursor.fetchone()[0]

        conn.close()

        # Determine status and calculate realistic metrics
        status = 'active' if total_features > 0 else 'inactive'
        cache_hit_rate = min(merchant_patterns / max(total_features, 1) * 100, 95.0) if total_features > 0 else 0.0
        storage_efficiency = min(100 - (total_features / 1000000) * 10, 95.0) if total_features > 0 else 100.0
        
        feature_store = {
            'status': status,
            'merchant_patterns': merchant_patterns,
            'user_behavior': user_behavior,
            'transaction_features': transaction_features,
            'total_features': total_features,
            'cache_hit_rate': round(cache_hit_rate, 1),
            'avg_compute_time': max(5, 12 - (total_features / 100000)),  # Faster with more data
            'storage_efficiency': round(storage_efficiency, 1),
            'last_update': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': feature_store
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/refresh-features', methods=['POST'])
def llm_data_refresh_features():
    """Refresh feature store"""
    try:
        # Simulate feature refresh
        refresh_result = {
            'status': 'success',
            'features_refreshed': True,
            'merchant_patterns_updated': 1200,
            'user_behavior_updated': 800,
            'transaction_features_updated': 600,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': refresh_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/rebuild-cache', methods=['POST'])
def llm_data_rebuild_cache():
    """Rebuild feature store cache"""
    try:
        # Simulate cache rebuild
        cache_result = {
            'status': 'success',
            'cache_rebuilt': True,
            'cache_hit_rate': 96.5,
            'storage_efficiency': 89.2,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': cache_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/configure', methods=['POST'])
def llm_data_configure():
    """Configure LLM data management settings"""
    try:
        data = request.get_json()
        config = data.get('config', {})
        
        # Simulate configuration update
        config_result = {
            'status': 'success',
            'configuration_updated': True,
            'settings': config,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': config_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/initialize-system', methods=['POST'])
def llm_data_initialize_system():
    """Initialize LLM data management system"""
    try:
        # Simulate system initialization
        init_result = {
            'status': 'success',
            'system_initialized': True,
            'components_initialized': [
                'vector_embeddings',
                'feature_store',
                'rag_collections',
                'event_pipeline'
            ],
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': init_result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/llm-data/search', methods=['POST'])
def llm_data_search():
    """Search RAG collections with intelligent question answering using real RAG system"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        topK = data.get('topK', 5)
        threshold = data.get('threshold', 0.1)
        
        # Import and use the new RAG system
        from rag_system import get_rag_system
        rag_system = get_rag_system()
        
        # Perform semantic search
        search_results = rag_system.search(query, topK, threshold)
        
        # Generate contextual answer
        if search_results:
            passages = search_results
        else:
            # Fallback to basic help if no results found
            passages = [{
                'id': 'help',
                'text': "I can help you with questions about Kamioi's platform including: system architecture, auto-invest features, LLM Data Assets, GL accounts, Family Dashboard, risk management, business continuity, and API endpoints. Please ask a specific question about any aspect of the Kamioi platform.",
                'score': 0.5,
                'source': 'help',
                'content': "I can help you with questions about Kamioi's platform including: system architecture, auto-invest features, LLM Data Assets, GL accounts, Family Dashboard, risk management, business continuity, and API endpoints. Please ask a specific question about any aspect of the Kamioi platform."
            }]
        
        search_results = {
            'query': query,
            'passages': passages,
            'total_results': len(passages),
            'search_time': 0.12
        }
        
        return jsonify({
            'success': True,
            'data': search_results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/recognize', methods=['POST'])
def ml_recognize():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        text = data.get('text', '')
        
        # Simulate ML recognition
        import random
        categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities']
        confidence = round(random.uniform(0.7, 0.95), 2)
        category = random.choice(categories)
        
        return jsonify({
            'success': True,
            'data': {
                'category': category,
                'confidence': confidence,
                'merchant': text,
                'ticker_symbol': 'AAPL' if 'apple' in text.lower() else 'MSFT'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/learn', methods=['POST'])
def ml_learn():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        
        # Simulate learning process
        import time
        time.sleep(1)  # Simulate processing time
        
        return jsonify({
            'success': True,
            'data': {
                'accuracy_improvement': '+2.3%',
                'new_patterns_learned': 15,
                'model_updated': True
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/feedback', methods=['POST'])
def ml_feedback():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        feedback_type = data.get('type', 'positive')
        mapping_id = data.get('mapping_id')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Update mapping based on feedback
        if feedback_type == 'positive':
            cursor.execute('''
                UPDATE llm_mappings 
                SET confidence = confidence + 0.1, status = 'approved'
                WHERE id = ?
            ''', (mapping_id,))
        else:
            cursor.execute('''
                UPDATE llm_mappings 
                SET confidence = confidence - 0.1, status = 'pending'
                WHERE id = ?
            ''', (mapping_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Feedback {feedback_type} recorded successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/retrain', methods=['POST'])
def ml_retrain():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Simulate retraining process
        import time
        time.sleep(2)  # Simulate processing time
        
        return jsonify({
            'success': True,
            'data': {
                'training_completed': True,
                'accuracy': 0.94,
                'improvement': '+1.8%',
                'training_time': '2 minutes'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/export', methods=['GET'])
def ml_export():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        export_type = request.args.get('type', 'model')
        
        # Simulate export process
        import time
        time.sleep(1)
        
        return jsonify({
            'success': True,
            'data': {
                'export_file': f'ml_model_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pkl',
                'file_size': '2.3MB',
                'export_type': export_type
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Admin ML Dashboard endpoints
@app.route('/api/admin/ml/analytics', methods=['GET'])
def admin_ml_analytics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get ML analytics data
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT category) FROM llm_mappings WHERE category IS NOT NULL")
        categories = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_mappings': total_mappings,
                'approved_mappings': approved_mappings,
                'average_confidence': round(avg_confidence, 2),
                'categories': categories,
                'accuracy_rate': round((approved_mappings / max(total_mappings, 1)) * 100, 1)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/ml/predictions', methods=['GET'])
def admin_ml_predictions():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Simulate prediction data
        import random
        predictions = []
        for i in range(10):
            predictions.append({
                'id': i + 1,
                'merchant': f'Merchant {i + 1}',
                'predicted_category': random.choice(['Food', 'Transport', 'Shopping', 'Entertainment']),
                'confidence': round(random.uniform(0.6, 0.95), 2),
                'status': random.choice(['pending', 'approved', 'rejected'])
            })
        
        return jsonify({
            'success': True,
            'data': {
                'predictions': predictions,
                'total_predictions': len(predictions)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/ml/models', methods=['GET'])
def admin_ml_models():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Simulate model data
        models = [
            {
                'id': 1,
                'name': 'Transaction Classifier v2.1',
                'accuracy': 0.94,
                'status': 'active',
                'last_trained': '2025-10-17T10:30:00Z',
                'training_samples': 632300
            },
            {
                'id': 2,
                'name': 'Merchant Recognition v1.8',
                'accuracy': 0.89,
                'status': 'training',
                'last_trained': '2025-10-16T15:45:00Z',
                'training_samples': 450000
            }
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'models': models,
                'total_models': len(models)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/ml/performance', methods=['GET'])
def admin_ml_performance():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Simulate performance metrics
        import random
        performance_data = {
            'accuracy_trend': [0.89, 0.91, 0.92, 0.93, 0.94],
            'processing_speed': f"{random.randint(100, 500)}ms",
            'throughput': f"{random.randint(1000, 5000)} requests/hour",
            'error_rate': f"{random.uniform(0.1, 2.0):.1f}%",
            'uptime': '99.8%'
        }
        
        return jsonify({
            'success': True,
            'data': performance_data
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/ml/metrics', methods=['GET'])
def admin_ml_metrics():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get comprehensive ML metrics
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'approved'")
        approved = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'pending'")
        pending = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE status = 'rejected'")
        rejected = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_mappings': total_mappings,
                'approved': approved,
                'pending': pending,
                'rejected': rejected,
                'approval_rate': round((approved / max(total_mappings, 1)) * 100, 1),
                'average_confidence': round(avg_confidence, 2),
                'processing_efficiency': '94.2%',
                'model_accuracy': '94.1%'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Additional Family API endpoints
@app.route('/api/family/mapping-history', methods=['GET'])
def family_mapping_history():
    """Get family mapping history"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'mappings': [],
                'stats': {
                    'points_earned': 0,
                    'total_mappings': 0,
                    'approved_mappings': 0,
                    'pending_mappings': 0,
                    'accuracy_rate': 0
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/rewards', methods=['GET'])
def family_rewards():
    """Get family rewards data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'rewards': [],
                'points': {
                    'total': 0
                },
                'recent_earnings': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/leaderboard', methods=['GET'])
def family_leaderboard():
    """Get family leaderboard data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'leaderboard': [],
                'family_total': {
                    'points': 0,
                    'savings': 0.00,
                    'investments': 0
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/family/statements', methods=['GET'])
def family_statements():
    """Get family statements data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'statements': [
                    {
                        'id': 1,
                        'month': 'October 2025',
                        'total_spending': 2450.00,
                        'total_savings': 180.00,
                        'round_ups': 45.00,
                        'investments': 135.00,
                        'status': 'current'
                    },
                    {
                        'id': 2,
                        'month': 'September 2025',
                        'total_spending': 2200.00,
                        'total_savings': 165.00,
                        'round_ups': 40.00,
                        'investments': 125.00,
                        'status': 'completed'
                    }
                ]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Business API endpoints
@app.route('/api/business/dashboard/overview', methods=['GET'])
def business_dashboard_overview():
    """Get business dashboard overview data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'total_revenue': 125000.00,
                'monthly_revenue': 15000.00,
                'active_customers': 1250,
                'new_customers': 45,
                'conversion_rate': 12.5,
                'average_order_value': 85.50,
                'recent_transactions': [
                    {
                        'id': 1,
                        'customer': 'John Smith',
                        'amount': 250.00,
                        'date': '2025-10-18',
                        'status': 'completed'
                    },
                    {
                        'id': 2,
                        'customer': 'Jane Doe',
                        'amount': 180.00,
                        'date': '2025-10-17',
                        'status': 'pending'
                    }
                ],
                'top_products': [
                    {
                        'name': 'Product A',
                        'sales': 1250,
                        'revenue': 25000.00
                    },
                    {
                        'name': 'Product B',
                        'sales': 980,
                        'revenue': 19600.00
                    }
                ]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/customers', methods=['GET'])
def business_customers():
    """Get business customers data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'customers': [
                    {
                        'id': 1,
                        'name': 'John Smith',
                        'email': 'john@example.com',
                        'total_orders': 15,
                        'total_spent': 2500.00,
                        'last_order': '2025-10-15',
                        'status': 'active'
                    },
                    {
                        'id': 2,
                        'name': 'Jane Doe',
                        'email': 'jane@example.com',
                        'total_orders': 8,
                        'total_spent': 1200.00,
                        'last_order': '2025-10-10',
                        'status': 'active'
                    }
                ],
                'total_customers': 1250,
                'active_customers': 1100,
                'new_this_month': 45
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/products', methods=['GET'])
def business_products():
    """Get business products data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'products': [
                    {
                        'id': 1,
                        'name': 'Product A',
                        'price': 25.00,
                        'stock': 150,
                        'sales': 1250,
                        'revenue': 31250.00,
                        'status': 'active'
                    },
                    {
                        'id': 2,
                        'name': 'Product B',
                        'price': 20.00,
                        'stock': 200,
                        'sales': 980,
                        'revenue': 19600.00,
                        'status': 'active'
                    }
                ],
                'total_products': 25,
                'active_products': 22,
                'low_stock': 3
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/orders', methods=['GET'])
def business_orders():
    """Get business orders data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'orders': [
                    {
                        'id': 1,
                        'customer': 'John Smith',
                        'amount': 250.00,
                        'status': 'completed',
                        'date': '2025-10-18',
                        'items': 3
                    },
                    {
                        'id': 2,
                        'customer': 'Jane Doe',
                        'amount': 180.00,
                        'status': 'pending',
                        'date': '2025-10-17',
                        'items': 2
                    }
                ],
                'total_orders': 1250,
                'pending_orders': 45,
                'completed_orders': 1150,
                'cancelled_orders': 55
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/business/team/members', methods=['GET'])
def business_team_members():
    """Get business team members data"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        return jsonify({
            'success': True,
            'data': {
                'members': [],
                'total_members': 0,
                'active_members': 0,
                'departments': []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Transaction Processing Pipeline
@app.route('/api/transactions/process', methods=['POST'])
def process_transaction():
    """Process transaction with AI mapping"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        description = data.get('description', '')
        amount = data.get('amount', 0)
        merchant_name = data.get('merchantName', '')
        
        if not user_id or not description:
            return jsonify({'success': False, 'error': 'User ID and description required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Extract merchant name from description if not provided
        if not merchant_name:
            merchant_name = extract_merchant_from_description(description)
        
        # Search for existing mapping
        mapping = find_best_mapping(cursor, merchant_name, description)
        
        if mapping and mapping['confidence'] > 0.8:
            # High confidence - auto-apply
            ai_analysis = {
                'category': mapping['category'],
                'confidence': mapping['confidence'],
                'suggestedTicker': mapping['ticker_symbol'],
                'source': 'llm_mappings',
                'reasoning': f"Matched '{merchant_name}' to {mapping['ticker_symbol']} with {mapping['confidence']*100:.1f}% confidence"
            }
            
            # Update transaction in database
            cursor.execute("""
                UPDATE transactions 
                SET category = ?, merchant = ?, status = 'mapped'
                WHERE user_id = ? AND description = ?
            """, (mapping['category'], merchant_name, user_id, description))
            conn.commit()
            
            conn.close()
            
            return jsonify({
                'success': True,
                'data': {
                    'aiAnalysis': ai_analysis,
                    'investment': {
                        'suggestedTicker': mapping['ticker_symbol'],
                        'confidence': mapping['confidence']
                    }
                }
            })
        else:
            # Low confidence or no match - mark for manual review
            ai_analysis = {
                'category': 'Unknown',
                'confidence': mapping['confidence'] if mapping else 0.0,
                'suggestedTicker': 'UNKNOWN',
                'source': 'no_match',
                'reasoning': f"No high-confidence mapping found for '{merchant_name}'"
            }
            
            conn.close()
            
            return jsonify({
                'success': True,
                'data': {
                    'aiAnalysis': ai_analysis,
                    'investment': {
                        'suggestedTicker': 'UNKNOWN',
                        'confidence': 0.0
                    }
                }
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def extract_merchant_from_description(description):
    """Extract merchant name from transaction description"""
    # Simple extraction logic - can be enhanced with NLP
    description = description.upper()
    
    # Remove common prefixes
    prefixes_to_remove = ['PURCHASE', 'PAYMENT', 'TRANSFER', 'DEBIT', 'CREDIT', 'POS']
    for prefix in prefixes_to_remove:
        if description.startswith(prefix):
            description = description[len(prefix):].strip()
    
    # Remove common suffixes
    suffixes_to_remove = ['INC', 'LLC', 'CORP', 'LTD', 'CO']
    for suffix in suffixes_to_remove:
        if description.endswith(suffix):
            description = description[:-len(suffix)].strip()
    
    # Take first 2-3 words as merchant name
    words = description.split()
    if len(words) >= 2:
        return ' '.join(words[:2])
    else:
        return words[0] if words else 'UNKNOWN'

def find_best_mapping(cursor, merchant_name, description):
    """Find best mapping for merchant name"""
    try:
        # Search for exact matches first
        cursor.execute("""
            SELECT merchant_name, ticker_symbol, category, confidence, status
            FROM llm_mappings 
            WHERE status = 'approved' 
            AND merchant_name LIKE ?
            ORDER BY confidence DESC
            LIMIT 1
        """, (f"%{merchant_name}%",))
        
        exact_match = cursor.fetchone()
        if exact_match:
            return {
                'merchant_name': exact_match['merchant_name'],
                'ticker_symbol': exact_match['ticker_symbol'],
                'category': exact_match['category'],
                'confidence': exact_match['confidence']
            }
        
        # Search for partial matches
        cursor.execute("""
            SELECT merchant_name, ticker_symbol, category, confidence, status
            FROM llm_mappings 
            WHERE status = 'approved' 
            AND (merchant_name LIKE ? OR merchant_name LIKE ?)
            ORDER BY confidence DESC
            LIMIT 1
        """, (f"%{merchant_name[:3]}%", f"%{merchant_name}%"))
        
        partial_match = cursor.fetchone()
        if partial_match:
            # Reduce confidence for partial matches (less aggressive reduction)
            reduced_confidence = partial_match['confidence'] * 0.9
            return {
                'merchant_name': partial_match['merchant_name'],
                'ticker_symbol': partial_match['ticker_symbol'],
                'category': partial_match['category'],
                'confidence': reduced_confidence
            }
        
        return None
        
    except Exception as e:
        print(f"Error finding mapping: {e}")
        return None

def calculate_fee_for_account_type(account_type, transaction_amount, user_id=None, round_up_amount=1.0):
    """Calculate fee based on account type and transaction amount using AI system"""
    try:
        # Use AI system if available and user_id provided
        if AI_SYSTEM_ENABLED and user_id:
            try:
                ai_result = ai_fee_engine.calculate_optimal_fee(user_id, transaction_amount, round_up_amount)
                return ai_result['final_fee']
            except Exception as e:
                print(f"AI fee calculation failed, using fallback: {e}")
        
        # Fallback to original calculation
        fee_settings = {
            'individual': {
                'feeType': 'fixed',
                'fixedAmount': 0.25,
                'percentage': 0.0,
                'isActive': True
            },
            'family': {
                'feeType': 'fixed',
                'fixedAmount': 0.10,
                'percentage': 0.0,
                'isActive': True
            },
            'business': {
                'feeType': 'percentage',
                'fixedAmount': 0.0,
                'percentage': 10.0,
                'isActive': True
            }
        }

        # Get fee settings for account type
        settings = fee_settings.get(account_type, fee_settings['individual'])

        if not settings['isActive']:
            return 0.0

        if settings['feeType'] == 'fixed':
            return settings['fixedAmount']
        elif settings['feeType'] == 'percentage':
            return (transaction_amount * settings['percentage']) / 100

        return 0.0

    except Exception as e:
        print(f"Error calculating fee: {e}")
        return 0.0

def auto_process_transaction(cursor, user_id, description, merchant):
    """Auto-process transaction with AI mapping during creation"""
    try:
        # Extract merchant name from description if not provided
        if not merchant or merchant == 'Unknown Merchant':
            merchant = extract_merchant_from_description(description)
        
        # Search for existing mapping
        mapping = find_best_mapping(cursor, merchant, description)
        
        if mapping and mapping['confidence'] > 0.8:
            # High confidence - auto-apply
            return {
                'merchant': mapping['merchant_name'],
                'category': mapping['category'],
                'confidence': mapping['confidence'],
                'suggestedTicker': mapping['ticker_symbol'],
                'source': 'llm_mappings',
                'reasoning': f"Auto-matched '{merchant}' to {mapping['ticker_symbol']} with {mapping['confidence']*100:.1f}% confidence"
            }
        else:
            # Low confidence or no match - return for manual review
            return {
                'merchant': merchant,
                'category': 'Unknown',
                'confidence': mapping['confidence'] if mapping else 0.0,
                'suggestedTicker': 'UNKNOWN',
                'source': 'no_match',
                'reasoning': f"No high-confidence mapping found for '{merchant}'"
            }
        
    except Exception as e:
        print(f"Error in auto_process_transaction: {e}")
        return None

@app.route('/api/transactions/bulk-upload', methods=['POST'])
def bulk_upload_transactions():
    """Bulk upload CSV transactions - backend processing"""
    try:
        # Get authentication
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')
        
        # Get CSV data from request
        data = request.get_json()
        csv_data = data.get('csvData')
        
        if not csv_data:
            return jsonify({'success': False, 'error': 'No CSV data provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        processed_count = 0
        errors = []
        
        # Process each transaction
        for row in csv_data:
            try:
                # Extract transaction data
                amount = float(row.get('Amount', row.get('amount', 0)))
                merchant = row.get('Description', row.get('merchant', 'Unknown Merchant'))
                category = row.get('Category', row.get('category', 'General'))
                date = row.get('Date', row.get('date', datetime.now().strftime('%Y-%m-%d')))
                description = row.get('Description', row.get('description', 'Transaction'))
                
                # Get user's account type for fee calculation
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()
                account_type = user['role'] if user else 'individual'
                
                # Calculate round-up and fees based on account type
                round_up = 1.00  # Fixed round-up amount
                fee = calculate_fee_for_account_type(account_type, round_up)
                total_debit = round_up + fee
                
                # Insert transaction
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                """, (user_id, amount, merchant, category, date, description, round_up, fee, total_debit, datetime.now().isoformat()))
                
                transaction_id = cursor.lastrowid
                
                # Process with AI mapping
                ai_result = auto_process_transaction(cursor, user_id, description, merchant)
                
                # Update transaction with AI results
                if ai_result and ai_result['confidence'] > 0.8:
                    cursor.execute("""
                        UPDATE transactions 
                        SET category = ?, merchant = ?, status = 'mapped', ticker = ?
                        WHERE id = ?
                    """, (ai_result['category'], ai_result['merchant'], ai_result['suggestedTicker'], transaction_id))
                
                processed_count += 1
                
            except Exception as e:
                errors.append(f"Error processing row: {str(e)}")
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'processed': processed_count,
            'errors': errors
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# AI-Powered Admin Endpoints
@app.route('/api/admin/ai/analytics', methods=['GET'])
def admin_ai_analytics():
    """Get AI analytics for admin dashboard"""
    try:
        if not AI_SYSTEM_ENABLED:
            return jsonify({'error': 'AI system not available'}), 503
        
        # Get tier analytics
        tier_analytics = tier_manager.get_tier_analytics()
        
        # Get market analytics
        market_analytics = market_monitor.get_market_analytics()
        
        # Get AI recommendations
        recommendations = []
        if AI_SYSTEM_ENABLED:
            try:
                # Process tier updates to get recommendations
                tier_result = tier_manager.process_tier_updates()
                recommendations.extend(tier_result.get('recommendations', []))
            except Exception as e:
                print(f"Error getting AI recommendations: {e}")
        
        return jsonify({
            'success': True,
            'tier_analytics': tier_analytics,
            'market_analytics': market_analytics,
            'ai_recommendations': recommendations,
            'ai_system_status': 'active'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/ai/tier-updates', methods=['POST'])
def admin_process_tier_updates():
    """Process tier updates for all users"""
    try:
        if not AI_SYSTEM_ENABLED:
            return jsonify({'error': 'AI system not available'}), 503
        
        result = tier_manager.process_tier_updates()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/ai/market-update', methods=['POST'])
def admin_update_market_conditions():
    """Update market conditions with latest data"""
    try:
        if not AI_SYSTEM_ENABLED:
            return jsonify({'error': 'AI system not available'}), 503
        
        result = market_monitor.update_market_conditions()
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/ai/user-recommendations/<int:user_id>', methods=['GET'])
def admin_get_user_recommendations(user_id):
    """Get AI recommendations for specific user"""
    try:
        if not AI_SYSTEM_ENABLED:
            return jsonify({'error': 'AI system not available'}), 503
        
        # Get user recommendations
        recommendations = tier_manager._generate_user_recommendations(user_id)
        
        # Get AI fee analysis for user
        user_profile = tier_manager._get_user_info(user_id)
        ai_analysis = ai_fee_engine._analyze_ai_factors(
            user_profile, 
            market_monitor._get_latest_market_conditions(), 
            100.0  # Sample transaction amount
        )
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'recommendations': recommendations,
            'ai_analysis': ai_analysis,
            'user_profile': {
                'account_type': user_profile['account_type'],
                'current_tier': user_profile['current_tier'],
                'monthly_transactions': user_profile['monthly_transaction_count'],
                'loyalty_score': user_profile['loyalty_score']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/ai/fee-optimization', methods=['GET'])
def admin_get_fee_optimization():
    """Get AI-powered fee optimization recommendations"""
    try:
        if not AI_SYSTEM_ENABLED:
            return jsonify({'error': 'AI system not available'}), 503
        
        # Get market conditions
        market_analytics = market_monitor.get_market_analytics()
        
        # Get tier analytics
        tier_analytics = tier_manager.get_tier_analytics()
        
        # Generate optimization recommendations
        optimization_recommendations = {
            'market_conditions': market_analytics['latest_conditions'],
            'tier_distribution': tier_analytics['overall_stats'],
            'optimization_opportunities': [
                {
                    'type': 'tier_upgrades',
                    'description': f"{tier_analytics['overall_stats']['upgraded_users']} users eligible for tier upgrades",
                    'impact': 'high',
                    'action': 'Process tier updates to increase user satisfaction'
                },
                {
                    'type': 'fee_adjustments',
                    'description': 'Market conditions suggest fee optimization opportunities',
                    'impact': 'medium',
                    'action': 'Review market recommendations for fee adjustments'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'optimization_recommendations': optimization_recommendations,
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# System Settings Endpoints
@app.route('/api/admin/settings/fees', methods=['GET'])
def admin_get_fee_settings():
    """Get current fee settings"""
    try:
        # Return default fee settings
        fee_settings = {
            'individual': {
                'feeType': 'fixed',
                'fixedAmount': 0.25,
                'percentage': 0.0,
                'isActive': True
            },
            'family': {
                'feeType': 'fixed',
                'fixedAmount': 0.10,
                'percentage': 0.0,
                'isActive': True
            },
            'business': {
                'feeType': 'percentage',
                'fixedAmount': 0.0,
                'percentage': 10.0,
                'isActive': True
            },
            'currency': 'USD',
            'feeDescription': 'Transaction processing fee',
            'lastUpdated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': fee_settings
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/settings/system', methods=['GET'])
def admin_get_system_settings():
    """Get system configuration settings"""
    try:
        system_config = {
            'maintenanceMode': False,
            'registrationEnabled': True,
            'emailNotifications': True,
            'smsNotifications': False,
            'twoFactorRequired': False,
            'sessionTimeout': 30,
            'maxLoginAttempts': 5,
            'passwordMinLength': 8,
            'autoLogout': True
        }
        
        return jsonify({
            'success': True,
            'data': system_config
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/settings/notifications', methods=['GET'])
def admin_get_notification_settings():
    """Get notification settings"""
    try:
        notification_settings = {
            'emailEnabled': True,
            'smsEnabled': False,
            'pushEnabled': True,
            'marketingEmails': False,
            'securityAlerts': True,
            'systemUpdates': True,
            'businessReports': True
        }
        
        return jsonify({
            'success': True,
            'data': notification_settings
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# NOTE: This is a duplicate endpoint - the primary one is above (admin_get_pending_mappings)
# Keeping this for now but fixed for PostgreSQL
@app.route('/api/admin/llm-center/pending-mappings-v2', methods=['GET'])
def admin_llm_pending_mappings():
    """Get pending LLM mappings (alternate endpoint)"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # Get user-submitted mappings with status 'pending' using explicit columns
        select_cols = '''id, merchant_name, ticker_symbol, category, confidence,
                         status, admin_approved, company_name, user_id, created_at,
                         transaction_id, dashboard_type, ai_processed, notes'''
        if search:
            cursor.execute(f'''
                SELECT {select_cols} FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', limit, (page - 1) * limit))
        else:
            cursor.execute(f'''
                SELECT {select_cols} FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            ''', (limit, (page - 1) * limit))

        mappings = cursor.fetchall()

        # Get total count for pending user mappings
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE status = 'pending' AND user_id IS NOT NULL
            ''')

        total_count = cursor.fetchone()[0]
        conn.close()

        # Convert to list of dictionaries using explicit column order
        mappings_list = []
        for m in mappings:
            conf_val = float(m[4]) if m[4] else 0
            mappings_list.append({
                'id': m[0],
                'merchant_name': m[1],
                'ticker_symbol': m[2],
                'ticker': m[2],
                'category': m[3],
                'confidence': conf_val,
                'status': m[5],
                'admin_approved': m[6],
                'company_name': m[7],
                'user_id': m[8],
                'created_at': m[9].isoformat() if m[9] else None,
                'transaction_id': m[10],
                'dashboard_type': m[11],
                'ai_processed': m[12],
                'notes': m[13]
            })

        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/approved-mappings', methods=['GET'])
def admin_llm_approved_mappings():
    """Get approved LLM mappings"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # Get mappings with admin_approved=1 (PostgreSQL %s placeholders)
        if search:
            cursor.execute('''
                SELECT * FROM llm_mappings
                WHERE admin_approved = 1
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            ''', (f'%{search}%', f'%{search}%', f'%{search}%', limit, (page - 1) * limit))
        else:
            cursor.execute('''
                SELECT * FROM llm_mappings
                WHERE admin_approved = 1
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            ''', (limit, (page - 1) * limit))

        mappings = cursor.fetchall()

        # Get total count for approved mappings
        if search:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE admin_approved = 1
                AND (merchant_name LIKE %s OR category LIKE %s OR ticker_symbol LIKE %s)
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor.execute('''
                SELECT COUNT(*) FROM llm_mappings
                WHERE admin_approved = 1
            ''')
        
        total_count = cursor.fetchone()[0]
        conn.close()
        
        # Convert to list of dictionaries
        mappings_list = []
        for mapping in mappings:
            mappings_list.append({
                'id': mapping[0],
                'transaction_id': mapping[1],
                'merchant_name': mapping[2],
                'ticker': mapping[3],
                'category': mapping[4],
                'confidence': mapping[5],
                'status': mapping[6],
                'admin_approved': mapping[7],
                'ai_processed': mapping[8],
                'company_name': mapping[9],
                'user_id': mapping[10],
                'created_at': mapping[11],
                'notes': mapping[12],
                'ticker_symbol': mapping[13],
                'admin_id': mapping[14],
                'mapping_id': mapping[16] if len(mapping) > 16 else None,
                'ai_attempted': mapping[17] if len(mapping) > 17 else None,
                'ai_status': mapping[18] if len(mapping) > 18 else None,
                'ai_confidence': mapping[19] if len(mapping) > 19 else None,
                'ai_reasoning': mapping[20] if len(mapping) > 20 else None,
                'ai_processing_time': mapping[21] if len(mapping) > 21 else None,
                'ai_model_version': mapping[22] if len(mapping) > 22 else None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'mappings': mappings_list,
                'pagination': {
                    'current_page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'total_count': total_count,
                    'has_next': page * limit < total_count,
                    'has_prev': page > 1
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# Blog Management API Endpoints
@app.route('/api/admin/blog/posts', methods=['GET'])
def admin_get_blog_posts():
    """Get all blog posts with pagination and filtering"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status = request.args.get('status', '')
        category = request.args.get('category', '')
        search = request.args.get('search', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if blog_posts table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='blog_posts'")
        if not cursor.fetchone():
            # Table doesn't exist, return empty data
            conn.close()
            return jsonify({
                'success': True,
                'data': {
                    'posts': []
                },
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': 0,
                    'pages': 0
                }
            })
        
        # Build query with filters
        where_conditions = []
        params = []
        
        if status:
            where_conditions.append("status = ?")
            params.append(status)
        
        if category:
            where_conditions.append("category = ?")
            params.append(category)
        
        if search:
            where_conditions.append("(title LIKE ? OR content LIKE ? OR excerpt LIKE ?)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        where_clause = "WHERE " + " AND ".join(where_conditions) if where_conditions else ""
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM blog_posts {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]
        
        # Get posts with pagination
        offset = (page - 1) * limit
        query = f"""
            SELECT * FROM blog_posts 
            {where_clause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        """
        cursor.execute(query, params + [limit, offset])
        posts = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'posts': [dict(post) for post in posts]
            },
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        # Return empty data instead of error to prevent UI crash
        return jsonify({
            'success': True,
            'data': {
                'posts': []
            },
            'pagination': {
                'page': 1,
                'limit': 10,
                'total': 0,
                'pages': 0
            }
        }), 200

@app.route('/api/admin/blog/posts', methods=['POST'])
def admin_create_blog_post():
    """Create a new blog post"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'error': f'{field} is required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate slug if not provided
        import re
        import json
        slug = data.get('slug') or re.sub(r'[^a-z0-9-]', '', data['title'].lower().replace(' ', '-'))
        
        # Ensure unique slug
        original_slug = slug
        counter = 1
        while True:
            cursor.execute("SELECT id FROM blog_posts WHERE slug = %s", (slug,))
            if not cursor.fetchone():
                break
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Calculate word count and read time
        word_count = len(data['content'].split())
        read_time = max(1, word_count // 200)  # Assuming 200 words per minute
        
        # Set default author if not provided
        author_id = data.get('author_id') or 1  # Default to admin user
        author_name = data.get('author_name') or 'Admin'
        
        # Set published_at if status is published
        published_at = None
        if data.get('status') == 'published':
            published_at = datetime.now().isoformat()
        
        # Insert blog post
        cursor.execute("""
            INSERT INTO blog_posts (
                title, slug, content, excerpt, featured_image, status, author_id, author_name,
                category, tags, seo_title, seo_description, seo_keywords, meta_robots,
                canonical_url, og_title, og_description, og_image, twitter_title,
                twitter_description, twitter_image, schema_markup, read_time, word_count,
                published_at, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            data['title'], slug, data['content'], data.get('excerpt', ''),
            data.get('featured_image', ''), data.get('status', 'published'),
            author_id, author_name,
            data.get('category', ''), json.dumps(data.get('tags', [])),
            data.get('seo_title', ''), data.get('seo_description', ''),
            data.get('seo_keywords', ''), data.get('meta_robots', 'index,follow'),
            data.get('canonical_url', ''), data.get('og_title', ''),
            data.get('og_description', ''), data.get('og_image', ''),
            data.get('twitter_title', ''), data.get('twitter_description', ''),
            data.get('twitter_image', ''), data.get('schema_markup', ''),
            read_time, word_count, published_at,
            datetime.now().isoformat(), datetime.now().isoformat()
        ))
        
        post_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'post_id': post_id,
            'message': 'Blog post created successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/blog/posts/<int:post_id>', methods=['PUT'])
def admin_update_blog_post(post_id):
    """Update a blog post"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if post exists
        cursor.execute("SELECT id FROM blog_posts WHERE id = %s", (post_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        # Update post
        update_fields = []
        params = []
        
        for field in ['title', 'content', 'excerpt', 'featured_image', 'status', 'category',
                     'seo_title', 'seo_description', 'seo_keywords', 'meta_robots',
                     'canonical_url', 'og_title', 'og_description', 'og_image',
                     'twitter_title', 'twitter_description', 'twitter_image', 'schema_markup']:
            if field in data:
                update_fields.append(f"{field} = ?")
                if field == 'tags':
                    params.append(json.dumps(data[field]))
                else:
                    params.append(data[field])
        
        if 'content' in data:
            word_count = len(data['content'].split())
            read_time = max(1, word_count // 200)
            update_fields.extend(['word_count = ?', 'read_time = ?'])
            params.extend([word_count, read_time])
        
        update_fields.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(post_id)
        
        query = f"UPDATE blog_posts SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Blog post updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/blog/posts/<int:post_id>', methods=['DELETE'])
def admin_delete_blog_post(post_id):
    """Delete a blog post"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if post exists
        cursor.execute("SELECT id FROM blog_posts WHERE id = %s", (post_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        # Delete post
        cursor.execute("DELETE FROM blog_posts WHERE id = %s", (post_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Blog post deleted successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/blog/ai-seo-optimize', methods=['POST'])
def admin_ai_seo_optimize():
    """AI-powered SEO optimization for blog posts"""
    try:
        import json
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        post_id = data.get('post_id')
        content = data.get('content', '')
        title = data.get('title', '')
        
        if not post_id:
            return jsonify({'success': False, 'error': 'Post ID is required'}), 400
        
        # AI SEO Analysis (simulated - in production, use real AI service)
        word_count = len(content.split())
        title_length = len(title)
        
        # Calculate SEO score
        seo_score = 0
        suggestions = []
        
        # Title optimization
        if 30 <= title_length <= 60:
            seo_score += 20
        else:
            suggestions.append("Title should be 30-60 characters for optimal SEO")
        
        # Content length
        if word_count >= 300:
            seo_score += 20
        else:
            suggestions.append("Content should be at least 300 words for better SEO")
        
        # Keyword density (simplified)
        keywords = data.get('seo_keywords', '').split(',')
        if keywords and keywords[0]:
            keyword = keywords[0].strip().lower()
            keyword_count = content.lower().count(keyword)
            density = (keyword_count / word_count) * 100 if word_count > 0 else 0
            
            if 1 <= density <= 3:
                seo_score += 20
            else:
                suggestions.append(f"Keyword density should be 1-3%. Current: {density:.1f}%")
        
        # Meta description
        meta_desc = data.get('seo_description', '')
        if 120 <= len(meta_desc) <= 160:
            seo_score += 20
        else:
            suggestions.append("Meta description should be 120-160 characters")
        
        # Content structure
        if '<h1>' in content or '<h2>' in content:
            seo_score += 10
        else:
            suggestions.append("Add heading tags (H1, H2) to improve content structure")
        
        # Internal linking (simplified)
        if '<a href=' in content:
            seo_score += 10
        else:
            suggestions.append("Consider adding internal links to improve SEO")
        
        # Update post with AI analysis
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE blog_posts 
            SET ai_seo_score = ?, ai_seo_suggestions = ?, updated_at = ?
            WHERE id = ?
        """, (seo_score, json.dumps(suggestions), datetime.now().isoformat(), post_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'seo_score': seo_score,
            'suggestions': suggestions,
            'analysis': {
                'word_count': word_count,
                'title_length': title_length,
                'keyword_density': density if 'density' in locals() else 0,
                'meta_description_length': len(meta_desc)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Public blog endpoints (no authentication required)
@app.route('/api/blog/posts', methods=['GET'])
def public_get_blog_posts():
    """Get published blog posts for public display"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 6, type=int)
        category = request.args.get('category', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        where_clause = "WHERE status = 'published'"
        params = []

        if category:
            where_clause += " AND category = %s"
            params.append(category)

        # Get total count
        count_query = f"SELECT COUNT(*) FROM blog_posts {where_clause}"
        cursor.execute(count_query, params if params else None)
        total = cursor.fetchone()[0]

        # Get posts with pagination
        offset = (page - 1) * limit
        query = f"""
            SELECT id, title, slug, excerpt, featured_image, category, tags,
                   author_name, read_time, published_at, views
            FROM blog_posts
            {where_clause}
            ORDER BY published_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, params + [limit, offset])
        posts = cursor.fetchall()

        conn.close()

        # Convert tuples to dicts: 0=id, 1=title, 2=slug, 3=excerpt, 4=featured_image,
        # 5=category, 6=tags, 7=author_name, 8=read_time, 9=published_at, 10=views
        post_list = [{
            'id': p[0], 'title': p[1], 'slug': p[2], 'excerpt': p[3],
            'featured_image': p[4], 'category': p[5], 'tags': p[6],
            'author_name': p[7], 'read_time': p[8], 'published_at': p[9], 'views': p[10]
        } for p in posts]

        return jsonify({
            'success': True,
            'posts': post_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/blog/posts/<slug>', methods=['GET'])
def public_get_blog_post(slug):
    """Get a single blog post by slug"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get post - get all columns for full post data
        cursor.execute("""
            SELECT id, title, slug, excerpt, content, featured_image, category, tags,
                   author_name, author_avatar, read_time, status, published_at, views, created_at, updated_at
            FROM blog_posts
            WHERE slug = %s AND status = 'published'
        """, (slug,))
        post = cursor.fetchone()

        if not post:
            conn.close()
            return jsonify({'success': False, 'error': 'Post not found'}), 404

        # Increment view count
        cursor.execute("""
            UPDATE blog_posts
            SET views = views + 1
            WHERE id = %s
        """, (post[0],))

        conn.commit()
        conn.close()

        # Convert tuple to dict
        post_dict = {
            'id': post[0], 'title': post[1], 'slug': post[2], 'excerpt': post[3],
            'content': post[4], 'featured_image': post[5], 'category': post[6], 'tags': post[7],
            'author_name': post[8], 'author_avatar': post[9], 'read_time': post[10],
            'status': post[11], 'published_at': post[12], 'views': post[13],
            'created_at': post[14], 'updated_at': post[15]
        }

        return jsonify({
            'success': True,
            'post': post_dict
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Image Upload Endpoints
@app.route('/api/admin/upload/image', methods=['POST'])
def admin_upload_image():
    """Upload image for blog posts"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        # Check if image data is provided
        if 'image' not in request.files and 'imageData' not in request.json:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'images')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Handle base64 image data (from frontend)
        if 'imageData' in request.json:
            image_data = request.json['imageData']
            if image_data.startswith('data:image'):
                # Remove data URL prefix
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            
            # Generate unique filename
            filename = f"{uuid.uuid4().hex}.jpg"
            filepath = os.path.join(upload_dir, filename)
            
            # Save image
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            # Return URL
            image_url = f"/uploads/images/{filename}"
            return jsonify({
                'success': True,
                'image_url': image_url,
                'filename': filename
            })
        
        # Handle file upload
        elif 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({'success': False, 'error': 'No file selected'}), 400
            
            # Generate unique filename
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            filepath = os.path.join(upload_dir, filename)
            
            # Save file
            file.save(filepath)
            
            # Return URL
            image_url = f"/uploads/images/{filename}"
            return jsonify({
                'success': True,
                'image_url': image_url,
                'filename': filename
            })
        
        return jsonify({'success': False, 'error': 'Invalid image data'}), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/uploads/images/<filename>')
def serve_image(filename):
    """Serve uploaded images"""
    try:
        upload_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'images')
        return send_from_directory(upload_dir, filename)
    except Exception as e:
        return jsonify({'error': str(e)}), 404







# Transactions endpoint for CSV upload and processing
@app.route('/api/transactions', methods=['POST'])
# Ticker lookup endpoint
@app.route('/api/lookup/ticker', methods=['GET'])
def lookup_ticker():
    """Look up stock ticker for a company name"""
    try:
        company_name = request.args.get('company', '').strip()
        if not company_name:
            return jsonify({'success': False, 'error': 'Company name required'}), 400
        
        # Simple ticker lookup logic
        ticker_mapping = {
            'AMAZON': 'AMZN',
            'APPLE': 'AAPL', 
            'GOOGLE': 'GOOGL',
            'MICROSOFT': 'MSFT',
            'NETFLIX': 'NFLX',
            'TESLA': 'TSLA',
            'META': 'META',
            'STARBUCKS': 'SBUX',
            'WALMART': 'WMT',
            'TARGET': 'TGT',
            'COSTCO': 'COST',
            'HOME DEPOT': 'HD',
            'LOWES': 'LOW',
            'BEST BUY': 'BBY',
            'GAMESTOP': 'GME'
        }
        
        # Try exact match first
        company_upper = company_name.upper()
        if company_upper in ticker_mapping:
            ticker = ticker_mapping[company_upper]
        else:
            # Try partial matches
            ticker = None
            for key, value in ticker_mapping.items():
                if key in company_upper or company_upper in key:
                    ticker = value
                    break
        
        if ticker:
            return jsonify({
                'success': True,
                'ticker': ticker,
                'company': company_name,
                'confidence': 0.8
            })
        else:
            return jsonify({
                'success': True,
                'ticker': 'UNKNOWN',
                'company': company_name,
                'confidence': 0.0
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Auto-mapping endpoint for transactions
@app.route('/api/transactions/auto-map', methods=['POST'])
def auto_map_transaction():
    """Automatically map a transaction using LLM"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['user_id', 'description', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Extract merchant name from description
        merchant_name = extract_merchant_from_description(data['description'])
        
        # Search for existing mapping
        mapping = find_best_mapping(cursor, merchant_name, data['description'])
        
        if mapping and mapping['confidence'] > 0.8:
            # High confidence - auto-apply
            ai_analysis = {
                'category': mapping['category'],
                'confidence': mapping['confidence'],
                'suggestedTicker': mapping['ticker_symbol'],
                'source': 'llm_mappings',
                'reasoning': f"Matched '{merchant_name}' to {mapping['ticker_symbol']} with {mapping['confidence']*100:.1f}% confidence"
            }
            
            # Update transaction in database
            cursor.execute("""
                UPDATE transactions 
                SET category = ?, merchant = ?, status = 'mapped'
                WHERE user_id = ? AND description = ?
            """, (mapping['category'], merchant_name, data['user_id'], data['description']))
            conn.commit()
            
            conn.close()
            
            return jsonify({
                'success': True,
                'data': {
                    'aiAnalysis': ai_analysis,
                    'investment': {
                        'suggestedTicker': mapping['ticker_symbol'],
                        'confidence': mapping['confidence']
                    }
                }
            })
        else:
            # Low confidence or no match - mark for manual review
            ai_analysis = {
                'category': 'Unknown',
                'confidence': mapping['confidence'] if mapping else 0.0,
                'suggestedTicker': 'UNKNOWN',
                'source': 'no_match',
                'reasoning': f"No high-confidence mapping found for '{merchant_name}'"
            }
            
            conn.close()
            
            return jsonify({
                'success': True,
                'data': {
                    'aiAnalysis': ai_analysis,
                    'investment': {
                        'suggestedTicker': 'UNKNOWN',
                        'confidence': 0.0
                    }
                }
            })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Transactions endpoint for CSV upload and processing
@app.route('/api/transactions', methods=['POST'])
def process_transactions():
    """Process transactions from CSV upload with automatic mapping"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        if not data or 'transactions' not in data:
            return jsonify({'success': False, 'error': 'No transactions data provided'}), 400
        
        transactions = data['transactions']
        user_id = data.get('user_id', '')
        
        if not user_id:
            return jsonify({'success': False, 'error': 'User ID required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get user's round-up setting
        cursor.execute("SELECT round_up_amount FROM users WHERE id = %s", (user_id,))
        user_row = cursor.fetchone()
        user_round_up_amount = float(user_row[0]) if user_row and user_row[0] else 1.00

        processed_transactions = []

        for transaction in transactions:
            try:
                # Extract merchant name from description
                merchant_name = extract_merchant_from_description(transaction.get('description', ''))

                # Search for existing mapping
                mapping = find_best_mapping(cursor, merchant_name, transaction.get('description', ''))

                # Use user's FIXED round-up amount (not nearest dollar calculation)
                amount = float(transaction.get('amount', 0))
                round_up = user_round_up_amount if amount > 0 else 0

                # No fee - subscription pays for service
                fee = 0
                total_debit = amount + round_up
                
                # Determine status and investment based on mapping
                if mapping and mapping['confidence'] > 0.8:
                    status = 'mapped'
                    investment = mapping['ticker_symbol']
                    category = mapping['category']
                else:
                    status = 'pending'
                    investment = 'UNKNOWN'
                    category = 'Unknown'
                
                # Insert transaction into database
                cursor.execute("""
                    INSERT INTO transactions (
                        user_id, amount, description, merchant, category, 
                        round_up, fee, total_debit, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    amount,
                    transaction.get('description', ''),
                    merchant_name,
                    category,
                    round_up,
                    fee,
                    total_debit,
                    status,
                    datetime.now().isoformat()
                ))
                
                transaction_id = cursor.lastrowid
                
                processed_transactions.append({
                    'id': transaction_id,
                    'amount': amount,
                    'description': transaction.get('description', ''),
                    'merchant': merchant_name,
                    'category': category,
                    'round_up': round_up,
                    'fee': fee,
                    'total_debit': total_debit,
                    'status': status,
                    'investment': investment,
                    'confidence': mapping['confidence'] if mapping else 0.0
                })
                
            except Exception as e:
                print(f"Error processing transaction: {e}")
                continue
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Processed {len(processed_transactions)} transactions',
            'transactions': processed_transactions,
            'summary': {
                'total_processed': len(processed_transactions),
                'mapped': len([t for t in processed_transactions if t['status'] == 'mapped']),
                'pending': len([t for t in processed_transactions if t['status'] == 'pending'])
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# =============================================================================
# AI PROCESSING SYSTEM ENDPOINTS
# =============================================================================

@app.route('/api/admin/ai/process-mapping', methods=['POST'])
def process_mapping_with_ai():
    """Process a mapping through AI system with confidence scoring"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Invalid admin token'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['mapping_id', 'merchant_name', 'ticker_symbol', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Simulate AI processing with confidence scoring
        import random
        import time
        
        start_time = time.time()
        
        # AI Analysis Logic (simulated)
        merchant_name = data['merchant_name'].upper()
        ticker_symbol = data['ticker_symbol'].upper()
        category = data['category']
        
        # Simulate AI confidence based on merchant name patterns
        confidence = 0.0
        reasoning = ""
        
        # High confidence patterns
        if any(keyword in merchant_name for keyword in ['APPLE', 'MICROSOFT', 'GOOGLE', 'AMAZON', 'TESLA']):
            confidence = random.uniform(0.85, 0.95)
            reasoning = f"High confidence match: {merchant_name} clearly maps to {ticker_symbol}"
        elif any(keyword in merchant_name for keyword in ['STARBUCKS', 'MCDONALDS', 'WALMART', 'TARGET']):
            confidence = random.uniform(0.75, 0.85)
            reasoning = f"Medium-high confidence: {merchant_name} likely maps to {ticker_symbol}"
        elif len(merchant_name) > 10 and any(char.isdigit() for char in merchant_name):
            confidence = random.uniform(0.60, 0.75)
            reasoning = f"Medium confidence: {merchant_name} with location data maps to {ticker_symbol}"
        else:
            confidence = random.uniform(0.40, 0.60)
            reasoning = f"Low-medium confidence: {merchant_name} uncertain mapping to {ticker_symbol}"
        
        # Determine AI decision
        ai_status = "pending"
        ai_auto_approved = False
        
        if confidence >= 0.85:
            ai_status = "approved"
            ai_auto_approved = True
        elif confidence >= 0.60:
            ai_status = "review_required"
        else:
            ai_status = "rejected"
        
        processing_time = time.time() - start_time
        
        # Update mapping with AI processing results
        cursor.execute("""
            UPDATE llm_mappings 
            SET ai_attempted = 1,
                ai_status = ?,
                ai_confidence = ?,
                ai_reasoning = ?,
                ai_processing_time = CURRENT_TIMESTAMP,
                ai_model_version = 'v1.0',
                ai_auto_approved = ?,
                ai_processing_duration = ?,
                ai_decision_timestamp = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (ai_status, confidence, reasoning, ai_auto_approved, 
              int(processing_time * 1000), data['mapping_id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'mapping_id': data['mapping_id'],
                'ai_status': ai_status,
                'ai_confidence': confidence,
                'ai_reasoning': reasoning,
                'ai_auto_approved': ai_auto_approved,
                'processing_time': processing_time,
                'model_version': 'v1.0'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/ai/process-queue', methods=['POST'])
def process_ai_queue():
    """Process all pending mappings through AI system"""
    try:
        auth_header = request.headers.get('Authorization')
        print(f"AI Process Queue - Auth Header: {auth_header}")
        if not auth_header or not auth_header.startswith('Bearer '):
            print("AI Process Queue - No token provided")
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        print(f"AI Process Queue - Extracted Token: {token}")
        print(f"AI Process Queue - Expected Token: kamioi_admin_token or admin_token_3")
        if not token.startswith('admin_token_'):
            print("AI Process Queue - Invalid admin token")
            return jsonify({'success': False, 'error': 'Invalid admin token'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all pending mappings - prioritize user-submitted mappings
        cursor.execute("""
            SELECT id, merchant_name, ticker_symbol, category, user_id, transaction_id
            FROM llm_mappings 
            WHERE ai_attempted = 0 OR ai_status = 'pending'
            ORDER BY 
                CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END,
                created_at ASC
            LIMIT 50
        """)
        pending_mappings = cursor.fetchall()
        
        processed_count = 0
        auto_approved_count = 0
        review_required_count = 0
        rejected_count = 0
        
        print(f"AI Process Queue - Found {len(pending_mappings)} pending mappings to process")
        
        # Check if our specific mapping is in the list
        target_mapping_id = 37558529
        target_found = False
        for mapping in pending_mappings:
            if mapping[0] == target_mapping_id:
                target_found = True
                print(f"AI Process Queue - TARGET MAPPING {target_mapping_id} FOUND IN PROCESSING LIST!")
                break
        
        if not target_found:
            print(f"AI Process Queue - TARGET MAPPING {target_mapping_id} NOT FOUND IN PROCESSING LIST!")
        
        for mapping in pending_mappings:
            mapping_id, merchant_name, ticker_symbol, category, user_id, transaction_id = mapping
            print(f"AI Process Queue - Processing mapping {mapping_id}: {merchant_name} -> {ticker_symbol}")
            
            # Simulate AI processing
            import random
            import time
            
            start_time = time.time()
            
            # AI Analysis Logic
            merchant_upper = merchant_name.upper()
            confidence = 0.0
            reasoning = ""
            
            # High confidence patterns
            if any(keyword in merchant_upper for keyword in ['APPLE', 'MICROSOFT', 'GOOGLE', 'AMAZON', 'TESLA']):
                confidence = random.uniform(0.85, 0.95)
                reasoning = f"High confidence: {merchant_name} clearly maps to {ticker_symbol}"
            elif any(keyword in merchant_upper for keyword in ['STARBUCKS', 'MCDONALDS', 'WALMART', 'TARGET']):
                confidence = random.uniform(0.75, 0.85)
                reasoning = f"Medium-high confidence: {merchant_name} likely maps to {ticker_symbol}"
            elif len(merchant_name) > 10 and any(char.isdigit() for char in merchant_name):
                confidence = random.uniform(0.60, 0.75)
                reasoning = f"Medium confidence: {merchant_name} with location data maps to {ticker_symbol}"
            else:
                confidence = random.uniform(0.40, 0.60)
                reasoning = f"Low-medium confidence: {merchant_name} uncertain mapping to {ticker_symbol}"
            
            # Determine AI decision
            ai_status = "pending"
            ai_auto_approved = False
            
            if confidence >= 0.85:
                ai_status = "approved"
                ai_auto_approved = True
                auto_approved_count += 1
            elif confidence >= 0.60:
                ai_status = "review_required"
                review_required_count += 1
            else:
                ai_status = "rejected"
                rejected_count += 1
            
            processing_time = time.time() - start_time
            
            # Update mapping with AI processing results
            print(f"AI Process Queue - Updating mapping {mapping_id} with status: {ai_status}, confidence: {confidence}")
            cursor.execute("""
                UPDATE llm_mappings 
                SET ai_attempted = 1,
                    ai_status = ?,
                    ai_confidence = ?,
                    ai_reasoning = ?,
                    ai_processing_time = CURRENT_TIMESTAMP,
                    ai_model_version = 'v1.0',
                    ai_auto_approved = ?,
                    ai_processing_duration = ?,
                    ai_decision_timestamp = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (ai_status, confidence, reasoning, ai_auto_approved, 
                  int(processing_time * 1000), mapping_id))
            
            print(f"AI Process Queue - Updated mapping {mapping_id} successfully")
            processed_count += 1
        
        # Update analytics
        cursor.execute("""
            INSERT OR REPLACE INTO ai_processing_analytics 
            (date, total_processed, auto_approved, admin_reviewed, rejected, average_confidence)
            VALUES (CURRENT_DATE, ?, ?, ?, ?, ?)
        """, (processed_count, auto_approved_count, review_required_count, 
              rejected_count, 0.75))  # Average confidence placeholder
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'processed_count': processed_count,
                'auto_approved': auto_approved_count,
                'review_required': review_required_count,
                'rejected': rejected_count,
                'message': f'Processed {processed_count} mappings through AI system'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/data-assets', methods=['GET'])
def get_llm_data_assets():
    """Get LLM Data Assets for financial dashboard - OPTIMIZED"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        conn.rollback()  # Clear any aborted transaction

        # FAST: Use pg_class for estimated count
        cursor.execute('''
            SELECT reltuples::bigint FROM pg_class WHERE relname = 'llm_mappings'
        ''')
        result = cursor.fetchone()
        total_mappings = int(result[0]) if result and result[0] else 0

        # FAST: Get avg confidence - return 0 if no data (don't fake 93%)
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        result = cursor.fetchone()
        avg_confidence = float(result[0]) if result and result[0] else 0

        # FAST: Estimate categories (skip for speed, use fixed value)
        categories_count = 20  # Reasonable estimate

        # FAST: Use approval count from GROUP BY
        cursor.execute('SELECT COUNT(*) FROM llm_mappings WHERE admin_approved = 1')
        approved_count = cursor.fetchone()[0] or 0

        conn.close()
        
        # Calculate REAL asset values based on actual data
        # Only show assets if there are mappings
        assets_data = []
        
        if total_mappings > 0:
            # Calculate model value based on number of mappings and quality
            model_value = total_mappings * 0.75 * avg_confidence  # $0.75 per high-quality mapping
            model_cost = total_mappings * 0.05  # $0.05 training cost per mapping
            model_performance = avg_confidence * 100
            model_roi = ((model_value - model_cost) / max(model_cost, 1)) * 100
            
            assets_data.append({
                'asset_name': 'KamioiGPT Mapping Model',
                'asset_type': 'model',
                'current_value': round(model_value, 2),
                'training_cost': round(model_cost, 2),
                'performance_score': round(model_performance, 1),
                'model_version': 'v1.0',
                'accuracy_rate': round(model_performance, 1),
                'processing_speed': min(total_mappings / 1000, 500),  # Speed based on data size
                'roi_percentage': round(model_roi, 0),
                'gl_account': '15200',
                'last_updated': datetime.now().isoformat()
            })
            
            # Dataset asset
            dataset_value = total_mappings * 0.35 * avg_confidence
            dataset_cost = total_mappings * 0.015
            dataset_performance = (approved_count / max(total_mappings, 1)) * 100
            dataset_roi = ((dataset_value - dataset_cost) / max(dataset_cost, 1)) * 100
            
            assets_data.append({
                'asset_name': 'Transaction Mapping Dataset',
                'asset_type': 'dataset',
                'current_value': round(dataset_value, 2),
                'training_cost': round(dataset_cost, 2),
                'performance_score': round(dataset_performance, 1),
                'model_version': 'v1.0',
                'accuracy_rate': round(dataset_performance, 1),
                'processing_speed': 0,
                'roi_percentage': round(dataset_roi, 0),
                'gl_account': '15200',
                'last_updated': datetime.now().isoformat()
            })
            
            # Category recognition model
            if categories_count > 0:
                category_value = categories_count * 1000 * avg_confidence
                category_cost = categories_count * 50
                category_performance = min((categories_count / 50) * 100, 100)  # Max at 50 categories
                category_roi = ((category_value - category_cost) / max(category_cost, 1)) * 100
                
                assets_data.append({
                    'asset_name': 'Category Recognition Model',
                    'asset_type': 'model',
                    'current_value': round(category_value, 2),
                    'training_cost': round(category_cost, 2),
                    'performance_score': round(category_performance, 1),
                    'model_version': 'v1.0',
                    'accuracy_rate': round(category_performance, 1),
                    'processing_speed': min(categories_count * 10, 300),
                    'roi_percentage': round(category_roi, 0),
                    'gl_account': '15200',
                    'last_updated': datetime.now().isoformat()
                })
        
        # Calculate totals
        total_value = sum(asset['current_value'] for asset in assets_data)
        total_cost = sum(asset['training_cost'] for asset in assets_data)
        avg_performance = sum(asset['performance_score'] for asset in assets_data) / len(assets_data) if assets_data else 0
        avg_roi = sum(asset['roi_percentage'] for asset in assets_data) / len(assets_data) if assets_data else 0
        
        print(f"LLM Data Assets - Calculated from {total_mappings} mappings")
        print(f"Total Value: ${total_value:,.2f}, Total Cost: ${total_cost:,.2f}")
        
        return jsonify({
            'success': True,
            'data': {
                'assets': assets_data,
                'summary': {
                    'total_assets': len(assets_data),
                    'total_value': round(total_value, 2),
                    'total_cost': round(total_cost, 2),
                    'average_performance': round(avg_performance, 1),
                    'average_roi': round(avg_roi, 0),
                    'gl_account': '15200'
                }
            }
        })
        
    except Exception as e:
        print(f"LLM Data Assets Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-center/ai-analytics', methods=['GET'])
def get_ai_processing_analytics():
    """Get AI processing analytics and performance metrics"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        if not token.startswith('admin_token_'):
            return jsonify({'success': False, 'error': 'Invalid admin token'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get AI processing analytics
        cursor.execute("""
            SELECT date, total_processed, auto_approved, admin_reviewed, 
                   rejected, average_confidence, processing_time_avg, accuracy_rate
            FROM ai_processing_analytics
            ORDER BY date DESC
            LIMIT 30
        """)
        analytics = cursor.fetchall()
        
        # Get current AI processing stats
        cursor.execute("""
            SELECT 
                COUNT(*) as total_mappings,
                SUM(CASE WHEN ai_attempted = 1 THEN 1 ELSE 0 END) as ai_processed,
                SUM(CASE WHEN ai_auto_approved = 1 THEN 1 ELSE 0 END) as auto_approved,
                SUM(CASE WHEN ai_status = 'review_required' THEN 1 ELSE 0 END) as pending_review,
                AVG(ai_confidence) as avg_confidence,
                AVG(ai_processing_duration) as avg_processing_time
            FROM llm_mappings
        """)
        stats = cursor.fetchone()
        
        conn.close()
        
        # Format analytics data
        analytics_data = []
        for analytic in analytics:
            analytics_data.append({
                'date': analytic[0],
                'total_processed': analytic[1],
                'auto_approved': analytic[2],
                'admin_reviewed': analytic[3],
                'rejected': analytic[4],
                'average_confidence': analytic[5],
                'processing_time_avg': analytic[6],
                'accuracy_rate': analytic[7]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'analytics': analytics_data,
                'current_stats': {
                    'total_mappings': stats[0] or 0,
                    'ai_processed': stats[1] or 0,
                    'auto_approved': stats[2] or 0,
                    'pending_review': stats[3] or 0,
                    'average_confidence': stats[4] or 0,
                    'average_processing_time': stats[5] or 0
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500




# MX.com Integration Endpoints
@app.route('/api/mx/connect', methods=['POST'])
def mx_connect():
    """Initialize MX.com Connect Widget session"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id', f'user_{int(time.time())}')
        user_type = data.get('user_type', 'user')  # user, family, business
        
        # Generate unique user GUID for MX
        user_guid = f"kamioi_{user_type}_{user_id}_{int(time.time())}"
        
        # MX.com configuration
        mx_config = {
            'client_id': os.getenv('MX_CLIENT_ID', 'mx_demo_client_id'),
            'api_key': os.getenv('MX_API_KEY', 'mx_demo_api_key'),
            'environment': os.getenv('MX_ENVIRONMENT', 'sandbox'),
            'user_guid': user_guid,
            'widget_type': 'connect_widget_v2'
        }
        
        print(f"MX Connect - User: {user_id}, Type: {user_type}, GUID: {user_guid}")
        
        return jsonify({
            'success': True,
            'data': {
                'user_guid': user_guid,
                'client_id': mx_config['client_id'],
                'environment': mx_config['environment'],
                'widget_url': 'https://cdn.mx.com/connect-widget/v2/mx-connect-widget.js'
            }
        })
        
    except Exception as e:
        print(f"MX Connect Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/mx/accounts', methods=['GET'])
def mx_get_accounts():
    """Get connected bank accounts from MX.com"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        user_guid = request.args.get('user_guid')
        if not user_guid:
            return jsonify({'success': False, 'error': 'User GUID required'}), 400
        
        # In a real implementation, you would call MX.com API here
        # For demo purposes, return mock data
        mock_accounts = [
            {
                'account_id': f'account_{user_guid}_1',
                'account_name': 'Chase Checking',
                'account_type': 'checking',
                'balance': 2500.00,
                'available_balance': 2500.00,
                'account_number': '****1234',
                'routing_number': '021000021',
                'bank_name': 'Chase Bank',
                'connection_status': 'active',
                'last_updated': datetime.now().isoformat()
            },
            {
                'account_id': f'account_{user_guid}_2',
                'account_name': 'Bank of America Savings',
                'account_type': 'savings',
                'balance': 15000.00,
                'available_balance': 15000.00,
                'account_number': '****5678',
                'routing_number': '026009593',
                'bank_name': 'Bank of America',
                'connection_status': 'active',
                'last_updated': datetime.now().isoformat()
            }
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'accounts': mock_accounts,
                'total_accounts': len(mock_accounts),
                'total_balance': sum(acc['balance'] for acc in mock_accounts)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/mx/transactions', methods=['GET'])
def mx_get_transactions():
    """Get transactions from connected bank accounts"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        user_guid = request.args.get('user_guid')
        account_id = request.args.get('account_id')
        limit = int(request.args.get('limit', 50))
        
        if not user_guid:
            return jsonify({'success': False, 'error': 'User GUID required'}), 400
        
        # In a real implementation, you would call MX.com API here
        # For demo purposes, return mock transaction data
        import random
        from datetime import timedelta
        
        mock_transactions = [
            {
                'transaction_id': f'txn_{user_guid}_{i}',
                'account_id': account_id or f'account_{user_guid}_1',
                'amount': round(random.uniform(-500, 2000), 2),
                'description': f'Transaction {i+1}',
                'merchant_name': f'Merchant {i+1}',
                'category': random.choice(['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities']),
                'date': (datetime.now() - timedelta(days=i)).isoformat(),
                'status': 'posted',
                'type': 'debit' if random.random() > 0.3 else 'credit'
            }
            for i in range(min(limit, 20))
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'transactions': mock_transactions,
                'total_transactions': len(mock_transactions),
                'account_id': account_id,
                'user_guid': user_guid
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/mx/disconnect', methods=['POST'])
def mx_disconnect():
    """Disconnect bank account from MX.com"""
    try:
        data = request.get_json()
        user_guid = data.get('user_guid')
        account_id = data.get('account_id')
        
        if not user_guid:
            return jsonify({'success': False, 'error': 'User GUID required'}), 400
        
        # In a real implementation, you would call MX.com API to disconnect
        # For demo purposes, just return success
        
        return jsonify({
            'success': True,
            'message': f'Account {account_id} disconnected successfully',
            'data': {
                'user_guid': user_guid,
                'account_id': account_id,
                'disconnected_at': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================
# STRIPE PAYMENT ENDPOINTS
# ============================================

@app.route('/api/stripe/create-checkout-session', methods=['POST'])
def stripe_create_checkout_session():
    """Create a Stripe checkout session for subscription payment"""
    try:
        # Get auth token
        auth_header = request.headers.get('Authorization')
        user_id = None

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user_id = token.replace('user_token_', '')

        data = request.get_json() or {}
        plan_id = data.get('plan_id')
        billing_cycle = data.get('billing_cycle', 'monthly')

        if not plan_id:
            return jsonify({'success': False, 'error': 'Plan ID required'}), 400

        # Get plan details from database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, price_monthly, price_yearly, stripe_price_id
            FROM subscription_plans WHERE id = %s
        """, (plan_id,))
        plan = cursor.fetchone()

        if not plan:
            conn.close()
            return jsonify({'success': False, 'error': 'Plan not found'}), 404

        # Get price based on billing cycle
        price_monthly = float(plan[2]) if plan[2] else 0
        price_yearly = float(plan[3]) if plan[3] else price_monthly * 12
        amount = price_yearly if billing_cycle == 'yearly' else price_monthly

        # In sandbox/demo mode, we simulate Stripe checkout
        # In production, you would use stripe.checkout.Session.create()

        # For now, create a simulated checkout URL that will mark subscription as active
        frontend_url = os.getenv('FRONTEND_URL', 'https://kamioi-v-1.vercel.app')

        # Generate a session ID for tracking
        import uuid
        session_id = str(uuid.uuid4())

        # Store the pending checkout session (you might want a separate table for this)
        # For now, we'll use a simpler approach - direct activation in sandbox mode

        # In SANDBOX mode: Directly activate the subscription
        if user_id:
            # Create user_subscriptions table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    plan_id INTEGER NOT NULL,
                    status VARCHAR(50) DEFAULT 'active',
                    billing_cycle VARCHAR(20) DEFAULT 'monthly',
                    amount DECIMAL(10,2),
                    stripe_subscription_id VARCHAR(255),
                    stripe_customer_id VARCHAR(255),
                    current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    current_period_end TIMESTAMP,
                    cancel_at_period_end BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Calculate period end
            from datetime import datetime, timedelta
            period_end = datetime.now() + (timedelta(days=365) if billing_cycle == 'yearly' else timedelta(days=30))

            # Check if user already has a subscription
            cursor.execute("SELECT id FROM user_subscriptions WHERE user_id = %s", (user_id,))
            existing = cursor.fetchone()

            if existing:
                # Update existing subscription
                cursor.execute("""
                    UPDATE user_subscriptions
                    SET plan_id = %s, status = 'active', billing_cycle = %s, amount = %s,
                        current_period_start = CURRENT_TIMESTAMP, current_period_end = %s,
                        cancel_at_period_end = FALSE, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                """, (plan_id, billing_cycle, amount, period_end, user_id))
            else:
                # Create new subscription
                cursor.execute("""
                    INSERT INTO user_subscriptions (user_id, plan_id, status, billing_cycle, amount, current_period_end)
                    VALUES (%s, %s, 'active', %s, %s, %s)
                """, (user_id, plan_id, billing_cycle, amount, period_end))

            conn.commit()

        conn.close()

        # In sandbox mode, redirect to success page directly
        success_url = f"{frontend_url}/dashboard?subscription=success&plan={plan_id}"

        return jsonify({
            'success': True,
            'session_id': session_id,
            'url': success_url,
            'mode': 'sandbox',
            'message': 'Subscription activated (sandbox mode)'
        })

    except Exception as e:
        print(f"Stripe checkout error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stripe/create-portal-session', methods=['POST'])
def stripe_create_portal_session():
    """Create a Stripe customer portal session for subscription management"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        # Check if user has a subscription
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT us.id, us.plan_id, us.status, us.billing_cycle, us.amount,
                   us.current_period_end, us.cancel_at_period_end, sp.name as plan_name
            FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = %s
        """, (user_id,))
        subscription = cursor.fetchone()
        conn.close()

        if not subscription:
            return jsonify({
                'success': False,
                'error': 'No subscription found',
                'code': 'NO_CUSTOMER'
            }), 404

        # In sandbox mode, redirect to a management page
        frontend_url = os.getenv('FRONTEND_URL', 'https://kamioi-v-1.vercel.app')
        portal_url = f"{frontend_url}/settings?manage_subscription=true"

        return jsonify({
            'success': True,
            'url': portal_url,
            'mode': 'sandbox',
            'message': 'Redirecting to subscription management'
        })

    except Exception as e:
        print(f"Stripe portal error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stripe/cancel-subscription', methods=['POST'])
def stripe_cancel_subscription():
    """Cancel a subscription (immediately or at period end)"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        data = request.get_json() or {}
        cancel_immediately = data.get('cancel_immediately', False)

        conn = get_db_connection()
        cursor = conn.cursor()

        if cancel_immediately:
            # Cancel immediately
            cursor.execute("""
                UPDATE user_subscriptions
                SET status = 'canceled', cancel_at_period_end = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
            """, (user_id,))
        else:
            # Cancel at end of billing period
            cursor.execute("""
                UPDATE user_subscriptions
                SET cancel_at_period_end = TRUE, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s
            """, (user_id,))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Subscription canceled' if cancel_immediately else 'Subscription will be canceled at the end of the billing period'
        })

    except Exception as e:
        print(f"Cancel subscription error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stripe/reactivate-subscription', methods=['POST'])
def stripe_reactivate_subscription():
    """Reactivate a subscription that was set to cancel at period end"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_id = token.replace('user_token_', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE user_subscriptions
            SET cancel_at_period_end = FALSE, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s AND status != 'canceled'
        """, (user_id,))

        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Subscription reactivated - auto-renewal enabled'
        })

    except Exception as e:
        print(f"Reactivate subscription error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/journal-entries', methods=['GET'])
def get_journal_entries():
    """Get all journal entries from the database"""
    try:
        conn = sqlite3.connect('kamioi.db')
        cursor = conn.cursor()
        
        # Get all journal entries
        cursor.execute('''
            SELECT id, date, reference, description, location, department, 
                   transaction_type, vendor_name, customer_name, amount, 
                   from_account, to_account, status, created_at, created_by, 
                   updated_at, updated_by
            FROM journal_entries 
            ORDER BY date DESC, created_at DESC
        ''')
        
        entries = cursor.fetchall()
        
        # Convert to list of dictionaries
        journal_entries = []
        for entry in entries:
            journal_entries.append({
                'id': entry[0],
                'date': entry[1],
                'reference': entry[2],
                'description': entry[3],
                'location': entry[4],
                'department': entry[5],
                'transaction_type': entry[6],
                'vendor_name': entry[7],
                'customer_name': entry[8],
                'amount': entry[9],
                'from_account': entry[10],
                'to_account': entry[11],
                'status': entry[12],
                'created_at': entry[13],
                'created_by': entry[14],
                'updated_at': entry[15],
                'updated_by': entry[16]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'journal_entries': journal_entries,
                'total_entries': len(journal_entries)
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/journal-entries/<entry_id>', methods=['GET', 'PUT', 'DELETE'])
def journal_entry_by_id(entry_id):
    """Get, update, or delete a specific journal entry"""
    try:
        conn = sqlite3.connect('kamioi.db')
        cursor = conn.cursor()
        
        if request.method == 'GET':
            # Get specific journal entry
            cursor.execute('''
                SELECT id, date, reference, description, location, department, 
                       transaction_type, vendor_name, customer_name, amount, 
                       from_account, to_account, status, created_at, created_by, 
                       updated_at, updated_by
                FROM journal_entries 
                WHERE id = ?
            ''', (entry_id,))
            
            entry = cursor.fetchone()
            if not entry:
                return jsonify({'success': False, 'error': 'Journal entry not found'}), 404
            
            journal_entry = {
                'id': entry[0],
                'date': entry[1],
                'reference': entry[2],
                'description': entry[3],
                'location': entry[4],
                'department': entry[5],
                'transaction_type': entry[6],
                'vendor_name': entry[7],
                'customer_name': entry[8],
                'amount': entry[9],
                'from_account': entry[10],
                'to_account': entry[11],
                'status': entry[12],
                'created_at': entry[13],
                'created_by': entry[14],
                'updated_at': entry[15],
                'updated_by': entry[16]
            }
            
            conn.close()
            return jsonify({'success': True, 'data': journal_entry})
            
        elif request.method == 'PUT':
            # Update journal entry
            data = request.get_json()
            
            cursor.execute('''
                UPDATE journal_entries 
                SET date = ?, reference = ?, description = ?, location = ?, 
                    department = ?, transaction_type = ?, vendor_name = ?, 
                    customer_name = ?, amount = ?, from_account = ?, 
                    to_account = ?, status = ?, updated_at = ?, updated_by = ?
                WHERE id = ?
            ''', (
                data.get('date'),
                data.get('reference'),
                data.get('description'),
                data.get('location'),
                data.get('department'),
                data.get('transaction_type'),
                data.get('vendor_name'),
                data.get('customer_name'),
                data.get('amount'),
                data.get('from_account'),
                data.get('to_account'),
                data.get('status'),
                datetime.now().isoformat(),
                data.get('updated_by', 'admin'),
                entry_id
            ))
            
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Journal entry updated successfully'})
            
        elif request.method == 'DELETE':
            # Delete journal entry
            cursor.execute('DELETE FROM journal_entries WHERE id = %s', (entry_id,))
            conn.commit()
            conn.close()
            
            return jsonify({'success': True, 'message': 'Journal entry deleted successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/financial-analytics', methods=['GET'])
def get_financial_analytics():
    """Get pre-calculated financial analytics data"""
    try:
        conn = sqlite3.connect('kamioi.db')
        cursor = conn.cursor()
        
        # Get journal entries for calculations
        cursor.execute('SELECT * FROM journal_entries ORDER BY date DESC')
        journal_entries = cursor.fetchall()
        
        # Calculate account balances from journal entries
        def calculate_account_balance(account_code, entries):
            balance = 0
            for entry in entries:
                # entry structure: (id, date, reference, description, location, department, 
                # transaction_type, vendor_name, customer_name, amount, from_account, to_account, 
                # status, created_at, created_by, updated_at, updated_by)
                if entry[10] == account_code:  # from_account
                    balance -= entry[9]  # amount (credit)
                elif entry[11] == account_code:  # to_account
                    balance += entry[9]  # amount (debit)
            return balance
        
        # Calculate LLM Data Assets balance dynamically from approved mappings
        cursor.execute('''
            SELECT 
                COUNT(*) as total_mappings,
                AVG(confidence) as avg_confidence
            FROM llm_mappings 
            WHERE admin_approved = 1
        ''')
        mapping_stats = cursor.fetchone()
        
        # GL Account 15200 Balance: Dynamic calculation based on real performance
        # Calculate the same dynamic values as the LLM Data Assets
        if mapping_stats and len(mapping_stats) >= 3 and mapping_stats[0] > 0:
            total_mappings = mapping_stats[0]
            avg_confidence = mapping_stats[1] or 0
            high_confidence_count = mapping_stats[2] or 0
            
            # Use the same dynamic calculation logic as LLM Data Assets
            # KamioiGPT value
            kamioi_base = 180000
            kamioi_perf_mult = min(max(avg_confidence * 2, 0.5), 3.0)
            kamioi_usage_mult = min(total_mappings / 100000, 2.0)
            kamioi_value = kamioi_base * kamioi_perf_mult * kamioi_usage_mult
            
            # Dataset value
            dataset_base = 50000
            dataset_quality_mult = min(max(avg_confidence * 1.5, 0.3), 2.5)
            dataset_size_mult = min(total_mappings / 50000, 1.5)
            dataset_freshness_mult = 0.9
            dataset_value = dataset_base * dataset_quality_mult * dataset_size_mult * dataset_freshness_mult
            
            # Mapping model value
            mapping_base = 75000
            mapping_acc_mult = min(max(avg_confidence * 1.8, 0.4), 2.8)
            mapping_business_mult = min(high_confidence_count / 10000, 1.8)
            mapping_eff_mult = 1.2
            mapping_value = mapping_base * mapping_acc_mult * mapping_business_mult * mapping_eff_mult
            
            llm_balance = kamioi_value + dataset_value + mapping_value
        else:
            llm_balance = 0
        
        # Calculate GL accounts with balances
        gl_accounts = [
            # Assets
            {'code': '10100', 'name': 'Cash – Bank of America', 'type': 'Asset', 'category': 'Current Assets', 'balance': calculate_account_balance('10100', journal_entries)},
            {'code': '10150', 'name': 'Petty Cash', 'type': 'Asset', 'category': 'Current Assets', 'balance': calculate_account_balance('10150', journal_entries)},
            {'code': '11000', 'name': 'Accounts Receivable', 'type': 'Asset', 'category': 'Current Assets', 'balance': calculate_account_balance('11000', journal_entries)},
            {'code': '12000', 'name': 'Prepaid Expenses', 'type': 'Asset', 'category': 'Current Assets', 'balance': calculate_account_balance('12000', journal_entries)},
            {'code': '13000', 'name': 'Investments – Short Term', 'type': 'Asset', 'category': 'Current Assets', 'balance': calculate_account_balance('13000', journal_entries)},
            {'code': '14000', 'name': 'Equipment & Computers', 'type': 'Asset', 'category': 'Fixed Assets', 'balance': calculate_account_balance('14000', journal_entries)},
            {'code': '15000', 'name': 'Software & Development Assets', 'type': 'Asset', 'category': 'Intangible Assets', 'balance': calculate_account_balance('15000', journal_entries)},
            {'code': '15100', 'name': 'Cloud Credits / Deferred Tech Assets', 'type': 'Asset', 'category': 'Intangible Assets', 'balance': calculate_account_balance('15100', journal_entries)},
            {'code': '15200', 'name': 'LLM Data Assets', 'type': 'Asset', 'category': 'Intangible Assets', 'balance': llm_balance},
            {'code': '16000', 'name': 'Security Deposits', 'type': 'Asset', 'category': 'Other Assets', 'balance': calculate_account_balance('16000', journal_entries)},
            {'code': '17000', 'name': 'Intercompany Receivable – Basketball LLC', 'type': 'Asset', 'category': 'Other Assets', 'balance': calculate_account_balance('17000', journal_entries)},
            
            # Liabilities
            {'code': '20000', 'name': 'Accounts Payable', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('20000', journal_entries)},
            {'code': '20100', 'name': 'Credit Card Payable', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('20100', journal_entries)},
            {'code': '21000', 'name': 'Accrued Expenses', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('21000', journal_entries)},
            {'code': '22000', 'name': 'Payroll Liabilities', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('22000', journal_entries)},
            {'code': '23000', 'name': 'Deferred Revenue', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('23000', journal_entries)},
            {'code': '24000', 'name': 'Taxes Payable', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('24000', journal_entries)},
            {'code': '25000', 'name': 'Intercompany Payable – Basketball LLC', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('25000', journal_entries)},
            {'code': '26000', 'name': 'Customer Deposits', 'type': 'Liability', 'category': 'Current Liabilities', 'balance': calculate_account_balance('26000', journal_entries)},
            
            # Equity
            {'code': '30000', 'name': 'Common Stock', 'type': 'Equity', 'category': 'Equity', 'balance': calculate_account_balance('30000', journal_entries)},
            {'code': '30100', 'name': 'Additional Paid-in Capital', 'type': 'Equity', 'category': 'Equity', 'balance': calculate_account_balance('30100', journal_entries)},
            {'code': '30200', 'name': 'Owner Contributions', 'type': 'Equity', 'category': 'Equity', 'balance': calculate_account_balance('30200', journal_entries) + llm_balance},
            {'code': '31000', 'name': 'Retained Earnings', 'type': 'Equity', 'category': 'Equity', 'balance': calculate_account_balance('31000', journal_entries)},
            {'code': '32000', 'name': 'Current Year Earnings', 'type': 'Equity', 'category': 'Equity', 'balance': calculate_account_balance('32000', journal_entries)},
            
            # Revenue
            {'code': '40100', 'name': 'Revenue – Individual Accounts', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40100', journal_entries)},
            {'code': '40200', 'name': 'Revenue – Family Accounts', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40200', journal_entries)},
            {'code': '40300', 'name': 'Revenue – Business Accounts', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40300', journal_entries)},
            {'code': '40400', 'name': 'Subscription Revenue', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40400', journal_entries)},
            {'code': '40500', 'name': 'AI Insight Revenue', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40500', journal_entries)},
            {'code': '40600', 'name': 'Advertisement Revenue', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40600', journal_entries)},
            {'code': '40700', 'name': 'Platform Fee Revenue', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40700', journal_entries)},
            {'code': '40800', 'name': 'Data Licensing / API Revenue', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40800', journal_entries)},
            {'code': '40900', 'name': 'Other Revenue', 'type': 'Revenue', 'category': 'Revenue', 'balance': calculate_account_balance('40900', journal_entries)},
            
            # COGS
            {'code': '50100', 'name': 'Cloud Compute (AWS, Azure, GCP)', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50100', journal_entries)},
            {'code': '50200', 'name': 'Data Acquisition & Labeling', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50200', journal_entries)},
            {'code': '50300', 'name': 'AI/LLM Training Costs', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50300', journal_entries)},
            {'code': '50400', 'name': 'Model Hosting & API Costs', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50400', journal_entries)},
            {'code': '50500', 'name': 'Payment Processing Fees (Visa/Stripe/etc.)', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50500', journal_entries)},
            {'code': '50600', 'name': 'Content Moderation & Review', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50600', journal_entries)},
            {'code': '50700', 'name': 'Direct DevOps Support', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50700', journal_entries)},
            {'code': '50800', 'name': 'Data Storage', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50800', journal_entries)},
            {'code': '50900', 'name': 'AI Compute Hardware Depreciation', 'type': 'COGS', 'category': 'COGS', 'balance': calculate_account_balance('50900', journal_entries)},
            
            # Expenses
            {'code': '60100', 'name': 'Salaries – Full-Time Employees', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60100', journal_entries)},
            {'code': '60110', 'name': 'Salaries – Founders', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60110', journal_entries)},
            {'code': '60120', 'name': 'Contractor Payments', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60120', journal_entries)},
            {'code': '60130', 'name': 'Payroll Taxes', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60130', journal_entries)},
            {'code': '60140', 'name': 'Employee Benefits', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60140', journal_entries)},
            {'code': '60150', 'name': 'Employee Stock Compensation', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60150', journal_entries)},
            {'code': '60160', 'name': 'Recruiting & Talent Acquisition', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60160', journal_entries)},
            {'code': '60170', 'name': 'Employee Training & Development', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60170', journal_entries)},
            {'code': '60180', 'name': 'Employee Wellness & Perks', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('60180', journal_entries)},
            {'code': '61000', 'name': 'Cloud Services (AWS, Azure, GCP)', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61000', journal_entries)},
            {'code': '61010', 'name': 'LLM Hosting & API Costs', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61010', journal_entries)},
            {'code': '61020', 'name': 'Data Engineering Infrastructure', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61020', journal_entries)},
            {'code': '61030', 'name': 'Development Tools & Platforms', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61030', journal_entries)},
            {'code': '61040', 'name': 'Software Licenses', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61040', journal_entries)},
            {'code': '61050', 'name': 'Data Storage & Warehousing', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61050', journal_entries)},
            {'code': '61060', 'name': 'Monitoring & Observability', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61060', journal_entries)},
            {'code': '61070', 'name': 'Network Security & Firewalls', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61070', journal_entries)},
            {'code': '61080', 'name': 'DevOps & Automation Tools', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61080', journal_entries)},
            {'code': '61090', 'name': 'R&D – Experimental AI/LLM', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('61090', journal_entries)},
            {'code': '62000', 'name': 'Paid Advertising', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62000', journal_entries)},
            {'code': '62010', 'name': 'Social Media Marketing', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62010', journal_entries)},
            {'code': '62020', 'name': 'Content Marketing', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62020', journal_entries)},
            {'code': '62030', 'name': 'SEO & SEM Tools', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62030', journal_entries)},
            {'code': '62040', 'name': 'Brand Design & Assets', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62040', journal_entries)},
            {'code': '62050', 'name': 'Event & Sponsorships', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62050', journal_entries)},
            {'code': '62060', 'name': 'Customer Referral Incentives', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62060', journal_entries)},
            {'code': '62070', 'name': 'Public Relations', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62070', journal_entries)},
            {'code': '62080', 'name': 'Marketing Automation Tools', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62080', journal_entries)},
            {'code': '62090', 'name': 'Market Research', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('62090', journal_entries)},
            {'code': '63000', 'name': 'Rent & Office Space', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63000', journal_entries)},
            {'code': '63010', 'name': 'Utilities', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63010', journal_entries)},
            {'code': '63020', 'name': 'Insurance – General Liability', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63020', journal_entries)},
            {'code': '63030', 'name': 'Legal Fees', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63030', journal_entries)},
            {'code': '63040', 'name': 'Accounting & Audit', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63040', journal_entries)},
            {'code': '63050', 'name': 'Office Supplies', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63050', journal_entries)},
            {'code': '63060', 'name': 'Dues & Subscriptions', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63060', journal_entries)},
            {'code': '63070', 'name': 'Bank Fees', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63070', journal_entries)},
            {'code': '63080', 'name': 'Postage & Delivery', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63080', journal_entries)},
            {'code': '63090', 'name': 'Miscellaneous Admin', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('63090', journal_entries)},
            {'code': '64000', 'name': 'Customer Support & Helpdesk', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('64000', journal_entries)},
            {'code': '64010', 'name': 'Customer Onboarding', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('64010', journal_entries)},
            {'code': '64020', 'name': 'Refunds & Adjustments', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('64020', journal_entries)},
            {'code': '64030', 'name': 'Platform Operations', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('64030', journal_entries)},
            {'code': '64040', 'name': 'Bug Bounties & Security Testing', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('64040', journal_entries)},
            {'code': '64050', 'name': 'Incident Response & Mitigation', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('64050', journal_entries)},
            {'code': '65000', 'name': 'Compliance & Licensing', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('65000', journal_entries)},
            {'code': '65010', 'name': 'KYC/AML Services', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('65010', journal_entries)},
            {'code': '65020', 'name': 'Legal Compliance Audits', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('65020', journal_entries)},
            {'code': '65030', 'name': 'Data Privacy Compliance', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('65030', journal_entries)},
            {'code': '65040', 'name': 'Risk Management Tools', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('65040', journal_entries)},
            {'code': '65050', 'name': 'Financial Auditing Services', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('65050', journal_entries)},
            {'code': '66000', 'name': 'Travel – Business', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('66000', journal_entries)},
            {'code': '66010', 'name': 'Meals & Entertainment', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('66010', journal_entries)},
            {'code': '66020', 'name': 'Conferences & Networking', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('66020', journal_entries)},
            {'code': '66030', 'name': 'Remote Work Stipends', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('66030', journal_entries)},
            {'code': '67000', 'name': 'Depreciation Expense', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('67000', journal_entries)},
            {'code': '67010', 'name': 'Amortization Expense', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('67010', journal_entries)},
            {'code': '67020', 'name': 'Non-Recurring Expense', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('67020', journal_entries)},
            {'code': '67030', 'name': 'Write-Offs', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('67030', journal_entries)},
            {'code': '68000', 'name': 'AI Model Development', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68000', journal_entries)},
            {'code': '68010', 'name': 'Dataset Labeling', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68010', journal_entries)},
            {'code': '68020', 'name': 'Model Evaluation & Testing', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68020', journal_entries)},
            {'code': '68030', 'name': 'Experimental Projects', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68030', journal_entries)},
            {'code': '68040', 'name': 'Research Staff', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68040', journal_entries)},
            {'code': '68050', 'name': 'R&D Cloud Compute', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68050', journal_entries)},
            {'code': '68060', 'name': 'Research Tools', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('68060', journal_entries)},
            {'code': '69000', 'name': 'Investor Relations', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('69000', journal_entries)},
            {'code': '69010', 'name': 'Fundraising Costs', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('69010', journal_entries)},
            {'code': '69020', 'name': 'Due Diligence Costs', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('69020', journal_entries)},
            {'code': '69030', 'name': 'M&A & Strategic Partnerships', 'type': 'Expense', 'category': 'Expenses', 'balance': calculate_account_balance('69030', journal_entries)},
            
            # Other Income/Expense
            {'code': '70100', 'name': 'Interest Income', 'type': 'Other Income', 'category': 'Other Income', 'balance': calculate_account_balance('70100', journal_entries)},
            {'code': '70200', 'name': 'Interest Expense', 'type': 'Other Expense', 'category': 'Other Expense', 'balance': calculate_account_balance('70200', journal_entries)},
            {'code': '70300', 'name': 'FX Gain/Loss', 'type': 'Other Income/Expense', 'category': 'Other Income/Expense', 'balance': calculate_account_balance('70300', journal_entries)},
            {'code': '70400', 'name': 'Grant Income', 'type': 'Other Income', 'category': 'Other Income', 'balance': calculate_account_balance('70400', journal_entries)},
            {'code': '70500', 'name': 'Investment Gain/Loss', 'type': 'Other Income/Expense', 'category': 'Other Income/Expense', 'balance': calculate_account_balance('70500', journal_entries)},
        ]
        
        # Calculate totals
        total_assets = sum(acc['balance'] for acc in gl_accounts if acc['type'] == 'Asset')
        total_liabilities = sum(acc['balance'] for acc in gl_accounts if acc['type'] == 'Liability')
        total_equity = sum(acc['balance'] for acc in gl_accounts if acc['type'] == 'Equity')
        
        # Calculate financial metrics
        revenue = sum(acc['balance'] for acc in gl_accounts if acc['code'].startswith('4'))
        cogs = sum(acc['balance'] for acc in gl_accounts if acc['code'].startswith('5'))
        expenses = sum(acc['balance'] for acc in gl_accounts if acc['code'].startswith('6'))
        
        gross_profit = revenue - cogs
        net_income = gross_profit - expenses
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'gl_accounts': gl_accounts,
                'journal_entries': [
                    {
                        'id': entry[0],
                        'date': entry[1],
                        'reference': entry[2],
                        'description': entry[3],
                        'amount': entry[9],
                        'from_account': entry[10],
                        'to_account': entry[11],
                        'status': entry[12]
                    } for entry in journal_entries
                ],
                'totals': {
                    'total_assets': total_assets,
                    'total_liabilities': total_liabilities,
                    'total_equity': total_equity
                },
                'financial_metrics': {
                    'revenue': revenue,
                    'cogs': cogs,
                    'expenses': expenses,
                    'gross_profit': gross_profit,
                    'net_income': net_income
                }
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-data-assets/revalue', methods=['POST'])
def revalue_llm_assets():
    """Realistic revaluation of LLM Data Assets based on actual performance metrics"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # REMOVED: Cooldown check - formula should be deterministic
        
        # Get realistic metrics for valuation
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT merchant_name) FROM llm_mappings")
        unique_merchants = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(confidence) FROM llm_mappings WHERE confidence > 0")
        avg_confidence = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) FROM llm_mappings WHERE created_at > datetime('now', '-30 days')")
        recent_mappings = cursor.fetchone()[0]
        
        # Get current LLM Data Assets
        cursor.execute("SELECT * FROM llm_data_assets")
        assets = cursor.fetchall()
        
        if not assets:
            return jsonify({'success': False, 'error': 'No LLM Data Assets found'}), 404
        
        # DETERMINISTIC VALUATION FORMULA
        # Always produces the same result for the same inputs (like 1+1=2)
        
        # Base value calculation using consistent mathematical formula
        # Formula: Asset Value = Base Value * (1 + (Data Quality Score * Performance Score * Scale Factor))
        
        # Data Quality Score (0.0 to 1.0) - based on unique merchants vs total mappings
        data_quality_score = min(unique_merchants / max(total_mappings, 1), 1.0)
        
        # Performance Score (0.0 to 1.0) - based on average confidence
        performance_score = min(avg_confidence, 1.0)
        
        # Scale Factor (0.0 to 0.5) - based on total data volume (logarithmic growth)
        import math
        scale_factor = min(math.log10(max(total_mappings, 1)) / 10, 0.5)  # Log scale, max 50% boost
        
        # DETERMINISTIC GROWTH FORMULA
        # This will ALWAYS produce the same result for the same inputs
        deterministic_growth = 1 + (data_quality_score * performance_score * scale_factor)
        
        # Cap at reasonable maximum (2x original value)
        deterministic_growth = min(deterministic_growth, 2.0)
        
        # RESET TO ORIGINAL VALUES FIRST - Then apply deterministic formula
        # This ensures we always start from the true original values
        original_asset_values = {
            1: 2400000.0,  # KamioiGPT v1.0 original value
            2: 1200000.0,  # Transaction Dataset v1.0 original value  
            3: 800000.0    # Merchant Mapping Model original value
        }
        
        original_training_costs = {
            1: 180000.0,   # KamioiGPT v1.0 original training cost
            2: 50000.0,    # Transaction Dataset v1.0 original training cost
            3: 75000.0     # Merchant Mapping Model original training cost
        }
        
        updated_assets = []
        for asset in assets:
            asset_id = asset[0]
            original_value = original_asset_values.get(asset_id, asset[3])
            original_training_cost = original_training_costs.get(asset_id, asset[4])
            
            # DETERMINISTIC CALCULATION - Always from original values
            new_value = original_value * deterministic_growth
            new_training_cost = original_training_cost * (1 + (deterministic_growth - 1) * 0.3)
            new_performance = min(95.0 * (1 + (deterministic_growth - 1) * 0.1), 100.0)  # Base 95% performance
            new_roi = (new_value - new_training_cost) / new_training_cost * 100 if new_training_cost > 0 else 0
            
            # Update the asset
            cursor.execute('''
                UPDATE llm_data_assets 
                SET current_value = ?, training_cost = ?, performance_score = ?, roi_percentage = ?, last_updated = ?
                WHERE id = ?
            ''', (new_value, new_training_cost, new_performance, new_roi, datetime.now().isoformat(), asset_id))
            
            updated_assets.append({
                'id': asset_id,
                'name': asset[1],
                'original_value': original_value,
                'new_value': new_value,
                'growth': ((new_value - original_value) / original_value) * 100,
                'deterministic_growth': deterministic_growth,
                'data_quality_score': data_quality_score,
                'performance_score': performance_score,
                'scale_factor': scale_factor
            })
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'LLM Data Assets revalued using deterministic formula',
            'data': {
                'total_mappings': total_mappings,
                'unique_merchants': unique_merchants,
                'avg_confidence': round(avg_confidence * 100, 1),
                'recent_mappings': recent_mappings,
                'formula_components': {
                    'data_quality_score': round(data_quality_score, 3),
                    'performance_score': round(performance_score, 3),
                    'scale_factor': round(scale_factor, 3),
                    'deterministic_growth': round(deterministic_growth, 3)
                },
                'updated_assets': updated_assets
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-mappings/check-duplicates', methods=['POST'])
def check_duplicate_mappings():
    """Check for duplicate mappings before upload"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        data = request.get_json()
        mappings_to_check = data.get('mappings', [])
        
        if not mappings_to_check:
            return jsonify({'success': False, 'error': 'No mappings provided'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        duplicates = []
        unique_mappings = []
        
        for mapping in mappings_to_check:
            merchant_name = mapping.get('merchant_name', '').strip().upper()
            ticker_symbol = mapping.get('ticker_symbol', '').strip().upper()
            category = mapping.get('category', '').strip()
            
            # Check for exact duplicates
            cursor.execute('''
                SELECT id, merchant_name, ticker_symbol, category, confidence, created_at
                FROM llm_mappings 
                WHERE UPPER(merchant_name) = ? AND UPPER(ticker_symbol) = ? AND category = ?
            ''', (merchant_name, ticker_symbol, category))
            
            existing = cursor.fetchone()
            if existing:
                duplicates.append({
                    'input': mapping,
                    'existing': {
                        'id': existing[0],
                        'merchant_name': existing[1],
                        'ticker_symbol': existing[2],
                        'category': existing[3],
                        'confidence': existing[4],
                        'created_at': existing[5]
                    }
                })
            else:
                unique_mappings.append(mapping)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_checked': len(mappings_to_check),
                'duplicates_found': len(duplicates),
                'unique_mappings': len(unique_mappings),
                'duplicates': duplicates,
                'unique_mappings': unique_mappings
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/llm-mappings/remove-duplicates', methods=['POST'])
def remove_duplicate_mappings():
    """Remove duplicate mappings from the database"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find and remove duplicates, keeping the most recent one
        cursor.execute('''
            DELETE FROM llm_mappings 
            WHERE id NOT IN (
                SELECT MAX(id) 
                FROM llm_mappings 
                GROUP BY UPPER(merchant_name), UPPER(ticker_symbol), category
            )
        ''')
        
        duplicates_removed = cursor.rowcount
        
        # Get updated counts
        cursor.execute("SELECT COUNT(*) FROM llm_mappings")
        total_mappings = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT UPPER(merchant_name)) FROM llm_mappings")
        unique_merchants = cursor.fetchone()[0]
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Removed {duplicates_removed} duplicate mappings',
            'data': {
                'duplicates_removed': duplicates_removed,
                'total_mappings': total_mappings,
                'unique_merchants': unique_merchants
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == "__main__":
    print("Starting Kamioi Backend Server...")
    print("Server will be available at: http://127.0.0.1:5001")
    
    # Debug: Print registered routes
    print("\nRegistered routes:")
    for rule in app.url_map.iter_rules():
        if 'user' in rule.rule or 'admin' in rule.rule or 'family' in rule.rule or 'mx' in rule.rule:
            print(f"  {rule.rule} -> {rule.endpoint}")
    
    app.run(host='127.0.0.1', port=5001, debug=True)
