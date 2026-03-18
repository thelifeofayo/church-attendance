"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const broadcasts_controller_1 = require("./broadcasts.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const broadcasts_schema_1 = require("./broadcasts.schema");
const router = (0, express_1.Router)();
// All routes require authentication and Admin or Team Head role
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireAdminOrTeamHead)());
router.get('/', (0, validate_1.validate)({ query: broadcasts_schema_1.listBroadcastsQuerySchema }), broadcasts_controller_1.broadcastsController.list);
router.post('/', (0, validate_1.validate)({ body: broadcasts_schema_1.createBroadcastSchema }), broadcasts_controller_1.broadcastsController.create);
router.post('/:id/send', (0, validate_1.validate)({ params: broadcasts_schema_1.broadcastIdParamSchema }), broadcasts_controller_1.broadcastsController.send);
router.delete('/:id', (0, validate_1.validate)({ params: broadcasts_schema_1.broadcastIdParamSchema }), broadcasts_controller_1.broadcastsController.delete);
exports.default = router;
//# sourceMappingURL=broadcasts.routes.js.map