// =============== GLOBALS ==============

// Bookmarked page database
var SearchMarkDB = {};
// History page database
var SearchHistoryDB = {};

//timer
var startTime;
var endTime;

// Communicate with extension UI
var gPort;

// Used to highlight searched keywords in results
var uiHighlightStart = '<span class=highlight>';
var uiHighlightEnd = '</span>';
var uiEllipses = '<b>...</b>';
var uiContextLen = -30;

// ======================== DATABASE API ==================

// Open the mark database
SearchMarkDB.db = null;
SearchMarkDB.open = function()
{
    var dbSize = 200 * 1024 * 1024; // 200 MB
    SearchMarkDB.db =
        openDatabase('SearchMarkDB', '1.0', 'Bookmark Page Storage', dbSize);
}

//Open the history database
SearchHistoryDB.db = null;
SearchHistoryDB.open = function()
{
    var dbSize = 200 * 1024 * 1024; // 200 MB
    SearchHistoryDB.db =
    openDatabase('SearchHistoryDB', '1.0', 'Historymark Page Storage', dbSize);
}

// create the table that stores all the bookmark
// info, including the associated pages.
SearchMarkDB.createTable =
    function() 
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('CREATE VIRTUAL TABLE pages ' + 
                          'USING fts3(id INTEGER PRIMARY KEY, ' + 
                          'url TEXT, title TEXT, page TEXT, time INTEGER)',
                          [],
                          getCallback("create table", "pages", 1,1),
                          getCallback("create table", "pages", 0,1));

            tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
                          'rawpages (id INTEGER PRIMARY KEY, htmlpage TEXT)',
                          [],
                          getCallback("create table", "rawpages", 1,1),
                          getCallback("create table", "rawpages", 0,1));
        });
}


// create the table that stores all the history pages
// info, including the associated pages.
SearchHistoryDB.createTable =
    function() 
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('CREATE VIRTUAL TABLE pages ' + 
                          'USING fts3(id INTEGER PRIMARY KEY, ' + 
                          'url TEXT, title TEXT, page TEXT, time INTEGER)',
                          [],
                          getCallback("create table", "pages", 1,2),
                          getCallback("create table", "pages", 0,2));

            tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
                          'rawpages (id INTEGER PRIMARY KEY, htmlpage TEXT)',
                          [],
                          getCallback("create table", "rawpages", 1,2),
                          getCallback("create table", "rawpages", 0,2));
        });
}

// add a bookmark and associated page to the database
SearchMarkDB.addBookmarkedPage =
    function(newId, newUrl, newTitle, newPlainPage, newTime, newHtmlPage)
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            // html-free page for searching
            tx.executeSql('INSERT INTO pages(id, url, title, page, ' +
                          'time) VALUES (?,?,?,?,?)',
                          [ newId, newUrl, newTitle, newPlainPage,
                            newTime ],
                          getCallback("insert page", newId + " " +
                                      newUrl, 1,1), 
                          getCallback("insert page", newId + " " +
                                      newUrl, 0,1));

            // html page for showing cached version
            tx.executeSql('INSERT INTO rawpages(id, htmlpage) ' +
                          'VALUES (?,?)', 
                          [newId, newHtmlPage ], 
                          getCallback("insert page raw", newId +
                                      " " + newUrl, 1,1),  
                          getCallback("insert page raw", newId +
                                      " " + newUrl, 0,1)); 
        });
}

// add a history page and associated page to the database
SearchHistoryDB.addHistoryPage =
    function(newId, newUrl, newTitle, newPlainPage, newTime, newHtmlPage)
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            // html-free page for searching
            tx.executeSql('INSERT INTO pages(id, url, title, page, ' +
                          'time) VALUES (?,?,?,?,?)',
                          [ newId, newUrl, newTitle, newPlainPage,
                            newTime ],
                          getCallback("insert page", newId + " " +
                                      newUrl, 1,2), 
                          getCallback("insert page", newId + " " +
                                      newUrl, 0,2));

            // html page for showing cached version
            tx.executeSql('INSERT INTO rawpages(id, htmlpage) ' +
                          'VALUES (?,?)', 
                          [newId, newHtmlPage ], 
                          getCallback("insert page raw", newId +
                                      " " + newUrl, 1,2),  
                          getCallback("insert page raw", newId +
                                      " " + newUrl, 0,2)); 
        });
}

// remove a bookmarked page from the database
SearchMarkDB.removeBookmarkedPage =
    function(theId)
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('DELETE FROM pages WHERE id=?', [ theId ], 
                          getCallback("remove page", theId, 1,1), 
                          getCallback("remove page", theId, 0,1));

            tx.executeSql('DELETE FROM rawpages WHERE id=?', [ theId ], 
                          getCallback("remove page raw", theId, 1,1), 
                          getCallback("remove page raw", theId, 0,1));
        });
}

// remove a history page from the database
SearchHistoryDB.removeHistoryPage =
    function(theurl)
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('DELETE FROM pages WHERE url=?', [ theurl ], 
                          getCallback("remove page", theurl, 1,2), 
                          getCallback("remove page", theurl, 0,2));

            tx.executeSql('DELETE FROM rawpages WHERE url=?', [ theurl ], 
                          getCallback("remove page raw", theurl, 1,2), 
                          getCallback("remove page raw", theurl, 0,2));
        });
}

// update an already stored bookmarked page
SearchMarkDB.updateBookmarkedPage =
    function(theId, theUrl, theTitle, thePlainPage, theTime,
             theHtmlPage)
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('UPDATE pages SET url=?, ' + 
                          'title=?, page=? WHERE id=?',
                          [ theUrl, theTitle, thePlainPage, theId ],
                          getCallback("update bookmark", theUrl, 1,1),
                          getCallback("update bookmark", theUrl, 0,1));

            tx.executeSql('UPDATE rawpages SET htmlpage=? WHERE id=?',
                          [ theHtmlPage, theId ],
                          getCallback("update bookmark", "raw " + theUrl, 1,1),
                          getCallback("update bookmark", "raw " + theUrl, 0,1));
        });
}

// update an already stored history page, this will cover the original page
SearchHistoryDB.updateHistoryPage =
    function(theId, theUrl, theTitle, thePlainPage, theTime,
             theHtmlPage)
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('UPDATE pages SET url=?, ' + 
                          'title=?, page=? WHERE id=?',
                          [ theUrl, theTitle, thePlainPage, theId ],
                          getCallback("update historypage", theUrl, 1,2),
                          getCallback("update historypage", theUrl, 0,2));

            tx.executeSql('UPDATE rawpages SET htmlpage=? WHERE id=?',
                          [ theHtmlPage, theId ],
                          getCallback("update historypage", "raw " + theUrl, 1,2),
                          getCallback("update historypage", "raw " + theUrl, 0,2));
        });
}

// get all bookmark URLs. Callback function can
// be provided use the results as necessary.
SearchMarkDB.getStoredBookmarks =
    function()
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('SELECT id,url,title FROM pages',
                          [],
                          getCallback("show db", "pages", 1,1),
                          getCallback("show db", "pages", 0,1));

            tx.executeSql('SELECT id FROM rawpages',
                          [],
                          getCallback("show db", "raw", 1,1),
                          getCallback("show db", "raw", 0,1));
        });
}


// get all history URLs. Callback function can
// be provided use the results as necessary.
SearchHistoryDB.getStoredHistory =
    function()
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('SELECT id,url,title FROM pages',
                          [],
                          getCallback("show db", "pages", 1, 2),
                          getCallback("show db", "pages", 0, 2));

            tx.executeSql('SELECT id FROM rawpages',
                          [],
                          getCallback("show db", "raw", 1, 2),
                          getCallback("show db", "raw", 0, 2));
        });
}


// Supports the cached page feature. Returns cached raw html page, for SearchMarkDB
SearchMarkDB.getRawHtmlPage = 
    function (id, callback)
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('SELECT htmlpage FROM rawpages ' +
                          'WHERE id = ?',
                          [id],
                          callback,
                          getCallback("get page", "raw", 0,1));
        });
}

SearchMarkDB.doSearch =
    function(callback, keywords)
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('SELECT id,url,title, ' + 
                          'snippet(pages, "' + uiHighlightStart +
                          '", "' + uiHighlightEnd + 
                          '", "' + uiEllipses +
                          '", -1, ' + uiContextLen + ') ' +
                          'as snippet FROM pages WHERE ' + 
                          'pages MATCH ' + keywords + ' ' +
                          'ORDER BY time DESC',
                          [],
                          callback,
                          getCallback("search pages", "malformed input", 0, 1));
        });
}

// Supports the cached page feature. Returns cached raw html page, for SearchHistoryDB
SearchHistoryDB.getRawHtmlPage = 
    function (id, callback)
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('SELECT htmlpage FROM rawpages ' +
                          'WHERE id = ?',
                          [id],
                          callback,
                          getCallback("get page", "raw", 0,2));
        });
}

SearchHistoryDB.doSearch =
    function(callback, keywords)
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('SELECT id,url,title, ' + 
                          'snippet(pages, "' + uiHighlightStart +
                          '", "' + uiHighlightEnd + 
                          '", "' + uiEllipses +
                          '", -1, ' + uiContextLen + ') ' +
                          'as snippet FROM pages WHERE ' + 
                          'pages MATCH ' + keywords + ' ' +
                          'ORDER BY time DESC',
                          [],
                          callback,
                          getCallback("search pages", "malformed input", 0,2));
        });
}


// clear all stored information.
SearchMarkDB.clear =
    function()
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
            tx.executeSql('DELETE FROM pages', [], 
                          getCallback("clear table", "pages", 1,1), 
                          getCallback("clear table", "pages", 0,1));

            tx.executeSql('DELETE FROM rawpages', [], 
                          getCallback("clear table", "rawpages", 1,1), 
                          getCallback("clear table", "rawpages", 0,1));
        });
}

SearchHistoryDB.clear =
    function()
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
            tx.executeSql('DELETE FROM pages', [], 
                          getCallback("clear table", "pages", 1,2), 
                          getCallback("clear table", "pages", 0,2));

            tx.executeSql('DELETE FROM rawpages', [], 
                          getCallback("clear table", "rawpages", 1,2), 
                          getCallback("clear table", "rawpages", 0,2));
        });
}

// remove the table and all stored information
SearchMarkDB.purge =
    function()
{
    SearchMarkDB.db.transaction(
        function(tx)
        {
          tx.executeSql('DROP TABLE pages', [], 
                        getCallback("delete table", "pages", 1,1), 
                        getCallback("delete table", "pages", 0,1));

          tx.executeSql('DROP TABLE rawpages', [], 
                        getCallback("delete table", "rawpages", 1,1), 
                        getCallback("delete table", "rawpages", 0,1));
        });
}

SearchHistoryDB.purge =
    function()
{
    SearchHistoryDB.db.transaction(
        function(tx)
        {
          tx.executeSql('DROP TABLE pages', [], 
                        getCallback("delete table", "pages", 1,2), 
                        getCallback("delete table", "pages", 0,2));

          tx.executeSql('DROP TABLE rawpages', [], 
                        getCallback("delete table", "rawpages", 1 ,2), 
                        getCallback("delete table", "rawpages", 0), 2);
        });
}

// ========================== CORE ===============

// prepare to initialize

// open the database each time extension loads.
SearchMarkDB.open();
console.debug("Opened SearchMark database.");

SearchHistoryDB.open();
console.debug("Opened SearchHistory database.");

localStorage['newversion'] = 2.5;  // what is the meaning of this ??? 

// Important for new installs
if(!localStorage['oldversion'])
{ // not defined

    // set to a version before upgrade functionality ever existed
    localStorage['oldversion'] = 1.1; 
}

if(localStorage['newversion'] > localStorage['oldversion']) 
{
    // will not be true for new installs
    if(localStorage['initialized'])
    { // already installed. Do upgrade.
        console.log("Upgrading to version " +
                    localStorage['newversion']);

        doUpgrade();
    }

    localStorage['oldversion'] = localStorage['newversion'];
}

init();

chrome.browserAction.onClicked.addListener(
    function(tab)
    {
        chrome.tabs.create( 
            {'url' : 'SearchMarkUI.html'}, 
            function(newTab) {});
    });

chrome.extension.onRequest.addListener(handleRequest);

chrome.bookmarks.onChanged.addListener(
    function(id, changeInfo)
    {
        if (!localStorage['initialized'])
            return;

        getAndStoreBookmarkContent( 
            {id : id, 
             url : changeInfo.url,
             title : changeInfo.title,
             time : 0},
            SearchMarkDB.updateBookmarkedPage);
    });

chrome.bookmarks.onCreated.addListener(
    function(id, newBookmark)
    {
        localStorage['totalbookmarks']++;

        if (!localStorage['initialized'])
            return;
        
        getAndStoreBookmarkContent( 
            {id : id,
             url : newBookmark.url,
             title : newBookmark.title,
             time : newBookmark.dateAdded},
            SearchMarkDB.addBookmarkedPage);
    });

chrome.bookmarks.onRemoved.addListener(
    function(id, removeInfo)
    {
        localStorage['totalbookmarks']--;

        if (!localStorage['initialized'])
            return;

        SearchMarkDB.removeBookmarkedPage(id);
    });

// add links to history
chrome.history.onVisited.addListener(
    function(newHistoryItem)
    {
        localStorage['totalhistory']++;

        if (!localStorage['initialized'])
            return;
        
        getAndStoreHistoryContent( 
            {id : newHistoryItem.id,
             url : newHistoryItem.url,
             title : newHistoryItem.title,
             time : newHistoryItem.lastVisitTime},
             SearchHistoryDB.addHistoryPage);
    });	
	
// add listener to history's on remove
chrome.history.onVisitRemoved.addListener(
    function(empty, removeurls) //empty is a boolean variable
	//removeurls is an array of String
    {
        localStorage['totalhistory']--;

        if (!localStorage['initialized'])
            return;
        
		if(empty){ 
		// delete all data in the history database
		SearchHistoryDB.purge();
		return;
		}
	    
		for(var i = 0; i< removeurls.length; i++)
        SearchHistoryDB.removeHistoryPage(removeurls[i]);
    });

// experimental APIs require user to start chrome with a specific option
// flag from the command line. So, not using for now.
// chrome.experimental.omnibox.onInputEntered.addListener(
//     function(keywords) {
//         handleRequest({method: 'search', keywords: keywords},
//                       background, function() {});
//     }
// );

// ================= CORE API ===================

function init()
{
    console.log("Initializing...");
    localStorage['added'] = 0;
    // if bookmarks in DB not in sync with actual bookmarks
    if(localStorage['added'] && localStorage['totalbookmarks'] &&
       localStorage['added'] != localStorage['totalbookmarks'])
        cleanupStorage();
		
	if(localStorage['historyadded'] && localStorage['totalhistory'] &&
       localStorage['historyadded'] != localStorage['totalhistory'])
        cleanupStorage();

    // initialize once only. Populate the database
    // by retrieving and storing bookmarked pages, and
    // URLs.
    if (!localStorage['initialized'] || 
        localStorage['initialized'] == 0) 
    {
        SearchMarkDB.createTable();
        SearchHistoryDB.createTable();
		
		var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
        var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
		
        chrome.bookmarks.getTree(
            function(bookmarks)
            {
                localStorage['added'] = 0;
                localStorage['totalbookmarks'] = 0;
    	        initBookmarkDatabase(bookmarks);
            });
		
		//populate the history database
	    chrome.history.search({
		'text':'',
		'startTime': oneWeekAgo
		},
            function(historyItems)
            {
			    //alert("test");
                localStorage['historyadded'] = 0;
                localStorage['totalhistory'] = 0;
    	        initHistoryDatabase(historyItems);
            });

        // number of times the welcome page was opened
        localStorage['uivisits'] = 0;

        localStorage['initialized'] = 1;
    } else {
        localStorage['initialized']++;
    }
}

// any upgrade functionality should be placed here
function doUpgrade()
{
    if(localStorage['oldversion'] < 2.4)
        cleanupStorage();
}

// clean up stored configuration variables
function cleanupStorage()
{
    console.log("Cleaning up...");

    console.log("Clearing database tables");
    SearchMarkDB.clear();
	SearchHistoryDB.clear();

    console.log("Removing the tables");
    SearchMarkDB.purge();
	SearchHistoryDB.purge();

    console.log("Setting to 'not initialized'");
    localStorage['initialized'] = 0;
}


function handleRequest(request, sender, callback)
{
    if (request.method == 'search') {
    	startTime=new Date();
    	speak("Please wait for a moment, we are searching for you.");
    	
        gPort = chrome.extension.connect( {name : "uiToBackend"});
        console.debug("search " + request.keywords);
		if(request.searchtype == 1)
        SearchMarkDB.doSearch(searchPagesCb, 
                              "'" + request.keywords + "'");
							  
	//  this is to do test
	    if(request.searchtype == 2)
	    SearchHistoryDB.doSearch(searchPagesCb, 
                              "'" + request.keywords + "'");
	    
        callback();
    } else if (request.method == 'cached') {
	    if(request.searchtype == 1)
        SearchMarkDB.getRawHtmlPage(request.pageid, displayRawPage);
		
		if(request.searchtype == 2)
        SearchHistoryDB.getRawHtmlPage(request.pageid, displayRawPage);

        console.debug("cache request " + request.pageid);

        callback();
    } else {
        callback();
    }
}

function displayRawPage(tx, r)
{
    if(r.rows.length) {

        chrome.tabs.create(
            {url: 'rawPageView.html', selected: true}, 
            function (tab)
            {
                // connect to tab that will show the raw page
                var port = chrome.extension.connect({name:
                "rawPageView"});
                
                // send the raw page
                port.postMessage(r.rows.item(0).htmlpage);

                // done.
                port.disconnect();
            });

    } else {
        console.log("Unexpected error: this page should have " + 
                    "been cached. Please file a bug report " + 
                    "at <todo:put github url here>");
    }
}

function searchPagesCb(tx, r)
{
    endTime=new Date();
    var result = {};
    if(r.rows.length==0){
    	result.matchType = "nopage";
    	gPort.postMessage(result);
    }else{
	    for ( var i = 0; i < r.rows.length; i++) {
	        result.id = r.rows.item(i).id;
	        result.url = r.rows.item(i).url;
	        result.title = r.rows.item(i).title;
	        result.text = r.rows.item(i).snippet;
	        result.matchType = "page";
	
	        gPort.postMessage(result);
	
	        result = {};
	    }
    }

    result.matchType = "DONE";

    gPort.postMessage(result);
    
    var time=endTime.getTime()-startTime.getTime();
    speak("we spend "+time+" millisecond to get "+r.rows.length+" entries of search results!");
}


function removeHTMLfromPage(page)
{
    // reduce spaces, remove new lines
    var pagetxt = page.replace(/\s+/gm, " ");

    // remove 'script', 'head', 'style' tags
    pagetxt = pagetxt.replace(/<\s*?head.*?>.*?<\s*?\/\s*?head\s*?>/i, " ");
    pagetxt = pagetxt.replace(/<\s*?script.*?>.*?<\s*?\/\s*?script\s*?>/gi, " ");
    pagetxt = pagetxt.replace(/<\s*?style.*?>.*?<\s*?\/\s*?style\s*?>/gi, " ");

    // Now remove other tags
    pagetxt = pagetxt.replace(/<.*?\/?>/g, " ");

    // Remove symbols
    pagetxt = pagetxt.replace(/&.*?;/g, " ");

    // Remove comment markers
    pagetxt = pagetxt.replace(/(<!--|-->)/g, " ");

    // After all the filtering, need to fix up spaces again
    pagetxt = pagetxt.replace(/\s+/gm, " ");

    return pagetxt;
}

function getAndStoreBookmarkContent(bookmark, storeInDB)
{
    try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", bookmark.url, true);
        xhr.onreadystatechange = function()
        {
            try {
                if (this.readyState == 4) {

                    var pageNoHtml = removeHTMLfromPage(this.responseText);

                    // add page to database
                    storeInDB(bookmark.id, bookmark.url,
                              bookmark.title, pageNoHtml,
                              bookmark.dateAdded, this.responseText);

                    this.abort();
                }
            } catch (e) {
                console.log(e.message);
                storeInDB(bookmark.id, bookmark.url, bookmark.title,
                          "", "");
            }
        }

        xhr.send();
    } catch (e) {
        console.log(e.message + bookmark.url);
        storeInDB(bookmark.id, bookmark.url, bookmark.title, "", "");
    }
}

// get and store history page content
function getAndStoreHistoryContent(historyItem, storeInDB)
{
   try {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", historyItem.url, true);
        xhr.onreadystatechange = function()
        {
            try {
                if (this.readyState == 4) {

                    var pageNoHtml = removeHTMLfromPage(this.responseText);

                    // add page to database
                    storeInDB(historyItem.id, historyItem.url,
                              historyItem.title, pageNoHtml,
                              historyItem.lastVisitTime, this.responseText);

                    this.abort();
                }
            } catch (e) {
                console.log(e.message);
                storeInDB(historyItem.id, historyItem.url, historyItem.title,
                          "", "");
            }
        }

        xhr.send();
    } catch (e) {
        console.log(e.message + historyItem.url);
        storeInDB(historyItem.id, historyItem.url, historyItem.title, "", "");
    }
}

function initBookmarkDatabase(bookmarks)
{
    bookmarks.forEach(
        function(bookmark)
        {
            if (bookmark.url && 
                bookmark.url.match("^https?://*")) 
            { // url exists and is well formed

                console.debug("Adding " + bookmark.url);

                localStorage['totalbookmarks']++;

                getAndStoreBookmarkContent(bookmark,
                                           SearchMarkDB.addBookmarkedPage);
            } else {
                console.debug("Skipping. " + bookmark.url);
            }

            if (bookmark.children)
                initBookmarkDatabase(bookmark.children);
        });
}

//initialize history database
function initHistoryDatabase(historyItems)
{
    for(var i = 0; i < historyItems.length; i++){
       
            if (historyItems[i].url  && historyItems[i].url.match("^https?://*")) 
            { // url exists and is well formed
               
                console.debug("Adding " + historyItems[i].url);

                localStorage['totalhistorymarks']++;

                getAndStoreHistoryContent(historyItems[i],
                           SearchHistoryDB.addHistoryPage);
            } else {
                console.debug("Skipping. " + historyItems[i].url);
            }
       };
   // alert(historyItems[0].url);
}

function getCallback(cbname, msg, type, dbtype)
{
    switch (cbname) {
    case "show db":
        if (type == 1)
            return function(tx, r)
        {
            for ( var i = 0; i < r.rows.length; i++) {
                console.log("Stored. " + msg + " " +
                            r.rows.item(i).url);
            }
        }
        else
            return function(tx, r)
        {
            console.debug("failed: " + cbname + " " + msg);
            console.log("  " + e.message);
        }            
        break;
    case "search pages":
        if (type == 1) // success callback
            return function(tx, r)
        {
            console.debug("succeeded: " + cbname + " " + msg);
        }
        else
            return function(tx, e)
        {
            console.debug("failed: " + cbname + " " + msg);
            console.log("  " + e.message);

            // search pages failed, tell user
            var result = {};

            result.matchType = "DONE";
            result.error = 'Sorry, I am not sure what you are ' +
                'looking for. Could you be missing a quote (") ' +
                'while searching for a phrase?';

            gPort.postMessage(result);
        }
        break;
    case "insert page raw":
        if (type == 1) // success callback
            return function(tx, r)
        {
            console.debug("succeded: " + cbname + " " + msg);
            if(dbtype==1)localStorage['added']++;
			if(dbtype==2)localStorage['historyadded']++;
        }
        else
            // failure callback
            return function(tx, e)
        {
            console.debug("failed: " + cbname + " " + msg);
            console.log("  " + e.message);
        }
        break;
    case "remove page raw":
        if (type == 1) // success callback
            return function(tx, r)
        {
            console.debug("succeeded: " + cbname + " " + msg);
            if(dbtype==1)localStorage['added']--;
			if(dbtype==2)localStorage['historyadded']--;
        }
        else
            // failure callback
            return function(tx, e)
        {
            console.debug("failed: " + cbname + " " + msg);
            console.log("  " + e.message);
        }
        break;
    default:
        if (type == 1) // success callback
            return function(tx, r)
        {
            console.debug("succeeded: " + cbname + " " + msg);
        }
        else
            // failure callback
            return function(tx, e)
        {
            console.debug("failed: " + cbname + " " + msg);
            console.log("  " + e.message);
        }
    }
}

//======================== SPEAK SECTION ==================
var lastUtterance = '';
var speaking = false;
var globalUtteranceIndex = 0;

if (localStorage['lastVersionUsed'] != '1') {
  localStorage['lastVersionUsed'] = '1';
  chrome.tabs.create({
    url: chrome.extension.getURL('options.html')
  });
}

function speak(utterance) {
  if (speaking && utterance == lastUtterance) {
    chrome.tts.stop();
    return;
  }

  speaking = true;
  lastUtterance = utterance;
  globalUtteranceIndex++;
  var utteranceIndex = globalUtteranceIndex;

  var rate = localStorage['rate'] || 1.0;
  var pitch = localStorage['pitch'] || 1.0;
  var volume = localStorage['volume'] || 1.0;
  var voice = localStorage['voice'];
  chrome.tts.speak(
      utterance,
      {voiceName: voice,
       rate: parseFloat(rate),
       pitch: parseFloat(pitch),
       volume: parseFloat(volume),
       onEvent: function(evt) {
         if (evt.type == 'end' ||
             evt.type == 'interrupted' ||
             evt.type == 'cancelled' ||
             evt.type == 'error') {
           if (utteranceIndex == globalUtteranceIndex) {
             speaking = false;
           }
         }
       }
      });
}
