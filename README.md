*Web Archive Viewer* is a browser addon that views an HTML-based web page archive.

Click on the toolbar icon to open the viewer page, and then pick an archive file for viewing.

You can also open an archive file with the browser directly to view it. (Firefox can only do this for web-served files.)

This extension is available for Chromium-based browsers (Google Chrome, Opera, Vivadi, etc), Firefox Desktop and Firefox for Android.

Supported archive file formats are:

1. **htz**: A file format which a webpage as well as its referenced resources are packed in a file using the zip algorithm, with "index.html" being the entry.

2. **maff**: A file format which each webpage as well as its referenced resources are packed into a top sub-directory of a file using the zip algorithm. See [official introduction](http://maf.mozdev.org/index.html) for detail.

You can use [Web ScrapBook](https://github.com/danny0838/webscrapbook) to save a webpage as the above formats.

We'll support .epub, .mht, .chm, etc, in the future if viable.


## Caveats:

* A vary large zip file (around 2 GiB) cannot be opened by the browser.

* A large file in the zip (around 400~500 MiB) can exhaust the memory and crash the extension.

* Javascript in the archive file might not work correctly, especially when it loads an external script or file dynamically. (Firefox is more likely to run into this issue due to more restriction of its addon system.)


## See also:

* [Download Chrome extension in Chrome web store](https://chrome.google.com/webstore/detail/web-archive-viewer/oogbkbeohkbgjmnagnmmbdocplpljbgp)
* [Download Firefox addon](https://danny0838.github.io/webarchiveviewer/files/firefox/latest.html)
* [View project repository](https://github.com/danny0838/webarchiveviewer)
