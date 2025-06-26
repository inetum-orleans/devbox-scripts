/**
 * Ouvre Windows Terminal avec 3 (ou 4) panneaux
 *
 * CHANGELOG:
 * 4.0.0 : Chargement de la machine virtuelle avec un VBoxManage pour aller plus vite qu'un vagrant up (ne fait plus les mises à jour automatiquement au démarrage)
 * 3.2.0 : Refactorisation du chargement des variables, seules les variables surchargées ont besoin d'être dans variables.mjs
 * 3.1.0 : Variabilisation des noms des profils de terminaux
 * 3.0.0 : Changement de la syntaxe des arguments pour utiliser le module node:util/parseArgs
 * 2.3.0 : Ajout d'un fichier variables.mjs qui gère les variables d'environnement
 * 2.2.0 : Ajout variables d'environnement pour configurer l'emplacement de la devbox
 *
 */
import { execSync, spawn } from 'node:child_process'
import { readdirSync, realpathSync } from 'node:fs'
import * as readline from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { stdin as input, stdout as output } from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as defaultVariables from './variables.default.mjs'
import * as variables from './variables.mjs'

const config = { ...defaultVariables, ...variables }
const { devboxSsh, allProjectsFolder, windowsTerminalLayoutBuilder, windowsTerminalCommandsBuilder } = config

/**
 * @type {import('node:util').ParseArgsOptionsConfig}
 */
const options = {
    color: {
        type: 'string',
        short: 'c',
        default: '#363636'
    },
    '4-terminals': {
        type: 'boolean',
        short: '4'
    },
    workdir: {
        type: 'string',
        short: 'w'
    }
};

let args = process.argv.slice(2);

if (args.length > 1 && !args.some(arg => arg.startsWith('-'))) {
    // Probablement que l'ancienne syntaxe est utilisée.
    const [projectDir, color, fourTerminals] = args;
    args = []
    if (color) {
        args.push('--color', color)
    }
    if (fourTerminals === '4') {
        args.push('--4-terminals')
    }
    args.push(projectDir)

    console.error('DEPRECATED : La syntaxe des arguments utilisée est dépréciée, veuillez modifier votre ligne de commande comme ceci :');
    console.error([process.argv[0], process.argv[1], ...args]
        .map(arg => arg.startsWith('-') ? arg : '"' + arg + '"') // Entoure les arguments par des quotes, sauf les --options
        .join(' '));
    console.error('Mais comme on est sympa, on vous laisse continuer quand même... Il faudra juste y penser un jour.');
    execSync('pause', { stdio: 'inherit' });
}

/** @type {{ values: OpenWtArguments, positionals: string[]}} */
const { positionals, values } = parseArgs({
    args,
    options,
    allowPositionals: true
});

if (positionals.length > 1) {
    console.error('Il ne peut y avoir qu\'un seul argument positionnel, le chemin du projet à ouvrir.');
    process.exit(1);
}

const scriptFolder = path.dirname(fileURLToPath(import.meta.url));
try {
    execSync(`ssh -o ConnectTimeout=2 -q ${devboxSsh}`)
} catch (e) {
    console.log('Devbox non démarrée, démarrage')
    execSync(`"${process.execPath}" startVM.mjs`, { stdio: 'inherit', cwd: scriptFolder })
}

let projectPath;
if(positionals.length > 0) {
    projectPath = realpathSync(positionals[0]);
} else {
    var projects = readdirSync(allProjectsFolder, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
    for (let i = 0; i < projects.length; i++) {
        console.log(`${i}. ${projects[i].name}`)
    }
    const rl = readline.createInterface({ input, output })
    const projectNumber = parseInt(await rl.question('Quel projet dois-je ouvrir ? '))
    if (projectNumber >= 0 && projectNumber < projects.length) {
        projectPath = realpathSync(path.join(allProjectsFolder, projects[projectNumber].name))
    }
    rl.close();
}

if(!projectPath) {
    console.error('Aucun projet sélectionné, veuillez relancer le script avec le chemin du projet à ouvrir en argument.');
    process.exit(1);
}

const relativeProjectPath = path.join(path.relative(allProjectsFolder, projectPath), values.workdir ?? '').replaceAll('\\', '/');

/** @type {OpenWtCommandContext} */
const context = {
    config,
    args: values,
    projectPath,
    relativeProjectPath,
}

const commands = windowsTerminalCommandsBuilder(context);
const terminalArguments = windowsTerminalLayoutBuilder(commands, context);

spawn('wt', terminalArguments, { detached: true, stdio: 'inherit' }).unref()
