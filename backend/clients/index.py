'''
Business: API для управления клиентами - создание, чтение, обновление и удаление клиентов
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с данными клиента или списка клиентов
'''
import json
import os
from typing import Dict, Any, Optional, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    conn.set_session(readonly=False, autocommit=True)
    return conn

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            client_id = params.get('id')
            search = params.get('search', '')
            
            if client_id:
                cursor.execute(
                    "SELECT * FROM t_p65639980_client_contact_manag.clients WHERE id = %s",
                    (int(client_id),)
                )
                client = cursor.fetchone()
                
                if client:
                    cursor.execute(
                        "SELECT * FROM t_p65639980_client_contact_manag.contacts WHERE client_id = %s",
                        (int(client_id),)
                    )
                    contacts = cursor.fetchall()
                    
                    result = dict(client)
                    result['contacts'] = [dict(c) for c in contacts]
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(result, default=str),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Client not found'}),
                        'isBase64Encoded': False
                    }
            else:
                if search:
                    query = """
                        SELECT * FROM t_p65639980_client_contact_manag.clients 
                        WHERE name ILIKE %s OR company ILIKE %s OR email ILIKE %s
                        ORDER BY created_at DESC
                    """
                    search_pattern = f'%{search}%'
                    cursor.execute(query, (search_pattern, search_pattern, search_pattern))
                else:
                    cursor.execute(
                        "SELECT * FROM t_p65639980_client_contact_manag.clients ORDER BY created_at DESC"
                    )
                
                clients = cursor.fetchall()
                result = [dict(row) for row in clients]
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(result, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            name = body_data.get('name', '').strip()
            company = body_data.get('company', '').strip()
            email = body_data.get('email', '').strip()
            phone = body_data.get('phone', '').strip()
            address = body_data.get('address', '').strip()
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Name is required'}),
                    'isBase64Encoded': False
                }
            
            email_value = email if email else None
            
            cursor.execute(
                """
                INSERT INTO t_p65639980_client_contact_manag.clients 
                (name, company, email, phone, address) 
                VALUES (%s, %s, %s, %s, %s) 
                RETURNING *
                """,
                (name, company or None, email_value, phone or None, address or None)
            )
            
            new_client = cursor.fetchone()
            result = dict(new_client)
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            client_id = body_data.get('id')
            
            if not client_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Client ID is required'}),
                    'isBase64Encoded': False
                }
            
            name = body_data.get('name', '').strip()
            company = body_data.get('company', '').strip()
            email = body_data.get('email', '').strip()
            phone = body_data.get('phone', '').strip()
            address = body_data.get('address', '').strip()
            
            cursor.execute(
                """
                UPDATE t_p65639980_client_contact_manag.clients 
                SET name = %s, company = %s, email = %s, phone = %s, 
                    address = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
                """,
                (name, company or None, email or None, phone or None, address or None, int(client_id))
            )
            
            updated_client = cursor.fetchone()
            
            if updated_client:
                result = dict(updated_client)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(result, default=str),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Client not found'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            client_id = params.get('id')
            
            if not client_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Client ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "DELETE FROM t_p65639980_client_contact_manag.contacts WHERE client_id = %s",
                (int(client_id),)
            )
            
            cursor.execute(
                "DELETE FROM t_p65639980_client_contact_manag.clients WHERE id = %s RETURNING id",
                (int(client_id),)
            )
            
            deleted = cursor.fetchone()
            
            if deleted:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Client deleted successfully'}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Client not found'}),
                    'isBase64Encoded': False
                }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }