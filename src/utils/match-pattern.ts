// Function to escape regular expression special characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to convert match pattern to regular expression
function patternToRegExp(pattern) {
    const escapedPattern = escapeRegExp(pattern);
    const wildcardEscaped = escapedPattern.replace(/\\\*/g, '.*');
    return new RegExp(`^${wildcardEscaped}$`);
}

// Check if a URL matches a pattern
function urlMatchesPattern(url, pattern) {
    if (pattern === '<all_urls>') {
        return true;
    }
    const patternRegExp = new RegExp(patternToRegExp(pattern));

    if (!patternRegExp.test(url)) {
        return false;
    }
    return true;
}

function match(url, patterns) {
    for (let pattern of patterns) {
        if (urlMatchesPattern(url, pattern)) {
            return true;
        }
    }
    return false;
}

// Example usage
const url = "https://mozilla.org/path/to/doc?foo=1";
const patterns = ["*://*.mozilla.org/*", "*://mozilla.org/path*", "*://mozilla.org/*?*"];
console.log(match(url, patterns)); // Output: true

// <all_urls> example
console.log(match(url, ["<all_urls>"])); // Output: true

export {
    match
}