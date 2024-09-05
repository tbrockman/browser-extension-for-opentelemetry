import { consoleProxy } from "./logging";

/**
 * Parses a string of key-value pairs separated by a single-character delimiter, where keys and values are separated by a single colon.
 * Allows quoting of keys and values using single or double quotes.
 * 
 * @param input - The input string to parse.
 * @param delimiter - The delimiter used to separate key-value pairs. Default is ','.
 * @returns A tuple containing a `Map<string, string>` of key-value pairs, and a configurable remainder string of either the last undelimited key-value pair or any remaining text.
 */
export const parseKeyValuePairs = (input: string, delimiter: string = ',', lastRemains: boolean = true): [Map<string, string>, string] => {
    const result: Map<string, string> = new Map();
    let remainder = '';
    let key = '';
    let value = '';
    let state = 'key';
    let quoteChar: string | null = null;
    let escapeNextChar = false;
    let insideQuotes = false;
    let afterColon = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (lastRemains) {
            remainder += char;
        }

        if (escapeNextChar) {

            if (state === 'key') {
                key += char;
            } else {
                value += char;
            }
            escapeNextChar = false;
            continue;
        }

        if (char === '\\') {
            escapeNextChar = true;
            continue;
        }

        switch (state) {
            case 'key':
                if (char === ':' && !insideQuotes) {
                    state = 'value';
                    afterColon = true;
                } else if (char === '"' || char === "'") {
                    if (key === '' && !insideQuotes) {
                        quoteChar = char;
                        insideQuotes = true; // Start a new quoted key
                    } else if (char === quoteChar) {
                        insideQuotes = false;
                    } else {
                        key += char; // Internal quotes within key
                    }
                } else {
                    key += char;
                }
                break;

            case 'value':
                if (afterColon) {
                    if (char === '"' || char === "'") {
                        quoteChar = char;
                        insideQuotes = true; // Start a new quoted value
                        afterColon = false; // Prevent quotes from being handled as part of value
                    } else {
                        insideQuotes = false; // No quote if not the first non-whitespace character after colon
                        afterColon = false;
                        value += char; // Handle as normal character
                    }
                } else if (insideQuotes) {
                    if (char === quoteChar) {
                        // Check for an escaped quote
                        if (input[i + 1] === quoteChar) {
                            value += char;
                            i++; // Skip the next quote
                        } else {
                            insideQuotes = false;
                        }
                    } else {
                        value += char;
                    }
                } else if (char === delimiter) {
                    if (!insideQuotes) {
                        result.set(key.trim(), value);
                        key = '';
                        value = '';
                        state = 'key';

                        if (lastRemains) {
                            remainder = ''; // Reset remainder
                        }
                        afterColon = false;
                    } else {
                        value += char;
                    }
                } else {
                    value += char;
                }
                break;
        }
    }

    // Final key-value pair handling

    if (!lastRemains) {
        if (state === 'key') {
            remainder = insideQuotes ? `${quoteChar}${key}` : key; // Include the open quote in remainder
        } else if (state === 'value') {
            if (insideQuotes) {
                remainder = `${key}:${quoteChar}${value}`; // Include the open quote in remainder
            } else {
                result.set(key.trim(), value);
            }
        }
    }
    return [result, remainder];
}

export const colonSeparatedStringsToMap = (strings: string[]): Map<string, string> => {
    const map = new Map<string, string>()
    strings.forEach((string) => {
        const [kvs, _] = parseKeyValuePairs(string, ',', false)
        consoleProxy.debug('parsed kvs', kvs, 'for string', string)

        kvs.forEach((value, key) => {
            map.set(key, value)
        })
    })
    consoleProxy.debug('converted strings to map', map)
    return map
}

export const mapToColonSeparatedStrings = (map: Map<string, string>): string[] => {
    const strings = []
    if (map) {
        map.forEach((value, key) => {
            strings.push(`${key}:${value}`)
        })
    }
    consoleProxy.debug('converted map to strings', strings, 'from map', map)
    return strings
}