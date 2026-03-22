"use strict";
// ============================================
// Church Attendance System - Shared Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionStatus = exports.ServiceType = exports.Role = void 0;
// Enums
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["TEAM_HEAD"] = "TEAM_HEAD";
    Role["SUB_TEAM_HEAD"] = "SUB_TEAM_HEAD";
    Role["HOD"] = "HOD";
    Role["ASSISTANT_HOD"] = "ASSISTANT_HOD";
})(Role || (exports.Role = Role = {}));
var ServiceType;
(function (ServiceType) {
    ServiceType["WEDNESDAY"] = "WEDNESDAY";
    ServiceType["SUNDAY"] = "SUNDAY";
})(ServiceType || (exports.ServiceType = ServiceType = {}));
var SubmissionStatus;
(function (SubmissionStatus) {
    SubmissionStatus["NOT_STARTED"] = "NOT_STARTED";
    SubmissionStatus["SUBMITTED"] = "SUBMITTED";
    SubmissionStatus["NOT_SUBMITTED"] = "NOT_SUBMITTED";
    SubmissionStatus["LOCKED"] = "LOCKED";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
//# sourceMappingURL=index.js.map