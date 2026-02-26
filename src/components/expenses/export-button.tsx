'use client';

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { exportExpensesAction } from "@/lib/expense-actions";

export function ExportButton() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<string | null>(null);

    const handleExport = (type: 'standard' | 'parasut') => {
        setLoading(type);
        try {
            const status = searchParams.get('status');
            const month = searchParams.get('month');

            const params = new URLSearchParams();
            if (status && status !== 'ALL') params.append('status', status);
            if (month) params.append('month', month);

            const endpoint = type === 'parasut' ? '/api/export/parasut' : '/api/export/excel';
            const url = `${endpoint}?${params.toString()}`;

            // Navigate to the API route to trigger the download
            window.location.href = url;

            setTimeout(() => {
                setLoading(null);
                toast.success(type === 'parasut' ? "Paraşüt Excel indiriliyor." : "Excel indiriliyor.");
            }, 2000);

        } catch (error) {
            console.error("Export error", error);
            toast.error("Dışa aktarma başlatılırken hata oluştu.");
            setLoading(null);
        }
    };

    return (
        <div className="flex gap-2 relative">
            <Button
                variant="outline"
                onClick={() => handleExport('standard')}
                disabled={loading !== null}
                className="gap-2"
                title="Sistemdeki tüm verilerle standart Excel formatında indir"
            >
                <Download className="h-4 w-4" />
                {loading === 'standard' ? "İndiriliyor..." : "Excel / CSV"}
            </Button>

            <Button
                variant="outline"
                onClick={() => handleExport('parasut')}
                disabled={loading !== null}
                className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                title="Paraşüt İçe Aktarma - Gider Fişi/Faturası Şablonuna uygun indir"
            >
                <Download className="h-4 w-4" />
                {loading === 'parasut' ? "İndiriliyor..." : "Paraşüt Şablonu"}
            </Button>
        </div>
    );
}
