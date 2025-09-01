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
  Plus
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

  async getBookmarksByCategory(category) {
    try {
      const response = await axios.get(`${this.baseURL}/bookmarks/category/${encodeURIComponent(category)}`);
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
      searchQuery: '',
      isLoading: false,
      showSettings: false,
      showHelp: false,
      showStatistics: false
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

const Header = ({ onSettingsClick, onHelpClick, onStatisticsClick, searchQuery, onSearchChange, onClearSearch }) => {
  return (
    <header className="header-fixed">
      <div className="header-content">
        <div className="logo-section">
          <LinkIcon className="logo-icon" />
          <h1 className="app-title">FavLink Manager</h1>
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

        <div className="header-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={onStatisticsClick}
            className="header-btn stats-btn"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelpClick}
            className="header-btn help-btn"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSettingsClick}
            className="header-btn settings-btn"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

const CategorySidebar = ({ categories, activeCategory, onCategoryChange, bookmarkCounts }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <h3 className="sidebar-title">Kategorien</h3>
        
        <div className="category-list">
          <div
            className={`category-item ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => onCategoryChange('all')}
          >
            <FolderOpen className="category-icon" />
            <span>Alle Favoriten</span>
            <Badge variant="secondary" className="bookmark-count">
              {bookmarkCounts.total || 0}
            </Badge>
          </div>
          
          {categories.map(category => (
            <div
              key={category.id}
              className={`category-item ${activeCategory === category.name ? 'active' : ''}`}
              onClick={() => onCategoryChange(category.name)}
            >
              <FolderOpen className="category-icon" />
              <span>{category.name}</span>
              <Badge variant="secondary" className="bookmark-count">
                {category.bookmark_count || 0}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BookmarkList = ({ bookmarks, onDeleteBookmark }) => {
  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        <LinkIcon className="empty-icon" />
        <h3>Keine Favoriten gefunden</h3>
        <p>Importieren Sie Ihre Browser-Favoriten oder fügen Sie neue hinzu.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-grid">
      {bookmarks.map(bookmark => (
        <Card key={bookmark.id} className={`bookmark-card ${bookmark.is_dead_link ? 'dead-link' : ''}`}>
          <CardHeader className="bookmark-header">
            <div className="bookmark-title-row">
              <CardTitle className="bookmark-title">
                {bookmark.title}
              </CardTitle>
              <div className="bookmark-actions">
                {bookmark.is_dead_link && (
                  <AlertTriangle className="dead-link-icon" />
                )}
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
              <Badge variant="outline" className="category-badge">
                {bookmark.category}
              </Badge>
              {bookmark.is_dead_link ? (
                <Badge variant="destructive" className="status-badge">
                  <XCircle className="w-3 h-3 mr-1" />
                  Dead Link
                </Badge>
              ) : (
                <Badge variant="secondary" className="status-badge">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aktiv
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="bookmark-content">
            <div className="bookmark-url">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`bookmark-link ${bookmark.is_dead_link ? 'dead' : ''}`}
              >
                {bookmark.url}
                <ExternalLink className="external-icon" />
              </a>
            </div>
            
            {bookmark.last_checked && (
              <p className="last-checked">
                Zuletzt geprüft: {new Date(bookmark.last_checked).toLocaleDateString('de-DE')}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const StatisticsDialog = ({ isOpen, onClose, statistics }) => {
  if (!statistics) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="statistics-dialog max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <BarChart3 className="w-5 h-5 mr-2" />
            Favoriten-Statistiken
          </DialogTitle>
        </DialogHeader>
        
        <div className="statistics-content">
          {/* Übersicht */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon">
                <LinkIcon className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="stat-info">
                <h3>{statistics.total_bookmarks}</h3>
                <p>Gesamt Favoriten</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <FolderOpen className="w-8 h-8 text-blue-400" />
              </div>
              <div className="stat-info">
                <h3>{statistics.total_categories}</h3>
                <p>Kategorien</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="stat-info">
                <h3>{statistics.active_links}</h3>
                <p>Aktive Links</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="stat-info">
                <h3>{statistics.dead_links}</h3>
                <p>Tote Links</p>
              </div>
            </div>
          </div>

          {/* Top Kategorien */}
          <div className="top-categories">
            <h4 className="section-title">
              <TrendingUp className="w-5 h-5 mr-2" />
              Top Kategorien
            </h4>
            <div className="categories-list">
              {statistics.top_categories.slice(0, 8).map((category, index) => (
                <div key={category.name} className="category-stat">
                  <div className="category-rank">#{index + 1}</div>
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <div className="category-progress">
                      <div 
                        className="progress-bar"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="category-numbers">
                    <span className="category-count">{category.count}</span>
                    <span className="category-percentage">{category.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zusätzliche Informationen */}
          <div className="additional-stats">
            <div className="stat-item">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Kürzlich hinzugefügt (7 Tage): <strong>{statistics.recent_bookmarks}</strong></span>
            </div>
            <div className="stat-item">
              <Target className="w-5 h-5 text-green-400" />
              <span>Erfolgsrate: <strong>{statistics.total_bookmarks > 0 ? Math.round((statistics.active_links / statistics.total_bookmarks) * 100) : 0}%</strong></span>
            </div>
            <div className="stat-item">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <span>Zuletzt aktualisiert: <strong>{formatDate(statistics.last_updated)}</strong></span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SettingsDialog = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="settings-dialog">
        <DialogHeader>
          <DialogTitle>
            <Settings className="w-5 h-5 mr-2" />
            System-Einstellungen
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="settings-tabs">
          <TabsList className="settings-tab-list">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="validation">Validierung</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="settings-tab-content">
            <div className="setting-group">
              <h4>Anzeigeoptionen</h4>
              <p>Konfigurieren Sie die Darstellung der Favoriten.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="validation" className="settings-tab-content">
            <div className="setting-group">
              <h4>Link-Validierung</h4>
              <p>Einstellungen für die Tote-Link-Überprüfung.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="settings-tab-content">
            <div className="setting-group">
              <h4>Import/Export-Optionen</h4>
              <p>Konfiguration für Datenimport und -export.</p>
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
            Hilfe & Anleitung
          </DialogTitle>
        </DialogHeader>
        
        <div className="help-content">
          <div className="help-section">
            <h4>Favoriten importieren</h4>
            <p>Laden Sie HTML- oder JSON-Dateien aus Ihren Browsern hoch:</p>
            <ul>
              <li><strong>Chrome:</strong> Lesezeichen verwalten → Exportieren</li>
              <li><strong>Firefox:</strong> Lesezeichen verwalten → Exportieren</li>
              <li><strong>Edge:</strong> Favoriten → Exportieren</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Funktionen</h4>
            <ul>
              <li><strong>Kategorien:</strong> Automatische Organisation in Ordner</li>
              <li><strong>Dead-Link-Check:</strong> Überprüfung defekter Links</li>
              <li><strong>Duplikat-Bereinigung:</strong> Entfernung doppelter Einträge</li>
              <li><strong>Suche:</strong> Durchsuchen aller Favoriten</li>
              <li><strong>Statistiken:</strong> Übersicht über Ihre Favoriten</li>
            </ul>
          </div>
          
          <div className="help-section">
            <h4>Buttons</h4>
            <ul>
              <li><strong>Importieren:</strong> Favoriten-Datei hochladen</li>
              <li><strong>Beispiele erstellen:</strong> 30 Test-Favoriten generieren</li>
              <li><strong>Links prüfen:</strong> Alle Links auf Funktionalität testen</li>
              <li><strong>Duplikate entfernen:</strong> Doppelte Einträge bereinigen</li>
              <li><strong>Alle löschen:</strong> Komplette Favoriten-Liste leeren</li>
              <li><strong>Statistiken:</strong> Detaillierte Übersicht anzeigen</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ActionToolbar = ({ 
  onImport, 
  onCreateSamples,
  onValidateLinks, 
  onRemoveDuplicates, 
  onDeleteAll, 
  isLoading, 
  bookmarkCount 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      onImport(file);
    }
    event.target.value = '';
  };

  return (
    <div className="action-toolbar">
      <div className="toolbar-section">
        <input
          type="file"
          id="file-upload"
          accept=".html,.json,.xml,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <label htmlFor="file-upload">
          <Button className="import-btn" disabled={isLoading}>
            <Upload className="w-4 h-4 mr-2" />
            Favoriten importieren
          </Button>
        </label>
        
        <Button
          variant="outline"
          onClick={onCreateSamples}
          disabled={isLoading}
          className="sample-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Beispiele erstellen
        </Button>
        
        <Button
          variant="outline"
          onClick={onValidateLinks}
          disabled={isLoading || bookmarkCount === 0}
          className="validate-btn"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Links prüfen
        </Button>
        
        <Button
          variant="outline"
          onClick={onRemoveDuplicates}
          disabled={isLoading || bookmarkCount === 0}
          className="duplicate-btn"
        >
          <Copy className="w-4 h-4 mr-2" />
          Duplikate entfernen
        </Button>
      </div>
      
      <div className="toolbar-section">
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isLoading || bookmarkCount === 0}
              className="delete-all-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Alle löschen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alle Favoriten löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Alle {bookmarkCount} Favoriten werden permanent gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                onDeleteAll();
                setShowDeleteConfirm(false);
              }} className="bg-red-600 hover:bg-red-700">
                Alle löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// Hauptkomponente
function App() {
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
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
      toast.error('Fehler beim Laden der Statistiken: ' + error.message);
    }
  }, []);

  // Favoriten filtern
  useEffect(() => {
    let filtered = bookmarks;

    if (activeCategory !== 'all') {
      filtered = filtered.filter(bookmark => bookmark.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.category.toLowerCase().includes(query)
      );
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, activeCategory, searchQuery]);

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

  const handleImport = async (file) => {
    try {
      setIsLoading(true);
      const result = await favoritesService.importBookmarks(file);
      toast.success(`${result.imported_count} Favoriten erfolgreich importiert!`);
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Import fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateLinks = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.validateLinks();
      toast.success(`${result.dead_links_found} tote Links gefunden von ${result.total_checked} geprüften Links.`);
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      toast.error('Link-Validierung fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.removeDuplicates();
      toast.success(`${result.bookmarks_removed} Duplikate entfernt.`);
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Duplikat-Entfernung fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.deleteAllBookmarks();
      toast.success(`${result.deleted_count} Favoriten gelöscht.`);
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Löschen fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
    await loadStatistics();
    setShowStatistics(true);
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
      />

      <div className="app-content">
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          bookmarkCounts={bookmarkCounts}
        />

        <main className="main-content">
          <ActionToolbar
            onImport={handleImport}
            onCreateSamples={handleCreateSamples}
            onValidateLinks={handleValidateLinks}
            onRemoveDuplicates={handleRemoveDuplicates}
            onDeleteAll={handleDeleteAll}
            isLoading={isLoading}
            bookmarkCount={bookmarks.length}
          />

          <div className="content-area">
            {isLoading ? (
              <div className="loading-state">
                <RefreshCw className="loading-icon animate-spin" />
                <p>Wird geladen...</p>
              </div>
            ) : (
              <BookmarkList
                bookmarks={filteredBookmarks}
                onDeleteBookmark={handleDeleteBookmark}
              />
            )}
          </div>
        </main>
      </div>

      <footer className="app-footer">
        <p>&copy; ID2 - Jörg Renelt * 2025 Hamburg</p>
      </footer>

      <StatisticsDialog
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        statistics={statistics}
      />

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