import { NextResponse, type NextRequest } from 'next/server';

// Simple passthrough middleware - no longer needed to strip cookies
// Auth is now handled via access token in request body
export function middleware(req: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: [],
};
