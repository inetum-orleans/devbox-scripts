#!/bin/bash

# Arrête toutes les VM virtualbox en cours d'exécution

# https://askubuntu.com/a/457564/650725
vboxmanage="/c/Program Files/Oracle/VirtualBox/VBoxManage.exe"
"$vboxmanage" list runningvms | sed -r 's/.*\{(.*)\}/\1/' | xargs -I {} "$vboxmanage" controlvm {} acpipowerbutton

# While "$vboxmanage" list runningvms | wc -l prints a result different from 0, print a . and sleep for 1 second
while [ "$("$vboxmanage" list runningvms | wc -l)" -ne 0 ]; do
    echo -n "."
    sleep 1
done