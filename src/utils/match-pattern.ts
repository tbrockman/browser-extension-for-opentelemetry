import { matchPattern, presets } from 'browser-extension-url-match'
import type { MatchPatternOptions } from 'browser-extension-url-match/dist/types';
import { consoleProxy } from '~utils/logging';
import type { MatchPatternError } from '~storage/local/internal';

// TODO: potentially link to testing website somewhere: https://clearlylocal.github.io/browser-extension-url-match/

type SyncMatchPatternPermissionsArgs = {
    prev: string[],
    next: string[],
}

export const validatePatternPermissions = async (patterns: string[]): Promise<MatchPatternError[]> => {
    // find which patterns are currently missing permissions
    const contains = await Promise.all(patterns.map(async (pattern) => {
        let t = await chrome.permissions.contains({
            origins: [pattern]
        })
        return [t, pattern]
    }))

    return contains.filter(([t,]) => !t).map(([, pat]) => ({
        pattern: pat,
        error: 'Permission missing or not granted'
    })) as MatchPatternError[]
}

export const validatePatterns = (patterns: string[]): [string[], MatchPatternError[]] => {
    let validPatterns: string[] = []
    let patternErrors: MatchPatternError[] = []

    // verify added patterns are valid
    for (const pattern of patterns) {
        const matcher = matchPattern(pattern, { ...presets.chrome });

        if (!matcher.valid) {
            patternErrors.push({
                pattern,
                error: matcher.error.message
            })
        } else {
            validPatterns.push(pattern)
        }
    }
    return [validPatterns, patternErrors]
}

export const syncMatchPatternPermissions = async ({ prev, next }: SyncMatchPatternPermissionsArgs) => {
    consoleProxy.debug('match patterns changed', { prev, next })

    const removed = prev.filter((x) => !next.includes(x))

    // remove permissions for removed patterns
    try {
        if (removed.length > 0) {
            consoleProxy.debug('removing permissions for origins', { removed })
            const result = await chrome.permissions.remove({
                origins: removed
            });
            consoleProxy.debug('removed permissions result', result)
        }
    } catch (e) {
        consoleProxy.error('error removing permissions', e)
    }

    let [validPatterns, _] = validatePatterns(next)

    consoleProxy.debug('requesting permissions for patterns', validPatterns)

    try {
        // add permissions for added patterns
        await chrome.permissions.request({
            origins: validPatterns
        });
    } catch (e) {
        consoleProxy.error('error requesting or checking permissions', e)
    }
}

export const match = (url: string, patterns: string[], options?: Partial<MatchPatternOptions>) => {
    for (let pattern of patterns) {
        const matcher = matchPattern(pattern, { ...presets.chrome, ...options });

        if (matcher.valid) {
            if (matcher.match(url)) {
                return true;
            }
        }
    }
    return false;
}
