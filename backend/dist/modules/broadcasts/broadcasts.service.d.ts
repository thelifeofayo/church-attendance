import { Broadcast, BroadcastWithCreator, PaginatedResponse } from 'shared';
import { CreateBroadcastInput, ListBroadcastsQuery } from './broadcasts.schema';
import { TokenPayload } from '../../utils/jwt';
export declare class BroadcastsService {
    listBroadcasts(query: ListBroadcastsQuery, currentUser: TokenPayload): Promise<PaginatedResponse<BroadcastWithCreator>>;
    createBroadcast(input: CreateBroadcastInput, currentUser: TokenPayload): Promise<Broadcast>;
    sendBroadcast(id: string, currentUser: TokenPayload): Promise<Broadcast>;
    private getRecipients;
    deleteBroadcast(id: string, currentUser: TokenPayload): Promise<void>;
}
export declare const broadcastsService: BroadcastsService;
//# sourceMappingURL=broadcasts.service.d.ts.map