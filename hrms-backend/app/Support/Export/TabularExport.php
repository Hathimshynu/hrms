<?php

namespace App\Support\Export;

use Carbon\Carbon;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

/**
 * Single shared writer for every server-side export (CSV and XLSX).
 *
 * Callers build the SAME filtered query their list endpoint uses (without
 * pagination) and pass it as a lazy iterable, so an export always contains
 * the whole filtered dataset, never just the visible page. No third-party
 * package is used: CSV is streamed, XLSX is a minimal OOXML zip.
 */
class TabularExport
{
    public const FORMATS = ['csv', 'xlsx'];

    /**
     * @param  array<int, string>  $headings
     * @param  iterable<array<int, scalar|null>>  $rows  rows already formatted for humans
     */
    public static function download(string $baseName, array $headings, iterable $rows, string $format = 'csv'): StreamedResponse|BinaryFileResponse
    {
        $format = in_array($format, self::FORMATS, true) ? $format : 'csv';
        $filename = $baseName.'.'.$format;

        return $format === 'xlsx'
            ? self::xlsx($filename, $headings, $rows)
            : self::csv($filename, $headings, $rows);
    }

    /** DD/MM/YYYY (Asia/Kolkata). Accepts date-only or datetime values. */
    public static function date(mixed $value): string
    {
        return $value ? Carbon::parse($value)->format('d/m/Y') : '';
    }

    /** h:mm AM/PM. */
    public static function time(mixed $value): string
    {
        return $value ? Carbon::parse($value)->format('g:i A') : '';
    }

    /** DD/MM/YYYY, h:mm AM/PM. */
    public static function dateTime(mixed $value): string
    {
        return $value ? Carbon::parse($value)->format('d/m/Y, g:i A') : '';
    }

    /**
     * Neutralise spreadsheet formula injection: text starting with a formula
     * trigger is prefixed so Excel/Sheets treats it as plain text.
     */
    public static function safe(mixed $value): mixed
    {
        if (! is_string($value) || $value === '') {
            return $value;
        }

        return in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true) ? "'".$value : $value;
    }

    private static function csv(string $filename, array $headings, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headings, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel detects the encoding
            fputcsv($out, $headings, ',', '"', '\\');

            foreach ($rows as $row) {
                fputcsv($out, array_map(fn ($v) => self::safe($v), $row), ',', '"', '\\');
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private static function xlsx(string $filename, array $headings, iterable $rows): BinaryFileResponse
    {
        $dir = sys_get_temp_dir();
        $sheetPath = tempnam($dir, 'xs');
        $zipPath = tempnam($dir, 'xz');

        $sheet = fopen($sheetPath, 'w');
        fwrite($sheet, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>');

        $n = 1;
        fwrite($sheet, self::xlsxRow($n++, $headings, true));

        foreach ($rows as $row) {
            fwrite($sheet, self::xlsxRow($n++, array_map(fn ($v) => self::safe($v), $row), false));
        }

        fwrite($sheet, '</sheetData></worksheet>');
        fclose($sheet);

        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::OVERWRITE | ZipArchive::CREATE);
        $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            .'</Types>');
        $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>');
        $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets></workbook>');
        $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
            .'</Relationships>');
        $zip->addFromString('xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            .'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
            .'<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>'
            .'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            .'<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>'
            .'</styleSheet>');
        $zip->addFile($sheetPath, 'xl/worksheets/sheet1.xml');
        $zip->close();
        @unlink($sheetPath);

        return response()->download($zipPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ])->deleteFileAfterSend(true);
    }

    /** @param array<int, scalar|null> $cells */
    private static function xlsxRow(int $row, array $cells, bool $header): string
    {
        $xml = '<row r="'.$row.'">';

        foreach (array_values($cells) as $i => $value) {
            $ref = self::column($i).$row;
            $style = $header ? ' s="1"' : '';

            if ($value === null || $value === '') {
                continue;
            }

            if (! $header && (is_int($value) || is_float($value))) {
                $xml .= '<c r="'.$ref.'"'.$style.'><v>'.$value.'</v></c>';
            } else {
                $text = htmlspecialchars(
                    preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', (string) $value) ?? '',
                    ENT_XML1 | ENT_QUOTES,
                    'UTF-8'
                );
                $xml .= '<c r="'.$ref.'" t="inlineStr"'.$style.'><is><t xml:space="preserve">'.$text.'</t></is></c>';
            }
        }

        return $xml.'</row>';
    }

    private static function column(int $index): string
    {
        $name = '';

        for ($i = $index + 1; $i > 0; $i = intdiv($i - 1, 26)) {
            $name = chr(65 + (($i - 1) % 26)).$name;
        }

        return $name;
    }
}
