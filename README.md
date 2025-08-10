# bd-card-tools

## Description

This module is designed to be used with
Foundry Virtual TableTop, V13.

This module allows the GM to pull a card privately, and then display the card to the chat w/ a description that is shown only to the GM.

This is just a simple means for our home game of allowing the GM to pull a tarot card, and not give the full info of its implications to the player.

## Run

Execute with a script macro using this function:

```
window.LaunchGMCardUI()
```

## Installation and Building

**Gulp Commands**: To do various build tasks via gulp, execute the following commands (configurations are in foundryconfig.json):

```

    gulp publish -u 0.1.2 : builds and updates manifest to specifies version

    gulp build : builds everything from the 'src' folder to a 'dist' folder

    gulp link : builds everything from 'src' to the specified foundry directory

    gulp link --clean : remove the link to the foundry vtt folder

    gulp clean : removes all files from the dist folder

    gulp watch: Rebuilds automatically on file changes

    gulp package: Creates a .zip in /package for distribution

    gulp update --update=1.2.3 Updates the version in manifest and package.json
```
