from database_manager import db_manager

conn = db_manager.get_connection()
use_postgresql = getattr(db_manager, '_use_postgresql', False)

user_id = 108

if use_postgresql:
    from sqlalchemy import text
    # Check what user_ids exist in transactions
    result = conn.execute(text('''
        SELECT DISTINCT user_id, COUNT(*) as count
        FROM transactions 
        GROUP BY user_id
        ORDER BY count DESC
        LIMIT 10
    '''))
    print("User IDs in transactions table:")
    for row in result:
        print(f"  user_id: {row[0]} (type: {type(row[0])}), count: {row[1]}")
    
    # Try querying with different type casts
    print("\nTrying different queries:")
    
    # Query 1: Direct integer
    result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = :uid'), {'uid': user_id})
    print(f"  Query with integer {user_id}: {result.scalar()}")
    
    # Query 2: Cast to integer
    result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id = CAST(:uid AS INTEGER)'), {'uid': user_id})
    print(f"  Query with CAST(:uid AS INTEGER): {result.scalar()}")
    
    # Query 3: Cast user_id column
    result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE CAST(user_id AS INTEGER) = :uid'), {'uid': user_id})
    print(f"  Query with CAST(user_id AS INTEGER): {result.scalar()}")
    
    # Query 4: As text
    result = conn.execute(text('SELECT COUNT(*) FROM transactions WHERE user_id::text = :uid'), {'uid': str(user_id)})
    print(f"  Query with user_id::text = :uid (string): {result.scalar()}")
    
    # Check actual user_id values
    result = conn.execute(text('SELECT user_id, COUNT(*) FROM transactions GROUP BY user_id'))
    print("\nAll user_ids in transactions:")
    for row in result:
        print(f"  user_id: {row[0]} (type: {type(row[0])}), count: {row[1]}")
    
    db_manager.release_connection(conn)
else:
    cur = conn.cursor()
    cur.execute('SELECT DISTINCT user_id, COUNT(*) as count FROM transactions GROUP BY user_id ORDER BY count DESC LIMIT 10')
    print("User IDs in transactions table:")
    for row in cur.fetchall():
        print(f"  user_id: {row[0]} (type: {type(row[0])}), count: {row[1]}")
    
    cur.execute('SELECT COUNT(*) FROM transactions WHERE user_id = ?', (user_id,))
    print(f"\nQuery with integer {user_id}: {cur.fetchone()[0]}")
    
    conn.close()
