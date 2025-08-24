"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card"
import { Alert, AlertDescription } from "@/components/alert"
import { auth, db } from "@/lib/firebase"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

const SignInForm = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSignin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {

            const userCred = await signInWithEmailAndPassword(auth, email, password);

            const idToken = await userCred.user.getIdToken();



            await fetch("/api/set-session", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: idToken
                }),
            });


            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            setError(
                "Please enter your email address first"
            );
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);


            alert("Password reset email sent! Check your inbox.");
        } catch (err) {
            setError("Failed to send reset email");

        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError("");
        // setMessage("");

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Firestore reference
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // If new user, assign default or chosen role
                await setDoc(userRef, {
                    email: user.email,
                    role: "recruiter", // default role (change to recruiter if needed)
                    createdAt: serverTimestamp(),
                    profilePicture: "",
                    phoneNo: ""
                });
            }

            const idToken = await user.getIdToken();



            await fetch("/api/set-session", {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: idToken
                }),
            });

            // alert("Signed up successfully with Google!");
            window.location.href = "/dashboard"; // ✅ redirect directly
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to sign up with Google");
        } finally {
            setLoading(false);
        }
    };


    const handleLinkedInSignIn = async () => {
        setLoading(true)
        try {
            // Replace with actual LinkedIn OAuth implementation
            console.log("LinkedIn sign in clicked")
            await new Promise((resolve) => setTimeout(resolve, 1000))
        } catch (err) {
            setError("Failed to sign in with LinkedIn")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-800 to-gray-950 relative overflow-hidden flex items-center justify-center p-4">
            {/* Background pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.02)_25%,rgba(59,130,246,0.02)_50%,transparent_50%,transparent_75%,rgba(59,130,246,0.02)_75%)] bg-[length:60px_60px]" />

            {/* Floating elements for visual interest */}
            {/* <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/30 rounded-full blur-xl" />
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-100/30 rounded-full blur-xl" />
            <div className="absolute top-1/2 left-10 w-24 h-24 bg-slate-100/40 rounded-full blur-lg" />        
            */}
            <Card className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-sm border-gray-200/50 glass-effect shadow-2xl border-0 animate-pulse-glow ">
                <CardHeader className="space-y-2 text-center pb-6">
                    <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                    <CardDescription className="text-gray-600">Sign in to find your next opportunity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 text-sm text-black font-medium border-gray-300 hover:border-gray-500 hover:bg-gray-200 hover:cursor-pointer hover:text-black"
                            onClick={handleGoogleSignIn}
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
                            className="w-full h-11 text-sm font-medium border-gray-300 hover:border-gray-500 hover:bg-gray-200 hover:cursor-pointer hover:text-black"
                            onClick={handleLinkedInSignIn}
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

                    <form onSubmit={handleSignin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
                                Email Address
                            </Label>
                            <Input
                                id="signin-email"
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
                            <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                                Password
                            </Label>
                            <Input
                                id="signin-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                    Signing In...
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors underline block mx-auto font-medium"
                        >
                            Forgot your password?
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => (window.location.href = "/signup")}
                                    className="text-blue-600 hover:text-blue-700 transition-colors font-medium hover:underline"
                                >
                                    Sign up here
                                </button>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div >
    )
}

export default SignInForm
