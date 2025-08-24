import { NextResponse } from 'next/server';
import { adminDB, adminAuth } from "@/lib/firebase-admin";


export const POST = async (request) => {
    try {
        const token = request.cookies.get("session")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        let decoded;
        try {
            decoded = await adminAuth.verifySessionCookie(token, true);
        } catch {
            return NextResponse.json({ error: "Invalid session" }, { status: 403 });
        }
        if (decoded.role !== 'jobseeker') {
            return NextResponse.json({ error: 'Only jobseekers can apply for jobs' }, { status: 403 });
        }
        const data = await request.json();

        const {
            jobId,
            resume,
            percentage,
            name,
            status,
            email,
        } = data;

        if (
            !jobId ||
            !resume ||
            typeof percentage !== 'number' ||
            !name ||
            !status ||
            !email
        ) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate status
        const validStatuses = ["Sent", "Reviewed", "Selected", "Rejected"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        // Prepare application data
        const application = {
            applicantId: decoded.uid,
            jobId,
            resume,
            percentage,
            name,
            status,
            email,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Save to Firestore
        const docRef = await adminDB.collection('applications').add(application);

        return NextResponse.json({ id: docRef.id, ...application }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}