import { NextResponse } from "next/server";
import { adminDB, adminAuth } from "@/lib/firebase-admin";

export async function POST(request) {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }
    const { interviewId } = await request.json();

    if (!interviewId) {
        return NextResponse.json({ error: "Missing interview ID" }, { status: 400 });
    }

    try {
        const interviewDoc = await adminDB.collection("interviews").doc(interviewId).get();

        if (!interviewDoc) {
            return NextResponse.json({ error: "Interview not found" }, { status: 404 });
        }

        const interviewData = await interviewDoc.data();

        // if (!interviewData || !interviewData.jodid || typeof interviewData.jobId !== "string" || interviewData.jobId.trim() === "") {
        //     return NextResponse.json({ error: "Invalid or missing jobId in interview data" }, { status: 400 });
        // }

        const jobdoc = await adminDB.collection("job_descriptions").doc(interviewData.jodid).get();

        if (!jobdoc.exists) {
            return NextResponse.json({ error: "Job description not found" }, { status: 404 });
        }

        const jobdata = await jobdoc.data();

        return NextResponse.json(jobdata);
    } catch (error) {
        console.error("Error fetching interview:", error);
        return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 });
    }
}