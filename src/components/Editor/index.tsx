import { Box, useComputedColorScheme } from "@mantine/core";
import { EditorState, useCodeMirror } from "@uiw/react-codemirror";
import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "~hooks/storage";
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
import { de } from "~utils/serde";
import { UserFacingConfiguration } from "~storage/local/configuration";
import { consoleProxy } from "~utils/logging";
import { syncMatchPatternPermissions } from "~utils/match-pattern";

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
    onSave: (text: string) => Promise<void>
    onChange: (val: string, state: any) => Promise<void>
    defaultEditorState?: EditorState
    defaultValue: string
}

// TODO: preserve editor state after editor save -> toggle mode
// TODO: prompt ctrl+s to save in top right corner after changes
// TODO: fix ctrl+f search styling
// TODO: fix autocomplete typing option background color flicker
export const Editor = ({ onSave, onChange, defaultValue, defaultEditorState }: EditorProps) => {
    const computedColorScheme = useComputedColorScheme('dark');
    const editor = useRef<HTMLDivElement>(null);
    const [initialEditorState, setInitialEditorState] = useState(defaultEditorState);
    // some sort of state so that we can populate with proper editor state initially?
    const [renderedText, setRenderedText] = useState<string>(defaultEditorState?.doc as string | undefined || defaultValue);
    const [saving, setSaving] = useState<boolean | null>(null);
    const theme = computedColorScheme == 'dark' ? themeDark : themeLight
    // second element returned by createTheme is the syntaxHighlighting extension
    const highlighter = theme[1].find(item => item.value instanceof HighlightStyle)?.value;

    const editorOnSave = (): boolean => {
        setSaving(true);
        onSave(renderedText).finally(() => setSaving(false));
        return true;
    }

    const editorOnChange = async (val: string, viewUpdate: ViewUpdate) => {
        setRenderedText(val);
        const state = viewUpdate.state.toJSON(stateFields);
        await onChange(val, state);
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
                { key: "Mod-s", run: editorOnSave },
            ]),
        ],
        theme,
        onChange: editorOnChange,
        value: renderedText,
        height: '100%',
    });

    useEffect(() => {
        initialEditorState && codemirror.setState(initialEditorState);
        editor.current && codemirror.setContainer(editor.current);
    }, [editor.current, initialEditorState])

    return (
        <Box ref={editor} />
    )
};