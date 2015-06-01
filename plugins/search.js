/** @module search */
const _       = require('lodash');
const request = require('request');

const sites = [
    [ "mdn",     "developer.mozilla.org " ]
  , [ "wiki",    "en.wikipedia.org " ]
  , [ "imdb",    "www.imdb.com " ]
  , [ "reddit",  "www.reddit.com " ]
  , [ "hn",      "news.ycombinator.com " ]
  , [ "youtube", "www.youtube.com " ]
  , [ "espn",    "espn.go.com " ]
]

function getSiteUrl(siteName) {
  for(var i=sites.length; i-- > 0; ) {
    if(sites[i][0] == siteName) {
      return sites[i][1] ;
    } 
  }
  return false
}

function search(data, userData, callback) {
  //var userText = "<@"+slack.hook.user_id+"|"+slack.hook.user_name+">";
  var searchURL = 'https://ajax.googleapis.com/ajax/services/search/web';
  var site = data.matches[1];
  var query = data.matches[2];
  var siteUrl = getSiteUrl(site);
  if(siteUrl) {
    query = 'site:'+siteUrl+query
  }
  console.log(site, query)
  request({
    url: searchURL,
    qs: {
      "v": "1.0",
      "q": query
    }
  }, function(error, response, body){
    	if(!error && response.statusCode==200) {
		var results = JSON.parse(body);
		//console.log(JSON.stringify(results,' ',1));
		if(results.responseData != null && !!results.responseData.results.length) {
      var resultUrl = results.responseData.results[0].unescapedUrl;
      var resultTitle = results.responseData.results[0].titleNoFormatting;
      var resultMore = results.responseData.cursor.moreResultsUrl;
			callback({
        username: "Search Results",
        icon_emoji: ":mag_right:",
        text: [
          "<"+resultUrl+"|"+resultTitle+">",
          "<"+resultMore+"|See More Results\u2026>"
        ].join('\n')
      });
		}
	}
  });
}

exports.load = function(registry) {
	registry.register('google', search, 'Perform a google search');
	registry.register('g', search, 'Perform a google search');
	sites.forEach(function(s) {
		registry.register(s[0],function(slack) { 
			slack.hook.text = s[1]+slack.hook.text; 
			search(slack)
		}, "Perform a google search contained to "+s[1]);
	});
	return true;
}

exports.load = function(registry) {
  var helpText = 'Perform a serch';
  registry.register(
    //plugin name
    'google search', 
    // trigger regex
    new RegExp("^[`!](g|google) (.*?)$",'im'),  
    // function to run
    search, 
    // help text
    helpText  
  );
  // register the other search triggers
  sites.forEach(function(s) {
    registry.register(
      //plugin name
      s[0]+' search', 
      // trigger regex
      new RegExp("^[`!]("+s[0]+") (.*?)$",'im'),  
      // function to run
      search, 
      // help text
      helpText  
    );
  });
  return true;
}
