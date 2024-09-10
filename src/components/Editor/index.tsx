import { Box, useComputedColorScheme } from "@mantine/core";
import ReactCodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { useLocalStorage } from "~hooks/storage";
import { useDebouncedValue } from "@mantine/hooks";
import { setLocalStorage } from "~utils/storage";
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


export const Editor = () => {
    const computedColorScheme = useComputedColorScheme('dark');
    const { configText } = useLocalStorage(['configText']);
    const [renderedConfig, setRenderedConfig] = useState(configText);
    const [debouncedConfig] = useDebouncedValue(renderedConfig, 500);

    const onChange = (val, viewUpdate) => {
        setRenderedConfig(val);
    }

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
                    stateExtensions(schema)]}
                onChange={onChange}
            />
        </Box>
    )
};