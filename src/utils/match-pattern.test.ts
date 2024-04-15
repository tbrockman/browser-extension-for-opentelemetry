import { match } from "./index";
import assert from 'assert';

describe("match", () => {
    it("returns true if URL matches any pattern", () => {
        const url = "https://example.com";
        const patterns = ["https://example.com", "https://*.com"];

        const result = match(url, patterns);

        assert.equal(result, true);
    });

    it("returns true if URL matches <all_urls> pattern", () => {
        const url = "https://example.com";
        const patterns = ["<all_urls>"];

        const result = match(url, patterns);

        assert.equal(result, true);
    });

    it("returns true if the URL matches up to fragment identifier", () => {
        const url = "https://example.com/path#fragment";
        const patterns = ["https://example.com/path"];

        const result = match(url, patterns);

        assert.equal(result, true);
    });

    it("returns true if URL matches pattern without a port, even if URL contains a port", () => {
        const url = "https://example.com:8080/path/abc";
        const patterns = ["https://example.com/*"];

        const result = match(url, patterns);

        assert.equal(result, true);
    })

    it("returns true if less-greedy match URL matches pattern with wildcard", () => {
        const url = "https://example.com/path/abc?query=abc";
        const patterns = ["https://example.com/*abc"];

        const result = match(url, patterns);

        assert.equal(result, true);
    })

    it("returns true if URL matches wildcard pattern", () => {
        const url = "https://example.com/path/abc?query=abc";
        const patterns = ["https://*/*"];

        const result = match(url, patterns);

        assert.equal(result, true);
    })

    it("returns false if URL has trailing slash but pattern does not", () => {
        const url = "https://example.com/path/";
        const patterns = ["https://example.com/path"];

        const result = match(url, patterns);

        assert.equal(result, false);
    })

    it("returns false if the pattern specifies a port, even if the URL does (as match patterns ignore ports)", () => {
        const url = "https://example.com:8080/path";
        const patterns = ["https://example.com:8080"];

        const result = match(url, patterns);

        assert.equal(result, false);
    })

    it("returns false if URL does not match pattern completely with path", () => {
        const url = "https://example.com/path";
        const patterns = ["https://example.com"];

        const result = match(url, patterns);

        assert.equal(result, false);
    });

    it("returns false if URL does not match pattern completely with query", () => {
        const url = "https://example.com/path/abc?query=abc";
        const patterns = ["https://example.com/*/abc"];

        const result = match(url, patterns);

        assert.equal(result, false);
    });

    it("returns false if URL does not match any pattern", () => {
        const url = "https://example.com";
        const patterns = ["https://*.org", "http://*.com"];

        const result = match(url, patterns);

        assert.equal(result, false);
    });

    it("returns false if patterns array is empty", () => {
        const url = "https://example.com";
        const patterns = [];

        const result = match(url, patterns);

        assert.equal(result, false);
    });
});