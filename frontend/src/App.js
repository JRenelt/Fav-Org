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
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import TableView from "./components/TableView";
import DraggableToast from "./components/DraggableToast";
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
  Clock,
  Edit,
  Move,
  FileText,
  FileSpreadsheet,
  Archive,
  Database,
  Table,
  Grid,
  BookOpen,
  Keyboard,
  Mouse,
  Monitor,
  Workflow,
  GripVertical
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Objektorientierte Frontend-Services

class FavoritesService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async createSamples() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/create-samples`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create samples');
    }
  }

  async createTestData() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/create-test-data`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create test data');
    }
  }

  async getStatistics() {
    try {
      const response = await axios.get(`${this.baseURL}/api/statistics`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch statistics');
    }
  }

  async exportBookmarks(format, category = null) {
    try {
      const response = await axios.post(`${this.baseURL}/api/export`, {
        format: format,
        category: category
      }, {
        responseType: 'blob'
      });
      
      // Trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `bookmarks_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      return { message: `${format.toUpperCase()} Export erfolgreich` };
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Export failed');
    }
  }

  async importBookmarks(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Import failed');
    }
  }

  async getAllBookmarks() {
    try {
      const response = await axios.get(`${this.baseURL}/api/bookmarks`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch bookmarks');
    }
  }

  async getBookmarksByCategory(category, subcategory = null) {
    try {
      let url = `${this.baseURL}/api/bookmarks/category/${encodeURIComponent(category)}`;
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
      const response = await axios.get(`${this.baseURL}/api/categories`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  async createBookmark(bookmarkData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks`, bookmarkData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create bookmark');
    }
  }

  async updateBookmark(bookmarkId, updateData) {
    try {
      const response = await axios.put(`${this.baseURL}/api/bookmarks/${bookmarkId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update bookmark');
    }
  }

  async updateBookmarkStatus(id, statusType) {
    try {
      const response = await axios.put(`${this.baseURL}/api/bookmarks/${id}/status`, { status_type: statusType });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update bookmark status');
    }
  }

  async moveBookmarks(bookmarkIds, targetCategory, targetSubcategory = null) {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/move`, {
        bookmark_ids: bookmarkIds,
        target_category: targetCategory,
        target_subcategory: targetSubcategory
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to move bookmarks');
    }
  }

  async validateLinks() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/validate`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to validate links');
    }
  }

  async removeDeadLinks() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/dead-links`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to remove dead links');
    }
  }

  async removeDuplicates() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/remove-duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to remove duplicates');
    }
  }

  async findDuplicates() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/find-duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to find duplicates');
    }
  }

  async deleteDuplicates() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete duplicates');
    }
  }

  async deleteAllBookmarks() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/all`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete all bookmarks');
    }
  }

  async searchBookmarks(query) {
    try {
      const response = await axios.get(`${this.baseURL}/api/bookmarks/search/${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error('Search failed');
    }
  }

  async deleteBookmark(bookmarkId) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/${bookmarkId}`);
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
      statusFilter: 'all',
      selectedBookmarks: new Set()
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

const Header = ({ onSettingsClick, onHelpClick, onStatsToggle, onCreateBookmarkClick, onFileUploadClick, onValidateClick, onRemoveDuplicatesClick, onDeleteAllClick, deadLinksCount, hasValidated, totalBookmarks, duplicateCount, hasDuplicatesMarked, filteredCount }) => {
  return (
    <header className="header-fixed">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-icon">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div className="app-info">
            <h1 className="app-title">
              FavOrg 
              <span className="bookmark-count">[{filteredCount !== null ? filteredCount : totalBookmarks}]</span>
            </h1>
            <p className="app-subtitle">Verwalten Sie Ihre Lesezeichen</p>
          </div>
        </div>

        <div className="header-actions">
          <Button 
            onClick={onCreateBookmarkClick} 
            className="action-btn create-btn"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neu
          </Button>
          
          <Button 
            onClick={onFileUploadClick} 
            className="action-btn upload-btn"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Datei wählen
          </Button>
          
          <Button 
            onClick={onValidateClick} 
            className="action-btn check-btn"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {deadLinksCount > 0 ? `Prüfen [${deadLinksCount}]` : 'Prüfen'}
          </Button>
          
          <Button 
            onClick={onRemoveDuplicatesClick} 
            className="action-btn duplicate-btn"
            size="sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            {duplicateCount > 0 ? `Duplikate [${duplicateCount}]` : 'Duplikate'}
          </Button>
          

        </div>

        <div className="header-right">
          <Button
            onClick={onHelpClick}
            className="header-btn"
            size="sm"
            title="Hilfe"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onStatsToggle}
            className="header-btn"
            size="sm"
            title="Statistiken ein-/ausblenden"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onSettingsClick}
            className="header-btn"
            size="sm" 
            title="System-Einstellungen"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="action-btn delete-all-btn cleanup-btn"
                size="sm"
                title="Alle Favoriten löschen"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alle Favoriten löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Favoriten werden dauerhaft gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteAllClick}>
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
};

// Bookmark Dialog Component
const BookmarkDialog = ({ isOpen, onClose, bookmark, onSave, categories }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'Uncategorized',
    subcategory: '__none__'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        category: bookmark.category || 'Uncategorized',
        subcategory: bookmark.subcategory || '__none__'
      });
    } else {
      setFormData({
        title: '',
        url: '',
        category: 'Uncategorized',
        subcategory: '__none__'
      });
    }
    setErrors({});
  }, [bookmark, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist ein Pflichtfeld';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL ist ein Pflichtfeld';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Bitte geben Sie eine gültige URL ein';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Einzigartige Kategorien für Dropdown erstellen
  const uniqueCategories = [...new Set(categories.map(cat => cat.name))];
  const subcategoriesForCategory = categories
    .filter(cat => cat.parent_category === formData.category)
    .map(cat => cat.name);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bookmark-dialog">
        <DialogHeader>
          <DialogTitle>
            <Plus className="w-5 h-5 mr-2" />
            {bookmark ? 'Favorit bearbeiten' : 'Neuer Favorit'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="bookmark-form">
          <div className="form-group">
            <Label htmlFor="title">
              Titel *
              {errors.title && <span className="error-text"> - {errors.title}</span>}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Titel des Favoriten"
              className={errors.title ? 'error' : ''}
              required
            />
          </div>
          
          <div className="form-group">
            <Label htmlFor="url">
              URL *
              {errors.url && <span className="error-text"> - {errors.url}</span>}
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              placeholder="https://example.com"
              className={errors.url ? 'error' : ''}
              required
            />
          </div>
          
          <div className="form-group">
            <Label htmlFor="category">Kategorie</Label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value, subcategory: null})}
              placeholder="Kategorie eingeben"
              className="form-input"
              list="category-options"
            />
            <datalist id="category-options">
              <option value="Uncategorized">Nicht zugeordnet</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          
          {subcategoriesForCategory.length > 0 && (
            <div className="form-group">
              <Label htmlFor="subcategory">Unterkategorie</Label>
              <input
                type="text"
                id="subcategory"
                value={formData.subcategory && formData.subcategory !== "__none__" ? formData.subcategory : ""}
                onChange={(e) => setFormData({...formData, subcategory: e.target.value || null})}
                placeholder="Unterkategorie eingeben (optional)"
                className="form-input"
                list="subcategory-options"
              />
              <datalist id="subcategory-options">
                {subcategoriesForCategory.map(subcat => (
                  <option key={subcat} value={subcat} />
                ))}
              </datalist>
            </div>
          )}
          
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : bookmark ? (
                <Edit className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {bookmark ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Help Dialog Component with comprehensive content and submenu system
const HelpDialog = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('import-basics');
  
  const menuSections = {
    'import-basics': 'Favoriten Importieren',
    'import-browsers': 'Unterstützte Browser', 
    'import-guide': 'Schritt-für-Schritt Anleitung',
    'import-formats': 'Unterstützte Dateiformate',
    'installation': 'Installationshilfe',
    'features-overview': 'Features Übersicht',
    'validation': 'Link-Validierung',
    'shortcuts': 'Shortcuts',
    'tips': 'Tipps & Tricks'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="help-dialog">
        <DialogHeader>
          <DialogTitle className="help-title">
            <HelpCircle className="w-5 h-5 mr-2" />
            ? FavOrg - Hilfe & Anleitung
          </DialogTitle>
        </DialogHeader>
        
        <div className="help-body-with-nav">
          {/* Navigation Menu */}
          <div className="help-navigation">
            {Object.entries(menuSections).map(([key, title]) => (
              <button
                key={key}
                className={`nav-menu-item ${activeSection === key ? 'active' : ''}`}
                onClick={() => setActiveSection(key)}
              >
                {title}
              </button>
            ))}
          </div>
          
          {/* Content Area */}
          <div className="help-content-area">
            {activeSection === 'import-basics' && (
              <div className="help-section">
                <h4>Favoriten Importieren</h4>
                <p>
                  FavOrg unterstützt den Import aus verschiedenen Browsern und Formaten.
                  Die Anwendung erkennt automatisch das Format und importiert Ihre Favoriten
                  mit allen Kategorien und Hierarchien.
                </p>
                <ul>
                  <li><strong>Multi-Browser Unterstützung:</strong> Chrome, Firefox, Edge, Safari</li>
                  <li><strong>Automatische Erkennung:</strong> Format wird automatisch erkannt</li>
                  <li><strong>Duplikat-Schutz:</strong> Doppelte Einträge werden vermieden</li>
                  <li><strong>Kategoriestruktur:</strong> Ordnerhierarchie bleibt erhalten</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'import-browsers' && (
              <div className="help-section">
                <h4>Unterstützte Browser</h4>
                <p>FavOrg kann Favoriten aus allen gängigen Browsern importieren:</p>
                <ul>
                  <li><strong>Google Chrome:</strong> Bookmarks → Lesezeichen-Manager → Exportieren</li>
                  <li><strong>Mozilla Firefox:</strong> Lesezeichen → Alle Lesezeichen anzeigen → Exportieren</li>
                  <li><strong>Microsoft Edge:</strong> Favoriten → Favoriten verwalten → Exportieren</li>
                  <li><strong>Safari:</strong> Datei → Lesezeichen exportieren</li>
                  <li><strong>Opera:</strong> Lesezeichen → Lesezeichen exportieren</li>
                  <li><strong>Vivaldi:</strong> Lesezeichen → Lesezeichen exportieren</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'import-guide' && (
              <div className="help-section">
                <h4>Schritt-für-Schritt Anleitung</h4>
                <p>So importieren Sie Ihre Favoriten in wenigen Schritten:</p>
                <ul>
                  <li><strong>Schritt 1:</strong> Exportieren Sie Favoriten aus Ihrem Browser</li>
                  <li><strong>Schritt 2:</strong> Klicken Sie auf "Datei wählen" in FavOrg</li>
                  <li><strong>Schritt 3:</strong> Wählen Sie die exportierte Datei aus</li>
                  <li><strong>Schritt 4:</strong> FavOrg verarbeitet die Datei automatisch</li>
                  <li><strong>Schritt 5:</strong> Überprüfen Sie die importierten Favoriten</li>
                  <li><strong>Schritt 6:</strong> Nutzen Sie "Prüfen" um Links zu validieren</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'import-formats' && (
              <div className="help-section">
                <h4>Unterstützte Dateiformate</h4>
                <p>FavOrg unterstützt verschiedene Importformate:</p>
                <ul>
                  <li><strong>HTML:</strong> Standard Browser-Export Format (.html)</li>
                  <li><strong>JSON:</strong> Chrome Bookmark Export (.json)</li>
                  <li><strong>CSV:</strong> Tabellenformat mit Titel, URL, Kategorie (.csv)</li>
                  <li><strong>XML:</strong> Strukturiertes Datenformat (.xml)</li>
                </ul>
                <p>
                  Das HTML-Format wird am häufigsten verwendet und von allen Browsern unterstützt.
                  JSON-Dateien enthalten zusätzliche Metadaten wie Erstellungsdatum.
                </p>
              </div>
            )}
            
            {activeSection === 'installation' && (
              <div className="help-section">
                <h4>Installationshilfe</h4>
                <p>
                  FavOrg ist eine webbasierte Anwendung, die keine lokale Installation erfordert.
                  Hier finden Sie Informationen zur optimalen Nutzung:
                </p>
                
                <h5>Browser-Empfehlungen</h5>
                <ul>
                  <li><strong>Chrome/Edge:</strong> Beste Performance und Kompatibilität</li>
                  <li><strong>Firefox:</strong> Vollständig unterstützt</li>
                  <li><strong>Safari:</strong> Grundfunktionen verfügbar</li>
                  <li><strong>Mindestversion:</strong> Aktuelle Browser-Versionen empfohlen</li>
                </ul>
                
                <h5>System-Anforderungen</h5>
                <ul>
                  <li><strong>RAM:</strong> Minimum 4GB für große Sammlungen</li>
                  <li><strong>Bildschirmauflösung:</strong> 1280x720 oder höher</li>
                  <li><strong>Internet:</strong> Stabile Verbindung für Link-Validierung</li>
                  <li><strong>JavaScript:</strong> Muss aktiviert sein</li>
                </ul>
                
                <h5>Erste Schritte</h5>
                <ul>
                  <li><strong>1. Browser-Export:</strong> Exportieren Sie Favoriten aus Ihrem Browser</li>
                  <li><strong>2. Datei-Upload:</strong> Nutzen Sie "Datei wählen" zum Import</li>
                  <li><strong>3. Kategorien prüfen:</strong> Kontrollieren Sie die automatische Kategorisierung</li>
                  <li><strong>4. Links validieren:</strong> Verwenden Sie den "Prüfen" Button</li>
                  <li><strong>5. Bereinigung:</strong> Entfernen Sie tote Links und Duplikate</li>
                </ul>
                
                <h5>Optimale Performance</h5>
                <ul>
                  <li><strong>Große Sammlungen:</strong> Bei über 10.000 Links in Kategorien aufteilen</li>
                  <li><strong>Regelmäßige Backups:</strong> Exportieren Sie Ihre Daten monatlich</li>
                  <li><strong>Browser-Cache:</strong> Leeren Sie bei Problemen den Cache</li>
                  <li><strong>Updates:</strong> FavOrg wird automatisch aktualisiert</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'features-overview' && (
              <div className="help-section">
                <h4>Features Übersicht</h4>
                <p>FavOrg bietet umfassende Funktionen für die Favoritenverwaltung:</p>
                <ul>
                  <li><strong>Import/Export:</strong> Verschiedene Formate unterstützt</li>
                  <li><strong>Link-Validierung:</strong> Automatische Überprüfung auf tote Links</li>
                  <li><strong>Duplikat-Erkennung:</strong> Finden und entfernen doppelter Einträge</li>
                  <li><strong>Kategorisierung:</strong> Hierarchische Organisation</li>
                  <li><strong>Suche:</strong> Durchsuchen von Titel, URL und Kategorien</li>
                  <li><strong>Status-Management:</strong> Verschiedene Link-Status</li>
                  <li><strong>Statistiken:</strong> Detaillierte Übersicht Ihrer Sammlung</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'validation' && (
              <div className="help-section">
                <h4>Link-Validierung</h4>
                <p>Der "Prüfen" Button überprüft alle Favoriten auf Erreichbarkeit:</p>
                <ul>
                  <li><strong>Aktiv (Grün):</strong> Link ist erreichbar und funktioniert</li>
                  <li><strong>Tot (Rot):</strong> Link ist nicht mehr erreichbar</li>
                  <li><strong>Localhost (Grau):</strong> Lokale Entwicklungslinks</li>
                  <li><strong>Timeout (Gelb):</strong> Link antwortet nicht rechtzeitig</li>
                  <li><strong>Ungeprüft (Weiß):</strong> Noch nicht validiert</li>
                </ul>
                <p>
                  Nach der Validierung können tote Links automatisch entfernt werden.
                  Localhost-Links werden dabei geschützt und nicht gelöscht.
                </p>
              </div>
            )}
            
            {activeSection === 'shortcuts' && (
              <div className="help-section">
                <h4>Tastatur-Shortcuts</h4>
                <ul>
                  <li><strong>Escape:</strong> Suchfeld leeren</li>
                  <li><strong>Ctrl + F:</strong> Fokus auf Suchfeld</li>
                  <li><strong>Ctrl + N:</strong> Neuen Favorit erstellen</li>
                  <li><strong>Ctrl + I:</strong> Import-Dialog öffnen</li>
                  <li><strong>Ctrl + E:</strong> Export-Dialog öffnen</li>
                  <li><strong>F5:</strong> Statistiken aktualisieren</li>
                </ul>
                
                <h4>Maus-Aktionen</h4>
                <ul>
                  <li><strong>Doppelklick:</strong> Favorit in neuem Tab öffnen</li>
                  <li><strong>Status-Badge klicken:</strong> Status ändern</li>
                  <li><strong>Spaltenränder ziehen:</strong> Spaltenbreite anpassen</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'tips' && (
              <div className="help-section">
                <h4>Tipps & Tricks</h4>
                <ul>
                  <li><strong>Regelmäßige Validierung:</strong> Überprüfen Sie Links monatlich</li>
                  <li><strong>Kategorisierung:</strong> Nutzen Sie aussagekräftige Namen</li>
                  <li><strong>Export-Backup:</strong> Erstellen Sie regelmäßige Backups</li>
                  <li><strong>Duplikat-Bereinigung:</strong> Entfernen Sie regelmäßig Duplikate</li>
                  <li><strong>Localhost-Markierung:</strong> Markieren Sie Entwicklungslinks</li>
                </ul>
                
                <h4>Best Practices</h4>
                <ul>
                  <li><strong>Konsistente Kategorien:</strong> Entwickeln Sie ein Schema</li>
                  <li><strong>Aussagekräftige Titel:</strong> Verwenden Sie klare Beschreibungen</li>
                  <li><strong>Hierarchien nutzen:</strong> Unterkategorien für bessere Organisation</li>
                  <li><strong>Regelmäßige Wartung:</strong> Monatliche Bereinigung empfohlen</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatisticsDialog = ({ isOpen, onClose, statistics, onRefresh }) => {
  if (!statistics) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="statistics-dialog" style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)'
      }}>
        <DialogHeader>
          <DialogTitle className="dialog-title" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="w-5 h-5 mr-2" />
            Statistiken
          </DialogTitle>
        </DialogHeader>
        
        <div className="statistics-content" style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          {/* Statistiken als vertikale Liste */}
          <div className="stats-vertical-list">
            <div className="stat-line">
              <span className="stat-icon-text">📊</span>
              <span className="stat-text">Gesamt Favoriten [{statistics.total_bookmarks}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">📁</span>
              <span className="stat-text">Kategorien [{statistics.total_categories}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">📈</span>
              <span className="stat-text">Status-Verteilung []</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">✅</span>
              <span className="stat-text">Aktiv [{statistics.active_links}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">❌</span>
              <span className="stat-text">Tot [{statistics.dead_links}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">🏠</span>
              <span className="stat-text">Localhost [{statistics.localhost_links || 0}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">🔄</span>
              <span className="stat-text">Duplikate [{statistics.duplicate_links || 0}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">⏱️</span>
              <span className="stat-text">Timeout [{statistics.timeout_links}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">❓</span>
              <span className="stat-text">Ungeprüft [{statistics.unchecked_links}]</span>
            </div>
          </div>
          
          <div className="dialog-actions">
            <Button
              onClick={onRefresh}
              className="stats-refresh-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
            <Button variant="outline"  
            onClick={onClose} 
            className="stats-close-btn" 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)'
            }}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CategorySidebar = ({ categories, activeCategory, activeSubcategory, onCategoryChange, bookmarkCounts, statistics }) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Alle']));
  const [showBrowserInfo, setShowBrowserInfo] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // Auflösungserkennung beim Programmstart und bei Änderungen
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleInfoClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const sidebarRect = event.target.closest('.sidebar').getBoundingClientRect();
    
    // Berechne Position basierend auf Auflösung
    let left = rect.right + 10; // Standardposition rechts vom Icon
    let top = rect.top;
    
    // Wenn nicht genug Platz rechts, positioniere innerhalb der Sidebar
    if (left + 200 > screenWidth) {
      left = sidebarRect.right - 220; // 200px Tooltip-Breite + 20px Margin
    }
    
    // Stelle sicher, dass Tooltip nicht über Bildschirmrand hinausgeht
    if (top + 60 > window.innerHeight) {
      top = window.innerHeight - 70;
    }
    
    setTooltipPosition({ top, left });
    setShowBrowserInfo(!showBrowserInfo);
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
      <div className="sidebar-resizer"></div>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h3 className="sidebar-title">Kategorien</h3>
          <div className="sidebar-info">
            <button
              className="info-link"
              onClick={handleInfoClick}
              title="Information über Kategorien"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            {showBrowserInfo && (
              <div 
                className="info-tooltip info-tooltip-positioned"
                style={{
                  position: 'fixed',
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  zIndex: 9999
                }}
              >
                Basierend auf Browser-Ordnern
                <button 
                  className="tooltip-close"
                  onClick={() => setShowBrowserInfo(false)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        
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

const BookmarkList = ({ bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus }) => {

  const getStatusBadge = (bookmark) => {
    const statusType = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
    
    const statusOptions = [
      { value: 'active', label: 'Aktiv', className: 'status-active' },
      { value: 'dead', label: 'Tot', className: 'status-dead' },
      { value: 'localhost', label: 'Localhost', className: 'status-localhost' },
      { value: 'duplicate', label: 'Duplikat', className: 'status-duplicate' },
      { value: 'unchecked', label: 'Ungeprüft', className: 'status-unchecked' }
    ];
    
    const currentStatus = statusOptions.find(s => s.value === statusType) || statusOptions[0];

    return (
      <div className="status-badge-dropdown" onClick={(e) => e.stopPropagation()}>
        <select 
          value={statusType || 'active'} 
          onChange={(e) => onToggleStatus(bookmark.id, e.target.value)}
          className={`status-badge ${currentStatus.className} status-select`}
        >
          {statusOptions.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              className={`status-option ${option.className}`}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const handleStatusToggle = (bookmark) => {
    // Alte Toggle-Logik: Dead -> Active
    onToggleStatus(bookmark.id, 'active');
  };

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
    <div className="bookmark-list">
      {bookmarks.map(bookmark => (
        <Card key={bookmark.id} className={`bookmark-card ${bookmark.is_dead_link ? 'dead-link' : 'active-link'}`}>
          <CardHeader className="bookmark-header">
            <div className="bookmark-title-row">
              <CardTitle className="bookmark-title">
                {bookmark.title}
              </CardTitle>
              <div className="bookmark-actions">
                {getStatusBadge(bookmark)}
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
                  onClick={() => onEditBookmark(bookmark)}
                  className="edit-btn"
                >
                  <Edit className="w-4 h-4" />
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

// Settings Dialog Component
const SettingsDialog = ({ isOpen, onClose, onExport, onCreateTestData }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoSync: true,
    notifications: true,
    linkTimeout: '10',
    autoValidate: false,
    duplicateHandling: 'ignore',
    showFavicons: true,
    itemsPerPage: '50',
    autoBackup: false
  });

  // Settings laden beim Dialog öffnen
  useEffect(() => {
    if (isOpen) {
      try {
        const savedSettings = localStorage.getItem('favorg-settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState('display');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Theme anwenden
      if (settings.theme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
      } else if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
      } else {
        // Auto - system preference
        document.documentElement.classList.remove('light-theme', 'dark-theme');
      }
      
      // Einstellungen in localStorage speichern
      localStorage.setItem('favorg-settings', JSON.stringify(settings));
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulation
      toast.success('Einstellungen erfolgreich gespeichert.');
      onClose();
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await onExport(format, null);
      toast.success(`${format.toUpperCase()}-Export erfolgreich heruntergeladen.`);
    } catch (error) {
      toast.error(`Export fehlgeschlagen: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateTestData = async () => {
    setIsExporting(true);
    try {
      await onCreateTestData();
      // Dialog schließen und neu laden
      onClose(); 
    } catch (error) {
      toast.error(`Testdaten-Erstellung fehlgeschlagen: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      theme: 'dark',
      autoSync: true,
      notifications: true,
      linkTimeout: '10',
      autoValidate: false,
      duplicateHandling: 'ignore',
      showFavicons: true,
      itemsPerPage: '50',
      autoBackup: false
    });
    toast.success('Einstellungen zurückgesetzt.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="settings-dialog-modern">
        <DialogHeader className="settings-header">
          <DialogTitle className="settings-title">
            <Settings className="w-5 h-5 mr-2" />
            System-Einstellungen
          </DialogTitle>
        </DialogHeader>
        
        <div className="settings-body">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="settings-tabs-modern">
            <TabsList className="settings-tab-list-modern">
              <TabsTrigger value="display" className="settings-tab-trigger">
                <span className="tab-icon">🎨</span>
                Darstellung
              </TabsTrigger>
              <TabsTrigger value="validation" className="settings-tab-trigger">
                <span className="tab-icon">🔍</span>
                Validierung
              </TabsTrigger>
              <TabsTrigger value="import-export" className="settings-tab-trigger">
                <span className="tab-icon">📁</span>
                Import/Export
              </TabsTrigger>
              <TabsTrigger value="advanced" className="settings-tab-trigger">
                <span className="tab-icon">⚙️</span>
                Erweitert
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="display" className="settings-tab-content-modern">
              <div className="settings-section">
                <h3 className="section-title">Erscheinungsbild</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Design-Theme</Label>
                    <span className="setting-description">Wählen Sie das Farbschema der Anwendung</span>
                  </div>
                  <Select value={settings.theme} onValueChange={(value) => setSettings({...settings, theme: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">🌙 Dunkel</SelectItem>
                      <SelectItem value="light">☀️ Hell</SelectItem>
                      <SelectItem value="auto">🔄 Automatisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Favicons anzeigen</Label>
                    <span className="setting-description">Website-Icons bei Lesezeichen anzeigen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.showFavicons}
                    onChange={(e) => setSettings({...settings, showFavicons: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Einträge pro Seite</Label>
                    <span className="setting-description">Anzahl der Lesezeichen pro Seite</span>
                  </div>
                  <Select value={settings.itemsPerPage} onValueChange={(value) => setSettings({...settings, itemsPerPage: value})}>
                    <SelectTrigger className="setting-select">
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
            
            <TabsContent value="validation" className="settings-tab-content-modern">
              <div className="settings-section">
                <h3 className="section-title">Link-Validierung</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Timeout (Sekunden)</Label>
                    <span className="setting-description">Wartezeit für Link-Überprüfung</span>
                  </div>
                  <Select value={settings.linkTimeout} onValueChange={(value) => setSettings({...settings, linkTimeout: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Sekunden</SelectItem>
                      <SelectItem value="10">10 Sekunden</SelectItem>
                      <SelectItem value="15">15 Sekunden</SelectItem>
                      <SelectItem value="30">30 Sekunden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Automatische Validierung</Label>
                    <span className="setting-description">Links automatisch beim Import prüfen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoValidate}
                    onChange={(e) => setSettings({...settings, autoValidate: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="import-export" className="settings-tab-content-modern">
              {/* Navigation Menu für Import/Export */}
              <div className="import-export-nav">
                <button 
                  onClick={() => document.getElementById('import-section')?.scrollIntoView({behavior: 'smooth'})}
                  className="nav-btn"
                >
                  📥 Import
                </button>
                <button 
                  onClick={() => document.getElementById('export-section')?.scrollIntoView({behavior: 'smooth'})}
                  className="nav-btn"
                >
                  📤 Export
                </button>
                <button 
                  onClick={() => document.getElementById('testdata-section')?.scrollIntoView({behavior: 'smooth'})}
                  className="nav-btn"
                >
                  🧪 Testdaten
                </button>
              </div>

              <div id="import-section" className="settings-section">
                <h3 className="section-title">Import-Einstellungen</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Duplikat-Behandlung</Label>
                    <span className="setting-description">Verhalten bei doppelten Einträgen</span>
                  </div>
                  <Select value={settings.duplicateHandling} onValueChange={(value) => setSettings({...settings, duplicateHandling: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">❌ Ignorieren</SelectItem>
                      <SelectItem value="replace">🔄 Ersetzen</SelectItem>
                      <SelectItem value="keep-both">📝 Beide behalten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="import-formats-info">
                  <h4>Unterstützte Browser-Formate:</h4>
                  <div className="browser-list">
                    <span className="browser-item">🦊 Firefox (JSON/HTML)</span>
                    <span className="browser-item">🌐 Chrome (HTML)</span>
                    <span className="browser-item">🔷 Edge (HTML)</span>
                    <span className="browser-item">🍎 Safari (HTML)</span>
                    <span className="browser-item">📄 CSV-Dateien</span>
                    <span className="browser-item">📋 XML-Dateien</span>
                  </div>
                </div>
              </div>

              <div id="export-section" className="settings-section">
                <h3 className="section-title">Export-Optionen</h3>
                <p className="section-description">
                  Exportieren Sie alle Ihre Favoriten in verschiedene Dateiformate.
                </p>
                
                <div className="export-buttons-modern">
                  <Button
                    onClick={() => handleExport('xml')}
                    disabled={isExporting}
                    className="export-btn-modern xml-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    XML exportieren
                  </Button>
                  
                  <Button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="export-btn-modern csv-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    CSV exportieren
                  </Button>
                </div>

                <div className="export-info-modern">
                  <div className="info-item-modern">
                    <FileText className="w-4 h-4 text-green-500" />
                    <div>
                      <strong>XML:</strong> Strukturierte Daten mit Metainformationen, ideal für Re-Import
                    </div>
                  </div>
                  <div className="info-item-modern">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    <div>
                      <strong>CSV:</strong> Tabellenformat, kompatibel mit Excel und anderen Tabellenkalculationen
                    </div>
                  </div>
                </div>
              </div>

              <div id="testdata-section" className="settings-section">
                <h3 className="section-title">Testdaten</h3>
                <p className="section-description">
                  Erstellen Sie Testdaten mit 50 Favoriten (inkl. Duplikate und tote Links) für Entwicklung und Tests.
                </p>
                
                <Button
                  onClick={handleCreateTestData}
                  disabled={isExporting}
                  className="test-data-btn-modern"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  50 Testdaten erstellen
                </Button>
                
                <div className="test-data-info">
                  <div className="info-item-modern">
                    <Database className="w-4 h-4 text-yellow-500" />
                    <div>
                      <strong>Testdaten:</strong> 50 Favoriten mit verschiedenen Kategorien, 10 Duplikate und 15 tote Links für umfassende Tests
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="settings-tab-content-modern">
              <div className="settings-section">
                <h3 className="section-title">Erweiterte Einstellungen</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Automatische Synchronisation</Label>
                    <span className="setting-description">Änderungen automatisch speichern</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoSync}
                    onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Benachrichtigungen</Label>
                    <span className="setting-description">Desktop-Benachrichtigungen aktivieren</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications}
                    onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Automatisches Backup</Label>
                    <span className="setting-description">Tägliche Sicherung erstellen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoBackup}
                    onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="settings-danger-zone">
                  <h4 className="danger-title">Gefahrenbereich</h4>
                  <p className="danger-description">
                    Diese Aktionen können nicht rückgängig gemacht werden.
                  </p>
                  <Button 
                    onClick={resetSettings}
                    variant="outline"
                    className="danger-btn"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Einstellungen zurücksetzen
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="settings-footer">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="save-btn-modern">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};



const MainContent = ({ searchQuery, onSearchChange, onClearSearch, statusFilter, onStatusFilterChange, bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onFileSelected, viewMode, onViewModeChange }) => {
  return (
    <main className="main-content">
      <div className="main-header">
        <input
          type="file"
          id="file-upload"
          accept=".html,.json,.xml,.csv,.jsonlz4"
          onChange={onFileSelected}
          style={{ display: 'none' }}
        />
      </div>
      
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Favoriten durchsuchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClearSearch();
                }
              }}
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
          
          <div className="status-filter-wrapper">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Nur aktive</SelectItem>
                <SelectItem value="dead">Nur tote</SelectItem>
                <SelectItem value="localhost">Nur localhost</SelectItem>
                <SelectItem value="duplicate">Nur Duplikate</SelectItem>
                <SelectItem value="unchecked">Nur ungeprüfte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="content-area">
        <div className="content-header">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn-compact ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => onViewModeChange('cards')}
              title="Karten-Ansicht"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={`view-toggle-btn-compact ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onViewModeChange('table')}
              title="Tabellen-Ansicht"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <TableView
            bookmarks={bookmarks}
            onDeleteBookmark={onDeleteBookmark}
            onEditBookmark={onEditBookmark}
            onToggleStatus={onToggleStatus}
          />
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onDeleteBookmark={onDeleteBookmark}
            onEditBookmark={onEditBookmark}
            onToggleStatus={onToggleStatus}
          />
        )}
      </div>
    </main>
  );
};

// Hauptkomponente
function App() {
  // Core State Management
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI State
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('favorg-view-mode') || 'cards';
  });

  // Dialog States
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  // Validation and Duplicates
  const [hasValidated, setHasValidated] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [hasDuplicatesMarked, setHasDuplicatesMarked] = useState(false);

  // Additional UI State
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [bookmarkCounts, setBookmarkCounts] = useState({ total: 0 });

  // Toast Management
  const [toasts, setToasts] = useState([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const favoritesService = new FavoritesService();
  const uiStateManager = new UIStateManager();

  // Custom Toast System
  const showCustomToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = toastIdCounter + 1;
    setToastIdCounter(id);
    
    const newToast = {
      id,
      message,
      type,
      duration
    };
    
    setToasts(prev => [...prev, newToast]);
  }, [toastIdCounter]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // View Mode Management
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem('favorg-view-mode', mode);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Escape key to clear search
      if (event.key === 'Escape') {
        setSearchQuery('');
        return;
      }
      
      // Ctrl+F to focus search
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
        return;
      }
      
      // Ctrl+N to create new bookmark
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        handleCreateBookmark();
        return;
      }
      
      // F5 to refresh statistics
      if (event.key === 'F5') {
        event.preventDefault();
        loadStatistics();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load functions definiert vor useEffect
  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await favoritesService.getAllBookmarks();
      setBookmarks(data || []);
      setBookmarkCounts({ total: (data || []).length });
      
      // Duplikate automatisch zählen
      const duplicates = (data || []).filter(bookmark => bookmark.status_type === 'duplicate');
      setDuplicateCount(duplicates.length);
      if (duplicates.length > 0) {
        setHasDuplicatesMarked(true);
      }
    } catch (error) {
      console.warn('No bookmarks found or error loading bookmarks:', error);
      setBookmarks([]);
      setBookmarkCounts({ total: 0 });
      // Keine Toast-Fehlermeldung bei leeren Daten
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter-Logik in Hauptkomponente
  useEffect(() => {
    let filtered = bookmarks;

    // Kategorie-Filter
    if (activeCategory && activeCategory !== 'Alle' && activeCategory !== 'all') {
      filtered = filtered.filter(bookmark => 
        bookmark.category === activeCategory &&
        (!activeSubcategory || bookmark.subcategory === activeSubcategory)
      );
    }

    // Status-Filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bookmark => {
        const statusType = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
        
        switch (statusFilter) {
          case 'active': return statusType === 'active';
          case 'dead': return statusType === 'dead';
          case 'localhost': return statusType === 'localhost';
          case 'duplicate': return statusType === 'duplicate';
          case 'unchecked': return !bookmark.last_checked;
          default: return true;
        }
      });
    }

    // Such-Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.category.toLowerCase().includes(query) ||
        (bookmark.subcategory && bookmark.subcategory.toLowerCase().includes(query))
      );
    }

    // Duplikate nach URL sortieren
    if (statusFilter === 'duplicate') {
      filtered = filtered.sort((a, b) => a.url.localeCompare(b.url));
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, activeCategory, activeSubcategory, statusFilter, searchQuery]);

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
    }
  }, []);

  // Initial Load und Focus
  useEffect(() => {
    loadBookmarks();
    loadCategories();
    loadStatistics();
    
    // Suchfeld beim Seitenstart fokussieren
    const timer = setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder="Favoriten durchsuchen..."]');
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [loadBookmarks, loadCategories, loadStatistics]);



  const handleCreateTestData = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.createTestData();
      toast.success(`Testdaten erfolgreich erstellt: ${result.created_count} Favoriten mit ${result.duplicates} Duplikaten und ${result.dead_links} toten Links.`);
      // Daten neu laden
      await loadBookmarks();
      await loadCategories(); 
      await loadStatistics();
    } catch (error) {
      console.error('Testdaten creation error:', error);
      toast.error('Testdaten-Erstellung fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format, category) => {
    try {
      setIsLoading(true);
      const result = await favoritesService.exportBookmarks(format, category);
      toast.success(result.message);
    } catch (error) {
      toast.error('Export fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateLinks = async () => {
    try {
      setIsLoading(true);
      
      if (!hasValidated) {
        // Erste Klick: Validierung durchführen
        const result = await favoritesService.validateLinks();
        showCustomToast(`Validierung abgeschlossen: ${result.dead_links_found} tote Links gefunden von ${result.total_checked} geprüften Links.`, 'success');
        setHasValidated(true);
        await loadBookmarks();
        await loadStatistics();
      } else {
        // Zweiter Klick: Tote Links entfernen
        const result = await favoritesService.removeDeadLinks();
        showCustomToast(`${result.removed_count} tote Links wurden entfernt.`, 'success');
        setHasValidated(false);
        await loadBookmarks();
        await loadCategories();
        await loadStatistics();
      }
    } catch (error) {
      showCustomToast('Aktion fehlgeschlagen: ' + error.message, 'error');
      setHasValidated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      if (!hasDuplicatesMarked) {
        // First click: Find and mark duplicates
        const result = await favoritesService.findDuplicates();
        setDuplicateCount(result.marked_count || 0);
        setHasDuplicatesMarked(true);
        showCustomToast(`${result.duplicate_groups} Duplikat-Gruppen gefunden. ${result.marked_count} als Duplikat markiert.`, 'success');
        await loadBookmarks();
        await loadStatistics();
      } else {
        // Second click: Delete marked duplicates
        const result = await favoritesService.deleteDuplicates();
        showCustomToast(`${result.removed_count} Duplikate wurden entfernt.`, 'success');
        setDuplicateCount(0);
        setHasDuplicatesMarked(false);
        await loadBookmarks();
        await loadCategories();
        await loadStatistics();
      }
    } catch (error) {
      showCustomToast('Duplikat-Operation fehlgeschlagen: ' + error.message, 'error');
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

  const handleToggleStatus = async (bookmarkId, statusType) => {
    try {
      await favoritesService.updateBookmarkStatus(bookmarkId, statusType);
      const statusLabel = {
        'active': 'Aktiv',
        'dead': 'Tot', 
        'localhost': 'Localhost',
        'duplicate': 'Duplikat'
      }[statusType] || statusType;
      toast.success(`Link-Status auf "${statusLabel}" gesetzt.`);
      
      // Kleine Verzögerung und dann Daten neu laden
      setTimeout(async () => {
        await loadBookmarks();
        await loadStatistics();
      }, 500);
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error('Status-Update fehlgeschlagen: ' + error.message);
    }
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setShowBookmarkDialog(true);
  };

  const handleCreateBookmark = () => {
    setEditingBookmark(null);
    setShowBookmarkDialog(true);
  };

  const handleSaveBookmark = async (formData) => {
    try {
      const bookmarkData = {
        title: formData.title,
        url: formData.url,
        category: formData.category,
        subcategory: (formData.subcategory && formData.subcategory !== "__none__") ? formData.subcategory : null,
        description: formData.description || null
      };
      
      if (editingBookmark) {
        await favoritesService.updateBookmark(editingBookmark.id, bookmarkData);
        toast.success('Favorit aktualisiert.');
      } else {
        await favoritesService.createBookmark(bookmarkData);
        toast.success('Favorit erstellt.');
      }
      
      setShowBookmarkDialog(false);
      setEditingBookmark(null);
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Speichern fehlgeschlagen: ' + error.message);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFileUpload = async () => {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await favoritesService.importBookmarks(file);
      showCustomToast(
        `Import erfolgreich: ${result.imported_count} Favoriten importiert`,
        'success'
      );
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      showCustomToast('Import fehlgeschlagen: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="app">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
        onStatsToggle={() => setShowStatistics(true)}
        onCreateBookmarkClick={handleCreateBookmark}
        onFileUploadClick={handleFileUpload}
        onValidateClick={handleValidateLinks}
        onRemoveDuplicatesClick={handleRemoveDuplicates}
        onDeleteAllClick={handleDeleteAll}
        deadLinksCount={statistics?.dead_links || 0}
        hasValidated={hasValidated}
        totalBookmarks={statistics?.total_bookmarks || 0}
        duplicateCount={duplicateCount}
        hasDuplicatesMarked={hasDuplicatesMarked}
        filteredCount={filteredBookmarks.length}
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
          onEditBookmark={handleEditBookmark}
          onToggleStatus={handleToggleStatus}
          onFileSelected={handleFileSelected}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      <footer className="app-footer">
        <p>&copy; 2025 Jörg Renelt – Version 1.0.1 – Alle Rechte vorbehalten.</p>
      </footer>

      {/* Custom Draggable Toasts */}
      {toasts.map(toast => (
        <DraggableToast
          key={toast.id}
          id={toast.id.toString()}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <BookmarkDialog
        isOpen={showBookmarkDialog}
        onClose={() => {
          setShowBookmarkDialog(false);
          setEditingBookmark(null);
        }}
        bookmark={editingBookmark}
        onSave={handleSaveBookmark}
        categories={categories}
      />

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExport={handleExport}
        onCreateTestData={handleCreateTestData}
      />

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <StatisticsDialog
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        statistics={statistics}
        onRefresh={loadStatistics}
      />

      {/* Sonner Toaster - kept as fallback */}
      <Toaster 
        position="top-center" 
        offset="140px"
        closeButton={true}
        duration={4000}
        visibleToasts={3}
      />
    </div>
  );
}

export default App;