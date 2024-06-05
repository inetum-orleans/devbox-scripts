/**
 * Démarre la VM devbox en utilisant VBoxManage plutôt que vagrant up
 */

import { execSync } from 'node:child_process'
import { devboxFolder, devboxSsh, devboxVMNamePrefix, vBoxManageExe } from './variables.mjs'

// Use first argument or find the matching vm from VBoxManage list vms
let vmIdentifier = null;
if (process.argv.length > 2) {
    vmIdentifier = process.argv[2];
} else {
    // Gets the list of all VMS in the virtualbox
    const vms = execSync(`"${vBoxManageExe}" list vms`, { encoding: 'utf8' })
    const vmInfos = vms.split('\n').map(vm => {
        const match = vm.match(/"(.+)" {(.+)}/)
        if(match) {
            return {
                name: match[1],
                uuid: match[2]
            }
        }
        return null
    }).filter(vm => vm !== null);
    
    const foundVm = vmInfos.find(vm => vm.name.startsWith(devboxVMNamePrefix))
    if(foundVm) {
        vmIdentifier = foundVm.uuid;
    }
}

if (vmIdentifier) {
    // Start the VM
    execSync(`"${vBoxManageExe}" startvm ${vmIdentifier} --type headless`, { stdio: 'inherit' });
} else {
    console.error(`Aucune VM ${devboxVMNamePrefix} trouvée... Utilisation de vagrant up à la place.`)
    execSync('vagrant up', { stdio: 'inherit', cwd: devboxFolder })
}


let sshIsUp = false;
while(!sshIsUp) {
    console.log('En attente de la connexion ssh de la machine virtuelle...')
    try {
        execSync(`ssh -q ${devboxSsh}`)
        sshIsUp = true;
    } catch (ex) {
    }
}