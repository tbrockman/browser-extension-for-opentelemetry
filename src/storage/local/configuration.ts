/**
 * @title Configuration
 * @description User-facing settings for the extension
 */
export type UserFacingConfigurationType = {
    /**
     * @description Whether the extension is enabled.
     */
    enabled: boolean
    /**
     * @description List of [match patterns](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns) for which the extension should be enabled.
     * @example ["http://localhost/*", "https://*.example.com/*"]
     */
    matchPatterns: string[]
    /**
     * @description [Attributes](https://opentelemetry.io/docs/specs/semconv/general/attributes/) to be added to all traces.
     * @example { "key": "value" }
     */
    attributes: Record<string, string>
    /**
     * @description HTTP headers to be added to requests when exporting collected telemetry.
     * @example { "x-example-header": "value" }
     */
    headers: Record<string, string>
    /**
     * @description List of regular expressions to match against outbound request URLs for which trace context should be forwarded.
     * @example ["https://example.com/.*"]
     */
    propagateTo: string[]
    /**
     * @description Maximum number of concurrent requests that can be queued for export.
     * @example 50
     */
    concurrencyLimit: number
    /**
     * @description Configuration for trace telemetry.
     */
    tracing: {
        /**
         * @description Whether tracing is enabled.
         */
        enabled: boolean
        /**
         * @description URL to which traces should be exported. Must accept Protobuf-encoded OTLP traces over HTTP.
         * @example "http://localhost:4318/v1/traces"
         */
        collectorUrl: string
        /**
         * @description List of [browser events](https://azuresdkdocs.blob.core.windows.net/$web/javascript/azure-app-configuration/1.1.0/interfaces/htmlelementeventmap.html) to track (if 'interaction' instrumentation is enabled).
         * @example ["submit", "click", "keypress"]
         */
        events: ConfigurationType["events"]
        /**
         * @description List of automatic instrumentations to enable.
         */
        instrumentations: ConfigurationType["instrumentations"]
    },
    /**
     * @description Configuration for logging telemetry.
     */
    logging: {
        /**
         * @description Whether logging is enabled.
         */
        enabled: boolean
        /**
         * @description URL to which logs should be exported. Must accept Protobuf-encoded OTLP logs over HTTP.
         * @example "http://localhost:4318/v1/logs"
         */
        collectorUrl: string
    },
    // TODO: implement
    // metrics: {
    //     enabled: boolean
    //     collectorUrl: string
    // }
}

export class UserFacingConfiguration implements UserFacingConfigurationType {
    enabled: boolean = defaultConfiguration.enabled
    matchPatterns: string[] = defaultConfiguration.matchPatterns
    attributes: Record<string, string> = Object.fromEntries(defaultConfiguration.attributes.entries())
    headers: Record<string, string> = Object.fromEntries(defaultConfiguration.headers.entries())
    propagateTo: string[] = defaultConfiguration.propagateTo
    concurrencyLimit: number = defaultConfiguration.concurrencyLimit
    tracing: {
        enabled: boolean;
        collectorUrl: string;
        events: ConfigurationType["events"];
        instrumentations: ConfigurationType["instrumentations"]
    } = {
            enabled: defaultConfiguration.tracingEnabled,
            collectorUrl: defaultConfiguration.traceCollectorUrl,
            events: defaultConfiguration.events,
            instrumentations: defaultConfiguration.instrumentations
        }
    logging: {
        enabled: boolean;
        collectorUrl: string
    } = {
            enabled: defaultConfiguration.loggingEnabled,
            collectorUrl: defaultConfiguration.logCollectorUrl
        }

    constructor(params: Partial<UserFacingConfigurationType> = {}) {
        Object.entries(this).forEach(([key, value]) => {
            if (params.hasOwnProperty(key)) {

                if (params[key].constructor == this[key].constructor) {
                    this[key] = params[key];
                } else {
                    throw new Error(`Invalid value for ${key}: ${params[key]}`)
                }
            }
        })
    }

    static from(stored: ConfigurationType): UserFacingConfiguration {
        return new UserFacingConfiguration({
            enabled: stored.enabled,
            matchPatterns: stored.matchPatterns,
            attributes: Object.fromEntries(stored.attributes.entries()),
            headers: Object.fromEntries(stored.headers.entries()),
            propagateTo: stored.propagateTo,
            concurrencyLimit: stored.concurrencyLimit,
            tracing: {
                enabled: stored.tracingEnabled,
                collectorUrl: stored.traceCollectorUrl,
                events: stored.events,
                instrumentations: stored.instrumentations
            },
            logging: {
                enabled: stored.loggingEnabled,
                collectorUrl: stored.logCollectorUrl
            }
        })
    }

    serialize(): ConfigurationType {
        return {
            enabled: this.enabled,
            matchPatterns: this.matchPatterns,
            attributes: new Map(Object.entries(this.attributes)),
            headers: new Map(Object.entries(this.headers)),
            propagateTo: this.propagateTo,
            concurrencyLimit: this.concurrencyLimit,
            tracingEnabled: this.tracing.enabled,
            traceCollectorUrl: this.tracing.collectorUrl,
            events: this.tracing.events,
            instrumentations: this.tracing.instrumentations,
            loggingEnabled: this.logging.enabled,
            logCollectorUrl: this.logging.collectorUrl
        }
    }
}

// Settings stored in LocalStorage which are exposed to the end user through UserFacingConfiguration
export type ConfigurationType = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    // metricsEnabled: boolean
    // metricCollectorUrl: string
    attributes: Map<string, string>
    headers: Map<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
}

export type MapOrRecord = Map<string, string> | Record<string, string>
export type ConfigurationProps = Partial<ConfigurationType & { headers: MapOrRecord, attributes: MapOrRecord }>

export class Configuration implements ConfigurationType {
    enabled = true;
    tracingEnabled = true;
    loggingEnabled = true;
    metricsEnabled = true;
    matchPatterns = ['http://localhost/*'];
    traceCollectorUrl = 'http://localhost:4318/v1/traces';
    logCollectorUrl = 'http://localhost:4318/v1/logs';
    metricCollectorUrl = 'http://localhost:4318/v1/metrics';
    headers = new Map([
        ['x-example-header', 'value']
    ]);
    attributes = new Map([
        ['key', 'value']
    ]);
    concurrencyLimit = 50;
    events = ['submit', 'click', 'keypress', 'resize', 'contextmenu', 'drag', 'cut', 'copy', 'input', 'pointerdown', 'pointerenter', 'pointerleave'] as (keyof HTMLElementEventMap)[];
    propagateTo = [];
    instrumentations = ['fetch', 'load', 'interaction'] as ("load" | "fetch" | "interaction")[];

    constructor({ headers, attributes, ...params }: ConfigurationProps = {}) {
        if (headers instanceof Map) {
            this.headers = headers;
        } else if (typeof headers == 'object') {
            this.headers = new Map(Object.entries(headers));
        }

        if (attributes instanceof Map) {
            this.attributes = attributes;
        } else if (typeof this.attributes == 'object') {
            this.attributes = new Map(Object.entries(this.attributes));
        }

        Object.entries(this).forEach(([key, value]) => {

            if (params.hasOwnProperty(key)) {
                if (params[key].constructor == this[key].constructor) {
                    this[key] = params[key];
                } else {
                    throw new Error(`Invalid value for ${key}: ${params[key]}`)
                }
            }
        })
    }
}

export const defaultConfiguration = new Configuration();