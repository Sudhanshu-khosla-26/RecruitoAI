import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req) {
    const { interviewId } = await req.json();
    await adminDB.collection("interviews").doc(interviewId).update({
        status: "InProgress",
        startedAt: new Date(),
    });
    return NextResponse.json({ ok: true });
}
