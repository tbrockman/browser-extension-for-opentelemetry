import { consoleProxy } from "./logging";

export const assignPartial = <T extends object>(instance: T, params?: Partial<T>): void => {
    if (!params) {
        return;
    }

    Object.entries(params).forEach(([key, value]) => {
        // Check if the key exists on the instance
        if (Reflect.has(instance, key)) {

            if (value.constructor == instance[key].constructor) {
                instance[key] = value;
            } else {
                consoleProxy.warn(`Invalid constructor for ${key}: ${value} (have: ${value.constructor}, expected: ${instance[key].constructor})`);
            }
        } else {
            consoleProxy.warn(`Invalid key: ${key}, expected one of: ${Object.keys(instance)}`);
        }
    });
}
