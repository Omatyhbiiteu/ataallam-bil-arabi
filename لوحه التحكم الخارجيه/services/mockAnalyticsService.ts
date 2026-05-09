import { AnalyticsDashboardData, Story, Question, StoryPerformance, QuestionPerformance, RetentionMetric } from '../types';

export const mockAnalyticsService = {
    getDashboardData: (stories: Story[]): AnalyticsDashboardData => {
        return {
            overview: {
                totalStudents: 12450,
                activeNow: 843,
                completionRateAvg: 68,
                totalTimeSpent: 15430
            },
            topStories: generateStoryPerformance(stories),
            difficultQuestions: generateDifficultQuestions(stories),
            retention: generateRetentionData()
        };
    }
};

const generateStoryPerformance = (stories: Story[]): StoryPerformance[] => {
    if (!stories.length) return [];
    // Sort naturally by "popularity" (simulated)
    return stories.map(story => ({
        id: story.id,
        title: story.title,
        views: Math.floor(Math.random() * 5000) + 500,
        completions: Math.floor(Math.random() * 3000) + 100,
        completionRate: Math.floor(Math.random() * 40) + 50, // 50-90%
        avgTimeSpent: Math.floor(Math.random() * 10) + 2,
        likes: Math.floor(Math.random() * 1000) + 50
    })).sort((a, b) => b.views - a.views).slice(0, 5);
};

const generateDifficultQuestions = (stories: Story[]): QuestionPerformance[] => {
    const difficultQuestions: QuestionPerformance[] = [];

    stories.forEach(story => {
        if (story.questions) {
            story.questions.forEach(q => {
                // Simulate error rate
                const errorRate = Math.floor(Math.random() * 100);
                if (errorRate > 40) { // Only showing tricky ones
                    difficultQuestions.push({
                        id: q.id,
                        storyTitle: story.title,
                        questionText: q.text,
                        errorRate: errorRate,
                        attempts: Math.floor(Math.random() * 2000) + 100,
                        difficulty: errorRate > 70 ? 'Hard' : 'Medium'
                    });
                }
            });
        }
    });

    return difficultQuestions.sort((a, b) => b.errorRate - a.errorRate).slice(0, 5);
};

const generateRetentionData = (): RetentionMetric[] => {
    const data: RetentionMetric[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

        // Simulate trend
        const baseUsers = 5000 + (Math.random() * 1000);
        const active = Math.floor(baseUsers * (0.6 + (Math.random() * 0.1)));
        const retRate = 60 + Math.floor(Math.random() * 20);

        data.push({
            date: dateStr,
            activeUsers: active,
            newUsers: Math.floor(Math.random() * 500) + 100,
            returningUsers: Math.floor(active * 0.8),
            retentionRate: retRate
        });
    }
    return data;
};
