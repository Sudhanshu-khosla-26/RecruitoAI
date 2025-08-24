import { NextResponse } from "next/server";
import { adminAuth, adminDB } from "@/lib/firebase-admin";

const REQUIRED_FIELDS = ["title", "companyName", "department", "location"];

function normalizeJobDescription(body, uid) {
    return {
        title: body.title || null,
        companyName: body.companyName || body.company || null, // handle both cases
        department: body.department || null,
        location: body.location || null,
        description: body.description || null,
        sidePanel: body.sidePanel || {
            industry_type: body.industry || null,
            experience_required: body.yearsOfExperience || null,
            ctc_range: body.ctcRange || null,
            key_skills: Array.isArray(body.keySkills) ? body.keySkills : []
        },
        generationType: body.generationType || null,
        created_by_id: uid,
        created_at: new Date(),
        selectedCandidates: body.selectedCandidates || []
    };
}

function validateJobDescription(data) {
    const missing = REQUIRED_FIELDS.filter(
        f => !data[f] || (typeof data[f] === "string" && data[f].trim() === "")
    );
    return missing;
}

// CREATE JOB (Recruiter only)
export async function POST(request) {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    // ✅ Fetch role from Firestore
    const userDoc = await adminDB.collection("users").doc(decoded.uid).get();
    const userData = userDoc.data();
    const role = userData?.role || "jobseeker";

    if (role !== "recruiter") {
        return NextResponse.json({ error: "Only recruiters can create jobs" }, { status: 403 });
    }

    const body = await request.json();
    const normalized = normalizeJobDescription(body, decoded.uid);

    // ✅ Check for missing required fields
    const missing = validateJobDescription(normalized);
    if (missing.length > 0) {
        return NextResponse.json({
            status: "incomplete",
            message: "Some required fields are missing",
            missing
        }, { status: 400 });
    }

    await adminDB.collection("job_descriptions").add(normalized);

    return NextResponse.json({ success: true }, { status: 201 });
}

// GET JOBS (Recruiter sees own, Jobseeker sees all)
export async function GET(request) {
    const token = request.cookies.get("session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded;
    try {
        decoded = await adminAuth.verifySessionCookie(token, true);
    } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    let snapshot;

    if (decoded.role === "recruiter") {
        snapshot = await adminDB
            .collection("job_descriptions")
            .where("created_by_id", "==", decoded.uid)
            .orderBy("created_at", "desc")
            .get();
    } else {
        snapshot = await adminDB
            .collection("job_descriptions")
            .orderBy("created_at", "desc")
            .get();
    }

    const jobs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ data: jobs }, { status: 200 });
}
