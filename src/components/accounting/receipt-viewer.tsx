'use client'

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileTextIcon, Maximize2Icon } from "lucide-react"
import Image from "next/image"

export function ReceiptViewer({ url }: { url: string }) {
    const [imgError, setImgError] = useState(false);

    if (!url) return null;

    // Fix legacy URLs: redirect /uploads/ to /api/receipts/ for consistent serving
    const cleanUrl = url.startsWith('/uploads/') ? url.replace('/uploads/', '/api/receipts/') : url;

    // Simple check for PDF based on extension or mime type if available
    const isPdf = cleanUrl.toLowerCase().endsWith('.pdf');

    if (isPdf) {
        return (
            <Button variant="outline" size="sm" asChild className="h-8 gap-2">
                <a href={cleanUrl} target="_blank" rel="noopener noreferrer">
                    <FileTextIcon className="w-4 h-4" /> PDF Görüntüle
                </a>
            </Button>
        )
    }

    if (imgError) {
        return (
            <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gray-100 rounded flex flex-col items-center justify-center text-[10px] text-gray-500 hover:bg-gray-200 border">
                <FileTextIcon className="w-5 h-5 mb-1 text-gray-400" />
                Dosya
            </a>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative group w-16 h-16 cursor-pointer border rounded-md overflow-hidden bg-gray-100 hover:ring-2 ring-primary transition-all">
                    <Image
                        src={cleanUrl}
                        alt="Receipt"
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="64px"
                        onError={() => setImgError(true)}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2Icon className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0 overflow-hidden flex flex-col bg-transparent border-none shadow-none">
                <DialogTitle className="sr-only">Receipt Preview</DialogTitle>
                <div className="relative w-full h-[85vh] bg-black/80 rounded-lg overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={cleanUrl}
                        alt="Receipt Full"
                        className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute top-4 right-4">
                        <Button asChild variant="secondary" size="sm">
                            <a href={cleanUrl} target="_blank" rel="noopener noreferrer">Orijinali Aç</a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
