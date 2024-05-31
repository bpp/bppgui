import { bppVarMap } from "./cfile.jsm"
import { CFV_Ind as CI  } from "./globals.jsm"
import { currentSnippet, applyIS} from "./cfile.jsm"

/* set default outfile name */
const displayoutfilehandle = document.getElementById("displayoutfile");
displayoutfilehandle.innerHTML = `Current output file: ${
        /(outfile\s=\s)([\w_\-.]+)/.exec(bppVarMap.get("outfile"))[2]
      }`;

/* set default mcmcfile name */
const displaymcmcfilehandle = document.getElementById("displaymcmcfile");
displaymcmcfilehandle.innerHTML = `Current MCMC output file: ${
        /(mcmcfile\s=\s)([\w_\-.]+)/.exec(bppVarMap.get("mcmcfile"))[2]
      }`;

/* set default seqfile name */
const displayseqfilehandle = document.getElementById("displayseqfile");
displayseqfilehandle.innerHTML = `Current sequence data file: ${
        /(seqfile\s=\s)([\w_\-.]+)/.exec(bppVarMap.get("seqfile"))[2]
      }`;

/* function initiated by click on menu item in snippet tree */
function clickedOnTree(newID, snippetIndex, bpp_snippets) {
    if (currID)
        document.getElementById(currID).setAttribute("style", "display:none");
    currID = newID;
    snippetHandle.innerHTML =
	`<p>${bpp_snippets[snippetIndex].content}</p>`;
    snippetHeaderHandle.innerHTML =
	`<h3>Snippet :: Shortcut: ${bpp_snippets[snippetIndex].tabTrigger}+[TAB]</h3>`;
    document.getElementById(newID).setAttribute("style", "display:block");
}

/* create event listeners for a click on each menu item in snippet tree */

// listen for click on "alphaprior" in tree
const alphapriorhandle = document.getElementById("alphaprior");
alphapriorhandle.addEventListener("click", () => {
    clickedOnTree("guialphaprior", CI.ALPHAPRIOR, currentSnippet);
});

// listen for click on "seed" in tree
const seedhandle = document.getElementById("seed");
seedhandle.addEventListener("click", () => {
    clickedOnTree("guiseed", CI.SEED, currentSnippet);
});

// listen for click on "usedata" in tree
const usedatahandle = document.getElementById("usedata");
usedatahandle.addEventListener("click", () => {
    clickedOnTree("guiusedata", CI.USEDATA, currentSnippet);
});

// listen for click on "outfile" in tree
const outfilehandle = document.getElementById("outfile");
outfilehandle.addEventListener("click", () => {
    clickedOnTree("guioutfile", CI.OUTFILE, currentSnippet);
});

// listen for click on "mcmcfile" in tree
const mcmcfilehandle = document.getElementById("mcmcfile");
mcmcfilehandle.addEventListener("click", () => {
    clickedOnTree("guimcmcfile", CI.MCMCFILE, currentSnippet);
});

// listen for click on "seqfile" in tree
const seqfilehandle = document.getElementById("seqfile");
seqfilehandle.addEventListener("click", () => {
    clickedOnTree("guiseqfile", CI.SEQFILE, currentSnippet);
});

// listen for click on "Imapfile" in tree
const Imapfilehandle = document.getElementById("Imapfile");
Imapfilehandle.addEventListener("click", () => {
    clickedOnTree("guiImapfile", CI.IMAPFILE, currentSnippet);
});

// listen for click on "print" in tree
const printhandle = document.getElementById("print");
printhandle.addEventListener("click", () => {
    clickedOnTree("guiprint", CI.PRINT, currentSnippet);
});

// listen for click on "burnin" in tree
const burninhandle = document.getElementById("burnin");
burninhandle.addEventListener("click", () => {
    clickedOnTree("guiburnin", CI.BURNIN, currentSnippet);
});

// listen for click on "sampfreq" in tree
const sampfreqhandle = document.getElementById("sampfreq");
sampfreqhandle.addEventListener("click", () => {
    clickedOnTree("guisampfreq", CI.SAMPFREQ, currentSnippet);
});

// listen for click on "nsample" in tree
const nsamplehandle = document.getElementById("nsample");
nsamplehandle.addEventListener("click", () => {
    clickedOnTree("guinsample", CI.NSAMPLE, currentSnippet);
});

// listen for click on "species&tree" in tree
const speciesandtreehandle = document.getElementById("speciesandtree");
speciesandtreehandle.addEventListener("click", () => {
    clickedOnTree("guispeciesandtree", CI.SPECIESANDTREE, currentSnippet);
});

// listen for click on "phase" in tree
const phasehandle = document.getElementById("phase");
phasehandle.addEventListener("click", () => {
    clickedOnTree("guiphase", CI.PHASE, currentSnippet);
});

// listen for click on "tauprior" in tree
const taupriorhandle = document.getElementById("tauprior");
taupriorhandle.addEventListener("click", () => {
    clickedOnTree("guitauprior", CI.TAUPRIOR, currentSnippet);
});

// listen for click on "thetaprior" in tree
const thetapriorhandle = document.getElementById("thetaprior");
thetapriorhandle.addEventListener("click", () => {
    clickedOnTree("guithetaprior", CI.THETAPRIOR, currentSnippet);
});

// listen for click on "finetune" in tree
const finetunehandle = document.getElementById("finetune");
finetunehandle.addEventListener("click", () => {
    clickedOnTree("guifinetune", CI.FINETUNE, currentSnippet);
});

// listen for click on "speciesdelimitation" in tree
const speciesdelimitationhandle = document.getElementById(
    "speciesdelimitation"
);
speciesdelimitationhandle.addEventListener("click", () => {
    clickedOnTree(
        "guispeciesdelimitation",
        CI.SPECIESDELIMITATION,
        currentSnippet
    );
});

// listen for click on "speciestree" in tree
const speciestreehandle = document.getElementById("speciestree");
speciestreehandle.addEventListener("click", () => {
    clickedOnTree("guispeciestree", CI.SPECIESTREE, currentSnippet);
});

// listen for click on "cleandata" in tree
const cleandatahandle = document.getElementById("cleandata");
cleandatahandle.addEventListener("click", () => {
    clickedOnTree("guicleandata", CI.CLEANDATA, currentSnippet);
});

// listen for click on "nloci" in tree
const nlocihandle = document.getElementById("nloci");
nlocihandle.addEventListener("click", () => {
    clickedOnTree("guinloci", CI.NLOCI, currentSnippet);
});

// listen for click on "model" in tree
const modelhandle = document.getElementById("model");
modelhandle.addEventListener("click", () => {
    clickedOnTree("guimodel", CI.MODEL, currentSnippet);
});

// listen for click on "locusrate" in tree
const locusratehandle = document.getElementById("locusrate");
locusratehandle.addEventListener("click", () => {
    clickedOnTree("guilocusrate", CI.LOCUSRATE, currentSnippet);
});

// listen for click on "clock" in tree
const clockhandle = document.getElementById("clock");
clockhandle.addEventListener("click", () => {
    clickedOnTree("guiclock", CI.CLOCK, currentSnippet);
});

// listen for click on "heredity" in tree
const heredityhandle = document.getElementById("heredity");
heredityhandle.addEventListener("click", () => {
    clickedOnTree("guiheredity", CI.HEREDITY, currentSnippet);
});

const sftitle = document.getElementById("snpfn");
sftitle.innerHTML = "";
var snp_file_name = "";
var snp_file_path = "";

/* create handles for snippet display area title and snippet code */
const snippetHandle = document.getElementById("snippetdisplay");
const snippetHeaderHandle = document.getElementById("snippetheader");

/* define a variable that is used to monitor for which variable the
   GUI window is currently displayed */
var currID = undefined;


// importing and saving snippets

ipcRenderer.on("savesnippet", (event, arg) => {
    ipcRenderer.send("snpsave", {
        csnippet: currentSnippet,
        sfpath: snp_file_path,
    });
});

ipcRenderer.on("saveassnippet", (event, arg) => {
    ipcRenderer.send("snpsaveas", {
        csnippet: currentSnippet,
        sfpath: snp_file_path,
    });
});

ipcRenderer.on("opensnippet", (event, arg) => {
    ipcRenderer.send("snpimport");
});

ipcRenderer.on("exportsnippet", (event, arg) => {
    let cfilestr = getCtrlFileStr();
    ipcRenderer.send("activate", cfilestr);
});

ipcRenderer.on("snpfilename", (event, arg) => {
    let match = [];
    snp_file_path = arg;
    match = Rstrip.exec(arg);
    snp_file_name = match[1];
    sftitle.innerHTML = `<p>:: Editing Snippet File => ${snp_file_name}</p>`;
});

ipcRenderer.on("opensnpfile", (event, arg) => {
    let match = [];
    try {
        let importSnippet = JSON.parse(arg.content);
        if (importSnippet.length != bpp_snippets_skeleton.length)
            throw "Number of snippets does not match. Not a snippet file?";
        snp_file_path = arg.path;
        match = Rstrip.exec(arg.path);
        snp_file_name = match[1];
        sftitle.innerHTML = `<p>:: Editing Snippet File => ${snp_file_name}</p>`;

        // update all snippet and snippet gui states
	applyIS(importSnippet,currID)
    } catch (e) {
        console.error(e);
        alert(`${snp_file_path} does not appear to be not a snippet file!`);
    }
});
