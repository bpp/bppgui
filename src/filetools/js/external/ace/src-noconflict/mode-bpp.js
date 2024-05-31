ace.define(
  "ace/mode/bpp_highlight_rules",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text_highlight_rules",
    "ace/mode/folding/fold_mode",
  ],
  function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules =
      require("./text_highlight_rules").TextHighlightRules;

    var bppVars = "seed|print";

    var BPPHighlightRules = function () {
      // regexp must not have capturing parentheses. Use (?:) instead.
      // regexps are ordered -> the first match is used
      this.$rules = {
        start: [
          {
            token: "comment", // String, Array, or Function: the CSS token to apply
            regex: /[*#].*$/, // String or RegExp: the regexp to match
            next: "start", // [Optional] String: next state to enter
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*alphaprior\s*)(=)(\s*[\d.]+\s+[\d.]+\s+\d+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*seed\s*)(=)(\s*[-+]*\d+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "string"],
            regex: /(^\s*seqfile\s*)(=)(\s*[\w_\-./\\]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "string"],
            regex: /(^\s*outfile\s*)(=)(\s*[\w_\-./\\]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "string"],
            regex: /(^\s*mcmcfile\s*)(=)(\s*[\w_\-./\\]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "string"],
            regex: /(^\s*Imapfile\s*)(=)(\s*[\w_\-./\\]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*speciesdelimitation\s*)(=)(\s*[\d.\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*speciestree\s*)(=)(\s*[\d.\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*speciesmodelprior\s*)(=)(\s*[0-3\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*model\s*)(=)(\s*[0-9A-Z]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*model\s*)(=)(\s*[\d\-]+\s+[0-9A-Z]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*phase\s*)(=)(\s*[01\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*usedata\s*)(=)(\s*[01\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*cleandata\s*)(=)(\s*[01\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*nloci\s*)(=)(\s*\d+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*print\s*)(=)(\s*[01\s]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*burnin\s*)(=)(\s*[\d]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*sampfreq\s*)(=)(\s*[\d]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*nsample\s*)(=)(\s*[\d]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(^\s*finetune\s*)(=)(\s*[\d\s.:]+)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.numeric",
              "constant.language",
            ],
            regex: /(^\s*species&tree\s*)(=)(\s*\d+)(\s*[\w_\-\d\s]+)/,
            next: "start",
          },
          {
            token: "constant.numeric",
            regex: /^\s*([\d\s]+)/,
            next: "start",
          },
          {
            token: "constant.language",
            regex: /(\([\w_\s,\)\(=.&\-\d\[\]]+\;)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.language",
              "constant.numeric",
            ],
            regex: /(\s*thetaprior\s*)(=)(\s*gamma\s*)([\d.]+\s+[\d.]+)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.language",
              "constant.numeric",
              "constant.language",
            ],
            regex:
              /(\s*thetaprior\s*)(=)(\s*invgamma\s*)([\d.]+\s+[\d.]+\s*)(e?)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.numeric",
              "constant.language",
            ],
            regex: /(\s*thetaprior\s*)(=)(\s*[\d.]+\s*[\d.]+\s*)(e?)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.language",
              "constant.numeric",
            ],
            regex: /(\s*thetaprior\s*)(=)(\s*beta\s*)([\d.\s]+)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.language",
              "constant.numeric",
            ],
            regex: /(\s*tauprior\s*)(=)(\s*gamma\s*)([\d.]+\s+[\d.]+\s*)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.language",
              "constant.numeric",
            ],
            regex: /(\s*tauprior\s*)(=)(\s*invgamma\s*)([\d.]+\s+[\d.]+\s*)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*tauprior\s*)(=)(\s*[\d.]+\s*[\d.]+\s*)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*phiprior\s*)(=)(\s*[\d.]+\s*[\d.]+\s*)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*locusrate\s*)(=)(\s*0\s*)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.numeric",
              "constant.numeric",
              "constant.language",
            ],
            regex:
              /(\s*locusrate\s*)(=)(\s*1)(\s+[\d.]+\s+[\d.]+\s+[\d.]+\s+)(iid|dir)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.numeric",
              "string",
            ],
            regex: /(\s*locusrate\s*)(=)(\s*2)(\s+[\w_\-./\\]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*clock\s*)(=)(\s*1\s*)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.numeric",
              "constant.numeric",
              "constant.language",
              "constant.language",
              "constant.language",
            ],
            regex:
              /(\s*clock\s*)(=)(\s*[23]\s+)([\d.]+\s+[\d.]+\s+[\d.]+\s+)(dir|iid)(\s+)(G|LN)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*heredity\s*)(=)(\s*0\s*)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*heredity\s*)(=)(\s*1\s+[\d.]+\s+[\d.]+\s*)/,
            next: "start",
          },
          {
            token: [
              "variable",
              "keyword.operator",
              "constant.numeric",
              "string",
            ],
            regex: /(\s*heredity\s*)(=)(\s*2\s+)([\w_\-./\\]+)/,
            next: "start",
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*checkpoint\s*)(=)([\d\s]+)/,
          },
          {
            token: ["variable", "keyword.operator", "constant.numeric"],
            regex: /(\s*threads\s*)(=)([\d\s]+)/,
          },

          { defaultToken: "text" },
        ],
      };
    };

    oop.inherits(BPPHighlightRules, TextHighlightRules);

    exports.BPPHighlightRules = BPPHighlightRules;
  }
);

ace.define(
  "ace/mode/bpp",
  [
    "require",
    "exports",
    "module",
    "ace/lib/oop",
    "ace/mode/text_highlight_rules",
  ],
  function (require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    // defines the parent mode
    var TextMode = require("./text").Mode;
    var Tokenizer = require("../tokenizer").Tokenizer;

    // defines the language specific highlighters and folding rules
    var BPPHighlightRules = require("./bpp_highlight_rules").BPPHighlightRules;

    var Mode = function () {
      // set everything up
      this.HighlightRules = BPPHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function () {
      // configure comment start/end characters
      this.lineCommentStart = "*";
      this.blockComment = { start: "/*", end: "*/" };
    }.call(Mode.prototype));

    exports.Mode = Mode;
  }
);
(function () {
  ace.require(["ace/mode/bpp"], function (m) {
    if (typeof module == "object" && typeof exports == "object" && module) {
      module.exports = m;
    }
  });
})();
