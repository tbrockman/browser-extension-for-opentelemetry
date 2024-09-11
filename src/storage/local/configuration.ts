export type UserFacingConfigurationType = {
    enabled: boolean
    matchPatterns: string[]
    attributes: Record<string, string>
    headers: Record<string, string>
    propagateTo: string[]
    concurrencyLimit: number
    tracing: {
        enabled: boolean
        collectorUrl: string
        events: ConfigurationType["events"]
        instrumentations: ConfigurationType["instrumentations"]
    },
    logging: {
        enabled: boolean
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

    constructor(params: Partial<UserFacingConfigurationType>) {
        Object.entries(this).forEach(([key, value]) => {
            if (params.hasOwnProperty(key)) {
                this[key] = params[key];
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

// Settings available in LocalStorage which are exposed to the end user
export type ConfigurationType = {
    enabled: boolean
    tracingEnabled: boolean
    loggingEnabled: boolean
    // metricsEnabled: boolean
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    // metricCollectorUrl: string
    attributes: Map<string, string>
    headers: Map<string, string>
    concurrencyLimit: number
    events: (keyof HTMLElementEventMap)[]
    propagateTo: string[]
    instrumentations: ('fetch' | 'load' | 'interaction')[]
}

export type MapOrRecord = Map<string, string> | Record<string, string>
export type ConfigurationProps = Partial<ConfigurationType> & { headers?: MapOrRecord, attributes?: MapOrRecord }

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
        console.log('constructor being called at all ever?', headers, attributes, params)
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
                this[key] = params[key];
            }
        })
        console.log('after being constructed', this)
    }
}

export const defaultConfiguration = new Configuration();