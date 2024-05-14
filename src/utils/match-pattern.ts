import { matchPattern, presets } from 'browser-extension-url-match'
import type { MatchPatternOptions } from 'browser-extension-url-match/dist/types';
import { consoleProxy } from '~util';
import type { MatchPatternError } from './options';

// TODO: potentially link to testing website somewhere: https://clearlylocal.github.io/browser-extension-url-match/

// this function assumes it's possible for us to end up in an inconsistent state,
// so our best effort is to remove permissions for removed patterns
// and request permissions for all currently valid patterns
type MatchPatternsChangedArgs = {
    prev: string[],
    next: string[],
    setErrors: (errors: MatchPatternError[]) => void,
}
const matchPatternsChanged = async ({ prev, next, setErrors }: MatchPatternsChangedArgs) => {
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

    let validPatterns = []
    let patternErrors: MatchPatternError[] = []

    // verify added patterns are valid
    for (const pattern of next) {
        const matcher = matchPattern(pattern, { ...presets.chrome });

        if (!matcher.valid) {
            patternErrors.push({
                pattern,
                error: matcher.error
            })
        } else {
            validPatterns.push(pattern)
        }
    }

    consoleProxy.debug('requesting permissions for patterns', validPatterns)

    try {
        // add permissions for added patterns
        const result = await chrome.permissions.request({
            origins: validPatterns
        });

        if (!result) {
            // find which patterns are currently missing permissions
            const contains = await Promise.all(validPatterns.map(async (pattern) => {
                let t = await chrome.permissions.contains({
                    origins: [pattern]
                })
                return [t, pattern]
            }))
            validPatterns = contains.filter(([t,]) => t).map(([, pat]) => pat)
            let errors = contains.filter(([t,]) => !t).map(([, pat]) => ({
                pattern: pat,
                error: new Error('permission missing')
            }))
            patternErrors = patternErrors.concat(errors)
        }
    } catch (e) {
        consoleProxy.error('error requesting or checking permissions', e)
    }

    consoleProxy.debug('match pattern errors', { patternErrors })

    setErrors(patternErrors)
}

function match(url: string, patterns: string[], options?: Partial<MatchPatternOptions>) {
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

export {
    match,
    matchPatternsChanged
}