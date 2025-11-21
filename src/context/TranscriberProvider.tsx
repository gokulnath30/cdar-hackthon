import React, { createContext, useContext, useEffect } from "react";
import { useTranscriber, Transcriber } from "../hooks/useTranscriber";

interface TranscriberCtx {
  transcriber: Transcriber;
}

const Ctx = createContext<TranscriberCtx | undefined>(undefined);

export const TranscriberProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const transcriber = useTranscriber();

  // Dispatch global live transcription events
  useEffect(() => {
    if (transcriber.output) {
      const aggregated = (transcriber.output.chunks ?? [])
        .map(c => c.text)
        .join("")
        .trim();
      window.dispatchEvent(
        new CustomEvent("live-transcription", {
          detail: {
            fullText: aggregated,
            isBusy: transcriber.output.isBusy
          }
        })
      );
    }
  }, [transcriber.output]);

  return <Ctx.Provider value={{ transcriber }}>{children}</Ctx.Provider>;
};

export function useGlobalTranscriber() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalTranscriber must be used inside TranscriberProvider");
  return ctx.transcriber;
}