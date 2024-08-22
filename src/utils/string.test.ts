import assert from 'assert';
import { parseKeyValuePairs } from './string';

describe("string", () => {

    describe("parseKeyValuePairs", () => {
        it('parses a string with a single key-value pair with no remainder', () => {
            const input = 'key:value';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = { key: 'value' };
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });

        it('parses a string with a single key-value pair with no remainder and preserves any internal whitespace', () => {
            const input = 'key:va    lue';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = { key: 'va    lue' };
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });

        it('parses a string with a single key-value pair with matched quotes', () => {
            const input = 'key:"value\'s"';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = { key: "value's" };
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });

        it('parses a string with a single key-value pair and quoted colons', () => {
            const input = '"key:abc":"value:def"';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = { "key:abc": "value:def" };
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });

        it('parses a string with a single key-value pair with value remainder (due to unmatched quotes)', () => {
            const input = 'key:"value\'s';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = {};
            const expectedRemainder = 'key:"value\'s';
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, expectedRemainder);
        });

        it('parses a string with key remainder and an unmatched quote', () => {
            const input = '"key:';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = {};
            const expectedRemainder = '"key:';
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, expectedRemainder);
        });

        it('parses a string with multiple key-value pairs with quoted and un-quoted commas', () => {
            const input = 'key:"val,ue\'s",another-key:val,ue:with:colons';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = { key: "val,ue's", 'another-key': 'val', ue: 'with:colons' };
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });

        it('parses a string with multiple key-value pairs with quoted and un-quoted commas and colons', () => {
            const input = '"key:,\'":"val,ue\'s",another-key:"val,ue:with:colons"';
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = { "key:,'": "val,ue's", 'another-key': "val,ue:with:colons" };
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });

        it('parses a complicated string with quotes and commas with no remainder', () => {
            const input = `unquoted-example:abc\\"def,   example-key:"not-necessarily-\\"quoted\\"-value",   another-key:'a-different-set-\\"of-quotes\\"',  tricky-case:"there'saquoteinside\\",andadelimiter",  incomplete-key:unfin'ished'`;
            const [parsedResult, remainder] = parseKeyValuePairs(input);
            const expected = {
                'unquoted-example': 'abc"def',
                'example-key': 'not-necessarily-"quoted"-value',
                'another-key': 'a-different-set-"of-quotes"',
                'tricky-case': `there'saquoteinside",andadelimiter`,
                'incomplete-key': "unfin'ished'"
            }
            assert.deepStrictEqual(parsedResult, expected);
            assert.strictEqual(remainder, '');
        });
    })
})