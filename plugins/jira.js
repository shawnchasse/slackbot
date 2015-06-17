/** @module jira */

const Promise = require('bluebird');
const _       = require('lodash');
const request = Promise.promisifyAll(require('request'));
const config  = require("./jira_config.json");

// set up the cookie jar for request
var jira_jar = request.jar();

function trimText(input) {
	if(input != null) {
		var out = input.substr(0,300);
		out = out.substr(0,Math.min(300,out.lastIndexOf(' '))).trim();
		if(out.length < input.length) { out+='\u2026'; }
		return out;
	} else {
		return '';
	}
}

var getJiraTicket = Promise.method(function(data, userData) {
	var page   = data.matches[0];
	var domain = data.matches[1];
	var ticket = data.matches[2];
	var ticketURL = 'https://'+domain+'/rest/api/2/issue/'+ticket;
	return request.getAsync({
		jar: jira_jar,
		url: 'https://'+domain+'/login.jsp',
		method: 'POST',
		qs: {
			os_username: config[domain].username,
			os_password: config[domain].password,
			os_cookie: true,
			os_destination: '',
			atl_token: '',
			login: 'Log In'
		}
	}).spread(function(response, body){
		return request.getAsync({
			jar: jira_jar,
			url: ticketURL,
			method: 'POST',
			headers: { 'Content-Type': 'application/json' }
		})
	}).spread(function(response, body){
		try {
			var json = JSON.parse(body);
			if(json.errorMessages) {
				_.each(json.errorMessages, function(e){})
			} else {
				var f = json.fields;
				return {
					icon_url: "https://"+domain+"/images/64jira.png",
					text: "<"+page+">",
					attachments: [{
						fallback: trimText(f.description),
						pretext: trimText(f.description),
						color: (f.status.name=='Closed'||f.status.name=='Resolved') ? "good":"warning",
						fields: [
						{	title: "Assignee",
							value: (f.assignee?f.assignee.displayName:"N/A"),
							short: true
						},
						{	title: "Priority",
							value: (f.priority?f.priority.name:"N/A"),
							short: true
						}
						]
					}]
				}
			}
		} catch(e) {
			console.log('Jira plugin', e, body);
			return false;
		}
	});
});

exports.load = function(registry) {
	var helpText = 'Grab details about a jira ticket';
	registry.register(
		//plugin name
		'jira', 
		// trigger regex
		new RegExp("[^ <]*("+_.keys(config).join('|')+").+?\/([^ >]+)",'im'),  
		// function to run
		getJiraTicket, 
		// help text
		helpText  
	);
	return true;
}