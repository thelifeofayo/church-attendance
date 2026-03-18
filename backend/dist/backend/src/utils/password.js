"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.validatePasswordStrength = validatePasswordStrength;
exports.generateTemporaryPassword = generateTemporaryPassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function validatePasswordStrength(password) {
    const errors = [];
    const { minLength, requireUppercase, requireNumber, requireSymbol } = config_1.config.password;
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
function generateTemporaryPassword() {
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
//# sourceMappingURL=password.js.map