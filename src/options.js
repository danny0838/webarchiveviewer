/********************************************************************
 *
 * Manage options
 *
 *******************************************************************/

var OPTION_PREFIX = "opt_";

function initDefaultOptions() {
  utils.loadOptions((options) => {
    for (let id in options) {
      setOptionToDocument(id, options[id]);
    }
  });
}

function getOptionFromDocument(id) {
  var elem = document.getElementById(OPTION_PREFIX + id);
  if (!elem) { return; }
  switch (elem.getAttribute("type")) {
    case "checkbox":
      return elem.checked;
    default:
      return elem.value;
  }
}

function setOptionToDocument(id, value) {
  var elem = document.getElementById(OPTION_PREFIX + id);
  if (!elem) { return; }
  switch (elem.getAttribute("type")) {
    case "checkbox":
      elem.checked = value;
      break;
    default:
      elem.value = value;
      break;
  }
}

function exportOptions() {
  var data = new Blob([JSON.stringify(utils.options, null, 2)], {type: "application/json"});
  var elem = document.createElement("a");
  elem.href = URL.createObjectURL(data);
  elem.download = "webarchiveviewer.options." + utils.dateToId().slice(0, 8) + ".json";
  document.body.appendChild(elem);
  elem.click();
  elem.remove();
}

function importOptions() {
  document.getElementById("import-input").click();
}

function importFile(file) {
  document.getElementById("import-input").value = null;

  let reader = new FileReader();
  reader.onloadend = function (event) {
    var text = event.target.result;
    try {
      let data = JSON.parse(text);
      var options = Object.assign(utils.options, data);
    } catch (ex) {
      showMessage(utils.lang("ErrorImportOptions", [ex]));
      return;
    }

    // import options
    let remaining = 0;
    utils.options = options;
    utils.saveOptions((options) => {
      if (!chrome.runtime.lastError) {
        try {
          for (let id in options) {
            setOptionToDocument(id, options[id]);
          }
          showMessage(utils.lang("OptionsImportSuccess"));
        } catch (ex) {
          showMessage(utils.lang("ErrorImportOptions", [ex]));
        }
      } else {
        showMessage(utils.lang("ErrorImportOptions", [chrome.runtime.lastError]));
      }
    });
  }
  reader.readAsText(file);
}

function showMessage(msg) {
  document.getElementById("message").textContent = msg;
  window.scrollTo(0, 0);
}

window.addEventListener("DOMContentLoaded", (event) => {
  // load languages
  utils.loadLanguages(document);

  // event handlers
  document.getElementById("options").addEventListener("submit", (event) => {
    for (let id in utils.options) {
      utils.options[id] = getOptionFromDocument(id);
    }
    utils.saveOptions(() => {
      window.close();
    });
    event.preventDefault();
  });

  document.getElementById("export").addEventListener("click", (event) => {
    exportOptions();
    event.preventDefault();
  });

  document.getElementById("import").addEventListener("click", (event) => {
    importOptions();
    event.preventDefault();
  });

  document.getElementById("import-input").addEventListener("change", (event) => {
    event.preventDefault();
    var file = event.target.files[0];
    importFile(file);
  });

  // default options
  initDefaultOptions();
});
