// app/middleware.js
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function middleware(req) {
    const token = req.cookies.get("session")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }

    try {
        await adminAuth.verifySessionCookie(token, true);
        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/signin", req.url));
    }
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/job-descriptions/:path*"], // protect these
};
