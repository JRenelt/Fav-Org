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
  Database
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

const Header = ({ onSettingsClick, onHelpClick, onStatsToggle, onCreateBookmarkClick, onFileUploadClick, onValidateClick, onRemoveDuplicatesClick, onDeleteAllClick, deadLinksCount, hasValidated, totalBookmarks, duplicateCount, hasDuplicatesMarked }) => {
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
              <span className="bookmark-count">[{totalBookmarks}]</span>
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
    subcategory: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        category: bookmark.category || 'Uncategorized',
        subcategory: bookmark.subcategory || ''
      });
    } else {
      setFormData({
        title: '',
        url: '',
        category: 'Uncategorized',
        subcategory: ''
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
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData({...formData, category: value, subcategory: ''})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Uncategorized">Nicht zugeordnet</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {subcategoriesForCategory.length > 0 && (
            <div className="form-group">
              <Label htmlFor="subcategory">Unterkategorie</Label>
              <Select 
                value={formData.subcategory} 
                onValueChange={(value) => setFormData({...formData, subcategory: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unterkategorie wählen (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Keine Unterkategorie</SelectItem>
                  {subcategoriesForCategory.map(subcat => (
                    <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

const StatisticsPanel = ({ statistics, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!statistics) return null;

  return (
    <div className="statistics-panel">
      <div 
        className="stats-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="stats-title">
          <BarChart3 className="w-4 h-4 mr-2" />
          Statistiken
        </h3>
        <button className="toggle-btn">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      
      {isExpanded && (
        <>
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
            onClick={onRefresh}
            className="refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
        </>
      )}
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

const BookmarkList = ({ bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, searchQuery, statusFilter }) => {
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);

  useEffect(() => {
    let filtered = bookmarks;

    // Status-Filter anwenden
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bookmark => {
        const statusType = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
        
        switch (statusFilter) {
          case 'active':
            return statusType === 'active';
          case 'dead':
            return statusType === 'dead';
          case 'localhost':
            return statusType === 'localhost';
          case 'duplicate':
            return statusType === 'duplicate';
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

    // Duplikate nach URL sortieren für besseren Vergleich
    if (statusFilter === 'duplicate') {
      filtered = filtered.sort((a, b) => a.url.localeCompare(b.url));
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, searchQuery, statusFilter]);

  const getStatusBadge = (bookmark) => {
    const statusType = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
    
    const handleStatusClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Rotations-Toggle-Logik: Active → Dead → Localhost → Unchecked → Active
      let nextStatus;
      switch (statusType) {
        case 'active': nextStatus = 'dead'; break;
        case 'dead': nextStatus = 'localhost'; break;
        case 'localhost': nextStatus = 'unchecked'; break;
        case 'unchecked': nextStatus = 'active'; break;
        default: nextStatus = 'active'; break;
      }
      
      onToggleStatus(bookmark.id, nextStatus);
    };

    switch (statusType) {
      case 'active':
        return (
          <span 
            className="status-badge status-active clickable" 
            onClick={handleStatusClick}
            title="Klicken um als tot zu markieren"
          >
            Aktiv
          </span>
        );
      case 'dead':
        return (
          <span 
            className="status-badge status-dead clickable" 
            onClick={handleStatusClick}
            title="Klicken um als localhost zu markieren"
          >
            Tot
          </span>
        );
      case 'localhost':
        return (
          <span 
            className="status-badge status-localhost clickable" 
            onClick={handleStatusClick}
            title="Klicken um als ungeprüft zu markieren"
          >
            Localhost
          </span>
        );
      case 'duplicate':
        return <span className="status-badge status-duplicate">Duplikat</span>;
      default:
        return (
          <span 
            className="status-badge status-unchecked clickable" 
            onClick={handleStatusClick}
            title="Klicken um als aktiv zu markieren"
          >
            Ungeprüft
          </span>
        );
    }
  };

  const handleStatusToggle = (bookmark) => {
    // Alte Toggle-Logik: Dead -> Active
    onToggleStatus(bookmark.id, 'active');
  };

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

const HelpDialog = ({ isOpen, onClose }) => {
  const [activeHelpTab, setActiveHelpTab] = useState('basics');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="help-dialog">
        <DialogHeader>
          <DialogTitle>
            <HelpCircle className="w-5 h-5 mr-2" />
            Hilfe & Anleitung - Favorites Manager
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeHelpTab} onValueChange={setActiveHelpTab} className="help-tabs">
          <TabsList className="help-tab-list">
            <TabsTrigger value="about">Über</TabsTrigger>
            <TabsTrigger value="basics">Grundlagen</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="help-tab-content">
            <div className="help-content">
              <div className="help-section">
                <h4>FavOrg</h4>
                <p><strong>Version:</strong> V1.0.1</p>
                <p><strong>Entwickelt von:</strong> ID2 - Jörg Renelt</p>
                <p><strong>Ort:</strong> Hamburg, Deutschland</p>
                <p><strong>Jahr:</strong> 2025</p>
              </div>
              
              <div className="help-section">
                <h4>Programmbeschreibung</h4>
                <p>
                  <strong>FavOrg</strong> ist eine moderne SaaS-Anwendung zur intelligenten Verwaltung 
                  von Browser-Favoriten. Die Anwendung ermöglicht es, Lesezeichen aus verschiedenen Browsern zu 
                  importieren, zu organisieren und automatisch zu validieren.
                </p>
                
                <p><strong>Hauptfunktionen:</strong></p>
                <ul>
                  <li><strong>Multi-Browser Import:</strong> Chrome, Firefox, Edge, Safari (HTML/JSON)</li>
                  <li><strong>50 Testdaten:</strong> Umfassende Test-Suite mit Duplikaten und toten Links</li>
                  <li><strong>Intelligente Kategorisierung:</strong> Automatische Organisation in Kategorien und Unterkategorien</li>
                  <li><strong>Link-Validierung:</strong> Automatische Erkennung von toten Links mit manueller Statuskorrektur</li>
                  <li><strong>Duplikat-Erkennung:</strong> Intelligente URL-Normalisierung und Bereinigung</li>
                  <li><strong>Export-Funktionen:</strong> XML und CSV Export mit Filteroptionen</li>
                  <li><strong>Umfassende Statistiken:</strong> Detaillierte Analyse Ihrer Lesezeichen-Sammlung</li>
                  <li><strong>Manuelle Status-Kontrolle:</strong> Tote Links können manuell aktiviert werden</li>
                </ul>
              </div>

              <div className="help-section">
                <h4>Neue Features in V1.0.1</h4>
                <ul>
                  <li><strong>Erweiteter JSON-Import:</strong> Firefox, Chrome und Safari JSON-Formate unterstützt</li>
                  <li><strong>Verbesserte Testdaten:</strong> 50 Einträge mit realistischen Szenarien</li>
                  <li><strong>Manuelle Link-Status-Korrektur:</strong> Localhost und lokale Links können aktiviert werden</li>
                  <li><strong>Detaillierte Import-Statistiken:</strong> Genaue Angaben über Import-Ergebnisse</li>
                  <li><strong>Verbesserte Benutzeroberfläche:</strong> Größere Dialoge und bessere Navigation</li>
                </ul>
              </div>

              <div className="help-section">
                <h4>Technologie</h4>
                <p>
                  Entwickelt mit moderner Web-Technologie für beste Performance und Benutzerfreundlichkeit:
                </p>
                <ul>
                  <li><strong>Frontend:</strong> React mit modernem UI-Design</li>
                  <li><strong>Backend:</strong> FastAPI mit Python</li>
                  <li><strong>Datenbank:</strong> MongoDB für flexible Datenstrukturen</li>
                  <li><strong>Validierung:</strong> Asynchrone Link-Prüfung für beste Performance</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="basics" className="help-tab-content">
            <div className="help-content">
              <div className="help-section">
                <h4>Favoriten verwalten</h4>
                <ul>
                  <li><strong>Neu anlegen:</strong> "Neu"-Button in der oberen Navigation</li>
                  <li><strong>Bearbeiten:</strong> Stift-Symbol bei jedem Favorit</li>
                  <li><strong>Löschen:</strong> Papierkorb-Symbol bei jedem Favorit</li>
                  <li><strong>Verschieben:</strong> Favoriten über Kategorien-Dropdown verschieben</li>
                </ul>
              </div>
              
              <div className="help-section">
                <h4>Navigation</h4>
                <ul>
                  <li><strong>Kategorien:</strong> Linke Sidebar zeigt alle Kategorien</li>
                  <li><strong>Suche:</strong> Durchsuchen Sie Titel, URLs und Kategorien</li>
                  <li><strong>Filter:</strong> Status-Filter für aktive/tote/ungeprüfte Links</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="buttons" className="help-tab-content">
            <div className="help-content">
              <div className="help-section">
                <h4>Obere Navigation</h4>
                <ul>
                  <li><strong>Neu:</strong> Erstellt einen neuen Favoriten</li>
                  <li><strong>Datei wählen:</strong> Importiert Browser-Favoriten aus HTML/JSON</li>
                  <li><strong>Prüfen:</strong> Testet alle Links auf Erreichbarkeit</li>
                  <li><strong>Duplikate:</strong> Findet und entfernt doppelte Einträge</li>
                </ul>
              </div>
              
              <div className="help-section">
                <h4>Rechte Navigation</h4>
                <ul>
                  <li><strong>Hilfe (?):</strong> Öffnet diese Hilfe</li>
                  <li><strong>Einstellungen (⚙):</strong> System-Einstellungen und Export</li>
                  <li><strong>X (rot):</strong> Löscht ALLE Favoriten (mit Sicherheitsabfrage)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="help-tab-content">
            <div className="help-content">
              <div className="help-section">
                <h4>Status-Bedeutungen</h4>
                <ul>
                  <li><strong>Aktiv (Grün):</strong> Link wurde geprüft und ist erreichbar</li>
                  <li><strong>Tot (Rot):</strong> Link ist nicht erreichbar oder gibt Fehler zurück</li>
                  <li><strong>Ungeprüft (Weiß):</strong> Link wurde noch nicht auf Erreichbarkeit geprüft</li>
                </ul>
              </div>

              <div className="help-section">
                <h4>Manuelle Status-Korrektur</h4>
                <ul>
                  <li><strong>Status umschalten:</strong> Klicken Sie direkt auf den Status-Badge (Tot/Aktiv)</li>
                  <li><strong>Localhost-Links:</strong> Können manuell von "Tot" auf "Aktiv" gesetzt werden</li>
                  <li><strong>Temporäre Ausfälle:</strong> Links die vorübergehend nicht erreichbar waren</li>
                  <li><strong>Interne Links:</strong> Firmen-interne URLs die nicht öffentlich erreichbar sind</li>
                </ul>
              </div>

              <div className="help-section">
                <h4>Duplikat-Erkennungsregeln</h4>
                <p>Das System erkennt Duplikate anhand folgender Kriterien:</p>
                <ul>
                  <li><strong>Identische URLs:</strong> Exakte URL-Übereinstimmung</li>
                  <li><strong>URL-Normalisierung:</strong> 
                    - http:// und https:// werden als gleich behandelt
                    - www. Präfixe werden ignoriert
                    - Trailing Slashes (/) werden entfernt
                    - Query-Parameter werden normalisiert
                  </li>
                  <li><strong>Beispiele für erkannte Duplikate:</strong>
                    - https://example.com und http://example.com
                    - www.example.com und example.com
                    - example.com/ und example.com
                    - example.com?param=1 und example.com?param=1&
                  </li>
                  <li><strong>Titel-Unterschiede:</strong> Verschiedene Titel bei gleicher URL werden als Duplikat erkannt</li>
                  <li><strong>Kategorie-Unterschiede:</strong> Gleiche URL in verschiedenen Kategorien wird als Duplikat erkannt</li>
                </ul>
              </div>
              
              <div className="help-section">
                <h4>Nach der Link-Prüfung</h4>
                <ul>
                  <li><strong>Automatische Aktualisierung:</strong> Der "Prüfen"-Button zeigt dann "Prüfen [Anzahl]"</li>
                  <li><strong>Bereinigung:</strong> Klicken Sie erneut, um alle toten Links zu entfernen</li>
                  <li><strong>Statistiken:</strong> Sidebar zeigt aktuelle Zahlen zu Link-Status</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="help-tab-content">
            <div className="help-content">
              <div className="help-section">
                <h4>Browser-Favoriten exportieren</h4>
                <ul>
                  <li><strong>Chrome:</strong> Einstellungen → Lesezeichen → Exportieren</li>
                  <li><strong>Firefox:</strong> Lesezeichen → Alle Lesezeichen → Exportieren</li>
                  <li><strong>Edge:</strong> Favoriten → Exportieren</li>
                  <li><strong>Safari:</strong> Datei → Lesezeichen exportieren</li>
                </ul>
              </div>
              
              <div className="help-section">
                <h4>Export aus Favorites Manager</h4>
                <ul>
                  <li><strong>System-Einstellungen:</strong> Öffnen Sie die Einstellungen (⚙-Symbol)</li>
                  <li><strong>Import/Export Tab:</strong> Wechseln Sie zum Import/Export-Bereich</li>
                  <li><strong>XML Export:</strong> Strukturierte Daten mit Metainformationen</li>
                  <li><strong>CSV Export:</strong> Tabellenformat, Excel-kompatibel</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const MainContent = ({ searchQuery, onSearchChange, onClearSearch, statusFilter, onStatusFilterChange, bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onFileSelected }) => {
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
        <BookmarkList
          bookmarks={bookmarks}
          onDeleteBookmark={onDeleteBookmark}
          onEditBookmark={onEditBookmark}
          onToggleStatus={onToggleStatus}
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
  const [showStatistics, setShowStatistics] = useState(true);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [bookmarkCounts, setBookmarkCounts] = useState({ total: 0 });
  const [hasValidated, setHasValidated] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [hasDuplicatesMarked, setHasDuplicatesMarked] = useState(false);

  // Services
  const favoritesService = new FavoritesService();
  const uiStateManager = new UIStateManager();

  // Load functions definiert vor useEffect
  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await favoritesService.getAllBookmarks();
      setBookmarks(data || []);
      setBookmarkCounts({ total: (data || []).length });
    } catch (error) {
      console.warn('No bookmarks found or error loading bookmarks:', error);
      setBookmarks([]);
      setBookmarkCounts({ total: 0 });
      // Keine Toast-Fehlermeldung bei leeren Daten
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
        toast.success(`Validierung abgeschlossen: ${result.dead_links_found} tote Links gefunden von ${result.total_checked} geprüften Links.`);
        setHasValidated(true);
        await loadBookmarks();
        await loadStatistics();
      } else {
        // Zweiter Klick: Tote Links entfernen
        const result = await favoritesService.removeDeadLinks();
        toast.success(`${result.removed_count} tote Links wurden entfernt.`);
        setHasValidated(false);
        await loadBookmarks();
        await loadCategories();
        await loadStatistics();
      }
    } catch (error) {
      toast.error('Aktion fehlgeschlagen: ' + error.message);
      setHasValidated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      setIsLoading(true);
      
      if (!hasDuplicatesMarked) {
        // Erster Click: Duplikate finden und markieren
        const result = await favoritesService.findDuplicates();
        setDuplicateCount(result.marked_count);
        setHasDuplicatesMarked(true);
        toast.success(`${result.marked_count} Duplikate gefunden und markiert.`);
        await loadBookmarks();
        await loadStatistics();
      } else {
        // Zweiter Click: Markierte Duplikate löschen
        const result = await favoritesService.deleteDuplicates();
        toast.success(`${result.deleted_count} Duplikate wurden gelöscht.`);
        setHasDuplicatesMarked(false);
        setDuplicateCount(0);
        await loadBookmarks();
        await loadCategories();
        await loadStatistics();
      }
    } catch (error) {
      toast.error('Duplikat-Aktion fehlgeschlagen: ' + error.message);
      setHasDuplicatesMarked(false);
      setDuplicateCount(0);
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

    try {
      setIsLoading(true);
      console.log('Importing file:', file.name, file.type, file.size);
      
      const result = await favoritesService.importBookmarks(file);
      console.log('Import result:', result);
      
      if (result.imported_count === 0) {
        toast.warning(`Import abgeschlossen, aber keine Favoriten gefunden. ${result.details || ''}`);
      } else {
        toast.success(`Import erfolgreich: ${result.imported_count} Favoriten importiert` + 
                     (result.total_parsed ? ` (${result.total_parsed} geparst, ${result.after_deduplication} nach Duplikat-Bereinigung)` : ''));
      }
      
      // Daten neu laden
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
    
    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="app">
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
        onStatsToggle={() => setShowStatistics(!showStatistics)}
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
        
        {showStatistics && (
          <StatisticsPanel 
            statistics={statistics} 
            onRefresh={loadStatistics}
          />
        )}

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
        />
      </div>

      <footer className="app-footer">
        <p>&copy; 2025 Jörg Renelt – Version 1.0.1 – Alle Rechte vorbehalten.</p>
      </footer>

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