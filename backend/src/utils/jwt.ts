import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
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

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, config.jwt.secret) as DecodedToken;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

export function getRefreshTokenExpiry(): Date {
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
  if (!match) {
    // Default to 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  const [, value, unit] = match;
  const ms = parseInt(value, 10) * {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit as 's' | 'm' | 'h' | 'd']!;

  return new Date(Date.now() + ms);
}
