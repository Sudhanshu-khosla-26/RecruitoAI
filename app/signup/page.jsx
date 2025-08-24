"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Alert, AlertDescription } from "@/components/alert"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore"

export default function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        setError("");
        // setMessage("");

        try {
            // Create user
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            // Save role in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "recruiter", // default role
                createdAt: serverTimestamp(),
                profilePicture: "",
                phoneNo: ""
            });

            // setMessage("Account created! Default role = recruiter");

            // Redirect to sign-in page
            window.location.href = "/signin";

            // Clear form fields
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error(err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };



    const handleGoogleSignup = async () => {
        setLoading(true);
        setError("");
        // setMessage("");

        try {
            const provider = new GoogleAuthProvider();

            // Sign in with Google popup
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // If new user, set default role
                await setDoc(userRef, {
                    email: user.email,
                    role: "recruiter", // default role
                    createdAt: serverTimestamp(),
                    profilePicture: "",
                    phoneNo: ""
                });
            }

            // setMessage("Signed up successfully with Google!");

            // Redirect to dashboard or signin
            window.location.href = "/signin";
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to sign up with Google");
        } finally {
            setLoading(false);
        }
    };


    const handleLinkedInSignup = async () => {
        setLoading(true)
        try {
            // Replace with actual LinkedIn OAuth implementation
            console.log("LinkedIn signup clicked")
            await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (err) {
            setError("Failed to sign up with LinkedIn")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-gray-950 relative overflow-hidden flex items-center justify-center p-4">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.02)_25%,rgba(59,130,246,0.02)_50%,transparent_50%,transparent_75%,rgba(59,130,246,0.02)_75%)] bg-[length:60px_60px]" />

            <Card className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-sm border-gray-200/50 glass-effect shadow-2xl border-0 animate-pulse-glow">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
                    <CardDescription className="text-gray-600">Join us and start your journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors bg-transparent"
                            onClick={handleGoogleSignup}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors bg-transparent"
                            onClick={handleLinkedInSignup}
                            disabled={loading}
                        >
                            <svg className="w-5 h-5 mr-2" fill="#0A66C2" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            Continue with LinkedIn
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                                Email Address
                            </Label>
                            <Input
                                id="signup-email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="h-10 px-3 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                                Password
                            </Label>
                            <Input
                                id="signup-password"
                                type="password"
                                placeholder="Create a secure password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                                className="h-10 px-3 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="h-10 px-3 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="border-red-200 bg-red-50">
                                <AlertDescription className="text-sm text-red-600">{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </form>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => (window.location.href = "/signin")}
                                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium hover:underline"
                                >
                                    Sign in here
                                </button>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
