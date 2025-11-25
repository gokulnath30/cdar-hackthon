import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, ShoppingBag, LogOut, Mic, User, X, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useGlobalTranscriber } from "../context/TranscriberProvider";
import Constants from "../utils/Constants";
import { useChat } from "../hooks/useChat";

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

  const { sendMessage, messages } = useChat();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriber = useGlobalTranscriber();

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

  useEffect(() => {
    const liveHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fullText: string; isBusy: boolean };
      if (!showOverlay) setShowOverlay(true);
      if (detail.isBusy) {
        setTranscript(detail.fullText || "Transcribing...");
        setIsTranscribing(true);
      } else {
        console.log("full transcription: ",detail.fullText);
        const text = detail.fullText || "";
        setTranscript(text);
        setIsTranscribing(false);
        setIsRecording(false);

        if (text.trim()) {
          sendMessage(text);
        }
      }
    };
    window.addEventListener("live-transcription", liveHandler);
    return () => window.removeEventListener("live-transcription", liveHandler);
  }, [showOverlay, sendMessage]);

  // Log LLM response
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      console.log("LLM Response:", lastMessage.content);
    }
  }, [messages]);

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
          </div>

          {/* Whisper progress */}
          {(whisperPct !== null) && (
            <div className="space-y-2">
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