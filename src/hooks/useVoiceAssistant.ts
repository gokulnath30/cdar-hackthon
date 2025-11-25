import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalTranscriber } from "../context/TranscriberProvider";
import { useChat } from "../hooks/useChat";
import Constants from "../utils/Constants";

export const useVoiceAssistant = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [assistantResponse, setAssistantResponse] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Whisper model progress
  const [whisperPct, setWhisperPct] = useState<number | null>(null);
  // LLM model progress
  const [llmProgress, setLlmProgress] = useState<{ status: string; name?: string; file?: string; progress?: number } | null>(null);

  const { sendMessage, messages } = useChat();
  const transcriber = useGlobalTranscriber();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const lastProcessedMessageRef = useRef<string | null>(null);

  const startRecording = async () => {
    try {
      setAssistantResponse("");
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

  // Live Transcription Event Listener
  useEffect(() => {
    const liveHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { fullText: string; isBusy: boolean };
      if (!showOverlay) setShowOverlay(true);
      if (detail.isBusy) {
        setTranscript(detail.fullText || "Transcribing...");
        setIsTranscribing(true);
      } else {
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

  // LLM Response & Navigation Logic
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const messageSignature = `${messages.length}-${lastMessage.content.substring(0, 20)}`;

      if (lastProcessedMessageRef.current === messageSignature) return;
      lastProcessedMessageRef.current = messageSignature;

      let textToSpeak = lastMessage.content;
      let command = null;
      let worker = null;

      try {
        const parsed = JSON.parse(lastMessage.content);
        if (parsed.TEXT) textToSpeak = parsed.TEXT;
        if (parsed.CMD) command = parsed.CMD;
        if (parsed.WORKER) worker = parsed.WORKER;
      } catch (e) {
        // Content is not JSON, treat as plain text
      }

      setAssistantResponse(textToSpeak);

      if (textToSpeak) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.speechSynthesis.speak(utterance);
      }
      
      if(worker == "PAGE")
      {
        if (command) {
        switch (command.toUpperCase()) {
          case "PRODUCTS": navigate("/products"); break;
          case "HOME": navigate("/dashboard"); break;
          case "STORE": navigate("/store_page"); break;
          case "PROFILE": navigate("/profile"); break;
          default: console.log("Unknown command:", command);
        }
      }

      }
      else if(worker == "STORE")
      {
        console.log("Navigating to store ID:", command);
        localStorage.setItem('current_store', String(command));
        navigate(`/store`);
    }
        
      
    }
  }, [messages, navigate]);

  // Progress Listeners
  useEffect(() => {
    const whisperHandler = (ev: Event) => {
      const d = (ev as CustomEvent).detail as { percent?: number };
      if (d.percent !== undefined) setWhisperPct(d.percent);
      if (d.percent === 100) setTimeout(() => setWhisperPct(null), 800);
    };
    
    const llmHandler = (ev: Event) => {
      const d = (ev as CustomEvent).detail;
      if (d.status === 'progress') {
        setLlmProgress(d);
        if (!showOverlay) setShowOverlay(true);
      } else if (d.status === 'complete') {
        setTimeout(() => setLlmProgress(null), 1000);
      }
    };

    window.addEventListener('whisper-progress', whisperHandler);
    window.addEventListener('llm-progress', llmHandler);
    return () => {
      window.removeEventListener('whisper-progress', whisperHandler);
      window.removeEventListener('llm-progress', llmHandler);
    };
  }, [showOverlay]);

  return {
    isRecording,
    showOverlay,
    setShowOverlay,
    transcript,
    setTranscript,
    assistantResponse,
    isTranscribing,
    whisperPct,
    llmProgress,
    handleMicClick,
    stopRecording,
    startRecording
  };
};