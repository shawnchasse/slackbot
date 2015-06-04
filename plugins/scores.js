/** @module scores */

const _        = require('lodash');
const request  = require('request');
const jsonPath = require('JSONPath');
const moment   = require('moment');

function lookup(item, cb) {
	request(
		{
			url: '{API_HOST}/v2/lookup/categories/'+item,
			qs: { 
				"apikey": "espnDevTest"
			}
		},
		function(error, response, body) {
			var sportName, leagueName;
			if(!error && response.statusCode == 200) {
				try { 
				json = JSON.parse(body);
				if(json) {
					cb(json);
				}
				} catch(e) {}
			} else {
				cb(false);
			}
		}
	);
}

function getSport(j) {
	if(j && j.sport) {
		return (j.sport.name) ? j.sport.name : false;	
	}
}

function getLeague(j) {
	if(j && j.league) {
		return (j.league.abbreviation) ? j.league.abbreviation : false;
	}
}

function getTeamsForLeague(sport,league, cb) {
	var teamsJson;
	request(
		{
			url: '{API_HOST}/v1/sports/'+sport+'/'+league+'/teams',
			qs: {
				"disable": "logos,record,links",
				"limit": "500"
			}
		}, 
		function(error, response, body) {
			if(!error && response.statusCode == 200) {
				var json = JSON.parse(body);
				if(json) {
					teamsJson = jsonPath.eval(json, '$.sports[*].leagues[*].teams[*]');
					cb(teamsJson);
				}
			} else {
				cb(false);
			}
		}
	);
}

function getEventsForTeam(sport, league, team, cb) {
	//console.log(sport,league,team);
	request(
		{
			url: '{API_HOST}/v1/sports/'+sport+'/'+league+'/events',
			qs: {
				"teams": team,
				"advance": true,
				"disable": "sports,leagues,season,stats,links,venues"
			}
		},
		function(error, response, body) {
			var events, json;
			if(!error && response.statusCode == 200) {
				json = JSON.parse(body);
				if(json) {
					events = jsonPath.eval(json, '$.events[*]');
					if(events) {
						cb(events);
					} else {
						cb(false);
					}
				}
			} else {
			}
		}
	);
}

function getEventsForLeague(sport, league, cb) {
	//console.log(sport,league,team);
	request(
		{
			url: '{API_HOST}/v1/sports/'+sport+'/'+league+'/events',
			qs: {
				"advance": true,
				"disable": "sports,leagues,season,stats,links,venues"
			}
		},
		function(error, response, body) {
			var events, json;
			if(!error && response.statusCode == 200) {
				json = JSON.parse(body);
				if(json) {
					events = jsonPath.eval(json, '$.events[*]');
					if(events) {
						cb(events);
					} else {
						cb(false);
					}
				}
			} else {
			}
		}
	);
}

function buildScoreString(home,away,detail) {
	var triangle = '\u25B8';
	var scoreString = [
	  (away.isWinner) ? '*'+triangle+away.team.abbreviation+'*' : away.team.abbreviation,
	  ' ',
	  (away.isWinner) ? '*'+away.score+'*' : away.score,
	  ' - ',
	  (home.isWinner) ? '*'+triangle+home.team.abbreviation+'*' : home.team.abbreviation,
	  ' ',
	  (home.isWinner) ? '*'+home.score+'*' : home.score,
	  ' ',
	  detail                         
	].join('');

	return scoreString;
}

function buildUpcomingGameString(home,away,detail) {
	var message = [
		away.team.abbreviation,
		' @ ',
		home.team.abbreviation,
		' ',
		//new Date(Date.parse(detail))
		moment(detail).calendar()
	].join('');

	return message;
}

// try to use promises for this in the future
function getScoreByTeam(msg, league, team) {
	
	var sportName, leagueName, teams,
	    team = team.toLowerCase().trim();

	lookup(league, function(data) {
		if(data) {
			sportName = getSport(data);
			leagueName = getLeague(data);

			getTeamsForLeague(sportName, leagueName, function(teams) {
				var tname, tloc, tabbr;
				if(teams) {
					_.forEach(teams, function(t) {
						tname = t.name.toLowerCase().trim();
						tloc = t.location.toLowerCase().trim();
						tabbr = t.abbreviation.toLowerCase().trim();
						teamId = t.id;
						if(team == tname || team == tloc || team == tabbr) {
							getEventsForTeam(sportName,leagueName,teamId,function(events) {
								//msg.reply('I found '+events.length+' events')
								var today = new Date();
								_.forEach(events, function(e) {
									var state = e.competitions[0].status.state;
									var detail = e.competitions[0].status.detail;
									var competitors = e.competitions[0].competitors;
									var home, away;
									away = competitors[0];
									home = competitors[1];	

									_.forEach(competitors, function(competitor) {
										if(competitor.homeAway == 'home') {
											home = competitor;
										} else if(competitor.homeAway == 'away') {
											away = competitor;
										}
									});
									var messages = {
										channel: '#'+hook.channel_name,
										text: buildScoreString(home,away,detail)
									}
									if(state == "post") {
										// this is a finished game
										msg.reply(buildScoreString(home,away,detail))
									} else if(state=="in") {
										// this is an in progress game
										msg.reply(buildScoreString(home,away,detail))
									} else if(state=="pre") {
										// this is a scheduled game
										msg.reply(buildUpcomingGameString(home,away,detail))
									}
								})
							});
							// we can stop iterating now
							return false;
						}  						
					})
				}
			});

		}
	});
}

function getScoresByLeague(slack, hook) {
	league = hook.text;
	lookup(league, function(data) {
		var sportName, leagueName;
		if(data) {
			sportName = getSport(data);
			leagueName = getLeague(data);
			getEventsForLeague(sportName,leagueName,function(events) {
				var today = new Date();
				_.forEach(events, function(e) {
					var state = e.competitions[0].status.state;
					var detail = e.competitions[0].status.detail;
					var competitors = e.competitions[0].competitors;
					var home, away;
					away = competitors[0];
					home = competitors[1];	

					_.forEach(competitors, function(competitor) {
						if(competitor.homeAway == 'home') {
							home = competitor;
						} else if(competitor.homeAway == 'away') {
							away = competitor;
						}
					});
					if(state == "post") {
						// this is a finished game
						var messages = {
                                                	channel: '#'+hook.channel_name,
                                                	text: buildScoreString(home,away,detail)
                                        	}	
						slack.notify(messages);
					} else if(state=="in") {
						// this is an in progress game
						var messages = {
                                                	channel: '#'+hook.channel_name,
                                                	text: buildScoreString(home,away,detail)
                                        	}
						slack.notify(messages);
					} else if(state=="pre") {
						// this is a scheduled game
						var messages = {
                                                	channel: '#'+hook.channel_name,
                                                	text: buildUpcomingGameString(home,away,detail)
                                        	}	
						slack.notify(messages);
					}
				})
			});
		} else {
			slack.notify({
				channel:'#'+hook.channel_name,
				icon_emoji: ':boom:',
				text:'Sorry, there was an issue getting your data, try again later'
			});
		}
	});
}

function load(bot) {
	//bot.register('score', /([a-z0-9.-]+)\s+(.+)$/i, getScoreByTeam);
	//bot.register('score', /([a-z0-9.-]+)$/i, getScoresByLeague);
	return SUCCESS;
}

function unload(bot) {
	return SUCCESS;
}

exports.name = "scores";
//exports.help = "";
//exports.load = load;
//exports.uload = unload;
exports.byTeam = getScoreByTeam;
exports.byLeague = getScoresByLeague;
