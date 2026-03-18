"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create organisation
    const org = await prisma.organisation.upsert({
        where: { id: 'org-1' },
        update: {},
        create: {
            id: 'org-1',
            name: 'Grace Community Church',
            timezone: 'Africa/Lagos',
        },
    });
    console.log('Created organisation:', org.name);
    // Create service configs
    await prisma.serviceConfig.upsert({
        where: { organisationId_serviceType: { organisationId: org.id, serviceType: client_1.ServiceType.WEDNESDAY } },
        update: {},
        create: {
            organisationId: org.id,
            serviceType: client_1.ServiceType.WEDNESDAY,
            deadlineTime: '23:59',
            editWindowMinutes: 60,
            reminderMinutesBefore: 120,
        },
    });
    await prisma.serviceConfig.upsert({
        where: { organisationId_serviceType: { organisationId: org.id, serviceType: client_1.ServiceType.SUNDAY } },
        update: {},
        create: {
            organisationId: org.id,
            serviceType: client_1.ServiceType.SUNDAY,
            deadlineTime: '23:59',
            editWindowMinutes: 60,
            reminderMinutesBefore: 120,
        },
    });
    console.log('Created service configs');
    // Create admin user
    const adminPasswordHash = await bcryptjs_1.default.hash('Admin@123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@church.org' },
        update: {},
        create: {
            email: 'admin@church.org',
            passwordHash: adminPasswordHash,
            firstName: 'System',
            lastName: 'Admin',
            role: client_1.Role.ADMIN,
        },
    });
    console.log('Created admin user:', admin.email);
    // Create teams
    const worshipTeam = await prisma.team.upsert({
        where: { id: 'team-worship' },
        update: {},
        create: {
            id: 'team-worship',
            name: 'Worship Team',
            organisationId: org.id,
        },
    });
    const mediaTeam = await prisma.team.upsert({
        where: { id: 'team-media' },
        update: {},
        create: {
            id: 'team-media',
            name: 'Media Team',
            organisationId: org.id,
        },
    });
    const outreachTeam = await prisma.team.upsert({
        where: { id: 'team-outreach' },
        update: {},
        create: {
            id: 'team-outreach',
            name: 'Outreach Team',
            organisationId: org.id,
        },
    });
    console.log('Created teams:', worshipTeam.name, mediaTeam.name, outreachTeam.name);
    // Create Team Heads
    const teamHeadPassword = await bcryptjs_1.default.hash('TeamHead@123', 12);
    const worshipHead = await prisma.user.upsert({
        where: { email: 'worship.head@church.org' },
        update: {},
        create: {
            email: 'worship.head@church.org',
            passwordHash: teamHeadPassword,
            firstName: 'David',
            lastName: 'Adeyemi',
            role: client_1.Role.TEAM_HEAD,
        },
    });
    const mediaHead = await prisma.user.upsert({
        where: { email: 'media.head@church.org' },
        update: {},
        create: {
            email: 'media.head@church.org',
            passwordHash: teamHeadPassword,
            firstName: 'Grace',
            lastName: 'Okonkwo',
            role: client_1.Role.TEAM_HEAD,
        },
    });
    // Assign team heads to teams
    await prisma.team.update({
        where: { id: worshipTeam.id },
        data: { teamHeadId: worshipHead.id },
    });
    await prisma.team.update({
        where: { id: mediaTeam.id },
        data: { teamHeadId: mediaHead.id },
    });
    console.log('Created and assigned Team Heads');
    // Create departments
    const choirDept = await prisma.department.upsert({
        where: { id: 'dept-choir' },
        update: {},
        create: {
            id: 'dept-choir',
            name: 'Choir',
            teamId: worshipTeam.id,
        },
    });
    const instrumentsDept = await prisma.department.upsert({
        where: { id: 'dept-instruments' },
        update: {},
        create: {
            id: 'dept-instruments',
            name: 'Instrumentalists',
            teamId: worshipTeam.id,
        },
    });
    const soundDept = await prisma.department.upsert({
        where: { id: 'dept-sound' },
        update: {},
        create: {
            id: 'dept-sound',
            name: 'Sound Engineering',
            teamId: mediaTeam.id,
        },
    });
    const visualsDept = await prisma.department.upsert({
        where: { id: 'dept-visuals' },
        update: {},
        create: {
            id: 'dept-visuals',
            name: 'Visuals & Projection',
            teamId: mediaTeam.id,
        },
    });
    console.log('Created departments');
    // Create HODs
    const hodPassword = await bcryptjs_1.default.hash('HOD@123', 12);
    const choirHOD = await prisma.user.upsert({
        where: { email: 'choir.hod@church.org' },
        update: {},
        create: {
            email: 'choir.hod@church.org',
            passwordHash: hodPassword,
            firstName: 'Mary',
            lastName: 'Johnson',
            role: client_1.Role.HOD,
        },
    });
    const instrumentsHOD = await prisma.user.upsert({
        where: { email: 'instruments.hod@church.org' },
        update: {},
        create: {
            email: 'instruments.hod@church.org',
            passwordHash: hodPassword,
            firstName: 'Peter',
            lastName: 'Okafor',
            role: client_1.Role.HOD,
        },
    });
    const soundHOD = await prisma.user.upsert({
        where: { email: 'sound.hod@church.org' },
        update: {},
        create: {
            email: 'sound.hod@church.org',
            passwordHash: hodPassword,
            firstName: 'James',
            lastName: 'Nwosu',
            role: client_1.Role.HOD,
        },
    });
    // Assign HODs to departments
    await prisma.department.update({
        where: { id: choirDept.id },
        data: { hodId: choirHOD.id },
    });
    await prisma.department.update({
        where: { id: instrumentsDept.id },
        data: { hodId: instrumentsHOD.id },
    });
    await prisma.department.update({
        where: { id: soundDept.id },
        data: { hodId: soundHOD.id },
    });
    console.log('Created and assigned HODs');
    // Create members for Choir department
    const choirMembers = [
        { firstName: 'Sarah', lastName: 'Adebayo' },
        { firstName: 'Michael', lastName: 'Eze' },
        { firstName: 'Blessing', lastName: 'Taiwo' },
        { firstName: 'Emmanuel', lastName: 'Okoro' },
        { firstName: 'Faith', lastName: 'Abiodun' },
        { firstName: 'Daniel', lastName: 'Chukwu' },
        { firstName: 'Joy', lastName: 'Adeleke' },
        { firstName: 'Samuel', lastName: 'Obi' },
    ];
    for (const member of choirMembers) {
        await prisma.member.upsert({
            where: { id: `member-choir-${member.firstName.toLowerCase()}` },
            update: {},
            create: {
                id: `member-choir-${member.firstName.toLowerCase()}`,
                firstName: member.firstName,
                lastName: member.lastName,
                departmentId: choirDept.id,
                createdById: choirHOD.id,
            },
        });
    }
    console.log(`Created ${choirMembers.length} choir members`);
    // Create members for Instrumentalists department
    const instrumentMembers = [
        { firstName: 'Joshua', lastName: 'Adekunle' },
        { firstName: 'Ruth', lastName: 'Emeka' },
        { firstName: 'Caleb', lastName: 'Obiora' },
        { firstName: 'Esther', lastName: 'Yakubu' },
        { firstName: 'David', lastName: 'Musa' },
    ];
    for (const member of instrumentMembers) {
        await prisma.member.upsert({
            where: { id: `member-inst-${member.firstName.toLowerCase()}` },
            update: {},
            create: {
                id: `member-inst-${member.firstName.toLowerCase()}`,
                firstName: member.firstName,
                lastName: member.lastName,
                departmentId: instrumentsDept.id,
                createdById: instrumentsHOD.id,
            },
        });
    }
    console.log(`Created ${instrumentMembers.length} instrumentalist members`);
    // Create members for Sound department
    const soundMembers = [
        { firstName: 'Paul', lastName: 'Ogundimu' },
        { firstName: 'Hannah', lastName: 'Balogun' },
        { firstName: 'Timothy', lastName: 'Nnamdi' },
        { firstName: 'Rebecca', lastName: 'Ojo' },
    ];
    for (const member of soundMembers) {
        await prisma.member.upsert({
            where: { id: `member-sound-${member.firstName.toLowerCase()}` },
            update: {},
            create: {
                id: `member-sound-${member.firstName.toLowerCase()}`,
                firstName: member.firstName,
                lastName: member.lastName,
                departmentId: soundDept.id,
                createdById: soundHOD.id,
            },
        });
    }
    console.log(`Created ${soundMembers.length} sound engineering members`);
    console.log('\n--- Seed completed successfully! ---');
    console.log('\nTest credentials:');
    console.log('Admin: admin@church.org / Admin@123');
    console.log('Team Head (Worship): worship.head@church.org / TeamHead@123');
    console.log('Team Head (Media): media.head@church.org / TeamHead@123');
    console.log('HOD (Choir): choir.hod@church.org / HOD@123');
    console.log('HOD (Instruments): instruments.hod@church.org / HOD@123');
    console.log('HOD (Sound): sound.hod@church.org / HOD@123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map