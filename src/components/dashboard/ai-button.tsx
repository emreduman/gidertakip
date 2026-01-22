'use client';

import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function AIButton() {
    const handleClick = () => {
        toast.info("Çok yakında", {
            description: "Yapay zeka özellikleriyle sizlerle!"
        });
    }

    return (
        <button
            onClick={handleClick}
            className="hidden md:flex p-2 rounded-full hover:bg-white/20 transition-all items-center justify-center group"
            title="Yapay Zeka (Coming Soon)"
        >
            <Sparkles className="w-8 h-8 text-white animate-pulse group-hover:animate-spin" />
        </button>
    )
}
