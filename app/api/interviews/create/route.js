import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req) {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }


    const { candidateId, type = "Tech" } = await req.json();
    const ref = await adminDB.collection("interviews").add({
        candidateId,
        type,
        status: "NotStarted",
        createdAt: new Date(),
        startedAt: null,
        endedAt: null,
        score: 0,
        result: null,
    });
    return NextResponse.json({ interviewId: ref.id });
}
