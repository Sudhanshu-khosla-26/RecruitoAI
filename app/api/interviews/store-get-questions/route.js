import { NextResponse } from "next/server";
import { adminDB, adminAuth } from "@/lib/firebase-admin";

export const POST = async (request) => {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    const { interviewId, question, type } = await request.json();

    if (!interviewId || !question) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    try {
        const docRef = await adminDB.collection("interview_qna").add({
            interviewId,
            question,
            createdAt: new Date(),
        });
        return NextResponse.json({ docRef }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to store question" }, { status: 500 });
    }
};

export const PATCH = async (request) => {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    const { id, answer, feedback, score } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    try {
        await adminDB.collection("interview_qna").doc(id).update({
            answer,
            feedback,
            score,
        });
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
};