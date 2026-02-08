#!/usr/bin/env python3
"""
Run Flask app with Waitress and enhanced WSGI-level logging
"""
import os
import sys

# Wrap the app in a WSGI middleware to log all requests
class LoggingMiddleware:
    def __init__(self, app):
        self.app = app
        # Force unbuffered output
        import os
        os.environ['PYTHONUNBUFFERED'] = '1'
    
    def __call__(self, environ, start_response):
        # Log at WSGI level - this runs BEFORE Flask
        # Use multiple methods to ensure output appears
        method = environ.get('REQUEST_METHOD', 'UNKNOWN')
        path = environ.get('PATH_INFO', 'UNKNOWN')
        
        # Try multiple output methods
        try:
            print(f"\n[WSGI] Request: {method} {path}", flush=True)
            sys.stdout.write(f"[WSGI] Request: {method} {path}\n")
            sys.stdout.flush()
            sys.stderr.write(f"[WSGI] Request: {method} {path}\n")
            sys.stderr.flush()
        except Exception as log_err:
            # If logging fails, at least try to write to a file
            try:
                with open('wsgi_debug.log', 'a') as f:
                    f.write(f"[WSGI] Request: {method} {path}\n")
            except:
                pass
        
        def custom_start_response(status, headers):
            try:
                print(f"[WSGI] Response: {status}", flush=True)
                sys.stdout.write(f"[WSGI] Response: {status}\n")
                sys.stdout.flush()
                sys.stderr.write(f"[WSGI] Response: {status}\n")
                sys.stderr.flush()
            except:
                pass
            return start_response(status, headers)
        
        try:
            result = self.app(environ, custom_start_response)
            print(f"[WSGI] App returned result, type: {type(result)}", flush=True)
            return result
        except Exception as e:
            error_msg = f"[WSGI ERROR] {type(e).__name__}: {e}"
            print(error_msg, flush=True)
            sys.stdout.write(f"{error_msg}\n")
            sys.stdout.flush()
            sys.stderr.write(f"{error_msg}\n")
            sys.stderr.flush()
            import traceback
            traceback.print_exc()
            # Try to return an error response
            try:
                def error_start_response(status, headers):
                    return start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
                return [b'Internal Server Error']
            except:
                raise

# Import app first to get all initialization done
from app import app

# Wrap app with logging middleware
app = LoggingMiddleware(app)

port = int(os.getenv('PORT', '5111'))  # Changed to 5111 - was working before

print(f"\nStarting server on port {port} using Waitress with WSGI logging...")
print(f"Database: {'PostgreSQL' if os.getenv('DB_TYPE', '').lower() == 'postgresql' else 'SQLite'}")
print()

try:
    from waitress import serve
    print("Using Waitress WSGI server with enhanced logging")
    print(f"Server will be available at http://0.0.0.0:{port}")
    print("Press Ctrl+C to stop\n")
    serve(app, host='0.0.0.0', port=port, threads=4, channel_timeout=120)
except ImportError:
    print("ERROR: Waitress not installed in current virtual environment")
    print("Please run: pip install waitress")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Failed to start Waitress server: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

