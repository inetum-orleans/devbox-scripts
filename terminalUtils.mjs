import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Crée la liste des arguments à passer à la commande wt pour ouvrir les terminaux dans la disposition souhaitée.
 * @param {OpenWtCommandDescription[]} commands
 * @param {OpenWtCommandContext} context
 * @returns {string[]}
 */
export function windowsTerminalLayoutBuilder(commands, context) {
    if (commands.length < 3 || commands.length > 4) {
        throw new Error('La commande de construction de layout n\'est pas suffisamment générique pour gérer autre chose que 3 ou 4 terminaux.');
    }

    const scriptFolder = path.dirname(fileURLToPath(import.meta.url));
    const commonParams = ['--title', context.relativeProjectPath, '--suppressApplicationTitle']
    if (context.args.color) {
        commonParams.push('--tabColor', context.args.color)
    }

    const commandsArguments = commands.map(command => {
        return ['-d', command.startDirectory ?? scriptFolder, '-p', command.profile, 'cmd', '/k', command.command, ';']
    })
    const terminalArguments = [
        // -M : Lancement maximisé
        // Premier terminal, celui de gauche.
        '-M', ...commonParams, ...commandsArguments[0],
        // Deuxième terminal, splitté verticalement, celui en haut à droite.
        'sp', ...commonParams, '-V', ...commandsArguments[1],
        // Troisième terminal, splitté horizontalement, celui en bas à droite.
        'sp', ...commonParams, '-H', ...commandsArguments[2],
        // Donne le focus sur le terminal de gauche
        'mf', 'left',
    ];

    if(commands.length > 3) {
        terminalArguments.push(...[';', 'sp', ...commonParams, '-H', ...commandsArguments[3], 'mf', 'up'])
    }
    return terminalArguments;
}

/**
 * 
 * @param {string} command
 * @param {OpenWtCommandContext} context
 * @returns string
 */
export function sshCommand(command, context) {
    const escapedCommand = command
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"')
        .replaceAll(';', '\\;');
    return `ssh ${context.config.devboxSsh} -t "${escapedCommand}"`;
}