/**
 * Ouvre Windows Terminal avec 3 (ou 4) panneaux
 *
 * CHANGELOG:
 * 3.2.0 : Refactorisation du chargement des variables, seules les variables surchargées ont besoin d'être dans variables.mjs
 * 3.1.0 : Variabilisation des noms des profils de terminaux
 * 3.0.0 : Changement de la syntaxe des arguments pour utiliser le module node:util/parseArgs
 * 2.3.0 : Ajout d'un fichier variables.mjs qui gère les variables d'environnement
 * 2.2.0 : Ajout variables d'environnement pour configurer l'emplacement de la devbox
 *
 */
import { execSync, spawn } from 'node:child_process'
import { readdirSync, realpathSync } from 'node:fs'
import * as readline from 'node:readline'
import { promisify, parseArgs } from 'node:util'
import { stdin as input, stdout as output } from 'node:process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as defaultVariables from './variables.default.mjs'
import * as variables from './variables.mjs'

const { devboxSsh, devboxFolder, allProjectsFolder, profile1, profile2, profile3, profile4 } = { ...defaultVariables, ...variables }

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
    console.log('Vagrant n\'est pas démarré, lancement de vagrant up')
    execSync('vagrant up', { stdio: 'inherit', cwd: devboxFolder })
    let sshIsUp = false;
    while(!sshIsUp) {
        console.log('En attente du démarrage de la machine')
        try {
            execSync(`ssh -q ${devboxSsh}`)
            sshIsUp = true;
        } catch (ex) {
        }
    }
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
    const question = promisify(rl.question).bind(rl)
    const projectNumber = parseInt(await question('Quel projet dois-je ouvrir ? '))
    if (projectNumber >= 0 && projectNumber < projects.length) {
        projectPath = realpathSync(path.join(allProjectsFolder, projects[projectNumber].name))
    }
    rl.close();
}

const relativeProjectPath = path.join(path.relative(allProjectsFolder, projectPath), values.workdir ?? '').replaceAll('\\', '/');

// Vous pouvez configurer les commandes qui sont exécutées dans chacun des terminaux
const term1Command = `ssh ${devboxSsh} -t "sleep 3\\;cd /home/vagrant/projects/${relativeProjectPath}\\; bash --login"` // sleep 3: smartcd supporte mal d'être lancé deux fois en parallèle...
const term2Command = `ssh ${devboxSsh} -t "cd /home/vagrant/projects/${relativeProjectPath}\\; bash --login"`
const term3Command = `node mutagenStart.mjs ${path.basename(projectPath)}`
const term4Command = `ssh ${devboxSsh} -t "sleep 6\\;cd /home/vagrant/projects/${relativeProjectPath}\\; bash --login"` // sleep 6: smartcd supporte mal d'être lancé deux fois en parallèle... Alors 3 fois...

const commonParams = ['--title', relativeProjectPath, '--suppressApplicationTitle', '--tabColor', values.color]

const terminalArguments = [
    // -M : Lancement maximisé
    // Premier terminal, celui de gauche, pour le projet
    '-M', ...commonParams, '-d', devboxFolder, '-p', profile1, 'cmd', '/k', term1Command, ';',
    // Deuxième terminal, splitté verticalement, celui en haut à droite. Lance le vagrant ssh dans le bon dossier
    'sp', ...commonParams, '-V', '-d', devboxFolder, '-p', profile2, 'cmd', '/k', term2Command, ';',
    // Troisième terminal, splitté horizontalement, celui en bas à droite. Lance mutagen sync monitor
    'sp', ...commonParams, '-H', '-d', scriptFolder, '-p', profile3, 'cmd', '/k', term3Command, ';',
    // Donne le focus sur le terminal de gauche
    'mf', 'left',
];

if(values['4-terminals'] === true) {
    terminalArguments.push(...[';', 'sp', ...commonParams, '-H', '-d', devboxFolder, '-p', profile4, 'cmd', '/k', term4Command, ';', 'mf', 'up'])
}
spawn('wt', terminalArguments, { detached: true, stdio: 'inherit' }).unref()
