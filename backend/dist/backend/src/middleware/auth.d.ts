import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/jwt';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload & {
                teamId?: string | null;
                departmentId?: string | null;
            };
        }
    }
}
export declare function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void>;
export declare function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map