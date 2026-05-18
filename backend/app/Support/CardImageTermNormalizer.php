<?php

namespace App\Support;

class CardImageTermNormalizer
{
    /**
     * @return list<string>
     */
    public static function variants(?string $value): array
    {
        $base = self::normalize($value);
        if ($base === '') {
            return [];
        }

        $variants = [$base];

        $withoutLeadingArabicArticle = preg_replace('/^ال/u', '', $base);
        if (is_string($withoutLeadingArabicArticle) && $withoutLeadingArabicArticle !== $base) {
            $variants[] = $withoutLeadingArabicArticle;
        }

        $withoutLeadingArticle = preg_replace('/^(der|die|das|ein|eine|the|a|an)\s+/u', '', $base);
        if (is_string($withoutLeadingArticle) && $withoutLeadingArticle !== $base) {
            $variants[] = $withoutLeadingArticle;
        }

        return array_values(array_unique(array_filter($variants)));
    }

    public static function normalize(?string $value): string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        $value = mb_strtolower($value, 'UTF-8');
        $value = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $value) ?? $value;

        $map = [
            'أ' => 'ا',
            'إ' => 'ا',
            'آ' => 'ا',
            'ٱ' => 'ا',
            'ة' => 'ه',
            'ى' => 'ي',
            'ؤ' => 'و',
            'ئ' => 'ي',
            'ß' => 'ss',
            'ä' => 'a',
            'ö' => 'o',
            'ü' => 'u',
        ];

        $value = strtr($value, $map);
        $value = preg_replace('/[^\p{L}\p{N}\s]+/u', ' ', $value) ?? $value;
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return trim($value);
    }
}
