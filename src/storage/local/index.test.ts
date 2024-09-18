import { hasMixin, Mixin } from "ts-mixer";
import { InternalStorage } from "./internal";
import { Configuration } from "./configuration";
import { describe } from "mocha";
import { assert } from "chai";
import type { LocalStorageType } from "~utils/options";

export class LocalStorageTest extends Mixin(Configuration, InternalStorage) {

}

const test = new LocalStorageTest({ configMode: 'code', enabled: true } as Partial<LocalStorageType>);
console.log('test')

describe('LocalStorage', () => {
    describe('LocalStorageTest', () => {
        it('should be an instance of Configuration', () => {
            assert(hasMixin(test, Configuration))
        })
        it('should be an instance of InternalStorage', () => {
            assert(hasMixin(test, InternalStorage))
        })
        it('should have the properties of Configuration and InternalStorage', () => {
            assert.containsAllKeys(test, ['configMode', 'enabled'])
        })
    })
})