/** @module jira */

const _       = require('lodash');
const request = require('request');

function jokes(data, userData, callback) {
  var URL = 'http://api.icndb.com/jokes/random';
  request({
    url: URL,
    qs: {
    	escape: 'javascript',
    	exclude: '[explicit]'
    }
  }, function(error, response, body){
    	if(!error && response.statusCode==200) {
		var results = JSON.parse(body);
		if(results != null && results.type == "success") {
			callback({
				username: "Chuck Norris",
				icon_url: "http://www.bf4-emblems.com/wp-content/uploads/2013/11/Chuck-Norris.jpg",
				text: results.value.joke
			});
		}
	}
  });
}

exports.load = function(registry) {
	registry.register(
		// name
		'Chuck Norris Jokes',
		// trigger                 
		new RegExp("^[`!](j|joke|chuck|norris|wwcnd|wwcd)$",'im'),
		// command
		jokes,
		// help text
		'Returns a Chuck Norris joke.'
	);
	return true;
}
