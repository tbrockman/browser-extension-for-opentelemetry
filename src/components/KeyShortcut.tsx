import { Group, Kbd } from "@mantine/core";
import { usePlatformInfo } from "~hooks/platform"
import { toPlatformSpecificKeys } from "~utils/platform";

export type KeyShortcutProps = {
    keys: string[]
}

export const KeyShortcut = ({ keys }: KeyShortcutProps) => {
    const platformInfo = usePlatformInfo();
    const platformKeys = platformInfo ? toPlatformSpecificKeys(keys, platformInfo) ?? keys : keys;
    const elements = platformKeys.map((key, i) =>
        <>
            <Kbd>{key}</Kbd>
            {(i !== platformKeys.length - 1) && '+'}
        </>
    );

    return (
        <Group>{elements}</Group>
    )
}