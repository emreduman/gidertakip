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
            className="hidden md:flex relative w-12 h-12 items-center justify-center group"
            title="Yapay Zeka (Coming Soon)"
        >
            {/* Glow / Aura */}
            <div className="absolute inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 animate-pulse transition-opacity" />

            {/* Core Sphere */}
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-cyan-300 via-blue-600 to-purple-700 shadow-lg group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden">
                {/* Internal Animation/Texture */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-[spin_3s_linear_infinite]" />
            </div>
        </button>
    )
}
