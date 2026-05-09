
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Intro } from '@/src/remotion/MarketingVideo/Scene1_Intro';
import { Problem } from '@/src/remotion/MarketingVideo/Scene2_Problem';
import { Features } from '@/src/remotion/MarketingVideo/Scene3_Features';
import { CTA } from '@/src/remotion/MarketingVideo/Scene4_CTA';

// Total duration: 450 frames @ 30fps = 15 seconds
// Scene 1 (Intro):     0   → 115   (3.8s)
// Scene 2 (Problem):   115 → 240   (4.2s)
// Scene 3 (Features):  240 → 375   (4.5s)
// Scene 4 (CTA):       375 → 450   (2.5s)

export const MarketingVideo = () => {
    return (
        <AbsoluteFill
            style={{
                backgroundColor: '#07070d',
                fontFamily: 'Cairo, Outfit, system-ui, sans-serif',
                color: 'white',
                direction: 'rtl',
            }}
        >
            <Sequence from={0} durationInFrames={115}>
                <Intro />
            </Sequence>
            <Sequence from={115} durationInFrames={125}>
                <Problem />
            </Sequence>
            <Sequence from={240} durationInFrames={135}>
                <Features />
            </Sequence>
            <Sequence from={375} durationInFrames={75}>
                <CTA />
            </Sequence>
        </AbsoluteFill>
    );
};
