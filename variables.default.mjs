/*
 * Ce fichier contient les valeurs par défaut des variables utilisées dans les scripts.
 * Il est possible de surcharger une ou plusieurs des variables en les définissant dans un fichier variables.mjs 
 */

import { windowsTerminalLayoutBuilder, sshCommand } from './terminalUtils.mjs'
import path from 'node:path'

const devboxSsh = process.env.DOCKER_DEVBOX_SSH ?? 'vagrant@192.168.99.100'
const devboxFolder = process.env.DOCKER_DEVBOX_PATH ?? 'C:\\workspace\\docker-devbox'
const devboxVMNamePrefix = process.env.DOCKER_DEVBOX_VM_NAME_PREFIX ?? 'docker-devbox_default'
const allProjectsFolder = process.env.MUTAGEN_HELPER_PATH ?? 'C:\\workspace\\projects'
const vBoxManageExe = 'C:\\Program Files\\Oracle\\VirtualBox\\VBoxManage.exe'

// Les profils WindowsTerminal à utiliser pour chacun des 4 terminaux (1:gauche, 2:haut à droite, 3: bas à droite, 4: bas à gauche (si découpe en 4))
// Cela vous permet de configurer un thème de couleurs, des images de fond d'écran personnalisées... à vous de jouer avec la configuration windows terminal.
let profile1 = 'Command Prompt'
let profile2 = 'Command Prompt'
// Pour le profil 3, il est fortement recommandé de créer un nouveau profil avec une taille de police réduite (<=9) pour que le texte ne défile pas sur un petit écran.
let profile3 = 'Command Prompt'
let profile4 = 'Command Prompt'

/**
 * 
 * @param {OpenWtCommandContext} context
 * @returns {OpenWtCommandDescription[]}
 */
function windowsTerminalCommandsBuilder(context) {
    /** @type OpenWtCommandDescription[] */
    const commands = [];
    const startInFolderCommand = sshCommand(`cd /home/vagrant/projects/${context.relativeProjectPath};bash --login`, context);

    commands.push({
        command: startInFolderCommand,
        profile: context.config.profile1,
    });
    commands.push({
        command: startInFolderCommand,
        profile: context.config.profile2,
    });
    commands.push({
        command: `node mutagenStart.mjs ${path.basename(context.projectPath)}`,
        profile: context.config.profile3,
    });
    if (context.args['4-terminals']) {
        commands.push({
            command: startInFolderCommand,
            profile: context.config.profile4,
        });
    }
    return commands;
}

export {
    devboxSsh,
    devboxFolder,
    devboxVMNamePrefix,
    allProjectsFolder,
    profile1,
    profile2,
    profile3,
    profile4,
    vBoxManageExe,
    windowsTerminalCommandsBuilder,
    windowsTerminalLayoutBuilder,
}
