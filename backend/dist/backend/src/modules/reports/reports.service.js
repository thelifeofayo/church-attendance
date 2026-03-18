"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = exports.ReportsService = void 0;
const prisma_1 = require("../../utils/prisma");
const shared_1 = require("shared");
const pdfkit_1 = __importDefault(require("pdfkit"));
// Helper to format date with day of week (e.g., "Sunday, 22nd March 2026")
function formatDateWithDay(date) {
    const day = date.getDate();
    const ordinal = getOrdinalSuffix(day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${weekday}, ${day}${ordinal} ${month} ${year}`;
}
function getOrdinalSuffix(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
class ReportsService {
    getWeekBounds(weekStart) {
        const start = new Date(weekStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        const wednesday = new Date(start);
        wednesday.setDate(start.getDate() + 2);
        const sunday = new Date(start);
        sunday.setDate(start.getDate() + 6);
        return { start, end, wednesday, sunday };
    }
    async getWeeklyReport(query) {
        const { weekStart, serviceType, teamId } = query;
        const week = this.getWeekBounds(weekStart);
        // Build filter
        const teamWhere = teamId ? { id: teamId, isActive: true } : { isActive: true };
        // Get teams with departments
        const teams = await prisma_1.prisma.team.findMany({
            where: teamWhere,
            include: {
                teamHead: { select: { firstName: true, lastName: true } },
                departments: {
                    where: { isActive: true },
                    include: {
                        hod: { select: { firstName: true, lastName: true } },
                        _count: { select: { members: { where: { isActive: true } } } },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        // Get attendance records
        const recordWhere = {
            department: { isActive: true },
            serviceDate: { gte: week.start, lte: week.end },
        };
        if (teamId) {
            recordWhere.department = { teamId, isActive: true };
        }
        if (serviceType) {
            recordWhere.serviceType = serviceType;
        }
        const records = await prisma_1.prisma.attendanceRecord.findMany({
            where: recordWhere,
            include: {
                department: { select: { id: true, teamId: true } },
                _count: { select: { entries: { where: { isPresent: true } } } },
                entries: {
                    select: {
                        isPresent: true,
                        absenceReason: true,
                        member: { select: { firstName: true, lastName: true } },
                    },
                },
            },
        });
        // Build report data
        const reportTeams = teams.map((team) => {
            const teamRecords = records.filter((r) => team.departments.some((d) => d.id === r.departmentId));
            const departments = team.departments.map((dept) => {
                const wedRec = teamRecords.find((r) => r.departmentId === dept.id && r.serviceType === shared_1.ServiceType.WEDNESDAY);
                const sunRec = teamRecords.find((r) => r.departmentId === dept.id && r.serviceType === shared_1.ServiceType.SUNDAY);
                const buildDetail = (rec) => {
                    if (!rec)
                        return null;
                    const present = rec._count.entries;
                    const absent = dept._count.members - present;
                    const absentMembers = rec.entries
                        .filter((e) => !e.isPresent)
                        .map((e) => ({
                        name: `${e.member.firstName} ${e.member.lastName}`,
                        reason: e.absenceReason,
                    }));
                    return {
                        status: rec.status,
                        present,
                        absent,
                        percentage: dept._count.members > 0 ? Math.round((present / dept._count.members) * 100) : 0,
                        absentMembers,
                    };
                };
                return {
                    departmentName: dept.name,
                    hodName: dept.hod ? `${dept.hod.firstName} ${dept.hod.lastName}` : null,
                    memberCount: dept._count.members,
                    wednesday: serviceType === shared_1.ServiceType.SUNDAY ? null : buildDetail(wedRec),
                    sunday: serviceType === shared_1.ServiceType.WEDNESDAY ? null : buildDetail(sunRec),
                };
            });
            // Team totals
            const teamMemberCount = team.departments.reduce((sum, d) => sum + d._count.members, 0);
            const wedRecords = teamRecords.filter((r) => r.serviceType === shared_1.ServiceType.WEDNESDAY);
            const sunRecords = teamRecords.filter((r) => r.serviceType === shared_1.ServiceType.SUNDAY);
            const wedPresent = wedRecords.reduce((sum, r) => sum + r._count.entries, 0);
            const sunPresent = sunRecords.reduce((sum, r) => sum + r._count.entries, 0);
            return {
                teamName: team.name,
                teamHeadName: team.teamHead ? `${team.teamHead.firstName} ${team.teamHead.lastName}` : null,
                departments,
                totals: {
                    wednesday: serviceType === shared_1.ServiceType.SUNDAY ? null : {
                        expected: teamMemberCount,
                        present: wedPresent,
                        percentage: teamMemberCount > 0 ? Math.round((wedPresent / teamMemberCount) * 100) : 0,
                    },
                    sunday: serviceType === shared_1.ServiceType.WEDNESDAY ? null : {
                        expected: teamMemberCount,
                        present: sunPresent,
                        percentage: teamMemberCount > 0 ? Math.round((sunPresent / teamMemberCount) * 100) : 0,
                    },
                },
            };
        });
        // Overall summary
        const totalMembers = teams.reduce((sum, t) => sum + t.departments.reduce((s, d) => s + d._count.members, 0), 0);
        const totalDepts = teams.reduce((sum, t) => sum + t.departments.length, 0);
        const wedRecords = records.filter((r) => r.serviceType === shared_1.ServiceType.WEDNESDAY);
        const sunRecords = records.filter((r) => r.serviceType === shared_1.ServiceType.SUNDAY);
        const buildSummary = (recs, date) => {
            if (recs.length === 0 && serviceType && serviceType !== (date === week.wednesday ? shared_1.ServiceType.WEDNESDAY : shared_1.ServiceType.SUNDAY)) {
                return null;
            }
            const totalPresent = recs.reduce((sum, r) => sum + r._count.entries, 0);
            const submitted = recs.filter((r) => r.status === shared_1.SubmissionStatus.SUBMITTED).length;
            return {
                serviceDate: formatDateWithDay(date),
                totalExpected: totalMembers,
                totalPresent,
                attendancePercentage: totalMembers > 0 ? Math.round((totalPresent / totalMembers) * 100) : 0,
                submittedCount: submitted,
                totalDepartments: totalDepts,
            };
        };
        return {
            weekStart: formatDateWithDay(week.start),
            weekEnd: formatDateWithDay(week.end),
            generatedAt: new Date().toISOString(),
            summary: {
                wednesday: serviceType === shared_1.ServiceType.SUNDAY ? null : buildSummary(wedRecords, week.wednesday),
                sunday: serviceType === shared_1.ServiceType.WEDNESDAY ? null : buildSummary(sunRecords, week.sunday),
            },
            teams: reportTeams,
        };
    }
    async generatePDF(query) {
        const report = await this.getWeeklyReport(query);
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default({ margin: 50, size: 'A4', layout: 'landscape' });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            // Title
            doc.fontSize(20).text('Church Attendance Report', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Week: ${report.weekStart} to ${report.weekEnd}`, { align: 'center' });
            doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);
            // Summary
            doc.fontSize(14).text('Summary', { underline: true });
            doc.moveDown(0.5);
            if (report.summary.wednesday) {
                doc.fontSize(10).text(`Wednesday (${report.summary.wednesday.serviceDate}):`);
                doc.text(`  Total Present: ${report.summary.wednesday.totalPresent} / ${report.summary.wednesday.totalExpected} (${report.summary.wednesday.attendancePercentage}%)`);
                doc.text(`  Submissions: ${report.summary.wednesday.submittedCount} / ${report.summary.wednesday.totalDepartments}`);
                doc.moveDown(0.5);
            }
            if (report.summary.sunday) {
                doc.fontSize(10).text(`Sunday (${report.summary.sunday.serviceDate}):`);
                doc.text(`  Total Present: ${report.summary.sunday.totalPresent} / ${report.summary.sunday.totalExpected} (${report.summary.sunday.attendancePercentage}%)`);
                doc.text(`  Submissions: ${report.summary.sunday.submittedCount} / ${report.summary.sunday.totalDepartments}`);
                doc.moveDown(0.5);
            }
            doc.moveDown();
            // Team breakdown
            for (const team of report.teams) {
                doc.addPage();
                doc.fontSize(14).text(`Team: ${team.teamName}`, { underline: true });
                if (team.teamHeadName) {
                    doc.fontSize(10).text(`Team Head: ${team.teamHeadName}`);
                }
                doc.moveDown();
                // Table header
                const tableTop = doc.y;
                const col1 = 50;
                const col2 = 200;
                const col3 = 280;
                const col4 = 360;
                const col5 = 440;
                const col6 = 520;
                const col7 = 600;
                const col8 = 680;
                doc.fontSize(9);
                doc.text('Department', col1, tableTop, { width: 140 });
                doc.text('HOD', col2, tableTop, { width: 70 });
                doc.text('Members', col3, tableTop, { width: 70 });
                if (report.summary.wednesday) {
                    doc.text('Wed Status', col4, tableTop, { width: 70 });
                    doc.text('Wed Present', col5, tableTop, { width: 70 });
                }
                if (report.summary.sunday) {
                    doc.text('Sun Status', col6, tableTop, { width: 70 });
                    doc.text('Sun Present', col7, tableTop, { width: 70 });
                }
                doc.moveDown();
                doc.moveTo(col1, doc.y).lineTo(750, doc.y).stroke();
                doc.moveDown(0.5);
                // Table rows
                for (const dept of team.departments) {
                    const rowY = doc.y;
                    doc.text(dept.departmentName, col1, rowY, { width: 140 });
                    doc.text(dept.hodName || '-', col2, rowY, { width: 70 });
                    doc.text(dept.memberCount.toString(), col3, rowY, { width: 70 });
                    if (dept.wednesday) {
                        doc.text(dept.wednesday.status, col4, rowY, { width: 70 });
                        doc.text(`${dept.wednesday.present} (${dept.wednesday.percentage}%)`, col5, rowY, { width: 70 });
                    }
                    else if (report.summary.wednesday) {
                        doc.text('-', col4, rowY, { width: 70 });
                        doc.text('-', col5, rowY, { width: 70 });
                    }
                    if (dept.sunday) {
                        doc.text(dept.sunday.status, col6, rowY, { width: 70 });
                        doc.text(`${dept.sunday.present} (${dept.sunday.percentage}%)`, col7, rowY, { width: 70 });
                    }
                    else if (report.summary.sunday) {
                        doc.text('-', col6, rowY, { width: 70 });
                        doc.text('-', col7, rowY, { width: 70 });
                    }
                    doc.moveDown();
                }
                // Team totals
                doc.moveDown(0.5);
                doc.moveTo(col1, doc.y).lineTo(750, doc.y).stroke();
                doc.moveDown(0.5);
                doc.fontSize(10).text('Team Total:', col1, doc.y, { continued: true });
                if (team.totals.wednesday) {
                    doc.text(`  Wed: ${team.totals.wednesday.present}/${team.totals.wednesday.expected} (${team.totals.wednesday.percentage}%)`, { continued: true });
                }
                if (team.totals.sunday) {
                    doc.text(`  Sun: ${team.totals.sunday.present}/${team.totals.sunday.expected} (${team.totals.sunday.percentage}%)`);
                }
                else {
                    doc.text('');
                }
            }
            doc.end();
        });
    }
    async generateCSV(query) {
        const report = await this.getWeeklyReport(query);
        const lines = [];
        // Header row with date info
        lines.push(`Church Attendance Report`);
        lines.push(`Week: ${report.weekStart} to ${report.weekEnd}`);
        lines.push(`Generated: ${new Date().toLocaleString()}`);
        lines.push('');
        // Column headers
        const headers = ['Team', 'Department', 'HOD', 'Members'];
        if (report.summary.wednesday) {
            headers.push('Wed Date', 'Wed Status', 'Wed Present', 'Wed Absent', 'Wed %', 'Wed Absent Members (with reasons)');
        }
        if (report.summary.sunday) {
            headers.push('Sun Date', 'Sun Status', 'Sun Present', 'Sun Absent', 'Sun %', 'Sun Absent Members (with reasons)');
        }
        lines.push(headers.join(','));
        // Data rows
        for (const team of report.teams) {
            for (const dept of team.departments) {
                const row = [
                    `"${team.teamName}"`,
                    `"${dept.departmentName}"`,
                    `"${dept.hodName || ''}"`,
                    dept.memberCount.toString(),
                ];
                if (report.summary.wednesday) {
                    if (dept.wednesday) {
                        const absentList = dept.wednesday.absentMembers
                            ?.map((m) => m.reason ? `${m.name} (${m.reason})` : m.name)
                            .join('; ') || '';
                        row.push(`"${report.summary.wednesday.serviceDate}"`, dept.wednesday.status, dept.wednesday.present.toString(), dept.wednesday.absent.toString(), `${dept.wednesday.percentage}%`, `"${absentList}"`);
                    }
                    else {
                        row.push('', '', '', '', '', '');
                    }
                }
                if (report.summary.sunday) {
                    if (dept.sunday) {
                        const absentList = dept.sunday.absentMembers
                            ?.map((m) => m.reason ? `${m.name} (${m.reason})` : m.name)
                            .join('; ') || '';
                        row.push(`"${report.summary.sunday.serviceDate}"`, dept.sunday.status, dept.sunday.present.toString(), dept.sunday.absent.toString(), `${dept.sunday.percentage}%`, `"${absentList}"`);
                    }
                    else {
                        row.push('', '', '', '', '', '');
                    }
                }
                lines.push(row.join(','));
            }
        }
        return lines.join('\n');
    }
}
exports.ReportsService = ReportsService;
exports.reportsService = new ReportsService();
//# sourceMappingURL=reports.service.js.map