import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import mime from "mime"; // We don't have this package, better to implement simple lookup

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
    const { filename } = await params;

    // Security: Prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return new NextResponse("Invalid filename", { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    if (!existsSync(filePath)) {
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
