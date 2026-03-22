import { Department, DepartmentWithRelations, PaginatedResponse } from 'shared';
import { CreateDepartmentInput, UpdateDepartmentInput, AssignHODInput, AssignAssistantHODInput, ListDepartmentsQuery } from './departments.schema';
import { TokenPayload } from '../../utils/jwt';
export declare class DepartmentsService {
    private ensureUserIsMember;
    listDepartments(query: ListDepartmentsQuery, currentUser: TokenPayload): Promise<PaginatedResponse<DepartmentWithRelations>>;
    getDepartmentById(id: string, currentUser: TokenPayload): Promise<DepartmentWithRelations>;
    createDepartment(input: CreateDepartmentInput, currentUser: TokenPayload): Promise<Department>;
    updateDepartment(id: string, input: UpdateDepartmentInput, currentUser: TokenPayload): Promise<Department>;
    assignHOD(id: string, input: AssignHODInput, currentUser: TokenPayload): Promise<Department>;
    assignAssistantHOD(id: string, input: AssignAssistantHODInput, currentUser: TokenPayload): Promise<Department>;
    deactivateDepartment(id: string, currentUser: TokenPayload): Promise<void>;
}
export declare const departmentsService: DepartmentsService;
//# sourceMappingURL=departments.service.d.ts.map