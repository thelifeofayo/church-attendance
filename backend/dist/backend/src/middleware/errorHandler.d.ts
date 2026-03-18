import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from 'shared';
export declare function errorHandler(error: Error, _req: Request, res: Response<ApiResponse<never>>, _next: NextFunction): void;
export declare function notFoundHandler(_req: Request, res: Response<ApiResponse<never>>): void;
//# sourceMappingURL=errorHandler.d.ts.map