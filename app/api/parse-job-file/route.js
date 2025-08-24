import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { getAuth } from "firebase-admin/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(request) {
    // ✅ Verify Firebase Auth Token
    const token = request.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
        return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    let decodedUser;
    try {
        decodedUser = await getAuth().verifyIdToken(token);
    } catch {
        return new Response(JSON.stringify({ error: "Invalid token" }), { status: 403 });
    }

    // ✅ Convert Web Request to buffer
    const buffer = Buffer.from(await request.arrayBuffer());

    // Create a temporary file path
    const tmpPath = path.join("/tmp", `upload-${Date.now()}.docx`);
    fs.writeFileSync(tmpPath, buffer);

    // ✅ Extract text
    let extractedText = "";
    try {
        const result = await mammoth.extractRawText({ path: tmpPath });
        extractedText = result.value || "";
    } catch (err) {
        console.error("Mammoth extraction failed:", err);
        fs.unlinkSync(tmpPath);
        return new Response(JSON.stringify({ error: "Failed to extract text" }), { status: 500 });
    }
    fs.unlinkSync(tmpPath);

    // ✅ Parse Job Description + Side Panel
    const { title, companyName, description, sidePanel } = parseJobDescription(extractedText);

    try {

        return new Response(
            JSON.stringify({ success: true, title, companyName, description, sidePanel, type: "job" }),
            { status: 201 }
        );
    } catch (err) {
        console.error("Firestore insert failed:", err);
        return new Response(
            JSON.stringify({ error: "Database insert failed", details: err.message }),
            { status: 500 }
        );
    }
}

// 🔹 Parser function
function parseJobDescription(text) {
    const lines = text.split("\n").filter((l) => l.trim());
    let title = "";
    let companyName = "";
    const description = text;

    // --- Title extraction ---
    const titlePatterns = [
        /^(job title|position|role):\s*(.+)/i,
        /^(.+?)\s*-\s*(job|position|role)/i,
        /^([A-Z][^.!?]*(?:engineer|developer|intern|manager|analyst|specialist|coordinator|assistant|director|lead|senior|junior))/i,
    ];
    for (const line of lines.slice(0, 8)) {
        for (const pattern of titlePatterns) {
            const match = line.match(pattern);
            if (match && match[2]) title = match[2].trim();
            else if (match && match[1] && !title) title = match[1].trim();
        }
        if (title) break;
    }

    // --- Company extraction ---
    const companyPatterns = [
        /^(company|organization|employer):\s*(.+)/i,
        /at\s+([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Corp|Ltd|Company|Technologies|Solutions|Systems|Pvt\. Ltd\.))/i,
        /([A-Z][a-zA-Z\s&.,]+(?:Inc|LLC|Corp|Ltd|Company|Technologies|Solutions|Systems|Pvt\. Ltd\.))/i,
    ];
    for (const line of lines.slice(0, 12)) {
        for (const pattern of companyPatterns) {
            const match = line.match(pattern);
            if (match && match[2]) companyName = match[2].trim();
            else if (match && match[1] && !companyName) companyName = match[1].trim();
        }
        if (companyName) break;
    }

    // --- Flexible Side Panel extraction ---
    const sidePanel = {};
    const keyValueRegex = /^([A-Z][A-Za-z\s]+):\s*(.+)$/; // matches "Key: Value"
    for (const line of lines) {
        const match = line.match(keyValueRegex);
        if (match) {
            const key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
            const value = match[2].trim();
            sidePanel[key] = value;
        }
    }

    // --- Keep support for structured Job Highlights & Match Score ---
    sidePanel.job_highlights = extractList(lines, "Job highlights");
    sidePanel.job_match_score = extractMatchScore(lines, "Job match score");

    return {
        title: title || "Untitled Position",
        companyName: companyName || "",
        description: description.trim(),
        sidePanel,
    };
}

// --- Helpers ---
function extractList(lines, heading) {
    const idx = lines.findIndex((l) => l.toLowerCase().includes(heading.toLowerCase()));
    if (idx === -1) return [];
    const list = [];
    for (let i = idx + 1; i < lines.length; i++) {
        if (/^\s*[A-Z]/.test(lines[i])) break; // stop at next heading
        list.push(lines[i].replace(/^[-•○]+/, "").trim());
    }
    return list.filter(Boolean);
}

function extractMatchScore(lines, heading) {
    const idx = lines.findIndex((l) => l.toLowerCase().includes(heading.toLowerCase()));
    if (idx === -1) return [];
    return lines
        .slice(idx + 1)
        .map((l) => l.replace(/^[-•○]+/, "").trim())
        .filter((l) => l && !/^[A-Z]/.test(l));
}
