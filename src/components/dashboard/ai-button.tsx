'use client';

import { Globe } from 'lucide-react';
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
            className="hidden md:flex relative w-16 h-16 items-center justify-center group"
            title="Yapay Zeka (Coming Soon)"
        >
            {/* Ambient Glow */}
            <div className="absolute inset-2 bg-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-80 animate-pulse transition-opacity duration-500" />

            {/* 3D Sphere Container */}
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-indigo-900 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.4),inset_2px_2px_6px_rgba(255,255,255,0.4)] flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                {/* Rotating Overlay/Texture (The Globe Wireframe) */}
                <Globe className="w-full h-full p-0.5 text-cyan-100/80 animate-[spin_6s_linear_infinite]" strokeWidth={1.2} />

                {/* Shadow Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 rounded-full" />

                {/* Specular Highlight (The 'Glass' look) */}
                <div className="absolute top-1.5 left-2 w-5 h-2.5 bg-white/40 blur-[2px] rounded-full -rotate-12" />
            </div>
        </button>
    )
}
