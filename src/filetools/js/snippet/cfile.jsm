// snippets for control file variables

// constant indexes for elements of bpp-snippet structure for use with ace
const snippetHandle = document.getElementById("snippetdisplay");
const dists = require("@stdlib/stats-base-dists");
import "https://unpkg.com/function-plot/dist/function-plot.js"
import { CFV_Ind, allCFVars, requiredCFVars, defaultCFVars, optionalCFVars } from "./globals.jsm"

// set default outfile name
const displayoutfilehandle = document.getElementById("displayoutfile");
// set default mcmcfile name
const displaymcmcfilehandle = document.getElementById("displaymcmcfile");
// set default seqfile name
const displayseqfilehandle = document.getElementById("displayseqfile");


const SPECIESMODELPRIOR = 14;
const NLOCI = 16;
const MODEL = 17;
const QRATES = 18;
const BASEFREQS = 19;
const ALPHAPRIOR = 20;
const CLEANDATA = 21;
const THETAPRIOR = 22;
const TAUPRIOR = 23;
const PHIPRIOR = 24;
const LOCUSRATE = 25;
const CLOCK = 26;
const HEREDITY = 27;
const CHECKPOINT = 28;
const CONSTRAINTFILE = 29;
const THREADS = 30;


let popNameArray = [];

// Function to modify a particular variable value and update bpp_snippets,
// and bppmap. Updated snippets are propagated to mainWindow
function modifyBPPSnippets(bppvarname, bppvarcontent, bppmap, bpp_snippets) {
  let reqVars = ["seed", "usedata", "outfile", "mcmcfile"];
  bppmap.set(bppvarname, bppvarcontent);
  for (let v in bpp_snippets)
    if (bpp_snippets[v].name === bppvarname)
      bpp_snippets[v].content = bppvarcontent;
  for (let v in bpp_snippets)
    if (bpp_snippets[v].name === "A00") {
      bpp_snippets[v].content = "";
      for (let i in reqVars)
        bpp_snippets[v].content += bppmap.get(reqVars[i]) + "\n";
    }
  ipcRenderer.send("updatesnippets", bpp_snippets);
}

// data structure to hold current finetune parameter values. Used to create updated snippet
let finetune_params = {
  Gage: 5.0,
  Gspr: 0.001,
  thet: 0.001,
  tau: 0.001,
  mix: 0.3,
  lrht: 0.33,
  phi: 0.001,
  pi: 0.1,
  qmat: 0.3,
  alfa: 0.1,
  mubr: 0.1,
  nubr: 0.1,
  mu_i: 0.1,
  nu_i: 0.1,
  brte: 0.1,
};

/* initializing variables */

// create an initial current snippet data structure
let currentSnippet = [];
bpp_snippets_skeleton.forEach((item) => {
  currentSnippet.push({ ...item });
}); // deep copy of snippet skeletion into currentSnippet

ipcRenderer.send("updatesnippets", currentSnippet);

let importSnippet = undefined;

// create an initial map of variable name to snippet
let bppVarMap = new Map();
for (let v in currentSnippet)
  bppVarMap.set(currentSnippet[v].name, currentSnippet[v].content);

// create an initial map of variable "modified" flag
let bppVarModMap = new Map();
for (let v in allCFVars) {
  let foundvar = "";
  if ((foundvar = requiredCFVars.find((str) => str === allCFVars[v])))
    bppVarModMap.set(foundvar, { content: "E", color: "red" });
  else if ((foundvar = defaultCFVars.find((str) => str === allCFVars[v])))
    bppVarModMap.set(foundvar, { content: "D", color: "blue" });
  else if ((foundvar = optionalCFVars.find((str) => str === allCFVars[v])))
    bppVarModMap.set(foundvar, { content: "@", color: "green" });
}

// function to update plots of priors
let f2
let alpha
let beta
let lowb
let upb
let maxY
let mean
let sdev

const updatePlot = function (slide1, slide2, distn, gtarget) {
    if (distn === "gamma") {
	alpha = Number(slide1.value);
	beta = Number(slide2.value);
	lowb = dists.gamma.quantile(0.01, alpha, beta);
	upb = dists.gamma.quantile(0.99, alpha, beta);
	maxY;
	if (alpha >= 1.0)
	    maxY = 1.0 + dists.gamma.pdf((alpha - 1.0) / beta, alpha, beta);
	else maxY = 1.0 + dists.gamma.pdf(lowb, alpha, beta);
	mean = dists.gamma.mean(alpha, beta);
	sdev = Math.sqrt(dists.gamma.variance(alpha, beta));
	f2 = function (x) {
	    return dists.gamma.pdf(x, alpha, beta);
	}
    } else if (distn === "invgamma") {
	alpha = Number(slide1.value);
	beta = Number(slide2.value);
	lowb = dists.invgamma.quantile(0.01, alpha, beta);
	upb = dists.invgamma.quantile(0.99, alpha, beta);
	maxY = 1.0 + dists.invgamma.pdf(beta / (alpha + 1.0), alpha, beta);
	mean = dists.invgamma.mean(alpha, beta);
	sdev = Math.sqrt(dists.invgamma.variance(alpha, beta));
	f2 = function (x) {
	    return dists.invgamma.pdf(x, alpha, beta);
	}
    }
    functionPlot({
	width: 480,
	height: 250,
	title: `Mean:${mean.toPrecision(2)} SD:${sdev.toPrecision(2)}`,
	xAxis: { domain: [lowb, upb] },
	yAxis: { domain: [0, maxY] },
	tip: { xLine: true },
	grid: true,
	target: gtarget,
	data: [
	    {
		fn: (scope) => f2(scope.x),
		graphType: "polyline",
	    },
	],
    });
};

/* initialize event listeners for snippet GUI interface */

// toggle modified indicator letter in tree menu item
function toggleModifiedFlag(varID, origFlag, flagID) {
  if (bppVarModMap.get(varID).content === origFlag) {
    document.getElementById(flagID).setAttribute("style", "color:yellow");
    document.getElementById(flagID).innerHTML = "U";
    bppVarModMap.set(varID, { content: "U", color: "yellow" });
  }
}

// listen for a change to usedata ON/OFF checkbox switch
const usedataOnOff = document.getElementById("usedatachk");
usedataOnOff.addEventListener("change", () => {
  if (usedataOnOff.checked) {
    document
      .getElementById("usedataOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("usedataOffMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets("usedata", "usedata = 1", bppVarMap, currentSnippet);
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.USEDATA].content}</p>`;
    toggleModifiedFlag("usedata", "D", "usedataL");
  } else {
    document
      .getElementById("usedataOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("usedataOnMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets("usedata", "usedata = 0", bppVarMap, currentSnippet);
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.USEDATA].content}</p>`;
    toggleModifiedFlag("usedata", "D", "usedataL");
  }
});

// hash of bool variables for print
let printMap = new Map();
printMap.set("mcmcsamples", 1);
printMap.set("locusrates", 0);
printMap.set("heredityscalars", 0);
printMap.set("genetrees", 0);
printMap.set("substitutionparameters", 0);

// listen for change to print (mcmcsampleschk)
const mcmcsamplesOnOff = document.getElementById("mcmcsampleschk");
const locusratesOnOff = document.getElementById("locusrateschk");
const heredityscalarsOnOff = document.getElementById("heredityscalarschk");
const genetreesOnOff = document.getElementById("genetreeschk");
const substitutionparametersOnOff = document.getElementById(
  "substitutionparameterschk"
);

mcmcsamplesOnOff.addEventListener("change", () => {
  if (mcmcsamplesOnOff.checked) {
    document
      .getElementById("mcmcsamplesOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("mcmcsamplesOffMsg")
      .setAttribute("style", "display: none");
    printMap.set("mcmcsamples", 1);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  } else {
    document
      .getElementById("mcmcsamplesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("mcmcsamplesOnMsg")
      .setAttribute("style", "display: none");
    printMap.set("mcmcsamples", 0);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  }
});

locusratesOnOff.addEventListener("change", () => {
  if (locusratesOnOff.checked) {
    document
      .getElementById("locusratesOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("locusratesOffMsg")
      .setAttribute("style", "display: none");
    printMap.set("locusrates", 1);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  } else {
    document
      .getElementById("locusratesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("locusratesOnMsg")
      .setAttribute("style", "display: none");
    printMap.set("locusrates", 0);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  }
});

heredityscalarsOnOff.addEventListener("change", () => {
  if (heredityscalarsOnOff.checked) {
    document
      .getElementById("heredityscalarsOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("heredityscalarsOffMsg")
      .setAttribute("style", "display: none");
    printMap.set("heredityscalars", 1);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  } else {
    document
      .getElementById("heredityscalarsOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("heredityscalarsOnMsg")
      .setAttribute("style", "display: none");
    printMap.set("heredityscalars", 0);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  }
});

genetreesOnOff.addEventListener("change", () => {
  if (genetreesOnOff.checked) {
    document
      .getElementById("genetreesOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("genetreesOffMsg")
      .setAttribute("style", "display: none");
    printMap.set("genetrees", 1);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  } else {
    document
      .getElementById("genetreesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("genetreesOnMsg")
      .setAttribute("style", "display: none");
    printMap.set("genetrees", 0);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  }
});

substitutionparametersOnOff.addEventListener("change", () => {
  if (substitutionparametersOnOff.checked) {
    document
      .getElementById("substitutionparametersOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("substitutionparametersOffMsg")
      .setAttribute("style", "display: none");
    printMap.set("substitutionparameters", 1);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  } else {
    document
      .getElementById("substitutionparametersOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("substitutionparametersOnMsg")
      .setAttribute("style", "display: none");
    printMap.set("substitutionparameters", 0);
    modifyBPPSnippets(
      "print",
      `print = ${printMap.get("mcmcsamples")} ${printMap.get(
        "locusrates"
      )} ${printMap.get("heredityscalars")} ${printMap.get(
        "genetrees"
      )} ${printMap.get("substitutionparameters")}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
    toggleModifiedFlag("print", "E", "printL");
  }
});

// listen for a change to burnin
const burnIn = document.getElementById("burninNo");
burnIn.addEventListener("change", () => {
  modifyBPPSnippets(
    "burnin",
    `burnin = ${burnIn.value}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.BURNIN].content}</p>`;
  toggleModifiedFlag("burnin", "E", "burninL");
});

// listen for a change to sampfreq
const sampFreq = document.getElementById("sampfreqNo");
sampFreq.addEventListener("change", () => {
  modifyBPPSnippets(
    "sampfreq",
    `sampfreq = ${sampFreq.value}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SAMPFREQ].content}</p>`;
  toggleModifiedFlag("sampfreq", "E", "sampfreqL");
});

// listen for a change to nsample
const nSample = document.getElementById("nsampleNo");
nSample.addEventListener("change", () => {
  modifyBPPSnippets(
    "nsample",
    `nsample = ${nSample.value}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.NSAMPLE].content}</p>`;
  toggleModifiedFlag("nsample", "E", "nsampleL");
});

// listen for a change to outfile text save button
const chooseOutfileText = document.getElementById("chooseoutfiletext");
const chooseOutfileSave = document.getElementById("chooseoutfilesave");
chooseOutfileSave.addEventListener("click", () => {
  displayoutfilehandle.innerHTML = `Current output file: ${chooseOutfileText.value}`;
  modifyBPPSnippets(
    "outfile",
    `outfile = ${chooseOutfileText.value}`,
    bppVarMap,
    currentSnippet
  );
  chooseOutfileText.value = "";
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.OUTFILE].content}</p>`;
  toggleModifiedFlag("outfile", "E", "outfileL");
});

// listen for a change to mcmcfile text save button
const chooseMCMCfileText = document.getElementById("choosemcmcfiletext");
const chooseMCMCfileSave = document.getElementById("choosemcmcfilesave");
chooseMCMCfileSave.addEventListener("click", () => {
  displaymcmcfilehandle.innerHTML = `Current MCMC output file: ${chooseMCMCfileText.value}`;
  modifyBPPSnippets(
    "mcmcfile",
    `mcmcfile = ${chooseMCMCfileText.value}`,
    bppVarMap,
    currentSnippet
  );
  chooseMCMCfileText.value = "";
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.MCMCFILE].content}</p>`;
  toggleModifiedFlag("mcmcfile", "E", "mcmcfileL");
});

// listen for a change to seqfile text save button
const chooseseqfileText = document.getElementById("chooseseqfiletext");
const chooseseqfileSave = document.getElementById("chooseseqfilesave");
chooseseqfileSave.addEventListener("click", () => {
  displayseqfilehandle.innerHTML = `Current sequence data file: ${chooseseqfileText.value}`;
  modifyBPPSnippets(
    "seqfile",
    `seqfile = ${chooseseqfileText.value}`,
    bppVarMap,
    currentSnippet
  );
  chooseseqfileText.value = "";
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SEQFILE].content}</p>`;
  toggleModifiedFlag("seqfile", "E", "seqfileL");
});

// listen for a change to seed radio buttons
const radioButtons = document.getElementById("sr1");
radioButtons.addEventListener("change", () => {
  if (svalue.checked) {
    seedScroll.setAttribute("style", "display:block");
    modifyBPPSnippets(
      "seed",
      `seed = ${document.getElementById("sscroll").value}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SEED].content}</p>`;
    toggleModifiedFlag("seed", "D", "seedL");
  } else {
    seedScroll.setAttribute("style", "display:none");
    modifyBPPSnippets("seed", "seed = -1", bppVarMap, currentSnippet);
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SEED].content}</p>`;
    toggleModifiedFlag("seed", "D", "seedL");
  }
});

// listen for a change to scroll of seed number
const seedScroll = document.getElementById("seedscroll");
seedScroll.addEventListener("input", (e) => {
  modifyBPPSnippets(
    "seed",
    `seed = ${e.target.value}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SEED].content}</p>`;
  toggleModifiedFlag("seed", "D", "seedL");
});

// listen for a change to sliders or text inputs for tauprior alpha and beta
const tau_alphaslider = document.getElementById("taualphaslider");
const tau_betaslider = document.getElementById("taubetaslider");
const tau_alphatext = document.getElementById("taualphatext");
const tau_betatext = document.getElementById("taubetatext");

// initialize plot of tauprior to default values
tau_alphaslider.value = 1.0;
tau_betaslider.value = 100.0;
tau_alphatext.value = 1.0;
tau_betatext.value = 100.0;
updatePlot(tau_alphaslider, tau_betaslider, "gamma", "#taupriorgraph");

// update snippets for tauprior
let updateTauprior = function () {
  modifyBPPSnippets(
    "tauprior",
    `tauprior = gamma ${Number(tau_alphaslider.value).toFixed(2)} ${Number(
      tau_betaslider.value
    ).toFixed(2)}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[TAUPRIOR].content}</p>`;
  toggleModifiedFlag("tauprior", "E", "taupriorL");
};

// update plot and snippets for tauprior when tau_alphaslider changes
tau_alphaslider.oninput = function () {
  tau_alphatext.value = tau_alphaslider.value;
  updatePlot(tau_alphaslider, tau_betaslider, "gamma", "#taupriorgraph");
  updateTauprior();
};

// update plot and snippets for tauprior when tau_betaslider changes
tau_betaslider.oninput = function () {
  tau_betatext.value = tau_betaslider.value;
  updatePlot(tau_alphaslider, tau_betaslider, "gamma", "#taupriorgraph");
  updateTauprior();
};

// update plot and snippets for tauprior when tau_alphatext changes
tau_alphatext.oninput = function () {
  tau_alphaslider.value = tau_alphatext.value;
  updatePlot(tau_alphaslider, tau_betaslider, "gamma", "#taupriorgraph");
  updateTauprior();
};

// update plot and snippets for tauprior when tau_betatext changes
tau_betatext.oninput = function () {
  tau_betaslider.value = tau_betatext.value;
  updatePlot(tau_alphaslider, tau_betaslider, "gamma", "#taupriorgraph");
  updateTauprior();
};

// listen for a change to sliders or text inputs for alphaprior alpha,  beta and ncat
const alpha_alphaslider = document.getElementById("alphaalphaslider");
const alpha_betaslider = document.getElementById("alphabetaslider");
const alpha_alphatext = document.getElementById("alphaalphatext");
const alpha_betatext = document.getElementById("alphabetatext");
const alpha_ncattext = document.getElementById("ncattext");

// initialize plot of alphaprior to default values
alpha_alphaslider.value = 1.0;
alpha_betaslider.value = 1.0;
alpha_alphatext.value = 1.0;
alpha_betatext.value = 1.0;
alpha_ncattext.value = 4;
updatePlot(alpha_alphaslider, alpha_betaslider, "gamma", "#alphapriorgraph");

// update snippets for alphaprior
let updateAlphaprior = function () {
  modifyBPPSnippets(
    "alphaprior",
    `alphaprior = ${Number(alpha_alphaslider.value).toFixed(2)} ${Number(
      alpha_betaslider.value
    ).toFixed(2)} ${Number(alpha_ncattext.value).toFixed(0)}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[ALPHAPRIOR].content}</p>`;
  toggleModifiedFlag("alphaprior", "D", "alphapriorL");
};

// update plot and snippets for alphaprior when alpha_alphaslider changes
alpha_alphaslider.oninput = function () {
  alpha_alphatext.value = alpha_alphaslider.value;
  updatePlot(alpha_alphaslider, alpha_betaslider, "gamma", "#alphapriorgraph");
  updateAlphaprior();
};

// update plot and snippets for alphaprior when alpha_betaslider changes
alpha_betaslider.oninput = function () {
  alpha_betatext.value = alpha_betaslider.value;
  updatePlot(alpha_alphaslider, alpha_betaslider, "gamma", "#alphapriorgraph");
  updateAlphaprior();
};

// update plot and snippets for alphaprior when alpha_alphatext changes
alpha_alphatext.oninput = function () {
  alpha_alphaslider.value = alpha_alphatext.value;
  updatePlot(alpha_alphaslider, alpha_betaslider, "gamma", "#alphapriorgraph");
  updateAlphaprior();
};

// update plot and snippets for alphaprior when alpha_betatext changes
alpha_betatext.oninput = function () {
  alpha_betaslider.value = alpha_betatext.value;
  updatePlot(alpha_alphaslider, alpha_betaslider, "gamma", "#alphapriorgraph");
  updateAlphaprior();
};

// update snippets for alphaprior when alpha_ncattext changes
alpha_ncattext.oninput = function () {
  updateAlphaprior();
};

// theta prior variables
let currentThetaPrior = "gamma";
let currentThetaAnalytical = "e";
let thetabetamean;
let thetabetavar;
// calculate mean of 4 parameter beta distn
let tbm = function (min, max, alpha, beta) {
  return (alpha * max + beta * min) / (alpha + beta);
};
// calculate var of 4 parameter beta distn
let tbv = function (min, max, alpha, beta) {
  return (
    (alpha * beta * (max - min) * (max - min)) /
    ((alpha + beta) * (alpha + beta) * (alpha + beta + 1.0))
  );
};

// listen for a change to theta prior distribution model
const ThetaGammaPriorBox = document.getElementById("thetagammapriorbox");
const ThetaInvGammaPriorBox = document.getElementById("thetainvgammapriorbox");
const ThetaBetaPriorBox = document.getElementById("thetabetapriorbox");

const gamma_theta = document.getElementById("gammatheta");
const invgamma_theta = document.getElementById("invgammatheta");
const beta_theta = document.getElementById("betatheta");

const analytical_check = document.getElementById("analyticalchk");

gamma_theta.onchange = function () {
  currentThetaPrior = "gamma";
  ThetaGammaPriorBox.setAttribute("style", "display: block");
  ThetaInvGammaPriorBox.setAttribute("style", "display: none");
  ThetaBetaPriorBox.setAttribute("style", "display: none");
  updateThetaprior();
};

invgamma_theta.onchange = function () {
  currentThetaPrior = "invgamma";
  ThetaInvGammaPriorBox.setAttribute("style", "display: block");
  ThetaGammaPriorBox.setAttribute("style", "display: none");
  ThetaBetaPriorBox.setAttribute("style", "display: none");
  updateThetaprior();
};

beta_theta.onchange = function () {
  currentThetaPrior = "beta";
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  ThetaBetaPriorBox.setAttribute("style", "display: block");
  ThetaInvGammaPriorBox.setAttribute("style", "display: none");
  ThetaGammaPriorBox.setAttribute("style", "display: none");
  updateThetaprior();
};

analytical_check.addEventListener("change", () => {
  if (analyticalchk.checked) {
    document
      .getElementById("analyticalOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("analyticalOffMsg")
      .setAttribute("style", "display: none");
    currentThetaAnalytical = "";
    updateThetaprior();
  } else {
    document
      .getElementById("analyticalOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("analyticalOnMsg")
      .setAttribute("style", "display: none");
    currentThetaAnalytical = "e";
    updateThetaprior();
  }
});

// listen for changes to prior parameter sliders and text boxes
const theta_gamma_alpha_slider = document.getElementById(
  "thetagammaalphaslider"
);
const theta_gamma_beta_slider = document.getElementById("thetagammabetaslider");
const theta_invgamma_alpha_slider = document.getElementById(
  "thetainvgammaalphaslider"
);
const theta_invgamma_beta_slider = document.getElementById(
  "thetainvgammabetaslider"
);
const theta_gamma_alpha_text = document.getElementById("thetagammaalphatext");
const theta_gamma_beta_text = document.getElementById("thetagammabetatext");
const theta_invgamma_alpha_text = document.getElementById(
  "thetainvgammaalphatext"
);
const theta_invgamma_beta_text = document.getElementById(
  "thetainvgammabetatext"
);
const theta_beta_alpha_slider = document.getElementById("thetabetaalphaslider");
const theta_beta_alpha_text = document.getElementById("thetabetaalphatext");
const theta_beta_beta_slider = document.getElementById("thetabetabetaslider");
const theta_beta_beta_text = document.getElementById("thetabetabetatext");
const theta_beta_min_slider = document.getElementById("thetabetaminslider");
const theta_beta_min_text = document.getElementById("thetabetamintext");
const theta_beta_max_slider = document.getElementById("thetabetamaxslider");
const theta_beta_max_text = document.getElementById("thetabetamaxtext");
const tb_meanvar = document.getElementById("tbmeanvar");

// initialize plot of theta gamma prior to default values
theta_gamma_alpha_slider.value = 1.0;
theta_gamma_beta_slider.value = 100.0;
theta_gamma_alpha_text.value = 1.0;
theta_gamma_beta_text.value = 100.0;
updatePlot(
  theta_gamma_alpha_slider,
  theta_gamma_beta_slider,
  "gamma",
  "#thetagammagraph"
);

// initialize plot of theta invgamma prior to default values
theta_invgamma_alpha_slider.value = 3.0;
theta_invgamma_beta_slider.value = 1.0;
theta_invgamma_alpha_text.value = 3.0;
theta_invgamma_beta_text.value = 1.0;
updatePlot(
  theta_invgamma_alpha_slider,
  theta_invgamma_beta_slider,
  "invgamma",
  "#thetainvgammagraph"
);

// initialize theta beta prior parameters to default values
theta_beta_alpha_slider.value = 1.0;
theta_beta_alpha_text.value = 1.0;
theta_beta_beta_slider.value = 2.0;
theta_beta_beta_text.value = 2.0;
theta_beta_min_slider.value = 0.00001;
theta_beta_min_text.value = 0.00001;
theta_beta_max_slider.value = 0.01;
theta_beta_max_text.value = 0.01;
thetabetamean = tbm(
  Number(theta_beta_min_slider.value),
  Number(theta_beta_max_slider.value),
  Number(theta_beta_alpha_slider.value),
  Number(theta_beta_beta_slider.value)
);

// update snippets for thetaprior
let updateThetaprior = function () {
  if (currentThetaPrior === "gamma") {
    modifyBPPSnippets(
      "thetaprior",
      `thetaprior = ${currentThetaPrior} ${Number(
        theta_gamma_alpha_slider.value
      ).toFixed(2)} ${Number(theta_gamma_beta_slider.value).toFixed(2)}`,
      bppVarMap,
      currentSnippet
    );
  } else if (currentThetaPrior === "invgamma") {
    modifyBPPSnippets(
      "thetaprior",
      `thetaprior = ${currentThetaPrior} ${Number(
        theta_invgamma_alpha_slider.value
      ).toFixed(2)} ${Number(theta_invgamma_beta_slider.value).toFixed(
        2
      )} ${currentThetaAnalytical}`,
      bppVarMap,
      currentSnippet
    );
  } else if (currentThetaPrior === "beta") {
    modifyBPPSnippets(
      "thetaprior",
      `thetaprior = ${currentThetaPrior} ${Number(
        theta_beta_alpha_slider.value
      ).toFixed(3)} ${Number(theta_beta_beta_slider.value).toFixed(3)} ${Number(
        theta_beta_min_slider.value
      )} ${Number(theta_beta_max_slider.value)}`,
      bppVarMap,
      currentSnippet
    );
  }
  snippetHandle.innerHTML = `<p>${currentSnippet[THETAPRIOR].content}</p>`;
  toggleModifiedFlag("thetaprior", "E", "thetapriorL");
};

theta_gamma_alpha_slider.oninput = function () {
  theta_gamma_alpha_text.value = theta_gamma_alpha_slider.value;
  updatePlot(
    theta_gamma_alpha_slider,
    theta_gamma_beta_slider,
    "gamma",
    "#thetagammagraph"
  );
  updateThetaprior();
};

theta_gamma_alpha_text.oninput = function () {
  theta_gamma_alpha_slider.value = theta_gamma_alpha_text.value;
  updatePlot(
    theta_gamma_alpha_slider,
    theta_gamma_beta_slider,
    "gamma",
    "#thetagammagraph"
  );
  updateThetaprior();
};

theta_gamma_beta_slider.oninput = function () {
  theta_gamma_beta_text.value = theta_gamma_beta_slider.value;
  updatePlot(
    theta_gamma_alpha_slider,
    theta_gamma_beta_slider,
    "gamma",
    "#thetagammagraph"
  );
  updateThetaprior();
};

theta_gamma_beta_text.oninput = function () {
  theta_gamma_beta_slider.value = theta_gamma_beta_text.value;
  updatePlot(
    theta_gamma_alpha_slider,
    theta_gamma_beta_slider,
    "gamma",
    "#thetagammagraph"
  );
  updateThetaprior();
};

theta_invgamma_alpha_slider.oninput = function () {
  theta_invgamma_alpha_text.value = theta_invgamma_alpha_slider.value;
  updatePlot(
    theta_invgamma_alpha_slider,
    theta_invgamma_beta_slider,
    "invgamma",
    "#thetainvgammagraph"
  );
  updateThetaprior();
};

theta_invgamma_alpha_text.oninput = function () {
  theta_invgamma_alpha_slider.value = theta_invgamma_alpha_text.value;
  updatePlot(
    theta_invgamma_alpha_slider,
    theta_invgamma_beta_slider,
    "invgamma",
    "#thetainvgammagraph"
  );
  updateThetaprior();
};

theta_invgamma_beta_slider.oninput = function () {
  theta_invgamma_beta_text.value = theta_invgamma_beta_slider.value;
  updatePlot(
    theta_invgamma_alpha_slider,
    theta_invgamma_beta_slider,
    "invgamma",
    "#thetainvgammagraph"
  );
  updateThetaprior();
};

theta_invgamma_beta_text.oninput = function () {
  theta_invgamma_beta_slider.value = theta_invgamma_beta_text.value;
  updatePlot(
    theta_invgamma_alpha_slider,
    theta_invgamma_beta_slider,
    "invgamma",
    "#thetainvgammagraph"
  );
  updateThetaprior();
};

theta_beta_alpha_slider.oninput = function () {
  theta_beta_alpha_text.value = theta_beta_alpha_slider.value;
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_alpha_text.oninput = function () {
  theta_beta_alpha_slider.value = theta_beta_alpha_text.value;
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_beta_slider.oninput = function () {
  theta_beta_beta_text.value = theta_beta_beta_slider.value;
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_beta_text.oninput = function () {
  theta_beta_beta_slider.value = theta_beta_beta_text.value;
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_min_slider.oninput = function () {
  theta_beta_min_text.value = theta_beta_min_slider.value;
  if (theta_beta_min_slider.value > theta_beta_max_slider.value) {
    theta_beta_max_slider.value = theta_beta_min_slider.value;
    theta_beta_max_text.value = theta_beta_min_slider.value;
  }
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_min_text.oninput = function () {
  theta_beta_min_slider.value = theta_beta_min_text.value;
  if (theta_beta_min_slider.value > theta_beta_max_slider.value) {
    theta_beta_max_slider.value = theta_beta_min_slider.value;
    theta_beta_max_text.value = theta_beta_min_slider.value;
  }
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_max_slider.oninput = function () {
  theta_beta_max_text.value = theta_beta_max_slider.value;
  if (theta_beta_max_slider.value < theta_beta_min_slider.value) {
    theta_beta_min_slider.value = theta_beta_max_slider.value;
    theta_beta_min_text.value = theta_beta_max_slider.value;
  }
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

theta_beta_max_text.oninput = function () {
  theta_beta_max_slider.value = theta_beta_max_text.value;
  if (theta_beta_max_slider.value < theta_beta_min_slider.value) {
    theta_beta_min_slider.value = theta_beta_max_slider.value;
    theta_beta_min_text.value = theta_beta_max_slider.value;
  }
  thetabetamean = tbm(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  thetabetavar = tbv(
    Number(theta_beta_min_slider.value),
    Number(theta_beta_max_slider.value),
    Number(theta_beta_alpha_slider.value),
    Number(theta_beta_beta_slider.value)
  );
  tb_meanvar.innerHTML = `<p>Mean: ${thetabetamean.toFixed(
    9
  )} SDev: ${Math.sqrt(thetabetavar).toFixed(9)}</p>`;
  updateThetaprior();
};

// listen for click on Imapfileopenbutton and update snippets
let rawimapfile = "";
let imapfilepath = "";
const ImapReader = new FileReader();
const Imapcontentshandle = document.getElementById("imapcontents");
const satTreehandle = document.getElementById("satTree");
const randomTreehandle = document.getElementById("randomTree");
const speciesandtreedetailshandle = document.getElementById(
  "speciesandtreedetails"
);
const phasedetailshandle = document.getElementById("phasedetails");

function createSpeciesAndTreeSnippet() {
  let SATSnippet = "";
  popNameArray = [];
  let treestring = "               ";
  SATSnippet += `${currSpecMapFileHash.size} `;
  for (let [key, value] of currSpecMapFileHash) {
    SATSnippet += `${key} `;
    popNameArray.push(`${key}`);
  }
  SATSnippet += "\n               ";
  for (let [key, value] of currSpecMapFileHash) {
    SATSnippet += `${value} `;
  }
  let rTree = randomTree(popNameArray);
  treestring += newickFromTree(rTree);
  treestring += ";";
  SATSnippet += "\n";
  SATSnippet += treestring;
  return SATSnippet;
}

function createPhaseSnippet() {
  let phaseSnippet = "";
  for (let [key, value] of currSpecMapFileHash) {
    phaseSnippet += " 0";
  }
  return phaseSnippet;
}

// update Imapfile and species&tree + phase snippets after file is successfully opened
ImapReader.onload = (res) => {
  let popNameArray = [];
  rawimapfile = res.target.result;
  mapFileparser(rawimapfile, imapfilepath);
  Imapcontentshandle.setAttribute("style", "display: block");
  Imapcontentshandle.innerHTML = currSpecMapFileTable;
  // update species&tree
  let speciesandtreesnippet = createSpeciesAndTreeSnippet();
  speciesandtreedetailshandle.innerHTML = `<p>Using Imap file: ${
    imapfilepath.name
  }<p>
    <p>${speciesandtreesnippet.split("\n")[0]}<p>
    <p>${speciesandtreesnippet.split("\n")[1]}<p>
    <p>${speciesandtreesnippet.split("\n")[2]}<p>`;
  satTreehandle.setAttribute("style", "display: block");
  // update phase
  let phasesnippet = createPhaseSnippet();
  phasedetailshandle.innerHTML = `<p>A Test!</p>`;
  for (let [key, value] of currSpecMapFileHash) {
    popNameArray.push(`${key}`);
  }
  const phaseHeader = "<p>Status&nbsp;&nbsp;&nbsp;PopulationID</p>";
  const html = popNameArray
    .map(
      (
        popNameArray
      ) => `<div><span id="phase-${popNameArray}">Unphased</span><label for="popNameArray-${popNameArray}">
                <input type="checkbox" name="sp" id="species-${popNameArray}" value="${popNameArray}"> ${popNameArray}
            </label></div>`
    )
    .join(" ");
  document.querySelector("#phasedetails").innerHTML = phaseHeader + html;
  const cb = document.getElementsByName("sp");
  cb.forEach((element) => element.addEventListener("click", phaseSwitch));

  function phaseSwitch() {
    let str1 = "";
    let x;
    cb.forEach((element) => {
      x = element.checked ? 1 : 0;
      str1 += x.toString() + " ";
      phasesnippet = str1;
      modifyBPPSnippets(
        "phase",
        `phase = ${phasesnippet}`,
        bppVarMap,
        currentSnippet
      );
      snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PHASE].content}</p>`;
      toggleModifiedFlag("phase", "D", "phaseL");
      if (element.checked)
        document.getElementById(`phase-${element.value}`).innerHTML =
          "Phased&nbsp;&nbsp;";
      else
        document.getElementById(`phase-${element.value}`).innerHTML =
          "Unphased";
    });
  }
  console.log(popNameArray);
  // update all snippets
  modifyBPPSnippets(
    "species&tree",
    `species&tree = ${speciesandtreesnippet}`,
    bppVarMap,
    currentSnippet
  );
  modifyBPPSnippets(
    "Imapfile",
    `Imapfile = ${imapfilepath.path}`,
    bppVarMap,
    currentSnippet
  );
  modifyBPPSnippets(
    "phase",
    `phase = ${phasesnippet}`,
    bppVarMap,
    currentSnippet
  );

  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESANDTREE].content}</p>`;
  toggleModifiedFlag("species&tree", "E", "speciesandtreeL");
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.IMAPFILE].content}</p>`;
  toggleModifiedFlag("Imapfile", "E", "ImapfileL");
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PHASE].content}</p>`;
  toggleModifiedFlag("phase", "D", "phaseL");
};

ImapReader.onerror = (err) => alert(`Error reading Imap file: ${err}`);

randomTreehandle.addEventListener("click", () => {
  let rTree = randomTree(popNameArray);
  let treestring = "               ";
  treestring += newickFromTree(rTree);
  treestring += ";";
  let newsnippet =
    bppVarMap.get("species&tree").split("\n")[0] +
    "\n" +
    bppVarMap.get("species&tree").split("\n")[1] +
    "\n" +
    treestring;
  modifyBPPSnippets("species&tree", `${newsnippet}`, bppVarMap, currentSnippet);
  speciesandtreedetailshandle.innerHTML = `<p>Using Imap file: ${
    imapfilepath.name
  }<p>
  <p>${newsnippet.split("\n")[0].split("=")[1]}<p>
  <p>${newsnippet.split("\n")[1]}<p>
  <p>${newsnippet.split("\n")[2]}<p>`;

  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESANDTREE].content}</p>`;
});

const currImapfileHandle = document.getElementById("ImapfileInput");
currImapfileHandle.addEventListener("change", getFile, false);

function getFile() {
  imapfilepath = this.files[0];
  ImapReader.readAsText(imapfilepath);
}

// listen for a change to speciesdelimitation ON/OFF checkbox switch
const speciesdelimitationOnOff = document.getElementById("delimitspecieschk");
speciesdelimitationOnOff.addEventListener("change", () => {
  if (speciesdelimitationOnOff.checked) {
    document
      .getElementById("delimitspeciesOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("delimitspeciesOffMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets(
      "speciesdelimitation",
      "speciesdelimitation = 1",
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESDELIMITATION].content}</p>`;
    toggleModifiedFlag("speciesdelimitation", "D", "speciesdelimitationL");
  } else {
    document
      .getElementById("delimitspeciesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("delimitspeciesOnMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets(
      "speciesdelimitation",
      "speciesdelimitation = 0",
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESDELIMITATION].content}</p>`;
    toggleModifiedFlag("speciesdelimitation", "D", "speciesdelimitationL");
  }
});

// listen for a change to speciestree ON/OFF checkbox switch
const speciestreeOnOff = document.getElementById("speciestreechk");
speciestreeOnOff.addEventListener("change", () => {
  if (speciestreeOnOff.checked) {
    document
      .getElementById("speciestreeOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("speciestreeOffMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets(
      "speciestree",
      "speciestree = 1",
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESTREE].content}</p>`;
    toggleModifiedFlag("speciestree", "D", "speciestreeL");
  } else {
    document
      .getElementById("speciestreeOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("speciestreeOnMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets(
      "speciestree",
      "speciestree = 0",
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESTREE].content}</p>`;
    toggleModifiedFlag("speciestree", "D", "speciestreeL");
  }
});

// listen for a change to cleandata ON/OFF checkbox switch
const cleandataOnOff = document.getElementById("cleandatachk");
cleandataOnOff.addEventListener("change", () => {
  if (cleandataOnOff.checked) {
    document
      .getElementById("cleandataOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("cleandataOffMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets("cleandata", "cleandata = 1", bppVarMap, currentSnippet);
    snippetHandle.innerHTML = `<p>${currentSnippet[CLEANDATA].content}</p>`;
    toggleModifiedFlag("cleandata", "D", "cleandataL");
  } else {
    document
      .getElementById("cleandataOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("cleandataOnMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets("cleandata", "cleandata = 0", bppVarMap, currentSnippet);
    snippetHandle.innerHTML = `<p>${currentSnippet[CLEANDATA].content}</p>`;
    toggleModifiedFlag("cleandata", "D", "cleandataL");
  }
});

// listen for a change to nloci
const nLoci = document.getElementById("nlociVal");
nLoci.addEventListener("change", () => {
  modifyBPPSnippets(
    "nloci",
    `nloci = ${nLoci.value}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[NLOCI].content}</p>`;
  toggleModifiedFlag("nloci", "D", "nlociL");
});

// listen for a change to finetune ON/OFF checkbox switch
let ftuneOn = 1;
const finetuneOnOff = document.getElementById("finetunechk");
finetuneOnOff.addEventListener("change", () => {
  if (finetuneOnOff.checked) {
    ftuneOn = 1;
    document
      .getElementById("finetuneOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("finetuneOffMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets(
      "finetune",
      `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
    toggleModifiedFlag("finetune", "D", "finetuneL");
  } else {
    ftuneOn = 0;
    document
      .getElementById("finetuneOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("finetuneOnMsg")
      .setAttribute("style", "display: none");
    modifyBPPSnippets(
      "finetune",
      `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
      bppVarMap,
      currentSnippet
    );
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
    toggleModifiedFlag("finetune", "D", "finetuneL");
  }
});

// listen for changes to locusrate and update
let currentLocusRates = 0;
let mean_meanrate = 1;
let var_meanrate = 1;
let prior_locusrate = "iid";

// choose constant, estimated or specified rates
const VarSpecifiedRates = document.getElementById("varspecifiedrates");
const VarEstimatedRates = document.getElementById("varestimatedrates");
const ConstantRates = document.getElementById("constantrates");

const ConstantRatesChoice = document.getElementById("Varconstantrateschoice");
const VarEstimatedRatesChoice = document.getElementById(
  "Varestimatedrateschoice"
);
const VarSpecifiedRatesChoice = document.getElementById(
  "Varspecifiedrateschoice"
);

ConstantRates.addEventListener("change", () => {
  VarSpecifiedRatesChoice.setAttribute("style", "display: none");
  ConstantRatesChoice.setAttribute("style", "display: inline-block");
  VarEstimatedRatesChoice.setAttribute("style", "display: none");
  currentLocusRates = 0;
  updateLocusrateSnippets();
});

VarEstimatedRates.addEventListener("change", () => {
  VarSpecifiedRatesChoice.setAttribute("style", "display: none");
  ConstantRatesChoice.setAttribute("style", "display: none");
  VarEstimatedRatesChoice.setAttribute("style", "display: inline-block");
  currentLocusRates = "1 1.0 1.0 1.0 iid";
  updateLocusrateSnippets();
});

VarSpecifiedRates.addEventListener("change", () => {
  VarSpecifiedRatesChoice.setAttribute("style", "display: inline-block");
  ConstantRatesChoice.setAttribute("style", "display: none");
  VarEstimatedRatesChoice.setAttribute("style", "display: none");
  currentLocusRates = "2 locusrates.txt";
  updateLocusrateSnippets();
});

// listen for a change to Specified rates text save button
const chooseSpecifiedRatesfileText = document.getElementById(
  "choosevarsrfiletext"
);
const chooseSpecifiedRatesfileSave = document.getElementById(
  "choosevarsrfilesave"
);
chooseSpecifiedRatesfileSave.addEventListener("click", () => {
  currentLocusRates = `2 ${chooseSpecifiedRatesfileText.value}`;
  updateLocusrateSnippets();
});

// listen for a change to sliders or text inputs for meanrate alpha and beta
const meanrate_alphaslider = document.getElementById("meanratealphaslider");
const meanrate_betaslider = document.getElementById("meanratebetaslider");
const meanrate_alphatext = document.getElementById("meanratealphatext");
const meanrate_betatext = document.getElementById("meanratebetatext");
const locus_alphatext = document.getElementById("locusalphatext");
const locus_alphaslider = document.getElementById("locusalphaslider");

const meanVarMu = document.getElementById("meanvarmu");
const iidLocusPrior = document.getElementById("locusiidprior");
const dirLocusPrior = document.getElementById("locusdirprior");

// update plot and snippets for meanrate prior when meanrate_alphaslider changes
meanrate_alphaslider.oninput = function () {
  meanrate_alphatext.value = meanrate_alphaslider.value;
  mean_meanrate = meanrate_alphatext.value / meanrate_betatext.value;
  var_meanrate =
    meanrate_alphatext.value /
    (meanrate_betatext.value * meanrate_betatext.value);
  meanVarMu.innerHTML = `Mean: ${mean_meanrate.toFixed(
    6
  )} Var: ${var_meanrate.toFixed(6)}`;
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
};

// update plot and snippets for meanrate prior when meanrate_alphatext changes
meanrate_alphatext.oninput = function () {
  meanrate_alphaslider.value = meanrate_alphatext.value;
  mean_meanrate = meanrate_alphatext.value / meanrate_betatext.value;
  var_meanrate =
    meanrate_alphatext.value /
    (meanrate_betatext.value * meanrate_betatext.value);
  meanVarMu.innerHTML = `Mean: ${mean_meanrate.toFixed(
    6
  )} Var: ${var_meanrate.toFixed(6)}`;
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
};

// update plot and snippets for meanrate prior when meanrate_betaslider changes
meanrate_betaslider.oninput = function () {
  meanrate_betatext.value = meanrate_betaslider.value;
  mean_meanrate = meanrate_alphatext.value / meanrate_betatext.value;
  var_meanrate =
    meanrate_alphatext.value /
    (meanrate_betatext.value * meanrate_betatext.value);
  meanVarMu.innerHTML = `Mean: ${mean_meanrate.toFixed(
    6
  )} Var: ${var_meanrate.toFixed(6)}`;
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
};

// update plot and snippets for meanrate prior when meanrate_betatext changes
meanrate_betatext.oninput = function () {
  meanrate_betaslider.value = meanrate_betatext.value;
  mean_meanrate = meanrate_alphatext.value / meanrate_betatext.value;
  var_meanrate =
    meanrate_alphatext.value /
    (meanrate_betatext.value * meanrate_betatext.value);
  meanVarMu.innerHTML = `Mean: ${mean_meanrate.toFixed(
    6
  )} Var: ${var_meanrate.toFixed(6)}`;
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
};

locus_alphatext.oninput = function () {
  locus_alphaslider.value = locus_alphatext.value;
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
};

locus_alphaslider.oninput = function () {
  locus_alphatext.value = locus_alphaslider.value;
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
};

iidLocusPrior.addEventListener("change", () => {
  prior_locusrate = "iid";
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
});

dirLocusPrior.addEventListener("change", () => {
  prior_locusrate = "dir";
  currentLocusRates = `1 ${meanrate_alphatext.value} ${meanrate_betatext.value} ${locus_alphatext.value} ${prior_locusrate}`;
  updateLocusrateSnippets();
});

// update snippets for a new locusrate choice
function updateLocusrateSnippets() {
  modifyBPPSnippets(
    "locusrate",
    `locusrate = ${currentLocusRates}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[LOCUSRATE].content}</p>`;
  toggleModifiedFlag("locusrate", "D", "locusrateL");
}

// listen for changes to clock and update
let currentClockVars
let currentClock = 1;
let mean_lineagemeanrate = 0.001;
let var_lineagemeanrate = 0.001;
let prior_locusclockvar = "dir";
let lineagerates_model = "G";

// choose strict clock, variable iid or variable autocorrelated
const StrictClock = document.getElementById("strictclock");
const VariableIID = document.getElementById("variableiid");
const VariableAuto = document.getElementById("variableauto");

const StrictClockChoice = document.getElementById("Varstrictclockchoice");
const VarClockChoice = document.getElementById("Varvarclockchoice");

// choose prior for variance of clock among loci
const ClockLocusIID = document.getElementById("clocklocusiid");
const ClockLocusDir = document.getElementById("clocklocusdir");

// choose distribution for among lineage rates
const LineageGammaPrior = document.getElementById("lineagegammaprior");
const LineageLNPrior = document.getElementById("lineageLNprior");

// listen for a change to sliders or text inputs for lineagemeanrate alpha and beta
const lineagemeanrate_alphaslider = document.getElementById(
  "lineagemeanratealphaslider"
);
const lineagemeanrate_alphatext = document.getElementById(
  "lineagemeanratealphatext"
);
const lineagemeanrate_betaslider = document.getElementById(
  "lineagemeanratebetaslider"
);
const lineagemeanrate_betatext = document.getElementById(
  "lineagemeanratebetatext"
);

const concentration_slider = document.getElementById("concentrationslider");
const concentration_text = document.getElementById("concentrationtext");

const lineagemeanVarMu = document.getElementById("lineagemeanvarmu");

StrictClock.addEventListener("change", () => {
    StrictClockChoice.setAttribute("style", "display: inline-block");
    VarClockChoice.setAttribute("style", "display: none");
    currentClock = 1;
    currentClockVars = `${currentClock}`;
    updateClockSnippets();
});

VariableIID.addEventListener("change", () => {
    StrictClockChoice.setAttribute("style", "display: none");
    VarClockChoice.setAttribute("style", "display: inline-block");
    currentClock = 2;
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
    updateClockSnippets();
});

VariableAuto.addEventListener("change", () => {
    StrictClockChoice.setAttribute("style", "display: none");
    VarClockChoice.setAttribute("style", "display: inline-block");
    currentClock = 3;
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
    updateClockSnippets();
});

ClockLocusIID.addEventListener("change", () => {
    prior_locusclockvar = "iid";
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
    updateClockSnippets();
});

ClockLocusDir.addEventListener("change", () => {
    prior_locusclockvar = "dir";
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
    updateClockSnippets();
});

LineageGammaPrior.addEventListener("change", () => {
    lineagerates_model = "G";
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
    updateClockSnippets();
});

LineageLNPrior.addEventListener("change", () => {
    lineagerates_model = "LN";
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
    updateClockSnippets();
});

// update plot and snippets for lineagemeanrate prior when lineagemeanrate_alphaslider changes
lineagemeanrate_alphaslider.oninput = function () {
    lineagemeanrate_alphatext.value = lineagemeanrate_alphaslider.value;
    mean_lineagemeanrate =
	lineagemeanrate_alphatext.value / lineagemeanrate_betatext.value;
    var_lineagemeanrate =
	lineagemeanrate_alphatext.value /
	(lineagemeanrate_betatext.value * lineagemeanrate_betatext.value);
    lineagemeanVarMu.innerHTML = `Mean: ${mean_lineagemeanrate.toFixed(6)} Var: ${var_lineagemeanrate.toFixed(6)}`;
    currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
  updateClockSnippets();
};

// update plot and snippets for lineagemeanrate prior when lineagemeanrate_alphatext changes
lineagemeanrate_alphatext.oninput = function () {
  lineagemeanrate_alphaslider.value = lineagemeanrate_alphatext.value;
  mean_lineagemeanrate =
    lineagemeanrate_alphatext.value / lineagemeanrate_betatext.value;
  var_lineagemeanrate =
    lineagemeanrate_alphatext.value /
    (lineagemeanrate_betatext.value * lineagemeanrate_betatext.value);
  lineagemeanVarMu.innerHTML = `Mean: ${mean_lineagemeanrate.toFixed(
    6
  )} Var: ${var_lineagemeanrate.toFixed(6)}`;
  currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
  updateClockSnippets();
};

// update plot and snippets for lineagemeanrate prior when lineagemeanrate_betaslider changes
lineagemeanrate_betaslider.oninput = function () {
  lineagemeanrate_betatext.value = lineagemeanrate_betaslider.value;
  mean_lineagemeanrate =
    lineagemeanrate_alphatext.value / lineagemeanrate_betatext.value;
  var_lineagemeanrate =
    lineagemeanrate_alphatext.value /
    (lineagemeanrate_betatext.value * lineagemeanrate_betatext.value);
  lineagemeanVarMu.innerHTML = `Mean: ${mean_lineagemeanrate.toFixed(
    6
  )} Var: ${var_lineagemeanrate.toFixed(6)}`;
  currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
  updateClockSnippets();
};

// update plot and snippets for lineagemeanrate prior when lineagemeanrate_betatext changes
lineagemeanrate_betatext.oninput = function () {
  lineagemeanrate_betaslider.value = lineagemeanrate_betatext.value;
  mean_lineagemeanrate =
    lineagemeanrate_alphatext.value / lineagemeanrate_betatext.value;
  var_lineagemeanrate =
    lineagemeanrate_alphatext.value /
    (lineagemeanrate_betatext.value * lineagemeanrate_betatext.value);
  lineagemeanVarMu.innerHTML = `Mean: ${mean_lineagemeanrate.toFixed(
    6
  )} Var: ${var_lineagemeanrate.toFixed(6)}`;
  currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
  updateClockSnippets();
};

// update plot and snippets when concentration_text changes
concentration_text.oninput = function () {
  concentration_slider.value = concentration_text.value;
  currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
  updateClockSnippets();
};

// update plot and snippets when concentration_slider changes
concentration_slider.oninput = function () {
  concentration_text.value = concentration_slider.value;
  currentClockVars = `${currentClock} ${lineagemeanrate_alphatext.value} ${lineagemeanrate_betatext.value} ${concentration_text.value} ${prior_locusclockvar} ${lineagerates_model}`;
  updateClockSnippets();
};

// update snippets for a new clock choice
function updateClockSnippets() {
  modifyBPPSnippets(
    "clock",
    `clock = ${currentClockVars}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CLOCK].content}</p>`;
  toggleModifiedFlag("clock", "D", "clockL");
}

// listen for changes to heredity and update

let currentLocusTheta = undefined;
let mean_meantheta = 1;
let var_meantheta = 1;

// choose constant, estimated or specified rates
const VarSpecifiedTheta = document.getElementById("varspecifiedtheta");
const VarEstimatedTheta = document.getElementById("varestimatedtheta");
const ConstantTheta = document.getElementById("constanttheta");

const ConstantThetaChoice = document.getElementById("Varconstantthetachoice");
const VarEstimatedThetaChoice = document.getElementById(
  "Varestimatedthetachoice"
);
const VarSpecifiedThetaChoice = document.getElementById(
  "Varspecifiedthetachoice"
);

ConstantTheta.addEventListener("change", () => {
  VarSpecifiedThetaChoice.setAttribute("style", "display: none");
  ConstantThetaChoice.setAttribute("style", "display: inline-block");
  VarEstimatedThetaChoice.setAttribute("style", "display: none");
  currentLocusTheta = 0;
  updateLocusthetaSnippets();
});

VarEstimatedTheta.addEventListener("change", () => {
  VarSpecifiedThetaChoice.setAttribute("style", "display: none");
  ConstantThetaChoice.setAttribute("style", "display: none");
  VarEstimatedThetaChoice.setAttribute("style", "display: inline-block");
  currentLocusTheta = "1 1.0 1.0";
  updateLocusthetaSnippets();
});

VarSpecifiedTheta.addEventListener("change", () => {
  VarSpecifiedThetaChoice.setAttribute("style", "display: inline-block");
  ConstantThetaChoice.setAttribute("style", "display: none");
  VarEstimatedThetaChoice.setAttribute("style", "display: none");
  currentLocusTheta = "2 locustheta.txt";
  updateLocusthetaSnippets();
});

// listen for a change to Specified theta text save button
const chooseSpecifiedThetafileText = document.getElementById(
  "choosevarstfiletext"
);
const chooseSpecifiedThetafileSave = document.getElementById(
  "choosevarstfilesave"
);
chooseSpecifiedThetafileSave.addEventListener("click", () => {
  currentLocusTheta = `2 ${chooseSpecifiedThetafileText.value}`;
  updateLocusthetaSnippets();
});

// listen for a change to sliders or text inputs for meantheta alpha and beta
const meantheta_alphaslider = document.getElementById("meanthetaalphaslider");
const meantheta_betaslider = document.getElementById("meanthetabetaslider");
const meantheta_alphatext = document.getElementById("meanthetaalphatext");
const meantheta_betatext = document.getElementById("meanthetabetatext");

const meanVarTheta = document.getElementById("meanvartheta");

// update plot and snippets for meantheta prior when meantheta_alphaslider changes
meantheta_alphaslider.oninput = function () {
  meantheta_alphatext.value = meantheta_alphaslider.value;
  mean_meantheta = meantheta_alphatext.value / meantheta_betatext.value;
  var_meantheta =
    meantheta_alphatext.value /
    (meantheta_betatext.value * meantheta_betatext.value);
  meanVarTheta.innerHTML = `Mean: ${mean_meantheta.toFixed(
    6
  )} Var: ${var_meantheta.toFixed(6)}`;
  currentLocusTheta = `1 ${meantheta_alphatext.value} ${meantheta_betatext.value}`;
  updateLocusthetaSnippets();
};

// update plot and snippets for meantheta prior when meantheta_alphatext changes
meantheta_alphatext.oninput = function () {
  meantheta_alphaslider.value = meantheta_alphatext.value;
  mean_meantheta = meantheta_alphatext.value / meantheta_betatext.value;
  var_meantheta =
    meantheta_alphatext.value /
    (meantheta_betatext.value * meantheta_betatext.value);
  meanVarTheta.innerHTML = `Mean: ${mean_meantheta.toFixed(
    6
  )} Var: ${var_meantheta.toFixed(6)}`;
  currentLocusTheta = `1 ${meantheta_alphatext.value} ${meantheta_betatext.value}`;
  updateLocusthetaSnippets();
};

// update plot and snippets for meantheta prior when meantheta_betaslider changes
meantheta_betaslider.oninput = function () {
  meantheta_betatext.value = meantheta_betaslider.value;
  mean_meantheta = meantheta_alphatext.value / meantheta_betatext.value;
  var_meantheta =
    meantheta_alphatext.value /
    (meantheta_betatext.value * meantheta_betatext.value);
  meanVarTheta.innerHTML = `Mean: ${mean_meantheta.toFixed(
    6
  )} Var: ${var_meantheta.toFixed(6)}`;
  currentLocusTheta = `1 ${meantheta_alphatext.value} ${meantheta_betatext.value}`;
  updateLocusthetaSnippets();
};

// update plot and snippets for meantheta prior when meantheta_betatext changes
meantheta_betatext.oninput = function () {
  meantheta_betaslider.value = meantheta_betatext.value;
  mean_meantheta = meantheta_alphatext.value / meantheta_betatext.value;
  var_meantheta =
    meantheta_alphatext.value /
    (meantheta_betatext.value * meantheta_betatext.value);
  meanVarTheta.innerHTML = `Mean: ${mean_meantheta.toFixed(
    6
  )} Var: ${var_meantheta.toFixed(6)}`;
  currentLocusTheta = `1 ${meantheta_alphatext.value} ${meantheta_betatext.value}`;
  updateLocusthetaSnippets();
};

// update snippets for a new locustheta choice
function updateLocusthetaSnippets() {
  modifyBPPSnippets(
    "heredity",
    `heredity = ${currentLocusTheta}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[HEREDITY].content}</p>`;
  toggleModifiedFlag("heredity", "D", "heredityL");
}

// listen for changes to model and update
let currentModel = "JC69";
let currentDNA = "JC69";
let currentAA = "BLOSUM62";
let currentCustom = "Custom custom.txt";

// choose DNA, AA or Custom
const DNAModelChoice = document.getElementById("DNAmodelchoice");
const AAModelChoice = document.getElementById("AAmodelchoice");
const CustomModelChoice = document.getElementById("Custommodelchoice");
const dnaModel = document.getElementById("dna");
const aaModel = document.getElementById("aa");
const customModel = document.getElementById("custom");

dnaModel.addEventListener("change", () => {
  DNAModelChoice.setAttribute("style", "display: inline-block");
  AAModelChoice.setAttribute("style", "display: none");
  CustomModelChoice.setAttribute("style", "display: none");
  currentModel = currentDNA;
  updateModelSnippets();
});
aaModel.addEventListener("change", () => {
  AAModelChoice.setAttribute("style", "display: inline-block");
  DNAModelChoice.setAttribute("style", "display: none");
  CustomModelChoice.setAttribute("style", "display: none");
  currentModel = currentAA;
  updateModelSnippets();
});
customModel.addEventListener("change", () => {
  CustomModelChoice.setAttribute("style", "display: inline-block");
  DNAModelChoice.setAttribute("style", "display: none");
  AAModelChoice.setAttribute("style", "display: none");
  currentModel = currentCustom;
  updateModelSnippets();
});

// choose specific substitution model

// DNA Models
const JC69Choice = document.getElementById("jc69");
const K80Choice = document.getElementById("k80");
const F81Choice = document.getElementById("f81");
const HKYChoice = document.getElementById("hky");
const T92Choice = document.getElementById("t92");
const TN93Choice = document.getElementById("tn93");
const F84Choice = document.getElementById("f84");
const GTRChoice = document.getElementById("gtr");

JC69Choice.addEventListener("change", () => {
  currentModel = "JC69";
  currentDNA = "JC69";
  updateModelSnippets();
});
K80Choice.addEventListener("change", () => {
  currentModel = "K80";
  currentDNA = "K80";
  updateModelSnippets();
});
F81Choice.addEventListener("change", () => {
  currentModel = "F81";
  currentDNA = "F81";
  updateModelSnippets();
});
HKYChoice.addEventListener("change", () => {
  currentModel = "HKY";
  currentDNA = "HKY";
  updateModelSnippets();
});
T92Choice.addEventListener("change", () => {
  currentModel = "T92";
  currentDNA = "T92";
  updateModelSnippets();
});
TN93Choice.addEventListener("change", () => {
  currentModel = "TN93";
  currentDNA = "TN93";
  updateModelSnippets();
});
F84Choice.addEventListener("change", () => {
  currentModel = "F84";
  currentDNA = "F84";
  updateModelSnippets();
});
GTRChoice.addEventListener("change", () => {
  currentModel = "GTR";
  currentDNA = "GTR";
  updateModelSnippets();
});

// AA Models
const BLOSUM62Choice = document.getElementById("blosum62");
const CPREVChoice = document.getElementById("cprev");
const RTREVChoice = document.getElementById("rtrev");
const DAYHOFFChoice = document.getElementById("dayhoff");
const DCMUTChoice = document.getElementById("dcmut");
const FLUChoice = document.getElementById("flu");
const HIVBChoice = document.getElementById("hivb");
const HIVWChoice = document.getElementById("hivw");
const JTTChoice = document.getElementById("jtt");
const JTTDCMUTChoice = document.getElementById("jttdcmut");
const LGChoice = document.getElementById("lg");
const MTARTChoice = document.getElementById("mtart");
const MTMAMChoice = document.getElementById("mtmam");
const MTZOAChoice = document.getElementById("mtzoa");
const MTREVChoice = document.getElementById("mtrev");
const PMBChoice = document.getElementById("pmb");
const STMREVChoice = document.getElementById("stmrev");
const VTChoice = document.getElementById("vt");
const WAGChoice = document.getElementById("wag");

BLOSUM62Choice.addEventListener("change", () => {
  currentModel = "BLOSUM62";
  currentAA = "BLOSUM62";
  updateModelSnippets();
});
CPREVChoice.addEventListener("change", () => {
  currentModel = "CPREV";
  currentAA = "CPREV";
  updateModelSnippets();
});
RTREVChoice.addEventListener("change", () => {
  currentModel = "RTREV";
  currentAA = "RTREV";
  updateModelSnippets();
});
DAYHOFFChoice.addEventListener("change", () => {
  currentModel = "DAYHOFF";
  currentAA = "DAYHOFF";
  updateModelSnippets();
});
DCMUTChoice.addEventListener("change", () => {
  currentModel = "DCMUT";
  currentAA = "DCMUT";
  updateModelSnippets();
});
FLUChoice.addEventListener("change", () => {
  currentModel = "FLU";
  currentAA = "FLU";
  updateModelSnippets();
});
HIVBChoice.addEventListener("change", () => {
  currentModel = "HIVB";
  currentAA = "HIVB";
  updateModelSnippets();
});
HIVWChoice.addEventListener("change", () => {
  currentModel = "HIVW";
  currentAA = "HIVW";
  updateModelSnippets();
});
JTTChoice.addEventListener("change", () => {
  currentModel = "JTT";
  currentAA = "JTT";
  updateModelSnippets();
});
JTTDCMUTChoice.addEventListener("change", () => {
  currentModel = "JTTDCMUT";
  currentAA = "JTTDCMUT";
  updateModelSnippets();
});
LGChoice.addEventListener("change", () => {
  currentModel = "LG";
  currentAA = "LG";
  updateModelSnippets();
});
MTARTChoice.addEventListener("change", () => {
  currentModel = "MTART";
  currentAA = "MTART";
  updateModelSnippets();
});
MTMAMChoice.addEventListener("change", () => {
  currentModel = "MTMAM";
  currentAA = "MTMAM";
  updateModelSnippets();
});
MTZOAChoice.addEventListener("change", () => {
  currentModel = "MTZOA";
  currentAA = "MTZOA";
  updateModelSnippets();
});
MTREVChoice.addEventListener("change", () => {
  currentModel = "MTREV";
  currentAA = "MTREV";
  updateModelSnippets();
});
PMBChoice.addEventListener("change", () => {
  currentModel = "PMB";
  currentAA = "PMB";
  updateModelSnippets();
});
STMREVChoice.addEventListener("change", () => {
  currentModel = "STMREV";
  currentAA = "STMREV";
  updateModelSnippets();
});
VTChoice.addEventListener("change", () => {
  currentModel = "VT";
  currentAA = "VT";
  updateModelSnippets();
});
WAGChoice.addEventListener("change", () => {
  currentModel = "WAG";
  currentAA = "WAG";
  updateModelSnippets();
});

// listen for a change to Custom file text save button
const chooseCustomfileText = document.getElementById("choosecustomfiletext");
const chooseCustomfileSave = document.getElementById("choosecustomfilesave");
chooseCustomfileSave.addEventListener("click", () => {
  currentModel = `Custom ${chooseCustomfileText.value}`;
  currentCustom = `Custom ${chooseCustomfileText.value}`;
  updateModelSnippets();
});

// update snippets for a new model choice
function updateModelSnippets() {
  modifyBPPSnippets(
    "model",
    `model = ${currentModel}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[MODEL].content}</p>`;
  toggleModifiedFlag("model", "D", "modelL");
}

// listen for changes to fine tune parameters and update
// update gage
const finetuneGage = document.getElementById("gage");
finetuneGage.addEventListener("change", () => {
  finetune_params.Gage = finetuneGage.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update gspr
const finetuneGspr = document.getElementById("gspr");
finetuneGspr.addEventListener("change", () => {
  finetune_params.Gspr = finetuneGspr.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update thet
const finetunethet = document.getElementById("thet");
finetunethet.addEventListener("change", () => {
  finetune_params.thet = finetunethet.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update tau
const finetunetau = document.getElementById("tau");
finetunetau.addEventListener("change", () => {
  finetune_params.tau = finetunetau.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update mix
const finetunemix = document.getElementById("mix");
finetunemix.addEventListener("change", () => {
  finetune_params.mix = finetunemix.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update lrht
const finetunelrht = document.getElementById("lrht");
finetunelrht.addEventListener("change", () => {
  finetune_params.lrht = finetunelrht.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update phi
const finetunephi = document.getElementById("phi");
finetunephi.addEventListener("change", () => {
  finetune_params.phi = finetunephi.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update pi
const finetunepi = document.getElementById("pi");
finetunepi.addEventListener("change", () => {
  finetune_params.pi = finetunepi.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update qmat
const finetuneqmat = document.getElementById("qmat");
finetuneqmat.addEventListener("change", () => {
  finetune_params.qmat = finetuneqmat.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update alfa
const finetunealfa = document.getElementById("alfa");
finetunealfa.addEventListener("change", () => {
  finetune_params.alfa = finetunealfa.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update mubr
const finetunemubr = document.getElementById("mubr");
finetunemubr.addEventListener("change", () => {
  finetune_params.mubr = finetunemubr.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update nubr
const finetunenubr = document.getElementById("nubr");
finetunenubr.addEventListener("change", () => {
  finetune_params.nubr = finetunenubr.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update mu_i
const finetunemu_i = document.getElementById("mui");
finetunemu_i.addEventListener("change", () => {
  finetune_params.mu_i = finetunemu_i.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update nu_i
const finetunenu_i = document.getElementById("nui");
finetunenu_i.addEventListener("change", () => {
  finetune_params.nu_i = finetunenu_i.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

// update brte
const finetunebrte = document.getElementById("brte");
finetunebrte.addEventListener("change", () => {
  finetune_params.brte = finetunebrte.value;
  modifyBPPSnippets(
    "finetune",
    `finetune = ${ftuneOn}: ${finetune_params.Gage} ${finetune_params.Gspr} ${finetune_params.thet} ${finetune_params.tau} ${finetune_params.mix} ${finetune_params.lrht} ${finetune_params.phi} ${finetune_params.pi} ${finetune_params.qmat} ${finetune_params.alfa} ${finetune_params.mubr} ${finetune_params.nubr} ${finetune_params.mu_i} ${finetune_params.nu_i} ${finetune_params.brte}`,
    bppVarMap,
    currentSnippet
  );
  snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  toggleModifiedFlag("finetune", "D", "finetuneL");
});

/* functions for generating a random tree in Newick format */

function minNode(name, left, right, father) {
  this.name = name;
  this.left = left;
  this.right = right;
  this.father = father;
}

// use array to represent tips of tree
function treeArray(tNode, tArray) {
  if (tNode == null) return;
  let currNode = tNode;
  if (currNode.left != null) treeArray(currNode.left, tArray);
  if (currNode.right != null) treeArray(currNode.right, tArray);
  if (currNode.left == null && currNode.right == null) tArray.push(currNode);
}

// generate a random tree for ntax = speciesNames.length
function randomTree(speciesNames) {
    let treeList = [];
    let tRoot;
    let x;
    tRoot = new minNode("root", null, null, null);
    tRoot.left = new minNode("empty", null, null, tRoot);
    tRoot.right = new minNode("empty", null, null, tRoot);
    treeArray(tRoot, treeList);
    while (treeList.length < speciesNames.length) {
	x = Math.floor(Math.random() * treeList.length);
	treeList[x].left = new minNode("empty", null, null, treeList[x]);
	treeList[x].right = new minNode("empty", null, null, treeList[x]);
	treeList = [];
	treeArray(tRoot, treeList);
    }
    for (let i = 0; i < treeList.length; i++) treeList[i].name = speciesNames[i];
    return tRoot;
}

function recurseTree(tNode, newickSt) {
  if (tNode == null) {
    return;
  }
  let currNode = tNode;
  if (currNode.left != null) {
    newickSt.newick += "(";
    recurseTree(currNode.left, newickSt);
  }
  if (currNode.right != null) {
    newickSt.newick += ", ";
    recurseTree(currNode.right, newickSt);
    newickSt.newick += ")";
  }
  if (currNode.left == null && currNode.right == null)
    newickSt.newick += currNode.name;
}

function newickFromTree(tNode) {
  let treeSt = { newick: "" };
  recurseTree(tNode, treeSt);
  return treeSt.newick;
}

/* functions to update snippet data structures when importing/opening a snippet from a file */

function fseed(importSnippet,currID) {
  bppVarMap.set("seed", importSnippet[CFV_Ind.SEED].content);
  currentSnippet[CFV_Ind.SEED].content = importSnippet[CFV_Ind.SEED].content;
  if (currID == "guiseed")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SEED].content}</p>`;
  // update gui
  if (currentSnippet[CFV_Ind.SEED].content == bpp_snippets_skeleton[CFV_Ind.SEED].content) {
    svalue.checked = false;
    sentropy.checked = true;
    document.getElementById("sscroll").value = -1;
    document
      .getElementById("seedL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("seedL").innerHTML = "D";
    bppVarModMap.set("seed", { content: "D", color: "rgb(59, 99, 209)" });
    seedScroll.setAttribute("style", "display:none");
  } else {
    svalue.checked = true;
    sentropy.checked = false;
    toggleModifiedFlag("seed", "D", "seedL");
    seedScroll.setAttribute("style", "display:block");
  }
  document.getElementById("sscroll").value = Number(
    currentSnippet[CFV_Ind.SEED].content.split(" ")[2]
  );
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fusedata(importSnippet,currID) {
  bppVarMap.set("usedata", importSnippet[CFV_Ind.USEDATA].content);
  currentSnippet[CFV_Ind.USEDATA].content = importSnippet[CFV_Ind.USEDATA].content;
  if (currID == "guiusedata")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.USEDATA].content}</p>`;
  // update gui
  if (
    currentSnippet[CFV_Ind.USEDATA].content == bpp_snippets_skeleton[CFV_Ind.USEDATA].content
  ) {
    usedatachk.checked = true;
    document
      .getElementById("usedataOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("usedataOffMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("usedataL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("usedataL").innerHTML = "D";
    bppVarModMap.set("usedata", { content: "D", color: "rgb(59, 99, 209)" });
  } else {
    usedatachk.checked = false;
    document
      .getElementById("usedataOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("usedataOnMsg")
      .setAttribute("style", "display: none");
    toggleModifiedFlag("usedata", "D", "usedataL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fcleandata(importSnippet,currID) {
  bppVarMap.set("cleandata", importSnippet[CLEANDATA].content);
  currentSnippet[CLEANDATA].content = importSnippet[CLEANDATA].content;
  if (currID == "guicleandata")
    snippetHandle.innerHTML = `<p>${currentSnippet[CLEANDATA].content}</p>`;
  // update gui
  if (
    currentSnippet[CLEANDATA].content ==
    bpp_snippets_skeleton[CLEANDATA].content
  ) {
    cleandatachk.checked = false;
    document
      .getElementById("cleandataOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("cleandataOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("cleandataL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("cleandataL").innerHTML = "D";
    bppVarModMap.set("cleandata", { content: "D", color: "rgb(59, 99, 209)" });
  } else {
    cleandatachk.checked = true;
    document
      .getElementById("cleandataOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("cleandataOffMsg")
      .setAttribute("style", "display: none");
    toggleModifiedFlag("cleandata", "D", "cleandataL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function foutfile(importSnippet,currID) {
  bppVarMap.set("outfile", importSnippet[CFV_Ind.OUTFILE].content);
  currentSnippet[CFV_Ind.OUTFILE].content = importSnippet[CFV_Ind.OUTFILE].content;
  if (currID == "guioutfile")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.OUTFILE].content}</p>`;
  // update gui
  displayoutfilehandle.innerHTML = `Current output file: ${
    currentSnippet[CFV_Ind.OUTFILE].content.split(" ")[2]
  }`;
  if (
    currentSnippet[CFV_Ind.OUTFILE].content == bpp_snippets_skeleton[CFV_Ind.OUTFILE].content
  ) {
    document
      .getElementById("outfileL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("outfileL").innerHTML = "E";
    bppVarModMap.set("outfile", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    toggleModifiedFlag("outfile", "E", "outfileL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fmcmcfile(importSnippet,currID) {
  bppVarMap.set("mcmcfile", importSnippet[CFV_Ind.MCMCFILE].content);
  currentSnippet[CFV_Ind.MCMCFILE].content = importSnippet[CFV_Ind.MCMCFILE].content;
  if (currID == "guimcmcfile")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.MCMCFILE].content}</p>`;
  // update gui
  displaymcmcfilehandle.innerHTML = `Current MCMC output file: ${
    currentSnippet[CFV_Ind.MCMCFILE].content.split(" ")[2]
  }`;
  if (
    currentSnippet[CFV_Ind.MCMCFILE].content == bpp_snippets_skeleton[CFV_Ind.MCMCFILE].content
  ) {
    document
      .getElementById("mcmcfileL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("mcmcfileL").innerHTML = "E";
    bppVarModMap.set("mcmcfile", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    toggleModifiedFlag("mcmcfile", "E", "mcmcfileL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fseqfile(importSnippet,currID) {
  bppVarMap.set("seqfile", importSnippet[CFV_Ind.SEQFILE].content);
  currentSnippet[CFV_Ind.SEQFILE].content = importSnippet[CFV_Ind.SEQFILE].content;
  if (currID == "guiseqfile")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SEQFILE].content}</p>`;
  // update gui
  displayseqfilehandle.innerHTML = `Current sequence data file: ${
    currentSnippet[CFV_Ind.SEQFILE].content.split(" ")[2]
  }`;
  if (
    currentSnippet[CFV_Ind.SEQFILE].content == bpp_snippets_skeleton[CFV_Ind.SEQFILE].content
  ) {
    document
      .getElementById("seqfileL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("seqfileL").innerHTML = "E";
    bppVarModMap.set("seqfile", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    toggleModifiedFlag("seqfile", "E", "seqfileL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function ffinetune(importSnippet,currID) {
  bppVarMap.set("finetune", importSnippet[CFV_Ind.FINETUNE].content);
  currentSnippet[CFV_Ind.FINETUNE].content = importSnippet[CFV_Ind.FINETUNE].content;
  if (currID == "guifinetune")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.FINETUNE].content}</p>`;
  // update gui
  if (
    currentSnippet[CFV_Ind.FINETUNE].content == bpp_snippets_skeleton[CFV_Ind.FINETUNE].content
  ) {
    document
      .getElementById("finetuneL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("finetuneL").innerHTML = "D";
    bppVarModMap.set("finetune", { content: "D", color: "rgb(59, 99, 209)" });
  } else {
    toggleModifiedFlag("finetune", "D", "finetuneL");
  }
  if (currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[2] == "1:") {
    finetunechk.checked = true;
    document
      .getElementById("finetuneOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("finetuneOffMsg")
      .setAttribute("style", "display: none");
  } else {
    finetunechk.checked = false;
    document
      .getElementById("finetuneOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("finetuneOffMsg")
      .setAttribute("style", "display: inline-block");
  }
  finetune_params.Gage = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[3]);
  finetune_params.Gspr = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[4]);
  finetune_params.thet = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[5]);
  finetune_params.tau = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[6]);
  finetune_params.mix = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[7]);
  finetune_params.lrht = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[8]);
  finetune_params.phi = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[9]);
  finetune_params.pi = Number(currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[10]);
  finetune_params.qmat = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[11]
  );
  finetune_params.alfa = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[12]
  );
  finetune_params.mubr = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[13]
  );
  finetune_params.nubr = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[14]
  );
  finetune_params.mu_i = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[15]
  );
  finetune_params.nu_i = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[16]
  );
  finetune_params.brte = Number(
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[17]
  );

  document.getElementById("gage").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[3];
  document.getElementById("gspr").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[4];
  document.getElementById("thet").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[5];
  document.getElementById("tau").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[6];
  document.getElementById("mix").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[7];
  document.getElementById("lrht").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[8];
  document.getElementById("phi").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[9];
  document.getElementById("pi").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[10];
  document.getElementById("qmat").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[11];
  document.getElementById("alfa").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[12];
  document.getElementById("mubr").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[13];
  document.getElementById("nubr").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[14];
  document.getElementById("mui").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[15];
  document.getElementById("nui").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[16];
  document.getElementById("brte").value =
    currentSnippet[CFV_Ind.FINETUNE].content.split(" ")[17];
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fprint(importSnippet,currID) {
  bppVarMap.set("print", importSnippet[CFV_Ind.PRINT].content);
  currentSnippet[CFV_Ind.PRINT].content = importSnippet[CFV_Ind.PRINT].content;
  printMap.set(
    "mcmcsamples",
    Number(currentSnippet[CFV_Ind.PRINT].content.split(" ")[2])
  );
  printMap.set(
    "locusrates",
    Number(currentSnippet[CFV_Ind.PRINT].content.split(" ")[3])
  );
  printMap.set(
    "heredityscalars",
    Number(currentSnippet[CFV_Ind.PRINT].content.split(" ")[4])
  );
  printMap.set(
    "genetrees",
    Number(currentSnippet[CFV_Ind.PRINT].content.split(" ")[5])
  );
  printMap.set(
    "substitutionparameters",
    Number(currentSnippet[CFV_Ind.PRINT].content.split(" ")[6])
  );
  if (currID == "guiprint")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.PRINT].content}</p>`;
  // update gui
  if (currentSnippet[CFV_Ind.PRINT].content == bpp_snippets_skeleton[CFV_Ind.PRINT].content) {
    mcmcsampleschk.checked = true;
    locusrateschk.checked = false;
    heredityscalarschk.checked = false;
    genetreeschk.checked = false;
    substitutionparameterschk.checked = false;
    printMap.set("mcmcsamples", 1);
    printMap.set("locusrates", 0);
    printMap.set("heredityscalars", 0);
    printMap.set("genetrees", 0);
    printMap.set("substitutionparameters", 0);
    document
      .getElementById("mcmcsamplesOnMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("mcmcsamplesOffMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("locusratesOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("locusratesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("heredityscalarsOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("heredityscalarsOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("genetreesOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("genetreesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("substitutionparametersOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("substitutionparametersOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("printL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("printL").innerHTML = "E";
    bppVarModMap.set("print", { content: "E", color: "rgb(255,0,0)" });
  } else {
    if (printMap.get("mcmcsamples") == 1) {
      mcmcsampleschk.checked = true;
      document
        .getElementById("mcmcsamplesOnMsg")
        .setAttribute("style", "display: inline-block");
      document
        .getElementById("mcmcsamplesOffMsg")
        .setAttribute("style", "display: none");
    } else {
      mcmcsampleschk.checked = false;
      document
        .getElementById("mcmcsamplesOnMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("mcmcsamplesOffMsg")
        .setAttribute("style", "display: inline-block");
    }
    if (printMap.get("locusrates") == 1) {
      locusrateschk.checked = true;
      document
        .getElementById("locusratesOnMsg")
        .setAttribute("style", "display: inline-block");
      document
        .getElementById("locusratesOffMsg")
        .setAttribute("style", "display: none");
    } else {
      locusrateschk.checked = false;
      document
        .getElementById("locusratesOnMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("locusratesOffMsg")
        .setAttribute("style", "display: inline-block");
    }
    if (printMap.get("heredityscalars") == 1) {
      heredityscalarschk.checked = true;
      document
        .getElementById("heredityscalarsOnMsg")
        .setAttribute("style", "display: inline-block");
      document
        .getElementById("heredityscalarsOffMsg")
        .setAttribute("style", "display: none");
    } else {
      heredityscalarschk.checked = false;
      document
        .getElementById("heredityscalarsOnMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("heredityscalarsOffMsg")
        .setAttribute("style", "display: inline-block");
    }
    if (printMap.get("genetrees") == 1) {
      genetreeschk.checked = true;
      document
        .getElementById("genetreesOnMsg")
        .setAttribute("style", "display: inline-block");
      document
        .getElementById("genetreesOffMsg")
        .setAttribute("style", "display: none");
    } else {
      genetreeschk.checked = false;
      document
        .getElementById("genetreesOnMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("genetreesOffMsg")
        .setAttribute("style", "display: inline-block");
    }
    if (printMap.get("substitutionparameters") == 1) {
      substitutionparameterschk.checked = true;
      document
        .getElementById("substitutionparametersOnMsg")
        .setAttribute("style", "display: inline-block");
      document
        .getElementById("substitutionparametersOffMsg")
        .setAttribute("style", "display: none");
    } else {
      substitutionparameterschk.checked = false;
      document
        .getElementById("substitutionparametersOnMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("substitutionparametersOffMsg")
        .setAttribute("style", "display: inline-block");
    }
    toggleModifiedFlag("print", "E", "printL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fburnin(importSnippet,currID) {
  bppVarMap.set("burnin", importSnippet[CFV_Ind.BURNIN].content);
  currentSnippet[CFV_Ind.BURNIN].content = importSnippet[CFV_Ind.BURNIN].content;
  if (currID == "guiburnin")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.BURNIN].content}</p>`;
  // update gui
  if (currentSnippet[CFV_Ind.BURNIN].content == bpp_snippets_skeleton[CFV_Ind.BURNIN].content) {
    burnIn.value = Number(bpp_snippets_skeleton[CFV_Ind.BURNIN].content.split(" ")[2]);
    document
      .getElementById("burninL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("burninL").innerHTML = "E";
    bppVarModMap.set("burnin", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    burnIn.value = Number(currentSnippet[CFV_Ind.BURNIN].content.split(" ")[2]);
    toggleModifiedFlag("burnin", "E", "burninL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fsampfreq(importSnippet,currID) {
  bppVarMap.set("sampfreq", importSnippet[CFV_Ind.SAMPFREQ].content);
  currentSnippet[CFV_Ind.SAMPFREQ].content = importSnippet[CFV_Ind.SAMPFREQ].content;
  if (currID == "guisampfreq")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SAMPFREQ].content}</p>`;
  // update gui
  if (
    currentSnippet[CFV_Ind.SAMPFREQ].content == bpp_snippets_skeleton[CFV_Ind.SAMPFREQ].content
  ) {
    sampFreq.value = Number(
      bpp_snippets_skeleton[CFV_Ind.SAMPFREQ].content.split(" ")[2]
    );
    document
      .getElementById("sampfreqL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("sampfreqL").innerHTML = "E";
    bppVarModMap.set("sampfreq", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    sampFreq.value = Number(currentSnippet[CFV_Ind.SAMPFREQ].content.split(" ")[2]);
    toggleModifiedFlag("sampfreq", "E", "sampfreqL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fnsample(importSnippet,currID) {
  bppVarMap.set("nsample", importSnippet[CFV_Ind.NSAMPLE].content);
  currentSnippet[CFV_Ind.NSAMPLE].content = importSnippet[CFV_Ind.NSAMPLE].content;
  if (currID == "guinsample")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.NSAMPLE].content}</p>`;
  // update gui
  if (
    currentSnippet[CFV_Ind.NSAMPLE].content == bpp_snippets_skeleton[CFV_Ind.NSAMPLE].content
  ) {
    nSample.value = Number(
      bpp_snippets_skeleton[CFV_Ind.NSAMPLE].content.split(" ")[2]
    );
    document
      .getElementById("nsampleL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("nsampleL").innerHTML = "E";
    bppVarModMap.set("nsample", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    nSample.value = Number(currentSnippet[CFV_Ind.NSAMPLE].content.split(" ")[2]);
    toggleModifiedFlag("nsample", "E", "nsampleL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fspeciesdelimitation(importSnippet,currID) {
  bppVarMap.set(
    "speciesdelimitation",
    importSnippet[CFV_Ind.SPECIESDELIMITATION].content
  );
  currentSnippet[CFV_Ind.SPECIESDELIMITATION].content =
    importSnippet[CFV_Ind.SPECIESDELIMITATION].content;
  if (currID == "guispeciesdelimitation")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESDELIMITATION].content}</p>`;
  // update gui
  if (
    currentSnippet[CFV_Ind.SPECIESDELIMITATION].content ==
    bpp_snippets_skeleton[CFV_Ind.SPECIESDELIMITATION].content
  ) {
    delimitspecieschk.checked = false;
    document
      .getElementById("delimitspeciesOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("delimitspeciesOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("speciesdelimitationL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("speciesdelimitationL").innerHTML = "D";
    bppVarModMap.set("speciesdelimitation", {
      content: "D",
      color: "rgb(59, 99, 209)",
    });
  } else {
    delimitspecieschk.checked = true;
    document
      .getElementById("delimitspeciesOffMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("delimitspeciesOnMsg")
      .setAttribute("style", "display: inline-block");
    toggleModifiedFlag("speciesdelimitation", "D", "speciesdelimitationL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function ftauprior(importSnippet,currID) {
  bppVarMap.set("tauprior", importSnippet[TAUPRIOR].content);
  currentSnippet[TAUPRIOR].content = importSnippet[TAUPRIOR].content;
  if (currID == "guitauprior")
    snippetHandle.innerHTML = `<p>${currentSnippet[TAUPRIOR].content}</p>`;
  // update gui
  tau_alphaslider.value = Number(
    currentSnippet[TAUPRIOR].content.split(" ")[3]
  );
  tau_alphatext.value = Number(currentSnippet[TAUPRIOR].content.split(" ")[3]);
  tau_betaslider.value = Number(currentSnippet[TAUPRIOR].content.split(" ")[4]);
  tau_betatext.value = Number(currentSnippet[TAUPRIOR].content.split(" ")[4]);
  updatePlot(tau_alphaslider, tau_betaslider, "gamma", "#taupriorgraph");
  // set flags for modifications from defaults
  if (
    currentSnippet[TAUPRIOR].content == bpp_snippets_skeleton[TAUPRIOR].content
  ) {
    document
      .getElementById("taupriorL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("taupriorL").innerHTML = "E";
    bppVarModMap.set("tauprior", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    toggleModifiedFlag("tauprior", "E", "taupriorL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fthetaprior(importSnippet,currID) {
  bppVarMap.set("thetaprior", importSnippet[THETAPRIOR].content);
  currentSnippet[THETAPRIOR].content = importSnippet[THETAPRIOR].content;
  if (currID == "guithetaprior")
    snippetHandle.innerHTML = `<p>${currentSnippet[THETAPRIOR].content}</p>`;
  // update gui
  if (currentSnippet[THETAPRIOR].content.split(" ")[2] == "gamma") {
    currentThetaPrior = "gamma";
    gammatheta.checked = true;
    theta_gamma_alpha_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[3]
    );
    theta_gamma_alpha_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[3]
    );
    theta_gamma_beta_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[4]
    );
    theta_gamma_beta_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[4]
    );
    ThetaInvGammaPriorBox.setAttribute("style", "display: none");
    ThetaGammaPriorBox.setAttribute("style", "display: block");
    ThetaBetaPriorBox.setAttribute("style", "display: none");
    updatePlot(
      theta_gamma_alpha_slider,
      theta_gamma_beta_slider,
      "gamma",
      "#thetagammagraph"
    );
  } else if (currentSnippet[THETAPRIOR].content.split(" ")[2] == "invgamma") {
    currentThetaPrior = "invgamma";
    invgammatheta.checked = true;
    theta_invgamma_alpha_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[3]
    );
    theta_invgamma_alpha_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[3]
    );
    theta_invgamma_beta_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[4]
    );
    theta_invgamma_beta_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[4]
    );
    if (currentSnippet[THETAPRIOR].content.split(" ")[5] == "e") {
      analyticalchk.checked = false;
      document
        .getElementById("analyticalOnMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("analyticalOffMsg")
        .setAttribute("style", "display: inline-block");
    } else {
      analyticalchk.checked = true;
      document
        .getElementById("analyticalOffMsg")
        .setAttribute("style", "display: none");
      document
        .getElementById("analyticalOnMsg")
        .setAttribute("style", "display: inline-block");
    }
    ThetaInvGammaPriorBox.setAttribute("style", "display: block");
    ThetaGammaPriorBox.setAttribute("style", "display: none");
    ThetaBetaPriorBox.setAttribute("style", "display: none");
    updatePlot(
      theta_invgamma_alpha_slider,
      theta_invgamma_beta_slider,
      "invgamma",
      "#thetainvgammagraph"
    );
  } else {
    // is beta prior
    currentThetaPrior = "beta";
    betatheta.checked = true;
    theta_beta_alpha_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[3]
    );
    theta_beta_alpha_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[3]
    );
    theta_beta_beta_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[4]
    );
    theta_beta_beta_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[4]
    );
    theta_beta_min_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[5]
    );
    theta_beta_min_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[5]
    );
    theta_beta_max_slider.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[6]
    );
    theta_beta_max_text.value = Number(
      currentSnippet[THETAPRIOR].content.split(" ")[6]
    );
    ThetaInvGammaPriorBox.setAttribute("style", "display: none");
    ThetaGammaPriorBox.setAttribute("style", "display: none");
    ThetaBetaPriorBox.setAttribute("style", "display: block");
  }
  // set flags for modifications from defaults
  if (
    currentSnippet[THETAPRIOR].content ==
    bpp_snippets_skeleton[THETAPRIOR].content
  ) {
    document
      .getElementById("thetapriorL")
      .setAttribute("style", "color:rgb(255, 0, 0)");
    document.getElementById("thetapriorL").innerHTML = "E";
    bppVarModMap.set("thetaprior", { content: "E", color: "rgb(255, 0, 0)" });
  } else {
    toggleModifiedFlag("thetaprior", "E", "thetapriorL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fspeciestree(importSnippet,currID) {
  bppVarMap.set("speciestree", importSnippet[CFV_Ind.SPECIESTREE].content);
  currentSnippet[CFV_Ind.SPECIESTREE].content = importSnippet[CFV_Ind.SPECIESTREE].content;
  if (currID == "guispeciestree")
    snippetHandle.innerHTML = `<p>${currentSnippet[CFV_Ind.SPECIESTREE].content}</p>`;
  // update gui
  if (
    currentSnippet[CFV_Ind.SPECIESTREE].content ==
    bpp_snippets_skeleton[CFV_Ind.SPECIESTREE].content
  ) {
    speciestreeOnOff.checked = false;
    document
      .getElementById("speciestreeOnMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("speciestreeOffMsg")
      .setAttribute("style", "display: inline-block");
    document
      .getElementById("speciestreeL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("speciestreeL").innerHTML = "D";
    bppVarModMap.set("speciestree", {
      content: "D",
      color: "rgb(59, 99, 209)",
    });
  } else {
    speciestreeOnOff.checked = true;
    document
      .getElementById("speciestreeOffMsg")
      .setAttribute("style", "display: none");
    document
      .getElementById("speciestreeOnMsg")
      .setAttribute("style", "display: inline-block");
    toggleModifiedFlag("speciestree", "D", "speciestreeL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

function fnloci(importSnippet,currID) {
  bppVarMap.set("nloci", importSnippet[NLOCI].content);
  currentSnippet[NLOCI].content = importSnippet[NLOCI].content;
  if (currID == "guinloci")
    snippetHandle.innerHTML = `<p>${currentSnippet[NLOCI].content}</p>`;
  // update gui
  if (currentSnippet[NLOCI].content == bpp_snippets_skeleton[NLOCI].content) {
    nLoci.value = Number(bpp_snippets_skeleton[NLOCI].content.split(" ")[2]);
    document
      .getElementById("nlociL")
      .setAttribute("style", "color:rgb(59, 99, 209)");
    document.getElementById("nlociL").innerHTML = "D";
    bppVarModMap.set("nloci", {
      content: "D",
      color: "rgb(59, 99, 209)",
    });
  } else {
    nLoci.value = Number(currentSnippet[NLOCI].content.split(" ")[2]);
    toggleModifiedFlag("nloci", "D", "nlociL");
  }
  ipcRenderer.send("updatesnippets", currentSnippet);
}

// create a control file using current snippets
// required ND variables are all printed to control file
// required D and optional variables are printed to control file only if currently user-defined (U flag)

function getCtrlFileStr(importSnippet,currID) {
  let cfilestr = "";
  for (i in requiredCFVars) {
    if (bppVarModMap.get(requiredCFVars[i]).content == "U")
      cfilestr += bppVarMap.get(requiredCFVars[i]) + " * user defined value\n";
    else cfilestr += bppVarMap.get(requiredCFVars[i]) + " * default value\n";
  }
  for (i in defaultCFVars) {
    if (bppVarModMap.get(defaultCFVars[i]).content == "U")
      cfilestr += bppVarMap.get(defaultCFVars[i]) + " * user defined value\n";
  }
  for (i in optionalCFVars) {
    if (bppVarModMap.get(optionalCFVars[i]).content == "U")
      cfilestr += bppVarMap.get(optionalCFVars[i]) + " * user defined value\n";
  }
  return cfilestr;
}

// vector of snippet update functions for each ctl file variable
const applyImportedSnippet = [
  fseed,
  fusedata,
  foutfile,
  fmcmcfile,
  fseqfile,
  ffinetune,
  fprint,
  fburnin,
  fsampfreq,
  fnsample,
  /*  fspeciesandtree,
  fImapfile, */
  fspeciesdelimitation,
  fspeciestree,
  /* fspeciesmodelprior,
  fphase, */
  fnloci,
  /*  fmodel,
  fQrates,
  fbasefreqs,
  falphaprior, */
  fcleandata,
  fthetaprior,
  ftauprior,
  /* fphiprior,
  flocusrate,
  fclock,
  fheredity,
  fcheckpoint,
  fconstraintfile,
  fthread, */
];



function applyIS(importSnippet,currID) {
    applyImportedSnippet.forEach((func) => {
        func(importSnippet,currID);
    })
}



export { bppVarMap, currentSnippet, applyIS }
