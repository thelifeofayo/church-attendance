"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const users_schema_1 = require("./users.schema");
const router = (0, express_1.Router)();
// All routes require authentication and Admin/Team Head role
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireAdminOrTeamHead)());
router.get('/', (0, validate_1.validate)({ query: users_schema_1.listUsersQuerySchema }), users_controller_1.usersController.list);
router.get('/:id', (0, validate_1.validate)({ params: users_schema_1.userIdParamSchema }), users_controller_1.usersController.getById);
router.post('/', (0, validate_1.validate)({ body: users_schema_1.createUserSchema }), users_controller_1.usersController.create);
router.patch('/:id', (0, validate_1.validate)({ params: users_schema_1.userIdParamSchema, body: users_schema_1.updateUserSchema }), users_controller_1.usersController.update);
router.delete('/:id', (0, validate_1.validate)({ params: users_schema_1.userIdParamSchema }), users_controller_1.usersController.deactivate);
exports.default = router;
//# sourceMappingURL=users.routes.js.map