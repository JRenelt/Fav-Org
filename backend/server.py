from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
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
import zipfile
import tempfile

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
    subcategory: Optional[str] = None
    date_added: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_dead_link: bool = False
    last_checked: Optional[datetime] = None
    favicon: Optional[str] = None
    description: Optional[str] = None

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_category: Optional[str] = None
    bookmark_count: int = 0
    subcategory_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookmarkCreate(BaseModel):
    title: str
    url: str
    category: str = "Uncategorized"
    subcategory: Optional[str] = None

class BookmarkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None

class BookmarkMove(BaseModel):
    bookmark_ids: List[str]
    target_category: str
    target_subcategory: Optional[str] = None

class ExportRequest(BaseModel):
    format: str  # "xml" or "csv"
    category: Optional[str] = None

class Statistics(BaseModel):
    total_bookmarks: int
    total_categories: int
    active_links: int
    dead_links: int
    timeout_links: int
    unchecked_links: int
    categories_distribution: Dict[str, int]
    subcategories_distribution: Dict[str, Dict[str, int]]
    top_categories: List[Dict[str, Any]]
    recent_bookmarks: int
    last_updated: datetime

class BookmarkParser:
    """Klasse für das Parsen verschiedener Browser-Favoriten-Formate"""
    
    def __init__(self):
        self.supported_formats = ['html', 'json', 'xml']
    
    def parse_html_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse HTML-Bookmarks (Chrome, Firefox Export)"""
        bookmarks = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            current_folder = "Nicht zugeordnet"
            current_subfolder = None
            
            # Durchlaufe alle Elemente sequenziell
            for element in soup.find_all(['h3', 'a']):
                if element.name == 'h3':
                    folder_text = element.get_text().strip()
                    
                    # Erkenne Unterkategorien durch Pfeil-Symbol oder →
                    if '→' in folder_text or '->' in folder_text:
                        parts = folder_text.split('→') if '→' in folder_text else folder_text.split('->')
                        if len(parts) >= 2:
                            current_folder = parts[0].strip()
                            current_subfolder = parts[1].strip()
                        else:
                            current_subfolder = folder_text
                    else:
                        current_folder = folder_text
                        current_subfolder = None
                        
                elif element.name == 'a':
                    href = element.get('href', '')
                    title = element.get_text().strip() or href
                    
                    if href and href.startswith(('http://', 'https://')):
                        bookmarks.append({
                            'title': title,
                            'url': href,
                            'category': current_folder,
                            'subcategory': current_subfolder
                        })
                        
        except Exception as e:
            logging.error(f"Error parsing HTML bookmarks: {e}")
            
        return bookmarks
    
    def parse_json_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse JSON-Bookmarks"""
        bookmarks = []
        
        try:
            data = json.loads(content)
            
            def extract_bookmarks(node, category="Nicht zugeordnet", subcategory=None):
                if isinstance(node, dict):
                    if 'children' in node:
                        # Folder
                        folder_name = node.get('name', category)
                        for child in node['children']:
                            extract_bookmarks(child, folder_name, subcategory)
                    elif 'url' in node:
                        # Bookmark
                        bookmarks.append({
                            'title': node.get('name', ''),
                            'url': node['url'],
                            'category': category,
                            'subcategory': subcategory
                        })
                elif isinstance(node, list):
                    for item in node:
                        extract_bookmarks(item, category, subcategory)
            
            extract_bookmarks(data)
            
        except Exception as e:
            logging.error(f"Error parsing JSON bookmarks: {e}")
            
        return bookmarks

class LinkValidator:
    """Klasse für Link-Validierung und Dead-Link-Erkennung"""
    
    def __init__(self):
        self.timeout = 10
        self.user_agent = "FavLink-Manager/1.0"
    
    async def check_link(self, url: str) -> Dict[str, Any]:
        """Überprüft einen einzelnen Link und gibt Status zurück"""
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                headers={'User-Agent': self.user_agent}
            ) as session:
                async with session.head(url, allow_redirects=True) as response:
                    if response.status < 400:
                        return {"status": "active", "is_dead_link": False}
                    else:
                        return {"status": "dead", "is_dead_link": True}
        except asyncio.TimeoutError:
            return {"status": "timeout", "is_dead_link": True}
        except Exception:
            return {"status": "dead", "is_dead_link": True}
    
    async def validate_bookmarks(self, bookmarks: List[Bookmark]) -> List[Bookmark]:
        """Validiert alle Bookmarks auf Dead Links"""
        tasks = []
        for bookmark in bookmarks:
            tasks.append(self._validate_single_bookmark(bookmark))
        
        validated_bookmarks = await asyncio.gather(*tasks)
        return validated_bookmarks
    
    async def _validate_single_bookmark(self, bookmark: Bookmark) -> Bookmark:
        """Validiert ein einzelnes Bookmark"""
        link_result = await self.check_link(bookmark.url)
        bookmark.is_dead_link = link_result["is_dead_link"]
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
        
        duplicates = [group for group in url_map.values() if len(group) > 1]
        return duplicates
    
    def _normalize_url(self, url: str) -> str:
        """Normalisiert URL für Duplikat-Vergleich"""
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

class ExportManager:
    """Klasse für Export-Funktionen"""
    
    def __init__(self):
        pass
    
    def export_to_xml(self, bookmarks: List[Bookmark]) -> str:
        """Exportiert Bookmarks zu XML"""
        root = ET.Element("bookmarks")
        root.set("version", "1.0")
        root.set("generated", datetime.now(timezone.utc).isoformat())
        
        for bookmark in bookmarks:
            bookmark_elem = ET.SubElement(root, "bookmark")
            bookmark_elem.set("id", bookmark.id)
            
            ET.SubElement(bookmark_elem, "title").text = bookmark.title
            ET.SubElement(bookmark_elem, "url").text = bookmark.url
            ET.SubElement(bookmark_elem, "category").text = bookmark.category
            if bookmark.subcategory:
                ET.SubElement(bookmark_elem, "subcategory").text = bookmark.subcategory
            ET.SubElement(bookmark_elem, "date_added").text = bookmark.date_added.isoformat()
            ET.SubElement(bookmark_elem, "is_dead_link").text = str(bookmark.is_dead_link).lower()
            if bookmark.last_checked:
                ET.SubElement(bookmark_elem, "last_checked").text = bookmark.last_checked.isoformat()
        
        return ET.tostring(root, encoding='unicode', xml_declaration=True)
    
    def export_to_csv(self, bookmarks: List[Bookmark]) -> str:
        """Exportiert Bookmarks zu CSV"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'ID', 'Title', 'URL', 'Category', 'Subcategory', 
            'Date Added', 'Is Dead Link', 'Last Checked'
        ])
        
        # Data
        for bookmark in bookmarks:
            writer.writerow([
                bookmark.id,
                bookmark.title,
                bookmark.url,
                bookmark.category,
                bookmark.subcategory or '',
                bookmark.date_added.isoformat(),
                bookmark.is_dead_link,
                bookmark.last_checked.isoformat() if bookmark.last_checked else ''
            ])
        
        output.seek(0)
        return output.getvalue()

class CategoryManager:
    """Klasse für Kategorie-Verwaltung mit Unterkategorien"""
    
    def __init__(self, database):
        self.db = database
    
    async def get_all_categories(self) -> List[Category]:
        """Alle Kategorien mit Hierarchie abrufen"""
        categories = await self.db.categories.find().to_list(1000)
        return [Category(**cat) for cat in categories]
    
    async def create_category(self, name: str, parent_category: Optional[str] = None) -> Category:
        """Neue Kategorie oder Unterkategorie erstellen"""
        category = Category(name=name, parent_category=parent_category)
        await self.db.categories.insert_one(category.dict())
        return category
    
    async def update_bookmark_counts(self):
        """Bookmark-Anzahl für alle Kategorien und Unterkategorien aktualisieren"""
        # Hauptkategorien
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        counts = await self.db.bookmarks.aggregate(pipeline).to_list(None)
        
        for count_doc in counts:
            await self.db.categories.update_one(
                {"name": count_doc["_id"], "parent_category": None},
                {"$set": {"bookmark_count": count_doc["count"]}},
                upsert=True
            )
        
        # Unterkategorien
        subcategory_pipeline = [
            {"$match": {"subcategory": {"$ne": None}}},
            {"$group": {"_id": {"category": "$category", "subcategory": "$subcategory"}, "count": {"$sum": 1}}}
        ]
        subcounts = await self.db.bookmarks.aggregate(subcategory_pipeline).to_list(None)
        
        for count_doc in subcounts:
            category_name = count_doc["_id"]["category"]
            subcategory_name = count_doc["_id"]["subcategory"]
            
            await self.db.categories.update_one(
                {"name": subcategory_name, "parent_category": category_name},
                {"$set": {"bookmark_count": count_doc["count"]}},
                upsert=True
            )

class StatisticsManager:
    """Klasse für erweiterte Statistik-Verwaltung"""
    
    def __init__(self, database):
        self.db = database
    
    async def generate_statistics(self) -> Statistics:
        """Generiert umfassende Statistiken mit Unterkategorien"""
        
        bookmarks = await self.db.bookmarks.find().to_list(1000)
        categories = await self.db.categories.find().to_list(1000)
        
        total_bookmarks = len(bookmarks)
        total_categories = len(categories)
        
        # Status-basierte Zählung
        active_links = sum(1 for b in bookmarks if not b.get('is_dead_link', False) and b.get('last_checked'))
        dead_links = sum(1 for b in bookmarks if b.get('is_dead_link', False))
        timeout_links = 0  # Könnte erweitert werden
        unchecked_links = sum(1 for b in bookmarks if not b.get('last_checked'))
        
        # Kategorien-Verteilung
        categories_distribution = {}
        subcategories_distribution = {}
        
        for bookmark in bookmarks:
            category = bookmark.get('category', 'Nicht zugeordnet')
            subcategory = bookmark.get('subcategory')
            
            categories_distribution[category] = categories_distribution.get(category, 0) + 1
            
            if subcategory:
                if category not in subcategories_distribution:
                    subcategories_distribution[category] = {}
                subcategories_distribution[category][subcategory] = subcategories_distribution[category].get(subcategory, 0) + 1
        
        # Top Kategorien
        top_categories = [
            {
                "name": cat, 
                "count": count, 
                "percentage": round((count / total_bookmarks) * 100, 1) if total_bookmarks > 0 else 0,
                "subcategories": subcategories_distribution.get(cat, {})
            }
            for cat, count in sorted(categories_distribution.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # Kürzlich hinzugefügte Bookmarks
        from datetime import timedelta
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_bookmarks = sum(
            1 for b in bookmarks 
            if b.get('date_added') and 
            (datetime.fromisoformat(b['date_added'].replace('Z', '+00:00')) if isinstance(b['date_added'], str) 
             else b['date_added']) > seven_days_ago
        )
        
        return Statistics(
            total_bookmarks=total_bookmarks,
            total_categories=total_categories,
            active_links=active_links,
            dead_links=dead_links,
            timeout_links=timeout_links,
            unchecked_links=unchecked_links,
            categories_distribution=categories_distribution,
            subcategories_distribution=subcategories_distribution,
            top_categories=top_categories,
            recent_bookmarks=recent_bookmarks,
            last_updated=datetime.now(timezone.utc)
        )

class BookmarkManager:
    """Hauptklasse für Bookmark-Verwaltung"""
    
    def __init__(self, database):
        self.db = database
        self.parser = BookmarkParser()
        self.validator = LinkValidator()
        self.duplicate_detector = DuplicateDetector()
        self.category_manager = CategoryManager(database)
        self.statistics_manager = StatisticsManager(database)
        self.export_manager = ExportManager()
    
    async def create_sample_bookmarks(self) -> Dict[str, Any]:
        """Erstellt 30 Beispiel-Bookmarks mit Unterkategorien"""
        
        sample_bookmarks = [
            # Development (8 Bookmarks) mit Unterkategorien
            {"title": "GitHub", "url": "https://github.com", "category": "Development", "subcategory": "Code Hosting"},
            {"title": "Stack Overflow", "url": "https://stackoverflow.com", "category": "Development", "subcategory": "Q&A"},
            {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "category": "Development", "subcategory": "Documentation"},
            {"title": "CodePen", "url": "https://codepen.io", "category": "Development", "subcategory": "Code Sharing"},
            {"title": "GitLab", "url": "https://gitlab.com", "category": "Development", "subcategory": "Code Hosting"},
            {"title": "Bitbucket", "url": "https://bitbucket.org", "category": "Development", "subcategory": "Code Hosting"},
            {"title": "VS Code", "url": "https://code.visualstudio.com", "category": "Development", "subcategory": "IDE"},
            {"title": "Docker Hub", "url": "https://hub.docker.com", "category": "Development", "subcategory": "Container"},
            
            # News & Media (6 Bookmarks)
            {"title": "Hacker News", "url": "https://news.ycombinator.com", "category": "News", "subcategory": "Tech News"},
            {"title": "Reddit", "url": "https://reddit.com", "category": "News", "subcategory": "Social News"},
            {"title": "BBC News", "url": "https://bbc.com/news", "category": "News", "subcategory": "World News"},
            {"title": "TechCrunch", "url": "https://techcrunch.com", "category": "News", "subcategory": "Tech News"},
            {"title": "Ars Technica", "url": "https://arstechnica.com", "category": "News", "subcategory": "Tech News"},
            {"title": "The Verge", "url": "https://theverge.com", "category": "News", "subcategory": "Tech News"},
            
            # Social Media (4 Bookmarks)
            {"title": "Twitter", "url": "https://twitter.com", "category": "Social Media", "subcategory": "Microblogging"},
            {"title": "LinkedIn", "url": "https://linkedin.com", "category": "Social Media", "subcategory": "Professional"},
            {"title": "Instagram", "url": "https://instagram.com", "category": "Social Media", "subcategory": "Photo Sharing"},
            {"title": "Mastodon", "url": "https://mastodon.social", "category": "Social Media", "subcategory": "Decentralized"},
            
            # Tools & Utilities (5 Bookmarks)
            {"title": "Google", "url": "https://google.com", "category": "Tools", "subcategory": "Search"},
            {"title": "Gmail", "url": "https://gmail.com", "category": "Tools", "subcategory": "Email"},
            {"title": "Google Drive", "url": "https://drive.google.com", "category": "Tools", "subcategory": "Cloud Storage"},
            {"title": "Dropbox", "url": "https://dropbox.com", "category": "Tools", "subcategory": "Cloud Storage"},
            {"title": "Notion", "url": "https://notion.so", "category": "Tools", "subcategory": "Productivity"},
            
            # Entertainment (4 Bookmarks)
            {"title": "YouTube", "url": "https://youtube.com", "category": "Entertainment", "subcategory": "Video"},
            {"title": "Netflix", "url": "https://netflix.com", "category": "Entertainment", "subcategory": "Streaming"},
            {"title": "Spotify", "url": "https://spotify.com", "category": "Entertainment", "subcategory": "Music"},
            {"title": "Twitch", "url": "https://twitch.tv", "category": "Entertainment", "subcategory": "Gaming"},
            
            # Reference mit Duplikaten und Dead Links
            {"title": "Wikipedia", "url": "https://wikipedia.org", "category": "Reference"},
            {"title": "Wikipedia DE", "url": "https://de.wikipedia.org", "category": "Reference"},
            {"title": "Archive.org", "url": "https://archive.org", "category": "Reference"},
            
            # Dead Links für Tests
            {"title": "Dead Link 1", "url": "https://this-domain-does-not-exist-12345.com", "category": "Testing"},
            {"title": "Dead Link 2", "url": "https://broken-url-test.invalid", "category": "Testing"},
        ]
        
        created_count = 0
        for bookmark_data in sample_bookmarks:
            bookmark = Bookmark(**bookmark_data)
            await self.db.bookmarks.insert_one(bookmark.dict())
            created_count += 1
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "created_count": created_count,
            "message": f"Successfully created {created_count} sample bookmarks with subcategories"
        }
    
    async def import_bookmarks(self, content: str, file_type: str) -> Dict[str, Any]:
        """Importiert Bookmarks aus verschiedenen Formaten"""
        
        if file_type.lower() == 'html':
            bookmark_data = self.parser.parse_html_bookmarks(content)
        elif file_type.lower() == 'json':
            bookmark_data = self.parser.parse_json_bookmarks(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        bookmarks = [Bookmark(**data) for data in bookmark_data]
        bookmarks = self.duplicate_detector.remove_duplicates(bookmarks)
        
        for bookmark in bookmarks:
            await self.db.bookmarks.insert_one(bookmark.dict())
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "imported_count": len(bookmarks),
            "message": f"Successfully imported {len(bookmarks)} bookmarks"
        }
    
    async def get_all_bookmarks(self) -> List[Bookmark]:
        """Alle Bookmarks abrufen"""
        bookmarks = await self.db.bookmarks.find().to_list(1000)
        return [Bookmark(**bookmark) for bookmark in bookmarks]
    
    async def get_bookmarks_by_category(self, category: str, subcategory: Optional[str] = None) -> List[Bookmark]:
        """Bookmarks nach Kategorie und optional Unterkategorie filtern"""
        query = {"category": category}
        if subcategory:
            query["subcategory"] = subcategory
            
        bookmarks = await self.db.bookmarks.find(query).to_list(1000)
        return [Bookmark(**bookmark) for bookmark in bookmarks]
    
    async def create_bookmark(self, bookmark_data: BookmarkCreate) -> Bookmark:
        """Neues Bookmark erstellen"""
        bookmark = Bookmark(**bookmark_data.dict())
        await self.db.bookmarks.insert_one(bookmark.dict())
        await self.category_manager.update_bookmark_counts()
        return bookmark
    
    async def update_bookmark(self, bookmark_id: str, update_data: BookmarkUpdate) -> Bookmark:
        """Bookmark aktualisieren"""
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        result = await self.db.bookmarks.update_one(
            {"id": bookmark_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        await self.category_manager.update_bookmark_counts()
        
        # Return updated bookmark
        updated_bookmark = await self.db.bookmarks.find_one({"id": bookmark_id})
        return Bookmark(**updated_bookmark)
    
    async def move_bookmarks(self, move_data: BookmarkMove) -> Dict[str, Any]:
        """Bookmarks in andere Kategorie verschieben"""
        result = await self.db.bookmarks.update_many(
            {"id": {"$in": move_data.bookmark_ids}},
            {"$set": {
                "category": move_data.target_category,
                "subcategory": move_data.target_subcategory
            }}
        )
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "moved_count": result.modified_count,
            "message": f"Moved {result.modified_count} bookmarks to {move_data.target_category}"
        }
    
    async def validate_all_links(self) -> Dict[str, Any]:
        """Alle Links validieren"""
        bookmarks = await self.get_all_bookmarks()
        validated_bookmarks = await self.validator.validate_bookmarks(bookmarks)
        
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
            sorted_group = sorted(duplicate_group, key=lambda x: x.date_added, reverse=True)
            for bookmark in sorted_group[1:]:
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
                {"category": search_regex},
                {"subcategory": search_regex}
            ]
        }).to_list(1000)
        
        return [Bookmark(**bookmark) for bookmark in bookmarks]

# Globale BookmarkManager Instanz
bookmark_manager = BookmarkManager(db)

# API Endpoints

@api_router.post("/bookmarks/create-samples")
async def create_sample_bookmarks():
    """30 Beispiel-Bookmarks mit Unterkategorien erstellen"""
    return await bookmark_manager.create_sample_bookmarks()

@api_router.get("/statistics", response_model=Statistics)
async def get_statistics():
    """Erweiterte Statistiken mit Unterkategorien abrufen"""
    return await bookmark_manager.statistics_manager.generate_statistics()

@api_router.get("/download/collector")
async def download_collector():
    """Download des Sammelprogramms als ZIP"""
    # Sammle alle Dateien aus dem scripts Ordner
    scripts_dir = Path("/app/scripts")
    
    # Erstelle ZIP in Memory
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in scripts_dir.glob("*"):
            if file_path.is_file():
                zip_file.write(file_path, file_path.name)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=bookmark_collector.zip"}
    )

@api_router.post("/export")
async def export_bookmarks(export_request: ExportRequest):
    """Exportiert Bookmarks in XML oder CSV Format"""
    # Hole Bookmarks basierend auf Filter
    if export_request.category:
        bookmarks = await bookmark_manager.get_bookmarks_by_category(export_request.category)
    else:
        bookmarks = await bookmark_manager.get_all_bookmarks()
    
    # Exportiere basierend auf Format
    if export_request.format.lower() == "xml":
        content = bookmark_manager.export_manager.export_to_xml(bookmarks)
        media_type = "application/xml"
        filename = f"bookmarks_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xml"
    elif export_request.format.lower() == "csv":
        content = bookmark_manager.export_manager.export_to_csv(bookmarks)
        media_type = "text/csv"
        filename = f"bookmarks_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")
    
    return StreamingResponse(
        io.StringIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.post("/bookmarks/import")
async def import_bookmarks_endpoint(file: UploadFile = File(...)):
    """Favoriten-Datei hochladen und importieren"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    content_str = content.decode('utf-8')
    
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
async def get_bookmarks_by_category(category: str, subcategory: Optional[str] = None):
    """Bookmarks nach Kategorie und optional Unterkategorie filtern"""
    return await bookmark_manager.get_bookmarks_by_category(category, subcategory)

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    """Alle Kategorien mit Hierarchie abrufen"""
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
    return await bookmark_manager.create_bookmark(bookmark)

@api_router.put("/bookmarks/{bookmark_id}", response_model=Bookmark)
async def update_bookmark(bookmark_id: str, update_data: BookmarkUpdate):
    """Bookmark aktualisieren"""
    return await bookmark_manager.update_bookmark(bookmark_id, update_data)

@api_router.post("/bookmarks/move")
async def move_bookmarks(move_data: BookmarkMove):
    """Bookmarks in andere Kategorie verschieben"""
    return await bookmark_manager.move_bookmarks(move_data)

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