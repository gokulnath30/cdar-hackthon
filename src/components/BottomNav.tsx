import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, ShoppingBag, LogOut, Mic, User, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "../components/ui/button";
import { useEffect, useRef, useState, useCallback } from "react";
import { useGlobalTranscriber } from "../context/TranscriberProvider";
import Constants from "../utils/Constants";
import { generate, chatReply, ChatMessage, subscribeLlmStatus } from "../lib/llm";

// Get current user ID from local storage
const userId = localStorage.getItem("audit_app_current_user");

const navItems = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/store_page", label: "Stores", Icon: MapPin },
  { to: "/products", label: "Products", Icon: ShoppingBag },
  { to: "/profile", label: "Profile", Icon: User },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful assistant. Use concise answers." }
  ]);
  const [isGeneratingLLM, setIsGeneratingLLM] = useState(false);
  const [lastLLMReply, setLastLLMReply] = useState<string>("");
  const [llmLoadingPct, setLlmLoadingPct] = useState<number | null>(null);
  const [llmLoadingShard, setLlmLoadingShard] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriber = useGlobalTranscriber();

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Whisper model progress
  const [whisperPct, setWhisperPct] = useState<number | null>(null);

  // Check if user is logged in (you can replace this with your actual auth check)
  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    setIsLoggedIn(!!user);
  }, [pathname]);

  // Hide bottom nav on login screen and logout screen
  if (pathname === "/" || pathname === "/logout") return null;

  const handleLogout = () => {
    localStorage.removeItem("audit_app_current_user");
    navigate("/");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        decodeAndTranscribe(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setIsRecording(true);
      setShowOverlay(true);
      setTranscript("Listening...");
    } catch (err) {
      console.error("Mic access error", err);
      setTranscript("Microphone error.");
      setShowOverlay(true);
    }
  };

  const decodeAndTranscribe = async (blob: Blob) => {
    try {
      const arrayBuf = await blob.arrayBuffer();
      const audioCTX = new AudioContext({ sampleRate: Constants.SAMPLING_RATE });
      const decoded = await audioCTX.decodeAudioData(arrayBuf);
      transcriber.onInputChange();
      transcriber.start(decoded);
    } catch (e) {
      console.error("Decode error", e);
      setTranscript("Decode error.");
      setIsTranscribing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (transcript === "Listening...") setTranscript("Processing audio...");
  };

  const handleMicClick = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const runLLM = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim() || isGeneratingLLM) return;
    setIsGeneratingLLM(true);
    try {
      const { assistantText, messages } = await chatReply(chat, finalTranscript);
      setChat(messages);
      setLastLLMReply(assistantText);
    } catch (e) {
      console.error("LLM error", e);
      setLastLLMReply("LLM error.");
    } finally {
      setIsGeneratingLLM(false);
    }
  }, [chat, isGeneratingLLM]);

  useEffect(() => {
    const liveHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fullText: string; isBusy: boolean };
      if (!showOverlay) setShowOverlay(true);
      if (detail.isBusy) {
        setTranscript(detail.fullText || "Transcribing...");
        setIsTranscribing(true);
      } else {
        setTranscript(detail.fullText || "");
        setIsTranscribing(false);
        setIsRecording(false);
        // Call LLM once final transcript ready
        runLLM(detail.fullText || "");
      }
    };
    window.addEventListener("live-transcription", liveHandler);
    return () => window.removeEventListener("live-transcription", liveHandler);
  }, [showOverlay, runLLM]);

  // Speak assistant reply automatically (optional: comment out if not desired)
  useEffect(() => {
    if (!lastLLMReply || isGeneratingLLM) return;
    speak(lastLLMReply);
  }, [lastLLMReply]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.lang = "en-US";
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  };

  const stopSpeaking = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (lastLLMReply) {
      speak(lastLLMReply);
    }
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // LLM and Whisper progress subscription
  useEffect(() => {
    const unsub = subscribeLlmStatus(e => {
      if (e.type === 'loading-start') {
        setLlmLoadingPct(0);
        setLlmLoadingShard(null);
      } else if (e.type === 'loading-progress') {
        if (e.percent !== undefined) setLlmLoadingPct(e.percent);
        if (e.file) setLlmLoadingShard(e.file);
      } else if (e.type === 'loading-complete') {
        setLlmLoadingPct(null);
        setLlmLoadingShard(null);
      }
    });
    return unsub;
  }, []);

  // Listen for whisper progress custom events (dispatch these from transcriber implementation)
  useEffect(() => {
    const handler = (ev: Event) => {
      const d = (ev as CustomEvent).detail as { percent?: number };
      if (d.percent !== undefined) setWhisperPct(d.percent);
      if (d.percent === 100) {
        setTimeout(() => setWhisperPct(null), 800);
      }
    };
    window.addEventListener('whisper-progress', handler);
    return () => window.removeEventListener('whisper-progress', handler);
  }, []);

  return (
    <>
      {/* Transcript Overlay */}
      {showOverlay && (
        <div
          className="fixed bottom-40 right-6 w-72 max-w-[75vw] rounded-xl border border-white/20 bg-black/50 backdrop-blur-md shadow-lg p-3 z-[200] text-xs text-white flex flex-col gap-3"
          role="status"
        >
          <div className="flex items-start justify-between">
            <span className="font-medium tracking-wide">Voice Chat</span>
            <button
              onClick={() => setShowOverlay(false)}
              className="text-white/70 hover:text-white"
              aria-label="Close overlay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {/* Show last user transcript (final) */}
            {transcript && !isTranscribing && (
              <div className="rounded bg-white/10 px-2 py-1">
                <span className="text-blue-200">You: </span>
                <span>{transcript}</span>
              </div>
            )}

            {/* Streaming state */}
            {isTranscribing && (
              <div className="flex items-center gap-2 text-indigo-200">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Transcribing...</span>
              </div>
            )}

            {/* LLM reply */}
            {(lastLLMReply || isGeneratingLLM) && (
              <div className="rounded bg-white/10 px-2 py-1 flex items-start gap-2">
                <span className="text-green-200">Assistant: </span>
                {isGeneratingLLM ? (
                  <span className="opacity-70">Thinking...</span>
                ) : (
                  <span className="flex-1">{lastLLMReply}</span>
                )}
                {!isGeneratingLLM && lastLLMReply && (
                  <button
                    onClick={toggleSpeak}
                    className="text-white/70 hover:text-white p-1 rounded"
                    aria-label={isSpeaking ? "Stop audio" : "Play audio"}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* LLM and Whisper progress */}
          {(llmLoadingPct !== null || whisperPct !== null) && (
            <div className="space-y-2">
              {llmLoadingPct !== null && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/80">LLM model</span>
                    <span>{llmLoadingPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded overflow-hidden">
                    <div
                      style={{ width: `${llmLoadingPct}%` }}
                      className="h-full bg-blue-500 transition-all"
                    />
                  </div>
                  {llmLoadingShard && (
                    <div className="mt-1 text-[10px] opacity-70 truncate">
                      {llmLoadingShard}
                    </div>
                  )}
                </div>
              )}
              {whisperPct !== null && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/80">Whisper model</span>
                    <span>{whisperPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded overflow-hidden">
                    <div
                      style={{ width: `${whisperPct}%` }}
                      className="h-full bg-green-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-medium"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={() => {
                  setTranscript("");
                  setLastLLMReply("");
                  startRecording();
                }}
                className="px-2 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-medium"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg px-3 bg-card/100 backdrop-blur shadow-lg z-[100] md:hidden">
        <ul className="flex justify-around items-center py-2">
          {navItems.map(({ to, label, Icon }) => (
            <li key={`${to}-${label}`} className="flex-none">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
                <span className="select-none">{label}</span>
              </NavLink>
            </li>
          ))}

          {/* Logout Button */}
          <li className="flex-none">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-full text-xs text-red-500 hover:text-red-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="select-none">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
      {/* Floating voice action button */}
      <Button
        size="icon"
        className={`fixed bottom-24 right-6 rounded-full shadow-xl w-14 h-14 z-50 transition-transform hover:scale-105 md:hidden ${
          isRecording
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        }`}
        onClick={handleMicClick}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <Mic className={`w-6 h-6 ${isRecording ? "animate-pulse" : ""}`} />
      </Button>
    </>
  );
};

export default BottomNav;