import { setLocalStorage, type LocalStorage } from "~storage/local";
import { consoleProxy } from "~utils/logging";
import { validatePatternPermissions, validatePatterns } from "~utils/match-pattern";
import { de } from "~utils/serde";

/**
 * Updates matchPatternErrors when matchPatterns are changed. Permission syncing unfortunately needs to occur in the UI
 * due to permissions requests requiring a user interaction in order to be initiated, but we can keep this portion separate.
 */
chrome.storage.onChanged.addListener(async (event: Record<keyof LocalStorage, chrome.storage.StorageChange>, area) => {
    const { matchPatterns } = event

    if (matchPatterns) {
        consoleProxy.debug('matchPatterns changed', { matchPatterns })
        const deseralized = de<string[]>(matchPatterns.newValue) // TODO: should be possible to infer type of .newValue

        let [validPatterns, patternErrors] = validatePatterns(deseralized)
        patternErrors = patternErrors.concat(await validatePatternPermissions(validPatterns))

        consoleProxy.debug('matchPatterns validation results', { validPatterns, patternErrors })
        setLocalStorage({ matchPatternErrors: patternErrors })
    }
})