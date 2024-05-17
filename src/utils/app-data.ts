import { getWithDefaults } from "./storage"

import type { Storage } from "@plasmohq/storage"

export type AppData = {
    lastExportError?: string
    lastExportErrorTimestamp?: number
    lastExportSuccessTimestamp?: number
}

const defaultAppData: AppData = {}

export const getAppData = async (storage: Storage): Promise<AppData> => {
    return await getWithDefaults(storage, defaultAppData)
}