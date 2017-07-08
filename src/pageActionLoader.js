/********************************************************************
 *
 * Loads the page action for which browser action is not supported
 * (mostly older versions of firefox Android)
 *
 *******************************************************************/

if (!chrome.browserAction) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    chrome.pageAction.show(tabId);
  });

  chrome.pageAction.onClicked.addListener(function (tab) {
    var url = chrome.runtime.getURL("viewer.html");
    chrome.tabs.create({url: url}, () => {});
  });
}
