import { Box, useComputedColorScheme } from "@mantine/core";
import { useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useRef, useState } from "react";
import { getLocalStorage, setLocalStorage } from "~storage/local";
import { linter, lintKeymap, lintGutter } from "@codemirror/lint";
import {
    EditorView, hoverTooltip, keymap, ViewUpdate, gutter,
    drawSelection,
    highlightActiveLineGutter,
} from "@codemirror/view";
import { json, jsonParseLinter, jsonLanguage } from "@codemirror/lang-json";
import {
    autocompletion,
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
} from "@codemirror/autocomplete";
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
import { defaultKeymap, historyKeymap, historyField } from "@codemirror/commands";
import { HighlightStyle, indentOnInput, bracketMatching, foldKeymap } from "@codemirror/language";
import { consoleProxy } from "~utils/logging";

const stateFields = { history: historyField };
const constExtensions = [
    EditorView.lineWrapping,
    // autocompletion(),
    lintGutter(),
    gutter({ class: "CodeMirror-lint-markers" }),
    bracketMatching(),
    highlightActiveLineGutter(),
    closeBrackets(), // TODO: figure out why brackets not closing when started before comma
    indentOnInput(),
    drawSelection(),
    keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
    ]),
    json(),
    linter(jsonParseLinter(), {
        // default is 750ms
        delay: 300
    }),
    linter(jsonSchemaLinter(), {
        needsRefresh: handleRefresh,
    }),
    jsonLanguage.data.of({
        autocomplete: jsonCompletion(), // TODO better autocomplete
    }),
]

export type EditorProps = {
    onSave?: (text: string) => void;
    onChange?: (text: string) => void;
}

// TODO: preserve editor state after editor save -> toggle mode
// TODO: fix ctrl+f search styling
// TODO: fix autocomplete typing option background color flicker
export const Editor = ({ onSave, onChange }: EditorProps) => {
    const computedColorScheme = useComputedColorScheme('dark');
    const editor = useRef<HTMLDivElement>(null);
    const [initialEditorState, setInitialEditorState] = useState(null);
    // some sort of state so that we can populate with proper editor state initially?
    const [renderedConfig, setRenderedConfig] = useState<string>('');
    // const [saving, setSaving] = useState<boolean | null>(null);
    const theme = computedColorScheme == 'dark' ? themeDark : themeLight
    // second element returned by createTheme is the syntaxHighlighting extension
    const highlighter = theme[1].find(item => item.value instanceof HighlightStyle)?.value;

    const onEditorChange = async (val: string, viewUpdate: ViewUpdate) => {
        consoleProxy.debug('editor change', val, viewUpdate);
        setRenderedConfig(val);
        onChange && onChange(val);

        const state = viewUpdate.state.toJSON(stateFields);
        await setLocalStorage({ editorState: state });
    }

    const onEditorSave = () => {
        onSave && onSave(renderedConfig);
        return true;
    }

    const codemirror = useCodeMirror({
        container: editor.current,
        initialState: initialEditorState ? {
            json: initialEditorState,
            fields: stateFields,
        } : undefined,
        extensions: [
            constExtensions,
            // @ts-ignore
            hoverTooltip(jsonSchemaHover({ getHoverTexts, formatHover: formatHover(highlighter) })),
            // @ts-ignore
            stateExtensions(schema),
            keymap.of([
                { key: "Mod-s", run: onEditorSave },
            ]),
        ],
        theme,
        onChange: onEditorChange,
        value: renderedConfig,
        height: '100%',
    });

    useEffect(() => {
        const init = async () => {
            if (initialEditorState == null) {
                const { editorState, configText } = await getLocalStorage(['editorState', 'configText'])
                // @ts-ignore TODO: fix this
                setRenderedConfig(editorState?.doc || configText);
                // @ts-ignore TODO: fix this
                setInitialEditorState(editorState);
            }
        }
        init();
    }, [initialEditorState])

    useEffect(() => {
        initialEditorState && codemirror.setState(initialEditorState);
        editor.current && codemirror.setContainer(editor.current);
    }, [editor.current, initialEditorState])

    return (
        <Box ref={editor} />
    )
};