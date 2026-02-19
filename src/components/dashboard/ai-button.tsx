'use client';

import { toast } from 'sonner';

export function AIButton() {
    const handleClick = () => {
        toast.info("Çok yakında", {
            description: <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">Yapay zeka özellikleriyle sizlerle!</span>
        });
    }

    return (
        <button
            onClick={handleClick}
            className="hidden md:flex relative w-16 h-16 items-center justify-center group"
            title="Yapay Zeka (Coming Soon)"
        >
            {/* Hover Ripples */}
            {/* Using inline styles for animation details to avoid complex arbitrary values that might break CSS build */}
            <div
                className="absolute inset-0 rounded-full border-2 border-cyan-300/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping"
                style={{ animationDuration: '2s' }}
            />
            <div
                className="absolute inset-0 rounded-full border-2 border-purple-400/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping"
                style={{ animationDuration: '2s', animationDelay: '0.4s' }}
            />

            {/* Siri Orb Container */}
            <div className="relative w-12 h-12 rounded-full transform group-hover:scale-110 transition-transform duration-300 flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-sm shadow-xl border border-white/10">

                {/* Fluid Rotating Gradients */}
                <div
                    className="absolute -inset-[100%] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 blur-xl opacity-80 animate-spin"
                    style={{ animationDuration: '3s' }}
                />
                <div
                    className="absolute -inset-[100%] bg-gradient-to-t from-pink-500 via-purple-500 to-cyan-500 blur-xl opacity-60 animate-spin mix-blend-overlay"
                    style={{ animationDuration: '4s', animationDirection: 'reverse' }}
                />

                {/* Inner Glow/Core */}
                <div className="absolute inset-1 bg-white/30 rounded-full blur-md" />

                {/* Glossy Reflection */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]" />
                <div className="absolute top-2 left-3 w-5 h-3 bg-white/80 blur-[3px] rounded-full -rotate-45" />
            </div>
        </button>
    )
}
