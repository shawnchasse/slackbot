var Sandbox = require('sandbox')
  , s = new Sandbox();

function run(data, userData, callback) {
	console.log(JSON.stringify(data.matches))
	var code = data.matches[3];

	s.run(code, function(output) {
		callback({
			text: "```"+output.result+"```"
		});
	});
}

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