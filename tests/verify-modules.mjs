/**
 * Module Verification Tests (ESM)
 * Tests that all new modules can be imported and function correctly
 */

import { analytics } from '../lib/analytics.ts';
import { getCategoryStyle } from '../lib/category-styles.ts';
import {
  calculateReadingTime,
  formatReadingTime,
  shouldShowReadingTime,
  getReadingTimeInfo
} from '../lib/utils/reading-time.ts';
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  hexColorSchema,
  validate
} from '../lib/validation/schemas.ts';

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✓ ${name}`);
    if (details) console.log(`  ${details}`);
    passCount++;
  } else {
    console.error(`✗ ${name}`);
    if (details) console.error(`  ${details}`);
    failCount++;
  }
}

console.log('=== Module Verification Tests ===\n');

// Test 1: Analytics Module
console.log('Test 1: Analytics Module');
test('Analytics module imported', typeof analytics === 'object');
test('trackLikeEvent exists', typeof analytics.trackLikeEvent === 'function');
test('trackPageView exists', typeof analytics.trackPageView === 'function');
test('trackArticleRead exists', typeof analytics.trackArticleRead === 'function');

// Test 2: Category Styles
console.log('\nTest 2: Category Styles Module');
const techStyle = getCategoryStyle('Technology');
test('getCategoryStyle returns object', typeof techStyle === 'object');
test('Style has icon', typeof techStyle.icon === 'function');
test('Style has bgColor', typeof techStyle.bgColor === 'string');
test('Style has color', typeof techStyle.color === 'string');
test('Unknown category gets default', getCategoryStyle('UnknownXYZ').bgColor === '#F1F5F9');

// Test 3: Reading Time
console.log('\nTest 3: Reading Time Utilities');
const shortText = 'Short article.';
const longText = 'Long article text. '.repeat(100);

const shortTime = calculateReadingTime(shortText);
const longTime = calculateReadingTime(longText);

test('Short text = 1 min', shortTime === 1);
test('Long text > 1 min', longTime > 1, `Got ${longTime} minutes`);
test('formatReadingTime works', formatReadingTime(5) === '5 min read');
test('shouldShowReadingTime works', shouldShowReadingTime(longText) === true);

const info = getReadingTimeInfo(longText);
test('getReadingTimeInfo returns data', info.wordCount > 0, `${info.wordCount} words, ${info.formatted}`);

// Test 4: Validation Schemas
console.log('\nTest 4: Validation Schemas');

const validUsername = validate(usernameSchema, 'testuser123');
const invalidUsername = validate(usernameSchema, 'ab');
test('Valid username passes', validUsername.success === true);
test('Invalid username fails', invalidUsername.success === false);

const validEmail = validate(emailSchema, 'test@example.com');
const invalidEmail = validate(emailSchema, 'notanemail');
test('Valid email passes', validEmail.success === true);
test('Invalid email fails', invalidEmail.success === false);

const validPassword = validate(passwordSchema, 'SecurePassword123');
const invalidPassword = validate(passwordSchema, 'short');
test('Valid password passes', validPassword.success === true);
test('Invalid password fails', invalidPassword.success === false);

const validColor = validate(hexColorSchema, '#FF5733');
const invalidColor = validate(hexColorSchema, 'FF5733');
test('Valid hex color passes', validColor.success === true);
test('Invalid hex color fails', invalidColor.success === false);

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${passCount + failCount}`);

if (failCount === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`\n❌ ${failCount} test(s) failed!`);
  process.exit(1);
}
