import { PrismaClient, Recipe, RecipeIngredient } from '../../../shared/generated/client';
import { AppError } from '../utils/AppError';
// import { getInventoryPrice, calculateWeightedAverageCost } from './inventoryService';

const prisma = new PrismaClient();

export interface CreateRecipeData {
  menuItemId: string;
  name: string;
  description?: string;
  instructions?: string;
  yield?: number;
  prepTime?: number;
}

export interface UpdateRecipeData extends Partial<CreateRecipeData> {
  isActive?: boolean;
}

export interface CreateRecipeIngredientData {
  recipeId: string;
  itemId: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  isOptional?: boolean;
}

export interface UpdateRecipeIngredientData extends Partial<CreateRecipeIngredientData> {
  // All fields are optional for updates
  totalCost?: number; // Calculated field that can be updated
}

export interface RecipeFilterOptions {
  isActive?: boolean;
  menuItemId?: string;
  search?: string;
}

export interface RecipeIngredientFilterOptions {
  recipeId?: string;
  itemId?: string;
  isOptional?: boolean;
}

export class RecipeService {
  /**
   * Create a new recipe for a menu item
   */
  static async createRecipe(tenantId: string, recipeData: CreateRecipeData): Promise<Recipe> {
    try {
      // Verify menu item exists and belongs to tenant
      const menuItem = await prisma.menuItem.findFirst({
        where: {
          id: recipeData.menuItemId,
          tenantId: tenantId
        }
      });

      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }

      // Check if recipe already exists for this menu item
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          menuItemId: recipeData.menuItemId,
          tenantId: tenantId
        }
      });

      if (existingRecipe) {
        throw new AppError('Recipe already exists for this menu item', 400);
      }

      const recipe = await prisma.recipe.create({
        data: {
          tenantId,
          menuItemId: recipeData.menuItemId,
          name: recipeData.name,
          description: recipeData.description,
          instructions: recipeData.instructions,
          yield: recipeData.yield || 1,
          prepTime: recipeData.prepTime,
        },
        include: {
          menuItem: {
            select: {
              id: true,
              displayName: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  unit: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      return recipe;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create recipe', 500);
    }
  }

  /**
   * Get recipe by menu item ID
   */
  static async getRecipeByMenuItem(tenantId: string, menuItemId: string): Promise<Recipe | null> {
    try {
      const recipe = await prisma.recipe.findFirst({
        where: {
          menuItemId,
          tenantId,
          isActive: true
        },
        include: {
          menuItem: {
            select: {
              id: true,
              displayName: true,
              menuPrice: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          ingredients: {
            where: {
              // Only active ingredients
            },
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  category: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      return recipe;
    } catch (error) {
      throw new AppError('Failed to get recipe', 500);
    }
  }

  /**
   * Get all recipes for a tenant
   */
  static async getRecipes(
    tenantId: string,
    options: RecipeFilterOptions & {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ recipes: Recipe[]; total: number; pages: number }> {
    try {
      const {
        page = 1,
        limit = 50,
        sortBy = 'name',
        sortOrder = 'asc',
        ...filters
      } = options;

      const skip = (page - 1) * limit;
      const where: any = {
        tenantId,
        isActive: filters.isActive !== undefined ? filters.isActive : true
      };

      // Apply filters
      if (filters.menuItemId) {
        where.menuItemId = filters.menuItemId;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { menuItem: { displayName: { contains: filters.search, mode: 'insensitive' } } }
        ];
      }

      const [recipes, total] = await Promise.all([
        prisma.recipe.findMany({
          where,
          include: {
            menuItem: {
              select: {
                id: true,
                displayName: true,
                menuPrice: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            ingredients: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    unit: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            },
            _count: {
              select: {
                ingredients: true
              }
            }
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          skip,
          take: limit
        }),
        prisma.recipe.count({ where })
      ]);

      const pages = Math.ceil(total / limit);

      return { recipes, total, pages };
    } catch (error) {
      throw new AppError('Failed to get recipes', 500);
    }
  }

  /**
   * Update a recipe
   */
  static async updateRecipe(tenantId: string, recipeId: string, updateData: UpdateRecipeData): Promise<Recipe> {
    try {
      // Verify recipe exists and belongs to tenant
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          tenantId
        }
      });

      if (!existingRecipe) {
        throw new AppError('Recipe not found', 404);
      }

      const recipe = await prisma.recipe.update({
        where: {
          id: recipeId
        },
        data: updateData,
        include: {
          menuItem: {
            select: {
              id: true,
              displayName: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  unit: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      // Recalculate total cost if ingredients exist
      await this.recalculateRecipeCost(tenantId, recipeId);

      return recipe;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update recipe', 500);
    }
  }

  /**
   * Delete a recipe (soft delete)
   */
  static async deleteRecipe(tenantId: string, recipeId: string): Promise<void> {
    try {
      // Verify recipe exists and belongs to tenant
      const existingRecipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          tenantId
        }
      });

      if (!existingRecipe) {
        throw new AppError('Recipe not found', 404);
      }

      await prisma.recipe.update({
        where: {
          id: recipeId
        },
        data: {
          isActive: false
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete recipe', 500);
    }
  }

  /**
   * Add ingredient to recipe with automatic price fetching from inventory
   */
  static async addIngredient(tenantId: string, ingredientData: CreateRecipeIngredientData): Promise<RecipeIngredient> {
    try {
      // Verify recipe exists and belongs to tenant
      const recipe = await prisma.recipe.findFirst({
        where: {
          id: ingredientData.recipeId,
          tenantId
        }
      });

      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      // Verify item exists and belongs to tenant
      const item = await prisma.item.findFirst({
        where: {
          id: ingredientData.itemId,
          tenantId
        }
      });

      if (!item) {
        throw new AppError('Item not found', 404);
      }

      // Check if ingredient already exists in this recipe
      const existingIngredient = await prisma.recipeIngredient.findFirst({
        where: {
          recipeId: ingredientData.recipeId,
          itemId: ingredientData.itemId,
          tenantId
        }
      });

      if (existingIngredient) {
        throw new AppError('Ingredient already exists in this recipe', 400);
      }

      // Auto-fetch price from inventory if not provided
      let unitCost = ingredientData.unitCost;
      let priceSource = 'MANUAL';
      
      if (!unitCost || unitCost === 0) {
        try {
          const { getInventoryPrice } = await import('./inventoryService');
          const inventoryPrice = await getInventoryPrice(ingredientData.itemId, tenantId);
          unitCost = inventoryPrice.price;
          priceSource = inventoryPrice.priceSource;
          
          console.log(`📊 Auto-fetched price for ${item.name}: ${unitCost} (${priceSource})`);
        } catch (error) {
          console.warn(`⚠️ Failed to fetch inventory price for ${item.name}:`, error);
          unitCost = 0;
          priceSource = 'NONE';
        }
      }

      const totalCost = (unitCost || 0) * ingredientData.quantity;

      const ingredient = await prisma.recipeIngredient.create({
        data: {
          tenantId,
          recipeId: ingredientData.recipeId,
          itemId: ingredientData.itemId,
          quantity: ingredientData.quantity,
          unit: ingredientData.unit,
          unitCost: unitCost || 0,
          totalCost,
          isOptional: ingredientData.isOptional || false
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: true
            }
          },
          recipe: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Recalculate recipe total cost
      await this.recalculateRecipeCost(tenantId, ingredientData.recipeId);

      return ingredient;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add ingredient', 500);
    }
  }

  /**
   * Update recipe ingredient with automatic price synchronization
   */
  static async updateIngredient(tenantId: string, ingredientId: string, updateData: UpdateRecipeIngredientData): Promise<RecipeIngredient> {
    try {
      // Verify ingredient exists and belongs to tenant
      const existingIngredient = await prisma.recipeIngredient.findFirst({
        where: {
          id: ingredientId,
          tenantId
        },
        include: {
          item: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!existingIngredient) {
        throw new AppError('Recipe ingredient not found', 404);
      }

      // Auto-sync price from inventory if unitCost is being updated and is 0 or not provided
      let unitCost = updateData.unitCost;
      if (updateData.unitCost !== undefined && (updateData.unitCost === 0 || updateData.unitCost === null)) {
        try {
          const { getInventoryPrice } = await import('./inventoryService');
          const inventoryPrice = await getInventoryPrice(existingIngredient.itemId, tenantId);
          unitCost = inventoryPrice.price;
          console.log(`📊 Auto-synced price for ${existingIngredient.item.name}: ${unitCost}`);
        } catch (error) {
          console.warn(`⚠️ Failed to sync inventory price for ${existingIngredient.item.name}:`, error);
          unitCost = 0;
        }
      }

      // Recalculate total cost if quantity or unit cost changed
      let totalCost = Number(existingIngredient.totalCost);
      if (updateData.quantity !== undefined || unitCost !== undefined) {
        const newQuantity = updateData.quantity !== undefined ? updateData.quantity : Number(existingIngredient.quantity);
        const newUnitCost = unitCost !== undefined ? unitCost : Number(existingIngredient.unitCost);
        totalCost = newQuantity * newUnitCost;
      }

      const updatedIngredient = await prisma.recipeIngredient.update({
        where: {
          id: ingredientId
        },
        data: {
          ...updateData,
          ...(unitCost !== undefined && { unitCost: Number(unitCost) }),
          ...(totalCost !== undefined && { totalCost: Number(totalCost) })
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: true
            }
          },
          recipe: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Recalculate recipe total cost
      await this.recalculateRecipeCost(tenantId, existingIngredient.recipeId);

      return updatedIngredient;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update ingredient', 500);
    }
  }

  /**
   * Remove ingredient from recipe
   */
  static async removeIngredient(tenantId: string, ingredientId: string): Promise<void> {
    try {
      // Verify ingredient exists and belongs to tenant
      const existingIngredient = await prisma.recipeIngredient.findFirst({
        where: {
          id: ingredientId,
          tenantId
        }
      });

      if (!existingIngredient) {
        throw new AppError('Recipe ingredient not found', 404);
      }

      const recipeId = existingIngredient.recipeId;

      await prisma.recipeIngredient.delete({
        where: {
          id: ingredientId
        }
      });

      // Recalculate recipe total cost
      await this.recalculateRecipeCost(tenantId, recipeId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove ingredient', 500);
    }
  }

  /**
   * Get recipe ingredients
   */
  static async getRecipeIngredients(tenantId: string, recipeId: string): Promise<RecipeIngredient[]> {
    try {
      const ingredients = await prisma.recipeIngredient.findMany({
        where: {
          recipeId,
          tenantId
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return ingredients;
    } catch (error) {
      throw new AppError('Failed to get recipe ingredients', 500);
    }
  }

  /**
   * Recalculate recipe total cost based on ingredients
   */
  static async recalculateRecipeCost(tenantId: string, recipeId: string): Promise<void> {
    try {
      const ingredients = await prisma.recipeIngredient.findMany({
        where: {
          recipeId,
          tenantId
        }
      });

      const totalCost = ingredients.reduce((sum, ingredient) => {
        return sum + Number(ingredient.totalCost);
      }, 0);

      const recipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          tenantId
        }
      });

      if (recipe) {
        const costPerServing = recipe.yield > 0 ? totalCost / recipe.yield : totalCost;

        await prisma.recipe.update({
          where: {
            id: recipeId
          },
          data: {
            totalCost,
            costPerServing
          }
        });
      }
    } catch (error) {
      // Don't throw error for cost calculation, as it's not critical
      console.error('Failed to recalculate recipe cost:', error);
    }
  }

  /**
   * Get recipe cost analysis
   */
  static async getRecipeCostAnalysis(tenantId: string, recipeId: string): Promise<{
    totalCost: number;
    costPerServing: number;
    ingredients: Array<{
      id: string;
      itemName: string;
      quantity: number;
      unit: string;
      unitCost: number;
      totalCost: number;
      percentage: number;
    }>;
  }> {
    try {
      const recipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          tenantId,
          isActive: true
        },
        include: {
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      const totalCost = Number(recipe.totalCost);
      const costPerServing = Number(recipe.costPerServing);

      const ingredients = recipe.ingredients.map(ingredient => ({
        id: ingredient.id,
        itemName: ingredient.item.name,
        quantity: Number(ingredient.quantity),
        unit: ingredient.unit,
        unitCost: Number(ingredient.unitCost),
        totalCost: Number(ingredient.totalCost),
        percentage: totalCost > 0 ? (Number(ingredient.totalCost) / totalCost) * 100 : 0
      }));

      return {
        totalCost,
        costPerServing,
        ingredients
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get recipe cost analysis', 500);
    }
  }

  /**
   * Sync all recipe ingredient prices from inventory
   */
  static async syncIngredientPrices(tenantId: string): Promise<{
    synced: number;
    failed: number;
    changes: Array<{
      ingredientId: string;
      itemName: string;
      recipeName: string;
      oldPrice: number;
      newPrice: number;
    }>;
  }> {
    try {
      const ingredients = await prisma.recipeIngredient.findMany({
        where: {
          tenantId
        },
        include: {
          item: {
            select: {
              id: true,
              name: true
            }
          },
          recipe: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      let synced = 0;
      let failed = 0;
      const changes: Array<{
        ingredientId: string;
        itemName: string;
        recipeName: string;
        oldPrice: number;
        newPrice: number;
      }> = [];

      for (const ingredient of ingredients) {
        try {
          const { getInventoryPrice } = await import('./inventoryService');
          const inventoryPrice = await getInventoryPrice(ingredient.itemId, tenantId);
          const oldPrice = Number(ingredient.unitCost);
          const newPrice = inventoryPrice.price;

          // Only update if price is different and inventory has a valid price
          if (newPrice > 0 && Math.abs(newPrice - oldPrice) > 0.01) {
            const newTotalCost = Number(ingredient.quantity) * newPrice;

            await prisma.recipeIngredient.update({
              where: {
                id: ingredient.id
              },
              data: {
                unitCost: newPrice,
                totalCost: newTotalCost
              }
            });

            // Recalculate recipe cost
            await this.recalculateRecipeCost(tenantId, ingredient.recipeId);

            changes.push({
              ingredientId: ingredient.id,
              itemName: ingredient.item.name,
              recipeName: ingredient.recipe.name,
              oldPrice,
              newPrice
            });

            synced++;
          }
        } catch (error) {
          console.error(`Failed to sync price for ingredient ${ingredient.id}:`, error);
          failed++;
        }
      }

      return {
        synced,
        failed,
        changes
      };
    } catch (error) {
      throw new AppError('Failed to sync ingredient prices', 500);
    }
  }

  /**
   * Get price analysis for a specific recipe
   */
  static async getRecipePriceAnalysis(tenantId: string, recipeId: string): Promise<{
    recipeId: string;
    recipeName: string;
    totalCost: number;
    costPerServing: number;
    ingredients: Array<{
      id: string;
      itemName: string;
      quantity: number;
      unit: string;
      recipePrice: number;
      inventoryPrice: number;
      priceDifference: number;
      priceSource: 'SYNCED' | 'MANUAL' | 'MISSING';
    }>;
  }> {
    try {
      const recipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          tenantId,
          isActive: true
        },
        include: {
          ingredients: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!recipe) {
        throw new AppError('Recipe not found', 404);
      }

      const ingredients = [];

      for (const ingredient of recipe.ingredients) {
        const recipePrice = Number(ingredient.unitCost);
        const { calculateWeightedAverageCost } = await import('./inventoryService');
        const inventoryPrice = await calculateWeightedAverageCost(ingredient.itemId, tenantId);
        const priceDifference = Math.abs(recipePrice - inventoryPrice);
        
        let priceSource: 'SYNCED' | 'MANUAL' | 'MISSING';
        if (inventoryPrice === 0) {
          priceSource = 'MISSING';
        } else if (Math.abs(recipePrice - inventoryPrice) < 0.01) {
          priceSource = 'SYNCED';
        } else {
          priceSource = 'MANUAL';
        }

        ingredients.push({
          id: ingredient.id,
          itemName: ingredient.item.name,
          quantity: Number(ingredient.quantity),
          unit: ingredient.unit,
          recipePrice,
          inventoryPrice,
          priceDifference,
          priceSource
        });
      }

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        totalCost: Number(recipe.totalCost),
        costPerServing: Number(recipe.costPerServing),
        ingredients
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get recipe price analysis', 500);
    }
  }
} 
