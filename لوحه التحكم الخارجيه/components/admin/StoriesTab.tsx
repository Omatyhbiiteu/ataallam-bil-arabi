
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, HelpCircle, Edit2, Search, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Story } from '../../types';

interface StoriesTabProps {
    stories: Story[];
    onAddNew: () => void;
    onEdit: (story: Story) => void;
    onDelete: (id: string) => void;
    onManageQuestions: (id: string) => void;
    t: any;
}

export const StoriesTab: React.FC<StoriesTabProps> = ({
    stories,
    onAddNew,
    onEdit,
    onDelete,
    onManageQuestions,
    t
}) => {
    const labels = t.admin.stories;
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [sortBy, setSortBy] = useState('title_asc');

    const levelRank = (level: string) => {
        const map: Record<string, number> = {
            A1: 1,
            A2: 2,
            B1: 3,
            B2: 4,
            C1: 5,
            C2: 6,
            Beginner: 1,
            Intermediate: 3,
            Advanced: 5
        };
        return map[level] ?? 999;
    };

    const filteredStories = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const matchesText = (value?: string) => (value || '').toLowerCase().includes(query);

        const filtered = stories.filter((story) => {
            if (query) {
                const tagText = (story.tags || []).join(' ');
                const matchesSearch =
                    matchesText(story.title) ||
                    matchesText(story.description) ||
                    matchesText(tagText);
                if (!matchesSearch) return false;
            }

            if (levelFilter !== 'all') {
                const matchesLevel = story.level === levelFilter || story.subLevel === levelFilter;
                if (!matchesLevel) return false;
            }

            return true;
        });

        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'title_desc') return (b.title || '').localeCompare(a.title || '');
            if (sortBy === 'level') return levelRank(a.subLevel || a.level) - levelRank(b.subLevel || b.level);
            if (sortBy === 'questions_desc') return (b.questions?.length || 0) - (a.questions?.length || 0);
            if (sortBy === 'word_count_desc') return (b.wordCount || 0) - (a.wordCount || 0);
            return 0;
        });

        return sorted;
    }, [stories, searchQuery, levelFilter, sortBy]);

    const levelOptions = [
        { value: 'all', label: labels.levelAll },
        { value: 'A1', label: 'A1' },
        { value: 'A2', label: 'A2' },
        { value: 'B1', label: 'B1' },
        { value: 'B2', label: 'B2' },
        { value: 'C1', label: 'C1' },
        { value: 'C2', label: 'C2' },
        { value: 'Beginner', label: labels.levelBeginner },
        { value: 'Intermediate', label: labels.levelIntermediate },
        { value: 'Advanced', label: labels.levelAdvanced }
    ];

    const sortOptions = [
        { value: 'title_asc', label: labels.sortTitleAsc },
        { value: 'title_desc', label: labels.sortTitleDesc },
        { value: 'level', label: labels.sortLevel },
        { value: 'questions_desc', label: labels.sortQuestionsDesc },
        { value: 'word_count_desc', label: labels.sortWordCountDesc }
    ];

    return (
        <motion.div
            key="stories"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
        >
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2">{labels.title}</h2>
                        <p className="text-gray-400 font-medium">{labels.subtitle}</p>
                    </div>
                    <button
                        onClick={onAddNew}
                        className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-xl shadow-red-900/30"
                    >
                        <Plus size={20} />
                        <span>{labels.addNew}</span>
                    </button>
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={labels.searchPlaceholder}
                            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-600 py-3 pr-12 pl-4 rounded-2xl outline-none focus:border-red-500/60 transition"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                            <span className="text-xs text-gray-400 font-bold">{labels.levelFilterLabel}</span>
                            <select
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                                className="bg-transparent text-white text-sm font-bold outline-none"
                            >
                                {levelOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="text-black">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                            <ArrowUpDown size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-400 font-bold">{labels.sortLabel}</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-white text-sm font-bold outline-none"
                            >
                                {sortOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="text-black">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-500 font-semibold">
                    {labels.showing} {filteredStories.length} {labels.of} {stories.length}
                </div>
            </header>

            {filteredStories.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-[2rem]">
                    <p className="text-lg font-bold text-white">{labels.noResults}</p>
                    <p className="text-sm text-gray-500 mt-2">{labels.noResultsHint}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {filteredStories.map((story) => {
                        const levelLabel = story.subLevel || story.level;
                        const questionCount = story.questions?.length || 0;
                        return (
                            <motion.div
                                key={story.id}
                                whileHover={{ y: -5 }}
                                className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden group hover:border-red-500/30 transition-all flex flex-col"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img src={story.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                    <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">{levelLabel}</span>
                                            {(story as any)._langFlag && (
                                                <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border ${((story as any)._lang || '') === 'de' ? 'bg-yellow-500/80 text-black border-yellow-400' : 'bg-blue-500/80 text-white border-blue-400'}`}>
                                                    {(story as any)._langFlag} {((story as any)._lang || '').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onDelete(story.id)} className="p-2.5 bg-black/40 backdrop-blur-md text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="font-black text-2xl text-white mb-3 tracking-tight">{story.title}</h3>
                                    <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed mb-6">{story.description}</p>

                                    <div className="flex flex-wrap gap-3 text-[11px] font-bold text-gray-500 mb-6">
                                        {story.wordCount ? (
                                            <span>{story.wordCount} {labels.wordCount}</span>
                                        ) : null}
                                        {story.estimatedReadingTime ? (
                                            <span>{story.estimatedReadingTime} {labels.readingTime}</span>
                                        ) : null}
                                        {story.difficulty ? (
                                            <span>{labels.difficulty} {story.difficulty}/10</span>
                                        ) : null}
                                        {story.viewCount != null ? (
                                            <span>{story.viewCount} {labels.viewCount}</span>
                                        ) : null}
                                    </div>

                                    {story.tags && story.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {story.tags.slice(0, 4).map(tag => (
                                                <span key={tag} className="text-[10px] font-bold text-gray-300 bg-white/5 border border-white/10 px-2 py-1 rounded-lg">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                                        <button onClick={() => onManageQuestions(story.id)} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl text-sm font-bold transition-all border border-white/5">
                                            <HelpCircle size={18} className="text-red-500" />
                                            {labels.manageQuestions} {questionCount > 0 ? `(${questionCount})` : ''}
                                        </button>
                                        <button
                                            onClick={() => onEdit(story)}
                                            className="flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3.5 rounded-xl text-sm font-bold transition-all border border-red-500/20"
                                        >
                                            <Edit2 size={18} />
                                            {labels.editStory}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <header className="hidden">
                <div>
                    <h2 className="text-3xl font-black text-white mb-2">القصص المنشورة</h2>
                    <p className="text-gray-400 font-medium">إدارة وتحرير القصص والأسئلة المرتبطة بها.</p>
                </div>
                <button
                    onClick={onAddNew}
                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-bold transition-all shadow-xl shadow-red-900/30"
                >
                    <Plus size={20} />
                    <span>قصة جديدة</span>
                </button>
            </header>

            <div className="hidden">
                {stories.map(story => (
                    <motion.div
                        key={story.id}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden group hover:border-red-500/30 transition-all flex flex-col"
                    >
                        <div className="relative h-56 overflow-hidden">
                            <img src={story.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg tracking-widest uppercase">{story.level}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => onDelete(story.id)} className="p-2.5 bg-black/40 backdrop-blur-md text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-black text-2xl text-white mb-3 tracking-tight">{story.title}</h3>
                            <p className="text-gray-400 text-sm font-medium line-clamp-2 leading-relaxed mb-6">{story.description}</p>

                            <div className="mt-auto grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                                <button onClick={() => onManageQuestions(story.id)} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl text-sm font-bold transition-all border border-white/5">
                                    <HelpCircle size={18} className="text-red-500" />
                                    أسئلة القصة
                                </button>
                                <button
                                    onClick={() => onEdit(story)}
                                    className="flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3.5 rounded-xl text-sm font-bold transition-all border border-red-500/20"
                                >
                                    <Edit2 size={18} />
                                    تعديل المحتوى
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
