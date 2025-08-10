# bd-card-tools

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

## v0.1.0

Initial release.

This module is designed to be used with
Foundry Virtual TableTop, (any) Edition.

This module adds a some tweaks to cards in foundry.
