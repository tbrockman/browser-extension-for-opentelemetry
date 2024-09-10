export const replacer = (key, value) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    }
    return value;
}

export const reviver = (key, value) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

export const ser = <T>(value: T, pretty: boolean = false): string => {
    return JSON.stringify(value, replacer, pretty ? 2 : undefined);
}

export const de = <T>(value: string, constructor?: new (args: Partial<T>) => T): T => {
    let deserialized = JSON.parse(value, reviver);
    return constructor ? new constructor(deserialized) : deserialized;
}