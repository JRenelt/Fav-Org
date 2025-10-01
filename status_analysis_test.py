#!/usr/bin/env python3
"""
Backend Test für FavLink Manager - German Review Request
Analysiere die Import Testdaten Status-Verteilung Problem

Problem: User berichtet "Gesperrten Importiert 10 = False", "Timeout 10 = False", "Ungeprüft 10 = False"
Erwartung: 100 Testdaten mit verschiedenen Status-Typen
"""

import requests
import json
from datetime import datetime
import sys

# Backend URL aus .env
BACKEND_URL = "https://fav-auditor.preview.emergentagent.com/api"

def print_header(title):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_section(title):
    """Print formatted section"""
    print(f"\n{'-'*40}")
    print(f"  {title}")
    print(f"{'-'*40}")

def test_statistics_endpoint():
    """Test 1: Aktuelle Statistiken abrufen"""
    print_section("TEST 1: GET /api/statistics - Aktuelle Status-Verteilung")
    
    try:
        response = requests.get(f"{BACKEND_URL}/statistics", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Statistics API erfolgreich abgerufen")
            
            # Analysiere Status-Verteilung
            print(f"\n📊 AKTUELLE STATISTIKEN:")
            print(f"   Total Bookmarks: {stats.get('total_bookmarks', 0)}")
            print(f"   Active Links: {stats.get('active_links', 0)}")
            print(f"   Dead Links: {stats.get('dead_links', 0)}")
            print(f"   Localhost Links: {stats.get('localhost_links', 0)}")
            print(f"   Duplicate Links: {stats.get('duplicate_links', 0)}")
            print(f"   Locked Links: {stats.get('locked_links', 0)}")
            print(f"   Timeout Links: {stats.get('timeout_links', 0)}")
            print(f"   Unchecked Links: {stats.get('unchecked_links', 0)}")
            
            # Problem-Analyse
            total = stats.get('total_bookmarks', 0)
            locked = stats.get('locked_links', 0)
            timeout = stats.get('timeout_links', 0)
            unchecked = stats.get('unchecked_links', 0)
            
            print(f"\n🔍 PROBLEM-ANALYSE:")
            print(f"   Erwartung: 100 Bookmarks total")
            print(f"   Tatsächlich: {total} Bookmarks")
            print(f"   Erwartung: ~10 gesperrte Links")
            print(f"   Tatsächlich: {locked} gesperrte Links")
            print(f"   Erwartung: ~10 timeout Links")
            print(f"   Tatsächlich: {timeout} timeout Links")
            print(f"   Erwartung: ~10 ungeprüfte Links")
            print(f"   Tatsächlich: {unchecked} ungeprüfte Links")
            
            # Bewertung
            if total < 100:
                print(f"❌ PROBLEM: Zu wenige Bookmarks ({total} statt 100)")
            if locked < 5:
                print(f"❌ PROBLEM: Zu wenige gesperrte Links ({locked} statt ~10)")
            if timeout < 5:
                print(f"❌ PROBLEM: Zu wenige timeout Links ({timeout} statt ~10)")
            if unchecked < 5:
                print(f"❌ PROBLEM: Zu wenige ungeprüfte Links ({unchecked} statt ~10)")
                
            return stats
        else:
            print(f"❌ Statistics API Fehler: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Statistics API Exception: {e}")
        return None

def test_bookmarks_endpoint():
    """Test 2: Alle Bookmarks abrufen und Status analysieren"""
    print_section("TEST 2: GET /api/bookmarks - Detaillierte Status-Analyse")
    
    try:
        response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            bookmarks = response.json()
            print(f"✅ Bookmarks API erfolgreich abgerufen")
            print(f"   Anzahl Bookmarks: {len(bookmarks)}")
            
            # Status-Verteilung analysieren
            status_counts = {}
            locked_count = 0
            
            for bookmark in bookmarks:
                status_type = bookmark.get('status_type', 'unknown')
                is_locked = bookmark.get('is_locked', False)
                
                # Zähle Status-Typen
                status_counts[status_type] = status_counts.get(status_type, 0) + 1
                
                # Zähle gesperrte Bookmarks
                if is_locked or status_type == 'locked':
                    locked_count += 1
            
            print(f"\n📋 DETAILLIERTE STATUS-VERTEILUNG:")
            for status, count in sorted(status_counts.items()):
                print(f"   {status}: {count}")
            print(f"   is_locked=true: {locked_count}")
            
            # Erwartete vs. Tatsächliche Verteilung
            print(f"\n🎯 SOLL vs. IST VERGLEICH:")
            expected = {
                'active': '~60-70',
                'dead': '~10',
                'localhost': '~10', 
                'duplicate': '~10',
                'locked': '~10',
                'timeout': '~10',
                'unchecked': '~10'
            }
            
            for status, expected_count in expected.items():
                actual_count = status_counts.get(status, 0)
                print(f"   {status}: Erwartet {expected_count}, Tatsächlich {actual_count}")
                
            # Problem-Identifikation
            problems = []
            if status_counts.get('locked', 0) < 5:
                problems.append(f"Zu wenige 'locked' Status ({status_counts.get('locked', 0)} statt ~10)")
            if status_counts.get('timeout', 0) < 5:
                problems.append(f"Zu wenige 'timeout' Status ({status_counts.get('timeout', 0)} statt ~10)")
            if status_counts.get('unchecked', 0) < 5:
                problems.append(f"Zu wenige 'unchecked' Status ({status_counts.get('unchecked', 0)} statt ~10)")
            if len(bookmarks) < 100:
                problems.append(f"Zu wenige Bookmarks gesamt ({len(bookmarks)} statt 100)")
                
            if problems:
                print(f"\n❌ IDENTIFIZIERTE PROBLEME:")
                for problem in problems:
                    print(f"   • {problem}")
            else:
                print(f"\n✅ Status-Verteilung entspricht den Erwartungen")
                
            return bookmarks, status_counts
        else:
            print(f"❌ Bookmarks API Fehler: {response.status_code}")
            print(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print(f"❌ Bookmarks API Exception: {e}")
        return None, None

def test_testdata_generation():
    """Test 3: Testdaten-Generierung prüfen"""
    print_section("TEST 3: POST /api/bookmarks/create-test-data - Testdaten-Generierung")
    
    try:
        # Erst alle bestehenden Bookmarks löschen für sauberen Test
        print("🗑️  Lösche bestehende Bookmarks für sauberen Test...")
        delete_response = requests.delete(f"{BACKEND_URL}/bookmarks/all", timeout=10)
        if delete_response.status_code == 200:
            print(f"✅ Bestehende Bookmarks gelöscht")
        else:
            print(f"⚠️  Löschen nicht erfolgreich: {delete_response.status_code}")
        
        # Neue Testdaten generieren
        print("🔄 Generiere neue Testdaten...")
        response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Testdaten erfolgreich generiert")
            print(f"   Message: {result.get('message', 'N/A')}")
            print(f"   Created Count: {result.get('created_count', 'N/A')}")
            print(f"   Duplicates: {result.get('duplicates', 'N/A')}")
            print(f"   Dead Links: {result.get('dead_links', 'N/A')}")
            
            if 'details' in result:
                details = result['details']
                print(f"   Details:")
                print(f"     Normal Links: {details.get('normal_links', 'N/A')}")
                print(f"     Duplicate Links: {details.get('duplicate_links', 'N/A')}")
                print(f"     Dead Links: {details.get('dead_links', 'N/A')}")
                print(f"     Total: {details.get('total', 'N/A')}")
            
            # Nach Generierung erneut Statistiken prüfen
            print(f"\n🔄 Prüfe Status-Verteilung nach Testdaten-Generierung...")
            new_stats = test_statistics_endpoint()
            
            if new_stats:
                print(f"\n📊 STATUS-VERTEILUNG NACH TESTDATEN-GENERIERUNG:")
                total = new_stats.get('total_bookmarks', 0)
                locked = new_stats.get('locked_links', 0)
                timeout = new_stats.get('timeout_links', 0)
                unchecked = new_stats.get('unchecked_links', 0)
                
                print(f"   Total: {total} (Soll: 100)")
                print(f"   Locked: {locked} (Soll: ~10)")
                print(f"   Timeout: {timeout} (Soll: ~10)")
                print(f"   Unchecked: {unchecked} (Soll: ~10)")
                
                # Bewertung der Testdaten-Qualität
                if total >= 100 and locked >= 5 and timeout >= 5 and unchecked >= 5:
                    print(f"✅ Testdaten-Generierung erfolgreich - alle Anforderungen erfüllt")
                else:
                    print(f"❌ Testdaten-Generierung unvollständig:")
                    if total < 100:
                        print(f"   • Zu wenige Bookmarks: {total}/100")
                    if locked < 5:
                        print(f"   • Zu wenige gesperrte: {locked}/~10")
                    if timeout < 5:
                        print(f"   • Zu wenige timeout: {timeout}/~10")
                    if unchecked < 5:
                        print(f"   • Zu wenige ungeprüfte: {unchecked}/~10")
            
            return result
        else:
            print(f"❌ Testdaten-Generierung Fehler: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Testdaten-Generierung Exception: {e}")
        return None

def test_status_filter():
    """Test 4: Status-Filter testen"""
    print_section("TEST 4: Status-Filter - Gesperrte, Timeout, Ungeprüfte Links")
    
    status_types = ['locked', 'timeout', 'unchecked']
    
    for status_type in status_types:
        try:
            print(f"\n🔍 Teste Filter für status_type='{status_type}':")
            response = requests.get(f"{BACKEND_URL}/bookmarks?status_type={status_type}", timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                filtered_bookmarks = response.json()
                count = len(filtered_bookmarks)
                print(f"   ✅ Gefunden: {count} Bookmarks mit status_type='{status_type}'")
                
                # Validiere dass alle Bookmarks den richtigen Status haben
                correct_status = all(b.get('status_type') == status_type for b in filtered_bookmarks)
                if correct_status:
                    print(f"   ✅ Alle Bookmarks haben korrekten Status")
                else:
                    print(f"   ❌ Nicht alle Bookmarks haben korrekten Status")
                    
                # Zeige Beispiele
                if count > 0:
                    print(f"   📋 Beispiele:")
                    for i, bookmark in enumerate(filtered_bookmarks[:3]):
                        title = bookmark.get('title', 'N/A')[:30]
                        status = bookmark.get('status_type', 'N/A')
                        is_locked = bookmark.get('is_locked', False)
                        print(f"     {i+1}. {title}... (status: {status}, locked: {is_locked})")
                        
            else:
                print(f"   ❌ Filter Fehler: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Filter Exception für {status_type}: {e}")

def main():
    """Hauptfunktion für German Review Request Testing"""
    print_header("GERMAN REVIEW REQUEST - TESTDATEN STATUS-VERTEILUNG ANALYSE")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Zeit: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"\n🎯 PROBLEM-BESCHREIBUNG:")
    print(f"   User berichtet: 'Gesperrten Importiert 10 = False'")
    print(f"   User berichtet: 'Timeout 10 = False'")
    print(f"   User berichtet: 'Ungeprüft 10 = False'")
    print(f"   Erwartung: 100 Testdaten mit korrekter Status-Verteilung")
    
    # Test 1: Aktuelle Statistiken
    current_stats = test_statistics_endpoint()
    
    # Test 2: Detaillierte Bookmark-Analyse
    bookmarks, status_counts = test_bookmarks_endpoint()
    
    # Test 3: Testdaten-Generierung
    testdata_result = test_testdata_generation()
    
    # Test 4: Status-Filter
    test_status_filter()
    
    # Zusammenfassung
    print_header("ZUSAMMENFASSUNG & DIAGNOSE")
    
    if current_stats and bookmarks and status_counts:
        total = current_stats.get('total_bookmarks', 0)
        locked = current_stats.get('locked_links', 0)
        timeout = current_stats.get('timeout_links', 0)
        unchecked = current_stats.get('unchecked_links', 0)
        
        print(f"📊 FINALE ANALYSE:")
        print(f"   Total Bookmarks: {total} (Soll: 100)")
        print(f"   Gesperrte Links: {locked} (Soll: ~10)")
        print(f"   Timeout Links: {timeout} (Soll: ~10)")
        print(f"   Ungeprüfte Links: {unchecked} (Soll: ~10)")
        
        # Root Cause Analysis
        print(f"\n🔍 ROOT CAUSE ANALYSIS:")
        
        if total < 100:
            print(f"   ❌ HAUPTPROBLEM: Zu wenige Testdaten generiert ({total}/100)")
            print(f"      → Testdaten-Generierung funktioniert nicht vollständig")
            
        if locked < 5:
            print(f"   ❌ GESPERRT-PROBLEM: Zu wenige gesperrte Links ({locked}/~10)")
            print(f"      → is_locked oder status_type='locked' wird nicht korrekt gesetzt")
            
        if timeout < 5:
            print(f"   ❌ TIMEOUT-PROBLEM: Zu wenige timeout Links ({timeout}/~10)")
            print(f"      → status_type='timeout' wird nicht generiert")
            
        if unchecked < 5:
            print(f"   ❌ UNGEPRÜFT-PROBLEM: Zu wenige ungeprüfte Links ({unchecked}/~10)")
            print(f"      → status_type='unchecked' wird nicht generiert")
        
        # Lösungsvorschläge
        print(f"\n💡 LÖSUNGSVORSCHLÄGE:")
        print(f"   1. Testdaten-Generierung erweitern um alle Status-Typen")
        print(f"   2. Sicherstellen dass is_locked und status_type konsistent gesetzt werden")
        print(f"   3. Timeout und Unchecked Status explizit in Testdaten einbauen")
        print(f"   4. Status-Verteilung in create_comprehensive_test_data() korrigieren")
        
        # Erfolg/Fehler Status
        success = total >= 100 and locked >= 5 and timeout >= 5 and unchecked >= 5
        if success:
            print(f"\n✅ ALLE ANFORDERUNGEN ERFÜLLT - Status-Verteilung korrekt")
        else:
            print(f"\n❌ ANFORDERUNGEN NICHT ERFÜLLT - Status-Verteilung fehlerhaft")
            
    else:
        print(f"❌ KRITISCHER FEHLER: Konnte nicht alle Tests durchführen")
        print(f"   → Backend API möglicherweise nicht erreichbar")
        print(f"   → Überprüfe Backend-Status und Netzwerk-Verbindung")

if __name__ == "__main__":
    main()