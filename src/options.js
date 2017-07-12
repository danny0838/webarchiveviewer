/********************************************************************
 *
 * Manage options
 *
 *******************************************************************/

var OPTION_PREFIX = "opt_";

function initDefaultOptions() {
  // create elements for default options
  for (let id in utils.options) {
    let value = utils.options[id];

    let p = document.createElement("p");
    document.getElementById("optionsWrapper").appendChild(p);

    let label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = id + ": ";
    p.appendChild(label);

    switch(Object.prototype.toString.call(value)) {
      case "[object Boolean]": {
        let input = document.createElement("input");
        input.id = OPTION_PREFIX + id;
        input.setAttribute("type", "checkbox");
        value && input.setAttribute("checked", "checked");
        p.appendChild(input);
        break;
      }
      case "[object Number]": {
        let input = document.createElement("input");
        input.id = OPTION_PREFIX + id;
        input.setAttribute("type", "number");
        input.setAttribute("value", value);
        p.appendChild(input);
        break;
      }
      case "[object Array]": {
        let input = document.createElement("select");
        input.id = OPTION_PREFIX + id;
        input.setAttribute("type", "select");
        p.appendChild(input);
        for (let i=0, I=value.length; i<I-1; ++i) {
          let item = value[i];
          let option = document.createElement("option");
          option.value = option.textContent = item;
          input.appendChild(option);
        }
        break;
      }
      default: {  // string
        let input = document.createElement("input");
        input.id = OPTION_PREFIX + id;
        input.setAttribute("type", "text");
        input.setAttribute("value", value);
        p.appendChild(input);
        break;
      }
    }
  }

  // load from sync
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

  // default options
  initDefaultOptions();
});
