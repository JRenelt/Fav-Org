#!/usr/bin/env python3
"""
Backend Test für FavOrg Bookmark Manager - German Review Request
Spezifische Tests für Testdatenerstellung, Lock/Unlock und Status-Verteilung

SPEZIFISCHE TESTS:
1. 100 Testdatensätze Test: POST /api/bookmarks/create-test-data (GENAU 100, nicht 70)
2. Lock/Unlock Funktionalität: PUT /api/bookmarks/{id}/lock und PUT /api/bookmarks/{id}/unlock
3. Status-Verteilung: Sport, Business, Science Kategorien validieren

Backend URL: https://fav-auditor.preview.emergentagent.com/api
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import sys

class FavOrgBackendTester:
    def __init__(self):
        self.base_url = "https://fav-auditor.preview.emergentagent.com/api"
        self.session = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
    
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            for key, value in details.items():
                print(f"  {key}: {value}")
        print()
    
    async def test_create_100_test_data(self):
        """
        KRITISCHER TEST: 100 Testdatensätze erstellen und validieren
        Erwartet: GENAU 100 Datensätze (10 Gruppen × 10 Datensätze)
        """
        print("🎯 TESTING: 100 Testdatensätze Erstellung")
        
        try:
            # Zuerst aktuelle Bookmark-Anzahl abrufen
            async with self.session.get(f"{self.base_url}/statistics") as response:
                if response.status == 200:
                    stats_before = await response.json()
                    bookmarks_before = stats_before.get('total_bookmarks', 0)
                else:
                    bookmarks_before = 0
            
            # Testdaten erstellen
            async with self.session.post(f"{self.base_url}/bookmarks/create-test-data") as response:
                if response.status == 200:
                    result = await response.json()
                    created_count = result.get('created_count', 0)
                    
                    # Validiere dass GENAU 100 erstellt wurden
                    if created_count == 100:
                        self.log_result(
                            "100 Testdatensätze Erstellung",
                            True,
                            f"GENAU 100 Testdatensätze erfolgreich erstellt",
                            {
                                "created_count": created_count,
                                "expected": 100,
                                "message": result.get('message', 'N/A')
                            }
                        )
                    else:
                        self.log_result(
                            "100 Testdatensätze Erstellung",
                            False,
                            f"FALSCHE ANZAHL: {created_count} statt 100 erstellt",
                            {
                                "created_count": created_count,
                                "expected": 100,
                                "difference": abs(100 - created_count)
                            }
                        )
                    
                    # Validiere finale Bookmark-Anzahl
                    async with self.session.get(f"{self.base_url}/statistics") as stats_response:
                        if stats_response.status == 200:
                            stats_after = await stats_response.json()
                            bookmarks_after = stats_after.get('total_bookmarks', 0)
                            actual_increase = bookmarks_after - bookmarks_before
                            
                            if actual_increase == 100:
                                self.log_result(
                                    "Bookmark-Anzahl Validierung",
                                    True,
                                    f"Bookmark-Anzahl korrekt um 100 erhöht",
                                    {
                                        "before": bookmarks_before,
                                        "after": bookmarks_after,
                                        "increase": actual_increase
                                    }
                                )
                            else:
                                self.log_result(
                                    "Bookmark-Anzahl Validierung",
                                    False,
                                    f"Bookmark-Anzahl um {actual_increase} statt 100 erhöht",
                                    {
                                        "before": bookmarks_before,
                                        "after": bookmarks_after,
                                        "increase": actual_increase,
                                        "expected_increase": 100
                                    }
                                )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "100 Testdatensätze Erstellung",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        {"status_code": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "100 Testdatensätze Erstellung",
                False,
                f"Exception: {str(e)}",
                {"error_type": type(e).__name__}
            )
    
    async def test_category_distribution(self):
        """
        TEST: Validiere dass Sport, Business, Science Kategorien erstellt wurden
        """
        print("🎯 TESTING: Sport, Business, Science Kategorien Validierung")
        
        try:
            async with self.session.get(f"{self.base_url}/categories") as response:
                if response.status == 200:
                    categories = await response.json()
                    category_names = [cat.get('name', '') for cat in categories]
                    
                    required_categories = ['Sport', 'Business', 'Science']
                    found_categories = []
                    missing_categories = []
                    
                    for req_cat in required_categories:
                        if req_cat in category_names:
                            found_categories.append(req_cat)
                        else:
                            missing_categories.append(req_cat)
                    
                    if len(found_categories) == 3:
                        self.log_result(
                            "Sport/Business/Science Kategorien",
                            True,
                            "Alle erforderlichen Kategorien gefunden",
                            {
                                "found_categories": found_categories,
                                "total_categories": len(categories)
                            }
                        )
                    else:
                        self.log_result(
                            "Sport/Business/Science Kategorien",
                            False,
                            f"Fehlende Kategorien: {missing_categories}",
                            {
                                "found_categories": found_categories,
                                "missing_categories": missing_categories,
                                "all_categories": category_names[:10]  # Erste 10 zur Übersicht
                            }
                        )
                    
                    # Zusätzlich: Prüfe Bookmark-Anzahl in diesen Kategorien
                    for cat_name in found_categories:
                        async with self.session.get(f"{self.base_url}/bookmarks?category={cat_name}") as cat_response:
                            if cat_response.status == 200:
                                cat_bookmarks = await cat_response.json()
                                bookmark_count = len(cat_bookmarks)
                                
                                self.log_result(
                                    f"Kategorie {cat_name} Bookmarks",
                                    bookmark_count > 0,
                                    f"{bookmark_count} Bookmarks in {cat_name} Kategorie",
                                    {"category": cat_name, "bookmark_count": bookmark_count}
                                )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Sport/Business/Science Kategorien",
                        False,
                        f"HTTP {response.status}: {error_text}",
                        {"status_code": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "Sport/Business/Science Kategorien",
                False,
                f"Exception: {str(e)}",
                {"error_type": type(e).__name__}
            )
    
    async def test_lock_unlock_functionality(self):
        """
        KRITISCHER TEST: Lock/Unlock Funktionalität für gesperrte Bookmarks
        Tests: PUT /api/bookmarks/{id}/lock und PUT /api/bookmarks/{id}/unlock
        """
        print("🎯 TESTING: Lock/Unlock Funktionalität")
        
        try:
            # Hole alle Bookmarks um Test-Kandidaten zu finden
            async with self.session.get(f"{self.base_url}/bookmarks") as response:
                if response.status == 200:
                    bookmarks = await response.json()
                    
                    if len(bookmarks) == 0:
                        self.log_result(
                            "Lock/Unlock Funktionalität",
                            False,
                            "Keine Bookmarks für Lock/Unlock Tests verfügbar",
                            {"bookmark_count": 0}
                        )
                        return
                    
                    # Finde ein Bookmark zum Testen (bevorzugt nicht bereits gesperrt)
                    test_bookmark = None
                    for bookmark in bookmarks[:5]:  # Teste mit den ersten 5
                        if not bookmark.get('is_locked', False):
                            test_bookmark = bookmark
                            break
                    
                    if not test_bookmark:
                        # Falls alle gesperrt sind, nimm das erste
                        test_bookmark = bookmarks[0]
                    
                    bookmark_id = test_bookmark['id']
                    bookmark_title = test_bookmark.get('title', 'Unknown')
                    initial_lock_status = test_bookmark.get('is_locked', False)
                    
                    print(f"  Testing mit Bookmark: {bookmark_title} (ID: {bookmark_id})")
                    print(f"  Initial Lock Status: {initial_lock_status}")
                    
                    # TEST 1: Lock Funktionalität
                    async with self.session.put(f"{self.base_url}/bookmarks/{bookmark_id}/lock") as lock_response:
                        if lock_response.status == 200:
                            lock_result = await lock_response.json()
                            
                            # Validiere Lock-Response
                            if lock_result.get('is_locked') == True:
                                self.log_result(
                                    "Bookmark Lock Funktionalität",
                                    True,
                                    f"Bookmark erfolgreich gesperrt",
                                    {
                                        "bookmark_id": bookmark_id,
                                        "bookmark_title": bookmark_title,
                                        "lock_message": lock_result.get('message', 'N/A')
                                    }
                                )
                                
                                # Validiere dass Bookmark tatsächlich gesperrt ist
                                async with self.session.get(f"{self.base_url}/bookmarks") as verify_response:
                                    if verify_response.status == 200:
                                        updated_bookmarks = await verify_response.json()
                                        updated_bookmark = next((b for b in updated_bookmarks if b['id'] == bookmark_id), None)
                                        
                                        if updated_bookmark and updated_bookmark.get('is_locked', False):
                                            self.log_result(
                                                "Lock Status Verifikation",
                                                True,
                                                "Lock Status korrekt in Database gespeichert",
                                                {
                                                    "verified_lock_status": updated_bookmark.get('is_locked'),
                                                    "status_type": updated_bookmark.get('status_type', 'N/A')
                                                }
                                            )
                                        else:
                                            self.log_result(
                                                "Lock Status Verifikation",
                                                False,
                                                "Lock Status nicht korrekt in Database gespeichert",
                                                {
                                                    "expected_locked": True,
                                                    "actual_locked": updated_bookmark.get('is_locked', False) if updated_bookmark else None
                                                }
                                            )
                            else:
                                self.log_result(
                                    "Bookmark Lock Funktionalität",
                                    False,
                                    f"Lock Response zeigt is_locked={lock_result.get('is_locked')}",
                                    {"lock_response": lock_result}
                                )
                        else:
                            error_text = await lock_response.text()
                            self.log_result(
                                "Bookmark Lock Funktionalität",
                                False,
                                f"Lock HTTP {lock_response.status}: {error_text}",
                                {"status_code": lock_response.status}
                            )
                    
                    # TEST 2: Unlock Funktionalität
                    async with self.session.put(f"{self.base_url}/bookmarks/{bookmark_id}/unlock") as unlock_response:
                        if unlock_response.status == 200:
                            unlock_result = await unlock_response.json()
                            
                            # Validiere Unlock-Response
                            if unlock_result.get('is_locked') == False:
                                self.log_result(
                                    "Bookmark Unlock Funktionalität",
                                    True,
                                    f"Bookmark erfolgreich entsperrt",
                                    {
                                        "bookmark_id": bookmark_id,
                                        "bookmark_title": bookmark_title,
                                        "unlock_message": unlock_result.get('message', 'N/A')
                                    }
                                )
                                
                                # Validiere dass Bookmark tatsächlich entsperrt ist
                                async with self.session.get(f"{self.base_url}/bookmarks") as verify_response:
                                    if verify_response.status == 200:
                                        final_bookmarks = await verify_response.json()
                                        final_bookmark = next((b for b in final_bookmarks if b['id'] == bookmark_id), None)
                                        
                                        if final_bookmark and not final_bookmark.get('is_locked', True):
                                            self.log_result(
                                                "Unlock Status Verifikation",
                                                True,
                                                "Unlock Status korrekt in Database gespeichert",
                                                {
                                                    "verified_unlock_status": final_bookmark.get('is_locked'),
                                                    "status_type": final_bookmark.get('status_type', 'N/A')
                                                }
                                            )
                                        else:
                                            self.log_result(
                                                "Unlock Status Verifikation",
                                                False,
                                                "Unlock Status nicht korrekt in Database gespeichert",
                                                {
                                                    "expected_locked": False,
                                                    "actual_locked": final_bookmark.get('is_locked', True) if final_bookmark else None
                                                }
                                            )
                            else:
                                self.log_result(
                                    "Bookmark Unlock Funktionalität",
                                    False,
                                    f"Unlock Response zeigt is_locked={unlock_result.get('is_locked')}",
                                    {"unlock_response": unlock_result}
                                )
                        else:
                            error_text = await unlock_response.text()
                            self.log_result(
                                "Bookmark Unlock Funktionalität",
                                False,
                                f"Unlock HTTP {unlock_response.status}: {error_text}",
                                {"status_code": unlock_response.status}
                            )
                    
                    # TEST 3: Mehrfaches Lock/Unlock (Toggle-Test)
                    print("  Testing Toggle-Funktionalität...")
                    for i in range(2):
                        # Lock
                        async with self.session.put(f"{self.base_url}/bookmarks/{bookmark_id}/lock") as toggle_lock:
                            lock_success = toggle_lock.status == 200
                        
                        # Unlock
                        async with self.session.put(f"{self.base_url}/bookmarks/{bookmark_id}/unlock") as toggle_unlock:
                            unlock_success = toggle_unlock.status == 200
                        
                        if lock_success and unlock_success:
                            toggle_success = True
                        else:
                            toggle_success = False
                            break
                    
                    self.log_result(
                        "Lock/Unlock Toggle Test",
                        toggle_success,
                        f"Mehrfaches Lock/Unlock {'erfolgreich' if toggle_success else 'fehlgeschlagen'}",
                        {
                            "toggle_cycles": 2,
                            "bookmark_id": bookmark_id
                        }
                    )
                    
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Lock/Unlock Funktionalität",
                        False,
                        f"Bookmarks abrufen fehlgeschlagen: HTTP {response.status}",
                        {"status_code": response.status, "error": error_text}
                    )
                    
        except Exception as e:
            self.log_result(
                "Lock/Unlock Funktionalität",
                False,
                f"Exception: {str(e)}",
                {"error_type": type(e).__name__}
            )
    
    async def test_status_distribution_validation(self):
        """
        TEST: Validiere Status-Verteilung der erstellten Testdaten
        Erwartet: 10 Gruppen mit je 10 Datensätzen verschiedener Status-Typen
        """
        print("🎯 TESTING: Status-Verteilung Validierung")
        
        try:
            async with self.session.get(f"{self.base_url}/statistics") as response:
                if response.status == 200:
                    stats = await response.json()
                    
                    # Erwartete Status-Verteilung (10 von jedem Typ)
                    expected_distribution = {
                        'active_links': 10,
                        'dead_links': 10,
                        'localhost_links': 10,
                        'duplicate_links': 10,
                        'locked_links': 10,
                        'timeout_links': 10,
                        'unchecked_links': 10
                    }
                    
                    all_correct = True
                    distribution_details = {}
                    
                    for status_type, expected_count in expected_distribution.items():
                        actual_count = stats.get(status_type, 0)
                        distribution_details[status_type] = {
                            'expected': expected_count,
                            'actual': actual_count,
                            'correct': actual_count == expected_count
                        }
                        
                        if actual_count != expected_count:
                            all_correct = False
                    
                    # Zusätzlich: Gesamtanzahl prüfen (sollte mindestens 70 sein für die 7 Status-Typen)
                    total_bookmarks = stats.get('total_bookmarks', 0)
                    expected_minimum = 70  # 7 Status-Typen × 10
                    
                    if all_correct and total_bookmarks >= expected_minimum:
                        self.log_result(
                            "Status-Verteilung Validierung",
                            True,
                            "Alle Status-Typen haben korrekte Anzahl (10 pro Typ)",
                            {
                                "total_bookmarks": total_bookmarks,
                                "distribution": distribution_details
                            }
                        )
                    else:
                        incorrect_types = [k for k, v in distribution_details.items() if not v['correct']]
                        self.log_result(
                            "Status-Verteilung Validierung",
                            False,
                            f"Inkorrekte Status-Verteilung: {incorrect_types}",
                            {
                                "total_bookmarks": total_bookmarks,
                                "expected_minimum": expected_minimum,
                                "distribution": distribution_details,
                                "incorrect_types": incorrect_types
                            }
                        )
                else:
                    error_text = await response.text()
                    self.log_result(
                        "Status-Verteilung Validierung",
                        False,
                        f"Statistics HTTP {response.status}: {error_text}",
                        {"status_code": response.status}
                    )
                    
        except Exception as e:
            self.log_result(
                "Status-Verteilung Validierung",
                False,
                f"Exception: {str(e)}",
                {"error_type": type(e).__name__}
            )
    
    async def run_comprehensive_tests(self):
        """Führe alle spezifischen Tests gemäß German Review Request aus"""
        print("=" * 80)
        print("🎯 FAVORG BACKEND TESTING - GERMAN REVIEW REQUEST")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test Start: {datetime.now().isoformat()}")
        print()
        
        await self.setup_session()
        
        try:
            # 1. KRITISCHER TEST: 100 Testdatensätze erstellen
            await self.test_create_100_test_data()
            
            # 2. Kategorien-Validierung (Sport, Business, Science)
            await self.test_category_distribution()
            
            # 3. Status-Verteilung validieren
            await self.test_status_distribution_validation()
            
            # 4. KRITISCHER TEST: Lock/Unlock Funktionalität
            await self.test_lock_unlock_functionality()
            
        finally:
            await self.cleanup_session()
        
        # Zusammenfassung
        print("=" * 80)
        print("🎯 TEST ZUSAMMENFASSUNG")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if "✅ PASS" in result['status'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Gesamt Tests: {total_tests}")
        print(f"Erfolgreich: {passed_tests}")
        print(f"Fehlgeschlagen: {failed_tests}")
        print(f"Erfolgsrate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FEHLGESCHLAGENE TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result['status']:
                    print(f"  - {result['test']}: {result['message']}")
            print()
        
        print("✅ ERFOLGREICH ABGESCHLOSSENE TESTS:")
        for result in self.test_results:
            if "✅ PASS" in result['status']:
                print(f"  - {result['test']}: {result['message']}")
        
        print()
        print(f"Test Ende: {datetime.now().isoformat()}")
        print("=" * 80)
        
        return success_rate >= 80  # 80% Erfolgsrate als Mindestanforderung

async def main():
    """Main test execution"""
    tester = FavOrgBackendTester()
    success = await tester.run_comprehensive_tests()
    
    if success:
        print("🎉 ALLE KRITISCHEN TESTS ERFOLGREICH!")
        sys.exit(0)
    else:
        print("⚠️  EINIGE TESTS FEHLGESCHLAGEN - ÜBERPRÜFUNG ERFORDERLICH")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())