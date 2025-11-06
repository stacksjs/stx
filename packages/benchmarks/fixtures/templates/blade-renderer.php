<?php
/**
 * Minimal Blade-like template renderer for benchmarking
 * This simulates Laravel Blade's core functionality without the full framework
 */

function renderBlade($templatePath, $data) {
    $template = file_get_contents($templatePath);

    // Extract variables
    extract($data);

    // Process @foreach directives
    $template = preg_replace_callback(
        '/@foreach\s*\(\s*\$(\w+)\s+as\s+\$(\w+)\s*\)(.*?)@endforeach/s',
        function($matches) use ($data) {
            $arrayName = $matches[1];
            $itemName = $matches[2];
            $content = $matches[3];

            if (!isset($data[$arrayName]) || !is_array($data[$arrayName])) {
                return '';
            }

            $output = '';
            foreach ($data[$arrayName] as $item) {
                $itemContent = $content;
                // Replace $item['key'] with values
                $itemContent = preg_replace_callback(
                    '/\{\{\s*\$' . $itemName . '\[\'(\w+)\'\]\s*\}\}/',
                    function($m) use ($item) {
                        return isset($item[$m[1]]) ? htmlspecialchars($item[$m[1]]) : '';
                    },
                    $itemContent
                );

                // Handle nested @if within loop
                $itemContent = preg_replace_callback(
                    '/@if\s*\(\s*\$' . $itemName . '\[\'(\w+)\'\]\s*\)(.*?)@else(.*?)@endif/s',
                    function($m) use ($item) {
                        $key = $m[1];
                        return isset($item[$key]) && $item[$key] ? $m[2] : $m[3];
                    },
                    $itemContent
                );

                $itemContent = preg_replace_callback(
                    '/@if\s*\(\s*\$' . $itemName . '\[\'(\w+)\'\]\s*\)(.*?)@endif/s',
                    function($m) use ($item) {
                        $key = $m[1];
                        return isset($item[$key]) && $item[$key] ? $m[2] : '';
                    },
                    $itemContent
                );

                $output .= $itemContent;
            }

            return $output;
        },
        $template
    );

    // Process @if/@else/@endif directives
    $template = preg_replace_callback(
        '/@if\s*\(\s*\$(\w+)(?:\[\'(\w+)\'\])?\s*\)(.*?)(?:@else(.*?))?@endif/s',
        function($matches) use ($data) {
            $varName = $matches[1];
            $key = $matches[2] ?? null;
            $ifContent = $matches[3];
            $elseContent = $matches[4] ?? '';

            $value = $key && isset($data[$varName][$key])
                ? $data[$varName][$key]
                : ($data[$varName] ?? false);

            return $value ? $ifContent : $elseContent;
        },
        $template
    );

    // Process {{ $variable }} expressions
    $template = preg_replace_callback(
        '/\{\{\s*\$(\w+)(?:\[\'(\w+)\'\])?\s*\}\}/',
        function($matches) use ($data) {
            $varName = $matches[1];
            $key = $matches[2] ?? null;

            if ($key && isset($data[$varName][$key])) {
                return htmlspecialchars($data[$varName][$key]);
            } elseif (isset($data[$varName])) {
                return htmlspecialchars($data[$varName]);
            }

            return '';
        },
        $template
    );

    return $template;
}
