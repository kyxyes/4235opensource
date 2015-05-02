# Introduction #
The introduction includes motivation, objective, and technical overview.

## Motivation ##
In the searching service aspect, Chrome provides functionality which only allow clients to search titles of bookmarks; when people search bookmark by keywords, however, they, most of time, cannot get desired items since some links' titles do not contain the keywords but the web pages may contain the keywords. What's more, sometimes people may want to search recently visited websites but they may not be able to get it through entering keywords again. Realizing these inconveniences, our decide to develop an open source project which aims to improve user's searching experience by providing functionality in searching history and bookmarks' link content.

## Objectives ##
We found a existing open source project called SearchMark(http://github.com/daku/SearchMark) which can serve as the basis of the functions we want to implement.

Based on the SearchMark project, we will focus on the following objectives:

**1**, Upgrade the SearchMark version from "manifest\_version": 1 to "manifest\_version": 2.<br>
<b>2</b>, Add the content of history records into the back-end database so that in the front-end, we can get the result by keywords.<br>
<b>3</b>, Importantly, we use ranking algorithm to rank the returned results.<br>
<b>4</b>, Improve the omnibox hint by adding C++ patch to Chromium's source codes: we will show the hints "search in bookmark" and "search in history" in the omnibox.<br>
<b>5</b>, Use voice to speak out the returned result statistics.<br>
<b>6</b>, Improve user experiences by adding ornaments to website.<br>
<br>
<br>
<h2>Technical Overview</h2>
<b>The overview includes chromium patch part and chrome extension part.</b>
The extension has a front-end and a back-end. The front-end is the user interface and the back-end is the core search functionality like indexing and search. The main technology used by the extension is HTML5 SQLite databases (to store the bookmarks,histories and their page contents). SQLite has virtual tables that provide a full-text index for table contents. We simply download a user's bookmarked pages and history pages into a virtual table, and use standard SQL search queries to look for keywords input by the user. To support the function of showing search hints in omnibox, we added necessary patch to chromium source code.<br>
<br>
<h3>Chromium Patch Part</h3>

(1)In order to add two new hints in omnibox, we will modify the 'autocomplete_results.cc' and append two new match at the end of sorted and culled matches. Then it will stay downside of omnibox.<br>
Then it will look like<br>
<img src='http://kyxyes.io/4235opensource/3.png' />

(2)cull out duplicated match in matches due to relevance ranking.<br>
<br>
<h3>Chrome Extension Part</h3>

(1) At the front end, we will use HTML and CSS to display the pages whatever in pop-up window or in a new tab page. Javascript(or Javascript framework, like JQuery) will be used as a controller which glues the view and model.Write a AngularJS for help button.<br>
<br>
(2) To save preference, we will invoke chrome.storage APIs.<br>
<br>
(3) It will load users' bookmarks/history into database(HTML5 Web database). When choosing search contents of bookmarks/history, this extension will receive the words typed and search in the database then open a new tab and display searched results. The results are the pages in bookmarks/history contains the word you try to search.<br>
<br>
(4) We need to implement a ranking algorithm to effectively show the returned results to users.<br>
<br>
<br>
<br>
<h1>For Users: Install & User Instructions</h1>
<b>This part includes how to install and how to use.</b>
<b>Note: Without installation step 1 and step 2, one can also directly download the extension and use it following "how to use."</b>
<h2>How to install</h2>
<b>Installation includes three steps: chromium ready, apply patch, download extension.</b>
<h3>1. Chromium Ready</h3>
Make sure you have download Chromium.<br>
For how to checkout Chromium, check the link here.<br>
<br>
<a href='https://code.google.com/p/chromium/wiki/MacBuildInstructions'>MacOS</a>
<a href='http://www.chromium.org/developers/how-tos/build-instructions-windows'>Windows</a>
<a href='https://code.google.com/p/chromium/wiki/LinuxBuildInstructions'>Linux</a>
<h3>2. Apply Patch</h3>
<pre><code><br>
https://code.google.com/p/4235opensource/source/browse/patch.diff<br>
</code></pre>

Download as zip or copy the patch above and save it locally as "patch.dff" under your src directory of Chromium.<br>
<br>
<pre><code>path/to/src</code></pre>

<pre><code>$ patch -p1&lt;patch.diff</code></pre>

after this, terminal will prompt<br>
<br>
<pre><code>patching file components/omnibox/autocomplete_result.cc</code></pre>

This means that patching your local "components/omnibox/autocomplete_result.cc" is ok.<br>
<br>
Compile you Chromium again<br>
<pre><code><br>
$ cd src<br>
$ ninja- C out/Debug chrome<br>
</code></pre>
<p>It will take several minutes, grab a coffee!</p>
<p>If there are not errors prompt, every thing is fine. Just boot up your Chromium.</p>
<p>When you type in omnibox, your will find there are two rows added. </p>

<img src='http://kyxyes.io/4235opensource/1.png' />

<h3>3. Download from Chrome app store</h3>
We upload our Chrome app in Chrome store, there is not need to git clone our project.<br>
<pre><code><br>
https://chrome.google.com/webstore/detail/crsearch/cgioaghhgjcomjbmbkdljmfmkdncobbk?utm_source=chrome-ntp-icon<br>
</code></pre>

<h2>How to use</h2>
1, After the installation is done, a new tag page is created for you to adjust the settings of voice. You can also easily access this setting by right-clicking the icon right next to Chrome’s Omnibox and then select “Options” entry. </br>

2,There are two ways to perform a full-text search:<br>
<br>
<blockquote>2.1, Search "Bookmarks/History" directly in omnibox.</blockquote>

<blockquote>2.2, When you click the icon right next to Chrome’s Omnibox, a new tag page will pop up, you can type in the keywords and click “Search in Bookmark” or “Search in History” to get the search results either from bookmark or history records.</br></blockquote>

<img src='http://kyxyes.io/4235opensource/2.png' />

3, In the search result page, you can click the links, then you will be redirected into related page. Or, you can do another search by typing the key words into the search box on the top of the page. </br>

<b>Attention</b>: The first time you search would be a little slower because our application will parse and save the data into your local web browser’s database.<br>
<br>

<h1>Technical Implementation Details</h1>
<b>This part includes omnibox path implementation, voice implementation, upgrading implementation and history search implementation.</b>

<h2>Chromium Omnibox Patch Implementation</h2>
<b>Path implementation includes patch overview, match type and provider, GURL, match content.</b>
<h3>Patch Overview</h3>
(1)A cpp patch for 'autocomplete_results.cc', which is the place dealing with the results from matches.<br>
<br>
(2)In the function of 'AutocompleteResult::SortAndCull()', it will sort the results from autocomplete_controller.cc according to relevance.<br>
<br>
(3)After the sorting and culling, we appended extra match to at the end of matches, which can make sure 'bookmarks' and 'history' search signs will always stay downside.<br>
<br>
(4)Sort out 'bookmarks' and 'history' which match type is 'HISTORY_BODY'(Checked, not used yet in Chromium,here stands for our new match), because the relevance of 'bookmarks' and 'history' will rank high. In such case,  it will generate duplicate rows in Chromium omnibox.<br>
<br>
<h3>Match Type and Provider</h3>
We did not  write new match type and especially autocomplete_provider, because at that case it will change seriously and make messed up. We used 'HISTORY_BODY' to mark our new match type. We checked that this name has not been used yet. Then we  used one of the providers which have been in matches, then sent this provider to our new created match. Because it is impossible to generate a new provider object for our new match in 'autocomplete_results.cc', we just use what have been in matches.<br>
<br>
<h3>GURL</h3>
We set a constant extensionID link in 'match.destination_url' to open our Chrome extension page.<br>
In our GURL, we use<br>
<br>
<pre><code>chrome-extension://[constant_extension_id]/SearchMarkUI.html?[type_code]:[users_typing]</code></pre>
This is be splitted in extension javascript according to regex. In type_code, 1 is bookmarks search and 2 is history search.<br>
<br>
<h3>Match Content</h3>
Using input.text()  to let users search what they want and and appending "- Search Bookmarks"/"- Search History" to make up which looks like "- Search Google". But the color is kind of different. "-Search Google" in omnibox is grey but here is totally dark. Because we if we want to change color, it will modify 'omnibox_popup_view.cc' and set attribute in view/cocoa according to different operation systems.<br>
<br>
<h2>Voice Implementation</h2>
Using the interfaces of chrome.tts and chrome.storage, we implement the function of speaking out the time spent on the search and the number of searching results after our customers click the search button. An options page can be used to configure the parameters for the voice, for example, the rate, the pitch and the volume. After you configure those parameters, for example, dragging the volume button to right or to left, the correspondent value of the volume will be saved into your local database, since we use the listener to monitor the “mouseup” and “keyup” events.<br>
<br>
<h2>Upgrading Implementation</h2>
For upgrading part, the first thing we will do is to change the name of APIs and property name, for example, on “manifest.json” configuration file, replacing the “background_page” property with a “background” property. Due to the security changes between manifest version 1.0 to 2.0, we will remove inline event handlers and move them into external JS file. Besides, we also move inline script blocks in HTML pages out into an external JS file.<br>
<br>
<h2>History Search Implementation</h2>

The implementation of searching in history is based on the implementation of searching bookmark, which is done by the extension SearchMark. The implementation process is actually very straightforward.  For the manifest.json file, a permission “history” is necessary to be added into the file, since we need to use chrome.history API.<br>
<br>
First, we defined and initialize an empty database used to store history data. After uploading the extension, it will automatically store all history data and bookmark data into two databases (HTML5 Web Database) respectively. This operation will be done only one time after loading the extension. However, if a discrepancy found, it would reload the bookmark data or history data. We use a variable to count the number of history paged added, and use another variable to count the total number of history. If we found that the number of totally added history pages is not equal to the total number of history pages, we will purge the database and restore all the data.<br>
<br>
Second, we defined necessary functions for operations on the database: adding new links, removing links, purging database, searching in database, etc. we added listener to chrome.history.onVisited and chrome.history.onVisitRemoved, the two events will incur adding or removing links from history database. When a user clicks a new page, the link and the page information will be added to the database by using the chrome.history.onVisited function. Similarly, when a user remove a history page, the corresponding link will be removed from history database. A slight difference between removing history links from database and removing bookmark links from database is that when removing history links from database, we need to use the url to specify a history link but not the link’s id.<br>
<br>
Third, to implement full-text search, we store a whole page as a string into the database. In order to eliminate useless characters, we eliminate all html symbols before storing into the database. To search whether a page contains the target keywords, we use MATCH function provided by the SQLit database function.<br>
<br>
Fourth, observing that the results returned by the original SearchMark extension are sorted in a ineffective way, we designed a ranking algorithm based the frequency of matched phrase in a sentence. The basic implement technique is to use regular expression to count the times of a keyword emerging in a page, and we will rank all results based on this frequency. We simply use bubble sort to implement sorting, considering that normally there is no very large amounts of results returned.<br>
<br>
Last, considering different user preferences, we provide a button “Search in History” on the homepage to let the user conveniently search links within the history. Considering the time cost of loading data into database and the time cost of performing full-text search, we only store the history data generated within past one week.<br>
<br>
<h1>How to Communicate</h1>
<b>How to communicate includes two parts: overview and useful communication tools.</b>
<h2>Overview</h2>
Our communications about code reviews, bug trackers, etc. are available under issue tab. Under issue tab, you can choose "all issues" to view our communication history. We also use other communication softwares. For example, we use WeChat (an apple store application) and QQ to have voice meetings. And sometimes we use cell phones when we have relatively emergent issues. We also communicate face-to-face: we utilize the chances before or after class to discuss our project progresses. Additionally, apart from the emails automatically sent out by creating an issue, in a few cases we communicate via emails.<br>
<br>

<h2>Useful Communication Tools</h2>
We basically use all kinds of tools available on Google Code website. We felt all these tools are useful for us. The specific advantages are stated above. Other useful tools include cell phone and QQ chatting software. We had several voice or video meetings via the latter software. It is free and very convenient to use. <br>

<b>In summary, we have common sense that the most useful communication tools are: code reviews, bug trackers provided by Google Code site and QQ chatting software.</b> However, the preferences for communication is <b>highly individualized</b>. Below are comments for communication tools from <b>each member</b> in the group.<br>

Yangchen Pan: The functions provided by google site is very convenient to fix technical problems. I personally felt it is not useful to discuss complex problems or problems involving in multiple group members. Here is an obvious downside of google code site I want to mention. The wiki page only provides headings of different levels, which make the documentation difficult to follow since a reader cannot easily discern the structure of the document. <br>

Yuxing Kang: Online UI modification could be easier than using git command. I think code site can add function of google drive which makes partners can working together in runtime. <br>

Wei Zhao: I feel the tools provided by google code site is useful in most cases, but it may not be the best choice when we want to cope with emergent issues. Face-to-face communication is easier to make everything clear.<br>


<h1>Project Management: How to Use Google Code</h1>
1. Bugs <br>
When we have any bugs related to our project, we will create an issue on this platform, it can email stakeholders I assign. Every time when a member does something for this issue, for example, he leaves some comments or modifies the status of the issue, the stakeholders will be notified by email. They can click the link in the email conveniently and do anything they want, for example, they can reply the message by leaving comments or change the status of the issue. For instance, Wei Zhao found that Yangchen Pan incurs a bug after adding a ranking algorithm to the program. So Wei Zhao will open an issue and set the owner as Yangchen. Then Yangchen would receive an email notification to review the code. In case that Yangchen cannot finish this issue, he may leave some comments and send the issue back to Wei Zhao to ask for help.<br>
<br>
2. Code Reviews <br>
After one group member changes some codes, he may send code reviews request to another particular member by opening a new issue. Meanwhile, an email notification will be sent to that member to let him know the request. If he accepted the request, he may change the status of the issue to <i>"accepted"</i>.After one member finished the request, he will use git to commit the change with brief description saying that the issue has been reviewed. And he may also change the status of the issue to <i>"fixed," "verified," "done," etc.</i>

3. Other Issues <br>
Apart from code review request and bugs, we always have other issues to cope with. For example, Yangchen Pan found a problem that Yuxing Kang block the history search interface on the website. Then what Yangchen did is to open an issue and set the owner as Yuxing Kang. And Yangchen described the issue by filling the questions set as default by google code site (e.g. What steps will reproduce the problem?). Then Yuxing Kang received the notification and changed the status of the issue to "accepted." After finishing coping with the issue, Yuxing further changed the status to "done".<br>
<br>
4. Git <br>
It also can help us share the code with each other. Since we almost separate tasks to different individuals completely, the conflict does not happen a lot, but sometime, unavoidably, there is conflict during the merging process. if it happens, we will solve the conflict in our local and commit the merged code so that other teammates can update their local code with the latest version in the common repository. They can not only help test and verify the bugs in the code, they may also code review the code and find out the bugs which are very important for the high quality of the code.<br>
<br>
5. Handle Different Opinions <br>
We did not really have some conflicts, but we have some different opinions towards some particular problems related to the project. Here are two examples.<br>
<br>
First, we have different opinions on the objectives of the project. Our main communication tools to discuss this problem include wiki provided by Google Code site, cell phone and QQ chatting software. Cell phone plays a very important role here since we need to decide a common goal as soon as possible, so we need to use a really efficient tool to discuss the problem. We also use wiki, since sometimes it is very difficult for us to discard any member's opinion. Every member can put forward some very good ideas. As a result, we keep all ideas on the wiki and started doing the project. After we have a better feeling to handle the difficulties, we may discard some opinions showed in the wiki.<br>
<br>
Second, we have different opinions when deciding whether we should keep the website searching interface. We mainly solve this problem via QQ chatting software by holding a voice meeting. It is an very efficient way to express one's own opinions and let other members know immediately. Via the voice meeting, we conveniently explained the advantages and disadvantages of keeping the website searching interface and we finally reach the common opinion to keep it since it could use some users' preference. <br>

<h1>Thoughts about Cooperation in a Large Group</h1>
Since there are only 3 members in our small group, we clearly know who is responsible for which part. Therefore, we can create a specific bug for a specific individual if we find a problem. But when there are more participants joining in this project, the cost of communication becomes higher and higher.  For example, in a large open source project, they use group email list rather than listing all the emails of members. Those who help implement the same function are in the same group. In this case, when a user has certain problem which can not be solved by himself, he can send an email to a group mail where some people may offer some help. But, the disadvantage is that too many emails may annoy someone in this group. </br>
In this project, we also find another cause which leads to high cost of communication.  For example, in our voice meeting, when two members are talking about the issues which are not related to the third person, it is a kind of waste of time for this one. Therefore, a plan about the meeting content and schedule is really crucial to have an efficient and productive meeting.  Private conversation is a better approach for two members to solve the problem between them. If in a big group, IRC can enable people to have multiple ways for communication, they can chat in a channel or have a private conversation with a person.<br>
