import React from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Mic, FileText } from 'lucide-react';
import { SentenceTopic } from '../../types';
import { resolveMediaUrl } from '../../utils/resolveMediaUrl';

interface SentenceTopicPreviewModalProps {
    topic: SentenceTopic | null;
    onClose: () => void;
}

export const SentenceTopicPreviewModal: React.FC<SentenceTopicPreviewModalProps> = ({ topic, onClose }) => {
    if (typeof document === 'undefined' || !topic) return null;

    const mediaUrl = topic.mediaUrl ? resolveMediaUrl(topic.mediaUrl) : '';

    const renderMedia = () => {
        if (topic.mediaType === 'video' && mediaUrl) {
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = topic.mediaUrl.match(youtubeRegex);
            const youtubeId = match ? match[1] : null;
            if (youtubeId) {
                return (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={topic.title}
                            allowFullScreen
                        />
                    </div>
                );
            }
            const isDirect = /\.(mp4|webm|ogg)$/i.test(mediaUrl);
            if (isDirect) {
                return (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        <video src={mediaUrl} controls controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} className="w-full h-full object-contain" />
                    </div>
                );
            }
            return (
                <div className="aspect-video rounded-xl bg-black/40 flex items-center justify-center text-xs text-gray-400 border border-white/10">
                    معاينة الفيديو: رابط غير مدعوم للتضمين التلقائي
                </div>
            );
        }
        if (topic.mediaType === 'image' && mediaUrl) {
            return (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 relative bg-slate-900">
                    <img src={mediaUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-35" />
                    <img src={mediaUrl} alt="" className="relative z-[1] w-full h-full object-contain p-3" />
                </div>
            );
        }
        return (
            <div className={`aspect-video rounded-xl bg-gradient-to-br ${topic.image} opacity-40 flex items-center justify-center`}>
                <Play size={40} className="text-white/80" />
            </div>
        );
    };

    const content = (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
            <div
                className="absolute inset-0"
                aria-hidden
                onClick={onClose}
            />
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/95">
                    <div>
                        <h2 className="text-lg font-bold text-white">{topic.title}</h2>
                        <p className="text-xs text-gray-400">
                            معاينة كما يظهر للمستخدم • {topic.level} • {topic.subLevel}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
                        title="إغلاق"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="p-4 space-y-6 text-right">
                    {renderMedia()}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-3">
                                <Mic size={16} /> الجمل
                            </h3>
                            {(topic.sentences?.length ?? 0) === 0 ? (
                                <p className="text-sm text-gray-500">لا توجد جمل بعد.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {topic.sentences!.map((s, idx) => (
                                        <li
                                            key={s.id || idx}
                                            className="p-3 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <div className="font-medium text-white" dir="ltr">{s.original}</div>
                                            <p className="text-sm text-gray-400 mt-1">{s.translation}</p>
                                            {s.audioUrl ? (
                                                <audio
                                                    className="w-full mt-2 h-9"
                                                    controls
                                                    preload="metadata"
                                                    src={resolveMediaUrl(s.audioUrl)}
                                                />
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
                                <FileText size={16} /> ملاحظات
                            </h3>
                            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                                {topic.grammarNotes?.trim() ? topic.grammarNotes : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
