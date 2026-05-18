import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

const guarantees = [
    { text: 'بدون بطاقة ائتمان' },
    { text: 'يوم مجاني كامل' },
    { text: 'إلغاء في أي وقت' },
];

const perks = ['معلم AI شخصي', 'مراجعة SRS ذكية', 'نطق فوري', 'قصص تفاعلية'];

export const CTA = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const scale = Math.min(width / 1920, height / 1080);
    const f = (v: number) => v * scale * 1.08;
    const s = (v: number) => v * scale;

    const enter = spring({ fps, frame, config: { damping: 22, stiffness: 90 } });
    const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
    const y = interpolate(enter, [0, 1], [s(26), 0]);

    // Very slow, subtle pulse — NO jitter
    const buttonPulse = 1 + Math.sin(frame / 60) * 0.008;
    const buttonGlow = 0.62 + Math.sin(frame / 60) * 0.1;

    const pulseOrbA = 1 + Math.sin(frame / 75) * 0.025;
    const pulseOrbB = 1 + Math.sin(frame / 65 + 2) * 0.025;

    // Slow sweep
    const sweep = (frame % 280) / 280;
    const sweepX = interpolate(sweep, [0, 1], [-s(220), s(600)]);

    const priceReveal = interpolate(frame, [16, 30], [0, 1], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#07070d',
                fontFamily: 'var(--font-arabic), system-ui, sans-serif',
                color: '#f8fafc',
                direction: 'rtl',
                overflow: 'hidden',
            }}
        >
            {/* Ambient orbs — very slow drift */}
            <div style={{ position: 'absolute', width: '65%', height: '65%', right: '-15%', top: '-20%', background: 'radial-gradient(circle, rgba(245,158,11,0.28) 0%, transparent 60%)', filter: 'blur(100px)', transform: `scale(${pulseOrbA})` }} />
            <div style={{ position: 'absolute', width: '50%', height: '50%', left: '-10%', bottom: '-15%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 60%)', filter: 'blur(90px)', transform: `scale(${pulseOrbB})` }} />

            {/* Slow sweep light */}
            <div style={{ position: 'absolute', width: s(280), height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)', transform: `translateX(${sweepX}px)`, pointerEvents: 'none' }} />

            {/* Grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 110px),repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 110px)' }} />

            {/* Main layout */}
            <div
                style={{
                    position: 'relative', zIndex: 2,
                    width: '88%', maxWidth: s(1380), margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: s(48), height: '100%',
                    paddingTop: s(40), paddingBottom: s(40),
                    opacity, transform: `translateY(${y}px)`,
                }}
            >
                {/* Left: Text */}
                <div style={{ flex: 1, textAlign: 'right' }}>
                    <div
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: s(10),
                            padding: `${s(9)}px ${s(20)}px`, borderRadius: s(9999),
                            border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.1)',
                            fontSize: f(17), fontWeight: 800, color: '#fde68a', marginBottom: s(20),
                        }}
                    >
                        <span style={{ width: s(8), height: s(8), borderRadius: '50%', background: '#fbbf24', boxShadow: `0 0 ${s(8)}px #fbbf24`, display: 'inline-block' }} />
                        ابدأ رحلتك دلوقتي
                    </div>

                    <h2 style={{ margin: 0, fontSize: f(82), fontWeight: 900, lineHeight: 1.07, letterSpacing: '-0.01em' }}>
                        اتقن الإنجليزي أو الألماني
                        <span style={{ display: 'block', backgroundImage: 'linear-gradient(100deg, #fbbf24 0%, #f97316 50%, #fb923c 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                            بأقل من 2 جنيه يومياً.
                        </span>
                    </h2>

                    <p style={{ margin: `${s(18)}px 0 0`, fontSize: f(26), lineHeight: 1.65, color: 'rgba(226,232,240,0.8)', maxWidth: s(740), opacity: interpolate(frame, [10, 28], [0, 1], { extrapolateRight: 'clamp' }) }}>
                        ابدأ بخطة ذكية تجمع الدروس، الكروت، المراجعة، والذكاء الاصطناعي في تجربة واحدة.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: s(10), marginTop: s(26) }}>
                        {guarantees.map((g, i) => {
                            const d = frame - 20 - i * 8;
                            return (
                                <div key={g.text} style={{ opacity: interpolate(d, [0, 12], [0, 1], { extrapolateRight: 'clamp' }), transform: `translateX(${interpolate(d, [0, 12], [s(16), 0], { extrapolateRight: 'clamp' })}px)`, display: 'flex', alignItems: 'center', gap: s(10), fontSize: f(20), color: 'rgba(226,232,240,0.85)', fontWeight: 600 }}>
                                    <CheckCircle2 size={s(20)} color="#22c55e" />
                                    {g.text}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: CTA Card */}
                <div
                    style={{
                        width: s(460), flexShrink: 0,
                        background: 'rgba(10,14,24,0.8)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: s(30),
                        padding: `${s(36)}px ${s(34)}px`,
                        position: 'relative', overflow: 'hidden',
                        boxShadow: `0 0 0 1px rgba(245,158,11,0.1), 0 40px 100px -50px rgba(245,158,11,${buttonGlow * 0.55}), 0 20px 50px -30px rgba(0,0,0,0.6)`,
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: s(2), background: 'linear-gradient(90deg, transparent, #f97316, #fbbf24, transparent)', opacity: 0.8 }} />

                    {/* Price */}
                    <div style={{ textAlign: 'right', marginBottom: s(22) }}>
                        <div style={{ fontSize: f(18), color: 'rgba(226,232,240,0.6)', marginBottom: s(6) }}>التجربة الكاملة بـ</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: s(8), opacity: priceReveal }}>
                            <span style={{ fontSize: f(64), fontWeight: 900, backgroundImage: 'linear-gradient(135deg,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1 }}>2</span>
                            <span style={{ fontSize: f(22), fontWeight: 700, color: 'rgba(226,232,240,0.8)' }}>جنيه / يوم فقط</span>
                        </div>
                        <div style={{ marginTop: s(4), fontSize: f(16), color: 'rgba(226,232,240,0.45)', textDecoration: 'line-through' }}>السعر الأصلي أعلى بكثير</div>
                    </div>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: s(20) }} />

                    {perks.map((perk, i) => (
                        <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: s(10), marginBottom: s(10), fontSize: f(18), color: 'rgba(226,232,240,0.82)', fontWeight: 600, opacity: interpolate(frame - 10 - i * 6, [0, 10], [0, 1], { extrapolateRight: 'clamp' }) }}>
                            <span style={{ width: s(20), height: s(20), borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#86efac)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: f(12), color: '#07320f', fontWeight: 900 }}>✓</span>
                            {perk}
                        </div>
                    ))}

                    {/* CTA button — very slow pulse */}
                    <div
                        style={{
                            marginTop: s(22),
                            transform: `scale(${buttonPulse})`,
                            background: 'linear-gradient(135deg, #f97316 0%, #fbbf24 80%, #f59e0b 100%)',
                            color: '#09090f',
                            padding: `${s(18)}px ${s(24)}px`,
                            borderRadius: s(9999),
                            fontSize: f(24), fontWeight: 900,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: `0 20px 50px -20px rgba(245,158,11,${buttonGlow}), 0 0 0 4px rgba(245,158,11,0.12)`,
                        }}
                    >
                        <span>ابدأ مجاناً الآن</span>
                        <div style={{ width: s(42), height: s(42), borderRadius: '50%', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={s(20)} color="#09090f" />
                        </div>
                    </div>

                    <div style={{ marginTop: s(14), textAlign: 'center', fontSize: f(15), color: 'rgba(226,232,240,0.5)' }}>
                        لا حاجة لبطاقة دفع — ابدأ فوراً بالمجان
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
