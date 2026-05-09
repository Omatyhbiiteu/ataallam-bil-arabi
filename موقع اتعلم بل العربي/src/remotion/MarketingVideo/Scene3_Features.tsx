import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Audio, staticFile } from 'remotion';
import { Brain, BookOpen, Mic, Zap, Globe } from 'lucide-react';

const features = [
    {
        icon: Brain,
        title: 'معلم AI يتكلم عربي',
        desc: 'اسأله، اتكلم معاه، صحح نحوك، واطلب أمثلة حية لأي كلمة.',
        accent: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
        accentRaw: '#f97316',
        glow: 'rgba(249,115,22,0.3)',
        big: true,
    },
    {
        icon: BookOpen,
        title: 'مجلداتك، كروتك، حريتك',
        desc: 'مش مقيد بمناهج ثابتة. أضف الكلمات اللي تهمك فعلاً.',
        accent: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
        accentRaw: '#60a5fa',
        glow: 'rgba(96,165,250,0.25)',
        big: false,
    },
    {
        icon: Zap,
        title: 'مراجعة SRS ذكية',
        desc: 'خوارزمية تعرض الكارت في اللحظة الصح قبل ما تنساه.',
        accent: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        accentRaw: '#a855f7',
        glow: 'rgba(168,85,247,0.25)',
        big: false,
    },
    {
        icon: Mic,
        title: 'نطق فائق الدقة',
        desc: 'كل كلمة مصحوبة بنطق TTS، تحفظ الصح من أول مرة.',
        accent: 'linear-gradient(135deg, #22c55e 0%, #86efac 100%)',
        accentRaw: '#22c55e',
        glow: 'rgba(34,197,94,0.25)',
        big: false,
    },
    {
        icon: Globe,
        title: 'قصص تفاعلية +12 لغة',
        desc: 'استمع وافهم سياق حقيقي بإمكانك تطبيقه فوراً.',
        accent: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        accentRaw: '#06b6d4',
        glow: 'rgba(6,182,212,0.25)',
        big: false,
    },
];

const FeatureCard: React.FC<typeof features[0] & { delay: number }> = ({
    icon: Icon, title, desc, accent, accentRaw, glow, big, delay,
}) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const scale = Math.min(width / 1920, height / 1080);
    const f = (v: number) => v * scale * 1.08;
    const s = (v: number) => v * scale;

    const prog = spring({ fps, frame: frame - delay, config: { damping: 22, stiffness: 100 } });
    const opacity = interpolate(frame - delay, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
    const y = interpolate(prog, [0, 1], [s(28), 0]);
    const scaleCard = interpolate(prog, [0, 1], [0.97, 1]);

    // Animated stats for big card (no jitter)
    const mastery = interpolate(frame - delay - 10, [0, 24], [0, 94], { extrapolateRight: 'clamp' });
    const streak = interpolate(frame - delay - 14, [0, 20], [0, 7], { extrapolateRight: 'clamp' });

    // Very slow shimmer — no flicker
    const shimmer = (frame % 220) / 220;
    const shimmerX = interpolate(shimmer, [0, 1], [-s(140), s(360)]);

    // Wave for mic card — smooth, slow
    const wavePhase = frame / 18;

    return (
        <div
            style={{
                opacity,
                transform: `translateY(${y}px) scale(${scaleCard})`,
                background: 'rgba(13,17,28,0.75)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: s(24),
                padding: big ? `${s(30)}px ${s(32)}px` : `${s(24)}px ${s(26)}px`,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 30px 80px -50px ${glow}, 0 10px 40px -20px rgba(0,0,0,0.4)`,
                backdropFilter: 'blur(20px)',
            }}
        >
            {/* Slow shimmer */}
            <div
                style={{
                    position: 'absolute', top: 0, bottom: 0,
                    width: s(140),
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
                    transform: `translateX(${shimmerX}px)`,
                    pointerEvents: 'none',
                }}
            />
            {/* Top accent line */}
            <div
                style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: s(2), background: accent, opacity: 0.7,
                    borderRadius: `${s(24)}px ${s(24)}px 0 0`,
                }}
            />
            <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: s(14), marginBottom: s(14) }}>
                    <div
                        style={{
                            width: big ? s(58) : s(50), height: big ? s(58) : s(50),
                            borderRadius: s(16), background: accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 16px 36px -18px ${glow}`, flexShrink: 0,
                        }}
                    >
                        <Icon size={big ? s(27) : s(23)} color="white" />
                    </div>
                    <div style={{ fontSize: big ? f(29) : f(24), fontWeight: 900, lineHeight: 1.25 }}>{title}</div>
                </div>
                <p style={{ margin: 0, fontSize: big ? f(21) : f(18), color: 'rgba(226,232,240,0.78)', lineHeight: 1.65 }}>
                    {desc}
                </p>

                {/* Big card: stats */}
                {big && (
                    <div style={{ marginTop: s(20) }}>
                        <div style={{ display: 'flex', gap: s(16), marginBottom: s(16) }}>
                            {[{ label: 'جملة شُرحت', value: '+1.2M' }, { label: 'خطأ صُحح', value: '+800K' }].map((st) => (
                                <div
                                    key={st.label}
                                    style={{
                                        flex: 1, background: 'rgba(255,255,255,0.05)',
                                        borderRadius: s(16), padding: `${s(14)}px ${s(16)}px`,
                                        border: '1px solid rgba(255,255,255,0.07)',
                                    }}
                                >
                                    <div style={{ fontSize: f(15), color: 'rgba(226,232,240,0.6)', marginBottom: s(4) }}>{st.label}</div>
                                    <div style={{ fontSize: f(28), fontWeight: 900, color: accentRaw }}>{st.value}</div>
                                </div>
                            ))}
                        </div>
                        {/* Mastery bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: f(16), color: 'rgba(226,232,240,0.6)', marginBottom: s(6) }}>
                            <span>معدل الإتقان</span>
                            <span style={{ color: accentRaw, fontWeight: 800 }}>{Math.round(mastery)}%</span>
                        </div>
                        <div style={{ height: s(7), background: 'rgba(255,255,255,0.1)', borderRadius: s(9999), overflow: 'hidden' }}>
                            <div style={{ width: `${mastery}%`, height: '100%', background: accent, borderRadius: s(9999) }} />
                        </div>
                        {/* Streak dots */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: s(6), marginTop: s(12) }}>
                            {Array.from({ length: 7 }).map((_, i) => {
                                const filled = Math.min(streak - i, 1);
                                return (
                                    <div key={i} style={{
                                        width: s(20), height: s(20), borderRadius: s(6),
                                        background: filled > 0 ? 'linear-gradient(135deg,#22c55e,#86efac)' : 'rgba(255,255,255,0.08)',
                                    }} />
                                );
                            })}
                            <span style={{ fontSize: f(15), color: 'rgba(226,232,240,0.6)', marginRight: s(4) }}>
                                سلسلة {Math.round(Math.max(0, streak))} أيام 🔥
                            </span>
                        </div>
                    </div>
                )}

                {/* Mic card: wave — smooth slow animation */}
                {title.includes('نطق') && (
                    <div style={{ display: 'flex', gap: s(4), marginTop: s(16), alignItems: 'flex-end' }}>
                        {Array.from({ length: 22 }).map((_, i) => {
                            const wave = Math.sin(wavePhase + i * 0.6) * s(6);
                            const h = Math.max(s(5), s(10 + (i % 5) * 5) + wave);
                            return (
                                <div key={i} style={{ width: s(5), height: h, borderRadius: s(9999), background: 'rgba(34,197,94,0.6)' }} />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Features = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();
    const scale = Math.min(width / 1920, height / 1080);
    const f = (v: number) => v * scale * 1.08;
    const s = (v: number) => v * scale;

    const headOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
    // Slow ambient pulse — no visible jitter
    const pulse = 1 + Math.sin(frame / 80) * 0.025;

    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#07070d',
                fontFamily: 'Cairo, system-ui, sans-serif',
                color: '#f8fafc',
                direction: 'rtl',
                overflow: 'hidden',
            }}
        >
            <Audio src={staticFile('audio/scene3.mp3')} volume={1} />

            <div style={{ position: 'absolute', width: '55%', height: '55%', right: '-8%', top: '-15%', background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)', filter: 'blur(90px)', transform: `scale(${pulse})` }} />
            <div style={{ position: 'absolute', width: '45%', height: '45%', left: '-8%', bottom: '-12%', background: 'radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)', filter: 'blur(90px)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 1px, transparent 1px, transparent 110px)' }} />

            <div
                style={{
                    position: 'relative', zIndex: 2,
                    width: '88%', maxWidth: s(1420), margin: '0 auto',
                    display: 'flex', flexDirection: 'column',
                    height: '100%', justifyContent: 'center',
                    paddingTop: s(36), paddingBottom: s(36), gap: s(24),
                }}
            >
                <div style={{ textAlign: 'right', opacity: headOp }}>
                    <div
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: s(8),
                            padding: `${s(7)}px ${s(18)}px`, borderRadius: s(9999),
                            border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.1)',
                            fontSize: f(17), fontWeight: 800, color: '#fde68a', marginBottom: s(14),
                        }}
                    >
                        ✨ مميزات الفارق
                    </div>
                    <h2 style={{ margin: 0, fontSize: f(64), fontWeight: 900, lineHeight: 1.1 }}>
                        كل أدوات الإتقان في منصة واحدة
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: s(18) }}>
                    <div style={{ gridRow: '1 / span 2' }}>
                        <FeatureCard {...features[0]} delay={0} />
                    </div>
                    <FeatureCard {...features[1]} delay={10} />
                    <FeatureCard {...features[2]} delay={18} />
                    <FeatureCard {...features[3]} delay={26} />
                    <FeatureCard {...features[4]} delay={34} />
                </div>
            </div>
        </AbsoluteFill>
    );
};
