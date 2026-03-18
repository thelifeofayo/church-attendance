"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.decodeToken = decodeToken;
exports.getRefreshTokenExpiry = getRefreshTokenExpiry;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = require("../config");
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn,
    });
}
function generateRefreshToken() {
    return (0, uuid_1.v4)();
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
    }
    catch {
        return null;
    }
}
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch {
        return null;
    }
}
function getRefreshTokenExpiry() {
    const match = config_1.config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
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
    }[unit];
    return new Date(Date.now() + ms);
}
//# sourceMappingURL=jwt.js.map