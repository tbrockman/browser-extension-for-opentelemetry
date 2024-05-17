export const replacer = (key, value) => {
    if (value instanceof Map) {
        return {
            dataType: 'Map',
            value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}

export const reviver = (key, value) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
            return new Map(value.value);
        }
    }
    return value;
}

export const serializer = <T>(value: T): string => {
    return JSON.stringify(value, replacer);
}

export const deserializer = <T>(value: string): T => {
    return JSON.parse(value, reviver);
}