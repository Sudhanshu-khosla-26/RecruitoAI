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
import { auth } from "@/lib/firebase"; // ✅ Firebase client SDK
import { onAuthStateChanged, signOut } from "firebase/auth";

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPIAI_API_KEY;



function Avatar({ stream }) {
    const { scene } = useGLTF(
        "/3d-interviewer.glb"
    );
    const analyserRef = useRef(null);
    const meshRef = useRef(null);
    const smoothVolume = useRef(0);

    const blinkTimer = useRef(0);
    const headRef = useRef(null);
    const headTargetRotation = useRef({ x: 0, y: 0 });
    const headTimer = useRef(0);

    // connect WebAudio to the live remote stream for lipsync
    useEffect(() => {
        if (!stream) return;

        const listener = new THREE.AudioListener();
        // Attach listener to a temp camera-like object to own the context
        const temp = new THREE.Camera();
        temp.add(listener);

        const audio = new THREE.Audio(listener);
        const ctx = (listener.context || listener).audioContext || listener.context;
        const audioContext =
            ctx ? ctx : new (window.AudioContext || (window).webkitAudioContext)();

        const source = audioContext.createMediaStreamSource(stream);
        // @ts-ignore - Three allows node source
        audio.setNodeSource?.(source); // modern three
        // Fallback for older three
        // @ts-ignore
        if (!audio.getOutput && audio.setMediaStreamSource) audio.setMediaStreamSource(stream);

        const analyser = new THREE.AudioAnalyser(audio, 64);
        analyserRef.current = analyser;

        return () => {
            analyserRef.current = null;
            try {
                source.disconnect();
            } catch { }
            try {
                audio?.disconnect?.();
            } catch { }
            try {
                (audioContext.state === "running") && audioContext.close();
            } catch { }
        };
    }, [stream]);

    // find head mesh & bone
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

        // lipsync from analyser
        let volume = 0;
        if (analyserRef.current) {
            volume = analyserRef.current.getAverageFrequency() / 200; // normalise
            smoothVolume.current += (volume - smoothVolume.current) * 0.3;
            // reset all morphs we touch
            if (typeof influences.fill === "function") {
                // only touch mouth/eyes we use instead of fill(0) (safer glTFs)
                if (dict["jawOpen"] !== undefined) influences[dict["jawOpen"]] = 0;
                if (dict["eyeBlinkLeft"] !== undefined) influences[dict["eyeBlinkLeft"]] = 0;
                if (dict["eyeBlinkRight"] !== undefined) influences[dict["eyeBlinkRight"]] = 0;
            }
            if (dict["jawOpen"] !== undefined) {
                influences[dict["jawOpen"]] = volume > 0.05 ? Math.min(smoothVolume.current, 1) : 0;
            }
        }

        // natural blinking
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

        // gentle head tilts
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
        }
    ]);   // full array of objects
    const [currentIndex, setCurrentIndex] = useState(0);
    const [interviewInfo, setinterviewInfo] = useState([])
    const [qnaId, setQnaId] = useState(null);
    const [answer, setAnswer] = useState("");
    const [log, setLog] = useState([]);
    const [score, setScore] = useState(null);
    const [vapiStatus, setVapiStatus] = useState("idle");
    const [remoteStream, setRemoteStream] = useState(null);
    const { id: interviewId } = useParams();
    const [user, setUser] = useState(null);
    // Vapi instance
    const vapiRef = useRef(null);

    // ---- helpers that talk to your Firebase-backed API routes ----
    const apiStart = useCallback(async (id) => {
        await fetch("/api/interviews/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interviewId: id }),
        });
    }, []);

    const apiAsk = useCallback(
        async (context = "") => {
            // const res = await fetch("/api/interviews/ask", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ interviewId, context }),
            // });
            // const data = await res.json();
            // setQuestions(data[0].question);
            // // setQnaId(data);
            // setScore(null);

            // speak via Vapi assistant
            vapiRef.current?.send({
                type: "response.create",
                response: { instructions: questions[0].question },
            });

            return data;
        },
        [interviewId, questions]
    );

    const setquestions = useCallback(async () => {
        const res = await fetch("/api/interviews/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interviewId, context: "" }),
        });
        const data = await res.json();

        // Sort by createdAt ascending
        const sorted = [...data].sort((a, b) => a.createdAt._seconds - b.createdAt._seconds);

        setQuestions(sorted);
        setCurrentIndex(0);

        // Speak first question
        if (sorted.length > 0) {
            vapiRef.current?.send({
                type: "response.create",
                response: { instructions: sorted[0].question },
            });
        }
    }, [interviewId]);

    const apiAnswer = useCallback(async () => {
        if (!qnaId) return null;
        const res = await fetch("/api/interviews/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qnaId, questions, answer }),
        });
        const data = await res.json();
        setScore(data.score);
        setLog((prev) => [...prev, `score: ${data.score} | feedback: ${data.feedback}`]);

        // assistant gives feedback aloud
        vapiRef.current?.send({
            type: "response.create",
            response: {
                instructions: `Thanks. ${data.feedback}. Your score is ${data.score} out of 100.`,
            },
        });

        return data;
    }, [qnaId, questions, answer]);

    const apiEnd = useCallback(async (id) => {
        await fetch("/api/interviews/end", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interviewId: id }),
        });
    }, []);

    // console.log("user", user);

    const apiGetInterview = useCallback(async () => {
        if (!interviewId) return;
        const res = await fetch("/api/interviews/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interviewId }),
        });
        const data = await res.json();
        console.log(data);
        setinterviewInfo(data);
    }, [interviewId]);

    // Fetch interview info when interviewId is available
    useEffect(() => {
        if (interviewId) {
            apiGetInterview();
        }
    }, [interviewId, apiGetInterview]);




    // ---- Vapi lifecycle ----
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });

        if (!VAPI_PUBLIC_KEY) {
            console.error("Missing NEXT_PUBLIC_VAPIAI_API_KEY / NEXT_PUBLIC_VAPI_PUBLIC_KEY");
            return;
        }
        const v = new Vapi(VAPI_PUBLIC_KEY);
        vapiRef.current = v;

        const handleCallStart = (call) => {
            setVapiStatus("connected");
            if (call?.remoteMediaStream) setRemoteStream(call.remoteMediaStream);
        };
        const handleCallEnd = () => setVapiStatus("ended");
        const handleTranscript = (t) => {
            setLog((prev) => [...prev, `${t.role}: ${t.text}`]);
            if (t.role === "user") setAnswer(t.text);
        };
        const handleMessage = (m) => {
            if (m?.message) setLog((prev) => [...prev, `assistant: ${m.message}`]);
        };
        const handleError = (err) => {
            console.error("Vapi error:", err);
        };
        const handleConn = (state) => {
            if (state === "disconnected" || state === "failed") {
                // optionally auto-reconnect
                // v.restart();
            }
        };

        v.on("call-start", handleCallStart);
        v.on("call-end", handleCallEnd);
        v.on("transcript", handleTranscript);
        v.on("message", handleMessage);
        v.on("error", handleError);
        v.on("connection-state-changed", handleConn);

        return () => {
            if (unsubscribe) unsubscribe();
            try {
                v.stop();
            } catch { }
            v.removeAllListeners();
            vapiRef.current = null;
            setRemoteStream(null);
        };
    }, []);

    const startedRef = useRef(false);

    useEffect(() => {
        (async () => {
            if (!interviewId || !vapiRef.current || startedRef.current) return;
            startedRef.current = true;

            setVapiStatus("connecting");
            await apiStart(interviewId);

            const assistantOptions = {
                name: "AI Recruiter",
                firstMessage: `Hi ${user?.displayName || "there"}, how are you? Ready for your interview on ${interviewInfo?.title || "your role"}?`,
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
                            content: `
You are an AI interviewer.

⚡ RULES:
- You do NOT generate your own questions.
- The interviewer app will provide questions one by one.
- After the candidate answers, you only give short encouragement or feedback.
- Example feedback:
  • "Nice! That’s a solid answer."
  • "Hmm, not quite! Want to try again?"
  • "Thanks for sharing that example."

🎤 Conversational style:
- Keep feedback friendly, casual, and natural — like a real person.
- Use phrases like "Alright, let’s move on…" or "Good example!" when responding.
- If the candidate struggles, gently encourage or suggest they think differently, but do not invent or replace the question.

🚀 Interview flow:
1. App gives you a question → you speak it.
2. Wait for the candidate’s response.
3. Give feedback.
4. Wait for the app to provide the next question.
5. After all questions are done, wrap up positively (e.g., "That was great! Thanks for completing this interview. Keep practicing and good luck!").
        `.trim(),
                        },
                    ],
                },
            };

            await vapiRef.current.start(assistantOptions);

            // await vapiRef.current.connect();

            vapiRef.current.on("call-start", async () => {
                setVapiStatus("connected");
                if (questions && questions.length > 0) {
                    await apiAsk("start the interview"); // ask first question automatically
                }
            });

            vapiRef.current.on("call-end", () => {
                setVapiStatus("disconnected");
            });
        })();
    }, [interviewId, user, interviewInfo, questions]);


    //     // boot: start interview, start assistant, ask first
    //     useEffect(() => {
    //         (async () => {
    //             if (!interviewId || !vapiRef.current) return;
    //             setVapiStatus("connecting");

    //             await apiStart(interviewId);

    //             const assistantOptions = {
    //                 name: "AI Recruiter",
    //                 firstMessage: "Hi " + user?.displayName + ", how are you? Ready for your interview on " + interviewInfo?.title,
    //                 transcriber: {
    //                     provider: "deepgram",
    //                     model: "nova-2",
    //                     language: "en-US",
    //                 },
    //                 voice: {
    //                     provider: "playht",
    //                     voiceId: "jennifer",
    //                 },
    //                 model: {
    //                     provider: "openai",
    //                     model: "gpt-4",
    //                     messages: [
    //                         {
    //                             role: "system",
    //                             content: `
    //   You are an AI voice assistant conducting interviews.
    // Your job is to ask candidates provided interview questions, assess their responses.
    // Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
    // "Hey there! Welcome to your `+ interviewInfo?.title + ` interview. Let’s get started with a few questions!"
    // Ask one question at a time and wait for the candidate’s response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
    // Questions: `+ question + `  
    // If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
    // "Need a hint? Think about how React tracks component updates!"
    // Provide brief, encouraging feedback after each answer. Example:
    // "Nice! That’s a solid answer."
    // "Hmm, not quite! Want to try again?"
    // Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let’s tackle a tricky one!"
    // After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
    // "That was great! You handled some tough questions well. Keep sharpening your skills!"
    // End on a positive note:
    // "Thanks for chatting! Hope to see you crushing projects soon!"
    // Key Guidelines:
    // ✅ Be friendly, engaging, and witty 🎤
    // ✅ Keep responses short and natural, like a real conversation
    // ✅ Adapt based on the candidate’s confidence level
    // ✅ Ensure the interview remains focused on React
    // `.trim(),
    //                         },
    //                     ],
    //                 },
    //             };



    //             await vapiRef.current.start(assistantOptions);

    //             await apiAsk("Start of interview");
    //         })();
    //         // eslint-disable-next-line react-hooks/exhaustive-deps
    //     }, [interviewId, interviewInfo]);

    // ---- UI handlers ----
    const submit = useCallback(async () => {
        await apiAnswer();
        setAnswer("");
    }, [apiAnswer]);

    const askNext = useCallback(() => {
        if (currentIndex + 1 < questions.length) {
            const nextQ = questions[currentIndex + 1];
            setCurrentIndex(prev => prev + 1);

            vapiRef.current?.send({
                type: "response.create",
                response: { instructions: nextQ.question },
            });
        } else {
            vapiRef.current?.send({
                type: "response.create",
                response: { instructions: "That was the last question. Thanks for completing the interview!" },
            });
        }
    }, [currentIndex, questions]);


    const endInterview = useCallback(async () => {
        if (interviewId) await apiEnd(interviewId);
        vapiRef.current?.stop();
    }, [apiEnd, interviewId]);





    const statusBadge =
        vapiStatus === "connected"
            ? { text: "Interview is in process", className: "bg-green-50 text-green-700" }
            : vapiStatus === "connecting"
                ? { text: "Connecting interview...", className: "bg-yellow-50 text-yellow-700" }
                : vapiStatus === "ended"
                    ? { text: "Interview ended", className: "bg-gray-100 text-gray-700" }
                    : { text: "Idle", className: "bg-gray-100 text-gray-700" };

    return (
        <div className="flex min-h-screen w-screen bg-gray-50">
            <Sidebar />
            <div className="w-full">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex justify-between w-full items-center gap-4">
                            <span className="text-gray-600">
                                Welcome, <span className="text-blue-600 font-medium">Candidate</span>
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
                        <div className="text-sm text-gray-500">Current question</div>
                        <div className="text-lg font-medium mb-3">{questions[0]?.question || "Waiting..."}</div>

                        <textarea
                            className="w-full border rounded-lg p-3 text-sm"
                            rows={3}
                            placeholder="Your answer (you can also speak; the last transcript is captured here)"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                        />
                        <div className="flex gap-3 mt-3">
                            <Button onClick={submit} disabled={!answer.trim()}>Submit Answer</Button>
                            <Button variant="outline" onClick={askNext}>
                                Ask Next Question
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
                            {log.map((l, i) => <div key={i}>{l}</div>)}
                        </div>

                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-end max-w-7xl mx-auto">
                        <p className="text-sm text-gray-500">Once the call ends, feedback will be shared with the recruiter.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
