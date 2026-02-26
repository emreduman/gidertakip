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

        const where: any = { userId: session.user.id };

        // Admin override to see all
        if (session.user.role === 'ADMIN') {
            delete where.userId;
        }

        if (periodId) {
            where.periodId = periodId;
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
            orderBy: { date: "desc" },
        });

        const data = expenses.map((exp: any) => ({
            "Tarih": exp.date.toLocaleDateString("tr-TR"),
            "Satıcı/İşyeri": exp.merchant || "-",
            "Kategori": exp.category || "-",
            "Harcama Sahibi": exp.user?.name || "-",
            "Dönem": exp.period?.name || "-",
            "KDV Oranı (%)": exp.taxRate ? `%${exp.taxRate}` : "-",
            "KDV Tutarı": exp.taxAmount ? Number(exp.taxAmount) : 0,
            "Net Tutar": exp.taxAmount ? Number(exp.amount) - Number(exp.taxAmount) : Number(exp.amount),
            "Toplam Tutar (KDV Dahil)": Number(exp.amount),
            "Durum": exp.status,
            "Yapay Zeka Güveni": exp.confidence ? `%${exp.confidence}` : "-",
            "Mükerrer": exp.isDuplicate ? "Evet" : "Hayır",
            "Açıklama": exp.description || "-",
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);

        // Adjust column widths purely out of niceness
        ws['!cols'] = [
            { wch: 12 }, // Tarih
            { wch: 20 }, // Satıcı
            { wch: 15 }, // Kategori
            { wch: 20 }, // Harcama Sahibi
            { wch: 15 }, // Dönem
            { wch: 15 }, // KDV Oranı
            { wch: 15 }, // KDV Tutarı
            { wch: 15 }, // Net Tutar
            { wch: 25 }, // Toplam Tutar
            { wch: 12 }, // Durum
            { wch: 18 }, // Güven
            { wch: 10 }, // Mükerrer
            { wch: 30 }, // Açıklama
        ];

        xlsx.utils.book_append_sheet(wb, ws, "Harcamalar");

        const excelBuffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Gider_Raporu_${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Excel Export Error:", error);
        return NextResponse.json({ error: "Failed to generate Excel file" }, { status: 500 });
    }
}
