/**
 * Validation schemas for form inputs and API requests
 * Using Zod for runtime type checking and validation
 */

import { z } from 'zod';

/**
 * Username validation
 * - Minimum 3 characters
 * - Maximum 30 characters
 * - Alphanumeric, underscores, and hyphens only
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(30, 'Username must not exceed 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  )
  .trim();

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .trim()
  .toLowerCase();

/**
 * Password validation
 * - Minimum 8 characters
 * - Maximum 128 characters
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters');

/**
 * Strong password validation (optional, for additional security)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const strongPasswordSchema = passwordSchema.regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
);

/**
 * Hex color validation
 * Supports both 3-digit and 6-digit hex colors
 */
export const hexColorSchema = z
  .string()
  .regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    'Please enter a valid hex color (e.g., #FF5733 or #F57)'
  );

/**
 * UUID validation
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * URL validation
 */
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .trim();

/**
 * RSS feed URL validation
 */
export const rssFeedUrlSchema = urlSchema.refine(
  (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  'RSS feed URL must use HTTP or HTTPS protocol'
);

/**
 * Form validation schemas
 */

/**
 * Update username form
 */
export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

/**
 * Update email form
 */
export const updateEmailSchema = z.object({
  newEmail: emailSchema,
});

/**
 * Update password form
 */
export const updatePasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Update avatar color form
 */
export const updateAvatarColorSchema = z.object({
  color: hexColorSchema,
});

/**
 * Update banner color form
 */
export const updateBannerColorSchema = z.object({
  color: hexColorSchema,
});

/**
 * Complete onboarding form
 */
export const completeOnboardingSchema = z.object({
  username: usernameSchema.optional(),
  categories: z.array(uuidSchema).min(1, 'Please select at least one category'),
});

/**
 * Login form
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Signup form
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Forgot password form
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password form
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Create/update source form (admin)
 */
export const sourceSchema = z.object({
  name: z.string().min(1, 'Source name is required').max(100),
  rss_url: rssFeedUrlSchema,
  category_id: uuidSchema,
  is_active: z.boolean().default(true),
  is_enabled: z.boolean().default(true),
});

/**
 * Create/update category form (admin)
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

/**
 * Create saved folder form
 */
export const savedFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(50),
  description: z.string().max(200).optional(),
  color: hexColorSchema,
});

/**
 * Create saved tag form
 */
export const savedTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(30),
  color: hexColorSchema,
});

/**
 * Comment creation form
 */
export const commentSchema = z.object({
  article_id: uuidSchema,
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must not exceed 1000 characters')
    .trim(),
});

/**
 * API request validation schemas
 */

/**
 * Trigger ingestion API request
 */
export const triggerIngestionSchema = z.object({
  triggered_by: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  batch_size: z.number().int().min(1).max(10).optional(),
  batch_offset: z.number().int().min(0).optional(),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Helper function to parse FormData with Zod schema
 */
export function parseFormData<T extends z.ZodType>(
  schema: T,
  formData: FormData
): z.infer<T> | { error: string } {
  try {
    // Convert FormData to plain object
    const data: Record<string, any> = {};

    // Get all keys from FormData (FormData doesn't have keys() in all TS versions)
    // Use entries() instead and collect unique keys
    const seenKeys = new Set<string>();
    const entries = Array.from(formData.entries());

    entries.forEach(([key]) => {
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const allValues = formData.getAll(key);

        // Handle arrays (e.g., multiple checkboxes with same name)
        if (key.endsWith('[]') || allValues.length > 1) {
          const cleanKey = key.replace('[]', '');
          data[cleanKey] = allValues;
        } else {
          data[key] = allValues[0];
        }
      }
    });

    // Parse with schema
    const result = schema.safeParse(data);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return { error: firstError.message };
    }

    return result.data;
  } catch (error) {
    return { error: 'Invalid form data' };
  }
}

/**
 * Helper function to validate data with Zod schema
 */
export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data);

    if (!result.success) {
      const firstError = result.error.issues[0];
      return { success: false, error: firstError.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Validation error' };
  }
}
