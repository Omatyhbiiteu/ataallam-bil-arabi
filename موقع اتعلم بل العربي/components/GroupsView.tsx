
import React, { useState } from 'react';
import {
  Users, Trophy, Target, Star, Download,
  Award, Flame, Zap, CheckCircle, Calendar, Gift, ShieldCheck, AlertTriangle
} from 'lucide-react';

interface CommunityHubProps {
  t: any;
}

// Types
interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  avatar: string;
  verified?: boolean;
}

interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  expiresIn: string;
  participants: number;
  reward: { xp: number; badge: string };
}

interface SharedDeck {
  id: string;
  title: string;
  author: string;
  cardCount: number;
  downloads: number;
  rating: number;
  category: string;
}

type DataState = 'ready' | 'loading' | 'empty' | 'error';

interface DataStateCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

const DataStateCard: React.FC<DataStateCardProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  loading
}) => (
  <div className="surface-card rounded-[24px] p-8 md:p-10 text-center">
    <div className={`mx-auto mb-4 w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-200 flex items-center justify-center ${loading ? 'animate-pulse' : ''}`}>
      <Icon size={22} />
    </div>
    <h3 className="headline-md text-gray-900 dark:text-white">{title}</h3>
    <p className="body-lg text-gray-600 dark:text-gray-300 mt-2">{description}</p>
    {actionLabel && (
      <button onClick={onAction} className="btn-secondary mt-5">
        {actionLabel}
      </button>
    )}
  </div>
);

export const GroupsView: React.FC<CommunityHubProps> = ({ t }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'challenges' | 'decks'>('leaderboard');

  // Mock Data - Leaderboard
  const mockLeaderboard: LeaderboardUser[] = [
    { rank: 1, name: 'أحمد محمد', xp: 2450, streak: 28, avatar: '🥇', verified: true },
    { rank: 2, name: 'سارة علي', xp: 2120, streak: 21, avatar: '🥈', verified: true },
    { rank: 3, name: 'عمر حسن', xp: 1890, streak: 18, avatar: '🥉', verified: true },
    { rank: 4, name: 'فاطمة أحمد', xp: 1670, streak: 15, avatar: '👩' },
    { rank: 5, name: 'محمود سعيد', xp: 1540, streak: 14, avatar: '👨' },
    { rank: 6, name: 'نور الدين', xp: 1420, streak: 12, avatar: '👤' },
    { rank: 7, name: 'ليلى محمد', xp: 1310, streak: 11, avatar: '👩‍🦰' },
    { rank: 8, name: 'كريم علي', xp: 1200, streak: 10, avatar: '👨‍💼' },
    { rank: 9, name: 'مريم أحمد', xp: 1150, streak: 9, avatar: '👧' },
    { rank: 10, name: 'يوسف حسن', xp: 1080, streak: 8, avatar: '👦' },
    { rank: 15, name: 'أنت', xp: 850, streak: 7, avatar: '👤' }, // User
  ];

  // Mock Data - Weekly Challenge
  const currentChallenge: WeeklyChallenge = {
    id: '1',
    title: 'راجع 100 بطاقة خلال الأسبوع',
    description: 'تحدّ جماعي لمراجعة 100 بطاقة قبل نهاية الأسبوع',
    progress: 67,
    target: 100,
    expiresIn: '3 أيام',
    participants: 1234,
    reward: { xp: 500, badge: 'Challenge Champion' }
  };

  // Mock Data - Shared Decks
  const mockDecks: SharedDeck[] = [
    { id: '1', title: 'Business English', author: 'Ahmed', cardCount: 150, downloads: 2450, rating: 4.7, category: 'عمل' },
    { id: '2', title: 'IELTS Vocabulary', author: 'Sara', cardCount: 200, downloads: 1890, rating: 4.9, category: 'اختبارات' },
    { id: '3', title: 'Daily Conversations', author: 'Omar', cardCount: 120, downloads: 1650, rating: 4.5, category: 'محادثة' },
    { id: '4', title: 'Medical Terms', author: 'Fatima', cardCount: 180, downloads: 1420, rating: 4.6, category: 'طب' },
    { id: '5', title: 'Travel Phrases', author: 'Mahmoud', cardCount: 90, downloads: 1200, rating: 4.8, category: 'سفر' },
    { id: '6', title: 'Tech Jargon', author: 'Nour', cardCount: 160, downloads: 980, rating: 4.4, category: 'تكنولوجيا' },
  ];

  const tabs = [
    { id: 'leaderboard', label: 'المتصدرون', icon: Trophy },
    { id: 'challenges', label: 'التحديات', icon: Target },
    { id: 'decks', label: 'البطاقات المشتركة', icon: Star },
  ];

  const dataState: Record<'leaderboard' | 'challenges' | 'decks', DataState> = {
    leaderboard: 'ready',
    challenges: 'ready',
    decks: 'ready'
  };

  const resolveState = (tab: keyof typeof dataState): DataState => {
    if (dataState[tab] !== 'ready') return dataState[tab];
    if (tab === 'leaderboard') return mockLeaderboard.length ? 'ready' : 'empty';
    if (tab === 'challenges') return currentChallenge ? 'ready' : 'empty';
    return mockDecks.length ? 'ready' : 'empty';
  };

  const leaderboardState = resolveState('leaderboard');
  const challengesState = resolveState('challenges');
  const decksState = resolveState('decks');

  const podiumStyles = [
    { accent: 'bg-amber-500/80', badge: 'bg-amber-500 text-white' },
    { accent: 'bg-slate-500/70', badge: 'bg-slate-700 text-white' },
    { accent: 'bg-orange-500/80', badge: 'bg-orange-500 text-white' }
  ];
  const leaderboardStateCard =
    leaderboardState === 'loading'
      ? <DataStateCard icon={Zap} title="???? ????? ?????????" description="????? ???? ??????? ?? ?????." loading />
      : leaderboardState === 'error'
        ? <DataStateCard icon={AlertTriangle} title="???? ????? ?????????" description="???? ?? ??????? ?? ???? ??? ????." actionLabel="????? ????????" onAction={() => {}} />
        : leaderboardState === 'empty'
          ? <DataStateCard icon={Users} title="?? ???? ?????? ???" description="???? ??? ?????? ????? ?? ???????." actionLabel="???? ??????" onAction={() => {}} />
          : null;

  const challengesStateCard =
    challengesState === 'loading'
      ? <DataStateCard icon={Zap} title="???? ????? ????????" description="????? ?? ???? ????????." loading />
      : challengesState === 'error'
        ? <DataStateCard icon={AlertTriangle} title="???? ????? ????????" description="???? ???????? ??????." actionLabel="????? ????????" onAction={() => {}} />
        : challengesState === 'empty'
          ? <DataStateCard icon={Target} title="?? ???? ?????? ??????" description="???? ?????? ????? ??????." actionLabel="??????" onAction={() => {}} />
          : null;

  const decksStateCard =
    decksState === 'loading'
      ? <DataStateCard icon={Zap} title="???? ????? ????????" description="????? ????? ???????? ????????." loading />
      : decksState === 'error'
        ? <DataStateCard icon={AlertTriangle} title="???? ????? ????????" description="???? ?? ??????? ?? ???? ??????." actionLabel="????? ????????" onAction={() => {}} />
        : decksState === 'empty'
          ? <DataStateCard icon={Star} title="?? ???? ??? ???" description="?? ??? ?? ????? ???? ?????." actionLabel="????? ????" onAction={() => {}} />
          : null;

  return (
    <div className="p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8 animate-slide-up pb-24 max-w-[1920px] mx-auto">

      {/* Header */}
      <div className="surface-card relative overflow-hidden rounded-[28px] p-8 md:p-12">
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-amber-500/80 to-orange-600/80"></div>

        <div className="relative z-10 flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-300 rounded-2xl flex items-center justify-center border border-amber-500/30">
                <Users size={28} />
              </div>
              <div>
                <h1 className="headline-xl text-gray-900 dark:text-white">مركز المجتمع</h1>
                <p className="body-lg text-gray-600 dark:text-gray-300 mt-1">تعلّم، تنافس، وشارك مع آلاف المتعلمين</p>
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30 text-xs font-bold">
                  <ShieldCheck size={14} />
                  ?????? ?????? ????????
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="surface-muted rounded-2xl p-4 text-center min-w-[110px]">
              <Users className="mx-auto mb-2" size={28} />
              <div className="text-2xl font-black text-gray-900 dark:text-white">12,450</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">متعلم نشط</div>
            </div>
            <div className="surface-muted rounded-2xl p-4 text-center min-w-[110px]">
              <Star className="mx-auto mb-2" size={28} />
              <div className="text-2xl font-black text-gray-900 dark:text-white">850</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">نقاطك</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-colors border ${activeTab === tab.id
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-transparent text-gray-600 dark:text-gray-300 border-stone-200 dark:border-gray-700 hover:bg-stone-50 dark:hover:bg-white/5'
                }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        leaderboardState !== 'ready' ? leaderboardStateCard : (
          <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="headline-md text-gray-900 dark:text-white">🏆 المتصدرون هذا الأسبوع</h2>
            <select className="surface-muted px-4 py-2 rounded-xl font-bold text-sm">
              <option>هذا الأسبوع</option>
              <option>هذا الشهر</option>
              <option>كل الأوقات</option>
            </select>
          </div>

                {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {mockLeaderboard.slice(0, 3).map((user, idx) => {
          const heights = ['md:h-80', 'md:h-72', 'md:h-64'];
          const style = podiumStyles[idx];

          return (
            <div
              key={user.rank}
              className={`surface-card relative rounded-[28px] p-6 border border-stone-200/80 dark:border-white/5 ${heights[idx]} flex flex-col items-center justify-between text-gray-900 dark:text-white`}
            >
              <div className={`absolute top-0 inset-x-6 h-1 rounded-b ${style.accent}`}></div>

              <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg z-10 ${style.badge}`}>
                {user.avatar}
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center flex-1 pt-8">
                <div className="text-5xl font-black mb-2">#{user.rank}</div>

                <div className="flex flex-col items-center gap-2 mb-4">
                  <h3 className="text-xl font-black text-center">{user.name}</h3>
                  {user.verified && (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                      <ShieldCheck size={14} />
                      ?????
                    </div>
                  )}
                </div>

                <div className="surface-muted px-6 py-3 rounded-2xl border border-stone-200/60 dark:border-white/5 mb-3">
                  <div className="flex items-center gap-2">
                    <Star size={20} className="text-amber-500" />
                    <span className="text-2xl font-black">{user.xp.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400 font-bold">XP</div>
                </div>

                <div className="surface-muted px-4 py-2 rounded-full flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  <span className="font-bold text-gray-700 dark:text-gray-200">{user.streak} USU^U.</span>
                </div>
              </div>

              <Trophy size={40} className="text-amber-500/30 absolute bottom-4 right-4" />
            </div>
          );
        })}
      </div>

      {/* Rest of Users - Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mockLeaderboard.slice(3).map((user) => {
              const isUser = user.name === 'أنت';

              return (
                <div
                  key={user.rank}
                  className={`surface-card p-5 rounded-[22px] border transition-colors ${isUser
                      ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/30'
                      : 'border-stone-200 dark:border-white/5 hover:border-amber-500/40'
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${isUser ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                      #{user.rank}
                    </div>

                    {/* Avatar */}
                    <div className="text-3xl">{user.avatar}</div>
                  </div>

                  {/* Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">{user.name}</h3>
                    {user.verified && <ShieldCheck size={14} className="text-emerald-500" />}
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Star size={14} className="text-amber-500" />
                        XP
                      </span>
                      <span className="font-black text-gray-900 dark:text-white">{user.xp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Flame size={14} className="text-orange-500" />
                        Streak
                      </span>
                      <span className="font-black text-gray-900 dark:text-white">{user.streak} يوم</span>
                    </div>
                  </div>

                  {/* User Badge */}
                  {isUser && (
                    <div className="mt-3 bg-amber-500/15 text-amber-700 dark:text-amber-200 text-xs font-black py-1.5 rounded-lg text-center uppercase tracking-wider border border-amber-500/30">
                      موقعك
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 font-bold">تتنافس مع أكثر من 12,000 متعلم! 🚀</p>
          </div>
        </div>
        )
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        challengesState !== 'ready' ? challengesStateCard : (
          <div className="space-y-6">
          <h2 className="headline-md text-gray-900 dark:text-white">🎯 التحدي الأسبوعي</h2>

          {/* Main Challenge Card */}
          <div className="surface-card relative overflow-hidden rounded-[28px] p-8 md:p-12">
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-amber-500/80 to-orange-600/80"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-200 border border-amber-500/30 font-bold">
                    <Calendar size={16} />
                    <span className="text-sm font-bold">باقي {currentChallenge.expiresIn}</span>
                  </div>
                  <h3 className="headline-lg text-gray-900 dark:text-white">{currentChallenge.title}</h3>
                  <p className="body-lg text-gray-600 dark:text-gray-300">{currentChallenge.description}</p>
                </div>
                <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-200 rounded-2xl flex items-center justify-center border border-amber-500/30">
                  <Target size={40} />
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>التقدم</span>
                  <span>{currentChallenge.progress} / {currentChallenge.target}</span>
                </div>
                <div className="h-3 bg-stone-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(currentChallenge.progress / currentChallenge.target) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center font-bold">
                  {Math.round((currentChallenge.progress / currentChallenge.target) * 100)}% مكتمل
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="surface-muted rounded-2xl p-4 text-center">
                  <Users size={24} className="mx-auto mb-2" />
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{currentChallenge.participants.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">مشارك</div>
                </div>
                <div className="surface-muted rounded-2xl p-4 text-center">
                  <Gift size={24} className="mx-auto mb-2" />
                  <div className="text-2xl font-black text-gray-900 dark:text-white">{currentChallenge.reward.xp} XP</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">مكافأة</div>
                </div>
              </div>

              {/* CTA */}
              <button className="btn-primary w-full text-lg">
                ابدأ المراجعة الآن
              </button>
            </div>
          </div>

          {/* Previous Challenges */}
          <div className="surface-card p-6 rounded-[24px] border border-stone-200/70 dark:border-white/5">
            <h3 className="headline-md text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award size={24} className="text-amber-500" />
              التحديات السابقة
            </h3>
            <div className="space-y-3">
              {['أكمل 50 درس', 'اقرأ 10 قصص', 'حافظ على سلسلة 14 يوم'].map((challenge, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 surface-muted rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="font-bold text-gray-700 dark:text-gray-300">{challenge}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-500">مكتمل ✓</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        )
      )}

      {/* Shared Decks Tab */}
      {activeTab === 'decks' && (
        decksState !== 'ready' ? decksStateCard : (
          <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="headline-md text-gray-900 dark:text-white">📦 بطاقات المجتمع</h2>
            <input
              type="text"
              placeholder="ابحث عن بطاقات..."
              className="surface-muted px-4 py-2 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDecks.map((deck) => (
              <div
                key={deck.id}
                className="surface-card p-6 rounded-[24px] border border-stone-200/70 dark:border-white/5 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-200 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
                      {deck.category}
                    </span>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{deck.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">by {deck.author}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/15 text-amber-600 dark:text-amber-200 border border-amber-500/30 rounded-2xl flex items-center justify-center">
                    <Star size={22} className="text-amber-600" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-bold">البطاقات</span>
                    <span className="font-black text-gray-900 dark:text-white">{deck.cardCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1">
                      <Download size={14} />
                      التحميلات
                    </span>
                    <span className="font-black text-gray-900 dark:text-white">{deck.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < Math.floor(deck.rating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                        fill={i < Math.floor(deck.rating) ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400 ml-1">({deck.rating})</span>
                  </div>
                </div>

                <button className="btn-secondary w-full flex items-center justify-center gap-2 border-amber-500/30 text-amber-700 dark:text-amber-200">
                  <Download size={18} />
                  تحميل المجموعة
                </button>
              </div>
            ))}
          </div>
        </div>
        )
      )}

    </div>
  );
};















