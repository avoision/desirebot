var _             = require('lodash');
var Client        = require('node-rest-client').Client;
var Twit          = require('twit');
var async         = require('async');
var wordfilter    = require('wordfilter');
var TwitterPic 	  = require('twitter-pic');
var request       = require('request');

var dbapi = {
 	consumer_key: 			'QXehs30Y1d1a9llBryXhvpnGx',
	consumer_secret: 		'xOInwBRPyEh88OWhGWRHggsM1XGdHDChOZOeO8IE9uAJVjFQ2G',
	access_token: 			'2986319204-dlutETZaVc119t2T9G4kV3oNJwevYsTDuwRQcmF',
	access_token_secret: 	'ZHVgflUuHea5h34ZBJFIfPQDOicqR5mHedMqY3BJo95Sy'
};

var t = new Twit({
    // consumer_key:         process.env.PICKTWOBOT_TWIT_CONSUMER_KEY,
    // consumer_secret:      process.env.PICKTWOBOT_TWIT_CONSUMER_SECRET,
    // access_token:         process.env.PICKTWOBOT_TWIT_ACCESS_TOKEN,
    // access_token_secret:  process.env.PICKTWOBOT_TWIT_ACCESS_TOKEN_SECRET

	consumer_key: 			dbapi.consumer_key,
	consumer_secret: 		dbapi.consumer_secret,
	access_token: 			dbapi.access_token,
	access_token_secret: 	dbapi.access_token_secret
});

var tp = new TwitterPic({
	consumer_key:    		dbapi.consumer_key,
	consumer_secret: 		dbapi.consumer_secret,
	token:           		dbapi.access_token,
	token_secret:    		dbapi.access_token_secret
});

var wordnikKey = 			'4550935bcdca427d4b40202421409e27912324bf6b829f60f';

getPublicTweet = function(cb) {
    t.get('search/tweets', {q: '\"i%20just%20want\"', count: 20, result_type: 'recent', lang: 'en'}, function(err, data, response) {
		if (!err) {
			var pattern = /^i\ just\ want/;
			var botData = {
				allPosts: [],
				allParsedTweets: [],
				allPostsWordList: [],
				wordList: [],
				nounList: [],
				allFlickrSearchStrings: [],
				allFlickrIDs: [],
				allFlickrTitles: [],
				allFlickrURLs: [],
				allFlickrSources: []
			};
			
			// Loop through all returned statues
			for (var i = 0; i < data.statuses.length; i++) {

				var tweet = data.statuses[i].text.toLowerCase(),
					hasReply = tweet.indexOf('@'), 
					hasHashtag = tweet.indexOf('#')
					hasLink = tweet.indexOf('http');
					hasAmp = tweet.indexOf('&');


				// Does the tweet contain offensive words?
				if (!wordfilter.blacklisted(tweet)) {
					// Does the tweet begin wtih "I just want?"
					if (pattern.test(tweet)) {
						// Does the tweet have a reply, hashtag, or URL?
						if ((hasReply == -1) && (hasHashtag == -1) && (hasLink == -1) && (hasAmp == -1)) {
							botData.allPosts.push(tweet);
						}
					}
				}
			}

			if (botData.allPosts.length > 0 ) {
				// Remove duplicates
				botData.allPosts = _.uniq(botData.allPosts);
       			cb(null, botData);
			} else {
				var noMatch = "No tweets beginning with \'I just want...\'";
				cb(noMatch);
			}
		} else {
			var noMatch = "There was an error getting a public Tweet. Abandoning EVERYTHING :(";
			cb(noMatch);
		}
    });
};


extractWordsFromTweet = function(botData, cb) {
	console.log('--Extract');

    var excludeNonAlpha       = /[^a-zA-Z]+/;
    var excludeURLs           = /https?:\/\/[-a-zA-Z0-9@:%_\+.~#?&\/=]+/g;
    var excludeShortAlpha     = /\b[a-z][a-z]?\b/g;
    var excludeHandles        = /@[a-z0-9_-]+/g;
    var excludePatterns       = [excludeURLs, excludeShortAlpha, excludeHandles];

    for (i = 0; i < botData.allPosts.length; i++) {
    	var currentTweet = botData.allPosts[i].toLowerCase();
    	// console.log('currentTweet: ' + currentTweet);

	    _.each(excludePatterns, function(pat) {
			currentTweet = currentTweet.replace(pat, ' ');
	    });

	    botData.allPostsWordList[i] = currentTweet.split(excludeNonAlpha);
    	var excludedElements = [
			'and','the', 'just', 'want'
		];
    
    	botData.allPostsWordList[i] = _.reject(botData.allPostsWordList[i], function(w) {
			return _.contains(excludedElements, w);
		});

    	// Delete any word lists with just one word
    	if (botData.allPostsWordList[i].length == 1) {
    		botData.allPostsWordList.splice(i, 1);
    		continue;
    	}

    	// Clean up any empty elements
    	for (j = botData.allPostsWordList[i].length; j >= 0; j--) {
    		if (botData.allPostsWordList[i][j] == '') {
    			botData.allPostsWordList[i].splice(j, 1);
    		};
    	}
    	botData.allParsedTweets[i] = botData.allPosts[i];
    };
    cb(null, botData);
};


getAllWordData = function(botData, cb) {
	console.log('--Get All Words');
	botData.counter = 0;

	// console.log(botData.allPostsWordList);

	for (i = 0; i < botData.allPostsWordList.length; i++) {
	    async.map(botData.allPostsWordList[i], getWordData, function(err, results){
			botData.wordList[botData.counter] = results;
	    	botData.counter++;			
			cb(err, botData);
	    }); 
	}
}

getWordData = function(word, cb) {
	// console.log('--Get Word Data');
    var client = new Client();

    var wordnikWordURLPart1   = 'http://api.wordnik.com:80/v4/word.json/';
    var wordnikWordURLPart2   = '/definitions?limit=1&includeRelated=false&useCanonical=true&includeTags=false&api_key=';

    var args = {
		headers: {'Accept':'application/json'}
    };

    var wordnikURL = wordnikWordURLPart1 + word.toLowerCase() + wordnikWordURLPart2 + wordnikKey;

    client.get(wordnikURL, args, function (data, response) {
		if (response.statusCode === 200) {
			var result = JSON.parse(data);
			if (result.length) {
				cb(null, result);
			} else {
				cb(null, null);
			}
		} else {
			cb(null, null);
		}
    });
};

apiChecker = function(botData, cb) {
	if (botData.counter == botData.allPostsWordList.length) {
		cb(null, botData);
	};
};


findNouns = function(botData, cb) {
	console.log('--Find Nouns');

	for (i = 0; i < botData.wordList.length; i++) {
	    botData.nounList[i] = [];
	    botData.wordList[i] = _.compact(botData.wordList)[i];

	    _.each(botData.wordList[i], function(wordInfo) {
	    	if (wordInfo != null) {
				var word            = wordInfo[0].word;
				var partOfSpeech    = wordInfo[0].partOfSpeech;

				if (partOfSpeech == 'noun' || partOfSpeech == 'proper-noun') {
		        	botData.nounList[i].push(word);
				}
			}
	    });
	};

	// Drop any tweet with no nouns or greater than four
    for (j = botData.nounList.length - 1; j >= 0; j--) {
    	if ((botData.nounList[j].length == 0) || (botData.nounList[j].length > 4)) {
    		botData.nounList.splice(j, 1);
    		botData.allParsedTweets.splice(j, 1);
    	};
    }


    for (k = 0; k < botData.nounList.length; k++) {
		botData.allFlickrSearchStrings[k] = botData.nounList[k].join('%20');
    };
    cb(null, botData);
}

// ===========================
// Flickr
// ===========================
var flickrPrefix = "https://api.flickr.com/services/rest/?",
	flickrKey = "0370f599a923aa9c317b196ec8a373bd";

var flickrSearchOptions = {
	method: "flickr.photos.search",
	format: "json"
};

var flickrGetSizesOptions = {
	method: "flickr.photos.getSizes",
	format: "json"
}


randomSort = function() {
	var sortOptions = [
		// 'interestingness-desc', 
		// 'interestingness-asc', 
		'relevance'];

	var totalSorts = sortOptions.length;
	var randomSort = Math.floor(Math.random() * totalSorts);
	
	return sortOptions[randomSort];
}



getAllFlickrIDs = function(botData, cb) {
	console.log('--Get All Flickr IDs');
	
    async.map(botData.allFlickrSearchStrings, getFlickrID, function(err, flickrResults){
    	for (i = 0; i < flickrResults.length; i++) {
   			if (flickrResults[i].length > 0) {
				var pos = Math.floor(Math.random() * flickrResults[i].length);
				var randomID = flickrResults[i][pos].id;
				var title = flickrResults[i][pos].title;

				botData.allFlickrIDs[i] = randomID;
				botData.allFlickrTitles[i] = title;
			} else {
				botData.allFlickrIDs[i] = '';
			}
    	}

		cb(err, botData);
    }); 
}


getFlickrID = function(flickrString, cb) {
	var client = new Client();
	var sortOption = randomSort();
    var flickrURL = flickrPrefix 
    				+ "method=" + flickrSearchOptions.method 
    				+ "&api_key=" + flickrKey 
    				+ "&format=json"
    				+ "&sort=" + sortOption
    				+ "&content_type=4"
    				+ "&nojsoncallback=1"
    				+ "&text=" + flickrString;

    client.get(flickrURL, function(data, response) {
    	var err = {};
		if (response.statusCode === 200) {

			var root = data.photos.photo;
			cb (null, root);

		} else {
			console.log('Flickr search error - bad response.');
			cb(err);
    	}
    });
}


flickrIDClean = function(botData, cb) {
	console.log("--Flickr ID Clean");

	for (i = botData.allFlickrIDs.length; i >= 0; i--) {
		if (botData.allFlickrIDs[i] == "") {
			botData.allFlickrIDs.splice(i, 1);
			botData.allFlickrTitles.splice(i, 1);
			botData.allParsedTweets.splice(i, 1);
		};
	}
	cb(null, botData);
}


getAllFlickrSizes = function(botData, cb) {
	console.log('--Get All Flickr IDs');

    async.map(botData.allFlickrIDs, getFlickrSizes, function(err, flickrResults){
    	for (i = 0; i < flickrResults.length; i++) {
    		for (j = 0; j < flickrResults[i].length; j++) {
    			var currentPic = flickrResults[i][j];
    			var picURL = currentPic.source;

				if (currentPic.label == "Medium") {
					console.log(currentPic);
					botData.allFlickrURLs[i] = picURL;
					break;
				} else {
					botData.allFlickrURLs[i] = '';
				}

				console.log("J is: " + j);

    		}
			// console.log("MY title is: " + botData.allFlickrTitles[i]);
			// console.log("I am related to: " + botData.allParsedTweets[i]);
			// console.log("My search string is: " + botData.allFlickrSearchStrings[i]);
			console.log("All Flickr URLs: " + botData.allFlickrURLs);
    	}

		cb(err, botData);
    }); 
}


getFlickrSizes = function(id, cb) {
    var client = new Client();

	var flickrURL = flickrPrefix 
				+ "method=" + flickrGetSizesOptions.method 
				+ "&photo_id=" + id
				+ "&api_key=" + flickrKey 
				+ "&format=json"
				+ "&nojsoncallback=1";

    client.get(flickrURL, function(data, response) {
		if (response.statusCode === 200) {
			var root = data.sizes.size;
			cb(null, root);
		} else {
			console.log('Flickr error response.');
			cb(err, botData);
    	}
    });
}


formatTweet = function(botData, cb) {
	console.log('--Format Tweet');

	// console.log("All Tweets: " + botData.allParsedTweets.length);
	// console.log("All Sources: " + botData.allFlickrURLs.length);
	// console.log("All Titles: " + botData.allFlickrTitles.length);

	
	for (x = 0; x < botData.allFlickrURLs.length; x++) {
		console.log("> " + botData.allFlickrURLs[x]);
	}

	// If we have one or more images, grab one at random
	if (botData.allFlickrURLs.length > 0) {
		for (i = botData.allParsedTweets.length; i >= 0; i--) {
			// if (botData.allFlickrURLs[i] == '') {
  	// 			botData.allParsedTweets.splice(i, 1);
  	// 			botData.allFlickrURLs.splice(i, 1);
  	// 			botData.allFlickrTitles.splice(i, 1);
			// }
		}



		var randomPos = Math.floor(Math.random() * botData.allParsedTweets.length);

		botData.finalTweet = botData.allParsedTweets[randomPos];
		botData.finalPic = botData.allFlickrURLs[randomPos];

		console.log(botData.finalTweet);
		console.log(botData.finalPic);

		// tp.update({
		//     status: botData.finalTweet,
		//     media: request(botData.finalPic)
		// },
		// function (err, result) {
		//     if (err) {
		//         return console.error('Nope!', err);
		//     } else {
		//     console.log("Successful post!");		    	
		//     }
		// });
	} else {

		cb("We don't have any Flickr images at all. Abort mission!", botData);
	}
}


// ===========================
// Execute
// ===========================
run = function() {

	console.log("========= Start it up! =========");

    async.waterfall([
		getPublicTweet, 
		extractWordsFromTweet,
		getAllWordData, 
		apiChecker,		
		findNouns,
		getAllFlickrIDs,
		flickrIDClean,
		getAllFlickrSizes,
		formatTweet
    ],
    function(err, botData) {
		if (err) {
			console.log('There was an error posting to Twitter: ', err);

			// console.log("Twitter Data Length: " + botData.allPostData.length);
		} else {
			// console.log('Tweet successful!');  
			// console.log('Tweet: ', botData.tweetBlock);
		}
		
		// console.log('Base tweet: ', botData.baseTweet);
    });
}

run();