const events = [
    "abort",
    "animationcancel",
    "animationend",
    "animationiteration",
    "animationstart",
    "auxclick",
    "blur",
    "cancel",
    "canplay",
    "canplaythrough",
    "change",
    "click",
    "close",
    "contextmenu",
    "copy",
    "cuechange",
    "cut",
    "dblclick",
    "drag",
    "dragend",
    "dragenter",
    "dragexit",
    "dragleave",
    "dragover",
    "dragstart",
    "drop",
    "durationchange",
    "emptied",
    "ended",
    "error",
    "focus",
    "focusin",
    "focusout",
    "fullscreenchange",
    "fullscreenerror",
    "gotpointercapture",
    "input",
    "invalid",
    "keydown",
    "keypress",
    "keyup",
    "load",
    "loadeddata",
    "loadedmetadata",
    "loadend",
    "loadstart",
    "lostpointercapture",
    "mousedown",
    "mouseenter",
    "mouseleave",
    "mousemove",
    "mouseout",
    "mouseover",
    "mouseup",
    "paste",
    "pause",
    "play",
    "playing",
    "pointercancel",
    "pointerdown",
    "pointerenter",
    "pointerleave",
    "pointermove",
    "pointerout",
    "pointerover",
    "pointerup",
    "progress",
    "ratechange",
    "reset",
    "resize",
    "scroll",
    "securitypolicyviolation",
    "seeked",
    "seeking",
    "select",
    "selectionchange",
    "selectstart",
    "stalled",
    "submit",
    "suspend",
    "timeupdate",
    "toggle",
    "touchcancel",
    "touchend",
    "touchmove",
    "touchstart",
    "transitioncancel",
    "transitionend",
    "transitionrun",
    "transitionstart",
    "volumechange",
    "waiting",
    "wheel"
]

const logPrefix = '[opentelemetry-browser-extension]'
const consoleProxy = new Proxy(console, {
    get(target, prop, receiver) {
        if (['log', 'debug', 'info', 'warn', 'error'].includes(prop as string)) {
            // Wrapping the original console method with a function that adds the prefix
            return function (...args) {
                // No-op our our logs in production
                // TODO: potentially make this configurable
                if (process.env.NODE_ENV === 'production' && ['log', 'debug', 'info'].includes(prop as string)) {
                    return
                }
                // Adding the prefix as the first argument
                args.unshift(logPrefix);
                // Calling the original console method with the modified arguments
                target[prop].apply(target, args);
            };
        } else {
            // For other console methods, return them as is
            return Reflect.get(target, prop, receiver);
        }
    }
});

const stringHeadersToObject = (headerString: string[]) => {
    const headers = {}

    if (headerString) {
        headerString.forEach((str: string) => {
            const index = str.indexOf(':')

            if (index === -1) {
                return
            }
            const key = str.substring(0, index)
            const value = str.substring(index + 1)
            headers[key] = value
        })
    }
    return headers
}

export {
    events,
    stringHeadersToObject,
    consoleProxy
}