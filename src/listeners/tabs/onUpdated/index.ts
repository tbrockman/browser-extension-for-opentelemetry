import { consoleProxy } from '~utils/logging'
import injectContentScript from 'inlinefunc:./content-script'
import injectRelay from 'inlinefunc:./message-relay'
import { getOptions } from '~utils/options'
import { match } from '~utils/match-pattern'
import { ser } from '~utils/serde'
import { uuidv7 } from 'uuidv7';
import { getLocalStorage } from '~storage/local'

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete") {

        // get user-specified match patterns or defaults
        const { matchPatterns } = await getLocalStorage(['matchPatterns'])
        // check whether current URL matches any patterns
        const matches = match(tab.url, matchPatterns)

        if (!matches) {
            consoleProxy.debug("no pattern match in onupdated listener, not injecting content script", tab.url, matchPatterns)
            return
        }

        consoleProxy.debug("injecting content script")
        const options = await getOptions()

        consoleProxy.debug("loaded options", options)
        const sessionId = uuidv7()

        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: injectRelay,
            args: [{
                sessionId
            }],
            injectImmediately: true,
            world: "ISOLATED"
        })

        await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            func: injectContentScript,
            args: [{
                sessionId,
                options: ser(options),
            }],
            injectImmediately: true,
            world: "MAIN"
        })
    }
})