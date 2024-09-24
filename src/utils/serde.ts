const userFacingReplacer = (key, value) => {
    if (value instanceof Map) {
        const object = {};
        for (let [k, v] of value) {
            object[k] = v;
        }
        return object;
    }
    return value;
}

export const replacer = (key, value) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    }
    return value;
}

export const reviver = (_, value) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

export const ser = <T>(value: T, userFacing: boolean = false): string => {
    if (userFacing) {
        return JSON.stringify(value, userFacingReplacer, 2);
    }
    return JSON.stringify(value, replacer);
}

export const de = <T>(value: string, constructor?: new (args: Partial<T>) => T): T => {
    let deserialized = JSON.parse(value, reviver);
    return constructor ? new constructor(deserialized) : deserialized;
}