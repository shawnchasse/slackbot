/**
	Magic 8Ball
*/
const answers = [
"It is certain",
"It is decidedly so",
"Without a doubt",
"Yes definitely",
"You may rely on it",
"As I see it, yes",
"Most likely",
"Outlook good",
"Yes",
"Signs point to yes",
"Reply hazy try again",
"Ask again later",
"Better not tell you now",
"Cannot predict now",
"Concentrate and ask again",
"Don't count on it",
"My reply is no",
"My sources say no",
"Outlook not so good",
"Very doubtful"
];

// words that can trigger the yes/no question logic
const keywords = [
	"is", "isn't",
	"are", "aren't",
	"can", "can't",
	"have", "haven't",
	"will", "won't",
	"do", "don't",
	"did", "didn't",
	"should", "shouldn't",
	"would", "wouldn't"
]

function fortune(data, userData, callback) {
	callback({
		username: "Magic 8Ball",
		//username: "Mαnny Pelαrinos",
		//icon_url: "https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2014-06-19/2404438073_48.jpg",
		icon_url: "http://asphyxia.com/8ball.png",
		//text: "<@"+userData.user.id+"|"+userData.user.real_name+">" asked: *"+slack.hook.text+"*\n"+answers[Math.floor(answers.length*Math.random())]"
		text: answers[Math.floor(answers.length*Math.random())]
	});
}

exports.load = function(registry) {
	var helpText = 'Ask me a yes/no question.';
	registry.register(
		'8Ball',                 //plugin name
		new RegExp("^[`!](" + keywords.join('|') + ")[^?]+[?]$",'im'),  // trigger regex
		fortune,                 // function to run
		helpText                 // help text
	);
	return true;
}
