#!/usr/bin/env python3
"""
Phase 2 Extended Validation - Additional verification tests
"""

import asyncio
import aiohttp
import json

BACKEND_URL = "https://fav-auditor.preview.emergentagent.com/api"

async def test_multiple_test_data_cycles():
    """Test multiple cycles of test data creation to ensure consistency"""
    async with aiohttp.ClientSession() as session:
        print("🔄 Testing multiple test data creation cycles...")
        
        for cycle in range(1, 4):
            print(f"\n--- Cycle {cycle} ---")
            
            # Clear data
            async with session.delete(f"{BACKEND_URL}/bookmarks/all") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Cleared {data.get('deleted_count', 0)} bookmarks")
            
            # Create test data
            async with session.post(f"{BACKEND_URL}/bookmarks/create-test-data") as response:
                if response.status == 200:
                    data = await response.json()
                    unchecked_count = data.get('status_distribution', {}).get('unchecked', 0)
                    print(f"✅ Created test data - Unchecked: {unchecked_count}")
                    
                    if unchecked_count != 10:
                        print(f"❌ INCONSISTENCY: Expected 10 unchecked, got {unchecked_count}")
                        return False
            
            # Verify statistics
            async with session.get(f"{BACKEND_URL}/statistics") as response:
                if response.status == 200:
                    data = await response.json()
                    stats_unchecked = data.get('unchecked_links', 0)
                    print(f"✅ Statistics API - Unchecked: {stats_unchecked}")
                    
                    if stats_unchecked != 10:
                        print(f"❌ STATISTICS INCONSISTENCY: Expected 10, got {stats_unchecked}")
                        return False
        
        print("\n🎉 All cycles consistent - Bug fix is stable!")
        return True

async def test_status_field_validation():
    """Validate that status_type field is properly set in database"""
    async with aiohttp.ClientSession() as session:
        print("\n🔍 Validating status_type field in database...")
        
        # Get all bookmarks
        async with session.get(f"{BACKEND_URL}/bookmarks") as response:
            if response.status == 200:
                bookmarks = await response.json()
                
                # Check each bookmark has status_type field
                missing_status = []
                status_distribution = {}
                
                for bookmark in bookmarks:
                    if 'status_type' not in bookmark:
                        missing_status.append(bookmark.get('id', 'unknown'))
                    else:
                        status = bookmark['status_type']
                        status_distribution[status] = status_distribution.get(status, 0) + 1
                
                if missing_status:
                    print(f"❌ {len(missing_status)} bookmarks missing status_type field")
                    return False
                
                print(f"✅ All {len(bookmarks)} bookmarks have status_type field")
                print(f"📊 Status distribution: {status_distribution}")
                
                # Verify unchecked count
                if status_distribution.get('unchecked', 0) == 10:
                    print("✅ Correct number of unchecked bookmarks in database")
                    return True
                else:
                    print(f"❌ Expected 10 unchecked, found {status_distribution.get('unchecked', 0)}")
                    return False

async def main():
    print("🎯 PHASE 2 EXTENDED VALIDATION")
    print("=" * 50)
    
    # Test 1: Multiple cycles
    cycle_success = await test_multiple_test_data_cycles()
    
    # Test 2: Status field validation
    field_success = await test_status_field_validation()
    
    print("\n" + "=" * 50)
    print("📋 EXTENDED VALIDATION SUMMARY")
    print("=" * 50)
    
    if cycle_success and field_success:
        print("🎉 ✅ ALL EXTENDED TESTS PASSED")
        print("✅ Bug fix is stable across multiple cycles")
        print("✅ Database status_type fields are correct")
        return True
    else:
        print("❌ SOME EXTENDED TESTS FAILED")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)