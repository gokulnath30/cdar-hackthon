import { X, Loader2 } from "lucide-react";

interface VoiceOverlayProps {
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  transcript: string;
  setTranscript: (text: string) => void;
  assistantResponse: string;
  isTranscribing: boolean;
  whisperPct: number | null;
  llmProgress: { status: string; name?: string; file?: string; progress?: number } | null;
  isRecording: boolean;
  stopRecording: () => void;
  startRecording: () => void;
}

const VoiceOverlay = ({
  showOverlay,
  setShowOverlay,
  transcript,
  setTranscript,
  assistantResponse,
  isTranscribing,
  whisperPct,
  llmProgress,
  isRecording,
  stopRecording,
  startRecording,
}: VoiceOverlayProps) => {
  if (!showOverlay) return null;

  return (
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
        {transcript && !isTranscribing && (
          <div className="rounded bg-white/10 px-2 py-1">
            <span className="text-blue-200">You: </span>
            <span>{transcript}</span>
          </div>
        )}

        {assistantResponse && (
          <div className="rounded bg-indigo-500/20 px-2 py-1">
            <span className="text-indigo-200">AI: </span>
            <span>{assistantResponse}</span>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 text-indigo-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transcribing...</span>
          </div>
        )}
      </div>

      {/* Whisper progress */}
      {whisperPct !== null && (
        <div className="space-y-2">
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
        </div>
      )}

      {/* LLM progress */}
      {llmProgress && llmProgress.status === "progress" && (
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-white/80 truncate max-w-[200px]">
                Loading LLM {llmProgress.file ? `(${llmProgress.file})` : ""}
              </span>
              <span>{llmProgress.progress?.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded overflow-hidden">
              <div
                style={{ width: `${llmProgress.progress}%` }}
                className="h-full bg-blue-500 transition-all"
              />
            </div>
          </div>
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
  );
};

export default VoiceOverlay;