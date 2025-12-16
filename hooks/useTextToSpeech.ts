import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData, audioBufferToWav } from '../utils/audioUtils';

export interface TTSConfig {
  voiceApiId: string;
  speed: number;        // 0.5 to 2.0
  emotion: string;      // Text description
  stability: number;    // 0.0 to 1.0 (Maps to Temperature)
  clarity: number;      // 0.0 to 1.0 (Prompt instruction)
  pronounce: number;    // 0.0 to 1.0 (Prompt instruction)
}

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastAudioBufferRef = useRef<AudioBuffer | null>(null);

  // Initialize Audio Context lazily
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
    }
    return audioContextRef.current;
  };

  const speak = useCallback(async (text: string, config: TTSConfig) => {
    try {
      // Stop any current playback
      if (sourceRef.current) {
        sourceRef.current.stop();
        setIsPlaying(false);
      }

      setIsPlaying(true);
      setHasAudio(false);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prompt Engineering for Voice Controls
      // Construct a directive prefix that guides the model's performance
      const instructions = [];
      
      if (config.emotion) {
        // Strong instruction for emotional tone
        instructions.push(`(Speaking Style: ${config.emotion})`);
      }
      
      if (config.clarity > 0.0) {
         if (config.clarity > 0.5) instructions.push("Speak with crystal clear, crisp diction.");
      }
      
      if (config.pronounce > 0.0) {
         if (config.pronounce > 0.5) instructions.push("Enunciate every syllable precisely.");
      }
      
      const promptText = instructions.length > 0 
        ? `${instructions.join(' ')} ${text}` 
        : text;

      // Map Stability to Temperature (Inverted)
      // High Stability (1.0) -> Low Temperature (0.1) - Less random, more consistent
      // Low Stability (0.0) -> High Temperature (1.2) - More expressive, varied
      const temperature = Math.max(0.1, 1.2 - config.stability);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          temperature: temperature,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: config.voiceApiId },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!base64Audio) {
        throw new Error("No audio generated");
      }

      const ctx = getAudioContext();
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1
      );

      lastAudioBufferRef.current = audioBuffer;
      setHasAudio(true);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Apply Speed Control
      source.playbackRate.value = config.speed;

      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };

      source.start();
      sourceRef.current = source;

    } catch (error) {
      console.error("TTS Error:", error);
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const download = useCallback(() => {
    if (!lastAudioBufferRef.current) return;
    
    const blob = audioBufferToWav(lastAudioBufferRef.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahyadri_echoes_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return { speak, stop, download, isPlaying, hasAudio };
};