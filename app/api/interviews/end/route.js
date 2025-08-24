import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export async function POST(req) {
    const { interviewId } = await req.json();

    const qnaSnap = await adminDB
        .collection("interview_qna")
        .where("interviewId", "==", interviewId)
        .get();

    const scores = qnaSnap.docs.map(d => d.data().score || 0);
    const finalScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    await adminDB.collection("interviews").doc(interviewId).update({
        status: "Completed",
        endedAt: new Date(),
        score: finalScore,
        result: finalScore >= 70 ? "Passed" : "Failed",
    });

    return NextResponse.json({ finalScore });
}
