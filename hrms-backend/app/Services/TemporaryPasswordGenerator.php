<?php

namespace App\Services;

class TemporaryPasswordGenerator
{
    private const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

    private const LOWER = 'abcdefghijkmnopqrstuvwxyz';

    private const DIGITS = '23456789';

    private const SYMBOLS = '@#$%&*!?';

    /**
     * Cryptographically random password that satisfies the application's
     * password policy (upper, lower, digit, symbol). Never persist or log it.
     */
    public static function generate(int $length = 16): string
    {
        $length = max($length, 12);
        $all = self::UPPER.self::LOWER.self::DIGITS.self::SYMBOLS;

        $characters = [
            self::pick(self::UPPER),
            self::pick(self::LOWER),
            self::pick(self::DIGITS),
            self::pick(self::SYMBOLS),
        ];

        while (count($characters) < $length) {
            $characters[] = self::pick($all);
        }

        for ($i = count($characters) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$characters[$i], $characters[$j]] = [$characters[$j], $characters[$i]];
        }

        return implode('', $characters);
    }

    private static function pick(string $set): string
    {
        return $set[random_int(0, strlen($set) - 1)];
    }
}
