#!/bin/bash

DEFAULT_BIN_PATH_REGEX="cat"
DEFAULT_SERVICE="otel-cli"

# Cache the output of `which` command to avoid repeated calls
declare -A path_cache

function Initialize() {
    EnsureDependencies || return 1
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
    local dependencies=("otel-cli" "which" "trap" "shopt")
    for dependency in "${dependencies[@]}"; do
        if ! command -v "$dependency" &> /dev/null; then
            echo "$dependency could not be found. Please ensure $dependency is installed and available in the PATH."
            return 1
        fi
    done
}

function GetPath() {
    local program="$1"
    # Check if path is already cached
    if [[ -n "${path_cache[$program]}" ]]; then
        echo "${path_cache[$program]}"
    else
        local path
        path=$(which "$program")
        path_cache["$program"]=$path
        echo "$path"
    fi
}

function ProxyOtel() {
    [ -n "$COMP_LINE" ] && return # do nothing if shell completion
    [ "$BASH_COMMAND" = "$PROMPT_COMMAND" ] && return # do nothing for prompts

    Untrap # disable the DEBUG trap to avoid infinite loop

    local program="${1%% *}"  # Extracting the command name
    local path
    path=$(GetPath "$program")
    echo "in proxy otel function: ${1}, program: ${program}, path: ${path}"
    local exit_code
    exit_code=1

    local BIN_PATH_REGEX
    BIN_PATH_REGEX=${OTEL_CLI_REGEX:-$DEFAULT_BIN_PATH_REGEX}

    local result

    if [[ "$path" =~ $BIN_PATH_REGEX ]]; then
        echo "Running ${1} with otel-cli exec"
        $(otel-cli exec -- ${1}) || true
        exit_code=1 # don't run the original command
    else
        exit_code=0 # run the original command we trapped as it didn't match the regex
    fi
    Trap
    return ${exit_code}
}

Initialize