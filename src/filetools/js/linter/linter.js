// a linter tool for checking variable syntax, variable dependencies and data compatibility for BPP control files
// 1. extract lines into array -> 2. remove comments & empty lines -> 3. check syntax -> 4. check dependencies -> 5. check data

// hash map of bpp keywords

const bppmap = new Map();
bppmap.set("seed", { name: "seed", argRe: /^\s*([1])|(\d+)$/ });
bppmap.set("usedata", { name: "usedata", argRe: /[0,1]/ });
bppmap.set("outfile", {
  name: "outfile",
  argRe:
    /(\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?)/,
});

bppmap.set("mcmcfile", {
  name: "mcmcfile",
  argRe:
    /(\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?)/,
});

bppmap.set("seqfile", {
  name: "seqfile",
  argRe:
    /(\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?)/,
});

bppmap.set("finetune", {
  name: "finetune",
  argRe: /\s*[0,1]\s*(:(\s+[0-9]*\.?[0-9]+){1-15})*/,
});

bppmap.set("print", { name: "print", argRe: /([0,1]\s+){3,4}[0,1]\s*/ });

bppmap.set("burnin", { name: "burnin", argRe: /\d+/ });

bppmap.set("sampfreq", { name: "sampfreq", argRe: /[1-9]\d*/ });

bppmap.set("nsample", { name: "nsample", argRe: /[1-9]\d*/ });

bppmap.set("species&tree", {
  name: "species&tree",
  argRe:
    /([1-9]\d*(\s+\w+)+\n[1-9]\d*(\s+[1-9]\d*)+\n\(.*\)\;)||(1\s+\w+\n[1-9]\d*)/,
});

bppmap.set("Imapfile", {
  name: "Imapfile",
  argRe:
    /(\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?)/,
});

bppmap.set("speciesdelimitation", {
  name: "speciesdelimitation",
  argRe: /^\s*([0])$|([1](\s+[0-2]){2,3})$/,
});

bppmap.set("speciestree", {
  name: "speciestree",
  argRe: /^\s*0\s*$|^\s*1(\s+0*\.\d+){3}$/,
});

bppmap.set("speciesmodelprior", {
  name: "speciesmodelprior",
  argRe: /^\s*[0-3]\s*$/,
});

bppmap.set("phase", { name: "phase", argRe: /^\s*([0,1]\s+)+[0,1]\s*$/ });

bppmap.set("nloci", { name: "nloci", argRe: /^\s*[1-9]\d*\s*$/ });

bppmap.set("model", {
  name: "model",
  argRe:
    /^\s*([A-Z]+[1-9]*)|(Custom (\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?))/,
});

bppmap.set("Qrates", { name: "Qrates", argRe: /^/ });

bppmap.set("basefreqs", { name: "basefreqs", argRe: /^\s*/ });

bppmap.set("alphaprior", {
  name: "alphaprior",
  argRe: /^\s*[0-9]*\.?[0-9]+\s+[0-9]*\.?[0-9]+\s+\d+$/,
});

bppmap.set("cleandata", { name: "cleandata", argRe: /^\s*[0,1]\s*$/ });

bppmap.set("thetaprior", {
  name: "thetaprior",
  argRe:
    /^\s*[a-z]{4,8}((\s+[0-9]*\.?[0-9]+){2}$)|((\s+[0-9]*\.?[0-9]+){4}$)|((\s+[0-9]*\.?[0-9]+){2}\s+e$)/,
});

bppmap.set("tauprior", {
  name: "tauprior",
  argRe: /^\s*([a-z]{5,8}\s+)?[0-9]*\.?[0-9]+\s+[0-9]*\.?[0-9]+$/,
});

bppmap.set("phiprior", {
  name: "phiprior",
  argRe: /^\s*[0-9]*\.?[0-9]+\s+[0-9]*\.?[0-9]+$/,
});

bppmap.set("locusrate", { name: "locusrate", argRe: /^\s*/ });

bppmap.set("clock", { name: "clock", argRe: /^\s*/ });

bppmap.set("heredity", {
  name: "heredity",
  argRe:
    /(^\s*0$)|(^\s*1(\s+[0-9]*\.?[0-9]+){2}$)|(2\s+(\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?)$) /,
});

bppmap.set("checkpoint", {
  name: "checkpoint",
  argRe: /^\s*[1-9]\d+(\s+[1-9]\d+)*$/,
});

bppmap.set("constraintfile", {
  name: "constraintfile",
  argRe:
    /^\s*(\w\.?\w)|(\/.*|[a-zA-Z]:\\(?:([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\|..\\)*([^<>:"\/\\|?*]*[^<>:"\/\\|?*.]\\?|..\\))?)/,
});

bppmap.set("threads", {
  name: "threads",
  argRe: /(^\s*[1-9]\d*$)|(^\s*[1-9]\d*\s+\d+\s+[1-9]\d*\s*$)/,
});

// 1. extract lines into array

function extractLines(rawcfile) {
  return rawcfile.split(/\r\n?|\r|\n/);
}

// 2. remove comments & empty lines

function removeC_WS_EL(lineArray) {
  reStarComment = /^\s*\*.*$/;
  rePartialStarComment = /\*.*$/;
  reHashComment = /^\s*#.*$/;
  rePartialHashComment = /#.*$/;
  reEmptyLine = /^\s*$/;
  let match = undefined;
  let i = 0;
  let newLineArray = [];
  // remove full line comments, blank lines and leading+tailing whitespace
  for (i = 0; i < lineArray.length; i++) {
    if (
      !reStarComment.test(lineArray[i]) &&
      !reHashComment.test(lineArray[i]) &&
      !reEmptyLine.test(lineArray[i])
    )
      newLineArray.push({ line: lineArray[i].trim(), lineno: i + 1 });
  }
  // remove partial line comments
  for (i = 0; i < newLineArray.length; i++) {
    if ((match = rePartialStarComment.exec(newLineArray[i].line))) {
      newLineArray[i].line = newLineArray[i].line
        .substring(0, match.index)
        .trim();
    }
  }
  for (i = 0; i < newLineArray.length; i++) {
    if ((match = rePartialHashComment.exec(newLineArray[i].line))) {
      newLineArray[i].line = newLineArray[i].line
        .substring(0, match.index)
        .trim();
    }
  }
  return newLineArray;
}

// 3. check syntax

// 3a. Level A. check 'variable = value' syntax and get variable and value

function syntaxCheckLevelA(newlineArray) {
  reVariableSpec = /^\s*([a-zA-Z&]+)\s*=(.+)$/;
  let match = undefined;
  let parsedLine = [];
  let inSpeciesandTree = false;
  let secondVisit = false;
  for (let i = 0; i < newlineArray.length; i++) {
    if (!inSpeciesandTree) {
      if (!(match = reVariableSpec.exec(newlineArray[i].line)))
        return {
          error: true,
          message: `<p style="color:red;">&#x2620; Level A Syntax error at line: ${newlineArray[i].lineno}. Malformed line: \"${newlineArray[i].line}\"</p&#x2620;>`,
          lineno: newlineArray[i].lineno,
        };
      else {
        parsedLine.push({
          variable: match[1].trim(),
          value: match[2].trim(),
          lineno: newlineArray[i].lineno,
        });
        if (match[1].trim() == "species&tree") inSpeciesandTree = true;
      }
    } else {
      parsedLine[parsedLine.length - 1].value =
        parsedLine[parsedLine.length - 1].value + "\n" + newlineArray[i].line;
      if (secondVisit) inSpeciesandTree = false;
      else secondVisit = true;
    }
  }
  return { error: false, parsedLine: parsedLine };
}

// 3b. Level B. check 'variable' is in list and retrieve and check regular expression for permissible 'values'

function syntaxCheckLevelB(parsedLine) {
  //  let variableList = [];
  let keymatch = "undefined";
  for (let i = 0; i < parsedLine.length; i++) {
    if (!(keymatch = bppmap.get(parsedLine[i].variable)))
      return {
        error: true,
        message: `<p>&check; PASSED: Level A Syntax Checking.</p><p style="color:red;">&#x2620; Level B Syntax error at line: ${parsedLine[i].lineno}. Unknown variable name: \"${parsedLine[i].variable}\"</p>`,
        lineno: parsedLine[i].lineno,
      };
    else {
      keyRegex = keymatch.argRe;
      if (!keyRegex.test(parsedLine[i].value))
        return {
          error: true,
          message: `<p>&check; PASSED: Level A Syntax Checking.</p><p style="color:red;">&#x2620; Level B Syntax error at line: ${parsedLine[i].lineno}. Value for variable: \"${parsedLine[i].variable}\" of: \"${parsedLine[i].value}\" is invalid.</p>`,
          lineno: parsedLine[i].lineno,
        };
    }
  }
  return {
    error: false,
    message: "<p>&check; PASSED: Level A and B Syntax Checking</p>",
  };
}

//3c. Level C. Check for duplicate variable definitions

function syntaxCheckLevelC(parsedLine) {
  let varMap = new Map();
  let keymatch = "undefined";
  for (let i = 0; i < parsedLine.length; i++) {
    if (!(keymatch = varMap.get(parsedLine[i].variable))) {
      varMap.set(parsedLine[i].variable, {
        name: parsedLine[i].variable,
        lineno: parsedLine[i].lineno,
        value: parsedLine[i].value,
      });
    } else {
      return {
        error: true,
        message: `<p>&check; PASSED: Level A and B Syntax Checking</p><p style="color:red;">&#x2620; Level C Syntax error at line: ${parsedLine[i].lineno}. Variable: \"${parsedLine[i].variable}\" is a duplicate.</p>`,
        lineno: parsedLine[i].lineno,
      };
    }
  }
  return {
    error: false,
    message: "<p>&check; PASSED: Level A, B and C Syntax Checking</p>",
  };
}

// 4. Dependency checking
// 4a. Level A dependency checking -- check that all required variables are defined

var requiredBPPVariables = [
  "outfile",
  "mcmcfile",
  "seqfile",
  "finetune",
  "print",
  "sampfreq",
  "nsample",
  "species&tree",
  "thetaprior",
  "tauprior",
];
var defaultRequiredBPPVariables = [
  { var: "seed", def: "seed = -1" },
  { var: "usedata", def: "usedata = 1" },
  { var: "speciesdelimitation", def: "speciesdelimitation = 0" },
  { var: "speciestree", def: "speciestree = 0" },
  { var: "nloci", def: "nloci = <all in sequence file>" },
  { var: "model", def: "model = JC69" },
  { var: "cleandata", def: "cleandata = 0" },
  { var: "locusrate", def: "locusrate = 0" },
  { var: "clock", def: "clock = 1" },
  { var: "heredity", def: "heredity = 0" },
];
var defaultVarList = "";

function dependencyCheck(parsedLine) {
  let usingDefaults = false;
  defaultVarList = "WARNING: Variables are undefined. Default values used: ";
  let varMap = new Map();
  let keymatch = "undefined";
  for (let i = 0; i < parsedLine.length; i++) {
    if (!(keymatch = varMap.get(parsedLine[i].variable))) {
      varMap.set(parsedLine[i].variable, {
        name: parsedLine[i].variable,
        lineno: parsedLine[i].lineno,
        value: parsedLine[i].value,
      });
    } else {
      return {
        error: true,
        message: `<p>&check; PASSED: Level A and B Syntax Checking</p><p style="color:red;">&#x2620; Level C Syntax error at line: ${parsedLine[i].lineno}. Variable: \"${parsedLine[i].variable}\" is a duplicate.</p>`,
        lineno: parsedLine[i].lineno,
      };
    }
  }

  // Level A Dependency check: required variables without default values
  for (let i = 0; i < requiredBPPVariables.length; i++) {
    if (!(keymatch = varMap.get(requiredBPPVariables[i]))) {
      return {
        error: true,
        message: `<p>&check; PASSED: Level A, B and C Syntax Checking</p><p style="color:red;">&#x2620; Level A Dependency error -> Missing required variable: \"${requiredBPPVariables[i]}\".</p>`,
      };
    }
  }

  // Level B Dependency check: required variables with default values
  for (let i = 0; i < defaultRequiredBPPVariables.length; i++) {
    if (!(keymatch = varMap.get(defaultRequiredBPPVariables[i].var))) {
      usingDefaults = true;
      defaultVarList =
        defaultVarList + " " + defaultRequiredBPPVariables[i].def + ";";
    }
  }
  if (usingDefaults) {
    return {
      error: false,
      message: `<p>&check; PASSED: Level A, B and C Syntax Checking.</p><p>&check; PASSED: Level A and B Dependency Checking.</p><p>&#8658; ${defaultVarList}</p>`,
    };
  } else {
    return {
      error: false,
      message: `<p>&check; PASSED: Level A, B and C Syntax Checking.</p><p>&check; PASSED: Level A and B Dependency Checking.</p>`,
    };
  }
}

// main syntax checker

function syntaxCheck(rawcfile) {
  let lineArray = extractLines(rawcfile);
  let trimmedCFile = removeC_WS_EL(lineArray);
  let parsedCFileA = syntaxCheckLevelA(trimmedCFile);
  let parsedCFileB = undefined;
  let parsedCFileC = undefined;
  if (parsedCFileA.error) {
    return parsedCFileA;
  } else {
    parsedCFileB = syntaxCheckLevelB(parsedCFileA.parsedLine);
    if (parsedCFileB.error) {
      return parsedCFileB;
    } else {
      parsedCFileC = syntaxCheckLevelC(parsedCFileA.parsedLine);
      if (parsedCFileC.error) {
        return parsedCFileC;
      } else {
        depchkFile = dependencyCheck(parsedCFileA.parsedLine);
        return depchkFile;
      }
    }
  }
}
