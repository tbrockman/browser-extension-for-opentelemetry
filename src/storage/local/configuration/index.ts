import { defaultBackendConfiguration } from "./backend"
import { defaultContentScriptConfiguration, type ContentScriptConfigurationType } from "./content-script"
import type { ConfigurationType } from "./configuration"
import { assignPartial } from "~utils/generics";

export { Configuration, defaultConfiguration } from "./configuration";
export type { ConfigurationType } from "./configuration";

export { BackendConfiguration } from "./backend";
export type { BackendConfigurationType } from "./backend";

export { ContentScriptConfiguration } from "./content-script";
export type { ContentScriptConfigurationType } from "./content-script";

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

    tracing: UserFacingTracingConfigurationType,
    logging: UserFacingLoggingConfigurationType,
    // TODO: implement
    // metrics: {
    //     enabled: boolean
    //     collectorUrl: string
    // }
}

/**
 * @description Configuration for trace telemetry.
 */
export type UserFacingTracingConfigurationType = {
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
    events: ContentScriptConfigurationType["events"]
    /**
     * @description List of automatic instrumentations to enable.
     */
    instrumentations: ContentScriptConfigurationType["instrumentations"]
}

/**
 * @description Configuration for logging telemetry.
 */
export type UserFacingLoggingConfigurationType = {
    /**
     * @description Whether logging is enabled.
     */
    enabled: boolean
    /**
     * @description URL to which logs should be exported. Must accept Protobuf-encoded OTLP logs over HTTP.
     * @example "http://localhost:4318/v1/logs"
     */
    collectorUrl: string
}

export class UserFacingConfiguration implements UserFacingConfigurationType {
    enabled = defaultContentScriptConfiguration.enabled
    matchPatterns = defaultBackendConfiguration.matchPatterns
    attributes: Record<string, string> = Object.fromEntries(defaultBackendConfiguration.attributes.entries())
    headers: Record<string, string> = Object.fromEntries(defaultBackendConfiguration.headers.entries())
    propagateTo = defaultContentScriptConfiguration.propagateTo
    concurrencyLimit = defaultContentScriptConfiguration.concurrencyLimit
    tracing = {
        enabled: defaultContentScriptConfiguration.tracingEnabled,
        collectorUrl: defaultBackendConfiguration.traceCollectorUrl,
        events: defaultContentScriptConfiguration.events,
        instrumentations: defaultContentScriptConfiguration.instrumentations
    }
    logging = {
        enabled: defaultContentScriptConfiguration.loggingEnabled,
        collectorUrl: defaultBackendConfiguration.logCollectorUrl
    }

    constructor(params?: Partial<UserFacingConfigurationType>) {
        assignPartial(this, params)
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

    serializable(): ConfigurationType {
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

export const defaultUserFacingConfiguration = new UserFacingConfiguration()