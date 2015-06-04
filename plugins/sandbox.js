const Promise = require('bluebird');
var Sandbox = require('sandbox')
  , s = new Sandbox();

var run = Promise.method(function(data, userData) {
	//console.log(JSON.stringify(data.matches))
	var code = data.matches[3];

	return Promise.resolve(s.run(code))
	.then(function(output) {
		console.log("output %s", output)
		output = JSON.parse(output)
		return { text: "```"+output.result+"```" }
	});
});

exports.load = function(registry) {
	var helpText = 'paste me some code.';
	registry.register(
		// NAME
		'sandbox',
		// TRIGGER
		/```([\s\n]*?\/\/[\s]*?(js|javascript))([^]*?)```/im,
		// METHOD
		run,
		// HELPT TEXT
		helpText
	);
	return true;
}