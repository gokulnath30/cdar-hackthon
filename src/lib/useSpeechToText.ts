import { useState, useRef, useCallback, useEffect } from 'react';
import { pipeline } from '@xenova/transformers';

// Local type for raw audio payload expected by the pipeline
type RawAudio = {
  array: Float32Array;
  sampling_rate: number;
};

interface SpeechToTextResult {
  text: string;
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearText: () => void;
}

export const useSpeechToText = (): SpeechToTextResult => {
  const [text, setText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const transcriptionPipeline = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize the transcription pipeline
  useEffect(() => {
    const initPipeline = async () => {
      try {
        setError(null);
        // Using a smaller model for faster performance
        transcriptionPipeline.current = await pipeline(
          'automatic-speech-recognition',
          'Xenova/whisper-tiny.en' // English-only model for better performance
        );
      } catch (err) {
        console.error('Failed to initialize pipeline:', err);
        setError('Failed to initialize speech recognition');
      }
    };

    initPipeline();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setText('');
      audioChunks.current = [];

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Whisper expects 16kHz
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;

      // Create media recorder with WAV format for better compatibility
      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        if (audioChunks.current.length === 0) return;

        setIsTranscribing(true);
        try {
          // Convert audio chunks to a format transformers.js can use
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Create audio element to load the blob
          const audio = new Audio();
          audio.src = audioUrl;
          
          await new Promise((resolve) => {
            audio.onloadeddata = resolve;
          });

          // Extract audio data (simplified approach)
          const audioContext = new AudioContext({ sampleRate: 16000 });
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to raw audio data
          const rawAudio: RawAudio = {
            array: audioBuffer.getChannelData(0),
            sampling_rate: 16000,
          };

          // Transcribe using Whisper
          if (transcriptionPipeline.current) {
            const result = await transcriptionPipeline.current(rawAudio, {
              language: 'english',
              task: 'transcribe',
            });
            
            setText(prev => prev + ' ' + result.text);
          }

          // Clean up
          URL.revokeObjectURL(audioUrl);
          audioContext.close();
          
        } catch (transcribeError) {
          console.error('Transcription error:', transcribeError);
          setError('Transcription failed');
        } finally {
          setIsTranscribing(false);
          audioChunks.current = [];
        }
      };

      mediaRecorder.current.start(1000); // Collect data every second
      setIsRecording(true);

    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const clearText = useCallback(() => {
    setText('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    text: text.trim(),
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    clearText,
  };
};