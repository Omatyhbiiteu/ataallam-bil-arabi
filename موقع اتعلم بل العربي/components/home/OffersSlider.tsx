import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromoBanner } from '../../types';

interface OffersSliderProps {
  offers: PromoBanner[];
  onNavigateToSettings: (section: 'subscription' | 'account' | 'notifications' | 'appearance' | 'support') => void;
}

export const OffersSlider: React.FC<OffersSliderProps> = ({
  offers,
  onNavigateToSettings,
}) => {
  const nowTs = Date.now();
  const isEffectiveOfferActive = (b: PromoBanner) => {
    if (!b?.isActive) return false;
    if (!b?.expiryDate) return true;
    const ts = Date.parse(b.expiryDate);
    if (Number.isNaN(ts)) return true;
    return ts > nowTs;
  };

  const activeOffers = useMemo(
    () => (offers || []).filter((b) => isEffectiveOfferActive(b)),
    [offers]
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (activeOffers.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeOffers.length);
    }, 22000);

    return () => clearInterval(timer);
  }, [paused, activeOffers.length]);

  useEffect(() => {
    // لو العروض اتغيرت (اتحذفت/اتضافت) نضمن index يكون داخل الحدود
    setCurrentSlide((prev) => {
      if (activeOffers.length === 0) return 0;
      return Math.min(prev, activeOffers.length - 1);
    });
  }, [activeOffers.length]);

  const slide = activeOffers[currentSlide];
  const slideBg = slide?.backgroundColor?.trim();
  const slideText = slide?.textColor?.trim();
  const gradientStyle = useMemo(() => {
    const bg = slideBg && slideBg.startsWith('#') ? slideBg : '#4f46e5';
    const accent = slideText && slideText.startsWith('#') ? slideText : '#a855f7';
    return { backgroundImage: `linear-gradient(90deg, ${bg}, ${accent})` } as React.CSSProperties;
  }, [slideBg, slideText]);

  const handleCopy = async () => {
    if (!slide) return;
    try {
      await navigator.clipboard.writeText(`${slide.title}\n${slide.description}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!slide) return;
    const data = {
      title: slide.title,
      text: slide.description,
      url: slide.ctaLink || window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // ignore
      }
    } else {
      await handleCopy();
    }
  };

  const hasOffers = activeOffers.length > 0;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={(slide?.id || 'empty') + currentSlide}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45 }}
          className="px-5 py-4 flex items-center gap-4"
          style={hasOffers ? gradientStyle : undefined}
        >
          {/* Left icon */}
          <div className="shrink-0 w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
            {hasOffers ? (
              <span className="text-white text-xl">{slide?.emoji || '🎁'}</span>
            ) : (
              <span className="text-white/80 text-xl">🎁</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm md:text-base leading-snug truncate">
              {hasOffers ? slide.title : 'لا توجد عروض حالياً'}
            </p>
            <span className="text-white/70 text-[10px] font-bold tracking-widest uppercase mt-0.5 block truncate">
              {hasOffers ? (slide.type === 'banner' ? 'عرض' : 'إعلان') : '—'}
            </span>

            {hasOffers && (
              <p className="text-white/85 text-xs font-bold mt-2 leading-relaxed line-clamp-2">
                {slide.description}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {/* Prev / Next */}
            <button
              type="button"
              disabled={!hasOffers || activeOffers.length <= 1}
              onClick={() =>
                setCurrentSlide((p) =>
                  activeOffers.length === 0 ? 0 : (p - 1 + activeOffers.length) % activeOffers.length
                )
              }
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="السابق"
            >
              <ArrowRight size={14} className="text-white" />
            </button>

            <button
              type="button"
              disabled={!hasOffers || activeOffers.length <= 1}
              onClick={() =>
                setCurrentSlide((p) =>
                  activeOffers.length === 0 ? 0 : (p + 1) % activeOffers.length
                )
              }
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="التالي"
            >
              <ArrowLeft size={14} className="text-white" />
            </button>

            {/* Copy */}
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!hasOffers}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="نسخ"
            >
              {copied ? (
                <Check size={14} className="text-emerald-300" />
              ) : (
                <Copy size={14} className="text-white" />
              )}
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={!hasOffers}
              className="hidden sm:flex p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition border border-white/10 items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="مشاركة"
            >
              <Share2 size={14} className="text-white" />
            </button>

            {/* CTA */}
            {hasOffers && (
              <button
                type="button"
                onClick={() => {
                  if (slide?.ctaLink) {
                    window.open(slide.ctaLink, '_blank', 'noopener,noreferrer');
                    return;
                  }
                  onNavigateToSettings('subscription');
                }}
                className="hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-3 py-1.5 rounded-xl transition border border-white/20 ml-1"
              >
                {slide.ctaText || 'اعرف التفاصيل'}
                <ArrowLeft size={12} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

