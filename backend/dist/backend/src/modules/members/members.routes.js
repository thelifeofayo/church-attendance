"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const members_controller_1 = require("./members.controller");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const validate_1 = require("../../middleware/validate");
const members_schema_1 = require("./members.schema");
const router = (0, express_1.Router)();
// All routes require authentication and HOD role
router.use(auth_1.authenticate);
router.use((0, rbac_1.requireHOD)());
router.get('/', (0, validate_1.validate)({ query: members_schema_1.listMembersQuerySchema }), members_controller_1.membersController.list);
router.get('/:id', (0, validate_1.validate)({ params: members_schema_1.memberIdParamSchema }), members_controller_1.membersController.getById);
router.post('/', (0, validate_1.validate)({ body: members_schema_1.createMemberSchema }), members_controller_1.membersController.create);
router.patch('/:id', (0, validate_1.validate)({ params: members_schema_1.memberIdParamSchema, body: members_schema_1.updateMemberSchema }), members_controller_1.membersController.update);
router.delete('/:id', (0, validate_1.validate)({ params: members_schema_1.memberIdParamSchema }), members_controller_1.membersController.deactivate);
router.post('/:id/reactivate', (0, validate_1.validate)({ params: members_schema_1.memberIdParamSchema }), members_controller_1.membersController.reactivate);
exports.default = router;
//# sourceMappingURL=members.routes.js.map