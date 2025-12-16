import { useRef, useState, useCallback, useEffect } from 'react';

export const useHistoricalAmbience = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  
  // Track continuous background nodes to stop them explicitly
  const backgroundNodesRef = useRef<AudioNode[]>([]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const createPinkNoise = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Pink noise generation algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // compensate for gain
      b6 = white * 0.115926;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  };

  // Synthesize a distant war drum beat (Low thud)
  const playDrum = (ctx: AudioContext, masterGain: GainNode, time: number) => {
     const osc = ctx.createOscillator();
     const gain = ctx.createGain();
     const filter = ctx.createBiquadFilter();

     osc.type = 'triangle';
     osc.frequency.setValueAtTime(80, time);
     osc.frequency.exponentialRampToValueAtTime(20, time + 0.4);

     gain.gain.setValueAtTime(0, time);
     gain.gain.linearRampToValueAtTime(0.25, time + 0.02); // Attack
     gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8); // Decay

     // Lowpass for "distance" muffling
     filter.type = 'lowpass';
     filter.frequency.value = 120;
     
     osc.connect(filter);
     filter.connect(gain);
     gain.connect(masterGain);

     osc.start(time);
     osc.stop(time + 1.0);
  };

  // Synthesize horse hooves (Filtered noise burst)
  const playHoofStep = (ctx: AudioContext, masterGain: GainNode, time: number, highPitch: boolean) => {
      const noise = createPinkNoise(ctx);
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      // Bandpass to simulate ground impact sound
      filter.type = 'bandpass';
      filter.frequency.value = highPitch ? 750 : 600; 
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      noise.start(time);
      noise.stop(time + 0.2);
  };

  const play = useCallback(async () => {
    try {
      const ctx = initAudio();
      if (ctx.state === 'suspended') await ctx.resume();

      // Stop previous instance if any
      stop();

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.4; // Overall ambience volume
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // --- 1. Continuous Wind Background ---
      const windNoise = createPinkNoise(ctx);
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 350;
      windFilter.Q.value = 0.6;
      
      // Wind Gusts via LFO
      const windLFO = ctx.createOscillator();
      windLFO.frequency.value = 0.12; // Slow changing wind
      const windLFOGain = ctx.createGain();
      windLFOGain.gain.value = 250; // Modulate filter by +/- 250Hz
      
      windLFO.connect(windLFOGain);
      windLFOGain.connect(windFilter.frequency);
      windNoise.connect(windFilter);
      windFilter.connect(masterGain);
      
      windNoise.start();
      windLFO.start();
      backgroundNodesRef.current.push(windNoise, windLFO);

      // --- 2. Low Drone/Rumble (Atmospheric Tension) ---
      const rumbleOsc = ctx.createOscillator();
      rumbleOsc.type = 'sine';
      rumbleOsc.frequency.value = 55;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.04;
      
      // Subtle pulse to rumble
      const rumbleLFO = ctx.createOscillator();
      rumbleLFO.frequency.value = 0.08;
      const rumbleLFOGain = ctx.createGain();
      rumbleLFOGain.gain.value = 0.01;
      
      rumbleLFO.connect(rumbleLFOGain);
      rumbleLFOGain.connect(rumbleGain.gain);
      rumbleOsc.connect(rumbleGain);
      rumbleGain.connect(masterGain);
      
      rumbleOsc.start();
      rumbleLFO.start();
      backgroundNodesRef.current.push(rumbleOsc, rumbleLFO);

      // --- 3. Event Scheduler (Drums & Hooves) ---
      let nextDrumTime = ctx.currentTime + 0.5;
      let nextHoofTime = ctx.currentTime + 5 + Math.random() * 10;

      const scheduleEvents = () => {
          // Check if we are still playing (gain node exists)
          if (!gainNodeRef.current) return;

          const now = ctx.currentTime;
          const lookahead = 1.5; // Schedule 1.5s ahead

          // Schedule War Drums (Slow March)
          while (nextDrumTime < now + lookahead) {
              // Add slight variation to timing (humanize)
              const variation = (Math.random() * 0.1) - 0.05;
              playDrum(ctx, masterGain, nextDrumTime + variation);
              
              // Interval ~5s (Very slow, ominous)
              nextDrumTime += 5.0; 
          }

          // Schedule Horse Patrol (Occasional)
          while (nextHoofTime < now + lookahead) {
              // Play a sequence of steps (trot)
              // Clip-Clop ... Clip-Clop
              const steps = 4;
              for(let i=0; i<steps; i++) {
                  const t = nextHoofTime + (i * 0.6);
                  playHoofStep(ctx, masterGain, t, false); // Clip
                  playHoofStep(ctx, masterGain, t + 0.15, true); // Clop
              }
              
              // Next patrol in 20-40 seconds
              nextHoofTime += 20 + Math.random() * 20; 
          }
          
          schedulerTimerRef.current = window.setTimeout(scheduleEvents, 500);
      };

      scheduleEvents();
      setIsPlaying(true);

    } catch (e) {
      console.error("Ambience Error:", e);
    }
  }, []);

  const stop = useCallback(() => {
    // Stop continuous nodes
    backgroundNodesRef.current.forEach(node => {
      try {
        node.disconnect();
        if ((node as any).stop) (node as any).stop();
      } catch(e){}
    });
    backgroundNodesRef.current = [];

    // Clear scheduler
    if (schedulerTimerRef.current) {
        clearTimeout(schedulerTimerRef.current);
        schedulerTimerRef.current = null;
    }

    // Disconnect master gain (silences any pending one-shot events immediately)
    if (gainNodeRef.current) {
        try { gainNodeRef.current.disconnect(); } catch(e){}
        gainNodeRef.current = null;
    }
    
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  return { play, stop, isPlaying };
};