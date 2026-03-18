export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
};
export declare function generateTemporaryPassword(): string;
//# sourceMappingURL=password.d.ts.map