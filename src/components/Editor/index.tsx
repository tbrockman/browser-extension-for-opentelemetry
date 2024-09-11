import { Box, useComputedColorScheme } from "@mantine/core";
import ReactCodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { useLocalStorage } from "~hooks/storage";
import { useDebouncedValue } from "@mantine/hooks";
import { setLocalStorage } from "~storage/local";
import { linter } from "@codemirror/lint";
import { EditorView, hoverTooltip } from "@codemirror/view";
import { json, jsonParseLinter, jsonLanguage } from "@codemirror/lang-json";
import schema from "~generated/schemas/configuration.schema.json";

import {
    jsonSchemaLinter,
    jsonSchemaHover,
    jsonCompletion,
    stateExtensions,
    handleRefresh
} from "codemirror-json-schema";
import { consoleProxy } from "~utils/logging";


export const Editor = () => {
    const computedColorScheme = useComputedColorScheme('dark');
    const { configText } = useLocalStorage(['configText']);
    const [renderedConfig, setRenderedConfig] = useState(configText);
    const [debouncedConfig] = useDebouncedValue(renderedConfig, 500);

    // TODO: probably make saving explicit instead of having autosave (or some option)
    const onChange = (val, viewUpdate) => {
        setRenderedConfig(val);
    }

    // TODO: handle updating matchPatterns 
    // (probably deserialize text and check if matchPatterns have changed)

    useEffect(() => {
        if (configText !== renderedConfig) {
            setRenderedConfig(configText)
        }
    }, [configText])

    useEffect(() => {
        if (debouncedConfig !== configText) {
            setLocalStorage({ configText: debouncedConfig })
        }
    }, [debouncedConfig])

    return (
        <Box>
            <ReactCodeMirror
                value={renderedConfig}
                height="100%"
                theme={computedColorScheme == 'dark' ? vscodeDark : vscodeLight}
                extensions={[
                    EditorView.lineWrapping,
                    json(),
                    linter(jsonParseLinter(), {
                        // default is 750ms
                        delay: 300
                    }),
                    linter(jsonSchemaLinter(), {
                        needsRefresh: handleRefresh,
                    }),
                    jsonLanguage.data.of({
                        autocomplete: jsonCompletion(),
                    }),
                    hoverTooltip(jsonSchemaHover()),
                    // @ts-ignore
                    stateExtensions(schema)]}
                onChange={onChange}
            />
        </Box>
    )
};