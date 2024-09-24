import { hasMixin } from "ts-mixer";
import { Configuration } from "./configuration";
import { describe } from "mocha";
import { assert } from "chai";
import { ContentScriptConfiguration } from "./content-script";
import { BackendConfiguration } from "./backend";

describe('Configuration', () => {

    const test = new Configuration()

    it('should be an instance of BackendConfiguration', () => {
        assert(hasMixin(test, BackendConfiguration))
    })

    it('should be an instance of ContentScriptConfiguration', () => {
        assert(hasMixin(test, ContentScriptConfiguration))
    })

    it('should have the properties and default values of BackendConfiguration and ContentScriptConfiguration', () => {
        const backendKeys = Object.keys(new BackendConfiguration())
        const csKeys = Object.keys(new ContentScriptConfiguration())

        assert.containsAllKeys(test, [...backendKeys, ...csKeys])

        backendKeys.forEach(key => {
            assert.deepEqual(test[key], new BackendConfiguration()[key])
        })

        csKeys.forEach(key => {
            assert.deepEqual(test[key], new ContentScriptConfiguration()[key])
        })
    })
})