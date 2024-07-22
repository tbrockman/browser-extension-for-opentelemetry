// TODO: decide what we're going to store as app data for diagnosing telemetry export issues
export type AppData = {
    lastExportError?: string
    lastExportErrorTimestamp?: number
    lastExportSuccessTimestamp?: number
}

const defaultAppData: AppData = {}

export const getAppData = async (): Promise<AppData> => {
    return await defaultAppData
}