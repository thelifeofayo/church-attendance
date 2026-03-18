import { z } from 'zod';
export declare const createBroadcastSchema: z.ZodObject<{
    subject: z.ZodString;
    body: z.ZodString;
    recipientType: z.ZodEnum<["all", "admins", "team_heads", "hods", "members", "custom"]>;
    teamIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    subject: string;
    body: string;
    recipientType: "all" | "admins" | "team_heads" | "hods" | "members" | "custom";
    teamIds?: string[] | undefined;
}, {
    subject: string;
    body: string;
    recipientType: "all" | "admins" | "team_heads" | "hods" | "members" | "custom";
    teamIds?: string[] | undefined;
}>;
export declare const listBroadcastsQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "sending", "sent", "failed"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "sent" | "failed" | "draft" | "sending" | undefined;
}, {
    status?: "sent" | "failed" | "draft" | "sending" | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
export declare const broadcastIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export type ListBroadcastsQuery = z.infer<typeof listBroadcastsQuerySchema>;
//# sourceMappingURL=broadcasts.schema.d.ts.map