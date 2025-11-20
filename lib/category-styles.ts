/**
 * Category styling configuration
 * Maps category names to visual styles (colors, icons)
 */

import {
  Newspaper,
  Rocket,
  DollarSign,
  Activity,
  Palette,
  TrendingUp,
  Globe,
  Zap,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryStyle {
  icon: LucideIcon;
  bgColor: string;
  color: string;
}

// Default category styles mapping
const categoryStylesMap: Record<string, CategoryStyle> = {
  // Technology
  technology: {
    icon: Rocket,
    bgColor: '#E0F2FE',
    color: '#0369A1',
  },
  tech: {
    icon: Rocket,
    bgColor: '#E0F2FE',
    color: '#0369A1',
  },

  // Business
  business: {
    icon: DollarSign,
    bgColor: '#FEF3C7',
    color: '#92400E',
  },
  finance: {
    icon: TrendingUp,
    bgColor: '#FEF3C7',
    color: '#92400E',
  },
  economy: {
    icon: TrendingUp,
    bgColor: '#FEF3C7',
    color: '#92400E',
  },

  // Science
  science: {
    icon: Lightbulb,
    bgColor: '#DBEAFE',
    color: '#1E40AF',
  },
  research: {
    icon: Lightbulb,
    bgColor: '#DBEAFE',
    color: '#1E40AF',
  },

  // Politics
  politics: {
    icon: Globe,
    bgColor: '#FCE7F3',
    color: '#9F1239',
  },
  government: {
    icon: Globe,
    bgColor: '#FCE7F3',
    color: '#9F1239',
  },

  // Sports
  sports: {
    icon: Activity,
    bgColor: '#D1FAE5',
    color: '#065F46',
  },
  athletics: {
    icon: Activity,
    bgColor: '#D1FAE5',
    color: '#065F46',
  },

  // Entertainment
  entertainment: {
    icon: Palette,
    bgColor: '#F3E8FF',
    color: '#6B21A8',
  },
  arts: {
    icon: Palette,
    bgColor: '#F3E8FF',
    color: '#6B21A8',
  },
  culture: {
    icon: Palette,
    bgColor: '#F3E8FF',
    color: '#6B21A8',
  },

  // Health
  health: {
    icon: Activity,
    bgColor: '#DCFCE7',
    color: '#14532D',
  },
  wellness: {
    icon: Activity,
    bgColor: '#DCFCE7',
    color: '#14532D',
  },
  medicine: {
    icon: Activity,
    bgColor: '#DCFCE7',
    color: '#14532D',
  },

  // Energy
  energy: {
    icon: Zap,
    bgColor: '#FEF9C3',
    color: '#713F12',
  },

  // General/Default
  news: {
    icon: Newspaper,
    bgColor: '#F1F5F9',
    color: '#334155',
  },
  general: {
    icon: Newspaper,
    bgColor: '#F1F5F9',
    color: '#334155',
  },
  world: {
    icon: Globe,
    bgColor: '#E0E7FF',
    color: '#3730A3',
  },
};

// Default style for unknown categories
const defaultStyle: CategoryStyle = {
  icon: Newspaper,
  bgColor: '#F1F5F9',
  color: '#334155',
};

/**
 * Get the visual style for a category
 * @param categoryName - The name of the category (case-insensitive)
 * @returns CategoryStyle object with icon, background color, and text color
 */
export function getCategoryStyle(categoryName: string): CategoryStyle {
  if (!categoryName) {
    return defaultStyle;
  }

  // Normalize category name (lowercase, trim whitespace)
  const normalizedName = categoryName.toLowerCase().trim();

  // Try exact match first
  if (categoryStylesMap[normalizedName]) {
    return categoryStylesMap[normalizedName];
  }

  // Try partial match (e.g., "Technology News" should match "technology")
  for (const [key, style] of Object.entries(categoryStylesMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return style;
    }
  }

  // Return default style if no match found
  return defaultStyle;
}

/**
 * Get all available category styles
 * @returns Record of category names to styles
 */
export function getAllCategoryStyles(): Record<string, CategoryStyle> {
  return { ...categoryStylesMap };
}

/**
 * Add or update a category style
 * @param categoryName - The name of the category
 * @param style - The style configuration
 */
export function setCategoryStyle(categoryName: string, style: CategoryStyle): void {
  const normalizedName = categoryName.toLowerCase().trim();
  categoryStylesMap[normalizedName] = style;
}
