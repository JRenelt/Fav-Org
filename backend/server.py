from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import html
import re
import asyncio
import aiohttp
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
import csv
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Objektorientierte Backend-Architektur

class Bookmark(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    category: str = "Uncategorized"
    date_added: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_dead_link: bool = False
    last_checked: Optional[datetime] = None
    favicon: Optional[str] = None
    description: Optional[str] = None

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bookmark_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookmarkCreate(BaseModel):
    title: str
    url: str
    category: str = "Uncategorized"

class BookmarkParser:
    """Klasse für das Parsen verschiedener Browser-Favoriten-Formate"""
    
    def __init__(self):
        self.supported_formats = ['html', 'json', 'xml']
    
    def parse_html_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse HTML-Bookmarks (Chrome, Firefox Export)"""
        bookmarks = []
        
        # HTML-Parsing für Browser-Exports
        from bs4 import BeautifulSoup
        
        try:
            soup = BeautifulSoup(content, 'html.parser')
            links = soup.find_all('a')
            
            current_folder = "Uncategorized"
            
            for link in links:
                # Kategorie aus vorherigem H3-Tag extrahieren
                h3 = link.find_previous('h3')
                if h3:
                    current_folder = h3.get_text().strip()
                
                href = link.get('href', '')
                title = link.get_text().strip() or href
                
                if href and href.startswith(('http://', 'https://')):
                    bookmarks.append({
                        'title': title,
                        'url': href,
                        'category': current_folder
                    })
                    
        except Exception as e:
            logging.error(f"Error parsing HTML bookmarks: {e}")
            
        return bookmarks
    
    def parse_json_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse JSON-Bookmarks"""
        bookmarks = []
        
        try:
            data = json.loads(content)
            
            def extract_bookmarks(node, category="Uncategorized"):
                if isinstance(node, dict):
                    if 'children' in node:
                        # Folder
                        folder_name = node.get('name', category)
                        for child in node['children']:
                            extract_bookmarks(child, folder_name)
                    elif 'url' in node:
                        # Bookmark
                        bookmarks.append({
                            'title': node.get('name', ''),
                            'url': node['url'],
                            'category': category
                        })
                elif isinstance(node, list):
                    for item in node:
                        extract_bookmarks(item, category)
            
            extract_bookmarks(data)
            
        except Exception as e:
            logging.error(f"Error parsing JSON bookmarks: {e}")
            
        return bookmarks

class LinkValidator:
    """Klasse für Link-Validierung und Dead-Link-Erkennung"""
    
    def __init__(self):
        self.timeout = 10
        self.user_agent = "FavLink-Manager/1.0"
    
    async def check_link(self, url: str) -> bool:
        """Überprüft einen einzelnen Link"""
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                headers={'User-Agent': self.user_agent}
            ) as session:
                async with session.head(url, allow_redirects=True) as response:
                    return response.status < 400
        except Exception:
            return False
    
    async def validate_bookmarks(self, bookmarks: List[Bookmark]) -> List[Bookmark]:
        """Validiert alle Bookmarks auf Dead Links"""
        tasks = []
        for bookmark in bookmarks:
            tasks.append(self._validate_single_bookmark(bookmark))
        
        validated_bookmarks = await asyncio.gather(*tasks)
        return validated_bookmarks
    
    async def _validate_single_bookmark(self, bookmark: Bookmark) -> Bookmark:
        """Validiert ein einzelnes Bookmark"""
        is_valid = await self.check_link(bookmark.url)
        bookmark.is_dead_link = not is_valid
        bookmark.last_checked = datetime.now(timezone.utc)
        return bookmark

class DuplicateDetector:
    """Klasse für Duplikat-Erkennung"""
    
    def __init__(self):
        pass
    
    def find_duplicates(self, bookmarks: List[Bookmark]) -> List[List[Bookmark]]:
        """Findet Duplikate basierend auf URL"""
        url_map = {}
        
        for bookmark in bookmarks:
            normalized_url = self._normalize_url(bookmark.url)
            if normalized_url not in url_map:
                url_map[normalized_url] = []
            url_map[normalized_url].append(bookmark)
        
        # Nur Gruppen mit mehr als einem Bookmark zurückgeben
        duplicates = [group for group in url_map.values() if len(group) > 1]
        return duplicates
    
    def _normalize_url(self, url: str) -> str:
        """Normalisiert URL für Duplikat-Vergleich"""
        # Entferne trailing slash, www, und wandle zu lowercase um
        normalized = url.lower().rstrip('/')
        if normalized.startswith('https://www.'):
            normalized = normalized.replace('https://www.', 'https://')
        elif normalized.startswith('http://www.'):
            normalized = normalized.replace('http://www.', 'http://')
        return normalized
    
    def remove_duplicates(self, bookmarks: List[Bookmark]) -> List[Bookmark]:
        """Entfernt Duplikate und behält das neueste"""
        unique_bookmarks = {}
        
        for bookmark in bookmarks:
            normalized_url = self._normalize_url(bookmark.url)
            if (normalized_url not in unique_bookmarks or 
                bookmark.date_added > unique_bookmarks[normalized_url].date_added):
                unique_bookmarks[normalized_url] = bookmark
        
        return list(unique_bookmarks.values())

class CategoryManager:
    """Klasse für Kategorie-Verwaltung"""
    
    def __init__(self, database):
        self.db = database
    
    async def get_all_categories(self) -> List[Category]:
        """Alle Kategorien abrufen"""
        categories = await self.db.categories.find().to_list(1000)
        return [Category(**cat) for cat in categories]
    
    async def create_category(self, name: str) -> Category:
        """Neue Kategorie erstellen"""
        category = Category(name=name)
        await self.db.categories.insert_one(category.dict())
        return category
    
    async def update_bookmark_counts(self):
        """Bookmark-Anzahl für alle Kategorien aktualisieren"""
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        
        counts = await self.db.bookmarks.aggregate(pipeline).to_list(None)
        
        for count_doc in counts:
            await self.db.categories.update_one(
                {"name": count_doc["_id"]},
                {"$set": {"bookmark_count": count_doc["count"]}},
                upsert=True
            )

class BookmarkManager:
    """Hauptklasse für Bookmark-Verwaltung"""
    
    def __init__(self, database):
        self.db = database
        self.parser = BookmarkParser()
        self.validator = LinkValidator()
        self.duplicate_detector = DuplicateDetector()
        self.category_manager = CategoryManager(database)
    
    async def import_bookmarks(self, content: str, file_type: str) -> Dict[str, Any]:
        """Importiert Bookmarks aus verschiedenen Formaten"""
        
        if file_type.lower() == 'html':
            bookmark_data = self.parser.parse_html_bookmarks(content)
        elif file_type.lower() == 'json':
            bookmark_data = self.parser.parse_json_bookmarks(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        bookmarks = [Bookmark(**data) for data in bookmark_data]
        
        # Duplikate entfernen
        bookmarks = self.duplicate_detector.remove_duplicates(bookmarks)
        
        # In Datenbank speichern
        for bookmark in bookmarks:
            await self.db.bookmarks.insert_one(bookmark.dict())
        
        # Kategorien aktualisieren
        await self.category_manager.update_bookmark_counts()
        
        return {
            "imported_count": len(bookmarks),
            "message": f"Successfully imported {len(bookmarks)} bookmarks"
        }
    
    async def get_all_bookmarks(self) -> List[Bookmark]:
        """Alle Bookmarks abrufen"""
        bookmarks = await self.db.bookmarks.find().to_list(1000)
        return [Bookmark(**bookmark) for bookmark in bookmarks]
    
    async def get_bookmarks_by_category(self, category: str) -> List[Bookmark]:
        """Bookmarks nach Kategorie filtern"""
        bookmarks = await self.db.bookmarks.find({"category": category}).to_list(1000)
        return [Bookmark(**bookmark) for bookmark in bookmarks]
    
    async def validate_all_links(self) -> Dict[str, Any]:
        """Alle Links validieren"""
        bookmarks = await self.get_all_bookmarks()
        validated_bookmarks = await self.validator.validate_bookmarks(bookmarks)
        
        # Aktualisierte Bookmarks speichern
        for bookmark in validated_bookmarks:
            await self.db.bookmarks.update_one(
                {"id": bookmark.id},
                {"$set": bookmark.dict()}
            )
        
        dead_links = [b for b in validated_bookmarks if b.is_dead_link]
        
        return {
            "total_checked": len(validated_bookmarks),
            "dead_links_found": len(dead_links),
            "message": f"Validation complete. Found {len(dead_links)} dead links."
        }
    
    async def find_and_remove_duplicates(self) -> Dict[str, Any]:
        """Duplikate finden und entfernen"""
        bookmarks = await self.get_all_bookmarks()
        duplicates = self.duplicate_detector.find_duplicates(bookmarks)
        
        removed_count = 0
        for duplicate_group in duplicates:
            # Behalte das neueste, lösche die anderen
            sorted_group = sorted(duplicate_group, key=lambda x: x.date_added, reverse=True)
            for bookmark in sorted_group[1:]:  # Alle außer dem neuesten
                await self.db.bookmarks.delete_one({"id": bookmark.id})
                removed_count += 1
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "duplicates_found": len(duplicates),
            "bookmarks_removed": removed_count,
            "message": f"Removed {removed_count} duplicate bookmarks"
        }
    
    async def delete_all_bookmarks(self) -> Dict[str, Any]:
        """Alle Bookmarks löschen"""
        result = await self.db.bookmarks.delete_many({})
        await self.db.categories.delete_many({})
        
        return {
            "deleted_count": result.deleted_count,
            "message": f"Deleted {result.deleted_count} bookmarks"
        }
    
    async def search_bookmarks(self, query: str) -> List[Bookmark]:
        """Bookmarks durchsuchen"""
        search_regex = {"$regex": query, "$options": "i"}
        bookmarks = await self.db.bookmarks.find({
            "$or": [
                {"title": search_regex},
                {"url": search_regex},
                {"category": search_regex}
            ]
        }).to_list(1000)
        
        return [Bookmark(**bookmark) for bookmark in bookmarks]

# Globale BookmarkManager Instanz
bookmark_manager = BookmarkManager(db)

# API Endpoints

@api_router.post("/bookmarks/import")
async def import_bookmarks_endpoint(file: UploadFile = File(...)):
    """Favoriten-Datei hochladen und importieren"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    content_str = content.decode('utf-8')
    
    # Dateierweiterung bestimmen
    file_extension = file.filename.split('.')[-1].lower()
    
    try:
        result = await bookmark_manager.import_bookmarks(content_str, file_extension)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookmarks", response_model=List[Bookmark])
async def get_bookmarks():
    """Alle Bookmarks abrufen"""
    return await bookmark_manager.get_all_bookmarks()

@api_router.get("/bookmarks/category/{category}", response_model=List[Bookmark])
async def get_bookmarks_by_category(category: str):
    """Bookmarks nach Kategorie filtern"""
    return await bookmark_manager.get_bookmarks_by_category(category)

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    """Alle Kategorien abrufen"""
    return await bookmark_manager.category_manager.get_all_categories()

@api_router.post("/bookmarks/validate")
async def validate_links():
    """Alle Links auf Dead Links überprüfen"""
    return await bookmark_manager.validate_all_links()

@api_router.post("/bookmarks/remove-duplicates")
async def remove_duplicates():
    """Duplikate finden und entfernen"""
    return await bookmark_manager.find_and_remove_duplicates()

@api_router.delete("/bookmarks/all")
async def delete_all_bookmarks():
    """Alle Bookmarks löschen"""
    return await bookmark_manager.delete_all_bookmarks()

@api_router.get("/bookmarks/search/{query}", response_model=List[Bookmark])
async def search_bookmarks(query: str):
    """Bookmarks durchsuchen"""
    return await bookmark_manager.search_bookmarks(query)

@api_router.post("/bookmarks", response_model=Bookmark)
async def create_bookmark(bookmark: BookmarkCreate):
    """Einzelnes Bookmark erstellen"""
    new_bookmark = Bookmark(**bookmark.dict())
    await db.bookmarks.insert_one(new_bookmark.dict())
    await bookmark_manager.category_manager.update_bookmark_counts()
    return new_bookmark

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    """Einzelnes Bookmark löschen"""
    result = await db.bookmarks.delete_one({"id": bookmark_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    await bookmark_manager.category_manager.update_bookmark_counts()
    return {"message": "Bookmark deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()