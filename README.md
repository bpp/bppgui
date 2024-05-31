![Conphyig Editor](https://github.com/bpp/bppgui/blob/main/Editor.png)


# bppgui
Graphical tools for editing input files and viewing output of bpp program

## Overview
This project includes a suite of cross-platform graphical tools for use with bpp (written using [Electron](https://www.electronjs.org/)). There will be multiple programs
designed for different purposes. The directory `src/filetools` contains a control file editor with syntax
aware highlighting, a syntax checker (linter), and a snippet creator all designed to simplify the
creation of control files that conform to the most recent version of the bpp program. Ultimately,
there will be a second suite of programs for viewing and manipulating gene trees and species trees.
Documentation will be forthcoming, meanwhile feel free to experiment with the current version of the
configuration editor `conphyig`, the use of which is briefly explained below.

## Installing the Conphyig Editor
You will need to have `node.js` installed on your computer. See instructions at <https://nodejs.org/en/download/package-manager/current>.
Once `node.js` is installed type the following in a terminal:
```
	git clone https://github.com/bpp/bppgui.git
	cd bppgui/src/filetools
	npm install
	npm start
```

## Using the Conphyig Editor
Open a control file using the `File/Open Control File` menu item. You will see a button labelled `check syntax` on the lower left
which you can press to run a syntax check on the current file. To use the snippet configurator chooose the meny item `Snippets/Open Snippet Configurator`. There is an expandable tree of 
![Snippet Configurator](./Snippet.png)


