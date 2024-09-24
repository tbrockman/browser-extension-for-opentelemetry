#!/usr/bin/env -S pnpm tsx

import { spawn } from 'child_process'
import packageJson from '../../../package.json'

process.env.PLASMO_PUBLIC_PACKAGE_VERSION = packageJson.version
process.env.PLASMO_PUBLIC_PACKAGE_NAME = packageJson.name

const cmd = spawn(process.argv.slice(2).join(" "), { shell: true });

cmd.stdout.on('data', (data) => {
    process.stdout.write(`${data}`);
});

cmd.stderr.on('data', (data) => {
    process.stderr.write(`${data}`);
});

cmd.on('close', (code) => {
    process.stdout.write(`child process exited with code ${code}`);
});