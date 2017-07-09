/********************************************************************
 *
 * Shared functions for most scripts, including background scripts and
 * content scripts.
 *
 * @public {Object} utils
 *******************************************************************/

var utils = {};
var isDebug = false;


/********************************************************************
 * Options
 *******************************************************************/

utils.options = {
  viewerRedirectKey: "QEDbgTS2R2uqCZYy",
  useFileSystemApi: true,
};

utils.isOptionsSynced = false;

utils.getOption = function (key, defaultValue) {
  var result = utils.options[key];
  if (result === undefined) {
    result = defaultValue;
  }
  return result;
};

utils.getOptions = function (keyPrefix) {
  var result = {};
  var regex = new RegExp("^" + utils.escapeRegExp(keyPrefix) + ".");
  for (let key in utils.options) {
    if (regex.test(key)) {
      result[key] = utils.getOption(key);
    }
  }
  return result;
};

utils.setOption = function (key, value, callback) {
  utils.options[key] = value;
  chrome.storage.sync.set({key: value}, () => {
    if (callback) {
      callback({key: value});
    }
  });
};

utils.loadOptions = function (callback) {
  chrome.storage.sync.get(utils.options, (items) => {
    for (let i in items) {
      var item = items[i];
      if (Object.prototype.toString.call(item) === "[object Array]") {
        utils.options[i] = item[item.pop()];
      } else {
        utils.options[i] = item;
      }
    }
    if (callback) {
      utils.isOptionsSynced = true;
      callback(utils.options);
    }
  });
};

utils.saveOptions = function (callback) {
  chrome.storage.sync.set(utils.options, () => {
    if (callback) {
      callback(utils.options);
    }
  });
};


/********************************************************************
 * Lang
 *******************************************************************/

utils.lang = function (key, args) {
  return chrome.i18n.getMessage(key, args) || "__MSG_" + key + "__";
};

utils.loadLanguages = function (rootNode) {
  Array.prototype.forEach.call(rootNode.getElementsByTagName("*"), (elem) => {
    var str = elem.textContent;
    if (/^__MSG_(.*?)__$/.test(str)) {
      elem.textContent = utils.lang(RegExp.$1);
    }
    Array.prototype.forEach.call(elem.attributes, (attr) => {
      if (/^__MSG_(.*?)__$/.test(attr.nodeValue)) {
        attr.nodeValue = utils.lang(RegExp.$1);
      }
    }, this);
  }, this);
};


/********************************************************************
 * path/file/string/etc handling
 *******************************************************************/

utils.urlToFilename = function (url) {
  var name = url, pos;
  pos = name.indexOf("?");
  if (pos !== -1) { name = name.substring(0, pos); }
  pos = name.indexOf("#");
  if (pos !== -1) { name = name.substring(0, pos); }
  pos = name.lastIndexOf("/");
  if (pos !== -1) { name = name.substring(pos + 1); }

  // decode %xx%xx%xx only if it's correctly UTF-8 encoded
  // @TODO: decode using a specified charset
  try {
    name = decodeURIComponent(name);
  } catch (ex) {}
  return name;
};

utils.splitUrl = function (url) {
  var name = url, search = "", hash = "", pos;
  pos = name.indexOf("#");
  if (pos !== -1) { hash = name.slice(pos); name = name.slice(0, pos); }
  pos = name.indexOf("?");
  if (pos !== -1) { search = name.slice(pos); name = name.slice(0, pos); }
  return [name, search, hash];
};

utils.splitUrlByAnchor = function (url) {
  var [name, search, hash] = utils.splitUrl(url);
  return [name + search, hash];
};

utils.filenameParts = function (filename) {
  var pos = filename.lastIndexOf(".");
  if (pos != -1) {
    return [filename.substring(0, pos), filename.substring(pos + 1, filename.length)];
  }
  return [filename, ""];
};

utils.dateToId = function (date) {
  var dd = date || new Date();
  return dd.getUTCFullYear() +
      this.intToFixedStr(dd.getUTCMonth() + 1, 2) +
      this.intToFixedStr(dd.getUTCDate(), 2) +
      this.intToFixedStr(dd.getUTCHours(), 2) +
      this.intToFixedStr(dd.getUTCMinutes(), 2) +
      this.intToFixedStr(dd.getUTCSeconds(), 2) +
      this.intToFixedStr(dd.getUTCMilliseconds(), 3);
};


/********************************************************************
 * String handling
 *******************************************************************/

utils.getUuid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = Math.random()*16|0, v = (c == 'x') ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

utils.escapeHtml = function (str, noDoubleQuotes, singleQuotes, spaces) {
  var list = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': (noDoubleQuotes ? '"' : "&quot;"),
    "'": (singleQuotes ? "&#39;" : "'"),
    " ": (spaces ? "&nbsp;" : " ")
  };
  return str.replace(/[&<>"']| (?= )/g, m => list[m]);
};

utils.escapeRegExp = function (str) {
  return str.replace(/([\*\+\?\.\^\/\$\\\|\[\]\{\}\(\)])/g, "\\$1");
};

utils.escapeHtmlComment = function (str) {
  return str.replace(/-([\u200B]*)-/g, "-\u200B$1-");
};

utils.escapeQuotes = function (str) {
  return str.replace(/[\\"]/g, "\\$&");
};

utils.unescapeCss = function (str) {
  var that = arguments.callee;
  if (!that.replaceRegex) {
    that.replaceRegex = /\\([0-9A-Fa-f]{1,6}) ?|\\(.)/g;
    that.getCodes = function (n) {
      if (n < 0x10000) return [n];
      n -= 0x10000;
      return [0xD800+(n>>10), 0xDC00+(n&0x3FF)];
    };
    that.replaceFunc = function (m, u, c) {
      if (c) return c;
      if (u) return String.fromCharCode.apply(null, that.getCodes(parseInt(u, 16)));
    };
  }
  return str.replace(that.replaceRegex, that.replaceFunc);
};

utils.decodeURIComponent = function (uri) {
  // A URL containing standalone "%"s causes a malformed URI sequence error.
  return uri.replace(/(%[0-9A-F]{2})+/gi, m => decodeURIComponent(m));
};

utils.stringToDataUri = function (str, mime, charset) {
  mime = mime || "";
  charset = charset ? ";charset=" + charset : "";
  return "data:" + mime + charset + ";base64," + this.unicodeToBase64(str);
};

utils.intToFixedStr = function (number, width, padder) {
  padder = padder || "0";
  number = number.toString(10);
  return number.length >= width ? number : new Array(width - number.length + 1).join(padder) + number;
};

utils.byteStringToArrayBuffer = function (bstr) {
  return new TextEncoder("utf-8").encode(bstr).buffer;
};

utils.arrayBufferToByteString = function (ab) {
  return new TextDecoder("utf-8").decode(new Uint8Array(ab));
};


/********************************************************************
 * String handling - HTML Header parsing
 *******************************************************************/

/**
 * Parse Content-Type string from the HTTP Header
 *
 * @return {{contentType: string, charset: string}}
 */
utils.parseHeaderContentType = function (string) {
  var match = string.match(/^\s*(.*?)(?:\s*;\s*charset\s*=\s*(.*?))?$/i);
  return {contentType: match[1], charset: match[2]};
};

/**
 * Parse Content-Disposition string from the HTTP Header
 *
 * ref: https://github.com/jshttp/content-disposition/blob/master/index.js
 *
 * @param {string} string - The string to parse, not including "Content-Disposition: "
 * @return {{type: ('inline'|'attachment'), parameters: {[filename: string]}}}
 */
utils.parseHeaderContentDisposition = function (string) {
  var result = {type: undefined, parameters: {}};

  if (!string || typeof string !== 'string') {
    return result;
  }

  var parts = string.split(";");
  result.type = parts.shift().trim();

  parts.forEach((part) => {
    if (/^(.*?)=(.*?)$/.test(part)) {
      var field = RegExp.$1.trim();
      var value = RegExp.$2.trim();

      // manage double quoted value
      if (/^"(.*?)"$/.test(value)) {
        value = RegExp.$1;
      }

      if (/^(.*)\*$/.test(field)) {
        // ext-value
        field = RegExp.$1;
        if (/^(.*?)'(.*?)'(.*?)$/.test(value)) {
          var charset = RegExp.$1.toLowerCase(), lang = RegExp.$2.toLowerCase(), value = RegExp.$3;
          switch (charset) {
            case 'iso-8859-1':
              value = decodeURIComponent(value).replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
              break;
            case 'utf-8':
              value = decodeURIComponent(value);
              break;
            default:
              console.error('Unsupported charset in the extended field of header content-disposition: ' + charset);
              return;
          }
        };
      }
      result.parameters[field] = value;
    }
  }, this);

  return result;
};


/********************************************************************
 * HTML DOM related utilities
 *******************************************************************/

utils.doctypeToString = function (doctype) {
  if (!doctype) { return ""; }
  var ret = "<!DOCTYPE " + doctype.name;
  if (doctype.publicId) { ret += ' PUBLIC "' + doctype.publicId + '"'; }
  if (doctype.systemId) { ret += ' "'        + doctype.systemId + '"'; }
  ret += ">\n";
  return ret;
};

/**
 * The function that is called to process the rewritten CSS.
 *
 * @callback parseCssFileRewriteFuncCallback
 * @param {string} cssText - the rewritten CSS text
 */

/**
 * The function that rewrites the CSS text.
 *
 * @callback parseCssFileRewriteFunc
 * @param {string} oldText - the original CSS text
 * @param {parseCssFileRewriteFuncCallback} onRewriteComplete
 */

/**
 * @callback parseCssFileCallback
 * @param {Blob} cssBlob - the rewritten CSS blob
 */

/**
 * Process a CSS file and rewrite it
 *
 * Browser normally determine the charset of a CSS file via:
 * 1. HTTP header content-type
 * 2. Unicode BOM in the CSS file
 * 3. @charset rule in the CSS file
 * 4. assume it's UTF-8
 *
 * We save the CSS file as UTF-8 for better compatibility.
 * For case 3, a UTF-8 BOM is prepended to suppress the @charset rule.
 * We don't follow case 4 and save the CSS file as byte string so that
 * the user could fix the encoding manually.
 *
 * @param {Blob} data
 * @param {string} charset
 * @param {parseCssFileRewriteFunc} rewriteFunc
 * @param {parseCssFileCallback} onComplete
 */
utils.parseCssFile = function (data, charset, rewriteFunc, onComplete) {
  var readCssText = function (blob, charset, callback) {
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
      callback(reader.result);
    });
    reader.readAsText(blob, charset);
  };

  var readCssBytes = function (blob, callback) {
    var reader = new FileReader();
    reader.addEventListener("loadend", () => {
      var bstr = utils.arrayBufferToByteString(reader.result);
      callback(bstr);
    });
    reader.readAsArrayBuffer(blob);
  };

  var processCss = function (oldText) {
    rewriteFunc(oldText, (text) => {
      if (charset) {
        var blob = new Blob([text], {type: "text/css;charset=UTF-8"});
      } else {
        var ab = utils.byteStringToArrayBuffer(text);
        var blob = new Blob([ab], {type: "text/css"});
      }
      onComplete(blob);
    });
  };

  if (charset) {
    readCssText(data, charset, (text) => {
      processCss(text);
    });
  } else {
    readCssBytes(data, (bytes) => {
      if (bytes.startsWith("\xEF\xBB\xBF")) {
        charset = "UTF-8";
      } else if (bytes.startsWith("\xFE\xFF")) {
        charset = "UTF-16BE";
      } else if (bytes.startsWith("\xFF\xFE")) {
        charset = "UTF-16LE";
      } else if (bytes.startsWith("\x00\x00\xFE\xFF")) {
        charset = "UTF-32BE";
      } else if (bytes.startsWith("\x00\x00\xFF\xFE")) {
        charset = "UTF-32LE";
      } else if (/^@charset (["'])(\w+)\1;/.test(bytes)) {
        charset = RegExp.$2;
      }
      if (charset) {
        readCssText(data, charset, (text) => {
          // The read text does not contain a BOM.
          // Add a BOM so that browser will read this CSS as UTF-8 in the future.
          // This added UTF-16 BOM will be converted to UTF-8 BOM automatically when creating blob.
          text = "\ufeff" + text;
          processCss(text);
        });
      } else {
        processCss(bytes);
      }
    });
  }
};

/**
 * The function that rewrites each URL into a new URL.
 *
 * @callback parseCssTextRewriteFunc
 * @param {string} url
 * @return {string} newUrl
 */

/**
 * process the CSS text of whole <style> or a CSS file
 *
 * @TODO: current code is rather heuristic and ugly,
 *        consider implementing a real CSS parser to prevent potential errors
 *        for certain complicated CSS
 *
 * @param {string} cssText
 * @param {Object} rewriteFuncs
 *     - {parseCssTextRewriteFunc} rewriteImportUrl
 *     - {parseCssTextRewriteFunc} rewriteFontFaceUrl
 *     - {parseCssTextRewriteFunc} rewriteBackgroundUrl
 */
utils.parseCssText = function (cssText, rewriteFuncs) {
  var pCm = "(?:/\\*[\\s\\S]*?\\*/)"; // comment
  var pSp = "(?:[ \\t\\r\\n\\v\\f]*)"; // space equivalents
  var pCmSp = "(?:" + "(?:" + pCm + "|" + pSp + ")" + "*" + ")"; // comment or space
  var pChar = "(?:\\\\.|[^\\\\])"; // a char, or a escaped char sequence
  var pStr = "(?:" + pChar + "*?" + ")"; // string
  var pSStr = "(?:" + pCmSp + pStr + pCmSp + ")"; // spaced string
  var pDQStr = "(?:" + '"' + pStr + '"' + ")"; // double quoted string
  var pSQStr = "(?:" + "'" + pStr + "'" + ")"; // single quoted string
  var pES = "(?:" + "(?:" + [pCm, pDQStr, pSQStr, pChar].join("|") + ")*?" + ")"; // embeded string
  var pUrl = "(?:" + "url\\(" + pSp + "(?:" + [pDQStr, pSQStr, pSStr].join("|") + ")" + pSp + "\\)" + ")"; // URL
  var pUrl2 = "(" + "url\\(" + pSp + ")(" + [pDQStr, pSQStr, pSStr].join("|") + ")(" + pSp + "\\)" + ")"; // URL; catch 3
  var pRImport = "(" + "@import" + pCmSp + ")(" + [pUrl, pDQStr, pSQStr].join("|") + ")(" + pCmSp + ";" + ")"; // rule import; catch 3
  var pRFontFace = "(" + "@font-face" + pCmSp + "{" + pES + "}" + ")"; // rule font-face; catch 1

  var parseUrl = function (text, callback) {
    return text.replace(new RegExp(pUrl2, "gi"), (m, pre, url, post) => {
      if (url.startsWith('"') && url.endsWith('"')) {
        var url = utils.unescapeCss(url.slice(1, -1));
        var ret = callback(url);
      } else if (url.startsWith("'") && url.endsWith("'")) {
        var url = utils.unescapeCss(url.slice(1, -1));
        var ret = callback(url);
      } else {
        var url = utils.unescapeCss(url.trim());
        var ret = callback(url);
      }
      return pre + '"' + utils.escapeQuotes(ret) + '"' + post;
    });
  };

  var cssText = cssText.replace(
    new RegExp([pCm, pRImport, pRFontFace, "("+pUrl+")"].join("|"), "gi"),
    (m, im1, im2, im3, ff, u) => {
      if (im2) {
        if (im2.startsWith('"') && im2.endsWith('"')) {
          var url = utils.unescapeCss(im2.slice(1, -1));
          var ret = 'url("' + utils.escapeQuotes(rewriteFuncs.rewriteImportUrl(url)) + '")';
        } else if (im2.startsWith("'") && im2.endsWith("'")) {
          var url = utils.unescapeCss(im2.slice(1, -1));
          var ret = 'url("' + utils.escapeQuotes(rewriteFuncs.rewriteImportUrl(url)) + '")';
        } else {
          var ret = parseUrl(im2, rewriteFuncs.rewriteImportUrl);
        }
        return im1 + ret + im3;
      } else if (ff) {
        return parseUrl(m, rewriteFuncs.rewriteFontFaceUrl);
      } else if (u) {
        return parseUrl(m, rewriteFuncs.rewriteBackgroundUrl);
      }
      return m;
    });
  return cssText;
};

/**
 * The function that rewrites each URL into a new URL.
 *
 * @callback parseSrcsetRewriteFunc
 * @param {string} url
 * @return {string} newUrl
 */

/**
 * @param {string} srcset
 * @param {parseSrcsetRewriteFunc} rewriteFunc
 */
utils.parseSrcset = function (srcset, rewriteFunc) {
  return srcset.replace(/(\s*)([^ ,][^ ]*[^ ,])(\s*(?: [^ ,]+)?\s*(?:,|$))/g, (m, m1, m2, m3) => {
    return m1 + rewriteFunc(m2) + m3;
  });
};


/********************************************************************
 * Network utilities
 *******************************************************************/

/**
 * The callback function that aborts the XMLHttpRequest when called.
 *
 * @callback xhrAbortCallback
 */

/**
 * @callback xhrEventHandler
 * @param {XMLHttpRequest} xhr
 * @param {xhrAbortCallback} xhrAbort
 */

/**
 * A simple XMLHttpRequest wrapper for most common tasks
 *
 * @param {Object} params
 *     - {string} params.url
 *     - {string} params.responseType
 *     - {xhrEventHandler} params.onreadystatechange
 *     - {xhrEventHandler} params.onloadend
 *     - {xhrEventHandler} params.onerror
 *     - {xhrEventHandler} params.ontimeout
 */
utils.xhr = function (params) {
  var xhr = new XMLHttpRequest();

  var xhrAbort = function () {
    xhr.onreadystatechange = xhr.onerror = xhr.ontimeout = null;
    xhr.abort();
  };

  xhr.onreadystatechange = function () {
    params && params.onreadystatechange && params.onreadystatechange(xhr, xhrAbort);
  };

  xhr.onloadend = function () {
    params && params.onloadend && params.onloadend(xhr, xhrAbort);
  };

  xhr.onerror = function () {
    params && params.onerror && params.onerror(xhr, xhrAbort);
  };

  xhr.ontimeout = function () {
    var handler = params && params.ontimeout || params.onerror;
    handler && handler(xhr, xhrAbort);
  };

  try {
    xhr.responseType = params.responseType;
    xhr.open("GET", params.url, true);
    xhr.send();
  } catch (ex) {
    console.error(ex);
    xhr.onerror();
  }
};
