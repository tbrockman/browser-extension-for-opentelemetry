import { SeverityNumber } from "@opentelemetry/api-logs";
import { LoggerProvider } from "@opentelemetry/sdk-logs";
import { logPrefix } from "~utils/constants";


export const wrapConsoleWithLoggerProvider = (provider: LoggerProvider) => {
    const logger = provider.getLogger(logPrefix);
    const shutdown = provider.shutdown
    const original = console

    const targets = {
        debug: [SeverityNumber.DEBUG, 'debug'],
        log: [SeverityNumber.INFO, 'info'],
        info: [SeverityNumber.INFO, 'info'],
        warn: [SeverityNumber.WARN, 'warn'],
        error: [SeverityNumber.ERROR, 'error'],
        trace: [SeverityNumber.TRACE, 'trace'],
        // console.table + what to do with other console methods?
    }

    // Wrap console methods with logger
    const proxy = new Proxy(console, {
        get: function (target, prop, receiver) {

            if (prop in targets) {

                return function (...args) {
                    const [severityNumber, severityText] = targets[prop]
                    logger.emit({ severityNumber, severityText, body: JSON.stringify(args) });
                    target[prop].apply(target, args);
                };
            } else {
                return Reflect.get(target, prop, receiver);
            }
        }
    });

    // Replace the original console with the proxy
    console = proxy;

    // Clean-up if provider is unregistered
    provider.shutdown = async () => {
        window.console = original
        provider.shutdown = shutdown
        return await shutdown()
    }
}