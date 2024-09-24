import { getLocalStorage, setLocalStorage } from "~storage/local"
import { validatePatternPermissions } from "~utils/match-pattern"

const checkPatternPermissions = async () => {
    const { matchPatterns } = await getLocalStorage(['matchPatterns'])
    const matchPatternErrors = await validatePatternPermissions(matchPatterns)
    setLocalStorage({ matchPatternErrors })
}

chrome.permissions.onAdded.addListener(checkPatternPermissions)
chrome.permissions.onRemoved.addListener(checkPatternPermissions)