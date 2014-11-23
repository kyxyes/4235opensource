//$(document).ready(
    function init() 
    {
        // Listen for search results from backend
        chrome.extension.onConnect.addListener(function(port) {
            if(port.name != "uiToBackend") {
                console.log("Invalid port name: " + port.name);
                return;
            }
            
            port.onMessage.addListener(function(result) {
                processSearchResult(result);
            });
        });

        localStorage['uivisits']++;

        /* stop showing tip after 2 UI visits */
        if(localStorage['uivisits'] < 4)
            $('#welcomesearchbox').append(
                '<div id="tiparea"><p><b>Tip:</b> Use the "*". ' +
                    'For example, to search for words beginning ' +
                    'with "mar", simply type "mar*".</div>');

        if(localStorage['uivisits'] == 3)
            $('#tiparea').delay(3000).fadeOut(
                'slow',
                function () {});

        $('#searchbox').focus();
        $('#searchbox').keyup(function(e) {
	        if(e.keyCode == 13) {
		        leavePage('#welcomepage');
	        }
        });
    }//);

// Send request to backend for displaying a cached bookmark page
function requestCachedPage(id) {
    chrome.extension.sendRequest(
        {method: 'cached', pageid: id}, 
        function() {});
}

var type = 1;
var searchbtnid = "'#searchbutton'";
var searchbtneffect = "'searchbuttonpressed'";
var resultspagename = "'#resultspage'";
//var SearchName = "Search in Bookmark";
/*
var results_page_top_html = 
    '<div id="topsearch">' +
    '<table><tr>' +
    '<th id = "thlogo"><img src="images/logotext-results.png"/></th>' +
    '<!-- search box -->' +
    '<th id = "thsearchbox"><input type="text" id="searchbox"' +
    'class="searchbox"/>' +
    '<!-- search button -->' +
    '<button type="button" id= "searchbutton" class="searchbutton"' +
    '>' + SearchName + '</button></th>' + 
    '</tr></table>' +
    '</div>';
*/

// 'onmousedown="$(' + searchbtnid + ').addClass(' + searchbtneffect
//+ ')"' + 
//'onmouseup="$(' + searchbtnid + ').removeClass('+ 
//searchbtneffect + ');leavePage(' + resultspagename + ')"

// Take keywords from text box and send to
// backend for searching.
function doSearch(searchwords) {
	//empty body
	if(type == 1){
	var results_page_top_html = 
    '<div id="topsearch">' +
    '<table><tr>' +
    '<th id = "thlogo"><img src="images/logotext-results.png"/></th>' +
    '<!-- search box -->' +
    '<th id = "thsearchbox"><input type="text" id="searchbox"' +
    'class="searchbox"/>' +
    '<!-- search button -->' +
    '<button type="button" id= "searchbutton" class="searchbutton"' +
    '>' + "Search in Bookmark" + '</button></th>' + 
    '</tr></table>' +
    '</div>';
	}
	
	else if(type == 2)
	{
	  var results_page_top_html = 
    '<div id="topsearch">' +
    '<table><tr>' +
    '<th id = "thlogo"><img src="images/logotext-results.png"/></th>' +
    '<!-- search box -->' +
    '<th id = "thsearchbox"><input type="text" id="searchbox"' +
    'class="searchbox"/>' +
    '<!-- search button -->' +
    '<button type="button" id= "searchbutton" class="searchbutton"' +
    '>' + "Search in History" + '</button></th>' + 
    '</tr></table>' +
    '</div>';
	}
	 //alert(results_page_top_html);
	$('body').empty();
    $('body').append('<div id = "resultspage"></div>');
    $('#resultspage').append(results_page_top_html);
    $('#resultspage').append(
    '<div id="resultspagebtm"></div>');
    //console.log('>>>>>>>>>>>>>1');
    chrome.extension.sendRequest(
        {method: 'search', keywords: searchwords, searchtype: type}, 
        function() {});
    
	
    var sb = document.getElementById('searchbutton');
	if(type == 1){
    sb.addEventListener('mousedown', mousedown);
    sb.addEventListener('mouseup',mouseup); 
	}
	else if(type == 2){
    sb.addEventListener('mousedown', mousedownsettype);
    sb.addEventListener('mouseup',mouseup);
	}

}

function leavePage(pagename) 
{
    var searchwords = $('#searchbox').val();
    $(pagename).remove();
    $('body').css('cursor', 'wait');
    doSearch(searchwords);
}

// Each search result will be delivered here.
// result object has fields,
//   result.url: page URL
//   result.text: formatted page text, or URL
//   result.title: page title
//   result.matchType: 'title', 'url', or 'page'
//     If the title matched, then result.text will be 
//     empty. if URL matched, then result.text will be 
//     a formatted URL (keyword is in bold face), if 
//     page text matched, then result.text will contain 
//     textual context.
function processSearchResult(result) {
	//console.log('>>>>>>>>>>>>>2');
	//console.log('result matchType is'+result.matchType);
    if(result.matchType == "DONE") {
        $('body').css('cursor', 'auto');
        // search error?
        if(result.error) {
            resultString = result.error;
        } else {
            resultString = "&nbsp;";
        }

        $('#searchbox').focus();
        $('#searchbox').keyup(function(e) {
	        if(e.keyCode == 13) {
		        leavePage('#resultspage');
	        }
        });

    } else {
	   // alert(result.url);
        resultString = 
            '<a href="' + result.url + '" target="_blank">' + result.title +'</a>' +
            '<br/>' + result.text + '<br/>' +
            '<span class="resulturl">' + result.url + '</span>&nbsp;' +
            '<a href="#" class="resultactions" onclick="requestCachedPage(' + result.id +
            ');">(Offline Version)</a><p><br/>';
    }
      
    $('#resultspagebtm').append(resultString);
}

document.addEventListener('DOMContentLoaded', function () {
  var sb1 = document.getElementById('searchbutton1');
  sb1.addEventListener('mousedown', mousedown);
  sb1.addEventListener('mouseup',mouseup);
  
  var sb2 = document.getElementById('searchbutton2');
  sb2.addEventListener('mousedown', mousedownsettype);
  sb2.addEventListener('mouseup',mouseup);
  
  init();
});

function mouseup(){
	$('#searchbutton').removeClass('searchbuttonpressed');
	leavePage('#welcomepage');
}

function mousedown(){
 //   $('#searchbutton').removeClass('searchbuttonpressed');
    type = 1;
	$('#searchbutton').addClass('searchbuttonpressed');
}

function mousedownsettype(){
    type = 2;
    $('#searchbutton').addClass('searchbuttonpressed');
	//search type 1 is to search in bookmark, 2 is in history
}






