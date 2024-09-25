import { consoleProxy } from "./logging";

export const assignPartial = <T extends object>(instance: T, params?: Partial<T>): void => {
    if (!params) {
        return;
    }

    Object.entries(params).forEach(([key, value]: [string, any]) => {
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

export const pick = <Data extends object, Keys extends keyof Data>(
    data: Data,
    keys: Keys[]
): Pick<Data, Keys> => {
    const result = {} as Pick<Data, Keys>;

    for (const key of keys) {

        if (Reflect.has(data, key)) {
            result[key] = data[key];
        }
    }
    return result;
}