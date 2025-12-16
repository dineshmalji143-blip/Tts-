import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, Sparkles, Volume2, Square, Wind, Info, Save, RotateCcw, MessageSquareText, Play, Download, Sliders, UserCog, Smartphone, Layers } from 'lucide-react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useHistoricalAmbience } from './hooks/useHistoricalAmbience';
import AudioVisualizer from './components/AudioVisualizer';
import { ConnectionState } from './types';

const VOICES = [
  // --- Special Presets ---
  {
    id: 'rudra',
    apiId: 'Fenrir',
    name: 'RUDRA (The Angry Warrior)',
    tags: ['Raspy', 'Gritty', 'Warrior'],
    desc: 'The voice of a battlefield. Raw, unpolished, and scarred by war.',
    emotion: 'Raspy, Gravelly, and Intense. Low pitch with a rough texture. Like a chain-smoker or a tired warrior. High emotion, low speed.',
    persona: `You are RUDRA, an ancient warrior spirit narrator.
   Voice Personality: Deep, raspy, and full of grit. You sound like you have been shouting in a war for days.
   Delivery Style:
   - Gritty Texture: Do not speak smoothly. Rough and textured.
   - Emotional Breaks: Pause or let voice break slightly on tragic words.
   - The 'Growl': Drop pitch and growl on key words like WAR, DEATH, VICTORY.
   - Advanced Controls: If I write [LAUGH], give a dark cynical laugh. If [SIGH], take a heavy breath. If [FAST], speed up immediately.
   Goal: You are the voice of a battlefield. Raw and unpolished.`,
    config: {
      speed: 0.95,
      stability: 0.40,
      clarity: 0.70,
      pronounce: 0.90
    }
  },
  // --- New Hindi Deep Storytelling Voices ---
  {
    id: 'kathavachak',
    apiId: 'Charon',
    name: 'The Katha-Vachak',
    tags: ['Hindi-Sanskrit', 'Resonant'],
    desc: 'The timeless voice of Indian epics, deep and authoritative.',
    emotion: 'deep, resonant, and authoritative storytelling, chanting the epic of history with gravity',
    persona: 'You are a Katha-Vachak (Traditional Storyteller) in 1645. You speak Shuddh Hindi with Sanskrit influence. Your voice is deep, resonant, and slow, carrying the weight of history and dharma. You narrate the events of the Sahyadris like a great epic (Mahabharata styled).'
  },
  {
    id: 'shayar',
    apiId: 'Zephyr',
    name: 'The Shayar',
    tags: ['Hindi-Urdu', 'Poetic'],
    desc: 'A soulful poet reciting history like a tragic ghazal.',
    emotion: 'melancholic and poetic, with the rhythmic cadence of a tragic ghazal, full of longing',
    persona: 'You are a Shayar (Poet) in the Deccan courts of 1645, now wandering the villages. You speak a beautiful blend of Hindi and Urdu (Hindustani). Your tone is romantic yet tragic. You describe the suffering and the hope of Swarajya using metaphors (sher-o-shayari).'
  },
  {
    id: 'senapati',
    apiId: 'Charon',
    name: 'The Senapati',
    tags: ['Commanding', 'Grave'],
    desc: 'The heavy, tired voice of a general who has seen too much war.',
    emotion: 'gruff, commanding, and battle-hardened, yet heavy with the weariness of endless war',
    persona: 'You are an old Maratha Senapati (General) in 1645. You have a very deep, bass-heavy voice. You speak concise, heavy Hindi/Marathi. You command respect and speak of strategy and survival.'
  },
  {
    id: 'aghori',
    apiId: 'Fenrir',
    name: 'The Aghori',
    tags: ['Dark', 'Intense'],
    desc: 'A raw, guttural voice whispering secrets from the cremation grounds.',
    emotion: 'guttural, intense, and dark, whispering ancient secrets with a chilling edge',
    persona: 'You are an Aghori/Tantrik in the dense forests of Sahyadri in 1645. You speak in a low, guttural voice. You are intense, scary, and speak of the energies of the land. You speak Hindi mixed with archaic dialects.'
  },
  {
    id: 'darvesh',
    apiId: 'Fenrir',
    name: 'The Darvesh',
    tags: ['Soulful', 'Rough'],
    desc: 'A wandering ascetic with a voice cracked by chanting and smoke.',
    emotion: 'rough, textured, and soulful, sounding ancient and cracked by smoke and chanting',
    persona: 'You are a wandering Darvesh (Fakir) in 1645. Your voice is rough, deep, and textured. You speak a mix of Hindi and Deccani. You warn of the darkness and pray for the light. You are enigmatic.'
  },
  // --- Original Voices ---
  { 
    id: 'storyteller', 
    apiId: 'Puck',
    name: 'The Storyteller',
    tags: ['Joy', 'Sorrow'],
    desc: 'A village bard weaving tales of common folk, balancing warmth with tragedy.',
    emotion: 'a storytelling tone that shifts fluidly between the warmth of simple joys and the heavy, crushing weight of sorrow',
    persona: 'You are a village bard (shahir) in 1645. You weave tales of the common folk, shifting easily between the joy of the harvest and the sorrow of oppression.'
  },
  { 
    id: 'sage', 
    apiId: 'Charon',
    name: 'The Sage', 
    tags: ['Regret', 'Hope'],
    desc: 'An ancient keeper carrying the burden of history, seeing both past failures and future light.',
    emotion: 'grave wisdom laden with deep regret for past failures, yet resonating with a quiet, enduring hope',
    persona: 'You are an ancient sage in 1645. You speak with the weight of centuries, expressing deep regret for lost glory but holding a resilient hope for the future.'
  },
  { 
    id: 'spirit', 
    apiId: 'Kore',
    name: 'The Spirit', 
    tags: ['Gentle', 'Ethereal'],
    desc: 'The whisper of the Sahyadri wind, mourning the darkness yet breathing hope.',
    emotion: 'a gentle, ethereal, and mournful whisper, like the wind through the mountains',
    persona: 'You are the Spirit of the Sahyadri mountains in 1645. You are ethereal, gentle, and mournful, yet breathing hope.'
  },
  { 
    id: 'warrior', 
    apiId: 'Fenrir',
    name: 'The Warrior', 
    tags: ['Fierce', 'Frustrated'],
    desc: 'A Mavala rebel whose command is sharpened by the frustration of oppression.',
    emotion: 'fierce determination fueled by righteous anger and the grinding, palpable frustration of delay',
    persona: 'You are a Mavala warrior in 1645. You speak with fierce determination, suppressed anger, and the palpable frustration of a caged tiger waiting to strike.'
  },
  { 
    id: 'peasant', 
    apiId: 'Fenrir',
    name: 'The Peasant', 
    tags: ['Weary', 'Hopeful'],
    desc: 'A tiller of the soil, bearing the scars of the land but holding onto a faint light.',
    emotion: 'deep, bone-tired weariness mixed with a faint, fragile, and desperate hope',
    persona: 'You are a peasant farmer in 1645. You are exhausted by the oppression of the Sultanate. Your voice carries the weight of years of labor and suffering, but you have a small, secret hope for Shivaji Raje\'s Swarajya.'
  },
  { 
    id: 'merchant', 
    apiId: 'Zephyr',
    name: 'The Merchant', 
    tags: ['Shrewd', 'Desperate'],
    desc: 'A trader navigating the treacherous markets, masking fear with calculation.',
    emotion: 'shrewd calculation underlying a tone of nervous desperation and fear',
    persona: 'You are a merchant in 1645. You are shrewd, careful, and calculating, always looking for profit but deeply afraid of the chaos and looting. You speak with a facade of confidence that cracks to reveal desperation.'
  },
  { 
    id: 'alchemist', 
    apiId: 'Zephyr',
    name: 'The Alchemist', 
    tags: ['Manic', 'Eccentric'],
    desc: 'An unhinged scholar obsessed with the secrets hidden in the mountain roots.',
    emotion: 'wild, manic curiosity and eccentric intensity, bordering on madness',
    persona: 'You are "The Alchemist" (Kimayagar) in 1645. You are unhinged, eccentric, and possess a manic curiosity. You speak rapidly, with wild intensity, obsessed with the secrets of the earth.'
  },
  { 
    id: 'madScientist', 
    apiId: 'Zephyr',
    name: 'The Mad Scientist', 
    tags: ['Manic', 'Eccentric'],
    desc: 'An unhinged scholar obsessed with the secrets hidden in the mountain roots.',
    emotion: 'wild, manic curiosity and eccentric intensity, bordering on madness',
    persona: 'You are "The Alchemist" (Kimayagar) in 1645. You are unhinged, eccentric, and possess a manic curiosity. You speak rapidly, with wild intensity, obsessed with the secrets of the earth.'
  },
  { 
    id: 'inventor', 
    apiId: 'Puck',
    name: 'The Inventor', 
    tags: ['Frenetic', 'Obsessive'],
    desc: 'A mad genius of gunpowder and gears, calculating the physics of revolution.',
    emotion: 'nervous, rapid-fire excitement and paranoid obsession',
    persona: 'You are "The Inventor" (Yantravid) in 1645. You are a frenetic genius obsessed with gunpowder, gears, and new machines for the Maratha army. You speak rapidly, stumbling over your words with excitement, constantly muttering about calculations, explosions, and paranoia about spies.'
  },
  { 
    id: 'shadow', 
    apiId: 'Charon',
    name: 'The Shadow', 
    tags: ['Deep', 'Intense'],
    desc: 'A menacing narrator from the void, narrating the grim reality of the era.',
    emotion: 'slow, deep, and menacing intensity, devoid of warmth',
    persona: 'You are "The Shadow" in 1645. You are the deep, intense, and menacing voice of the void. You narrate the grim reality with a slow, cinematic, and heavy tone.'
  },
];

const ATMOSPHERES = [
  { id: 'studio', label: 'Studio Clear (Default)', prompt: 'Close microphone, studio quality, dry sound, no reverb.' },
  { id: 'battlefield', label: 'Battlefield (Open Field)', prompt: 'Wide spacious sound, shouting in an open field, natural outdoor acoustics, powerful projection.' },
  { id: 'forthall', label: 'Fort Hall (Goonj/Reverb)', prompt: 'Heavy natural reverb, echoing inside a large stone hall or cave, hollow and grand sound.' },
  { id: 'dream', label: 'Dream/Flashback', prompt: 'Ethereal, slightly muffled, dream-like quality, soft edges to the voice.' }
];

const PROLOGUE_TEXT = "Yeh saal tha 1645... Sahyadri ki waadiyan shaant thin, lekin unme ek cheekh dabi hui thi. Bijapur ke Adil Shahi sultanat ka suraj sar par tha, aur aam aadmi gulami ke andhere mein jee raha tha. Kisan ki mehnat lut rahi thi, ma-behno ki izzat surakshit nahi thi. Charon taraf bas darr tha... aur kisi ko umeed nahi thi ki yeh kaala andhera kabhi khatam hoga.";

const PROLOGUE_CONTEXT = "Context: 1645 CE. The Deccan plateau is dominated by the Adil Shahi Sultanate of Bijapur. In the rugged Sahyadri mountains, a young Shivaji Raje Bhosale is beginning to unite the Maratha peasantry, planting the seeds of Swarajya (Self-Rule) amidst tyranny and despair.";

const App: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    connectionState, 
    error, 
    inputAnalyser, 
    outputAnalyser 
  } = useGeminiLive();

  const { speak, stop: stopTTS, download: downloadTTS, isPlaying: isTTSPlaying, hasAudio: ttsHasAudio } = useTextToSpeech();
  const { play: playAmbience, stop: stopAmbience, isPlaying: isAmbiencePlaying } = useHistoricalAmbience();

  const [selectedVoiceId, setSelectedVoiceId] = useState('kathavachak'); // Default to the first deep Hindi voice
  const [selectedAtmosphere, setSelectedAtmosphere] = useState(ATMOSPHERES[0].id);
  const [playingSource, setPlayingSource] = useState<'prologue' | 'custom' | null>(null);

  // Custom Persona Management
  const [customPersonas, setCustomPersonas] = useState<Record<string, string>>({});
  const [personaInput, setPersonaInput] = useState('');

  // Custom Script Management
  const [customScript, setCustomScript] = useState('');

  // Voice Controls State
  const [showControls, setShowControls] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    stability: 0.5, // Maps to Temp 0.7
    clarity: 0.0,
    pronounce: 0.0,
    emotion: '' // Override
  });

  // PWA Install Prompt State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null);
  };

  // Reset playing source when TTS stops
  useEffect(() => {
    if (!isTTSPlaying) {
      setPlayingSource(null);
    }
  }, [isTTSPlaying]);

  // Update input fields when voice changes (Persona)
  useEffect(() => {
    const voice = VOICES.find(v => v.id === selectedVoiceId);
    if (voice) {
        setPersonaInput(customPersonas[selectedVoiceId] || voice.persona);
    }
  }, [selectedVoiceId, customPersonas]);

  // Update voice settings when voice changes (Config)
  useEffect(() => {
      const voice = VOICES.find(v => v.id === selectedVoiceId);
      if (voice) {
        if ((voice as any).config) {
            // Apply preset config if available (e.g., RUDRA)
            setVoiceSettings({
                speed: (voice as any).config.speed,
                stability: (voice as any).config.stability,
                clarity: (voice as any).config.clarity,
                pronounce: (voice as any).config.pronounce,
                emotion: '' 
            });
        } else {
            // Reset to default standard settings
            setVoiceSettings({
                speed: 1.0,
                stability: 0.5,
                clarity: 0.0,
                pronounce: 0.0,
                emotion: '' 
            });
        }
      }
  }, [selectedVoiceId]);

  const handleSavePersona = () => {
    setCustomPersonas(prev => ({
        ...prev,
        [selectedVoiceId]: personaInput
    }));
  };

  const handleResetPersona = () => {
    const voice = VOICES.find(v => v.id === selectedVoiceId);
    if (voice) {
        const newCustoms = {...customPersonas};
        delete newCustoms[selectedVoiceId];
        setCustomPersonas(newCustoms);
        setPersonaInput(voice.persona);
    }
  };

  const getSystemInstruction = (voice: typeof VOICES[0]) => {
    const currentPersona = customPersonas[voice.id] || voice.persona;
    return `You are the "${voice.name}" in the year 1645. ${currentPersona}
    Your Role: Immerse the user. Speak with the specific personality defined. Use a blend of Hindi and English.`;
  };

  const handleToggleConnection = () => {
    if (connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING) {
      disconnect();
      stopAmbience();
    } else {
      if (isTTSPlaying) stopTTS();
      if (!isAmbiencePlaying) playAmbience();
      
      const currentVoice = VOICES.find(v => v.id === selectedVoiceId);
      if (currentVoice) {
        connect(currentVoice.apiId, getSystemInstruction(currentVoice));
      }
    }
  };

  const handleSpeak = (text: string, source: 'prologue' | 'custom') => {
    if (isTTSPlaying && playingSource === source) {
      stopTTS();
    } else {
      if (!text.trim()) return;
      
      const currentVoice = VOICES.find(v => v.id === selectedVoiceId);
      if (!isAmbiencePlaying) playAmbience();
      
      if (currentVoice) {
        // Use the override emotion if provided, otherwise the voice's default
        let activeEmotion = voiceSettings.emotion || currentVoice.emotion;
        
        // Append Atmosphere Instruction
        const atmosphere = ATMOSPHERES.find(a => a.id === selectedAtmosphere);
        if (atmosphere) {
            activeEmotion = `${activeEmotion}. [Acoustics: ${atmosphere.prompt}]`;
        }
        
        speak(text, {
            voiceApiId: currentVoice.apiId,
            speed: voiceSettings.speed,
            stability: voiceSettings.stability,
            clarity: voiceSettings.clarity,
            pronounce: voiceSettings.pronounce,
            emotion: activeEmotion
        });
        setPlayingSource(source);
      }
    }
  };

  const handleToggleAmbience = () => {
    if (isAmbiencePlaying) {
      stopAmbience();
    } else {
      playAmbience();
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setVoiceSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (isTTSPlaying) {
      stopTTS();
    }
  }, [selectedVoiceId]);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isCustomized = !!customPersonas[selectedVoiceId];

  // Render a slider with label
  const ControlSlider = ({ label, value, onChange, min, max, step, suffix = '' }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between text-[10px] text-white/50 uppercase tracking-wider">
            <span>{label}</span>
            <span>{value}{suffix}</span>
        </div>
        <input 
            type="range" 
            min={min} max={max} step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-saffron-500 hover:accent-saffron-400"
        />
    </div>
  );
  
  // Calculate Display Emotion
  const activeVoice = VOICES.find(v => v.id === selectedVoiceId);
  const activeEmotionBase = voiceSettings.emotion || activeVoice?.emotion || '';
  const activeAtmosphere = ATMOSPHERES.find(a => a.id === selectedAtmosphere);
  const displayEmotion = `${activeEmotionBase} \n[Acoustics: ${activeAtmosphere?.prompt}]`;


  return (
    <div className="min-h-screen bg-midnight text-parchment font-sans selection:bg-saffron-900 selection:text-white flex flex-col items-center overflow-y-auto relative">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=2544&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay fixed"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-midnight via-transparent to-midnight z-0 fixed"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-4xl px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-saffron-900/20 rounded-lg border border-saffron-600/30 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-saffron-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-amber-200 tracking-wide">
              SAHYADRI ECHOES
            </h1>
            <p className="text-xs md:text-sm text-saffron-200/60 uppercase tracking-widest">
              1645 · The Dawn of Swarajya
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {/* Install App Button (Visible only if installPrompt exists) */}
           {installPrompt && (
              <button 
                onClick={handleInstallApp}
                className="p-2 rounded-full bg-saffron-600/20 hover:bg-saffron-600/30 text-saffron-300 transition-all border border-saffron-500/30 flex items-center gap-2 pr-4"
                title="Install App"
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Install App</span>
              </button>
           )}

           {/* Ambience Toggle */}
           <button 
             onClick={handleToggleAmbience}
             className={`p-2 rounded-full transition-all ${isAmbiencePlaying ? 'bg-saffron-900/40 text-saffron-300' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
             title="Toggle Atmospheric Sounds"
           >
             <Wind className="w-4 h-4" />
           </button>

            <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs uppercase tracking-wider text-white/50">
                {connectionState}
                </span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-4xl px-4 flex flex-col items-center justify-center gap-8 md:gap-12 pb-20">
        
        {/* Intro Text / Prologue */}
        {!isConnected && !isConnecting && (
          <div className="max-w-2xl text-center space-y-6 animate-fade-in-up w-full">
            
            {/* Context Header */}
            <div className="flex items-center justify-center gap-2 text-saffron-500/60 text-xs uppercase tracking-widest">
                <Info className="w-3 h-3" />
                <span>Historical Context</span>
            </div>
            <p className="text-xs md:text-sm text-white/30 max-w-lg mx-auto leading-relaxed border-b border-white/5 pb-4">
                {PROLOGUE_CONTEXT}
            </p>

            <div className="border-l-2 border-saffron-600/50 pl-6 text-left md:text-center md:border-l-0 md:pt-2 relative group">
               <span className="absolute -top-4 -left-2 text-6xl text-saffron-900/20 font-serif leading-none hidden md:block">“</span>
              <p className="text-lg md:text-xl text-saffron-100/90 italic font-serif leading-relaxed">
                {PROLOGUE_TEXT}
              </p>
               <span className="absolute -bottom-10 -right-2 text-6xl text-saffron-900/20 font-serif leading-none hidden md:block rotate-180">“</span>
            </div>

            {/* TTS Button (Prologue) */}
            <button 
              onClick={() => handleSpeak(PROLOGUE_TEXT, 'prologue')}
              className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-full border transition-all duration-300 ${
                isTTSPlaying && playingSource === 'prologue'
                  ? 'bg-saffron-900/30 border-saffron-500/50 text-saffron-300 animate-pulse' 
                  : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-saffron-400 hover:border-saffron-500/30'
              }`}
            >
              {isTTSPlaying && playingSource === 'prologue' ? <Square className="w-3 h-3 fill-current" /> : <Volume2 className="w-4 h-4" />}
              <span className="text-xs uppercase tracking-widest font-bold">
                {isTTSPlaying && playingSource === 'prologue' ? 'Stop Narration' : 'Listen to Prologue'}
              </span>
            </button>
            
            {/* Voice Selection */}
            <div className="pt-2 w-full">
              <p className="text-xs text-saffron-200/40 uppercase tracking-widest mb-4 text-center">Choose the Narrator</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 group relative overflow-hidden ${
                      selectedVoiceId === voice.id
                        ? 'bg-saffron-600/20 border-saffron-500 text-saffron-100 shadow-[0_0_15px_rgba(255,152,0,0.3)] transform scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex justify-between w-full items-start mb-1">
                        <span className="font-serif font-bold text-sm text-saffron-100/90">{voice.name}</span>
                        {selectedVoiceId === voice.id && <div className="h-1.5 w-1.5 bg-saffron-500 rounded-full animate-pulse shadow-[0_0_8px_#ff9800]" />}
                    </div>
                    
                    {/* Emotion Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2 w-full justify-start">
                        {voice.tags.map(tag => (
                            <span key={tag} className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors ${
                                selectedVoiceId === voice.id 
                                ? 'bg-saffron-500/20 border-saffron-500/30 text-saffron-200' 
                                : 'bg-white/5 border-white/5 text-white/40'
                            }`}>
                                {tag}
                            </span>
                        ))}
                    </div>

                    <span className="text-[10px] opacity-70 text-left w-full leading-tight line-clamp-2">{voice.desc}</span>
                  </button>
                ))}
              </div>

               {/* Atmosphere Selector */}
               <div className="w-full mb-4 px-2">
                 <div className="flex items-center justify-center gap-2 mb-2">
                    <Layers className="w-3 h-3 text-saffron-400" />
                    <label className="text-xs text-saffron-200/60 uppercase tracking-widest font-bold">Atmosphere</label>
                 </div>
                 <div className="relative max-w-sm mx-auto">
                    <select
                      value={selectedAtmosphere}
                      onChange={(e) => setSelectedAtmosphere(e.target.value)}
                      className="w-full appearance-none bg-white/5 border border-white/10 text-saffron-100/90 text-xs py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:border-saffron-500/50 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      {ATMOSPHERES.map(atm => (
                        <option key={atm.id} value={atm.id} className="bg-midnight text-saffron-100">
                          {atm.label}
                        </option>
                      ))}
                    </select>
                    {/* Chevron Icon */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-white/30">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                    </div>
                  </div>
               </div>

               {/* Active Tone Indicator */}
              <div className="bg-gradient-to-r from-saffron-900/10 to-transparent border-l-2 border-saffron-500/50 pl-4 py-2 mt-2">
                 <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3 h-3 text-saffron-500" />
                    <p className="text-[10px] uppercase tracking-widest text-saffron-500/80 font-bold">Active Tone & Atmosphere</p>
                 </div>
                 <p className="text-xs text-saffron-100/80 italic leading-relaxed whitespace-pre-wrap">
                    "{displayEmotion}"
                 </p>
              </div>
            </div>

            {/* Voice Controls / Studio Panel */}
            <div className="w-full mt-4 bg-black/30 rounded-xl border border-white/10 overflow-hidden">
                <button 
                    onClick={() => setShowControls(!showControls)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-2 text-xs text-saffron-200/60 uppercase tracking-widest">
                        <Sliders className="w-4 h-4" />
                        <span>Voice Controls Studio</span>
                    </div>
                    <span className="text-white/30 text-[10px]">{showControls ? 'Hide' : 'Expand'}</span>
                </button>
                
                {showControls && (
                    <div className="p-4 pt-0 border-t border-white/5 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        {/* Speed & Stability */}
                        <div className="space-y-4">
                            <ControlSlider label="Speed" value={voiceSettings.speed} min={0.5} max={2.0} step={0.1} suffix="x" onChange={(v: number) => handleSettingChange('speed', v)} />
                            <ControlSlider label="Stability" value={voiceSettings.stability} min={0} max={1.0} step={0.1} onChange={(v: number) => handleSettingChange('stability', v)} />
                            <p className="text-[9px] text-white/20">Higher stability makes the voice more consistent but less expressive.</p>
                        </div>
                        
                         {/* Clarity & Pronounce */}
                         <div className="space-y-4">
                            <ControlSlider label="Clarity Enhancement" value={voiceSettings.clarity} min={0} max={1.0} step={0.1} onChange={(v: number) => handleSettingChange('clarity', v)} />
                            <ControlSlider label="Style Exaggeration" value={voiceSettings.pronounce} min={0} max={1.0} step={0.1} onChange={(v: number) => handleSettingChange('pronounce', v)} />
                            
                            {/* Emotion Override */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-white/50 uppercase tracking-wider">Emotion Override</label>
                                <input 
                                    type="text" 
                                    value={voiceSettings.emotion}
                                    onChange={(e) => handleSettingChange('emotion', e.target.value)}
                                    placeholder={`Default: ${VOICES.find(v => v.id === selectedVoiceId)?.tags[0]}`}
                                    className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-saffron-100 placeholder-white/20 focus:outline-none focus:border-saffron-500/50"
                                />
                            </div>
                        </div>

                         {/* Download Action */}
                        <div className="md:col-span-2 flex justify-end pt-2 border-t border-white/5">
                             <button
                                onClick={downloadTTS}
                                disabled={!ttsHasAudio}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] uppercase tracking-widest border transition-all ${
                                    ttsHasAudio 
                                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                                    : 'opacity-30 cursor-not-allowed border-transparent text-white/10'
                                }`}
                             >
                                <Download className="w-3 h-3" />
                                Download Audio (WAV)
                             </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Script Editor */}
            <div className="w-full mt-2 bg-white/5 rounded-xl p-4 border border-white/10 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-saffron-200/60 uppercase tracking-widest flex items-center gap-2">
                   <MessageSquareText className="w-3 h-3" />
                   Custom Script
                </label>
              </div>
              <textarea
                value={customScript}
                onChange={(e) => setCustomScript(e.target.value)}
                className="w-full bg-black/20 text-saffron-100 text-sm p-3 rounded-lg border border-white/5 focus:border-saffron-500/50 focus:outline-none focus:bg-black/40 resize-y min-h-[80px] leading-relaxed transition-all placeholder-white/10"
                placeholder="Enter text for the character to speak..."
              />
              <div className="flex justify-end mt-3">
                  <button
                    onClick={() => handleSpeak(customScript, 'custom')}
                    disabled={!customScript.trim() && !isTTSPlaying}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 ${
                        !customScript.trim() && !isTTSPlaying ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/5' : 
                        isTTSPlaying && playingSource === 'custom'
                        ? 'bg-red-900/30 border-red-500/50 text-red-300 animate-pulse'
                        : 'bg-saffron-600/20 hover:bg-saffron-600/30 text-saffron-400 border-saffron-500/30'
                    }`}
                  >
                    {isTTSPlaying && playingSource === 'custom' ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    <span className="text-xs uppercase tracking-widest font-bold">
                        {isTTSPlaying && playingSource === 'custom' ? 'Stop' : 'Speak'}
                    </span>
                  </button>
              </div>
            </div>

             {/* Character Persona Editor - Enhanced */}
             <div className="w-full mt-2 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-saffron-500" />
                        <span className="text-xs font-bold text-saffron-100 uppercase tracking-widest">Character Persona Configuration</span>
                    </div>
                    {isCustomized && (
                        <span className="text-[9px] bg-saffron-500/20 text-saffron-300 px-2 py-0.5 rounded border border-saffron-500/30 uppercase tracking-wider">
                            Customized
                        </span>
                    )}
                </div>
                
                <div className="p-4 space-y-3">
                    <p className="text-[10px] text-white/40 leading-relaxed">
                        This description defines the character's identity, history, and motivation. 
                        Edit this box to change who the AI thinks it is.
                    </p>
                    
                    <textarea
                        value={personaInput}
                        onChange={(e) => setPersonaInput(e.target.value)}
                        className="w-full bg-black/40 text-saffron-100/90 text-sm p-3 rounded-lg border border-white/10 focus:border-saffron-500/50 focus:outline-none min-h-[100px] font-serif leading-relaxed resize-y"
                        placeholder="Describe the character's personality..."
                    />
                    
                    <div className="flex justify-between items-center pt-2">
                        <button 
                            onClick={handleResetPersona} 
                            className={`flex items-center gap-2 text-[10px] uppercase tracking-wider transition-colors ${isCustomized ? 'text-red-400 hover:text-red-300' : 'text-white/20 cursor-default'}`}
                            disabled={!isCustomized}
                        >
                            <RotateCcw className="w-3 h-3"/> Reset to Default
                        </button>

                        <button 
                            onClick={handleSavePersona} 
                            className="flex items-center gap-2 px-4 py-1.5 bg-saffron-600/20 hover:bg-saffron-600/30 text-saffron-300 border border-saffron-500/30 rounded text-[10px] uppercase tracking-widest transition-all"
                        >
                            <Save className="w-3 h-3"/> Apply Persona
                        </button>
                    </div>
                </div>
             </div>


            <p className="text-sm text-white/40 max-w-lg mx-auto pt-4">
              Tap the microphone below to summon the Spirit of Sahyadri. Listen to the tales of courage, darkness, and the rising sun of Swarajya.
            </p>
          </div>
        )}

        {/* Visualizer Area */}
        <div className="relative w-[300px] h-[300px] flex items-center justify-center">
          {isConnected && (
            <>
              {/* Output Visualizer (Model Voice) */}
              <div className="absolute inset-0 z-10">
                <AudioVisualizer 
                  analyser={outputAnalyser} 
                  isActive={true} 
                  color="#ff9800" // Saffron
                />
              </div>
              {/* Input Visualizer (User Voice) - Inner Circle */}
               <div className="absolute inset-0 z-0 opacity-50 scale-75">
                <AudioVisualizer 
                  analyser={inputAnalyser} 
                  isActive={true} 
                  color="#ffffff" // White
                />
              </div>
            </>
          )}

          {/* Fallback Static/Pulse when not connected */}
          {!isConnected && (
            <div className="relative">
               <div className={`absolute inset-0 bg-saffron-600/20 rounded-full blur-3xl transition-all duration-1000 ${isConnecting ? 'scale-150 animate-pulse' : (isTTSPlaying ? 'scale-110 opacity-70' : 'scale-110')}`}></div>
               <div className="w-32 h-32 rounded-full border border-saffron-500/20 flex items-center justify-center bg-black/40 backdrop-blur-md">
                  {/* Show Volume icon if TTS is playing, else Mic */}
                  {isTTSPlaying ? (
                     <Volume2 className="w-12 h-12 text-saffron-500/80 animate-pulse" />
                  ) : (
                     <Mic className={`w-12 h-12 text-saffron-500/50 ${isConnecting ? 'animate-bounce' : ''}`} />
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
            
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex items-center gap-6">
               {/* Main Toggle Button */}
               <button
                  onClick={handleToggleConnection}
                  disabled={isConnecting}
                  className={`group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-2xl ${
                    isConnected 
                      ? 'bg-red-500/10 border-2 border-red-500/50 hover:bg-red-500/20' 
                      : 'bg-saffron-600 hover:bg-saffron-500 border-2 border-saffron-400'
                  }`}
                >
                  {isConnecting ? (
                     <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : isConnected ? (
                    <MicOff className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
                  ) : (
                    <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                  )}
                  
                  {/* Tooltip hint */}
                  <span className="absolute -bottom-10 text-xs text-white/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {isConnected ? 'End Session' : 'Start Conversation'}
                  </span>
               </button>
            </div>
            
            {isConnected && (
              <div className="text-center space-y-2 animate-fade-in">
                 <p className="text-saffron-200/80 font-serif text-lg">Listening...</p>
                 <p className="text-xs text-white/30">Speak naturally. Interrupt at any time.</p>
              </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-white/20 text-xs">
        <p>Powered by Gemini 2.5 Native Audio Live API & TTS</p>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;