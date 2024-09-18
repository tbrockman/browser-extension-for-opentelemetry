import { hasMixin } from "ts-mixer";
import { InternalStorage } from "./internal";
import { Configuration } from "./configuration";
import { describe } from "mocha";
import { assert } from "chai";
import { LocalStorage } from ".";

describe('LocalStorage', () => {

    const test = new LocalStorage()

    it('should be an instance of Configuration', () => {
        assert(hasMixin(test, Configuration))
    })

    it('should be an instance of InternalStorage', () => {
        assert(hasMixin(test, InternalStorage))
    })

    it('should have the properties and default values of Configuration and InternalStorage', () => {
        const configurationKeys = Object.keys(new Configuration())
        const internalStorageKeys = Object.keys(new InternalStorage())

        assert.containsAllKeys(test, [...configurationKeys, ...internalStorageKeys])

        configurationKeys.forEach(key => {
            assert.deepEqual(test[key], new Configuration()[key])
        })

        internalStorageKeys.forEach(key => {
            assert.deepEqual(test[key], new InternalStorage()[key])
        })
    })
})