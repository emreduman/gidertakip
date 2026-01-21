'use client';

import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import { getFormDetails } from "@/lib/form-actions";
import { formatCurrency } from "@/lib/utils";

export default function FormSuccessPage() {
    const searchParams = useSearchParams();
    const formId = searchParams.get('id');
    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fonts, setFonts] = useState<{ regular: string, bold: string } | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Fetch Data
                if (formId) {
                    const data = await getFormDetails(formId);
                    setFormData(data);
                }

                // 2. Fetch Fonts (Roboto for Turkish support)
                const [regBuf, boldBuf] = await Promise.all([
                    fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf').then(res => res.arrayBuffer()),
                    fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf').then(res => res.arrayBuffer())
                ]);

                const toBase64 = (buffer: ArrayBuffer) => {
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return window.btoa(binary);
                };

                setFonts({
                    regular: toBase64(regBuf),
                    bold: toBase64(boldBuf)
                });

            } catch (err) {
                console.error("Initialization error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (formId) {
            init();
        } else {
            setLoading(false);
        }
    }, [formId]);

    const handleDownloadPDF = () => {
        if (!formData || !fonts) return;

        const doc = new jsPDF();

        // Register Fonts
        doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
        doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

        // Set Default Font
        doc.setFont('Roboto', 'normal');

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Colors
        const blueColor = "#1e3a8a";
        const grayColor = "#4b5563";
        const lightBorder = "#e5e7eb";

        // Helper: Right Text
        const rightText = (str: string, y: number, isBold = false) => {
            if (isBold) doc.setFont('Roboto', 'bold');
            else doc.setFont('Roboto', 'normal');

            const textWidth = doc.getStringUnitWidth(str) * doc.getFontSize() / doc.internal.scaleFactor;
            doc.text(str, pageWidth - 10 - textWidth, y);

            doc.setFont('Roboto', 'normal'); // Reset
        };

        // Helper: Get Role Tr
        const getRoleName = (role: string) => {
            const map: Record<string, string> = {
                'ADMIN': 'Yönetici',
                'VOLUNTEER': 'Gönüllü',
                'ACCOUNTANT': 'Muhasebeci',
                'COORDINATOR': 'Koordinatör',
                'BUSINESS_DEV': 'İş Geliştirme ve Satış Uzmanı',
                'IT_SPECIALIST': 'Bilgi Teknolojileri Uzmanı',
                'RD_SPECIALIST': 'Deneyimsel Öğrenme Ar-Ge Uzmanı',
                'OWNER': 'Şirket Sahibi'
            };
            return map[role] || role;
        };

        // --- HEADER ---
        doc.setFontSize(22);
        doc.setTextColor(blueColor);
        doc.setFont('Roboto', 'bold');
        doc.text("Masraf Formu", 10, 20);

        doc.setFontSize(10);
        doc.setTextColor(blueColor);
        doc.setFont('Roboto', 'normal');
        const dateStr = new Date(formData.submittedAt).toLocaleDateString('tr-TR');
        doc.text(`Oluşturulma Tarihi: ${dateStr}`, 10, 26);


        // --- INFO BOXES ---
        const boxY = 35;
        const boxH = 45;
        const colW = (pageWidth - 25) / 2;

        // Left Box
        doc.setDrawColor(lightBorder);
        doc.roundedRect(10, boxY, colW, boxH, 2, 2, 'S');

        doc.setFontSize(11); doc.setTextColor(0); doc.setFont('Roboto', 'bold');
        doc.text("Kişisel Bilgiler", 15, boxY + 10);

        doc.setFontSize(9); doc.setTextColor(grayColor); doc.setFont('Roboto', 'normal');
        doc.text("Ad Soyad", 15, boxY + 20);
        doc.setTextColor(blueColor);
        doc.text(formData.user.name || '-', 15, boxY + 25);

        doc.setTextColor(grayColor);
        doc.text("E-posta", 15, boxY + 34);
        doc.setTextColor(blueColor);
        doc.text(formData.user.email || '-', 15, boxY + 39);

        // Right Box
        const rightBoxX = 10 + colW + 5;
        doc.setDrawColor(lightBorder);
        doc.roundedRect(rightBoxX, boxY, colW, boxH, 2, 2, 'S');

        doc.setFontSize(11); doc.setTextColor(0); doc.setFont('Roboto', 'bold');
        doc.text("Banka Bilgileri", rightBoxX + 5, boxY + 10);

        doc.setFontSize(9); doc.setFont('Roboto', 'normal');
        // Bank Name
        doc.setTextColor(grayColor); doc.text("Banka Adı", rightBoxX + 5, boxY + 20);
        doc.setTextColor(blueColor); doc.text(formData.user.bankName || '-', rightBoxX + 5, boxY + 25);

        // IBAN
        doc.setTextColor(grayColor); doc.text("IBAN", rightBoxX + 5, boxY + 34);
        doc.setTextColor(blueColor); doc.text(formData.user.iban || '-', rightBoxX + 5, boxY + 39);

        // Account Holder
        doc.setTextColor(grayColor); doc.text("Hesap Sahibi", rightBoxX + colW / 2, boxY + 20);
        doc.setTextColor(blueColor); doc.text(formData.user.accountHolder || formData.user.name, rightBoxX + colW / 2, boxY + 25);


        // --- PROJE DETAILS ---
        const dBoxY = boxY + boxH + 10;
        const dBoxH = 35;
        doc.setDrawColor(lightBorder);
        doc.roundedRect(10, dBoxY, pageWidth - 20, dBoxH, 2, 2, 'S');

        doc.setFontSize(11); doc.setTextColor(0); doc.setFont('Roboto', 'bold');
        doc.text("Proje Detayları", 15, dBoxY + 10);

        const col3W = (pageWidth - 30) / 3;
        const firstExp = formData.expenses[0];
        const periodName = firstExp?.period?.name || '-';
        const projectName = firstExp?.period?.project?.name || '-';
        const orgName = firstExp?.period?.project?.organization?.name || formData.user.organization?.name || '-';

        let bx = 15;
        doc.setFontSize(9);

        // Kurum
        doc.setTextColor(grayColor); doc.setFont('Roboto', 'normal'); doc.text("Kurum", bx, dBoxY + 20);
        doc.setTextColor(0); doc.setFont('Roboto', 'bold'); doc.text(orgName, bx, dBoxY + 25);

        // Proje
        bx += col3W;
        doc.setTextColor(grayColor); doc.setFont('Roboto', 'normal'); doc.text("Proje", bx, dBoxY + 20);
        doc.setTextColor(0); doc.setFont('Roboto', 'bold'); doc.text(projectName, bx, dBoxY + 25);
        if (formData.location) {
            doc.setFont('Roboto', 'normal'); doc.setTextColor(grayColor);
            doc.text("Lokasyon: " + formData.location, bx, dBoxY + 31);
        }

        // Dönem
        bx += col3W;
        doc.setTextColor(grayColor); doc.setFont('Roboto', 'normal'); doc.text("Dönem", bx, dBoxY + 20);
        doc.setTextColor(0); doc.setFont('Roboto', 'bold'); doc.text(periodName, bx, dBoxY + 25);


        // --- TABLE ---
        let y = dBoxY + dBoxH + 15;
        doc.setFontSize(11); doc.setTextColor(0); doc.setFont('Roboto', 'bold');
        doc.text("Harcama Özeti", 10, y);
        y += 5;

        // Header
        doc.setDrawColor(lightBorder); doc.setLineWidth(0.1);
        doc.line(10, y, pageWidth - 10, y);
        y += 6;
        doc.setFontSize(9); doc.setTextColor(blueColor);
        doc.text("Tarih", 12, y);
        doc.text("Kategori", 50, y);
        doc.text("Açıklama", 90, y);
        rightText("Tutar", y);
        y += 3;
        doc.line(10, y, pageWidth - 10, y);

        // Content
        y += 6;
        doc.setTextColor(0); doc.setFont('Roboto', 'normal');
        let total = 0;

        formData.expenses.forEach((exp: any) => {
            if (y > pageHeight - 60) { doc.addPage(); y = 20; }
            total += Number(exp.amount);

            doc.setFont('Roboto', 'normal');
            doc.text(new Date(exp.date).toLocaleDateString('tr-TR'), 12, y);
            doc.text(exp.category || '-', 50, y);
            const desc = exp.description.length > 40 ? exp.description.slice(0, 40) + '...' : exp.description;
            doc.text(desc, 90, y);

            doc.setFont('Roboto', 'bold');
            rightText(formatCurrency(Number(exp.amount)), y, true);

            y += 2;
            doc.setDrawColor(245);
            doc.line(10, y + 2, pageWidth - 10, y + 2);
            y += 8;
        });

        // Total
        doc.setFillColor(250, 250, 250);
        doc.rect(10, y - 2, pageWidth - 20, 12, 'F');
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(11); doc.setTextColor(0);
        doc.text("Toplam", 15, y + 6);
        rightText(formatCurrency(total), y + 6, true);


        // --- SIGNATURES ---
        let sigY = pageHeight - 50;
        if (y > sigY - 20) { doc.addPage(); sigY = 40; }
        else { sigY = Math.max(y + 25, pageHeight - 55); }

        const gridH = 40;
        const gridW = pageWidth - 20;
        const colWGrid = gridW / 4;

        doc.setDrawColor(lightBorder); doc.setLineWidth(0.2);
        doc.rect(10, sigY, gridW, gridH);

        [1, 2, 3].forEach(i => doc.line(10 + i * colWGrid, sigY, 10 + i * colWGrid, sigY + gridH));
        const headerH = 10;
        doc.line(10, sigY + headerH, 10 + gridW, sigY + headerH);

        doc.setFontSize(7); doc.setTextColor(blueColor); doc.setFont('Roboto', 'bold');
        const center = (o: number) => 10 + o * colWGrid + colWGrid / 2;
        doc.text("GERİ ÖDEME TALEP EDEN", center(0), sigY + 6, { align: 'center' });
        doc.text("ONAY", center(1), sigY + 6, { align: 'center' });
        doc.text("ONAY", center(2), sigY + 6, { align: 'center' });
        doc.text("ONAY", center(3), sigY + 6, { align: 'center' });

        const row1Y = sigY + headerH + 5;
        const row2Y = sigY + headerH + 15;
        const row3Y = sigY + headerH + 25;
        doc.setDrawColor(240);
        doc.line(10, sigY + headerH + 10, 10 + gridW, sigY + headerH + 10);
        doc.line(10, sigY + headerH + 20, 10 + gridW, sigY + headerH + 20);

        const fillCell = (colIdx: number, nameVal: string, roleVal: string) => {
            const x = 10 + colIdx * colWGrid + 2;
            doc.setFontSize(6); doc.setTextColor(blueColor); doc.text("İsim Soyisim", x, row1Y);
            doc.setFontSize(7); doc.setTextColor(0); doc.text(nameVal, x, row1Y + 4);

            doc.setFontSize(6); doc.setTextColor(blueColor); doc.text("Pozisyon", x, row2Y);
            doc.setFontSize(7); doc.setTextColor(0); doc.text(roleVal, x, row2Y + 4);

            doc.setFontSize(6); doc.setTextColor(blueColor); doc.text("İmza", x, row3Y);
        };

        fillCell(0, formData.user.name, getRoleName(formData.user.role));
        fillCell(1, "", ""); fillCell(2, "", ""); fillCell(3, "", "");

        doc.save(`Masraf_Formu_${formData.formNumber}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 bg-gray-50/50 p-8 rounded-xl border">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p>Form ve yazı tipleri hazırlanıyor...</p>
            </div>
        )
    }

    if (!formData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 bg-gray-50/50 p-8 rounded-xl border">
                <p>Form bilgileri alınamadı.</p>
                <Link href="/dashboard"><Button>Ana Sayfaya Dön</Button></Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 bg-gray-50/50 p-8 rounded-xl border">
            <div className="bg-green-100 p-4 rounded-full ring-8 ring-green-50">
                <CheckCircle className="w-16 h-16 text-green-600" />
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Talep Başarıyla Oluşturuldu</h1>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    Masraf formunuz başarıyla oluşturuldu ve onaya gönderildi. (# {formData.formNumber})
                    <br />
                    Aşağıdaki bilgilerle birlikte formun bir kopyasını indirebilirsiniz.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-48 shadow-lg shadow-blue-200">
                    <Link href="/dashboard/profile">Profilime Git</Link>
                </Button>

                <Button variant="outline" size="lg" onClick={handleDownloadPDF} disabled={!fonts} className="w-full sm:w-48 bg-white hover:bg-gray-50 border-gray-200 shadow-sm">
                    <Download className="w-4 h-4 mr-2" />
                    PDF Olarak İndir
                </Button>
            </div>

            <div className="bg-white p-4 rounded border text-left w-full max-w-md text-xs text-gray-500 mt-4">
                <p className="font-semibold mb-1">Özet:</p>
                <p>Toplam Tutar: <span className="text-gray-900 font-bold">{formatCurrency(Number(formData.totalAmount))}</span></p>
                <p>Banka: {formData.user.bankName || '-'}</p>
                <p>IBAN: {formData.user.iban ? `**** ${formData.user.iban.slice(-4)}` : 'Tanımlı Değil'}</p>
            </div>
        </div>
    );
}
