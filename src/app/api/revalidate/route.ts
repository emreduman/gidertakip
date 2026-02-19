import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
    const path = req.nextUrl.searchParams.get('path');
    if (path) {
        try {
            revalidatePath(path);
            return NextResponse.json({ revalidated: true, path, now: Date.now() });
        } catch (e) {
            return NextResponse.json({ revalidated: false, message: 'Revalidation Error' }, { status: 500 });
        }
    }
    return NextResponse.json({ revalidated: false, message: 'Missing path param' }, { status: 400 });
}
