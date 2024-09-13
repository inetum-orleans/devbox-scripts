/**
 * Défini les variables locales
 */

// A personnaliser en fonction de votre configuration
const devboxSsh = process.env.DOCKER_DEVBOX_SSH ?? 'vagrant@192.168.99.100'
const devboxFolder = process.env.DOCKER_DEVBOX_PATH ?? 'C:\\workspace\\docker-devbox'
const allProjectsFolder = process.env.MUTAGEN_HELPER_PATH ?? 'C:\\workspace\\projects'

// Les profils WindowsTerminal à utiliser pour chacun des 4 terminaux (1:gauche, 2:haut à droite, 3: bas à droite, 4: bas à gauche (si découpe en 4))
// Cela vous permet de configurer un thème de couleurs, des images de fond d'écran personnalisées... à vous de jouer avec la configuration windows terminal.
const profile1 = 'Command Prompt'
const profile2 = 'Command Prompt'
// Pour le profil 3, il est fortement recommandé de créer un nouveau profil avec une taille de police réduite (<=9) pour que le texte ne défile pas sur un petit écran.
const profile3 = 'Command Prompt'
const profile4 = 'Command Prompt'
export { devboxSsh, devboxFolder, allProjectsFolder, profile1, profile2, profile3, profile4 }
