declare type OpenWtArguments = {
    color: string,
    '4-terminals'?: boolean,
    workdir?: string
}

declare type OpenWtCommandContext = {
    config: typeof import('./variables.default.mjs'),
    args: OpenWtArguments,
    projectPath: string,
    relativeProjectPath: string
}

declare type OpenWtCommandDescription = {
    command: string,
    profile: string,
    startDirectory?: string
}