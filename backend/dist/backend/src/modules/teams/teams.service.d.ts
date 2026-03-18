import { Team, TeamWithRelations, PaginatedResponse } from 'shared';
import { CreateTeamInput, UpdateTeamInput, ListTeamsQuery } from './teams.schema';
import { TokenPayload } from '../../utils/jwt';
export declare class TeamsService {
    private getOrCreateOrganisation;
    listTeams(query: ListTeamsQuery, currentUser: TokenPayload): Promise<PaginatedResponse<TeamWithRelations>>;
    getTeamById(id: string, currentUser: TokenPayload): Promise<TeamWithRelations>;
    createTeam(input: CreateTeamInput, currentUser: TokenPayload): Promise<Team>;
    updateTeam(id: string, input: UpdateTeamInput, currentUser: TokenPayload): Promise<Team>;
    deactivateTeam(id: string, currentUser: TokenPayload): Promise<void>;
}
export declare const teamsService: TeamsService;
//# sourceMappingURL=teams.service.d.ts.map