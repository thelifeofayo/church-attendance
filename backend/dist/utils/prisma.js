"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.prisma = global.prisma ||
    new client_1.PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
// Log queries in development
exports.prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        logger_1.logger.debug(`Query: ${e.query}`);
        logger_1.logger.debug(`Duration: ${e.duration}ms`);
    }
});
exports.prisma.$on('error', (e) => {
    logger_1.logger.error(`Prisma error: ${e.message}`);
});
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('Database connected successfully');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to database', error);
        process.exit(1);
    }
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
    logger_1.logger.info('Database disconnected');
}
//# sourceMappingURL=prisma.js.map