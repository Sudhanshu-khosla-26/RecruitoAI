"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Vapi from "@vapi-ai/web";
import { Card, CardContent } from "@/components/card";
import { Button } from "@/components/button";
import { Mic, Video, Monitor, User } from "lucide-react";
import Webcam from "react-webcam";
import Sidebar from "@/components/sidebar";
import { useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPIAI_API_KEY;

function Avatar({ stream }) {
    const { scene } = useGLTF("/3d-interviewer.glb");
    const analyserRef = useRef(null);
    const meshRef = useRef(null);
    const smoothVolume = useRef(0);
    const blinkTimer = useRef(0);
    const headRef = useRef(null);
    const headTargetRotation = useRef({ x: 0, y: 0 });
    const headTimer = useRef(0);

    // Connect WebAudio to the live remote stream for lipsync
    useEffect(() => {
        if (!stream) return;

        const listener = new THREE.AudioListener();
        const temp = new THREE.Camera();
        temp.add(listener);

        const audio = new THREE.Audio(listener);
        const ctx = (listener.context || listener).audioContext || listener.context;
        const audioContext = ctx || new (window.AudioContext || window.webkitAudioContext)();

        const source = audioContext.createMediaStreamSource(stream);
        audio.setNodeSource?.(source);
        if (!audio.getOutput && audio.setMediaStreamSource) {
            audio.setMediaStreamSource(stream);
        }

        const analyser = new THREE.AudioAnalyser(audio, 64);
        analyserRef.current = analyser;

        return () => {
            analyserRef.current = null;
            try {
                source.disconnect();
            } catch (e) {
                console.warn("Error disconnecting source:", e);
            }
            try {
                audio?.disconnect?.();
            } catch (e) {
                console.warn("Error disconnecting audio:", e);
            }
            try {
                if (audioContext.state === "running") {
                    audioContext.close();
                }
            } catch (e) {
                console.warn("Error closing audio context:", e);
            }
        };
    }, [stream]);

    // Find head mesh & bone
    useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary && /Head/i.test(child.name)) {
                meshRef.current = child;
            }
            if (child.isBone && /Head/i.test(child.name)) {
                headRef.current = child;
            }
        });
    }, [scene]);

    useFrame((state, delta) => {
        const mesh = meshRef.current;
        if (!mesh) return;

        const dict = mesh.morphTargetDictionary;
        const influences = mesh.morphTargetInfluences;
        if (!dict || !influences) return;

        // Lipsync from analyser
        let volume = 0;
        if (analyserRef.current) {
            volume = analyserRef.current.getAverageFrequency() / 200;
            smoothVolume.current += (volume - smoothVolume.current) * 0.3;

            // Reset morphs
            if (dict["jawOpen"] !== undefined) influences[dict["jawOpen"]] = 0;
            if (dict["eyeBlinkLeft"] !== undefined) influences[dict["eyeBlinkLeft"]] = 0;
            if (dict["eyeBlinkRight"] !== undefined) influences[dict["eyeBlinkRight"]] = 0;

            if (dict["jawOpen"] !== undefined) {
                influences[dict["jawOpen"]] = volume > 0.05 ? Math.min(smoothVolume.current, 1) : 0;
            }
        }

        // Natural blinking
        blinkTimer.current -= delta;
        if (blinkTimer.current <= 0 && dict) {
            if (dict["eyeBlinkLeft"] !== undefined && dict["eyeBlinkRight"] !== undefined) {
                influences[dict["eyeBlinkLeft"]] = 1;
                influences[dict["eyeBlinkRight"]] = 1;
                setTimeout(() => {
                    if (!meshRef.current) return;
                    influences[dict["eyeBlinkLeft"]] = 0;
                    influences[dict["eyeBlinkRight"]] = 0;
                }, 120);
            }
            blinkTimer.current = 3 + Math.random() * 3;
        }

        // Gentle head tilts
        headTimer.current -= delta;
        if (headTimer.current <= 0) {
            headTargetRotation.current = {
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.15,
            };
            headTimer.current = 4 + Math.random() * 4;
        }

        if (headRef.current) {
            headRef.current.rotation.x += (headTargetRotation.current.x - headRef.current.rotation.x) * 0.02;
            headRef.current.rotation.y += (headTargetRotation.current.y - headRef.current.rotation.y) * 0.02;

            const headPos = new THREE.Vector3();
            headRef.current.getWorldPosition(headPos);
            state.camera.lookAt(headPos);
        }
    });

    return <primitive object={scene} scale={14} position={[0, -18.5, 0]} rotation={[0, 0, 0]} />;
}

export default function Page() {
    const [questions, setQuestions] = useState([
        {
            "interviewId": "SkWRoKjHG4dBrSiLiUUk",
            "question": "What did you learn from this entire experience?",
            "answer": "",
            "score": 0,
            "feedback": "",
            "createdAt": {
                "_seconds": 1756072542,
                "_nanoseconds": 980000000
            }
        },
        {
            "interviewId": "SkWRoKjHG4dBrSiLiUUk",
            "question": "What was the outcome after implementing those actions?",
            "answer": "",
            "score": 0,
            "feedback": "",
            "createdAt": {
                "_seconds": 1756072535,
                "_nanoseconds": 881000000
            }
        },
        {
            "interviewId": "SkWRoKjHG4dBrSiLiUUk",
            "question": "What specific actions did you take based on the feedback?",
            "answer": "",
            "score": 0,
            "feedback": "",
            "createdAt": {
                "_seconds": 1756072282,
                "_nanoseconds": 23000000
            }
        },
        {
            "interviewId": "SkWRoKjHG4dBrSiLiUUk",
            "question": "How did you respond to that feedback?",
            "answer": "",
            "score": 0,
            "feedback": "",
            "createdAt": {
                "_seconds": 1756072275,
                "_nanoseconds": 30000000
            }
        },
        {
            "interviewId": "SkWRoKjHG4dBrSiLiUUk",
            "question": "Tell me about a time you received critical feedback.",
            "answer": "",
            "score": 0,
            "feedback": "",
            "createdAt": {
                "_seconds": 1756072229,
                "_nanoseconds": 554000000
            }
        },
        {
            "interviewId": "SkWRoKjHG4dBrSiLiUUk",
            "question": "Can you give me a different example of a failure?",
            "answer": "",
            "score": 0,
            "feedback": "",
            "createdAt": {
                "_seconds": 1756072222,
                "_nanoseconds": 18000000
            }
        }]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [interviewInfo, setInterviewInfo] = useState(null);
    const [answer, setAnswer] = useState("");
    const [log, setLog] = useState([]);
    const [score, setScore] = useState(null);
    const [vapiStatus, setVapiStatus] = useState("idle");
    const [remoteStream, setRemoteStream] = useState(null);
    const [user, setUser] = useState(null);
    const [isInterviewStarted, setIsInterviewStarted] = useState(false);

    const { id: interviewId } = useParams();
    const vapiRef = useRef(null);
    const startedRef = useRef(false);

    // Get current question
    const currentQuestion = questions[currentQuestionIndex] || null;

    // API helpers
    const apiStart = useCallback(async (id) => {
        try {
            const response = await fetch("/api/interviews/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interviewId: id }),
            });
            if (!response.ok) throw new Error("Failed to start interview");
            return await response.json();
        } catch (error) {
            console.error("Error starting interview:", error);
            throw error;
        }
    }, []);

    const apiGetQuestions = useCallback(async () => {
        try {
            const response = await fetch("/api/interviews/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interviewId }),
            });
            // if (!response.ok) throw new Error("Failed to fetch questions");
            const data = await response.json();
            setQuestions(data || []);
            return data;
        } catch (error) {
            console.error("Error fetching questions:", error);
            // Fallback questions if API fails
            setQuestions([
                { id: 1, question: "Tell me about yourself and your experience." },
                { id: 2, question: "What are your strengths and weaknesses?" },
                { id: 3, question: "Why do you want to work here?" }
            ]);
        }
    }, [interviewId]);

    const apiAnswer = useCallback(async (questionId, questionText, answerText) => {
        try {
            const response = await fetch("/api/interviews/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qnaId: questionId,
                    question: questionText,
                    answer: answerText
                }),
            });
            if (!response.ok) throw new Error("Failed to submit answer");
            const data = await response.json();
            setScore(data.score);
            setLog((prev) => [...prev, `Score: ${data.score} | Feedback: ${data.feedback}`]);

            // Assistant gives feedback
            vapiRef.current?.send({
                type: "response.create",
                response: {
                    instructions: `Thanks. ${data.feedback}. Your score is ${data.score} out of 100.`,
                },
            });

            return data;
        } catch (error) {
            console.error("Error submitting answer:", error);
            setLog((prev) => [...prev, "Error submitting answer. Please try again."]);
        }
    }, []);

    const apiGetInterview = useCallback(async () => {
        if (!interviewId) return;

        try {
            const response = await fetch("/api/interviews/get", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interviewId }),
            });
            // if (!response.ok) throw new Error("Failed to get interview info");
            const data = await response.json();
            setInterviewInfo(data);
        } catch (error) {
            console.error("Error fetching interview info:", error);
            // Set fallback info
            setInterviewInfo({ title: "Technical Interview", description: "General interview" });
        }
    }, [interviewId]);

    const apiEnd = useCallback(async (id) => {
        try {
            await fetch("/api/interviews/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interviewId: id }),
            });
        } catch (error) {
            console.error("Error ending interview:", error);
        }
    }, []);

    // Auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return unsubscribe;
    }, []);

    // Fetch interview info and questions
    useEffect(() => {
        if (interviewId && !isInterviewStarted) {
            apiGetInterview();
            apiGetQuestions();
        }
    }, [interviewId, apiGetInterview, apiGetQuestions, isInterviewStarted]);

    // Initialize Vapi
    useEffect(() => {
        if (!VAPI_PUBLIC_KEY) {
            console.error("Missing NEXT_PUBLIC_VAPIAI_API_KEY");
            return;
        }

        const vapi = new Vapi(VAPI_PUBLIC_KEY);
        vapiRef.current = vapi;

        const handleCallStart = (call) => {
            setVapiStatus("connected");
            if (call?.remoteMediaStream) {
                setRemoteStream(call.remoteMediaStream);
            }
        };

        const handleCallEnd = () => {
            setVapiStatus("ended");
            setRemoteStream(null);
        };

        const handleTranscript = (transcript) => {
            setLog((prev) => [...prev, `${transcript.role}: ${transcript.text}`]);
            if (transcript.role === "user") {
                setAnswer(transcript.text);
            }
        };

        const handleMessage = (message) => {
            if (message?.message) {
                setLog((prev) => [...prev, `Assistant: ${message.message}`]);
            }
        };

        const handleError = (error) => {
            console.error("Vapi error:", error);
            setLog((prev) => [...prev, `Error: ${error.message || "Unknown error"}`]);
        };

        vapi.on("call-start", handleCallStart);
        vapi.on("call-end", handleCallEnd);
        vapi.on("transcript", handleTranscript);
        vapi.on("message", handleMessage);
        vapi.on("error", handleError);

        return () => {
            try {
                vapi.stop();
            } catch (e) {
                console.warn("Error stopping Vapi:", e);
            }
            vapi.removeAllListeners();
            vapiRef.current = null;
        };
    }, []);

    // Start interview
    useEffect(() => {
        const startInterview = async () => {
            if (!interviewId || !vapiRef.current || startedRef.current || questions.length === 0) {
                return;
            }

            startedRef.current = true;
            setIsInterviewStarted(true);
            setVapiStatus("connecting");

            try {
                await apiStart(interviewId);

                const assistantOptions = {
                    name: "AI Recruiter",
                    firstMessage: `Hi ${user?.displayName || "there"}, how are you? Ready for your interview for ${interviewInfo?.title || "this position"}?`,
                    transcriber: {
                        provider: "deepgram",
                        model: "nova-2",
                        language: "en-US",
                    },
                    voice: {
                        provider: "playht",
                        voiceId: "jennifer",
                    },
                    model: {
                        provider: "openai",
                        model: "gpt-4",
                        messages: [
                            {
                                role: "system",
                                content: `You are an AI voice assistant conducting interviews for ${interviewInfo?.title || "this position"}.

Your job is to ask the provided interview questions one by one and provide encouraging feedback.

Here are the questions to ask in order:
${questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}

Guidelines:
- Ask one question at a time and wait for the candidate's response
- Provide brief, encouraging feedback after each answer
- Keep the conversation natural and engaging
- If the candidate struggles, offer hints without giving away the answer
- Be friendly, professional, and supportive
- After all questions, wrap up the interview positively

Current question: ${currentQuestion?.question || "No questions available"}`,
                            },
                        ],
                    },
                };

                await vapiRef.current.start(assistantOptions);

                // Ask first question via Vapi
                if (currentQuestion) {
                    setTimeout(() => {
                        vapiRef.current?.send({
                            type: "response.create",
                            response: {
                                instructions: `Let's start with the first question: ${currentQuestion.question}`
                            },
                        });
                    }, 2000); // Wait 2 seconds after greeting
                }

            } catch (error) {
                console.error("Error starting interview:", error);
                setVapiStatus("idle");
                startedRef.current = false;
                setIsInterviewStarted(false);
            }
        };

        startInterview();
    }, [interviewId, user, interviewInfo, questions, currentQuestion, apiStart]);

    // UI handlers
    const submitAnswer = useCallback(async () => {
        if (!currentQuestion || !answer.trim()) return;

        await apiAnswer(currentQuestion.id, currentQuestion.question, answer);
        setAnswer("");
    }, [currentQuestion, answer, apiAnswer]);

    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            const nextQ = questions[nextIndex];

            // Ask next question via Vapi
            vapiRef.current?.send({
                type: "response.create",
                response: {
                    instructions: `Next question: ${nextQ.question}`
                },
            });

            setScore(null);
        } else {
            // No more questions
            vapiRef.current?.send({
                type: "response.create",
                response: {
                    instructions: "That was the last question. Thank you for the interview! We'll be in touch soon."
                },
            });
        }
    }, [currentQuestionIndex, questions]);

    const endInterview = useCallback(async () => {
        if (interviewId) {
            await apiEnd(interviewId);
        }

        try {
            vapiRef.current?.stop();
        } catch (e) {
            console.warn("Error stopping Vapi:", e);
        }

        setVapiStatus("ended");
    }, [apiEnd, interviewId]);

    const statusBadge = {
        connected: { text: "Interview in progress", className: "bg-green-50 text-green-700" },
        connecting: { text: "Connecting...", className: "bg-yellow-50 text-yellow-700" },
        ended: { text: "Interview ended", className: "bg-gray-100 text-gray-700" },
        idle: { text: "Preparing interview...", className: "bg-gray-100 text-gray-700" }
    }[vapiStatus];

    return (
        <div className="flex min-h-screen w-screen bg-gray-50">
            <Sidebar />
            <div className="w-full">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex justify-between w-full items-center gap-4">
                            <span className="text-gray-600">
                                Welcome, <span className="text-blue-600 font-medium">{user?.displayName || "Candidate"}</span>
                            </span>
                            <Button variant="ghost" size="sm" className="w-8 h-8 hover:bg-gray-300 text-black rounded-full border border-black">
                                <User className="w-4 h-4 rounded-full text-black" />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col items-center justify-center md:flex-row gap-4 mb-6">
                            {/* AI Interviewer */}
                            <Card className="relative overflow-hidden h-72 w-lg">
                                <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-600 to-purple-800" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                        AI Interviewer
                                    </span>
                                </div>
                                <CardContent className="absolute bottom-0 h-96 left-0 right-0 p-0 m-0">
                                    <Canvas camera={{ position: [0, 8.5, 36], fov: 25 }} className="w-full h-full">
                                        <ambientLight intensity={0.8} />
                                        <directionalLight position={[2, 2, 2]} intensity={1.2} />
                                        <directionalLight position={[-2, 1, 1]} intensity={0.5} />
                                        <Avatar stream={remoteStream} />
                                    </Canvas>
                                </CardContent>
                            </Card>

                            {/* Candidate */}
                            <Card className="relative overflow-hidden h-72 w-lg">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black" />
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                                        Candidate
                                    </span>
                                </div>
                                <CardContent className="relative h-80 flex items-center justify-center p-0">
                                    <Webcam className="w-max h-max relative" audio={false} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center gap-4 bg-white rounded-full px-6 py-3 shadow-lg border">
                                <Button size="sm" variant="ghost" className="rounded-full bg-black w-12 h-12 p-0">
                                    <Mic className="w-5 h-5 text-white" />
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-full bg-black w-12 h-12 p-0">
                                    <Video className="w-5 h-5 text-white" />
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-full bg-black w-12 h-12 p-0">
                                    <Monitor className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="text-center mb-8">
                            <div className={`inline-flex items-center gap-2 ${statusBadge.className} px-4 py-2 rounded-full`}>
                                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                                <span className="text-sm font-medium">{statusBadge.text}</span>
                            </div>
                        </div>
                    </div>

                    {/* Q/A Panel */}
                    <div className="bg-white rounded-xl border p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm text-gray-500">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </div>
                            <div className="text-sm text-gray-500">
                                Interview: {interviewInfo?.title || "Loading..."}
                            </div>
                        </div>

                        <div className="text-lg font-medium mb-3">
                            {currentQuestion?.question || "Loading questions..."}
                        </div>

                        <textarea
                            className="w-full border rounded-lg p-3 text-sm"
                            rows={3}
                            placeholder="Your answer (you can also speak; the last transcript is captured here)"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                        />

                        <div className="flex gap-3 mt-3">
                            <Button
                                onClick={submitAnswer}
                                disabled={!answer.trim() || !currentQuestion}
                            >
                                Submit Answer
                            </Button>
                            <Button
                                variant="outline"
                                onClick={nextQuestion}
                                disabled={currentQuestionIndex >= questions.length - 1}
                            >
                                Next Question ({currentQuestionIndex + 1}/{questions.length})
                            </Button>
                            <Button variant="destructive" onClick={endInterview}>
                                End Interview
                            </Button>
                        </div>

                        {score !== null && (
                            <div className="mt-3 text-sm">
                                Score: <span className="font-semibold">{score}</span> / 100
                            </div>
                        )}

                        <div className="bg-gray-100 rounded-lg p-3 mt-4 text-sm max-h-40 overflow-y-auto">
                            {log.length === 0 ? (
                                <div className="text-gray-500">Conversation log will appear here...</div>
                            ) : (
                                log.map((entry, index) => (
                                    <div key={index} className="mb-1">{entry}</div>
                                ))
                            )}
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-end max-w-7xl mx-auto">
                        <p className="text-sm text-gray-500">
                            Once the call ends, feedback will be shared with the recruiter.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}