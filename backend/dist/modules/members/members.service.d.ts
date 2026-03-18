import { Member, MemberWithRelations, PaginatedResponse } from 'shared';
import { CreateMemberInput, UpdateMemberInput, ListMembersQuery } from './members.schema';
import { TokenPayload } from '../../utils/jwt';
export declare class MembersService {
    listMembers(query: ListMembersQuery, currentUser: TokenPayload): Promise<PaginatedResponse<Member>>;
    getMemberById(id: string, currentUser: TokenPayload): Promise<MemberWithRelations>;
    createMember(input: CreateMemberInput, currentUser: TokenPayload): Promise<Member>;
    updateMember(id: string, input: UpdateMemberInput, currentUser: TokenPayload): Promise<Member>;
    deactivateMember(id: string, currentUser: TokenPayload): Promise<void>;
    reactivateMember(id: string, currentUser: TokenPayload): Promise<void>;
}
export declare const membersService: MembersService;
//# sourceMappingURL=members.service.d.ts.map