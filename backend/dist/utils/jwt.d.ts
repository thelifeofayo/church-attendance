import { Role } from 'shared';
export interface TokenPayload {
    userId: string;
    email: string;
    role: Role;
    teamId?: string | null;
    departmentId?: string | null;
}
export interface DecodedToken extends TokenPayload {
    iat: number;
    exp: number;
}
export declare function generateAccessToken(payload: TokenPayload): string;
export declare function generateRefreshToken(): string;
export declare function verifyAccessToken(token: string): DecodedToken | null;
export declare function decodeToken(token: string): DecodedToken | null;
export declare function getRefreshTokenExpiry(): Date;
//# sourceMappingURL=jwt.d.ts.map