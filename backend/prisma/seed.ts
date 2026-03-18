import { PrismaClient, Role, ServiceType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create organisation (find or create)
  let org = await prisma.organisation.findFirst({ where: { name: 'Grace Community Church' } });
  if (!org) {
    org = await prisma.organisation.create({
      data: { name: 'Grace Community Church', timezone: 'Africa/Lagos' },
    });
  }
  console.log('Created organisation:', org.name);

  // Create service configs
  await prisma.serviceConfig.upsert({
    where: { organisationId_serviceType: { organisationId: org.id, serviceType: ServiceType.WEDNESDAY } },
    update: {},
    create: {
      organisationId: org.id,
      serviceType: ServiceType.WEDNESDAY,
      deadlineTime: '23:59',
      editWindowMinutes: 60,
      reminderMinutesBefore: 120,
    },
  });

  await prisma.serviceConfig.upsert({
    where: { organisationId_serviceType: { organisationId: org.id, serviceType: ServiceType.SUNDAY } },
    update: {},
    create: {
      organisationId: org.id,
      serviceType: ServiceType.SUNDAY,
      deadlineTime: '23:59',
      editWindowMinutes: 60,
      reminderMinutesBefore: 120,
    },
  });
  console.log('Created service configs');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@church.org' },
    update: {},
    create: {
      email: 'admin@church.org',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });
  console.log('Created admin user:', admin.email);

  // Create teams (find or create)
  const findOrCreateTeam = async (name: string) => {
    const existing = await prisma.team.findFirst({ where: { name, organisationId: org.id } });
    return existing ?? await prisma.team.create({ data: { name, organisationId: org.id } });
  };

  const worshipTeam = await findOrCreateTeam('Worship Team');
  const mediaTeam = await findOrCreateTeam('Media Team');
  const outreachTeam = await findOrCreateTeam('Outreach Team');
  void outreachTeam; // created but not further referenced
  console.log('Created teams:', worshipTeam.name, mediaTeam.name, outreachTeam.name);

  // Create Team Heads
  const teamHeadPassword = await bcrypt.hash('TeamHead@123', 12);

  const worshipHead = await prisma.user.upsert({
    where: { email: 'worship.head@church.org' },
    update: {},
    create: {
      email: 'worship.head@church.org',
      passwordHash: teamHeadPassword,
      firstName: 'David',
      lastName: 'Adeyemi',
      role: Role.TEAM_HEAD,
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
      role: Role.TEAM_HEAD,
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

  // Create departments (find or create)
  const findOrCreateDept = async (name: string, teamId: string) => {
    const existing = await prisma.department.findFirst({ where: { name, teamId } });
    return existing ?? await prisma.department.create({ data: { name, teamId } });
  };

  const choirDept = await findOrCreateDept('Choir', worshipTeam.id);
  const instrumentsDept = await findOrCreateDept('Instrumentalists', worshipTeam.id);
  const soundDept = await findOrCreateDept('Sound Engineering', mediaTeam.id);
  await findOrCreateDept('Visuals & Projection', mediaTeam.id);
  console.log('Created departments');

  // Create HODs
  const hodPassword = await bcrypt.hash('HOD@123', 12);

  const choirHOD = await prisma.user.upsert({
    where: { email: 'choir.hod@church.org' },
    update: {},
    create: {
      email: 'choir.hod@church.org',
      passwordHash: hodPassword,
      firstName: 'Mary',
      lastName: 'Johnson',
      role: Role.HOD,
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
      role: Role.HOD,
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
      role: Role.HOD,
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
    const existing = await prisma.member.findFirst({
      where: { firstName: member.firstName, lastName: member.lastName, departmentId: choirDept.id },
    });
    if (!existing) {
      await prisma.member.create({
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          departmentId: choirDept.id,
          createdById: choirHOD.id,
        },
      });
    }
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
    const existing = await prisma.member.findFirst({
      where: { firstName: member.firstName, lastName: member.lastName, departmentId: instrumentsDept.id },
    });
    if (!existing) {
      await prisma.member.create({
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          departmentId: instrumentsDept.id,
          createdById: instrumentsHOD.id,
        },
      });
    }
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
    const existing = await prisma.member.findFirst({
      where: { firstName: member.firstName, lastName: member.lastName, departmentId: soundDept.id },
    });
    if (!existing) {
      await prisma.member.create({
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          departmentId: soundDept.id,
          createdById: soundHOD.id,
        },
      });
    }
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
