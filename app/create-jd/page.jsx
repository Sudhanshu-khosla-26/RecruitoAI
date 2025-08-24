"use client"
import React, { useState, useEffect } from "react"
import Sidebar from '@/components/sidebar'
import { Button } from '@/components/button'
import { User, Upload, Loader2 } from 'lucide-react'
import { auth } from "@/lib/firebase"

// Floating overlay for drag-drop
const DragDropOverlay = ({ onFileDrop }) => {
    const [show, setShow] = useState(false)

    useEffect(() => {
        const handleDragOver = (e) => {
            e.preventDefault()
            setShow(true)
        }

        const handleDragLeave = (e) => {
            e.preventDefault()
            setShow(false)
        }

        const handleDrop = (e) => {
            e.preventDefault()
            setShow(false)
            if (e.dataTransfer?.files?.length) {
                onFileDrop(e.dataTransfer.files[0])
            }
        }

        const handleWindowEvents = (action) => {
            window[`${action}EventListener`]("dragover", handleDragOver)
            window[`${action}EventListener`]("dragleave", handleDragLeave)
            window[`${action}EventListener`]("drop", handleDrop)
        }

        handleWindowEvents("add")

        return () => {
            handleWindowEvents("remove")
        }
    }, [onFileDrop])

    if (!show) return null

    const top = `${Math.floor(Math.random() * 50 + 20)}%`
    const left = `${Math.floor(Math.random() * 50 + 20)}%`

    return (
        <div
            className="fixed z-50 px-6 py-4 bg-cyan-500/90 text-white font-semibold rounded-xl shadow-2xl transition-all duration-300"
            style={{ top, left, transform: "translate(-50%, -50%)" }}
        >
            Drop file to upload 📄
        </div>
    )
}

const Page = () => {
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        companyName: "",
        description: "",
        generationType: "manual",
        sidePanel: {},
        location: "",
        department: ""
    })

    const [aiInputs, setAiInputs] = useState({
        jobRole: "",
        keySkills: "",
        industry: "",
        location: "",
        yearsOfExperience: "",
        ctcRange: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAiInputChange = (e) => {
        const { name, value } = e.target;
        setAiInputs(prev => ({ ...prev, [name]: value }));
    };

    // AI JD generator
    const generatejd = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
            alert("You must be signed in to upload");
            setLoading(false);
            return;
        }

        const { jobRole, keySkills, industry, location, yearsOfExperience, ctcRange } = aiInputs;

        try {
            const token = await user.getIdToken(true);

            const response = await fetch("/api/generatejd-ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    jobRole,
                    keySkills,
                    industry,
                    location,
                    yearsOfExperience,
                    ctcRange,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate JD from AI");
            }

            const data = await response.json();
            console.log("res", data);

            let rawText = data.job_description.raw_text || "";
            if (typeof rawText === "string") {
                rawText = rawText.replace(/```json|```/g, "").trim();
            }
            const jsondata = JSON.parse(rawText);
            console.log("Parsed JD:", jsondata);

            const newFormData = {
                title: jsondata.title || "MISSING",
                companyName: jsondata.companyName || "MISSING",
                location: jsondata.location || "MISSING",
                description: jsondata.description || {},
                sidePanel: jsondata.sidePanel || {},
                generationType: "ai",
                department: jsondata.sidePanel.industry_type || "MISSING",
            };
            setFormData(newFormData);
            setIsEditing(true);
        } catch (error) {
            console.error("Error generating JD:", error);
            alert("❌ " + error.message);
        } finally {
            setLoading(false);
        }
    };


    // File Upload JD Parser
    const handleFileUpload = async (file) => {
        if (!file) return
        setLoading(true)

        try {
            const user = auth.currentUser
            if (!user) {
                alert("You must be signed in to upload")
                setLoading(false)
                return
            }

            const token = await user.getIdToken(true)

            const uploadData = new FormData()
            uploadData.append("file", file)

            const response = await fetch("/api/parse-job-file", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: uploadData,
            })

            if (response.ok) {
                const data = await response.json()
                console.log("res", data);
                setFormData({
                    title: data.title || "MISSING",
                    companyName: data.company || "MISSING",
                    description: data.description || "",
                    sidePanel: data.sidePanel || {},
                    generationType: "file",
                    location: data.location || "MISSING",
                    department: data.department || "MISSING"
                })
                setIsEditing(true)
            } else {
                let errorMsg = "Failed to parse file"
                try {
                    const err = await response.json()
                    errorMsg = err.error || errorMsg
                } catch { }
                alert(errorMsg)
            }
        } catch (err) {
            console.error("Error uploading file:", err)
            alert("Error uploading file")
        } finally {
            setLoading(false)
        }
    }

    // handles pasting JD text
    const handlePaste = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be signed in to paste");
                setLoading(false);
                return;
            }

            const pastedText = await navigator.clipboard.readText();
            if (!pastedText) {
                alert("Clipboard is empty.");
                setLoading(false);
                return;
            }

            const token = await user.getIdToken(true);
            const response = await fetch("/api/parse-job-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: pastedText }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to parse pasted text.");
            }

            const data = await response.json();
            setFormData({
                title: data.title || "MISSING",
                companyName: data.company || "MISSING",
                description: data.description || "",
                sidePanel: data.sidePanel || {},
                generationType: "manual",
                location: data.location || "MISSING",
                department: data.department || "MISSING"
            });
            setIsEditing(true);
        } catch (error) {
            console.error("Error processing pasted text:", error);
            alert("❌ " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Submit JD
    const handleSubmit = async () => {
        // Validation
        const requiredFields = {
            title: formData.title,
            companyName: formData.companyName,
            department: formData.department,
            location: formData.location,
            description: formData.description
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
            .map(([key]) => key);

        if (missingFields.length > 0) {
            const message = `⚠️ Please fill in all required fields before saving: ${missingFields.join(', ')}.`;
            alert(message);
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be signed in to create a job");
                setLoading(false);
                return;
            }

            const token = await user.getIdToken(true);
            const response = await fetch("/api/job-descriptions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    description: typeof formData.description === "object"
                        ? JSON.stringify(formData.description)
                        : formData.description,
                }),
            });

            if (response.ok) {
                alert("✅ Job Description saved successfully!");
                setFormData({
                    title: "",
                    companyName: "",
                    description: "",
                    department: "",
                    generationType: "manual",
                    sidePanel: {},
                    location: ""
                });
                setIsEditing(false);
            } else {
                const err = await response.json();
                alert("❌ " + (err.error || "Failed to create JD"));
            }
        } catch (err) {
            console.error("Error creating job:", err);
            alert("❌ Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            // Reset to last saved state or clear form
            setFormData({
                title: "",
                companyName: "",
                description: "",
                department: "",
                generationType: "manual",
                sidePanel: {},
                location: ""
            });
        }
    };

    return (
        <div className="flex min-h-screen w-screen bg-gray-50">
            <Sidebar />
            <div className="w-full">

                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex justify-between w-full items-center gap-4">
                            <span className="text-gray-600">
                                Welcome, <span className="text-blue-600 font-medium">Candidate Name</span>
                            </span>
                            <Button variant="ghost" size="sm" className="w-8 h-8 hover:bg-gray-300 text-black rounded-full border border-black">
                                <User className="w-4 h-4 rounded-full text-black" />
                            </Button>
                        </div>
                    </div>
                </header >

                <main className="w-full flex flex-col justify-between p-2 h-[calc(100vh-80px)]">
                    <div className="flex flex-row justify-between text-black">
                        {/* Upload + AI Section */}
                        <div className="ml-2">
                            <span className="">Job Description for a Position</span>
                            <div className="flex flex-col gap-4 mt-2 justify-center ">
                                <label className="flex flex-row gap-2 items-center text-center justify-center w-[80%] h-8 rounded-md bg-cyan-400/20 hover:bg-cyan-400/30 cursor-pointer">
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 text-cyan-600 animate-spin" />
                                    ) : (
                                        <Upload className="w-4 h-4 text-cyan-600" />
                                    )}
                                    <span className="text-sm ">Upload a JD</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".doc,.docx,.txt,.pdf"
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                        disabled={loading}
                                    />
                                </label>
                                <Button
                                    onClick={handlePaste}
                                    variant="ghost"
                                    size="sm"
                                    className="w-[80%] bg-cyan-400/20 hover:bg-cyan-400/30 hover:text-black"
                                    disabled={loading}
                                >
                                    Paste a JD
                                </Button>
                            </div>
                        </div>

                        {/* AI Inputs */}
                        <div className="flex flex-row justify-between gap-4">
                            <span>‘Or’ generate an <br /> AI Generated JD</span>
                            <div>
                                <input
                                    placeholder='Job Role / Job Title'
                                    type="text"
                                    className="bg-cyan-400/20 p-1.5 mx-2 rounded-sm"
                                    name="jobRole"
                                    value={aiInputs.jobRole}
                                    onChange={handleAiInputChange}
                                    disabled={loading}
                                />
                                <input
                                    placeholder='Key Skills'
                                    type="text"
                                    className="bg-cyan-400/20 p-1.5 m-2 rounded-sm"
                                    name="keySkills"
                                    value={aiInputs.keySkills}
                                    onChange={handleAiInputChange}
                                    disabled={loading}
                                />
                                <input
                                    placeholder='Industry'
                                    type="text"
                                    className="bg-cyan-400/20 p-1.5 m-2 rounded-sm"
                                    name="industry"
                                    value={aiInputs.industry}
                                    onChange={handleAiInputChange}
                                    disabled={loading}
                                />
                                <br />
                                <input
                                    placeholder='Location'
                                    type="text"
                                    className="bg-cyan-400/20 p-1.5 mx-2 rounded-sm"
                                    name="location"
                                    value={aiInputs.location}
                                    onChange={handleAiInputChange}
                                    disabled={loading}
                                />
                                <input
                                    placeholder='Years of Experience'
                                    type="text"
                                    className="bg-cyan-400/20 p-1.5 m-2 rounded-sm"
                                    name="yearsOfExperience"
                                    value={aiInputs.yearsOfExperience}
                                    onChange={handleAiInputChange}
                                    disabled={loading}
                                />
                                <input
                                    placeholder='CTC Range'
                                    type="text"
                                    className="bg-cyan-400/20 p-1.5 m-2 rounded-sm"
                                    name="ctcRange"
                                    value={aiInputs.ctcRange}
                                    onChange={handleAiInputChange}
                                    disabled={loading}
                                />
                                <Button
                                    onClick={generatejd}
                                    variant="ghost"
                                    size="sm"
                                    className="bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black"
                                    disabled={loading}
                                >
                                    Generate
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* JD Editor + Side Panel */}
                    <div className="flex flex-row justify-between gap-4 mt-4 items-stretch flex-1 h-full bg-transparent">
                        <div className="flex items-stretch justify-center w-full h-full bg-gray-200 rounded-sm shadow-xl">
                            <textarea
                                className="bg-white inset-0 w-full h-[95%] resize-none p-2 m-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 overflow-y-auto overflow-x-hidden"
                                style={{ minHeight: 0 }}
                                value={
                                    formData.generationType === "ai" && typeof formData.description === "object" && formData.description !== null
                                        ? [
                                            formData.description.about ? `About the Role:\n${formData.description.about}\n` : "",
                                            Array.isArray(formData.description.key_responsibilities) && formData.description.key_responsibilities.length > 0
                                                ? `Key Responsibilities:\n- ${formData.description.key_responsibilities.join("\n- ")}\n` : "",
                                            Array.isArray(formData.description.qualifications) && formData.description.qualifications.length > 0
                                                ? `Qualifications:\n- ${formData.description.qualifications.join("\n- ")}\n` : "",
                                            Array.isArray(formData.description.what_we_offer) && formData.description.what_we_offer.length > 0
                                                ? `What We Offer:\n- ${formData.description.what_we_offer.join("\n- ")}\n` : "",
                                            formData.location ? `Location: ${formData.location}\n` : ""
                                        ].filter(Boolean).join("\n")
                                        : (formData.description || "")
                                }
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Job description will appear here..."
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="flex flex-col items-stretch w-full h-full">
                            <div className="flex flex-col items-stretch w-full h-full justify-center gap-2 shadow-lg bg-gray-200/80">
                                <div
                                    className="bg-white w-[95%] flex-1 min-h-0 p-2 rounded border border-gray-200 overflow-y-auto m-4 mb-1"
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        // Update sidePanel state when content is edited
                                        const newSidePanel = {};
                                        e.target.childNodes.forEach(node => {
                                            const text = node.textContent.trim();
                                            if (text) {
                                                const [key, value] = text.split(":");
                                                if (key && value) {
                                                    newSidePanel[key.toLowerCase().replace(/ /g, '_')] = value.trim();
                                                }
                                            }
                                        });
                                        setFormData(prev => ({ ...prev, sidePanel: newSidePanel }));
                                    }}
                                    style={{ outline: "none" }}
                                >
                                    {formData?.sidePanel &&
                                        Object.entries(formData.sidePanel).map(([key, value]) => {
                                            if (Array.isArray(value)) return null
                                            return (
                                                <div key={key}>
                                                    <strong>{key.replace(/_/g, ' ')}:</strong> {value}
                                                </div>
                                            )
                                        })}
                                    {formData.generationType === "ai" && Array.isArray(formData.description?.key_skills) && formData.description.key_skills.length > 0 && (
                                        <div>
                                            <strong>Key Skills:</strong> {formData.description.key_skills.join(", ")}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="bg-white w-[95%] flex-1 min-h-0 p-2 rounded border border-gray-200 overflow-y-auto mt-0 m-4"
                                    contentEditable={isEditing}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        // Update job highlights when content is edited
                                        const newHighlights = [];
                                        e.target.querySelectorAll('li').forEach(li => {
                                            if (li.textContent.trim()) {
                                                newHighlights.push(li.textContent.trim());
                                            }
                                        });
                                        setFormData(prev => ({ ...prev, sidePanel: { ...prev.sidePanel, job_highlights: newHighlights } }));
                                    }}
                                    style={{ outline: "none" }}
                                >
                                    <ul>
                                        {Array.isArray(formData?.sidePanel?.job_highlights) &&
                                            formData.sidePanel.job_highlights.map((req, index) => (
                                                <li key={index}>{req}</li>
                                            ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="flex flex-col mt-2 w-full items-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-24 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black"
                                    onClick={handleEditToggle}
                                >
                                    {isEditing ? "Cancel" : "Edit"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={loading || !isEditing}
                                    className="w-24 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black"
                                >
                                    {loading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <DragDropOverlay onFileDrop={handleFileUpload} />
        </div>
    )
}

export default Page;