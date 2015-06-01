var YQL = require('yql');
var _   = require('lodash');

var codeMap = {
	'01d': '32.png',
	'01n': '31.png',
	'02d': '30.png',
	'02n': '29.png',
	'03d': '26.png',
	'03n': '26.png',
	'04d': '28.png',
	'04n': '27.png',
	'09d': '12.png',
	'09n': '12.png',
	'10d': '39.png',
	'10n': '45.png',
	'11d': '04.png',
	'11n': '03.png',
	'13d': '41.png',
	'13n': '46.png',
	'50d': '19.png',
	'50n': '21.png'
}

function forecast(data, userData, callback) {
	var query = new YQL('select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="'+data.matches[2]+'")');
	query.exec(function(err, data) {
	  var location = data.query.results.channel.location;
	  var condition = data.query.results.channel.item.condition;
	  var forecast = data.query.results.channel.item.forecast;
	  var forecastFields = [];
	  _.each(forecast, function(f) {
	  	forecastFields.push({
	  		"title": f.day,
	  		"value": f.text+"\n*"+f.high+"\u00B0* "+f.low+"\u00B0",
	  		"short": true
	  	})
	  });
	  var locationTitle = location.city + ', ' + (!!(location.region.length) ? location.region : location.country);
	  var message = {
			username: "Conditions for "+locationTitle,
			icon_url: "http://asphyxia.com/weather/png/"+condition.code+".png",
			text: [
				condition.text,
				condition.temp+'\u00B0'
			].join(' '),
			attachments: JSON.stringify([
				{
					fallback: "Forecast for "+locationTitle,
					pretext: "Forecast for "+locationTitle,
					fields: forecastFields,
					mrkdwn: true,
					mrkdwn_in: ["fields"]
				}
			])
		};
	  callback(message);
	});
}

exports.load = function(registry) {
	var helpText = "Grab the current weather";
	registry.register(
		'weather',                                  //plugin name
		/^[`!](w|weather) (.*)$/im, // trigger regex
		forecast,                                      // function to run
		helpText                                    // help text
	);
	return true;
}