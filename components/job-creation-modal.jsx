"use client"
import { useState } from "react"
import { Button } from "@/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"
import { auth } from "@/lib/firebase";
import { X, Upload, FileText, Loader2, CheckCircle } from "lucide-react"

export default function JobCreationModal({ isOpen, onClose }) {
    const [mode, setMode] = useState(null) // 'manual' or 'upload'
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [formData, setFormData] = useState({
        title: "",
        companyName: "",
        description: "",
    })

    if (!isOpen) return null

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be signed in to upload");
                return;
            }

            const token = await user.getIdToken(true); // ✅ force refresh token

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/parse-job-file", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // ✅ send token for auth
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    title: data.title || "",
                    companyName: data.companyName || "",
                    description: data.description || "",
                });
                setMode("manual");
            } else {
                const error = await response.json();
                alert(error.error || "Failed to parse file");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Error uploading file");
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be signed in to create a job");
                return;
            }

            // ✅ Get Firebase token
            const token = await user.getIdToken(true);

            const response = await fetch("/api/job-descriptions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // ✅ Send token
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setSuccess(true)
                setTimeout(() => {
                    onClose()
                    setFormData({ title: "", companyName: "", description: "" })
                    setMode(null)
                    setSuccess(false)
                }, 1500)
            } else {
                const error = await response.json()
                alert(error.error || "Failed to create job description")
            }
        } catch (error) {
            console.error("Error creating job:", error)
            alert("Error creating job description")
        } finally {
            setLoading(false)
        }
    }

    const resetModal = () => {
        setMode(null)
        setFormData({ title: "", companyName: "", description: "" })
        setSuccess(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Create Job Description
                        </CardTitle>
                        <CardDescription>Choose how you'd like to create your job description</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-500">
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>

                <CardContent className="space-y-6">
                    {success && (
                        <div className="text-center py-8">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-green-700 mb-2">Job Created Successfully!</h3>
                            <p className="text-slate-600">Your job description has been saved.</p>
                        </div>
                    )}

                    {!success && !mode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Manual Entry Option */}
                            <button
                                onClick={() => setMode("manual")}
                                className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50/50 transition-all duration-200 group"
                            >
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 bg-cyan-600 rounded-lg mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Fill Manually</h3>
                                    <p className="text-sm text-slate-600">Create job description from scratch</p>
                                </div>
                            </button>

                            {/* File Upload Option */}
                            <label className="p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-cyan-500 hover:bg-cyan-50/50 transition-all duration-200 group cursor-pointer">
                                <input
                                    type="file"
                                    accept=".doc,.docx,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={loading}
                                />
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 bg-cyan-600 rounded-lg mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {loading ? (
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        ) : (
                                            <Upload className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-slate-900">Upload File</h3>
                                    <p className="text-sm text-slate-600">{loading ? "Processing..." : "Upload document to auto-fill"}</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {!success && mode === "manual" && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Job Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Senior Software Engineer"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                                    placeholder="e.g. Tech Corp Inc."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Job Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter the full job description..."
                                    rows={8}
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button type="button" variant="outline" onClick={resetModal}>
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-cyan-600 hover:bg-cyan-700"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Job"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
