let info: chrome.runtime.PlatformInfo;

export const getPlatformInfo = async () => {
    if (!info) {
        info = await chrome.runtime.getPlatformInfo();
    }
    return info;
}

const keyMap = {
    'Mod': {
        mac: '⌘',
        default: 'Ctrl'
    },
    'Meta': {
        mac: '⌘',
        win: '⊞',
        default: 'Meta'
    },
    'Alt': {
        mac: '⌥',
        default: 'Alt'
    },
}

export const toPlatformSpecificKeys = (keys: string[], platform: chrome.runtime.PlatformInfo | null) => {

    if (!platform) {
        return
    }

    return keys.map(key => {

        switch (key) {
            case 'Mod':
            case 'Alt':
            case 'Meta':
                return keyMap[key][platform?.os] || keyMap[key].default;
            default:
                return key;
        }
    });
}