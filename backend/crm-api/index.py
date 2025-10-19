import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    return conn

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: CRM API для управления клиентами, контактами и историей взаимодействий
    Args: event - dict с httpMethod, body, queryStringParameters, pathParams
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    path_params = event.get('pathParams', {})
    query_params = event.get('queryStringParameters', {})
    
    cors_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
        'Access-Control-Max-Age': '86400'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        action = query_params.get('action', 'list')
        entity = query_params.get('entity', 'clients')
        
        if method == 'GET':
            if entity == 'clients':
                if action == 'stats':
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_clients,
                            COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_clients,
                            COUNT(DISTINCT CASE WHEN email IS NOT NULL THEN 1 END) as clients_with_email
                        FROM clients
                    """)
                    stats = cursor.fetchone()
                    
                    cursor.execute("""
                        SELECT COUNT(*) as total_interactions
                        FROM interactions
                        WHERE interaction_date > NOW() - INTERVAL '30 days'
                    """)
                    interactions_stats = cursor.fetchone()
                    
                    result = {
                        'totalClients': stats['total_clients'],
                        'newClients': stats['new_clients'],
                        'clientsWithEmail': stats['clients_with_email'],
                        'totalInteractions': interactions_stats['total_interactions']
                    }
                    
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps(result),
                        'isBase64Encoded': False
                    }
                else:
                    search = query_params.get('search', '')
                    if search:
                        cursor.execute("""
                            SELECT * FROM clients 
                            WHERE name ILIKE %s OR company ILIKE %s OR email ILIKE %s
                            ORDER BY created_at DESC
                        """, (f'%{search}%', f'%{search}%', f'%{search}%'))
                    else:
                        cursor.execute("SELECT * FROM clients ORDER BY created_at DESC")
                    
                    clients = cursor.fetchall()
                    clients_list = []
                    for client in clients:
                        clients_list.append({
                            'id': client['id'],
                            'name': client['name'],
                            'company': client['company'],
                            'email': client['email'],
                            'phone': client['phone'],
                            'address': client['address'],
                            'createdAt': client['created_at'].isoformat() if client['created_at'] else None,
                            'updatedAt': client['updated_at'].isoformat() if client['updated_at'] else None
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps(clients_list),
                        'isBase64Encoded': False
                    }
            
            elif entity == 'contacts':
                client_id = query_params.get('clientId')
                if client_id:
                    cursor.execute("SELECT * FROM contacts WHERE client_id = %s ORDER BY is_primary DESC", (client_id,))
                else:
                    cursor.execute("SELECT * FROM contacts ORDER BY created_at DESC")
                
                contacts = cursor.fetchall()
                contacts_list = []
                for contact in contacts:
                    contacts_list.append({
                        'id': contact['id'],
                        'clientId': contact['client_id'],
                        'contactPerson': contact['contact_person'],
                        'position': contact['position'],
                        'email': contact['email'],
                        'phone': contact['phone'],
                        'isPrimary': contact['is_primary'],
                        'createdAt': contact['created_at'].isoformat() if contact['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps(contacts_list),
                    'isBase64Encoded': False
                }
            
            elif entity == 'interactions':
                client_id = query_params.get('clientId')
                if client_id:
                    cursor.execute("""
                        SELECT i.*, c.name as client_name 
                        FROM interactions i
                        JOIN clients c ON i.client_id = c.id
                        WHERE i.client_id = %s 
                        ORDER BY i.interaction_date DESC
                    """, (client_id,))
                else:
                    cursor.execute("""
                        SELECT i.*, c.name as client_name 
                        FROM interactions i
                        JOIN clients c ON i.client_id = c.id
                        ORDER BY i.interaction_date DESC
                        LIMIT 50
                    """)
                
                interactions = cursor.fetchall()
                interactions_list = []
                for interaction in interactions:
                    interactions_list.append({
                        'id': interaction['id'],
                        'clientId': interaction['client_id'],
                        'clientName': interaction['client_name'],
                        'interactionType': interaction['interaction_type'],
                        'description': interaction['description'],
                        'interactionDate': interaction['interaction_date'].isoformat() if interaction['interaction_date'] else None,
                        'createdBy': interaction['created_by']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps(interactions_list),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            
            if entity == 'clients':
                cursor.execute("""
                    INSERT INTO clients (name, company, email, phone, address)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, name, company, email, phone, address, created_at, updated_at
                """, (
                    body_data.get('name'),
                    body_data.get('company'),
                    body_data.get('email'),
                    body_data.get('phone'),
                    body_data.get('address')
                ))
                conn.commit()
                new_client = cursor.fetchone()
                
                return {
                    'statusCode': 201,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'id': new_client['id'],
                        'name': new_client['name'],
                        'company': new_client['company'],
                        'email': new_client['email'],
                        'phone': new_client['phone'],
                        'address': new_client['address'],
                        'createdAt': new_client['created_at'].isoformat(),
                        'updatedAt': new_client['updated_at'].isoformat()
                    }),
                    'isBase64Encoded': False
                }
            
            elif entity == 'contacts':
                cursor.execute("""
                    INSERT INTO contacts (client_id, contact_person, position, email, phone, is_primary)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, client_id, contact_person, position, email, phone, is_primary, created_at
                """, (
                    body_data.get('clientId'),
                    body_data.get('contactPerson'),
                    body_data.get('position'),
                    body_data.get('email'),
                    body_data.get('phone'),
                    body_data.get('isPrimary', False)
                ))
                conn.commit()
                new_contact = cursor.fetchone()
                
                return {
                    'statusCode': 201,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'id': new_contact['id'],
                        'clientId': new_contact['client_id'],
                        'contactPerson': new_contact['contact_person'],
                        'position': new_contact['position'],
                        'email': new_contact['email'],
                        'phone': new_contact['phone'],
                        'isPrimary': new_contact['is_primary'],
                        'createdAt': new_contact['created_at'].isoformat()
                    }),
                    'isBase64Encoded': False
                }
            
            elif entity == 'interactions':
                cursor.execute("""
                    INSERT INTO interactions (client_id, interaction_type, description, created_by)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, client_id, interaction_type, description, interaction_date, created_by
                """, (
                    body_data.get('clientId'),
                    body_data.get('interactionType'),
                    body_data.get('description'),
                    body_data.get('createdBy', 'System')
                ))
                conn.commit()
                new_interaction = cursor.fetchone()
                
                return {
                    'statusCode': 201,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'id': new_interaction['id'],
                        'clientId': new_interaction['client_id'],
                        'interactionType': new_interaction['interaction_type'],
                        'description': new_interaction['description'],
                        'interactionDate': new_interaction['interaction_date'].isoformat(),
                        'createdBy': new_interaction['created_by']
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            client_id = body_data.get('id')
            
            if entity == 'clients' and client_id:
                cursor.execute("""
                    UPDATE clients 
                    SET name = %s, company = %s, email = %s, phone = %s, address = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, name, company, email, phone, address, created_at, updated_at
                """, (
                    body_data.get('name'),
                    body_data.get('company'),
                    body_data.get('email'),
                    body_data.get('phone'),
                    body_data.get('address'),
                    client_id
                ))
                conn.commit()
                updated_client = cursor.fetchone()
                
                if updated_client:
                    return {
                        'statusCode': 200,
                        'headers': cors_headers,
                        'body': json.dumps({
                            'id': updated_client['id'],
                            'name': updated_client['name'],
                            'company': updated_client['company'],
                            'email': updated_client['email'],
                            'phone': updated_client['phone'],
                            'address': updated_client['address'],
                            'createdAt': updated_client['created_at'].isoformat(),
                            'updatedAt': updated_client['updated_at'].isoformat()
                        }),
                        'isBase64Encoded': False
                    }
        
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()
