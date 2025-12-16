import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState } from '../types';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

// Constants for audio processing
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export const useGeminiLive = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Context refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  // Audio Nodes refs for visualization
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Session management
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Audio Contexts
  const initializeAudioContexts = () => {
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
      inputAnalyserRef.current.fftSize = 256;
    }

    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      outputAnalyserRef.current = outputAudioContextRef.current.createAnalyser();
      outputAnalyserRef.current.fftSize = 256;
      outputAnalyserRef.current.connect(outputAudioContextRef.current.destination);
    }
  };

  const connect = useCallback(async (voiceName: string, systemInstruction: string) => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      initializeAudioContexts();

      // Resume contexts if suspended (browser policy)
      if (inputAudioContextRef.current?.state === 'suspended') await inputAudioContextRef.current.resume();
      if (outputAudioContextRef.current?.state === 'suspended') await outputAudioContextRef.current.resume();

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            setConnectionState(ConnectionState.CONNECTED);
            
            // Setup Input Stream Processing
            if (!inputAudioContextRef.current || !streamRef.current || !inputAnalyserRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(BUFFER_SIZE, 1, 1);
            
            source.connect(inputAnalyserRef.current);
            inputAnalyserRef.current.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              // Send audio chunk to Gemini
              // Use sessionPromiseRef.current to avoid "used before declaration" error
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            const outputCtx = outputAudioContextRef.current;
            const outputAnalyser = outputAnalyserRef.current;
            
            if (!outputCtx || !outputAnalyser) return;

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              // Ensure gapless playback
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime
              );

              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                OUTPUT_SAMPLE_RATE,
                1
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAnalyser); // Connect to analyser for visualization
              
              source.addEventListener('ended', () => {
                activeSourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(src => {
                try { src.stop(); } catch (e) { /* ignore already stopped */ }
              });
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log('Gemini Live Session Closed');
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error('Gemini Live API Error:', err);
            setError("Connection error encountered.");
            setConnectionState(ConnectionState.ERROR);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect");
      setConnectionState(ConnectionState.ERROR);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (sessionPromiseRef.current) {
        // We can't really "close" the session explicitly via the SDK nicely without just letting the object go,
        // but typically in a real app we'd call a close method if exposed, or just stop sending data.
        // The SDK documentation suggests just ending the session interaction.
        // However, we MUST stop the tracks.
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Stop audio processing
        if (inputAudioContextRef.current) {
           await inputAudioContextRef.current.close();
           inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current) {
            await outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        
        activeSourcesRef.current.forEach(source => source.stop());
        activeSourcesRef.current.clear();
        
        setConnectionState(ConnectionState.DISCONNECTED);
        sessionPromiseRef.current = null;
    }
  }, []);

  return {
    connect,
    disconnect,
    connectionState,
    error,
    inputAnalyser: inputAnalyserRef.current,
    outputAnalyser: outputAnalyserRef.current,
  };
};