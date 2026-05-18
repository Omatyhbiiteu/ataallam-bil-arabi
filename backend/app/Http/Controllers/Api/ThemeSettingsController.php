<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use App\Models\ThemeSetting;
use Illuminate\Http\Request;

class ThemeSettingsController extends Controller
{
    private const THEMES = [
        'standard',
        'ramadan',
        'eid_fitr',
        'eid_adha',
        'victory_october',
        'winter',
        'summer',
        'school',
        'custom',
    ];

    private const EFFECTS = [
        'stars',
        'confetti',
        'snow',
        'fireworks',
        'bubbles',
        'petals',
        'lightning',
        'leaves',
        'none',
    ];

    private function defaultSettings(): array
    {
        return [
            'selectedTheme' => 'standard',
            'isAutoTheme' => false,
            'isDarkMode' => false,
            'themeSchedules' => [],
            'customThemeConfig' => [
                'id' => 'custom_default',
                'name' => 'Custom',
                'primary' => '#7c3aed',
                'secondary' => '#db2777',
                'accent' => '#f59e0b',
                'effect' => 'none',
            ],
        ];
    }

    private function getOrCreate(): ThemeSetting
    {
        $row = ThemeSetting::query()->first();
        if ($row) {
            return $row;
        }

        return ThemeSetting::query()->create([
            'payload' => $this->defaultSettings(),
        ]);
    }

    private function normalizeSettings(?array $payload): array
    {
        $defaults = $this->defaultSettings();
        $payload = is_array($payload) ? $payload : [];

        $selectedTheme = in_array($payload['selectedTheme'] ?? null, self::THEMES, true)
            ? $payload['selectedTheme']
            : $defaults['selectedTheme'];

        $schedules = [];
        foreach (($payload['themeSchedules'] ?? []) as $schedule) {
            if (! is_array($schedule)) {
                continue;
            }

            $theme = $schedule['theme'] ?? null;
            if (! in_array($theme, self::THEMES, true)) {
                continue;
            }

            $schedules[] = [
                'id' => (string) ($schedule['id'] ?? uniqid('schedule_', true)),
                'theme' => $theme,
                'startDate' => (string) ($schedule['startDate'] ?? date('Y-m-d')),
                'endDate' => (string) ($schedule['endDate'] ?? date('Y-m-d')),
                'isActive' => (bool) ($schedule['isActive'] ?? true),
            ];
        }

        $custom = is_array($payload['customThemeConfig'] ?? null)
            ? $payload['customThemeConfig']
            : [];

        $effect = $custom['effect'] ?? $defaults['customThemeConfig']['effect'];
        if (! in_array($effect, self::EFFECTS, true)) {
            $effect = 'none';
        }

        return [
            'selectedTheme' => $selectedTheme,
            'isAutoTheme' => (bool) ($payload['isAutoTheme'] ?? $defaults['isAutoTheme']),
            'isDarkMode' => (bool) ($payload['isDarkMode'] ?? $defaults['isDarkMode']),
            'themeSchedules' => array_slice($schedules, 0, 50),
            'customThemeConfig' => [
                'id' => (string) ($custom['id'] ?? $defaults['customThemeConfig']['id']),
                'name' => (string) ($custom['name'] ?? $defaults['customThemeConfig']['name']),
                'primary' => (string) ($custom['primary'] ?? $defaults['customThemeConfig']['primary']),
                'secondary' => (string) ($custom['secondary'] ?? $defaults['customThemeConfig']['secondary']),
                'accent' => (string) ($custom['accent'] ?? $defaults['customThemeConfig']['accent']),
                'effect' => $effect,
                'icon' => isset($custom['icon']) ? (string) $custom['icon'] : null,
                'soundUrl' => isset($custom['soundUrl']) ? (string) $custom['soundUrl'] : null,
            ],
        ];
    }

    public function public()
    {
        $row = $this->getOrCreate();

        return response()->json([
            'settings' => $this->normalizeSettings($row->payload),
        ]);
    }

    public function adminShow(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        return $this->public();
    }

    public function adminUpdate(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.selectedTheme' => ['required', 'string', 'in:'.implode(',', self::THEMES)],
            'settings.isAutoTheme' => ['sometimes', 'boolean'],
            'settings.isDarkMode' => ['sometimes', 'boolean'],
            'settings.themeSchedules' => ['sometimes', 'array', 'max:50'],
            'settings.themeSchedules.*.id' => ['required', 'string', 'max:120'],
            'settings.themeSchedules.*.theme' => ['required', 'string', 'in:'.implode(',', self::THEMES)],
            'settings.themeSchedules.*.startDate' => ['required', 'date_format:Y-m-d'],
            'settings.themeSchedules.*.endDate' => ['required', 'date_format:Y-m-d'],
            'settings.themeSchedules.*.isActive' => ['required', 'boolean'],
            'settings.customThemeConfig' => ['required', 'array'],
            'settings.customThemeConfig.id' => ['required', 'string', 'max:120'],
            'settings.customThemeConfig.name' => ['required', 'string', 'max:80'],
            'settings.customThemeConfig.primary' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.customThemeConfig.secondary' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.customThemeConfig.accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'settings.customThemeConfig.effect' => ['nullable', 'string', 'in:'.implode(',', self::EFFECTS)],
            'settings.customThemeConfig.icon' => ['nullable', 'string', 'max:2048'],
            'settings.customThemeConfig.soundUrl' => ['nullable', 'string', 'max:2048'],
        ]);

        $settings = $this->normalizeSettings($data['settings']);
        $encoded = json_encode($settings);
        if ($encoded === false || strlen($encoded) > 128_000) {
            return response()->json(['message' => 'Theme settings are too large'], 422);
        }

        $row = $this->getOrCreate();
        $row->update(['payload' => $settings]);

        return response()->json([
            'ok' => true,
            'settings' => $this->normalizeSettings($row->fresh()->payload),
        ]);
    }

    public function adminSchedules(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $settings = $this->normalizeSettings($this->getOrCreate()->payload);

        return response()->json([
            'schedules' => $settings['themeSchedules'],
            'themeSchedules' => $settings['themeSchedules'],
        ]);
    }

    public function adminUpdateSchedule(Request $request, string $id)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $data = $request->validate([
            'theme' => ['required', 'string', 'in:'.implode(',', self::THEMES)],
            'startDate' => ['required', 'date_format:Y-m-d'],
            'endDate' => ['required', 'date_format:Y-m-d'],
            'isActive' => ['required', 'boolean'],
        ]);

        $row = $this->getOrCreate();
        $settings = $this->normalizeSettings($row->payload);
        $updated = false;

        $settings['themeSchedules'] = array_map(function ($schedule) use ($id, $data, &$updated) {
            if (($schedule['id'] ?? null) !== $id) {
                return $schedule;
            }
            $updated = true;

            return array_merge($schedule, $data, ['id' => $id]);
        }, $settings['themeSchedules']);

        if (! $updated) {
            $settings['themeSchedules'][] = array_merge($data, ['id' => $id]);
        }

        $row->update(['payload' => $settings]);

        return response()->json([
            'ok' => true,
            'settings' => $this->normalizeSettings($row->fresh()->payload),
        ]);
    }

    public function adminCustom(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $settings = $this->normalizeSettings($this->getOrCreate()->payload);

        return response()->json([
            'customTheme' => $settings['customThemeConfig'],
            'customThemeConfig' => $settings['customThemeConfig'],
        ]);
    }

    public function adminUpdateCustom(Request $request)
    {
        if (! $request->user() instanceof AdminUser) {
            abort(403);
        }

        $settings = $this->normalizeSettings($this->getOrCreate()->payload);
        $payload = $request->input('customThemeConfig', $request->all());
        $settings['customThemeConfig'] = is_array($payload)
            ? $this->normalizeSettings(['customThemeConfig' => $payload])['customThemeConfig']
            : $settings['customThemeConfig'];
        $settings['selectedTheme'] = 'custom';

        $row = $this->getOrCreate();
        $row->update(['payload' => $settings]);

        return response()->json([
            'ok' => true,
            'settings' => $this->normalizeSettings($row->fresh()->payload),
        ]);
    }
}
