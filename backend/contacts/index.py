'''
Business: API для управления контактными лицами клиентов - CRUD операции
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с request_id
Returns: HTTP response с данными контактов
'''
import json
import os
from typing import Dict, Any
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
            client_id = params.get('client_id')
            contact_id = params.get('id')
            
            if contact_id:
                cursor.execute(
                    "SELECT * FROM t_p65639980_client_contact_manag.contacts WHERE id = %s",
                    (int(contact_id),)
                )
                contact = cursor.fetchone()
                
                if contact:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(dict(contact), default=str),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Contact not found'}),
                        'isBase64Encoded': False
                    }
            
            if client_id:
                cursor.execute(
                    "SELECT * FROM t_p65639980_client_contact_manag.contacts WHERE client_id = %s ORDER BY is_primary DESC, created_at DESC",
                    (int(client_id),)
                )
            else:
                cursor.execute(
                    "SELECT * FROM t_p65639980_client_contact_manag.contacts ORDER BY created_at DESC"
                )
            
            contacts = cursor.fetchall()
            result = [dict(row) for row in contacts]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            client_id = body_data.get('client_id')
            contact_person = body_data.get('contact_person', '').strip()
            position = body_data.get('position', '').strip()
            email = body_data.get('email', '').strip()
            phone = body_data.get('phone', '').strip()
            is_primary = body_data.get('is_primary', False)
            
            if not client_id or not contact_person:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'client_id and contact_person are required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                """
                INSERT INTO t_p65639980_client_contact_manag.contacts 
                (client_id, contact_person, position, email, phone, is_primary) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING *
                """,
                (int(client_id), contact_person, position or None, email or None, phone or None, is_primary)
            )
            
            new_contact = cursor.fetchone()
            result = dict(new_contact)
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(result, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            contact_id = body_data.get('id')
            
            if not contact_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Contact ID is required'}),
                    'isBase64Encoded': False
                }
            
            contact_person = body_data.get('contact_person', '').strip()
            position = body_data.get('position', '').strip()
            email = body_data.get('email', '').strip()
            phone = body_data.get('phone', '').strip()
            is_primary = body_data.get('is_primary', False)
            
            cursor.execute(
                """
                UPDATE t_p65639980_client_contact_manag.contacts 
                SET contact_person = %s, position = %s, email = %s, phone = %s, is_primary = %s
                WHERE id = %s
                RETURNING *
                """,
                (contact_person, position or None, email or None, phone or None, is_primary, int(contact_id))
            )
            
            updated_contact = cursor.fetchone()
            
            if updated_contact:
                result = dict(updated_contact)
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
                    'body': json.dumps({'error': 'Contact not found'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            contact_id = params.get('id')
            
            if not contact_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Contact ID is required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute(
                "DELETE FROM t_p65639980_client_contact_manag.contacts WHERE id = %s RETURNING id",
                (int(contact_id),)
            )
            
            deleted = cursor.fetchone()
            
            if deleted:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Contact deleted successfully'}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Contact not found'}),
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
