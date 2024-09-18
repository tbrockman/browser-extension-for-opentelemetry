import { Base } from "~utils/generics"

export type BackendConfigurationType = {
    matchPatterns: string[]
    traceCollectorUrl: string
    logCollectorUrl: string
    // metricsEnabled: boolean
    // metricCollectorUrl: string
    attributes: Map<string, string>
    headers: Map<string, string>
}

export type MapOrRecord = Map<string, string> | Record<string, string>
export type BackendConfigurationProps = Partial<BackendConfigurationType & { headers: MapOrRecord, attributes: MapOrRecord }>

export class BackendConfiguration extends Base<BackendConfiguration> implements BackendConfigurationType {
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

    constructor({ headers, attributes, ...params }: BackendConfigurationProps = {}) {
        super(params);

        if (headers instanceof Map) {
            this.headers = headers;
        } else if (typeof headers == 'object') {
            this.headers = new Map(Object.entries(headers));
        }

        if (attributes instanceof Map) {
            this.attributes = attributes;
        } else if (typeof attributes == 'object') {
            this.attributes = new Map(Object.entries(attributes));
        }
    }
}

export const defaultBackendConfiguration = new BackendConfiguration();