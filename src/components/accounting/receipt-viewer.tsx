'use client'

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
    if (!url) return null;

    // Simple check for PDF based on extension or mime type if available
    // Assuming backend returns simple URLs for now. 
    // If it's a PDF, we should just link it generally as Next Image won't work.

    const isPdf = url.toLowerCase().endsWith('.pdf');

    if (isPdf) {
        return (
            <Button variant="outline" size="sm" asChild className="h-8 gap-2">
                <a href={url} target="_blank" rel="noopener noreferrer">
                    <FileTextIcon className="w-4 h-4" /> PDF Görüntüle
                </a>
            </Button>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="relative group w-16 h-16 cursor-pointer border rounded-md overflow-hidden bg-gray-100 hover:ring-2 ring-primary transition-all">
                    <Image
                        src={url}
                        alt="Receipt"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                        src={url}
                        alt="Receipt Full"
                        className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute top-4 right-4">
                        <Button asChild variant="secondary" size="sm">
                            <a href={url} target="_blank" rel="noopener noreferrer">Orijinali Aç</a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
