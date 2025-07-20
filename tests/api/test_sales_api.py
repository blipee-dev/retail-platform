#!/usr/bin/env python3
"""
Test script for the sales API using the specification files
"""

import sys
import os
import requests
from datetime import datetime, timedelta
import json

# Add the specifications directory to the path
sys.path.append('/workspaces/retail-platform/docs/specifications')

try:
    from autenticar import autenticar
    from consultar import consultar_vendas
    from config import URL_BASE, USERNAME, PASSWORD
except ImportError as e:
    print(f"Error importing modules: {e}")
    print("Make sure all required modules are available")
    sys.exit(1)

def test_authentication():
    """Test the authentication endpoint"""
    print("=" * 60)
    print("TESTING AUTHENTICATION")
    print("=" * 60)
    
    try:
        print(f"Authenticating with URL: {URL_BASE}/api/autenticar")
        print(f"Username: {USERNAME}")
        
        token = autenticar()
        print(f"✅ Authentication successful!")
        print(f"Token (first 50 chars): {token[:50]}...")
        return token
        
    except Exception as e:
        print(f"❌ Authentication failed: {str(e)}")
        return None

def test_sales_query(jwt_token):
    """Test the sales query endpoint"""
    print("\n" + "=" * 60)
    print("TESTING SALES QUERY")
    print("=" * 60)
    
    # Test with yesterday's date
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    test_store = "OML01-Omnia GuimarãesShopping"  # Using the store from data_collector.py
    
    try:
        print(f"Querying sales for:")
        print(f"  Date: {yesterday}")
        print(f"  Store: {test_store}")
        
        result = consultar_vendas(jwt_token, yesterday, test_store)
        
        print(f"✅ Sales query successful!")
        print(f"Response structure:")
        print(f"  Success: {result.get('Sucesso', 'Not found')}")
        
        if result.get('Sucesso'):
            obj = result.get('Objecto', {})
            result_sets = obj.get('ResultSets', [])
            print(f"  Number of ResultSets: {len(result_sets)}")
            
            if result_sets and len(result_sets) > 0:
                first_set = result_sets[0]
                print(f"  Records in first ResultSet: {len(first_set) if first_set else 0}")
                
                if first_set and len(first_set) > 0:
                    print("\n📊 Sample record (first record):")
                    sample_record = first_set[0]
                    for key, value in sample_record.items():
                        print(f"    {key}: {value}")
                else:
                    print("  ℹ️  No sales records found for this date")
            else:
                print("  ℹ️  No ResultSets returned")
        else:
            print(f"  ❌ Query failed: {result.get('Mensagem', 'Unknown error')}")
            
        return result
        
    except Exception as e:
        print(f"❌ Sales query failed: {str(e)}")
        return None

def test_different_dates(jwt_token):
    """Test with different date ranges"""
    print("\n" + "=" * 60)
    print("TESTING DIFFERENT DATE RANGES")
    print("=" * 60)
    
    test_store = "OML01-Omnia GuimarãesShopping"
    test_dates = [
        (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),  # Yesterday
        (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'),  # Last week
        (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'), # Last month
    ]
    
    for date in test_dates:
        try:
            print(f"\nTesting date: {date}")
            result = consultar_vendas(jwt_token, date, test_store)
            
            if result.get('Sucesso'):
                obj = result.get('Objecto', {})
                result_sets = obj.get('ResultSets', [])
                total_records = sum(len(rs) if rs else 0 for rs in result_sets)
                print(f"  ✅ Found {total_records} sales records")
            else:
                print(f"  ❌ Failed: {result.get('Mensagem', 'Unknown error')}")
                
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")

def test_api_endpoints_directly():
    """Test API endpoints directly to understand structure"""
    print("\n" + "=" * 60)
    print("TESTING API ENDPOINTS DIRECTLY")
    print("=" * 60)
    
    # Test authentication endpoint directly
    auth_url = f"{URL_BASE}/api/autenticar"
    auth_payload = {
        "Username": USERNAME,
        "Password": PASSWORD
    }
    
    try:
        print(f"Testing authentication endpoint: {auth_url}")
        response = requests.post(auth_url, json=auth_payload, timeout=10)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            auth_data = response.json()
            print("✅ Direct authentication successful")
            print(f"Response keys: {list(auth_data.keys())}")
            
            if auth_data.get('Sucesso'):
                token = auth_data['Objecto']['IdentityToken']
                print(f"Token obtained successfully")
                
                # Test sales query endpoint directly
                consulta_url = f"{URL_BASE}/api/consulta/executarsync"
                yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
                
                consulta_payload = {
                    "ConsultaId": "3af64719-a6b3-ee11-8933-005056b8cd07",
                    "Parametros": [
                        {"Nome": "Data", "Valor": yesterday},
                        {"Nome": "Loja", "Valor": "OML01-Omnia GuimarãesShopping"}
                    ]
                }
                
                headers = {"Authorization": f"Bearer {token}"}
                
                print(f"\nTesting query endpoint: {consulta_url}")
                query_response = requests.post(consulta_url, json=consulta_payload, headers=headers, timeout=30)
                print(f"Query status code: {query_response.status_code}")
                
                if query_response.status_code == 200:
                    query_data = query_response.json()
                    print("✅ Direct query successful")
                    print(f"Query response keys: {list(query_data.keys())}")
                else:
                    print(f"❌ Query failed with status: {query_response.status_code}")
                    print(f"Response: {query_response.text[:500]}...")
                    
        else:
            print(f"❌ Authentication failed with status: {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
    except Exception as e:
        print(f"❌ Direct API test failed: {str(e)}")

def main():
    print("🚀 STARTING SALES API TEST")
    print(f"📅 Test started at: {datetime.now()}")
    print(f"🌐 Base URL: {URL_BASE}")
    
    # Test 1: Authentication
    jwt_token = test_authentication()
    
    if jwt_token:
        # Test 2: Sales query
        test_sales_query(jwt_token)
        
        # Test 3: Different dates
        test_different_dates(jwt_token)
    
    # Test 4: Direct API calls
    test_api_endpoints_directly()
    
    print("\n" + "=" * 60)
    print("🏁 TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()