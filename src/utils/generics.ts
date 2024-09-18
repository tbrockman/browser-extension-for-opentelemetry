import { consoleProxy } from "./logging";

export class Base<T> {
    constructor(params?: Partial<T>) {
        params && Object.entries(params).forEach(([key, value]) => {
            if (this.hasOwnProperty(key)) {
                this[key] = value;
            } else {
                consoleProxy.warn(`Invalid value for ${key}: ${params[key]}`)
            }
        })
    }
}