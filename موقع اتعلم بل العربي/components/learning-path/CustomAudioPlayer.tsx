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
            const dur = audioRef.current.duration;
            const cur = audioRef.current.currentTime;
            setCurrentTime(cur);
            if (dur && !isNaN(dur)) {
                setProgress((cur / dur) * 100);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (audioRef.current && duration) {
            const newTime = (value / 100) * duration;
            audioRef.current.currentTime = newTime;
            setProgress(value);
            setCurrentTime(newTime);
        }
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return '00:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-stone-200 dark:border-gray-700 flex items-center gap-4 w-full mb-6">
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                controlsList="nodownload noplaybackrate"
                onContextMenu={(e) => e.preventDefault()}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {/* زر التشغيل */}
            <button
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition shadow-lg shadow-primary/30 flex-shrink-0"
            >
                {isPlaying ? <PauseCircle size={24} /> : <PlayCircle size={24} />}
            </button>

            {/* شريط التقدم والوقت */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2" dir="ltr">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/*
                  ✅ الإصلاح:
                  - الـ input[range] مرفوع فوق الـ track في container أعلى (20px)
                  - overflow-hidden موجود فقط على الـ track الخلفي (pointer-events-none)
                  - الـ input يغطي كامل المنطقة القابلة للضغط
                */}
                <div className="relative w-full" style={{ height: '20px' }}>
                    {/* Track (الشريط المرئي) */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden pointer-events-none">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Input Range - شفاف فوق الشريط بمنطقة ضغط كاملة */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full cursor-pointer"
                        style={{
                            opacity: 0,
                            height: '100%',
                            margin: 0,
                            padding: 0,
                            zIndex: 10,
                        }}
                    />
                </div>
            </div>

            {/* أيقونة الصوت */}
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300">
                <Volume2 size={20} />
            </div>
        </div>
    );
};
