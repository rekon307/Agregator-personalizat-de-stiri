import { describe, it, expect } from 'vitest';
import {
  validate,
  usernameSchema,
  emailSchema,
  passwordSchema,
  hexColorSchema,
  updateUsernameSchema,
  updatePasswordSchema,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('usernameSchema', () => {
    it('should accept valid usernames', () => {
      const validUsernames = ['user123', 'john_doe', 'test-user', 'a'.repeat(30)];
      validUsernames.forEach((username) => {
        const result = validate(usernameSchema, username);
        expect(result.success).toBe(true);
      });
    });

    it('should reject usernames that are too short', () => {
      const result = validate(usernameSchema, 'ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least 3');
      }
    });

    it('should reject usernames that are too long', () => {
      const result = validate(usernameSchema, 'a'.repeat(31));
      expect(result.success).toBe(false);
    });

    it('should reject usernames with special characters', () => {
      const invalidUsernames = ['user@name', 'test user', 'user#123', 'user$money'];
      invalidUsernames.forEach((username) => {
        const result = validate(usernameSchema, username);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      const validEmails = ['test@example.com', 'user.name@example.co.uk', 'user+tag@example.com'];
      validEmails.forEach((email) => {
        const result = validate(emailSchema, email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = ['notanemail', '@example.com', 'user@', 'user @example.com'];
      invalidEmails.forEach((email) => {
        const result = validate(emailSchema, email);
        expect(result.success).toBe(false);
      });
    });

    it('should convert email to lowercase', () => {
      const result = validate(emailSchema, 'TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid passwords', () => {
      const validPasswords = ['password123', 'VerySecureP@ssw0rd', 'a'.repeat(128)];
      validPasswords.forEach((password) => {
        const result = validate(passwordSchema, password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject passwords that are too short', () => {
      const result = validate(passwordSchema, 'short');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('at least 8');
      }
    });

    it('should reject passwords that are too long', () => {
      const result = validate(passwordSchema, 'a'.repeat(129));
      expect(result.success).toBe(false);
    });
  });

  describe('hexColorSchema', () => {
    it('should accept valid hex colors', () => {
      const validColors = ['#FF5733', '#fff', '#000000', '#AbC'];
      validColors.forEach((color) => {
        const result = validate(hexColorSchema, color);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid hex colors', () => {
      const invalidColors = ['FF5733', '#GG5733', '#12', '#1234567', 'red'];
      invalidColors.forEach((color) => {
        const result = validate(hexColorSchema, color);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updatePasswordSchema', () => {
    it('should accept matching passwords', () => {
      const result = validate(updatePasswordSchema, {
        newPassword: 'password123',
        confirmPassword: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const result = validate(updatePasswordSchema, {
        newPassword: 'password123',
        confirmPassword: 'different',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('do not match');
      }
    });
  });
});
