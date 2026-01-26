import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  Tag,
  Layers
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import apiClient from '../../lib/api';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

interface Subcategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  subcategories: Subcategory[];
  subcategory_count?: number;
  bot_count?: number;
}

const EXCLUDED_LUCIDE_EXPORTS = new Set([
  'createLucideIcon',
  'Icon',
  'icons'
]);

const isLucideComponentExport = (value: unknown) => {
  if (typeof value === 'function') return true;
  if (typeof value === 'object' && value !== null && '$$typeof' in (value as Record<string, unknown>)) {
    return true;
  }
  return false;
};

const formatIconLabel = (iconName: string) =>
  iconName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

const ALL_LUCIDE_ICON_OPTIONS = Object.entries(LucideIcons)
  .filter(([key, value]) => {
    if (EXCLUDED_LUCIDE_EXPORTS.has(key)) return false;
    if (!/^[A-Z]/.test(key)) return false;
    return isLucideComponentExport(value);
  })
  .map(([key, value]) => ({
    key,
    label: formatIconLabel(key),
    Icon: value as LucideIcon
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = ALL_LUCIDE_ICON_OPTIONS.reduce(
  (acc, option) => {
    acc[option.key] = option.Icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

const INITIAL_ICON_RENDER_COUNT = 96;
const ICON_RENDER_STEP = 96;

const normalizeCategoryIcon = (icon?: string) => {
  if (!icon) return 'FolderTree';
  if (CATEGORY_ICON_MAP[icon]) return icon;
  return 'FolderTree';
};

const renderCategoryIcon = (iconKey?: string, className = 'w-8 h-8 text-botai-dark') => {
  const normalizedIcon = normalizeCategoryIcon(iconKey);
  const IconComponent = CATEGORY_ICON_MAP[normalizedIcon] || FolderTree;
  return <IconComponent className={className} />;
};

interface IconOptionButtonProps {
  option: { key: string; label: string; Icon: LucideIcon };
  isActive: boolean;
  onSelect: (iconKey: string) => void;
}

const IconOptionButton = React.memo(({ option, isActive, onSelect }: IconOptionButtonProps) => {
  const IconComponent = option.Icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.key)}
      title={option.label}
      className={`relative rounded-lg px-3 py-2 border text-left transition-all ${
        isActive
          ? 'border-botai-purple bg-white shadow-sm'
          : 'border-gray-200 bg-white hover:border-botai-purple/40'
      }`}
    >
      <div className="flex items-center justify-center">
        <IconComponent className="w-5 h-5 text-botai-dark" />
      </div>
      {isActive && <Check className="w-3 h-3 text-botai-purple absolute top-1.5 right-1.5" />}
    </button>
  );
});

IconOptionButton.displayName = 'IconOptionButton';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<Subcategory & { category_id: number }> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; type: 'category' | 'subcategory' | null; id: number | null; name: string }>({ show: false, type: null, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [visibleIconCount, setVisibleIconCount] = useState(INITIAL_ICON_RENDER_COUNT);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminCategories();
      if (response.success && response.data) {
        const backendResponse = response.data as any;
        const data = backendResponse.data || backendResponse;
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCreateCategory = () => {
    setEditingCategory({ name: '', description: '', icon: 'FolderTree' });
    setIconSearchQuery('');
    setVisibleIconCount(INITIAL_ICON_RENDER_COUNT);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory({ ...category, icon: normalizeCategoryIcon(category.icon) });
    setIconSearchQuery('');
    setVisibleIconCount(INITIAL_ICON_RENDER_COUNT);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editingCategory.name) {
      alert('Category name is required');
      return;
    }

    try {
      const categoryData = {
        name: editingCategory.name,
        description: editingCategory.description || '',
        icon: normalizeCategoryIcon(editingCategory.icon)
      };

      let response;
      if (editingCategory.id) {
        response = await apiClient.updateAdminCategory(editingCategory.id, categoryData);
      } else {
        response = await apiClient.createAdminCategory(categoryData);
      }

      if (response.success) {
        fetchCategories();
        setShowCategoryModal(false);
        setEditingCategory(null);
      } else {
        alert(response.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category');
    }
  };

  const handleDeleteCategoryClick = (categoryId: number, categoryName: string) => {
    setDeleteConfirm({ show: true, type: 'category', id: categoryId, name: categoryName });
  };

  const handleDeleteSubcategoryClick = (subcategoryId: number, subcategoryName: string) => {
    setDeleteConfirm({ show: true, type: 'subcategory', id: subcategoryId, name: subcategoryName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    setIsDeleting(true);
    try {
      let response;
      if (deleteConfirm.type === 'category') {
        response = await apiClient.deleteAdminCategory(deleteConfirm.id);
      } else {
        response = await apiClient.deleteAdminSubcategory(deleteConfirm.id);
      }

      if (response.success) {
        fetchCategories();
        setDeleteConfirm({ show: false, type: null, id: null, name: '' });
      } else {
        alert(response.error || `Failed to delete ${deleteConfirm.type}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${deleteConfirm.type}:`, error);
      alert(`Failed to delete ${deleteConfirm.type}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSubcategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory({ category_id: categoryId, name: '', description: '' });
    setShowSubcategoryModal(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory, categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setEditingSubcategory({ ...subcategory, category_id: categoryId });
    setShowSubcategoryModal(true);
  };

  const handleSaveSubcategory = async () => {
    if (!editingSubcategory || !editingSubcategory.name || !editingSubcategory.category_id) {
      alert('Subcategory name and category are required');
      return;
    }

    try {
      const subcategoryData = {
        category_id: editingSubcategory.category_id,
        name: editingSubcategory.name,
        description: editingSubcategory.description || ''
      };

      let response;
      if (editingSubcategory.id) {
        response = await apiClient.updateAdminSubcategory(editingSubcategory.id, subcategoryData);
      } else {
        response = await apiClient.createAdminSubcategory(subcategoryData);
      }

      if (response.success) {
        fetchCategories();
        setShowSubcategoryModal(false);
        setEditingSubcategory(null);
        setSelectedCategoryId(null);
      } else {
        alert(response.error || 'Failed to save subcategory');
      }
    } catch (error) {
      console.error('Failed to save subcategory:', error);
      alert('Failed to save subcategory');
    }
  };

  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0);
  const totalBots = categories.reduce((sum, cat) => sum + (cat.bot_count || 0), 0);
  const selectedIconKey = normalizeCategoryIcon(editingCategory?.icon);
  const filteredCategoryIcons = useMemo(
    () =>
      ALL_LUCIDE_ICON_OPTIONS.filter((option) =>
        option.label.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
        option.key.toLowerCase().includes(iconSearchQuery.toLowerCase())
      ),
    [iconSearchQuery]
  );
  const displayedCategoryIcons = useMemo(
    () => filteredCategoryIcons.slice(0, visibleIconCount),
    [filteredCategoryIcons, visibleIconCount]
  );
  const hasMoreIcons = visibleIconCount < filteredCategoryIcons.length;

  useEffect(() => {
    setVisibleIconCount(INITIAL_ICON_RENDER_COUNT);
  }, [iconSearchQuery]);

  const handleIconSelect = useCallback((iconKey: string) => {
    setEditingCategory((prev) => (prev ? { ...prev, icon: iconKey } : prev));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-space-grotesk font-bold text-4xl text-botai-dark mb-2">
            Bot Categories & Subcategories
          </h1>
          <p className="font-noto-sans text-botai-text">
            Manage bot categories and their subcategories
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-noto-sans text-botai-text text-sm mb-1">Total Categories</p>
                <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{totalCategories}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-botai-purple to-botai-dark flex items-center justify-center">
                <FolderTree className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-noto-sans text-botai-text text-sm mb-1">Total Subcategories</p>
                <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{totalSubcategories}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-botai-blue to-botai-purple flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-noto-sans text-botai-text text-sm mb-1">Total Bots</p>
                <p className="font-space-grotesk font-bold text-3xl text-botai-dark">{totalBots}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-botai-green to-botai-blue flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={handleCreateCategory}
            className="bg-botai-dark text-white px-6 py-3 rounded-xl font-noto-sans font-semibold hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Category
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-botai-purple border-t-transparent"></div>
              <p className="font-noto-sans text-botai-text mt-4">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="font-noto-sans text-botai-text">No categories found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map((category) => (
                <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="mt-1 text-botai-text hover:text-botai-dark transition-colors"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            {renderCategoryIcon(category.icon, 'w-6 h-6 text-botai-dark')}
                          </span>
                          <div>
                            <h3 className="font-space-grotesk font-bold text-xl text-botai-dark">
                              {category.name}
                            </h3>
                            <p className="font-noto-sans text-sm text-botai-text">
                              {category.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-noto-sans text-botai-text mt-2">
                          <span>{category.subcategories?.length || 0} subcategories</span>
                          <span>•</span>
                          <span>{category.bot_count || 0} bots</span>
                        </div>

                        {/* Subcategories */}
                        {expandedCategories.has(category.id) && (
                          <div className="mt-4 ml-8 space-y-2">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-noto-sans font-semibold text-botai-dark">
                                Subcategories
                              </h4>
                              <button
                                onClick={() => handleCreateSubcategory(category.id)}
                                className="text-botai-purple hover:text-botai-dark transition-colors flex items-center gap-1 text-sm font-semibold"
                              >
                                <Plus className="w-4 h-4" />
                                Add Subcategory
                              </button>
                            </div>

                            {category.subcategories && category.subcategories.length > 0 ? (
                              <div className="space-y-2">
                                {category.subcategories.map((subcategory) => (
                                  <div
                                    key={subcategory.id}
                                    className="bg-gray-50 rounded-lg p-3 flex items-center justify-between group hover:bg-gray-100 transition-colors"
                                  >
                                    <div>
                                      <h5 className="font-noto-sans font-semibold text-botai-dark">
                                        {subcategory.name}
                                      </h5>
                                      <p className="font-noto-sans text-xs text-botai-text">
                                        {subcategory.description}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleEditSubcategory(subcategory, category.id)}
                                        className="text-botai-blue hover:text-botai-dark transition-colors p-2"
                                        title="Edit Subcategory"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubcategoryClick(subcategory.id, subcategory.name)}
                                        className="text-red-500 hover:text-red-700 transition-colors p-2"
                                        title="Delete Subcategory"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="font-noto-sans text-sm text-botai-text italic">
                                No subcategories yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-botai-blue hover:text-botai-dark transition-colors p-2"
                        title="Edit Category"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategoryClick(category.id, category.name)}
                        className="text-red-500 hover:text-red-700 transition-colors p-2"
                        title="Delete Category"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                  {editingCategory.id ? 'Edit Category' : 'Create New Category'}
                </h2>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="text-botai-text hover:text-botai-dark transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="category-name" className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Category Name *
                </label>
                <input
                  id="category-name"
                  name="categoryName"
                  type="text"
                  autoComplete="off"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-botai-purple focus:ring-2 focus:ring-botai-purple/20 outline-none transition-all font-noto-sans"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label htmlFor="category-description" className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Description
                </label>
                <textarea
                  id="category-description"
                  name="categoryDescription"
                  autoComplete="off"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-botai-purple focus:ring-2 focus:ring-botai-purple/20 outline-none transition-all font-noto-sans resize-none"
                  rows={3}
                  placeholder="Enter category description"
                />
              </div>

              <div>
                <label htmlFor="category-icon-search" className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Icon Library (Feather Style)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-botai-text" />
                  <input
                    id="category-icon-search"
                    name="categoryIconSearch"
                    type="text"
                    autoComplete="off"
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-botai-purple focus:ring-2 focus:ring-botai-purple/20 outline-none transition-all font-noto-sans"
                    placeholder="Search icons..."
                  />
                </div>

                <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                  {displayedCategoryIcons.map((option) => {
                    const isActive = selectedIconKey === option.key;
                    return (
                      <IconOptionButton
                        key={option.key}
                        option={option}
                        isActive={isActive}
                        onSelect={handleIconSelect}
                      />
                    );
                  })}
                </div>

                {hasMoreIcons && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setVisibleIconCount(filteredCategoryIcons.length)}
                      className="text-sm font-noto-sans font-semibold text-botai-dark hover:text-botai-purple transition-colors"
                    >
                      Load all icons
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                    {renderCategoryIcon(editingCategory.icon, 'w-6 h-6 text-botai-dark')}
                  </div>
                  <span className="font-noto-sans text-sm text-botai-text">Icon Preview</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="px-6 py-3 rounded-xl font-noto-sans font-semibold text-botai-text hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="bg-botai-dark text-white px-6 py-3 rounded-xl font-noto-sans font-semibold hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingCategory.id ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubcategoryModal && editingSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-space-grotesk font-bold text-2xl text-botai-dark">
                  {editingSubcategory.id ? 'Edit Subcategory' : 'Create New Subcategory'}
                </h2>
                <button
                  onClick={() => {
                    setShowSubcategoryModal(false);
                    setEditingSubcategory(null);
                    setSelectedCategoryId(null);
                  }}
                  className="text-botai-text hover:text-botai-dark transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="subcategory-parent-category" className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Parent Category
                </label>
                <select
                  id="subcategory-parent-category"
                  name="subcategoryParentCategory"
                  value={editingSubcategory.category_id || ''}
                  onChange={(e) =>
                    setEditingSubcategory({ ...editingSubcategory, category_id: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-botai-purple focus:ring-2 focus:ring-botai-purple/20 outline-none transition-all font-noto-sans"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory-name" className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Subcategory Name *
                </label>
                <input
                  id="subcategory-name"
                  name="subcategoryName"
                  type="text"
                  autoComplete="off"
                  value={editingSubcategory.name || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-botai-purple focus:ring-2 focus:ring-botai-purple/20 outline-none transition-all font-noto-sans"
                  placeholder="Enter subcategory name"
                />
              </div>

              <div>
                <label htmlFor="subcategory-description" className="block font-noto-sans font-semibold text-botai-dark mb-2">
                  Description
                </label>
                <textarea
                  id="subcategory-description"
                  name="subcategoryDescription"
                  autoComplete="off"
                  value={editingSubcategory.description || ''}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-botai-purple focus:ring-2 focus:ring-botai-purple/20 outline-none transition-all font-noto-sans resize-none"
                  rows={3}
                  placeholder="Enter subcategory description"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowSubcategoryModal(false);
                  setEditingSubcategory(null);
                  setSelectedCategoryId(null);
                }}
                className="px-6 py-3 rounded-xl font-noto-sans font-semibold text-botai-text hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubcategory}
                className="bg-botai-dark text-white px-6 py-3 rounded-xl font-noto-sans font-semibold hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editingSubcategory.id ? 'Update Subcategory' : 'Create Subcategory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, type: null, id: null, name: '' })}
        onConfirm={handleDeleteConfirm}
        title={deleteConfirm.type === 'category' ? 'DELETE CATEGORY' : 'DELETE SUBCATEGORY'}
        message={
          deleteConfirm.type === 'category'
            ? `Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all its subcategories and cannot be undone.`
            : `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`
        }
        confirmText="DELETE"
        cancelText="CANCEL"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
