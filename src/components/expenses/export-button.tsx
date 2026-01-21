'use client';

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { exportExpensesAction } from "@/lib/expense-actions";

export function ExportButton() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = {
                status: searchParams.get('status') || undefined,
                month: searchParams.get('month') || undefined
            };

            const result = await exportExpensesAction(params);

            if ('message' in result) {
                toast.error(result.message);
                return;
            }

            if (result.csv) {
                // Create download link
                const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', result.filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Dışa aktarma başarılı.");
            }
        } catch (error) {
            console.error("Export error", error);
            toast.error("Dışa aktarma sırasında hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" />
            {loading ? "İndiriliyor..." : "Excel / CSV İndir"}
        </Button>
    );
}
