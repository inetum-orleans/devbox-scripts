/**
 * Démarre mutagen sur un dossier en particulier
 */
import path from 'node:path'
import { execSync } from 'node:child_process'
import * as defaultVariables from './variables.default.mjs'
import * as variables from './variables.mjs'

const { allProjectsFolder, devboxSsh } = { ...defaultVariables, ...variables }

if(process.argv.length <= 2) {
    console.error('Vous devez spécifier un nom de projet')
    process.exit(1)
}

const projectName = process.argv[2];
const devboxSshIp = devboxSsh.split('@')[1];

const alpha = {
    path: path.join(allProjectsFolder, projectName)
}
const beta = {
    user: 'root',
    host: devboxSshIp,
    path: '/home/vagrant/projects/' + projectName
}

const syncOptions = [
    '--sync-mode', 'two-way-resolved',
    '--default-file-mode-beta', '664',
    '--default-directory-mode-beta', '775',
    '--default-owner-beta', 'vagrant',
    '--default-group-beta', 'vagrant'
]

let sessionId = findSyncIdentifier({ alpha, beta });
if (!sessionId) {
    console.log('La synchronisation n\'existe pas, création d\'une session de synchronisation...')
    const syncCreateOutput = execSync(`mutagen sync create "${alpha.path}" ${beta.user}@${beta.host}:${beta.path} ${syncOptions.join(' ')}`, { encoding: 'utf8' });
    sessionId = findSyncIdentifier({ alpha, beta });
    if(!sessionId) {
        console.error('Erreur lors de la création de la synchronisation', syncCreateOutput)
        process.exit(1)
    }
}

process.on('SIGINT', () => {
    // Do nothing, the child process will be killed and the cleanup will do its stuff
})

try {
    console.clear();
    execSync(`mutagen sync monitor ${sessionId}`, { stdio: 'inherit' })
} catch(e) {
    // When pressing ctrl+c, the execution will throw
    console.log('\nsync monitor arrêté, arrêt de la session de synchronisation')
    console.log(`\nLancer la commande suivante pour relancer la synchronisation: \nnode mutagenStart.mjs ${projectName}`)
}

execSync(`mutagen sync terminate ${sessionId}`, { stdio: 'inherit' });

/**
 * Lance un mutagen sync list pour trouver l'identifiant de la synchronisation correspondant aux paramètres de recherche
 * 
 * @param {*} search 
 * @returns 
 */
function findSyncIdentifier(search) {
    try {
        const syncListOutput = execSync('mutagen sync list --template="{{ json . }}"', { encoding: 'utf8' });
        const syncList = JSON.parse(syncListOutput)
        return syncList.find(s =>
            s.alpha.path.toLowerCase() === search.alpha.path.toLowerCase() &&
            s.beta.host === search.beta.host &&
            s.beta.path === search.beta.path
        )?.identifier;
    } catch (e) {
            console.error('Erreur lors de la récupération de la liste des synchronisations, avez-vous une version de mutagen >= 0.15 installée ?')
            process.exit(1)
    }
}
