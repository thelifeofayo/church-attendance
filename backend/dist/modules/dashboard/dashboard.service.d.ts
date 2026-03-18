import { HODDashboardData, TeamHeadDashboardData, AdminDashboardData } from 'shared';
import { TokenPayload } from '../../utils/jwt';
export declare class DashboardService {
    private getWeekBounds;
    getHODDashboard(currentUser: TokenPayload): Promise<HODDashboardData>;
    getTeamHeadDashboard(currentUser: TokenPayload): Promise<TeamHeadDashboardData>;
    getAdminDashboard(_currentUser: TokenPayload): Promise<AdminDashboardData>;
}
export declare const dashboardService: DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map