import { assignPartial } from "~utils/generics";

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

export class ContentScriptConfiguration implements ContentScriptConfigurationType {
    enabled: boolean = true;
    tracingEnabled: boolean = true;
    loggingEnabled: boolean = true;
    // metricsEnabled: boolean = true;
    instrumentations: ("load" | "fetch" | "interaction")[] = [];
    propagateTo: string[] = [];
    events: (keyof HTMLElementEventMap)[] = [];
    concurrencyLimit: number = 50;
    // TODO: get rid of passing this to content script (parse proto in background script -> apply attributes to object -> re-encode)
    attributes = new Map([
        ['key', 'value']
    ]);

    constructor(params?: Partial<ContentScriptConfigurationType>) {
        assignPartial(this, params)
    }
}

export const defaultContentScriptConfiguration = new ContentScriptConfiguration();