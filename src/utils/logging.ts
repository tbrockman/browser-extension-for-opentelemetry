import { logPrefix } from "./constants";

export const consoleProxy = new Proxy(console, {
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
