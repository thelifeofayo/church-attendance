"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uploads_controller_1 = require("./uploads.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});
// All routes require authentication
router.use(auth_1.authenticate);
// Only admins and team heads can upload images (for broadcasts)
router.post('/image', (0, rbac_1.requireTeamHead)(), // Team heads and admins can upload
upload.single('image'), uploads_controller_1.uploadsController.uploadImage);
exports.default = router;
//# sourceMappingURL=uploads.routes.js.map