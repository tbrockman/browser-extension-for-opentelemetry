import { match } from "./match-pattern";

describe("match", () => {
    test("returns true if URL matches any pattern", () => {
        const url = "https://example.com";
        const patterns = ["https://example.com", "https://*.com"];

        const result = match(url, patterns);

        expect(result).toBe(true);
    });

    test("returns false if URL does not match any pattern", () => {
        const url = "https://example.com";
        const patterns = ["https://*.org", "http://*.com"];

        const result = match(url, patterns);

        expect(result).toBe(false);
    });

    test("returns false if patterns array is empty", () => {
        const url = "https://example.com";
        const patterns = [];

        const result = match(url, patterns);

        expect(result).toBe(false);
    });
});