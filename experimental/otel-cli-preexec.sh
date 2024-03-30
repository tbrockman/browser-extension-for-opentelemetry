#!/bin/bash
# Pre-requisites:
# 1. otel-cli is installed and available in the PATH
# 2. shopt -s extdebug is available
# 3. trap is available
# 4. which is available

DEFAULT_BIN_PATH_REGEX="echo"
DEFAULT_SERVICE="otel-cli"

function Initialize() {
    result=$(EnsureDependencies)
    if [[ $result -ne 0 ]]; then
        return 1
    fi
    shopt -s extdebug
    Trap
}


function Trap() {
    trap 'ProxyOtel "$BASH_COMMAND" "$@"' DEBUG
}

function Untrap() {
    trap - DEBUG
}

function EnsureDependencies() {
    if ! command -v otel-cli &> /dev/null; then
        echo "otel-cli could not be found. Please ensure otel-cli is installed and available in the PATH."
        return 1
    fi
    if ! command -v which &> /dev/null; then
        echo "which could not be found. Please ensure which is installed and available in the PATH."
        return 1
    fi
    if ! command -v trap &> /dev/null; then
        echo "trap could not be found. Please ensure trap is available."
        return 1
    fi
    if ! command -v shopt &> /dev/null; then
        echo "shopt could not be found. Please ensure shopt is available."
        return 1
    fi
    return 0
}

function ProxyOtel() {
    # disable the DEBUG trap to avoid infinite loop
    Untrap
    program=$(echo "$1" | awk '{print $1}')
    path=$(which ${program})

    # If we've set the environment variable OTEL_CLI_REGEX, we'll use that as our regex
    if [[ -n "${OTEL_CLI_REGEX}" ]]; then
        BIN_PATH_REGEX=${OTEL_CLI_REGEX}
    else
        BIN_PATH_REGEX=${DEFAULT_BIN_PATH_REGEX}
    fi
    # If the command about to be executed matches our regex, we'll run the command using otel-cli exec
    if [[ "${path}" =~ $BIN_PATH_REGEX ]]; then

        echo "Running ${1} with otel-cli exec"
        otel-cli exec -- ${1}
    # Otherwise, we do nothing (and let the command run as normal)
    fi
    # Re-enable the DEBUG trap
    Trap
}
# Set the DEBUG trap to run our function before each command
Initialize