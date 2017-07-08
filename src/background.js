/********************************************************************
 *
 * The background script for viewer functionality
 *
 *******************************************************************/

// This event won't fire when visiting a file URL if
// isAllowedFileSchemeAccess is set to false
chrome.webRequest.onBeforeRequest.addListener(function (details) {
  if (details.frameId !== 0) { return; }

  var url = new URL(details.url);
  // use a random hash to avoid recursive redirect
  if (!/\.(htz|maff)/i.test(url.pathname) || url.searchParams.has(utils.options.viewerRedirectKey)) { return; }

  var newUrl = new URL(chrome.runtime.getURL("viewer.html"));
  newUrl.hash = url.hash;
  url.hash = "";
  newUrl.search = "?src=" + encodeURIComponent(url.href);
  newUrl = newUrl.href;

  // return {redirectUrl: newUrl}; // this doesn't work
  chrome.tabs.update(details.tabId, {url: newUrl}, () => {});
  return {cancel: true};
}, {urls: ["<all_urls>"]}, ["blocking"]);

chrome.browserAction.onClicked.addListener(function (tab) {
  var url = chrome.runtime.getURL("viewer.html");
  chrome.tabs.create({url: url}, () => {});
});
