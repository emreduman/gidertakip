
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return new NextResponse("Invalid filename", { status: 400 });
    }

    // We continue to use public/uploads as the storage location
    // But serving it via this API route ensures consistent checks
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    console.log(`[API] Serving receipt: ${filename}`);
    console.log(`[API] Path: ${filePath}`);

    if (!existsSync(filePath)) {
        console.error(`[API] File not found: ${filePath}`);
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
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });
    } catch (e) {
        console.error("[API] Serve error:", e);
        return new NextResponse("Error reading file", { status: 500 });
    }
}
