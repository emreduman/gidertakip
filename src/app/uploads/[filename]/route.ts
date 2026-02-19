import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
// import mime from "mime"; // Removed unused import

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> } // Correct type for Next.js 16
) {
    const { filename } = await params;

    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    console.log(`[DEBUG] Serving file: ${filename}`);
    console.log(`[DEBUG] Looking at path: ${filePath}`);
    console.log(`[DEBUG] CWD: ${process.cwd()}`);

    if (!existsSync(filePath)) {
        console.error(`[ERROR] File not found at ${filePath}`);

        // Debug: List directory content
        try {
            const dir = join(process.cwd(), 'public', 'uploads');
            const fs = require('fs');
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                console.log(`[DEBUG] Files in ${dir}:`, files);
            } else {
                console.log(`[DEBUG] Directory ${dir} does not exist!`);
                // Try to find where public might be
                const rootDir = process.cwd();
                console.log(`[DEBUG] Root contents:`, fs.readdirSync(rootDir));
            }
        } catch (e) {
            console.error("[DEBUG] Error scanning dir:", e);
        }

        return new NextResponse("File not found", { status: 404 });
    }

    try {
        const fileBuffer = await readFile(filePath);

        const ext = filename.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'pdf') contentType = 'application/pdf';

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400, immutable"
            }
        });
    } catch (e) {
        console.error("File serve error:", e);
        return new NextResponse("Error reading file", { status: 500 });
    }
}
