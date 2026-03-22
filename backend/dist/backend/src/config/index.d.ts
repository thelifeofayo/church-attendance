export declare const config: {
    readonly port: number;
    readonly nodeEnv: string;
    readonly databaseUrl: string;
    readonly jwt: {
        readonly secret: string;
        readonly refreshSecret: string;
        readonly expiresIn: string;
        readonly refreshExpiresIn: string;
    };
    readonly frontendUrl: string;
    readonly defaultTimezone: string;
    readonly sessionInactivityMs: number;
    readonly password: {
        readonly minLength: 8;
        readonly requireUppercase: true;
        readonly requireNumber: true;
        readonly requireSymbol: true;
    };
    readonly attendance: {
        readonly defaultDeadlineTime: "23:59";
        readonly defaultEditWindowMinutes: 60;
        readonly defaultReminderMinutesBefore: 120;
    };
    readonly rateLimit: {
        readonly windowMs: number;
        readonly max: 100;
        readonly authMax: 10;
    };
    readonly email: {
        readonly host: string;
        readonly port: number;
        readonly user: string;
        readonly pass: string;
        readonly from: string;
    };
    readonly passwordReset: {
        readonly delivery: "email" | "token";
    };
    readonly cloudinary: {
        readonly cloudName: string;
        readonly apiKey: string;
        readonly apiSecret: string;
    };
};
export declare function validateConfig(): void;
//# sourceMappingURL=index.d.ts.map