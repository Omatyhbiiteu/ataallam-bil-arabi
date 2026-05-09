import React, { useState, useRef } from 'react';
import { PlayCircle, PauseCircle, Volume2 } from 'lucide-react';

interface CustomAudioPlayerProps {
    src: string;
}

export const CustomAudioPlayer: React.FC<CustomAudioPlayerProps> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = (parseFloat(e.target.value) / 100) * duration;
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setProgress(parseFloat(e.target.value));
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-stone-200 dark:border-gray-700 flex items-center gap-4 w-full mb-6">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />
            <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition shadow-lg shadow-primary/30 flex-shrink-0">
                {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
            </button>
            <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1" dir="ltr">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
                    <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300"><Volume2 size={20} /></div>
        </div>
    );
};
