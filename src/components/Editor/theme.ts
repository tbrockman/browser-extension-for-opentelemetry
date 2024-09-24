import { createTheme } from '@uiw/codemirror-themes'
import { vscodeDarkStyle, vscodeLightStyle, defaultSettingsVscodeDark, defaultSettingsVscodeLight } from "@uiw/codemirror-theme-vscode";

export const themeDark = createTheme({ theme: 'dark', settings: defaultSettingsVscodeDark, styles: vscodeDarkStyle });
export const themeLight = createTheme({ theme: 'light', settings: defaultSettingsVscodeLight, styles: vscodeLightStyle });
