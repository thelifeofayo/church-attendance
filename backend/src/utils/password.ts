import bcrypt from 'bcryptjs';
import { config } from '../config';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { minLength, requireUppercase, requireNumber, requireSymbol } = config.password;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSymbol && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const symbols = '!@#$%^&*';
  let password = '';

  // Ensure requirements
  password += chars.charAt(Math.floor(Math.random() * 26)); // Uppercase
  password += chars.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
  password += chars.charAt(52 + Math.floor(Math.random() * 8)); // Number
  password += symbols.charAt(Math.floor(Math.random() * symbols.length)); // Symbol

  // Fill remaining length
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Shuffle
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
