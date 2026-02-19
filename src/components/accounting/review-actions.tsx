'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { approveForm, rejectForm } from "@/lib/form-actions"
import { toast } from "sonner"

export function ReviewActions({ formId }: { formId: string }) {
    const [rejectOpen, setRejectOpen] = useState(false)
    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)

    const handleApprove = async () => {
        setLoading(true);
        try {
            await approveForm(formId);
            toast.success("Form onaylandı");
        } catch (e) {
            toast.error("İşlem başarısız");
            setLoading(false);
        }
    }

    const handleReject = async () => {
        if (!reason) return;
        setLoading(true);
        try {
            await rejectForm(formId, reason);
            toast.success("Form reddedildi");
            setRejectOpen(false);
        } catch (e) {
            toast.error("İşlem başarısız");
            setLoading(false);
        }
    }

    return (
        <div className="flex gap-2">
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2" disabled={loading}>
                        <XCircle className="w-4 h-4" />
                        Reddet
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Formu Reddet</DialogTitle>
                        <DialogDescription>
                            Bu formu reddetmek istediğinizden emin misiniz? Lütfen bir sebep belirtin.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Red sebebi..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>İptal</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!reason || loading}>
                            {loading ? 'İşleniyor...' : 'Onayla ve Reddet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 gap-2"
            >
                <CheckCircle className="w-4 h-4" />
                Onayla
            </Button>
        </div>
    )
}
