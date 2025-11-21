#!/usr/bin/env ts-node
/**
 * Module Verification Tests
 * Tests that all new modules can be imported and function correctly
 */

// Test 1: Analytics Module
console.log('=== Test 1: Analytics Module ===');
try {
  const { analytics } = require('../lib/analytics');
  console.log('✓ Analytics module imported successfully');

  // Test trackLikeEvent exists
  if (typeof analytics.trackLikeEvent === 'function') {
    console.log('✓ trackLikeEvent function exists');
  } else {
    console.error('✗ trackLikeEvent function not found');
  }

  // Test other methods
  const methods = ['trackPageView', 'trackArticleRead', 'trackSaveEvent', 'trackShareEvent'];
  methods.forEach(method => {
    if (typeof (analytics as any)[method] === 'function') {
      console.log(`✓ ${method} function exists`);
    } else {
      console.error(`✗ ${method} function not found`);
    }
  });
} catch (error) {
  console.error('✗ Failed to import analytics module:', error);
}

// Test 2: Category Styles Module
console.log('\n=== Test 2: Category Styles Module ===');
try {
  const { getCategoryStyle } = require('../lib/category-styles');
  console.log('✓ Category styles module imported successfully');

  // Test with known categories
  const testCategories = ['Technology', 'Business', 'Science', 'Sports', 'Unknown Category'];
  testCategories.forEach(category => {
    const style = getCategoryStyle(category);
    if (style && style.icon && style.bgColor && style.color) {
      console.log(`✓ getCategoryStyle("${category}") returned valid style`);
    } else {
      console.error(`✗ getCategoryStyle("${category}") returned invalid style:`, style);
    }
  });
} catch (error) {
  console.error('✗ Failed to import category styles module:', error);
}

// Test 3: Reading Time Utilities
console.log('\n=== Test 3: Reading Time Utilities ===');
try {
  const {
    calculateReadingTime,
    formatReadingTime,
    shouldShowReadingTime,
    getReadingTimeInfo
  } = require('../lib/utils/reading-time');
  console.log('✓ Reading time module imported successfully');

  // Test calculateReadingTime
  const shortText = 'This is a short article with just a few words.';
  const longText = 'This is a much longer article. '.repeat(100); // ~500 words

  const shortTime = calculateReadingTime(shortText);
  const longTime = calculateReadingTime(longText);

  if (shortTime === 1 && longTime > 1) {
    console.log('✓ calculateReadingTime works correctly');
    console.log(`  Short text: ${shortTime} min, Long text: ${longTime} min`);
  } else {
    console.error('✗ calculateReadingTime returned unexpected values:', { shortTime, longTime });
  }

  // Test formatReadingTime
  const formatted = formatReadingTime(5);
  if (formatted === '5 min read') {
    console.log('✓ formatReadingTime works correctly');
  } else {
    console.error('✗ formatReadingTime returned unexpected value:', formatted);
  }

  // Test shouldShowReadingTime
  const shouldShow = shouldShowReadingTime(longText);
  if (shouldShow === true) {
    console.log('✓ shouldShowReadingTime works correctly');
  } else {
    console.error('✗ shouldShowReadingTime returned unexpected value:', shouldShow);
  }

  // Test getReadingTimeInfo
  const info = getReadingTimeInfo(longText);
  if (info && info.minutes && info.formatted && info.wordCount) {
    console.log('✓ getReadingTimeInfo works correctly');
    console.log(`  Word count: ${info.wordCount}, Time: ${info.formatted}`);
  } else {
    console.error('✗ getReadingTimeInfo returned invalid data:', info);
  }
} catch (error) {
  console.error('✗ Failed to import reading time module:', error);
}

// Test 4: Database Types
console.log('\n=== Test 4: Database Types ===');
try {
  const types = require('../lib/types/database');
  console.log('✓ Database types module imported successfully');

  // Check that types are exported (TypeScript only, not runtime)
  console.log('  Note: Type checking happens at compile time, not runtime');
} catch (error) {
  console.error('✗ Failed to import database types:', error);
}

// Test 5: Validation Schemas
console.log('\n=== Test 5: Validation Schemas ===');
try {
  const {
    usernameSchema,
    emailSchema,
    passwordSchema,
    hexColorSchema,
    validate
  } = require('../lib/validation/schemas');
  console.log('✓ Validation schemas module imported successfully');

  // Test username validation
  const validUsername = validate(usernameSchema, 'testuser123');
  const invalidUsername = validate(usernameSchema, 'ab');

  if (validUsername.success && !invalidUsername.success) {
    console.log('✓ Username validation works correctly');
  } else {
    console.error('✗ Username validation failed:', { validUsername, invalidUsername });
  }

  // Test email validation
  const validEmail = validate(emailSchema, 'test@example.com');
  const invalidEmail = validate(emailSchema, 'notanemail');

  if (validEmail.success && !invalidEmail.success) {
    console.log('✓ Email validation works correctly');
  } else {
    console.error('✗ Email validation failed:', { validEmail, invalidEmail });
  }

  // Test password validation
  const validPassword = validate(passwordSchema, 'SecurePassword123');
  const invalidPassword = validate(passwordSchema, 'short');

  if (validPassword.success && !invalidPassword.success) {
    console.log('✓ Password validation works correctly');
  } else {
    console.error('✗ Password validation failed:', { validPassword, invalidPassword });
  }

  // Test hex color validation
  const validColor = validate(hexColorSchema, '#FF5733');
  const invalidColor = validate(hexColorSchema, 'FF5733');

  if (validColor.success && !invalidColor.success) {
    console.log('✓ Hex color validation works correctly');
  } else {
    console.error('✗ Hex color validation failed:', { validColor, invalidColor });
  }
} catch (error) {
  console.error('✗ Failed to import validation schemas:', error);
}

// Test 6: Environment Validation
console.log('\n=== Test 6: Environment Validation ===');
try {
  const { getClientEnv } = require('../lib/env');
  console.log('✓ Environment validation module imported successfully');

  const env = getClientEnv();
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('✓ Environment variables loaded');
  } else {
    console.warn('⚠ Environment variables not fully configured (expected in test environment)');
  }
} catch (error) {
  console.error('✗ Failed to import environment validation:', error);
}

console.log('\n=== Test Summary ===');
console.log('All module import and functionality tests completed.');
console.log('Check output above for any ✗ failures.');
