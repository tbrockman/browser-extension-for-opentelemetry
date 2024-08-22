import assert from 'assert';
import { parseKeyValuePairs } from './string';

describe("string", () => {

    describe("parseKeyValuePairs", () => {

        describe('with lastRemains = true', () => {
            it('parses a string with a single key-value pair with no remainder', () => {
                const input = 'key:value';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([['key', 'value']]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });

            it('parses a string with a single key-value pair with no remainder and preserves any internal whitespace', () => {
                const input = 'key:va    lue';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([['key', 'va    lue']]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });

            it('parses a string with a single key-value pair with matched quotes', () => {
                const input = 'key:"value\'s"';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([['key', 'value\'s']]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });

            it('parses a string with a single key-value pair and quoted colons', () => {
                const input = '"key:abc":"value:def"';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([['key:abc', 'value:def']]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });

            it('parses a string with a single key-value pair with value remainder (due to unmatched quotes)', () => {
                const input = 'key:"value\'s';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map();
                const expectedRemainder = 'key:"value\'s';
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, expectedRemainder);
            });

            it('parses a string with key remainder and an unmatched quote', () => {
                const input = '"key:';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map();
                const expectedRemainder = '"key:';
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, expectedRemainder);
            });

            it('parses a string with multiple key-value pairs with quoted and un-quoted commas', () => {
                const input = 'key:"val,ue\'s",another-key:val,ue:with:colons';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([['key', 'val,ue\'s'], ['another-key', 'val'], ['ue', 'with:colons']]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });

            it('parses a string with multiple key-value pairs with quoted and un-quoted commas and colons', () => {
                const input = '"key:,\'":"val,ue\'s",another-key:"val,ue:with:colons"';
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([['key:,\'', 'val,ue\'s'], ['another-key', 'val,ue:with:colons']]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });

            it('parses a complicated string with quotes and commas with no remainder', () => {
                const input = `unquoted-example:abc\\"def,   example-key:"not-necessarily-\\"quoted\\"-value",   another-key:'a-different-set-\\"of-quotes\\"',  tricky-case:"there'saquoteinside\\",andadelimiter",  incomplete-key:unfin'ished'`;
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',', false);
                const expected = new Map([
                    ['unquoted-example', 'abc"def'],
                    ['example-key', 'not-necessarily-"quoted"-value'],
                    ['another-key', 'a-different-set-"of-quotes"'],
                    ['tricky-case', `there'saquoteinside",andadelimiter`],
                    ['incomplete-key', "unfin'ished'"]
                ]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, '');
            });
        });

        describe('with lastRemains = false (for UI entry)', () => {
            it('parses a complicated string with quotes and commas with last entry remaining', () => {
                const input = `unquoted-example:abc\\"def,   example-key:"not-necessarily-\\"quoted\\"-value",   another-key:'a-different-set-\\"of-quotes\\"',  tricky-case:"there'saquoteinside\\",andadelimiter",  incomplete-key:unfin'ished'`;
                const [parsedResult, remainder] = parseKeyValuePairs(input, ',');
                const expected = new Map([
                    ['unquoted-example', 'abc"def'],
                    ['example-key', 'not-necessarily-"quoted"-value'],
                    ['another-key', 'a-different-set-"of-quotes"'],
                    ['tricky-case', `there'saquoteinside",andadelimiter`]
                ]);
                assert.deepStrictEqual(parsedResult, expected);
                assert.strictEqual(remainder, "  incomplete-key:unfin'ished'");
            });
        })
    })
})