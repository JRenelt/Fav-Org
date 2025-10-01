#!/usr/bin/env python3
"""
FavOrg Frontend-Backend Integration Test für Testdaten-Erstellung
Teste die Integration zwischen Frontend und Backend für Testdaten-Erstellung

FOKUS: Warum zeigt Frontend "Fehler beim Erstellen der Testdaten" Toast?
"""

import requests
import sys
import json
import time
from datetime import datetime

def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=', 1)[1].strip()
                    return f"{url}/api"
        return "http://localhost:8001/api"
    except:
        return "http://localhost:8001/api"

def test_frontend_backend_integration():
    """
    Teste die Frontend-Backend Integration für Testdaten-Erstellung
    """
    BACKEND_URL = get_backend_url()
    print(f"🔗 Backend URL: {BACKEND_URL}")
    
    print("\n" + "="*80)
    print("🔗 FRONTEND-BACKEND INTEGRATION TEST FÜR TESTDATEN")
    print("="*80)
    
    success_count = 0
    total_tests = 0
    
    # 1. Teste CORS Headers
    print("\n1️⃣ Teste CORS Headers für Frontend-Integration...")
    total_tests += 1
    
    try:
        # Simuliere Frontend-Request mit CORS
        headers = {
            'Origin': 'https://fav-auditor.preview.emergentagent.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        # OPTIONS Request (Preflight)
        options_response = requests.options(f"{BACKEND_URL}/bookmarks/create-test-data", headers=headers, timeout=10)
        print(f"📡 OPTIONS Response Status: {options_response.status_code}")
        print(f"📡 CORS Headers: {dict(options_response.headers)}")
        
        # Prüfe CORS Headers
        cors_headers = options_response.headers
        if 'Access-Control-Allow-Origin' in cors_headers:
            print(f"✅ CORS Origin: {cors_headers['Access-Control-Allow-Origin']}")
            success_count += 1
        else:
            print("❌ CORS Access-Control-Allow-Origin Header fehlt")
            
    except Exception as e:
        print(f"❌ CORS Test fehlgeschlagen: {str(e)}")
    
    # 2. Teste Frontend-ähnliche Request
    print("\n2️⃣ Teste Frontend-ähnliche POST Request...")
    total_tests += 1
    
    try:
        # Simuliere Frontend Request
        headers = {
            'Content-Type': 'application/json',
            'Origin': 'https://fav-auditor.preview.emergentagent.com',
            'Referer': 'https://fav-auditor.preview.emergentagent.com/',
            'User-Agent': 'Mozilla/5.0 (Frontend Test)'
        }
        
        response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", headers=headers, timeout=30)
        print(f"📡 Frontend-Style Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend-Style Request erfolgreich!")
            print(f"📊 Created: {data.get('created_count', 0)} bookmarks")
            success_count += 1
        else:
            print(f"❌ Frontend-Style Request fehlgeschlagen: {response.status_code}")
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Frontend-Style Request Fehler: {str(e)}")
    
    # 3. Teste verschiedene Content-Types
    print("\n3️⃣ Teste verschiedene Content-Types...")
    total_tests += 1
    
    content_types = [
        'application/json',
        'application/x-www-form-urlencoded',
        'text/plain'
    ]
    
    working_content_types = []
    for content_type in content_types:
        try:
            headers = {'Content-Type': content_type}
            response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", headers=headers, timeout=10)
            
            if response.status_code == 200:
                working_content_types.append(content_type)
                print(f"✅ Content-Type funktioniert: {content_type}")
            else:
                print(f"⚠️ Content-Type Problem: {content_type} -> {response.status_code}")
                
        except Exception as e:
            print(f"❌ Content-Type Fehler {content_type}: {str(e)[:50]}")
    
    if working_content_types:
        success_count += 1
        print(f"✅ {len(working_content_types)} Content-Types funktionieren")
    
    # 4. Teste Error Handling
    print("\n4️⃣ Teste Error Handling...")
    total_tests += 1
    
    try:
        # Teste ungültigen Endpunkt
        invalid_response = requests.post(f"{BACKEND_URL}/bookmarks/invalid-endpoint", timeout=10)
        print(f"📡 Invalid Endpoint Status: {invalid_response.status_code}")
        
        if invalid_response.status_code == 404:
            print("✅ 404 Error Handling funktioniert")
            success_count += 1
        else:
            print(f"⚠️ Unerwarteter Status für ungültigen Endpunkt: {invalid_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error Handling Test Fehler: {str(e)}")
    
    # 5. Teste Response Time
    print("\n5️⃣ Teste Response Time...")
    total_tests += 1
    
    try:
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", timeout=30)
        end_time = time.time()
        
        response_time = end_time - start_time
        print(f"📊 Response Time: {response_time:.2f} Sekunden")
        
        if response_time < 10:
            print("✅ Response Time akzeptabel (<10s)")
            success_count += 1
        elif response_time < 30:
            print("⚠️ Response Time langsam (10-30s)")
            success_count += 1
        else:
            print("❌ Response Time zu langsam (>30s)")
            
    except requests.exceptions.Timeout:
        print("❌ Request Timeout (>30s)")
    except Exception as e:
        print(f"❌ Response Time Test Fehler: {str(e)}")
    
    # 6. Teste JSON Response Format
    print("\n6️⃣ Teste JSON Response Format...")
    total_tests += 1
    
    try:
        response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", timeout=30)
        
        if response.status_code == 200:
            # Prüfe Content-Type
            content_type = response.headers.get('content-type', '')
            if 'application/json' in content_type:
                print("✅ JSON Content-Type korrekt")
                
                # Prüfe JSON Parsing
                try:
                    data = response.json()
                    print("✅ JSON Parsing erfolgreich")
                    
                    # Prüfe erwartete Felder
                    expected_fields = ['message', 'created_count']
                    missing_fields = [field for field in expected_fields if field not in data]
                    
                    if not missing_fields:
                        print("✅ JSON Response Struktur vollständig")
                        success_count += 1
                    else:
                        print(f"⚠️ Fehlende JSON Felder: {missing_fields}")
                        
                except json.JSONDecodeError as e:
                    print(f"❌ JSON Parsing Fehler: {str(e)}")
            else:
                print(f"❌ Falscher Content-Type: {content_type}")
        else:
            print(f"❌ Kein 200 Status für JSON Test: {response.status_code}")
            
    except Exception as e:
        print(f"❌ JSON Response Test Fehler: {str(e)}")
    
    # 7. Teste mögliche Frontend-Fehlerquellen
    print("\n7️⃣ Teste mögliche Frontend-Fehlerquellen...")
    total_tests += 1
    
    try:
        # Teste ob Backend überlastet ist
        concurrent_requests = []
        for i in range(3):
            try:
                response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=5)
                concurrent_requests.append(response.status_code)
            except:
                concurrent_requests.append(0)
        
        successful_requests = len([r for r in concurrent_requests if r == 200])
        print(f"📊 Concurrent Requests: {successful_requests}/3 erfolgreich")
        
        if successful_requests >= 2:
            print("✅ Backend kann mehrere Requests verarbeiten")
            success_count += 1
        else:
            print("⚠️ Backend könnte überlastet sein")
            
    except Exception as e:
        print(f"❌ Concurrent Request Test Fehler: {str(e)}")
    
    # Zusammenfassung
    print("\n" + "="*80)
    print("📊 FRONTEND-BACKEND INTEGRATION TEST ZUSAMMENFASSUNG")
    print("="*80)
    
    success_rate = (success_count / total_tests) * 100 if total_tests > 0 else 0
    print(f"✅ Erfolgreiche Tests: {success_count}/{total_tests} ({success_rate:.1f}%)")
    
    # Diagnose für Frontend-Fehler
    print("\n🔍 DIAGNOSE FÜR FRONTEND-FEHLER:")
    print("-" * 50)
    
    if success_rate >= 80:
        print("✅ Backend funktioniert einwandfrei")
        print("💡 Frontend-Fehler könnte folgende Ursachen haben:")
        print("   - JavaScript Fehler im Frontend")
        print("   - Falsche API URL im Frontend Code")
        print("   - Frontend Error Handling Problem")
        print("   - Toast-System zeigt falsche Meldung")
        return True
    elif success_rate >= 60:
        print("⚠️ Backend funktioniert teilweise")
        print("💡 Mögliche Probleme:")
        print("   - CORS Konfiguration")
        print("   - Response Time zu langsam")
        print("   - Content-Type Probleme")
        return True
    else:
        print("❌ Backend hat Probleme")
        print("💡 Backend-Probleme gefunden:")
        print("   - API Endpunkte nicht erreichbar")
        print("   - Server Überlastung")
        print("   - Netzwerk Probleme")
        return False

if __name__ == "__main__":
    print("🔗 FavOrg Frontend-Backend Integration Test")
    print("=" * 60)
    
    success = test_frontend_backend_integration()
    
    if success:
        print("\n✅ INTEGRATION TEST ERFOLGREICH!")
        sys.exit(0)
    else:
        print("\n❌ INTEGRATION TEST FEHLGESCHLAGEN!")
        sys.exit(1)