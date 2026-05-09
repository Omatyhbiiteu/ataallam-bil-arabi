
import React, { useEffect } from 'react';
import { Player } from '@remotion/player';
import { MarketingVideo } from '../src/remotion/MarketingVideo';
import { X } from 'lucide-react';

interface PromoPresentationProps {
    onClose: () => void;
    onSignUp: () => void;
}

export const PromoPresentation: React.FC<PromoPresentationProps> = ({ onClose, onSignUp }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_45%)]"></div>

            <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-4 md:-top-6 right-4 text-white/60 hover:text-white transition-colors z-[110] bg-white/10 p-2 rounded-full hover:bg-white/20"
                    aria-label="إغلاق الفيديو"
                >
                    <X size={24} />
                </button>

                <div className="relative rounded-[2.5rem] p-[1px] bg-gradient-to-br from-amber-500/50 via-orange-500/20 to-blue-500/30">
                    <div
                        className="relative aspect-video bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        style={{ aspectRatio: '16 / 9' }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center bg-black" style={{ direction: 'ltr' }}>
                            <Player
                                component={MarketingVideo}
                                durationInFrames={450}
                                compositionWidth={1920}
                                compositionHeight={1080}
                                fps={30}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'block'
                                }}
                                controls
                                autoPlay
                                loop
                            />
                        </div>
                        <div className="absolute inset-0 video-scanlines"></div>
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full border border-white/10 backdrop-blur">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            عرض تعريفي
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-right">
                        <h3 className="text-white text-xl md:text-2xl font-black">فيديو تعريفي خلال دقيقة</h3>
                        <p className="text-white/70 text-sm md:text-base">شاهد كيف تتحول الدراسة إلى تجربة ممتعة ومركزة.</p>
                    </div>
                    <button
                        onClick={onSignUp}
                        className="btn-primary w-full md:w-auto text-base md:text-lg flex items-center justify-center gap-2"
                    >
                        ابدأ الآن مجاناً
                    </button>
                </div>
            </div>
        </div>
    );
};

