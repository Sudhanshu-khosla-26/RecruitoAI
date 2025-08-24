import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminDB } from "@/lib/firebase-admin";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function POST(req) {
    const { interviewId, context = "" } = await req.json();

    // Pull last 6 QnA for context (short prompt)
    const qnaSnap = await adminDB
        .collection("interview_qna")
        .where("interviewId", "==", interviewId)
        .orderBy("createdAt", "desc")
        .limit(6)
        .get();


    const qnaSnapData = await Promise.all(qnaSnap.docs.map(d => d.data()));
    console.log(qnaSnapData);



    // const qnaRef = await adminDB.collection("interview_qna").add({
    //     interviewId,
    //     question,
    //     answer: "",
    //     score: 0,
    //     feedback: "",
    //     createdAt: new Date(),
    // });

    return NextResponse.json(qnaSnapData);
}
