import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Redirect to login after clearing
    const response = NextResponse.redirect(`${baseUrl}/login`);
    
    // Clear all site data
    response.headers.set('Clear-Site-Data', '"cookies", "storage", "cache"');
    
    return response;
}
