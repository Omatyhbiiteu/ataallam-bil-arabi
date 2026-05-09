import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Audio, staticFile } from 'remotion';

const pains = [
    {
        emoji: '😩',
        before: 'تحفظ كلمات وتنساها بعد يومين',
        after: 'مراجعة SRS تثبتها في ذاكرتك للأبد',
        accent: '#f97316',
    },
    {
        emoji: '🌀',
        before: 'مصادر متشتتة بلا خطة واضحة',
        after: 'مسار تعلم ذكي مخصص بالكامل ليك',
        accent: '#818cf8',
    },
    {
        emoji: '😶',
        before: 'خايف تتكلم وترتكب أخطاء نحوية',
        after: 'معلم AI يصحح كل جملة في الوقت الفعلي',
        accent: '#22c55e',
    },
];

const PainRow: React.FC<typeof pains[0] & { index: number }> = ({ emoji, before, after, accent, index }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const scale = Math.min(width / 1920, height / 1080);
    const f = (v: number) => v * scale * 1.08;
    const s = (v: number) => v * scale;

    const delay = index * 16;
    const prog = spring({ fps, frame: frame - delay, config: { damping: 22, stiffness: 100 } });
    const opacity = interpolate(frame - delay, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
    const x = interpolate(prog, [0, 1], [s(36), 0]);
    const arrowOp = interpolate(frame - delay - 12, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <div
            style={{
                opacity,
                transform: `translateX(${x}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: s(18),
                background: 'rgba(15,23,42,0.7)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: s(20),
                padding: `${s(22)}px ${s(28)}px`,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px -30px rgba(0,0,0,0.6)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Left accent bar */}
            <div
                style={{
                    position: 'absolute',
                    right: 0, top: '20%', bottom: '20%',
                    width: s(4),
                    borderRadius: s(9999),
                    background: accent,
                    boxShadow: `0 0 ${s(14)}px ${accent}`,
                }}
            />
            <div style={{ fontSize: f(38), lineHeight: 1, flexShrink: 0 }}>{emoji}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
                <div
                    style={{
                        fontSize: f(20),
                        fontWeight: 700,
                        color: 'rgba(226,232,240,0.5)',
                        textDecoration: 'line-through',
                        marginBottom: s(4),
                    }}
                >
                    {before}
                </div>
                <div style={{ opacity: arrowOp, fontSize: f(20), fontWeight: 900, color: accent }}>↓</div>
                <div
                    style={{
                        opacity: arrowOp,
                        fontSize: f(23),
                        fontWeight: 900,
                        color: 'rgba(248,250,252,0.95)',
                        marginTop: s(2),
                    }}
                >
                    {after}
                </div>
            </div>
        </div>
    );
};

export const Problem = () => {
    const frame = useCurrentFrame();
    const { width, height } = useVideoConfig();
    const scale = Math.min(width / 1920, height / 1080);
    const f = (v: number) => v * scale * 1.08;
    const s = (v: number) => v * scale;

    const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
    const titleY = interpolate(frame, [0, 20], [s(-28), 0], { extrapolateRight: 'clamp' });
    const underlineW = interpolate(frame, [16, 46], [0, 100], { extrapolateRight: 'clamp' });

    // Very slow, imperceptible pulse — no jitter
    const pulse = 1 + Math.sin(frame / 75) * 0.03;

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
            <Audio src={staticFile('audio/scene2.mp3')} volume={1} />

            {/* Tension glow — static, no jitter */}
            <div
                style={{
                    position: 'absolute',
                    width: '60%', height: '60%',
                    left: '-10%', top: '-18%',
                    background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 65%)',
                    filter: 'blur(90px)',
                    transform: `scale(${pulse})`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    width: '45%', height: '45%',
                    right: '-5%', bottom: '-12%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)',
                    filter: 'blur(80px)',
                }}
            />

            {/* Grid */}
            <div
                style={{
                    position: 'absolute', inset: 0,
                    backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 110px)',
                    opacity: 0.5,
                }}
            />

            <div
                style={{
                    position: 'relative', zIndex: 2,
                    width: '86%', maxWidth: s(1380),
                    margin: '0 auto',
                    display: 'flex', flexDirection: 'column',
                    height: '100%', justifyContent: 'center',
                    paddingTop: s(40), paddingBottom: s(40),
                    gap: s(30),
                }}
            >
                <div style={{ textAlign: 'right' }}>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: f(70),
                            fontWeight: 900,
                            opacity: titleOp,
                            transform: `translateY(${titleY}px)`,
                            lineHeight: 1.1,
                        }}
                    >
                        هل ده وضعك مع تعلم اللغات؟
                    </h2>
                    <div
                        style={{
                            marginTop: s(14),
                            height: s(5),
                            width: `${underlineW}%`,
                            maxWidth: s(380),
                            background: 'linear-gradient(90deg, #ef4444, #f97316)',
                            borderRadius: s(9999),
                            marginRight: 0,
                            marginLeft: 'auto',
                        }}
                    />
                    <p
                        style={{
                            margin: `${s(12)}px 0 0`,
                            fontSize: f(28),
                            color: 'rgba(226,232,240,0.75)',
                            opacity: interpolate(frame, [14, 30], [0, 1], { extrapolateRight: 'clamp' }),
                            fontWeight: 500,
                        }}
                    >
                        المشكلة مش فيك — المشكلة في طريقة التعلم. دلوقتي في حل أفضل.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: s(18) }}>
                    {pains.map((p, i) => (
                        <PainRow key={p.emoji} {...p} index={i} />
                    ))}
                </div>
            </div>
        </AbsoluteFill>
    );
};
