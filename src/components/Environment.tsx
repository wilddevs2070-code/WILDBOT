import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Droplets, Wind, Sun } from 'lucide-react';

export default function Environment() {
  const [isWaterActive, setIsWaterActive] = useState(false);
  const [isWindActive, setIsWindActive] = useState(false);
  const [isSunActive, setIsSunActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const waterAudio = useRef<HTMLAudioElement | null>(null);
  const windAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    waterAudio.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // Placeholder
    windAudio.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'); // Placeholder
    
    return () => {
      waterAudio.current?.pause();
      windAudio.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      waterAudio.current!.muted = true;
      windAudio.current!.muted = true;
    } else {
      waterAudio.current!.muted = false;
      windAudio.current!.muted = false;
    }
  }, [isMuted]);

  const toggleWater = () => {
    setIsWaterActive(!isWaterActive);
    if (!isWaterActive) {
      waterAudio.current?.play();
    } else {
      waterAudio.current?.pause();
    }
  };

  const toggleWind = () => {
    setIsWindActive(!isWindActive);
    if (!isWindActive) {
      windAudio.current?.play();
    } else {
      windAudio.current?.pause();
    }
  };

  return (
    <div className="mc-panel-dark p-4 border-4 border-black space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[#FFFF55]">Environment</h2>
        <button onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button 
          onClick={toggleWater}
          className={cn("mc-button p-2 flex flex-col items-center gap-1", isWaterActive ? "mc-button-blue" : "")}
        >
          <Droplets size={20} />
          <span className="text-[10px]">Water</span>
        </button>
        <button 
          onClick={toggleWind}
          className={cn("mc-button p-2 flex flex-col items-center gap-1", isWindActive ? "mc-button-blue" : "")}
        >
          <Wind size={20} />
          <span className="text-[10px]">Wind</span>
        </button>
        <button 
          onClick={() => setIsSunActive(!isSunActive)}
          className={cn("mc-button p-2 flex flex-col items-center gap-1", isSunActive ? "mc-button-yellow" : "")}
        >
          <Sun size={20} />
          <span className="text-[10px]">Sun</span>
        </button>
      </div>

      {isWaterActive && (
        <div className="relative h-16 bg-blue-900/50 overflow-hidden rounded-lg">
          <div className="absolute inset-0 animate-pulse bg-blue-500/30"></div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-blue-400 animate-bounce"></div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
