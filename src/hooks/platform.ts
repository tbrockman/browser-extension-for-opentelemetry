import { useEffect, useState } from "react";
import { getPlatformInfo } from "~utils/platform";

export const usePlatformInfo = () => {
    const [platformInfo, setPlatformInfo] = useState<chrome.runtime.PlatformInfo | null>(null);
    useEffect(() => {
        const getInfo = async () => {
            const info = await getPlatformInfo();
            setPlatformInfo(info);
        }
        getInfo();
    }, []);
    return platformInfo;
}