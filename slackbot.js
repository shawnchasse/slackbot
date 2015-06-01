/**
Slack Webhook Handler
*/
"use strict";
const request = require('request');
const WebSocket = require('ws');
const _ = require('lodash');
var ws
var messageID = 0;
var ws_retries = 0;
var ws_max_retries = 5;
// SET UP SLACK
const conf = require("./config.json");
const pluginRegistry = {
	names: [],
	commands: {},
	help: {},
	register: function(name, regex, func, help) {
		pluginRegistry.commands[name]= {
			r: regex, // the regex to parse
			f: func   // the function to run
		}
		if(help) {
			pluginRegistry.help[name] = help;
		}
		console.log("==================");
		console.log("Registering plugin");
		console.log(name, regex);
	}
};

// load the plugins
conf.plugins.forEach(function(name) {
	const plugin = require('./plugins/'+name);
	const status = plugin.load(pluginRegistry);
});

function getUserData(data, callback) {
	request({
		url: "https://slack.com/api/users.info",
		qs: { 
			token: conf.api_token,
			user: data.user
		}
	}, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var userData = JSON.parse(body);
			// run our callback with the results
			callback(body)
		}
	});
}

function sendMessage(channel, message, callback) {
	var queryParams = _.merge(
		{
			token: conf.api_token,
			channel: channel,
			username: conf.username,
			icon_url: conf.icon_url,
			as_user: false,
			link_names: 1
		},
		message
	);
	console.log(JSON.stringify(queryParams))
	request({
		url: "https://slack.com/api/chat.postMessage",
		method: "POST",
		qs: queryParams
	}, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var userData = JSON.parse(body);
			// run our callback with the results
			if(!!callback) { callback(body) }
		}
	});
}

function openWebsocket(socket) {
	var ME = socket.self.id;

	// the socket needs to be ok in order to be opened
	if(socket.ok !== true)  {
		console.error("Failed to open socket")
		return false
	}

	ws = new WebSocket(socket.url);
	
	ws.on('open', function open() {
		// reset the retries count for future disconnects
		ws_retries = 0;
		console.log('Websocket open at %s', socket.url);
	});

	ws.on('close', function() {
		// restart the websocket
		start()
	})

	ws.on('message', function(data, flags) {
		var data = JSON.parse(data)
		  , text = null; 

		if(data.type == "message") {
			text = data.text ? data.text.trim() : null
			//console.log(data.type,' -> ',text);
			if(!data.subtype) {
				// plain message
				_.forOwn(pluginRegistry.commands, function(command, name) {
					//console.log('checking', name, command.r.toString());
					if(command.r.test(text)) {
						//console.log('running', name);
						data.matches = command.r.exec(text);
						getUserData(data, function(userData) {
							var userData = JSON.parse(userData)
							command.f(data, userData, function(message) {
								//console.log("message", JSON.stringify(message))
								sendMessage(data.channel,message)
								/*ws.send(JSON.stringify(_.merge(
								 	message, 
									{
										id: ++messageID,
										channel: data.channel,
										type: "message"
									}
								)), { mask: true });
								*/
							})
						})
					}
				});
			}
		}	
	});
}

function start() {
	if(ws_retries++ < ws_max_retries) {
		request({
			url: "https://slack.com/api/rtm.start",
			qs: { token: conf.rtm_token }
		}, function(error,response,body) {
			if(!error && response.statusCode == 200) {
				body = JSON.parse(body);
				openWebsocket(body);
			} else {
				// try again
				console.log("retrying in "+ (ws_retries*5000)+" milliseconds")
				setTimeout(start, ws_retries*5000)
			}
		});
	}
}

// ALL SYSTEMS GO!
start();