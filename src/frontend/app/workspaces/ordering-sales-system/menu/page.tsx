'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { MenuService, RecipeService, InventoryPriceService } from '../../../../services/orderingService';
import { getItems } from '../../../../services/itemService';
import { MenuCategory, MenuItem } from '../../../../types/ordering';
import { Item } from '../../../../types';

interface MenuStats {
  totalCategories: number;
  totalMenuItems: number;
  activeItems: number;
  availableItems: number;
}

interface RecipeIngredient {
  itemId: string;
  quantity: number;
  unit: string;
  unitCost: number;
  isOptional: boolean;
}

export default function MenuManagementPage() {
  // Core state
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'items'>('categories');
  const [error, setError] = useState<string | null>(null);

  // Category form state
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    color: '#f59e0b',
    icon: '',
    availableFrom: '',
    availableTo: '',
  });

  // Menu item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    itemId: '',
    categoryId: '',
    displayName: '',
    displayNameEn: '',
    description: '',
    menuPrice: '',
    prepTime: '',
    isVegetarian: false,
    isSpicy: false,
    isFeatured: false,
  });

  // Recipe/Ingredients state
  const [showIngredientsSection, setShowIngredientsSection] = useState(false);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [editingIngredientIndex, setEditingIngredientIndex] = useState<number | null>(null);
  const [newIngredient, setNewIngredient] = useState({
    itemId: '',
    quantity: 1,
    unit: '',
    unitCost: 0,
    isOptional: false
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [categoriesData, menuItemsData, inventoryData] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getMenuItems(),
        getItems()
      ]);
      
      setCategories(categoriesData as MenuCategory[]);
      setMenuItems(menuItemsData as MenuItem[]);
      setInventoryItems(inventoryData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در دریافت اطلاعات منو';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter menu items
  useEffect(() => {
    let filtered = menuItems.filter(item => item.isActive);
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.categoryId === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.displayNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (showAvailableOnly) {
      filtered = filtered.filter(item => item.isAvailable);
    }
    
    setFilteredMenuItems(filtered);
  }, [menuItems, selectedCategory, searchTerm, showAvailableOnly]);

  // Calculate stats
  const getStats = useCallback((): MenuStats => {
    return {
      totalCategories: categories.filter(cat => cat.isActive).length,
      totalMenuItems: menuItems.length,
      activeItems: menuItems.filter(item => item.isActive).length,
      availableItems: menuItems.filter(item => item.isAvailable && item.isActive).length
    };
  }, [categories, menuItems]);

  // Category management functions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await MenuService.updateCategory(editingCategory.id, {
          name: categoryForm.name,
          nameEn: categoryForm.nameEn || undefined,
          description: categoryForm.description || undefined,
          color: categoryForm.color,
          icon: categoryForm.icon || undefined,
          availableFrom: categoryForm.availableFrom || undefined,
          availableTo: categoryForm.availableTo || undefined,
        });
        toast.success('دسته‌بندی با موفقیت ویرایش شد');
      } else {
        await MenuService.createCategory({
          name: categoryForm.name,
          nameEn: categoryForm.nameEn || undefined,
          description: categoryForm.description || undefined,
          color: categoryForm.color,
          icon: categoryForm.icon || undefined,
          availableFrom: categoryForm.availableFrom || undefined,
          availableTo: categoryForm.availableTo || undefined,
        });
        toast.success('دسته‌بندی با موفقیت ایجاد شد');
      }
      
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', nameEn: '', description: '', color: '#f59e0b', icon: '', availableFrom: '', availableTo: '' });
      loadData();
    } catch (error) {
      console.error('Error creating/updating category:', error);
      toast.error(editingCategory ? 'خطا در ویرایش دسته‌بندی' : 'خطا در ایجاد دسته‌بندی');
    }
  };

  const handleEditCategory = (category: MenuCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      nameEn: category.nameEn || '',
      description: category.description || '',
      color: category.color || '#f59e0b',
      icon: category.icon || '',
      availableFrom: category.availableFrom || '',
      availableTo: category.availableTo || '',
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی "${categoryName}" اطمینان دارید؟`)) {
      return;
    }

    try {
      await MenuService.deleteCategory(categoryId);
      toast.success('دسته‌بندی با موفقیت حذف شد');
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('خطا در حذف دسته‌بندی');
    }
  };

  // Menu item management functions
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let menuItemId: string;
      
      if (editingItem) {
        // Update existing menu item
        await MenuService.updateMenuItem(editingItem.id, {
          categoryId: itemForm.categoryId,
          displayName: itemForm.displayName,
          displayNameEn: itemForm.displayNameEn || undefined,
          description: itemForm.description || undefined,
          menuPrice: Number(itemForm.menuPrice),
          prepTime: itemForm.prepTime ? Number(itemForm.prepTime) : undefined,
          isVegetarian: itemForm.isVegetarian,
          isSpicy: itemForm.isSpicy,
          isFeatured: itemForm.isFeatured,
        });
        menuItemId = editingItem.id;
        toast.success('آیتم منو با موفقیت ویرایش شد');
      } else {
        // Create new menu item
        const newItem = await MenuService.createMenuItem({
          itemId: itemForm.itemId || undefined,
          categoryId: itemForm.categoryId,
          displayName: itemForm.displayName,
          displayNameEn: itemForm.displayNameEn || undefined,
          description: itemForm.description || undefined,
          menuPrice: Number(itemForm.menuPrice),
          prepTime: itemForm.prepTime ? Number(itemForm.prepTime) : undefined,
          isVegetarian: itemForm.isVegetarian,
          isSpicy: itemForm.isSpicy,
          isFeatured: itemForm.isFeatured,
        });
        menuItemId = (newItem as { id: string })?.id;
        toast.success('آیتم منو با موفقیت ایجاد شد');
      }

      // Always check and update recipe/ingredients (even when deleting ingredients)
      if (menuItemId) {
        try {
          // Check if recipe already exists
          let recipe;
          try {
            recipe = await RecipeService.getRecipeByMenuItem(menuItemId);
          } catch {
            recipe = null;
          }

          if (recipe) {
            // Update existing recipe - first remove ALL old ingredients
            const existingIngredients = await RecipeService.getRecipeIngredients((recipe as { id: string }).id) as { id: string }[];
            if (Array.isArray(existingIngredients)) {
              for (const ingredient of existingIngredients) {
                if (ingredient?.id) {
                  await RecipeService.removeIngredient(ingredient.id);
                }
              }
            }
            
            // Add new ingredients (only if there are any)
            if (ingredients.length > 0) {
              for (const ingredient of ingredients) {
                await RecipeService.addIngredient((recipe as { id: string }).id, {
                  itemId: ingredient.itemId,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
                  unitCost: ingredient.unitCost,
                  isOptional: ingredient.isOptional,
                });
              }
            }
            // If no ingredients left, recipe becomes empty (which is fine)
          } else if (ingredients.length > 0) {
            // Create new recipe only if there are ingredients to add
            const newRecipe = await RecipeService.createRecipe({
              menuItemId: menuItemId,
              name: `دستور پخت ${itemForm.displayName}`,
              description: `مواد اولیه مورد نیاز برای ${itemForm.displayName}`,
            });

            // Add ingredients to recipe
            for (const ingredient of ingredients) {
              await RecipeService.addIngredient((newRecipe as { id: string }).id, {
                itemId: ingredient.itemId,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                unitCost: ingredient.unitCost,
                isOptional: ingredient.isOptional,
              });
            }
          }
        } catch (error) {
          console.error('Error saving recipe/ingredients:', error);
          toast.error('خطا در ذخیره دستور پخت');
        }
      }
      
      resetItemForm();
      loadData();
    } catch (error) {
      console.error('Error creating/updating menu item:', error);
      toast.error(editingItem ? 'خطا در ویرایش آیتم منو' : 'خطا در ایجاد آیتم منو');
    }
  };

  const handleEditMenuItem = async (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      itemId: item.itemId || '',
      categoryId: item.categoryId,
      displayName: item.displayName,
      displayNameEn: item.displayNameEn || '',
      description: item.description || '',
      menuPrice: item.menuPrice?.toString() || '',
      prepTime: item.prepTime?.toString() || '',
      isVegetarian: item.isVegetarian || false,
      isSpicy: item.isSpicy || false,
      isFeatured: item.isFeatured || false,
    });

    // Load existing recipe/ingredients if they exist
    try {
      const recipe = await RecipeService.getRecipeByMenuItem(item.id) as { 
        id: string; 
        ingredients?: { itemId: string; quantity: number; unit: string; unitCost: number; isOptional: boolean; }[];
      };
      if (recipe?.ingredients && Array.isArray(recipe.ingredients)) {
        const existingIngredients = recipe.ingredients.map((ing: {
          itemId: string;
          quantity: number;
          unit: string;
          unitCost: number;
          isOptional: boolean;
        }) => ({
          itemId: ing.itemId,
          quantity: ing.quantity,
          unit: ing.unit,
          unitCost: ing.unitCost,
          isOptional: ing.isOptional
        }));
        setIngredients(existingIngredients);
        setShowIngredientsSection(true); // Show section if there are existing ingredients
      } else {
        setIngredients([]);
        setShowIngredientsSection(false);
      }
    } catch {
      // Recipe doesn't exist or error loading - that's OK, just start with empty ingredients
      console.log('No existing recipe found for menu item:', item.id);
      setIngredients([]);
      setShowIngredientsSection(false);
    }

    setShowItemForm(true);
  };

  const handleDeleteMenuItem = async (itemId: string, itemName: string) => {
    if (!confirm(`آیا از حذف آیتم "${itemName}" اطمینان دارید؟`)) {
      return;
    }

    try {
      await MenuService.deleteMenuItem(itemId);
      toast.success('آیتم منو با موفقیت حذف شد');
      loadData();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('خطا در حذف آیتم منو');
    }
  };

  const toggleItemAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      await MenuService.toggleItemAvailability(itemId, !currentAvailability);
      toast.success(`وضعیت موجودی ${currentAvailability ? 'غیرفعال' : 'فعال'} شد`);
      loadData();
    } catch (error) {
      console.error('Error toggling item availability:', error);
      toast.error('خطا در تغییر وضعیت موجودی');
    }
  };

  // Helper functions
  const getAvailableInventoryItems = () => {
    return inventoryItems.filter(item => item.isActive);
  };

  const resetItemForm = () => {
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm({
      itemId: '', categoryId: '', displayName: '', displayNameEn: '', 
      description: '', menuPrice: '', prepTime: '', 
      isVegetarian: false, isSpicy: false, isFeatured: false
    });
    setIngredients([]);
    setShowIngredientsSection(false);
    setNewIngredient({
      itemId: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      isOptional: false
    });
  };

  // Add ingredient to recipe (price is already fetched automatically)
  const addIngredient = async () => {
    if (newIngredient.itemId && newIngredient.quantity > 0 && newIngredient.unitCost > 0) {
      try {
        // If editing existing ingredient, update it
        if (editingIngredientIndex !== null) {
          await updateIngredient();
          return;
        }

        // Check if ingredient already exists (only for new ingredients)
        const existingIngredient = ingredients.find(ing => ing.itemId === newIngredient.itemId);
        if (existingIngredient) {
          toast.error('این کالا قبلاً به دستور پخت افزوده شده است');
          return;
        }

        // Validate that we have all required data
        const selectedItem = inventoryItems.find(item => item.id === newIngredient.itemId);
        if (!selectedItem) {
          toast.error('کالای انتخاب شده یافت نشد');
          return;
        }

        // Create the ingredient with all required data
        const ingredientToAdd = {
          ...newIngredient,
          unit: selectedItem.unit, // Ensure unit is set from inventory
          itemName: selectedItem.name, // Add item name for display
          totalCost: newIngredient.quantity * newIngredient.unitCost
        };

        // Add to ingredients list
        setIngredients([...ingredients, ingredientToAdd]);
        
        // Reset form
        setNewIngredient({
          itemId: '',
          quantity: 1,
          unit: '',
          unitCost: 0,
          isOptional: false
        });
        
        toast.success(`ماده اولیه "${selectedItem.name}" با موفقیت افزوده شد`);
      } catch (error) {
        toast.error('خطا در افزودن ماده اولیه');
        console.error('Failed to add ingredient:', error);
      }
    } else {
      toast.error('لطفاً تمام فیلدهای مورد نیاز را پر کنید');
    }
  };

  // Remove ingredient from recipe
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Edit ingredient
  const editIngredient = (index: number) => {
    const ingredient = ingredients[index];
    setNewIngredient({
      itemId: ingredient.itemId,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      unitCost: ingredient.unitCost,
      isOptional: ingredient.isOptional
    });
    setEditingIngredientIndex(index);
  };

  // Update ingredient
  const updateIngredient = async () => {
    if (editingIngredientIndex !== null && newIngredient.itemId && newIngredient.quantity > 0 && newIngredient.unitCost > 0) {
      try {
        const selectedItem = inventoryItems.find(item => item.id === newIngredient.itemId);
        if (!selectedItem) {
          toast.error('کالای انتخاب شده یافت نشد');
          return;
        }

        const updatedIngredient = {
          ...newIngredient,
          unit: selectedItem.unit,
          itemName: selectedItem.name,
          totalCost: newIngredient.quantity * newIngredient.unitCost
        };

        const updatedIngredients = [...ingredients];
        updatedIngredients[editingIngredientIndex] = updatedIngredient;
        setIngredients(updatedIngredients);
        
        // Reset form
        setNewIngredient({
          itemId: '',
          quantity: 1,
          unit: '',
          unitCost: 0,
          isOptional: false
        });
        setEditingIngredientIndex(null);
        
        toast.success(`ماده اولیه "${selectedItem.name}" با موفقیت ویرایش شد`);
      } catch (error) {
        toast.error('خطا در ویرایش ماده اولیه');
        console.error('Failed to update ingredient:', error);
      }
    }
  };

  // Cancel editing ingredient
  const cancelEditIngredient = () => {
    setNewIngredient({
      itemId: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      isOptional: false
    });
    setEditingIngredientIndex(null);
  };

  // Auto-update ingredient prices when inventory prices change
  const updateIngredientPrices = useCallback(async () => {
    if (ingredients.length > 0) {
      try {
        const updatedIngredients = await Promise.all(
          ingredients.map(async (ingredient) => {
            try {
              const inventoryPrice = await InventoryPriceService.getInventoryPrice(ingredient.itemId);
              return {
                ...ingredient,
                unitCost: inventoryPrice.price
              };
            } catch (error) {
              console.warn(`Failed to update price for ingredient ${ingredient.itemId}:`, error);
              return ingredient; // Keep original price if update fails
            }
          })
        );
        
        // Only update if prices actually changed
        const hasChanges = updatedIngredients.some((updated, index) => 
          updated.unitCost !== ingredients[index].unitCost
        );
        
        if (hasChanges) {
          setIngredients(updatedIngredients);
        }
      } catch (error) {
        console.warn('Failed to update ingredient prices:', error);
      }
    }
  }, [ingredients]);

  useEffect(() => {
    // Update prices every 30 seconds to catch inventory changes
    const interval = setInterval(updateIngredientPrices, 30000);
    
    // Also update immediately when ingredients change
    updateIngredientPrices();

    return () => clearInterval(interval);
  }, [updateIngredientPrices]);


  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="mr-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">خطا در دریافت اطلاعات</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              مدیریت منو
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مدیریت دسته‌بندی‌ها و آیتم‌های منو رستوران
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H3m16 8H3m16 6H3" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">دسته‌بندی‌ها</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalCategories}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">کل آیتم‌ها</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalMenuItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-amber-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">فعال</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.activeItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">موجود</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.availableItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 space-x-reverse bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            مدیریت دسته‌بندی‌ها
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'items'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            مدیریت آیتم‌های منو
          </button>
        </div>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              دسته‌بندی‌های منو
            </h2>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="btn-primary"
            >
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              افزودن دسته‌بندی
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.filter(cat => cat.isActive).map(category => (
              <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full ml-3" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id, category.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {category.description}
                  </p>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    آیتم‌ها: {menuItems.filter(item => item.categoryId === category.id && item.isActive).length}
                  </span>
                  {category.availableFrom && category.availableTo && (
                    <span>
                      {category.availableFrom} - {category.availableTo}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'items' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              آیتم‌های منو
            </h2>
            <button
              onClick={() => setShowItemForm(true)}
              className="btn-primary"
            >
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              افزودن آیتم منو
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                جستجو
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="نام آیتم..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                دسته‌بندی
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">همه دسته‌بندی‌ها</option>
                {categories.filter(cat => cat.isActive).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">فقط موجود</span>
              </label>
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    نام آیتم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    قیمت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMenuItems.map((item) => {
                  const category = categories.find(cat => cat.id === item.categoryId);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.displayName}
                            </div>
                            {item.displayNameEn && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {item.displayNameEn}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {category?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.menuPrice?.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.isAvailable
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {item.isAvailable ? 'موجود' : 'ناموجود'}
                          </span>
                          {item.isFeatured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              ویژه
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => toggleItemAvailability(item.id, item.isAvailable)}
                            className={`p-2 rounded-md ${
                              item.isAvailable
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={item.isAvailable ? 'ناموجود کردن' : 'موجود کردن'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {item.isAvailable ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 12a9 9 0 00-9-9m12.728 12.728L12 18.001a9 9 0 009-9" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditMenuItem(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                            title="ویرایش"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item.id, item.displayName)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
              </h3>
              <form onSubmit={handleCreateCategory} className="mt-4 text-right">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام دسته‌بندی *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    نام انگلیسی
                  </label>
                  <input
                    type="text"
                    value={categoryForm.nameEn}
                    onChange={(e) => setCategoryForm({...categoryForm, nameEn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رنگ
                  </label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                    className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditingCategory(null);
                      setCategoryForm({ name: '', nameEn: '', description: '', color: '#f59e0b', icon: '', availableFrom: '', availableTo: '' });
                    }}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 ml-3"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {editingCategory ? 'ویرایش' : 'ایجاد'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Menu Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto mb-8 p-6 border w-full max-w-4xl shadow-xl rounded-lg bg-white dark:bg-gray-800">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                {editingItem ? 'ویرایش آیتم منو' : 'افزودن آیتم منو جدید'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                اطلاعات کامل آیتم منو و مواد اولیه آن را وارد کنید
              </p>
            </div>
            
            <form onSubmit={handleCreateMenuItem} className="space-y-6">
              {/* Grid Layout for Better Organization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کالا از انبار (اختیاری)
                    </label>
                    <select
                      value={itemForm.itemId}
                      onChange={(e) => setItemForm({...itemForm, itemId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">بدون اتصال به انبار</option>
                      {getAvailableInventoryItems().map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.category})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      می‌توانید آیتم منو را بدون اتصال به کالای انبار ایجاد کنید
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      دسته‌بندی منو *
                    </label>
                    <select
                      required
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm({...itemForm, categoryId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">انتخاب دسته‌بندی</option>
                      {categories.filter(cat => cat.isActive).map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      نام نمایشی *
                    </label>
                    <input
                      type="text"
                      required
                      value={itemForm.displayName}
                      onChange={(e) => setItemForm({...itemForm, displayName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      توضیحات
                    </label>
                    <textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      قیمت منو (تومان) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={itemForm.menuPrice}
                      onChange={(e) => setItemForm({...itemForm, menuPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      زمان آماده‌سازی (دقیقه)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={itemForm.prepTime}
                      onChange={(e) => setItemForm({...itemForm, prepTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ویژگی‌ها:</p>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={itemForm.isVegetarian}
                        onChange={(e) => setItemForm({...itemForm, isVegetarian: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">گیاهی</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={itemForm.isSpicy}
                        onChange={(e) => setItemForm({...itemForm, isSpicy: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">تند</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={itemForm.isFeatured}
                        onChange={(e) => setItemForm({...itemForm, isFeatured: e.target.checked})}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">ویژه</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Recipe/Ingredients Section */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    دستور پخت و مواد اولیه (اختیاری)
                  </h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      type="button"
                      onClick={() => setShowIngredientsSection(!showIngredientsSection)}
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <span>{showIngredientsSection ? 'مخفی کردن' : 'نمایش'}</span>
                      <svg 
                        className={`w-4 h-4 mr-1 transform transition-transform ${showIngredientsSection ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {showIngredientsSection && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      می‌توانید مواد اولیه مورد نیاز برای این آیتم را مشخص کنید. 
                      این کار برای محاسبه قیمت تمام شده و کنترل موجودی مفید است.
                    </p>

                    {/* Existing Ingredients List */}
                    {ingredients.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">مواد اولیه:</h4>
                        {ingredients.map((ingredient, index) => {
                          const item = inventoryItems.find(item => item.id === ingredient.itemId);
                          return (
                            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {item?.name || 'کالای نامشخص'}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    ingredient.unitCost > 0 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                    {ingredient.unitCost > 0 ? 'قیمت دارد' : 'بدون قیمت'}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({ingredient.quantity} {ingredient.unit})
                                  {ingredient.unitCost > 0 && ` - ${ingredient.unitCost.toLocaleString('fa-IR')} تومان`}
                                  {ingredient.isOptional && ' - اختیاری'}
                                </span>
                              </div>
                              <div className="flex space-x-1 space-x-reverse">
                                <button
                                  type="button"
                                  onClick={() => editIngredient(index)}
                                  className="text-blue-500 hover:text-blue-700 p-1"
                                  title="ویرایش"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeIngredient(index)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="حذف"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add New Ingredient Form */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">افزودن ماده اولیه:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            کالا
                          </label>
                          <select
                            value={newIngredient.itemId}
                            onChange={async (e) => {
                              const selectedItem = inventoryItems.find(item => item.id === e.target.value);
                              
                              if (e.target.value && selectedItem) {
                                try {
                                  // Auto-fetch price when item is selected
                                  const inventoryPrice = await InventoryPriceService.getInventoryPrice(e.target.value);
                                  setNewIngredient({
                                    ...newIngredient,
                                    itemId: e.target.value,
                                    unit: selectedItem.unit,
                                    unitCost: inventoryPrice.price
                                  });
                                  
                                  if (inventoryPrice.price > 0) {
                                    toast.success(`قیمت ${inventoryPrice.price.toLocaleString('fa-IR')} تومان از موجودی دریافت شد`);
                                  } else {
                                    toast.error('قیمت این کالا در موجودی تعریف نشده است');
                                  }
                                } catch (error) {
                                  console.warn('Failed to auto-fetch inventory price:', error);
                                  setNewIngredient({
                                    ...newIngredient,
                                    itemId: e.target.value,
                                    unit: selectedItem.unit,
                                    unitCost: 0
                                  });
                                  toast.error('خطا در دریافت قیمت از موجودی');
                                }
                              } else {
                                // Reset when no item selected
                                setNewIngredient({
                                  ...newIngredient,
                                  itemId: '',
                                  unit: '',
                                  unitCost: 0
                                });
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">انتخاب کالا</option>
                            {inventoryItems.filter(item => item.isActive).map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.category})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            مقدار
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={newIngredient.quantity}
                            onChange={(e) => setNewIngredient({...newIngredient, quantity: Number(e.target.value) || 0})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            واحد
                          </label>
                          <div className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                            {newIngredient.unit || 'انتخاب کالا برای نمایش واحد'}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            قیمت تمام شده ماده در آیتم (تومان)
                          </label>
                          <div className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                            {newIngredient.unitCost > 0 && newIngredient.quantity > 0
                              ? `${(newIngredient.quantity * newIngredient.unitCost).toLocaleString('fa-IR')} تومان` 
                              : 'انتخاب کالا و مقدار برای نمایش قیمت'
                            }
                          </div>
                          {newIngredient.unitCost > 0 && newIngredient.quantity > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {newIngredient.quantity} × {newIngredient.unitCost.toLocaleString('fa-IR')} = {(newIngredient.quantity * newIngredient.unitCost).toLocaleString('fa-IR')} تومان
                            </p>
                          )}
                          {(!newIngredient.unitCost || !newIngredient.quantity) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              قیمت به صورت خودکار از موجودی محاسبه می‌شود
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newIngredient.isOptional}
                            onChange={(e) => setNewIngredient({...newIngredient, isOptional: e.target.checked})}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">اختیاری</span>
                        </label>
                        
                        <div className="flex space-x-2 space-x-reverse">
                          {editingIngredientIndex !== null ? (
                            <>
                              <button
                                type="button"
                                onClick={updateIngredient}
                                disabled={!newIngredient.itemId || newIngredient.quantity <= 0 || newIngredient.unitCost <= 0}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                ذخیره تغییرات
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditIngredient}
                                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                              >
                                انصراف
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={addIngredient}
                              disabled={!newIngredient.itemId || newIngredient.quantity <= 0 || newIngredient.unitCost <= 0}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              افزودن
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost Summary - Fixed Calculations */}
                    {ingredients.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">خلاصه قیمت تمام شده:</h4>
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <div>هزینه کل مواد اولیه: {ingredients.reduce((sum, ing) => sum + (Number(ing.quantity) * Number(ing.unitCost)), 0).toLocaleString('fa-IR')} تومان</div>
                          <div>قیمت منو: {itemForm.menuPrice ? Number(itemForm.menuPrice).toLocaleString('fa-IR') : '0'} تومان</div>
                          {ingredients.reduce((sum, ing) => sum + (Number(ing.quantity) * Number(ing.unitCost)), 0) > 0 && itemForm.menuPrice && (
                            <div className="font-medium mt-1">
                              سود خالص: {(Number(itemForm.menuPrice) - ingredients.reduce((sum, ing) => sum + (Number(ing.quantity) * Number(ing.unitCost)), 0)).toLocaleString('fa-IR')} تومان
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-600 gap-3">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-6 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors"
                >
                  {editingItem ? 'ویرایش آیتم' : 'افزودن آیتم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}