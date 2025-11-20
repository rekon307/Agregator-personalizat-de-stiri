/**
 * Environment variable validation
 * Validates and provides type-safe access to environment variables
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Site configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('NEXT_PUBLIC_SITE_URL must be a valid URL').optional(),

  // Cron secret for automated ingestion
  CRON_SECRET: z.string().min(1, 'CRON_SECRET is required').optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Server-only environment variables
const serverEnvSchema = envSchema.extend({
  // Add any server-only environment variables here
});

// Client-safe environment variables (only NEXT_PUBLIC_* should be here)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

/**
 * Validate environment variables
 * @param isServer - Whether validation is running on the server
 * @throws Error if validation fails
 */
export function validateEnv(isServer: boolean = typeof window === 'undefined') {
  try {
    if (isServer) {
      // Server-side validation
      const parsed = serverEnvSchema.safeParse(process.env);

      if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        throw new Error(
          `Invalid environment variables:\n${parsed.error.issues
            .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
            .join('\n')}`
        );
      }

      return parsed.data;
    } else {
      // Client-side validation (only public variables)
      const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      };

      const parsed = clientEnvSchema.safeParse(clientEnv);

      if (!parsed.success) {
        console.error('❌ Invalid client environment variables:', parsed.error.format());
        throw new Error(
          `Invalid client environment variables:\n${parsed.error.issues
            .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
            .join('\n')}`
        );
      }

      return parsed.data;
    }
  } catch (error) {
    console.error('Environment validation error:', error);
    throw error;
  }
}

/**
 * Get validated server environment variables
 * Only use this on the server side
 */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() can only be called on the server');
  }

  return validateEnv(true);
}

/**
 * Get validated client environment variables
 * Safe to use on both client and server
 */
export function getClientEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

// Type exports for TypeScript
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// Validate on module load in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnv();
  } catch (error) {
    console.warn('⚠️  Environment validation failed during module load:', error);
  }
}
