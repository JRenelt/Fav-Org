import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { 
  Settings, 
  HelpCircle, 
  Upload, 
  Search, 
  X, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Copy, 
  FolderOpen,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Plus,
  Folder,
  ChevronRight,
  ChevronDown,
  Download,
  FileCheck,
  Zap,
  Clock
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Objektorientierte Frontend-Services

class FavoritesService {
  constructor() {
    this.baseURL = API;
  }

  async createSamples() {
    try {
      const response = await axios.post(`${this.baseURL}/bookmarks/create-samples`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create samples');
    }
  }

  async getStatistics() {
    try {
      const response = await axios.get(`${this.baseURL}/statistics`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch statistics');
    }
  }

  async importBookmarks(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${this.baseURL}/bookmarks/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Import failed');
    }
  }

  async getAllBookmarks() {
    try {
      const response = await axios.get(`${this.baseURL}/bookmarks`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch bookmarks');
    }
  }

  async getBookmarksByCategory(category, subcategory = null) {
    try {
      let url = `${this.baseURL}/bookmarks/category/${encodeURIComponent(category)}`;
      if (subcategory) {
        url += `?subcategory=${encodeURIComponent(subcategory)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch bookmarks by category');
    }
  }

  async getAllCategories() {
    try {
      const response = await axios.get(`${this.baseURL}/categories`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  async validateLinks() {
    try {
      const response = await axios.post(`${this.baseURL}/bookmarks/validate`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to validate links');
    }
  }

  async removeDuplicates() {
    try {
      const response = await axios.post(`${this.baseURL}/bookmarks/remove-duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to remove duplicates');
    }
  }

  async deleteAllBookmarks() {
    try {
      const response = await axios.delete(`${this.baseURL}/bookmarks/all`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete all bookmarks');
    }
  }

  async searchBookmarks(query) {
    try {
      const response = await axios.get(`${this.baseURL}/bookmarks/search/${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error('Search failed');
    }
  }

  async deleteBookmark(bookmarkId) {
    try {
      const response = await axios.delete(`${this.baseURL}/bookmarks/${bookmarkId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete bookmark');
    }
  }
}

class UIStateManager {
  constructor() {
    this.state = {
      activeCategory: 'all',
      activeSubcategory: null,
      searchQuery: '',
      isLoading: false,
      showSettings: false,
      showHelp: false,
      showStatistics: false,
      statusFilter: 'all'
    };
    this.listeners = [];
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState() {
    return this.state;
  }
}

// React Komponenten

const Header = ({ onSettingsClick, onHelpClick, onStatisticsClick, searchQuery, onSearchChange, onClearSearch, statusFilter, onStatusFilterChange }) => {
  return (
    <header className="header-fixed">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-icon">
            <LinkIcon className="w-8 h-8" />
          </div>
          <div className="app-info">
            <h1 className="app-title">Favoriten-Manager</h1>
            <p className="app-subtitle">Verwalten Sie alle Ihre Browser-Favoriten zentral</p>
          </div>
        </div>
        
        <div className="header-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={onStatisticsClick}
            className="action-btn script-btn"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Scripts
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="action-btn export-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="action-btn check-btn"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Prüfen
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="action-btn duplicate-btn"
          >
            <Copy className="w-4 h-4 mr-2" />
            Duplikate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="action-btn cleanup-btn"
          >
            <Zap className="w-4 h-4 mr-2" />
            Handlungen
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="header-btn settings-btn"
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelpClick}
            className="header-btn help-btn"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

const StatisticsPanel = ({ statistics }) => {
  if (!statistics) return null;

  return (
    <div className="statistics-panel">
      <h3 className="stats-title">
        <BarChart3 className="w-4 h-4 mr-2" />
        Statistiken
      </h3>
      
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Gesamt:</span>
          <span className="stat-value">{statistics.total_bookmarks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Aktiv:</span>
          <span className="stat-value active">{statistics.active_links}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Tot:</span>
          <span className="stat-value dead">{statistics.dead_links}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Timeout:</span>
          <span className="stat-value timeout">{statistics.timeout_links}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ungeprüft:</span>
          <span className="stat-value ungeprüft">{statistics.unchecked_links}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Kategorien:</span>
          <span className="stat-value">{statistics.total_categories}</span>
        </div>
      </div>
      
      <Button
        size="sm"
        onClick={() => window.location.reload()}
        className="refresh-btn"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Aktualisieren
      </Button>
    </div>
  );
};

const CategorySidebar = ({ categories, activeCategory, activeSubcategory, onCategoryChange, bookmarkCounts, statistics }) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Alle']));

  const toggleCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  // Organisiere Kategorien nach Hierarchie
  const organizeCategories = () => {
    const mainCategories = {};
    categories.forEach(category => {
      if (!category.parent_category) {
        mainCategories[category.name] = {
          ...category,
          subcategories: []
        };
      }
    });

    categories.forEach(category => {
      if (category.parent_category && mainCategories[category.parent_category]) {
        mainCategories[category.parent_category].subcategories.push(category);
      }
    });

    return Object.values(mainCategories);
  };

  const organizedCategories = organizeCategories();

  return (
    <div className="sidebar">
      <StatisticsPanel statistics={statistics} />
      
      <div className="sidebar-content">
        <h3 className="sidebar-title">Kategorien</h3>
        <p className="sidebar-subtitle">Basierend auf Browser-Ordnern</p>
        
        <div className="category-list">
          <div
            className={`category-item main-category ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => onCategoryChange('all', null)}
          >
            <div className="category-info">
              <FolderOpen className="category-icon all-icon" />
              <span className="category-name">Alle ({statistics?.total_bookmarks || 0})</span>
            </div>
          </div>
          
          {organizedCategories.map(category => (
            <div key={category.id} className="category-group">
              <div
                className={`category-item main-category ${activeCategory === category.name && !activeSubcategory ? 'active' : ''}`}
                onClick={() => onCategoryChange(category.name, null)}
              >
                <div className="category-info">
                  {category.subcategories.length > 0 ? (
                    expandedCategories.has(category.name) ? (
                      <ChevronDown 
                        className="expand-icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(category.name);
                        }}
                      />
                    ) : (
                      <ChevronRight 
                        className="expand-icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(category.name);
                        }}
                      />
                    )
                  ) : null}
                  
                  {category.name.startsWith('_') ? (
                    <Folder className="category-icon inactive-icon" />
                  ) : (
                    <Folder className="category-icon active-icon" />
                  )}
                  
                  <span className="category-name">
                    {category.name} ({category.bookmark_count})
                  </span>
                </div>
              </div>
              
              {expandedCategories.has(category.name) && category.subcategories.map(subcategory => (
                <div
                  key={subcategory.id}
                  className={`category-item subcategory ${activeCategory === category.name && activeSubcategory === subcategory.name ? 'active' : ''}`}
                  onClick={() => onCategoryChange(category.name, subcategory.name)}
                >
                  <div className="category-info">
                    <div className="subcategory-indent">
                      <Folder className="category-icon sub-icon" />
                      <span className="category-name">
                        {subcategory.name} ({subcategory.bookmark_count})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BookmarkList = ({ bookmarks, onDeleteBookmark, searchQuery, statusFilter }) => {
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);

  useEffect(() => {
    let filtered = bookmarks;

    // Status-Filter anwenden
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bookmark => {
        switch (statusFilter) {
          case 'active':
            return !bookmark.is_dead_link && bookmark.last_checked;
          case 'dead':
            return bookmark.is_dead_link;
          case 'unchecked':
            return !bookmark.last_checked;
          default:
            return true;
        }
      });
    }

    // Such-Filter anwenden
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.category.toLowerCase().includes(query) ||
        (bookmark.subcategory && bookmark.subcategory.toLowerCase().includes(query))
      );
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, searchQuery, statusFilter]);

  if (filteredBookmarks.length === 0) {
    return (
      <div className="empty-state">
        <LinkIcon className="empty-icon" />
        <h3>Keine Favoriten gefunden</h3>
        <p>Importieren Sie Ihre Browser-Favoriten oder fügen Sie neue hinzu.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-list">
      {filteredBookmarks.map(bookmark => (
        <Card key={bookmark.id} className={`bookmark-card ${bookmark.is_dead_link ? 'dead-link' : 'active-link'}`}>
          <CardHeader className="bookmark-header">
            <div className="bookmark-title-row">
              <CardTitle className="bookmark-title">
                {bookmark.title}
              </CardTitle>
              <div className="bookmark-actions">
                <Badge 
                  variant={bookmark.is_dead_link ? "destructive" : bookmark.last_checked ? "secondary" : "outline"}
                  className="status-badge"
                >
                  {bookmark.is_dead_link ? "Ungeprüft" : bookmark.last_checked ? "Ungeprüft" : "Ungeprüft"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(bookmark.url, '_blank')}
                  className="edit-btn"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteBookmark(bookmark.id)}
                  className="delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="bookmark-meta">
              <div className="bookmark-source">
                <Badge variant="outline" className="source-badge">
                  Chrome
                </Badge>
              </div>
              <div className="bookmark-url">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bookmark-link"
                >
                  {bookmark.url}
                </a>
              </div>
            </div>
            
            <div className="bookmark-categories">
              <span className="category-label">Kategorie:</span>
              <span className="category-value">
                {bookmark.category}
                {bookmark.subcategory && ` → ${bookmark.subcategory}`}
              </span>
              <span className="date-added">
                Hinzugefügt: {new Date(bookmark.date_added).toLocaleDateString('de-DE')}
              </span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

const SettingsDialog = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="settings-dialog">
        <DialogHeader>
          <DialogTitle>
            <Settings className="w-5 h-5 mr-2" />
            System-Einstellungen & Konfiguration
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="settings-tabs">
          <TabsList className="settings-tab-list">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="validation">Link-Validierung</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="settings-tab-content">
            <div className="setting-group">
              <h4>Anzeige-Einstellungen</h4>
              <p>Konfigurieren Sie die Darstellung und das Verhalten der Anwendung.</p>
              <div className="setting-controls">
                <label>Bookmarks pro Seite:</label>
                <Select defaultValue="50">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="all">Alle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="validation" className="settings-tab-content">
            <div className="setting-group">
              <h4>Link-Validierung</h4>
              <p>Einstellungen für die automatische Überprüfung von Links.</p>
              <div className="setting-controls">
                <label>Timeout (Sekunden):</label>
                <Select defaultValue="10">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="settings-tab-content">
            <div className="setting-group">
              <h4>Import/Export-Optionen</h4>
              <p>Konfiguration für Datenimport und -export.</p>
              <div className="setting-controls">
                <label>Duplikate beim Import:</label>
                <Select defaultValue="ignore">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ignore">Ignorieren</SelectItem>
                    <SelectItem value="replace">Ersetzen</SelectItem>
                    <SelectItem value="keep-both">Beide behalten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories" className="settings-tab-content">
            <div className="setting-group">
              <h4>Kategorie-Verwaltung</h4>
              <p>Verwalten Sie Ihre Bookmark-Kategorien und Unterkategorien.</p>
              <div className="setting-controls">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Neue Kategorie
                </Button>
                <Button variant="outline" size="sm">
                  <Folder className="w-4 h-4 mr-2" />
                  Kategorien reorganisieren
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const HelpDialog = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="help-dialog">
        <DialogHeader>
          <DialogTitle>
            <HelpCircle className="w-5 h-5 mr-2" />
            Hilfe & Anleitung - Favoriten-Manager
          </DialogTitle>
        </DialogHeader>
        
        <div className="help-content">
          <div className="help-section">
            <h4>Browser-Favoriten importieren</h4>
            <p>So exportieren Sie Favoriten aus verschiedenen Browsern:</p>
            <ul>
              <li><strong>Google Chrome:</strong> Einstellungen → Lesezeichen → Lesezeichen-Manager → Organisieren → Lesezeichen in HTML-Datei exportieren</li>
              <li><strong>Mozilla Firefox:</strong> Lesezeichen → Alle Lesezeichen anzeigen → Importieren und Sichern → Lesezeichen nach HTML exportieren</li>
              <li><strong>Microsoft Edge:</strong> Einstellungen → Favoriten → Favoriten verwalten → Favoriten exportieren</li>
              <li><strong>Safari:</strong> Datei → Lesezeichen exportieren</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Hauptfunktionen</h4>
            <ul>
              <li><strong>Automatische Kategorisierung:</strong> Behält die ursprüngliche Ordnerstruktur bei</li>
              <li><strong>Unterkategorien:</strong> Unterstützt mehrstufige Kategorien mit → Symbol</li>
              <li><strong>Link-Validierung:</strong> Überprüft automatisch alle Links auf Erreichbarkeit</li>
              <li><strong>Duplikat-Erkennung:</strong> Findet und entfernt doppelte Bookmarks</li>
              <li><strong>Erweiterte Suche:</strong> Durchsucht Titel, URLs, Kategorien und Unterkategorien</li>
              <li><strong>Status-Filter:</strong> Filtert nach aktiven, toten oder ungeprüften Links</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Button-Funktionen</h4>
            <ul>
              <li><strong>Scripts:</strong> Zeigt erweiterte Statistiken und Analysen</li>
              <li><strong>Export:</strong> Exportiert Favoriten in verschiedene Formate</li>
              <li><strong>Prüfen:</strong> Startet Link-Validierung für alle Bookmarks</li>
              <li><strong>Duplikate:</strong> Findet und entfernt doppelte Einträge</li>
              <li><strong>Handlungen:</strong> Bulk-Aktionen für ausgewählte Bookmarks</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Kategorien und Unterkategorien</h4>
            <ul>
              <li><strong>Hauptkategorien:</strong> Werden durch Ordnernamen in Browser-Exporten erstellt</li>
              <li><strong>Unterkategorien:</strong> Erkennbar durch → oder -&gt; Symbol im Namen</li>
              <li><strong>Hierarchie:</strong> Unterstützt mehrere Ebenen von Unterkategorien</li>
              <li><strong>Navigation:</strong> Klicken Sie auf Pfeil-Symbole zum Aufklappen/Zuklappen</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Status-Bedeutungen</h4>
            <ul>
              <li><strong>Aktiv:</strong> Link wurde geprüft und ist erreichbar</li>
              <li><strong>Tot:</strong> Link ist nicht erreichbar oder gibt Fehler zurück</li>
              <li><strong>Timeout:</strong> Link antwortet nicht innerhalb der Zeitspanne</li>
              <li><strong>Ungeprüft:</strong> Link wurde noch nicht auf Erreichbarkeit geprüft</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Tipps für bessere Organisation</h4>
            <ul>
              <li><strong>Konsistente Benennung:</strong> Verwenden Sie einheitliche Kategorienamen</li>
              <li><strong>Unterkategorien:</strong> Nutzen Sie → für hierarchische Strukturen</li>
              <li><strong>Regelmäßige Prüfung:</strong> Führen Sie monatlich Link-Validierungen durch</li>
              <li><strong>Duplikat-Bereinigung:</strong> Entfernen Sie regelmäßig doppelte Einträge</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MainContent = ({ searchQuery, onSearchChange, onClearSearch, statusFilter, onStatusFilterChange, bookmarks, onDeleteBookmark }) => {
  return (
    <main className="main-content">
      <div className="main-header">
        <div className="upload-section">
          <h2 className="section-title">Upload</h2>
          <p className="section-subtitle">Browser-Dateien hochladen</p>
          <p className="section-note">JSON, SQLite, HTML, CSV</p>
        </div>
        
        <div className="cleanup-section">
          <h2 className="section-title">Bereinigung</h2>
          <p className="section-subtitle">Tote Links entfernen</p>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="active">Nur aktive</SelectItem>
              <SelectItem value="dead">Nur tote</SelectItem>
              <SelectItem value="unchecked">Nur ungeprüfte</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="search-section">
        <div className="search-container">
          <Search className="search-icon" />
          <Input
            type="text"
            placeholder="Favoriten durchsuchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="content-area">
        <BookmarkList
          bookmarks={bookmarks}
          onDeleteBookmark={onDeleteBookmark}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </div>
    </main>
  );
};

// Hauptkomponente
function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [bookmarkCounts, setBookmarkCounts] = useState({ total: 0 });

  // Services
  const favoritesService = new FavoritesService();
  const uiStateManager = new UIStateManager();

  // Daten laden
  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await favoritesService.getAllBookmarks();
      setBookmarks(data);
      setBookmarkCounts({ total: data.length });
    } catch (error) {
      toast.error('Fehler beim Laden der Favoriten: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await favoritesService.getAllCategories();
      setCategories(data);
    } catch (error) {
      toast.error('Fehler beim Laden der Kategorien: ' + error.message);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const data = await favoritesService.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
      // Nicht als Toast-Error anzeigen, da es ein bekanntes Problem ist
    }
  }, []);

  // Favoriten filtern
  useEffect(() => {
    let filtered = bookmarks;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(bookmark => {
        if (activeSubcategory) {
          return bookmark.category === activeCategory && bookmark.subcategory === activeSubcategory;
        } else {
          return bookmark.category === activeCategory;
        }
      });
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, activeCategory, activeSubcategory]);

  // Event Handlers
  const handleCreateSamples = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.createSamples();
      toast.success(`${result.created_count} Beispiel-Favoriten erstellt!`);
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Beispiele erstellen fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category, subcategory) => {
    setActiveCategory(category);
    setActiveSubcategory(subcategory);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await favoritesService.deleteBookmark(bookmarkId);
      toast.success('Favorit gelöscht.');
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Löschen fehlgeschlagen: ' + error.message);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleStatisticsClick = async () => {
    // Automatisch Beispiele erstellen wenn noch keine Bookmarks vorhanden
    if (bookmarks.length === 0) {
      await handleCreateSamples();
    } else {
      await loadStatistics();
    }
  };

  // Initial Load
  useEffect(() => {
    loadBookmarks();
    loadCategories();
    loadStatistics();
  }, [loadBookmarks, loadCategories, loadStatistics]);

  return (
    <div className="app">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
        onStatisticsClick={handleStatisticsClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={handleClearSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="app-content">
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onCategoryChange={handleCategoryChange}
          bookmarkCounts={bookmarkCounts}
          statistics={statistics}
        />

        <MainContent
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={handleClearSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          bookmarks={filteredBookmarks}
          onDeleteBookmark={handleDeleteBookmark}
        />
      </div>

      <footer className="app-footer">
        <p>&copy; ID2 - Jörg Renelt * 2025 Hamburg</p>
      </footer>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default App;