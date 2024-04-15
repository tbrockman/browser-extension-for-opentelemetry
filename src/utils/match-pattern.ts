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

    const urlObj = new URL(url);
    // Match URL up to fragment identifier, ignoring any port
    let matchUrl = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname + urlObj.search;

    // Remove trailing slashes if the URL didn't originally contain them, since new URL() always adds them
    if (!url.endsWith('/') && matchUrl.endsWith('/')) {

        while (matchUrl.endsWith('/')) {
            matchUrl = matchUrl.slice(0, -1);
        }
    }

    if (!patternRegExp.test(matchUrl)) {
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

export {
    match
}