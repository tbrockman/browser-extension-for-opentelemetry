import md from "markdown-it";
import type { FoundCursorData } from "codemirror-json-schema/dist/features/hover";
import { parser } from "@lezer/json"
import { HighlightStyle } from "@codemirror/language"
import { highlightCode, Tag, tags } from "@lezer/highlight"

const renderer = md({
    linkify: true,
    typographer: true,
});

var defaultRender = renderer.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

renderer.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // Add a new `target` attribute, or replace the value of the existing one.
    tokens[idx].attrSet('target', '_blank');

    // Pass the token to the default renderer.
    return defaultRender(tokens, idx, options, env, self);
};

export const renderExample = (jsonExample: any, highlighter: HighlightStyle) => {
    let result = document.createElement("pre")

    function emit(text, classes) {
        let node = document.createTextNode(text)
        if (classes) {
            let span = document.createElement("span")
            span.appendChild(node)
            span.className = classes
            // @ts-ignore
            node = span
        }
        result.appendChild(node)
    }

    function emitBreak() {
        result.appendChild(document.createTextNode("\n"))
    }

    highlightCode(jsonExample, parser.parse(jsonExample), highlighter,
        emit, emitBreak)
    return result
}

export const formatHover = (highlighter: HighlightStyle): (data: FoundCursorData) => HTMLElement => {

    return (data: FoundCursorData) => {
        const { schema, pointer } = data;
        const key = pointer.split("/").pop() || "";

        const div = document.createElement("div");
        div.className = "cm-json-schema-hover";

        // Create key and type info
        const keyAndType = document.createElement("div");
        keyAndType.className = "cm-json-schema-hover-key-and-type";

        const keySpan = document.createElement("span");
        keySpan.className = "cm-json-schema-hover-key";
        keySpan.textContent = `${key}: `;
        keyAndType.appendChild(keySpan);

        let keyClasses = highlighter.style([tags.propertyName])

        if (keyClasses) {
            keySpan.className += " " + keyClasses
        }

        const typeSpan = document.createElement("span");
        typeSpan.textContent = schema.type;
        typeSpan.className = "cm-json-schema-hover-type";
        keyAndType.appendChild(typeSpan);
        let typeTags: Tag[] = []

        switch (schema.type) {
            case "object":
                typeTags.push(tags.brace)
                break;
            case "array":
                typeTags.push(tags.bracket)
                break;
            case "string":
                typeTags.push(tags.string)
                break;
            case "number":
                typeTags.push(tags.number)
                break;
            case "boolean":
                typeTags.push(tags.bool)
                break;
            case "null":
                typeTags.push(tags.null)
                break;
        }

        const classes = highlighter.style(typeTags)

        if (classes) {
            typeSpan.className += " " + classes
        }

        div.appendChild(keyAndType);

        // Create description (if available)
        if (schema.description) {
            const description = document.createElement("div");
            description.className = "cm-json-schema-hover-description";

            const content = renderer.render(schema.description || "");
            description.innerHTML = content;
            div.appendChild(description);
        }

        // Create examples (if available)
        if (schema.examples) {
            const examples = document.createElement("div");
            examples.className = "cm-json-schema-hover-examples";
            examples.textContent = "Example:"
            schema.examples?.forEach((example: object) => {
                const jsonExample = JSON.stringify({ [key]: example }, null, 2);
                const node = renderExample(jsonExample, highlighter);
                examples.appendChild(node);
            })
            div.appendChild(examples);
        }
        return div
    }
}

export const getHoverTexts = (data: FoundCursorData): FoundCursorData => {
    // since we override formatHover, we can return the data as is and reuse it (instead of the default behavior)
    return data;
}