import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as xlsx from "xlsx";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const periodId = url.searchParams.get("periodId");
        const month = url.searchParams.get("month");
        const status = url.searchParams.get("status");

        const where: any = { userId: session.user.id };

        // Admin override to see all
        if (session.user.role === 'ADMIN') {
            delete where.userId;
        }

        if (periodId) {
            where.periodId = periodId;
        }

        if (status && status !== 'ALL') {
            where.status = status;
        }

        if (month) {
            const [yearStr, monthStr] = month.split("-");
            if (yearStr && monthStr) {
                const startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
                const endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0);
                where.date = { gte: startDate, lte: endDate };
            }
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: { user: true, period: true },
            orderBy: { date: "asc" }, // Ascending order often better for ERP imports
        });

        // Paraşüt Expected Structure:
        // Tarih, Belge No, Tedarikçi Unvanı, Kategori, Açıklama, Brüt Tutar, KDV Oranı, Para Birimi
        const data = expenses.map((exp: any) => {
            const tarih = exp.date.toLocaleDateString("tr-TR"); // format: GG.AA.YYYY
            const taxRate = exp.taxRate ? Number(exp.taxRate) : 0;
            const amount = Number(exp.amount);

            return {
                "Fiş/Fatura Tarihi": tarih,
                "Belge No": exp.id.substring(0, 8).toUpperCase(), // Simplified Document No
                "İşlem Tipi": "Gider Fişi / Faturası",
                "Tedarikçi Unvanı": exp.merchant || "Muhtelif Tedarikçi",
                "Açıklama": exp.description || exp.category || "Gider takipten aktarılan harcama",
                "Kategori": exp.category || "Genel Giderler",
                "Miktar": 1,
                "Birim Fiyat": amount,
                "Para Birimi": "TRL", // Paraşüt commonly uses TRL or TRY
                "KDV Oranı (%)": taxRate,
                "Vergiler Dahil": "Evet",
            };
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);

        ws['!cols'] = [
            { wch: 15 }, // Tarih
            { wch: 15 }, // Belge No
            { wch: 20 }, // İslem tipi
            { wch: 25 }, // Tedarikçi Unvanı
            { wch: 35 }, // Açıklama
            { wch: 20 }, // Kategori
            { wch: 10 }, // Miktar
            { wch: 15 }, // Birim Fiyat
            { wch: 15 }, // Para Birimi
            { wch: 15 }, // KDV Oranı
            { wch: 15 }, // Vergiler Dahil
        ];

        xlsx.utils.book_append_sheet(wb, ws, "Fatura ve Fişler");

        const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Parasut_Iceri_Aktarim_${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Paraşüt Export Error:", error);
        return NextResponse.json({ error: "Failed to generate Paraşüt import file" }, { status: 500 });
    }
}
