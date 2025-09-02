import { PrismaClient } from '../../../../shared/generated/client';
declare const prisma: PrismaClient<{
    log: ("warn" | "error")[];
    errorFormat: "colorless";
    transactionOptions: {
        timeout: number;
    };
    datasources: {
        db: {
            url: string;
        };
    };
}, "warn" | "error", import("../../../../shared/generated/client/runtime/library").DefaultArgs>;
export { prisma };
export default prisma;
//# sourceMappingURL=prisma.d.ts.map