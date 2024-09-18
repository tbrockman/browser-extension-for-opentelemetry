import { Base } from "~utils/generics";

export type ContentScriptConfigurationType = {
    enabled: boolean;
    tracingEnabled: boolean;
    loggingEnabled: boolean;
    // metricsEnabled: boolean;
    instrumentations: ("load" | "fetch" | "interaction")[];
    propagateTo: string[];
    events: (keyof HTMLElementEventMap)[];
    concurrencyLimit: number;
    attributes: Map<string, string>
}

export class ContentScriptConfiguration extends Base<ContentScriptConfiguration> implements ContentScriptConfigurationType {
    enabled: boolean = true;
    tracingEnabled: boolean = true;
    loggingEnabled: boolean = true;
    // metricsEnabled: boolean = true;
    instrumentations: ("load" | "fetch" | "interaction")[] = [];
    propagateTo: string[] = [];
    events: (keyof HTMLElementEventMap)[] = [];
    concurrencyLimit: number = 50;
    attributes = new Map([
        ['key', 'value']
    ]);
}

export const defaultContentScriptConfiguration = new ContentScriptConfiguration();