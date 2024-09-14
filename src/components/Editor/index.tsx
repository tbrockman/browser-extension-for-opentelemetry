import { Box, useComputedColorScheme } from "@mantine/core";
import ReactCodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
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
    handleRefresh,
} from "codemirror-json-schema";
import { getHoverTexts, formatHover } from "~components/Editor/hover";
import { themeDark, themeLight } from "./theme";
import './index.css';
import { HighlightStyle } from "@codemirror/language";

export const Editor = () => {
    const computedColorScheme = useComputedColorScheme('dark');
    const { configText } = useLocalStorage(['configText']);
    const [renderedConfig, setRenderedConfig] = useState(configText);
    const [debouncedConfig] = useDebouncedValue(renderedConfig, 1000);
    const theme = computedColorScheme == 'dark' ? themeDark : themeLight
    // second element returned by createTheme is the syntaxHighlighting extension
    const highlighter = theme[1].find(item => item.value instanceof HighlightStyle)?.value;

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
                theme={theme}
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
                    // @ts-ignore
                    hoverTooltip(jsonSchemaHover({ getHoverTexts, formatHover: formatHover(highlighter) })),
                    // @ts-ignore
                    stateExtensions(schema)]}
                onChange={onChange}
            />
        </Box>
    )
};