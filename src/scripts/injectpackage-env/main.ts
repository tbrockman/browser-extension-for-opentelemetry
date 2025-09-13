#!/usr/bin/env -S pnpm tsx

import { spawn } from 'child_process'
import { readFileSync } from 'fs'
import { parse as parseYaml } from 'yaml'
import { join } from 'path'
import packageJson from '../../../package.json'

const lockfilePath = join(__dirname, '../../../pnpm-lock.yaml')
const lockfileContent = readFileSync(lockfilePath, 'utf8')
const lockfile = parseYaml(lockfileContent)

// Parse pnpm-lock.yaml to get the resolved version of @opentelemetry/sdk-trace-web
function getOtelSdkVersion(): string {
    try {
        // Look for the resolved version in the importers section
        const dependencies = lockfile?.importers?.['.']?.dependencies
        const otelSdkEntry = dependencies?.['@opentelemetry/sdk-trace-web']

        if (otelSdkEntry?.version) {
            return otelSdkEntry.version
        }

        // Fallback to hardcoded version if parsing fails
        console.warn('Could not parse @opentelemetry/sdk-trace-web version from pnpm-lock.yaml, using fallback')
        return '2.1.0'
    } catch (error) {
        console.warn('Error reading pnpm-lock.yaml:', error)
        return '2.1.0'
    }
}

process.env.PLASMO_PUBLIC_PACKAGE_VERSION = packageJson.version
process.env.PLASMO_PUBLIC_PACKAGE_NAME = packageJson.name
process.env.PLASMO_PUBLIC_OTEL_SDK_VERSION = getOtelSdkVersion()

const cmd = spawn(process.argv.slice(2).join(" "), { shell: true });

cmd.stdout.on('data', (data) => {
    process.stdout.write(`${data}`);
});

cmd.stderr.on('data', (data) => {
    process.stderr.write(`${data}`);
});
