/********************************************************************
 *
 * Loads and updates options automatically
 *
 *******************************************************************/

utils.loadOptions();

chrome.storage.onChanged.addListener((changes, areaName) => {
  for (let key in changes) {
    utils.options[key] = changes[key].newValue;
  }
});
