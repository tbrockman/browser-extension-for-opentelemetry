import { getWithDefaults } from "./storage"

import type { Storage } from "@plasmohq/storage"

// TODO: decide what we're going to store as app data for diagnosing telemetry export issues
export type AppData = {
    lastExportError?: string
    lastExportErrorTimestamp?: number
    lastExportSuccessTimestamp?: number
}

const defaultAppData: AppData = {}

export const getAppData = async (storage: Storage): Promise<AppData> => {
    return await getWithDefaults(storage, defaultAppData)
}