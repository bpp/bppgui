// tools for handling BPP project data

// read primary sequence data from string rawseq
// initialize object containing data structure

var main_project_file = "";

var open_ctrl_file = "";

// regex used to strip file path leaving only file name (capture group)
var Rstrip = /^.+\/([\w\-. ]+)$/;

class bppPrimarySequence {
  constructor(rawseq) {
    this.seq = rawseq;
    this.locus = [];
    this.noLoci = 0;
    this.getIndivSites();
    this.getSequences();
  }
  getIndivSites() {
    let reBPPfull =
      /\s*(\d+)\s+(\d+)(\s*\n)+((\s*([a-zA-Z_^0-9]+)\s+([a-zA-Z]+)(\n*\s*)*)+)+/g;
    let reNoIndNoSites = /\s*(\d+)\s+(\d+)/g;

    if (reBPPfull.test(this.seq)) {
      let matchResult,
        i = 0;
      while ((matchResult = reNoIndNoSites.exec(this.seq))) {
        this.locus[i] = {
          noIndiv: matchResult[1],
          noSites: matchResult[2],
          sequences: [],
        };
        i++;
      }
      this.noLoci = i;
    }
  }
  getSequences() {
    let reIndSeqs = /\s*([a-zA-Z_^0-9]+)\s+([a-zA-Z]+)(\n\s*)+/g;
    var reNoIndNoSites = /\s*(\d+)\s+(\d+)/g;
    let locusBoundary = [];
    let splitByLocus = [];
    let matchResult = [];
    //  first split into an array of loci
    while ((matchResult = reNoIndNoSites.exec(this.seq))) {
      locusBoundary.push(matchResult.index);
    }
    for (let i = 0; i < this.noLoci; i++)
      if (locusBoundary[i + 1])
        splitByLocus.push(
          this.seq.substring(locusBoundary[i], locusBoundary[i + 1] - 1)
        );
      else splitByLocus.push(this.seq.substring(locusBoundary[i]));
    // collect seqIDs and indiv sequences for each locus
    for (let i = 0; i < this.noLoci; i++) {
      matchResult = [];
      while ((matchResult = reIndSeqs.exec(splitByLocus[i]))) {
        this.locus[i].sequences.push({
          seqID: matchResult[1].trim(),
          seq: matchResult[2].trim(),
        });
      }
    }
  }
}

// debugging temporary data

exMapFile = "spec1 A\n spec2 A\n spec3 Baba3\n spec4  C";

// mapfile data structures

var currSpecMapFileArray = [];
var currSpecMapFileHash = new Map();
var currSpecMapFileTable = "";

// map file parser

const mapFileparser = function (rawmfile, filename) {
  const reMapFileLine = /(^\s*[\w_\^\-]+\s+)([\w+\-_]+\s*$)/;
  const reEmptyLine = /^\s*$/;
  currSpecMapFileArray = [];
  currSpecMapFileHash.clear();
  currSpecMapFileTable = "";

  let lineArray = rawmfile.split(/\r\n?|\r|\n/);
  let strippedLineArray = [];
  // remove full line comments, blank lines and leading+tailing whitespace
  for (i = 0; i < lineArray.length; i++) {
    if (!reEmptyLine.test(lineArray[i]))
      strippedLineArray.push(lineArray[i].trim());
  }
  lineArray = strippedLineArray;

  for (i in lineArray) {
    if ((matchResult = reMapFileLine.exec(lineArray[i]))) {
      currSpecMapFileArray.push({
        seqID: matchResult[1].trim(),
        speciesName: matchResult[2].trim(),
      });
      if (!currSpecMapFileHash.get(matchResult[2].trim()))
        currSpecMapFileHash.set(matchResult[2].trim(), 1);
      else
        currSpecMapFileHash.set(
          matchResult[2].trim(),
          currSpecMapFileHash.get(matchResult[2].trim()) + 1
        );
    } else {
      alert(`Error reading map file at line: ${i}: ${lineArray[i]}`);
      return;
    }
  }
  currSpecMapFileTable = `<table>
    <thead>
        <tr>
            <th colspan="1">Species/Population Name</th><th colspan="1"  style="padding-left: 50px;">No Sequence IDs</th>
        </tr>
    </thead>
    <tbody>`;
  for (let [key, value] of currSpecMapFileHash) {
    currSpecMapFileTable += `<tr>
      <td>${key}</td>
      <td  style="padding-left: 50px;">${value}</td></tr>
      `;
  }
  currSpecMapFileTable += `    </tbody>
    </table>`;
};
