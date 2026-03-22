import { Request, Response, NextFunction } from 'express';
import { Role } from 'shared';
export declare function requireRoles(...roles: Role[]): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireAdmin(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireAdminOrTeamHead(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireTeamHead(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireSubTeamHead(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireHOD(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireAssistantHOD(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireHODOrAssistant(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireAuthenticated(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireTeamScope(): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requireDepartmentScope(): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map