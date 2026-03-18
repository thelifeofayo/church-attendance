"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function validate(schemas) {
    return async (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = {};
                error.errors.forEach((err) => {
                    const path = err.path.join('.');
                    if (!details[path]) {
                        details[path] = [];
                    }
                    details[path].push(err.message);
                });
                next(new errors_1.ValidationError(details));
            }
            else {
                next(error);
            }
        }
    };
}
//# sourceMappingURL=validate.js.map