try { require('dotenv').config() } catch (e) { /* ignore in prod */ }

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const hashedPassword = await bcrypt.hash('123456', 10)

    // 1. Create/Update Users
    const admin = await prisma.user.upsert({
        where: { email: 'admin@erav.com' },
        update: {},
        create: { email: 'admin@erav.com', name: 'Yönetici Emre', password: hashedPassword, role: 'ADMIN' },
    })

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@gidertakip.com' },
        update: { password: hashedPassword, role: 'ADMIN' },
        create: { email: 'admin@gidertakip.com', name: 'Sistem Yöneticisi', password: hashedPassword, role: 'ADMIN' },
    })

    const accountant = await prisma.user.upsert({
        where: { email: 'muhasebe@erav.com' },
        update: {},
        create: { email: 'muhasebe@erav.com', name: 'Muhasebeci Ahmet', password: hashedPassword, role: 'ACCOUNTANT' },
    })

    const volunteer1 = await prisma.user.upsert({
        where: { email: 'gonullu@erav.com' },
        update: { password: hashedPassword },
        create: { email: 'gonullu@erav.com', name: 'Gönüllü Ayşe', password: hashedPassword, role: 'VOLUNTEER' },
    })

    const volunteer2 = await prisma.user.upsert({
        where: { email: 'mehmet@erav.com' },
        update: { password: hashedPassword },
        create: { email: 'mehmet@erav.com', name: 'Gönüllü Mehmet', password: hashedPassword, role: 'VOLUNTEER' },
    })

    console.log("Users created/updated.")

    // 2. Create Organization Structure with Dynamic Dates (Current Month/Year)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentMonthName = now.toLocaleString('tr-TR', { month: 'long' });
    const periodName = `${currentMonthName} ${currentYear}`;

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    let org = await prisma.organization.findFirst({ where: { name: 'Güneş Vakfı' } })
    if (!org) {
        org = await prisma.organization.create({
            data: { name: 'Güneş Vakfı' }
        })
    }

    let project = await prisma.project.findFirst({ where: { name: 'Eğitim Yardımı', organizationId: org.id } })
    if (!project) {
        project = await prisma.project.create({
            data: { name: 'Eğitim Yardımı', organizationId: org.id }
        })
    }

    let period = await prisma.period.findFirst({ where: { name: periodName, projectId: project.id } })
    if (!period) {
        period = await prisma.period.create({
            data: {
                name: periodName,
                startDate: startDate,
                endDate: endDate,
                projectId: project.id,
                isActive: true
            }
        })
    } else {
        // Ensure it's active
        await prisma.period.update({ where: { id: period.id }, data: { isActive: true } })
    }

    console.log(`Hierarchy setup complete for ${periodName}.`)

    // 3. Helper to create random expenses
    const categories = ['Kırtasiye', 'Ulaşım', 'Gıda', 'Konaklama', 'Etkinlik', 'Sağlık', 'Diğer']
    const merchants = ['Ofis Market', 'Metro İstanbul', 'Bim', 'A101', 'THY', 'Shell', 'Eczane', 'Kırtasiye Dünyası']

    const createRandomExpense = async (userId, status = 'PENDING', formId = null) => {
        const amount = (Math.random() * 1000 + 50).toFixed(2);
        // Random date within current month
        const date = new Date(currentYear, currentMonth, Math.floor(Math.random() * 28) + 1);

        return prisma.expense.create({
            data: {
                description: 'Otomatik oluşturulan harcama',
                amount: parseFloat(amount),
                date: date,
                category: categories[Math.floor(Math.random() * categories.length)],
                merchant: merchants[Math.floor(Math.random() * merchants.length)],
                userId: userId,
                periodId: period.id,
                status: status,
                expenseFormId: formId
            }
        })
    }

    // 4. Seed Data for Volunteer 1 (Ayşe)

    // -> 5 Pending Expenses
    for (let i = 0; i < 5; i++) await createRandomExpense(volunteer1.id, 'PENDING');

    // -> Form 1: Submitted
    const form1 = await prisma.expenseForm.create({
        data: {
            userId: volunteer1.id,
            title: `Ayşe - ${currentMonthName} Masrafları #1`,
            totalAmount: 0,
            status: 'SUBMITTED',
            submittedAt: new Date(currentYear, currentMonth, 15)
        }
    })
    let total1 = 0;
    for (let i = 0; i < 3; i++) {
        const exp = await createRandomExpense(volunteer1.id, 'SUBMITTED', form1.id);
        total1 += Number(exp.amount);
    }
    await prisma.expenseForm.update({ where: { id: form1.id }, data: { totalAmount: total1 } });


    // -> Form 2: Approved
    const form2 = await prisma.expenseForm.create({
        data: {
            userId: volunteer1.id,
            title: 'Ayşe - Acil Giderler',
            totalAmount: 0,
            status: 'APPROVED',
            submittedAt: new Date(currentYear, currentMonth, 10),
            processedAt: new Date(currentYear, currentMonth, 12),
            processedById: accountant.id
        }
    })
    let total2 = 0;
    for (let i = 0; i < 4; i++) {
        const exp = await createRandomExpense(volunteer1.id, 'APPROVED', form2.id);
        total2 += Number(exp.amount);
    }
    await prisma.expenseForm.update({ where: { id: form2.id }, data: { totalAmount: total2 } });


    // 5. Seed Data for Volunteer 2 (Mehmet)

    // -> 3 Pending Expenses
    for (let i = 0; i < 3; i++) await createRandomExpense(volunteer2.id, 'PENDING');

    // -> Form 3: Rejected
    const form3 = await prisma.expenseForm.create({
        data: {
            userId: volunteer2.id,
            title: 'Mehmet - Hatalı Form',
            totalAmount: 0,
            status: 'REJECTED',
            rejectionReason: 'Fişler okunaklı değil ve proje kapsamı dışı harcamalar var.',
            submittedAt: new Date(currentYear, currentMonth, 25),
            processedAt: new Date(currentYear, currentMonth, 26),
            processedById: accountant.id
        }
    })
    let total3 = 0;
    for (let i = 0; i < 2; i++) {
        const exp = await createRandomExpense(volunteer2.id, 'REJECTED', form3.id);
        total3 += Number(exp.amount);
    }
    await prisma.expenseForm.update({ where: { id: form3.id }, data: { totalAmount: total3 } });

    console.log("Expanded seed data created successfully with CURRENT dates.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
