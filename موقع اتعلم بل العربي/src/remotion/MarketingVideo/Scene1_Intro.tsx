import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Audio, staticFile } from 'remotion';

export const Intro = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    const scale = Math.min(width / 1920, height / 1080);
    const fontScale = scale * 1.08;
    const s = (value: number) => value * scale;
    const f = (value: number) => value * fontScale;

    // ─── Animations ───────────────────────────────────────────────
    const enter = spring({ fps, frame, config: { damping: 22, stiffness: 90 } });
    const titleY = interpolate(enter, [0, 1], [s(46), 0]);
    const titleOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' });
    const subOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
    const badgeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });

    // Very slow, gentle ambient movement — no jitter
    const pulse1 = 1 + Math.sin(frame / 80) * 0.025;
    const pulse2 = 1 + Math.sin(frame / 65 + 2) * 0.025;
    const floatY = Math.sin(frame / 70) * s(6);

    // Slow sweep
    const sweep = (frame % 300) / 300;
    const sweepX = interpolate(sweep, [0, 1], [-width * 0.4, width * 0.5]);

    const chips = [
        { label: '🧠 ذكاء اصطناعي معلمك' },
        { label: '⚡ 10 دقائق يومياً تكفي' },
        { label: '🎯 نتائج مضمونة' },
    ];

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
            {/* Optional narration audio */}
            <Audio src={staticFile('audio/scene1.mp3')} volume={1} />

            {/* ── Grid Texture ── */}
            <div
                style={{
                    position: 'absolute', inset: 0,
                    backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 100px),' +
                        'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 100px)',
                }}
            />

            {/* ── Radial Amber Glow ── */}
            <div
                style={{
                    position: 'absolute',
                    width: '65%', height: '65%',
                    right: '-10%', top: '-20%',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.32) 0%, transparent 65%)',
                    filter: 'blur(90px)',
                    transform: `scale(${pulse1}) translateY(${floatY}px)`,
                }}
            />
            {/* ── Radial Blue Glow ── */}
            <div
                style={{
                    position: 'absolute',
                    width: '55%', height: '55%',
                    left: '-10%', bottom: '-20%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.26) 0%, transparent 65%)',
                    filter: 'blur(100px)',
                    transform: `scale(${pulse2})`,
                }}
            />

            {/* ── Moving Sweep Light ── */}
            <div
                style={{
                    position: 'absolute',
                    width: s(280), height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.035), transparent)',
                    transform: `translateX(${sweepX}px)`,
                    pointerEvents: 'none',
                }}
            />

            {/* ── Main Content ── */}
            <div
                style={{
                    position: 'relative', zIndex: 2,
                    width: '86%', maxWidth: s(1320),
                    margin: '0 auto',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end',
                    height: '100%', justifyContent: 'center',
                    paddingTop: s(40), paddingBottom: s(40),
                    gap: s(20),
                }}
            >
                {/* Badge */}
                <div
                    style={{
                        opacity: badgeIn,
                        transform: `translateY(${interpolate(badgeIn, [0, 1], [s(-12), 0])}px)`,
                        display: 'inline-flex', alignItems: 'center', gap: s(10),
                        padding: `${s(10)}px ${s(22)}px`,
                        borderRadius: s(9999),
                        border: '1px solid rgba(245,158,11,0.4)',
                        background: 'rgba(245,158,11,0.12)',
                        fontSize: f(18), fontWeight: 800,
                        color: '#fde68a',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <span
                        style={{
                            width: s(8), height: s(8),
                            borderRadius: '50%',
                            background: '#fbbf24',
                            boxShadow: `0 0 ${s(10)}px #fbbf24`,
                            display: 'inline-block',
                        }}
                    />
                    منصة اتعلم بالعربي Pro — الذكاء الاصطناعي في خدمة لغتك
                </div>

                {/* Headline */}
                <h1
                    style={{
                        margin: 0,
                        opacity: titleOpacity,
                        transform: `translateY(${titleY}px)`,
                        fontSize: f(102),
                        lineHeight: 1.06,
                        fontWeight: 900,
                        textAlign: 'right',
                        letterSpacing: '-0.01em',
                    }}
                >
                    تعلّم أي لغة
                    <span
                        style={{
                            display: 'block',
                            backgroundImage: 'linear-gradient(100deg, #fbbf24 0%, #f97316 45%, #fb923c 80%, #fbbf24 100%)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        بطريقتك أنت.
                    </span>
                </h1>

                {/* Sub-headline */}
                <p
                    style={{
                        margin: 0,
                        maxWidth: s(800),
                        fontSize: f(30),
                        lineHeight: 1.65,
                        color: 'rgba(226,232,240,0.85)',
                        opacity: subOpacity,
                        textAlign: 'right',
                        fontWeight: 500,
                    }}
                >
                    أنشئ مجلداتك، تحدث مع معلم ذكاء اصطناعي يصحح أخطائك،
                    واستمتع بمراجعة ذكية تضمن عدم النسيان — كل ذلك بأقل من&nbsp;
                    <span style={{ color: '#fbbf24', fontWeight: 900 }}>2 جنيه يومياً.</span>
                </p>

                {/* Chips */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: s(14), flexWrap: 'wrap', marginTop: s(6) }}>
                    {chips.map((chip, i) => {
                        const d = frame - 30 - i * 8;
                        const chipOp = interpolate(d, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
                        const chipY = interpolate(d, [0, 12], [s(12), 0], { extrapolateRight: 'clamp' });
                        return (
                            <div
                                key={chip.label}
                                style={{
                                    opacity: chipOp,
                                    transform: `translateY(${chipY}px)`,
                                    padding: `${s(10)}px ${s(20)}px`,
                                    borderRadius: s(9999),
                                    border: '1px solid rgba(255,255,255,0.14)',
                                    background: 'rgba(255,255,255,0.06)',
                                    backdropFilter: 'blur(12px)',
                                    fontSize: f(19),
                                    fontWeight: 700,
                                    color: 'rgba(248,250,252,0.92)',
                                }}
                            >
                                {chip.label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};
