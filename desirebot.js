var _             = require('lodash');
var Client        = require('node-rest-client').Client;
var Twit          = require('twit');
var async         = require('async');
var wordfilter    = require('wordfilter');
var TwitterPic 	  = require('twitter-pic');
var request       = require('request');

var t = new Twit({
    consumer_key:         	process.env.DESIREBOT_TWIT_CONSUMER_KEY,
    consumer_secret:      	process.env.DESIREBOT_TWIT_CONSUMER_SECRET,
    access_token:         	process.env.DESIREBOT_TWIT_ACCESS_TOKEN,
    access_token_secret:  	process.env.DESIREBOT_TWIT_ACCESS_TOKEN_SECRET
});

var tp = new TwitterPic({
	consumer_key:    		process.env.DESIREBOT_TWIT_CONSUMER_KEY,
	consumer_secret: 		process.env.DESIREBOT_TWIT_CONSUMER_SECRET,
	token:           		process.env.DESIREBOT_TWIT_ACCESS_TOKEN,
	token_secret:    		process.env.DESIREBOT_TWIT_ACCESS_TOKEN_SECRET
});

var wordnikKey = 			process.env.DESIREBOT_WORDNIK_KEY;


getPublicTweet = function(cb) {
    t.get('search/tweets', {q: '\"i%20just%20want\"', count: 100, result_type: 'recent', lang: 'en'}, function(err, data, response) {
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
				allFlickrPages: []
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
							botData.allPosts.push(data.statuses[i].text);
						}
					}
				}
			}

			if (botData.allPosts.length > 0 ) {
				// Remove duplicates
				botData.allPosts = _.uniq(botData.allPosts);
       			cb(null, botData);
			} else {
				cb("No tweets beginning with \'I just want...\'");
			}
		} else {
			cb("There was an error getting a public Tweet. Abandoning EVERYTHING :(");
		}
    });
};


extractWordsFromTweet = function(botData, cb) {
	console.log('--Extract');

    var excludeNonAlpha       = /[^a-zA-Z]+/;
    var excludeURLs           = /https?:\/\/[-a-zA-Z0-9@:%_\+.~#?&\/=]+/g;
    var excludeShortAlpha     = /\b[a-z][a-z]?[a-z]?\b/g;
    var excludeHandles        = /@[a-z0-9_-]+/g;
    var excludePatterns       = [excludeURLs, excludeShortAlpha, excludeHandles];

    for (i = 0; i < botData.allPosts.length; i++) {
    	var currentTweet = botData.allPosts[i].toLowerCase();

	    _.each(excludePatterns, function(pat) {
			currentTweet = currentTweet.replace(pat, ' ');
	    });

	    botData.allPostsWordList[i] = currentTweet.split(excludeNonAlpha);
    	var excludedElements = [
			'and','the', 'just', 'want', 'don'
		];
    
    	botData.allPostsWordList[i] = _.reject(botData.allPostsWordList[i], function(w) {
			return _.contains(excludedElements, w);
		});

    	// Clean up any empty elements
    	for (j = botData.allPostsWordList[i].length; j >= 0; j--) {
    		if (botData.allPostsWordList[i][j] == '' || botData.allPostsWordList[i][j] == undefined) {
    			botData.allPostsWordList[i].splice(j, 1);
    		};
    	}

  		botData.allParsedTweets[i] = botData.allPosts[i];
    };

	// Word List Cleanup
    for (k = botData.allPostsWordList.length - 1; k >= 0; k--) {
		// If word list is one or less, discard it.
		// The hope here is two or more tags = greater accuracy in terms of photo matching tweet.
    	if (botData.allPostsWordList[k].length <= 1) {
			botData.allPostsWordList.splice(k, 1);
			botData.allParsedTweets.splice(k, 1);
    	};
    }

    // allParsedTweets
    // allPosts xxx
    // allPostsWordList

    cb(null, botData);
};


getAllWordData = function(botData, cb) {
	console.log('--Get All Words');
	botData.counter = 0;

	getWordListSequence = function(pos) {
	    async.mapSeries(botData.allPostsWordList[pos], getWordData, function(err, results){
			botData.wordList[pos] = results;
   			botData.counter++;

   			if (botData.counter == botData.allPostsWordList.length) {
				cb(err, botData);
   			} else {
   				getWordListSequence(botData.counter);
   			}
	    }); 
	}

	getWordListSequence(botData.counter);

    // allParsedTweets
    // allPosts xxx
    // allPostsWordList
    // wordList	
}


getWordData = function(word, cb) {
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


// apiChecker = function(botData, cb) {
// 	console.log('--API Checker');
// 	if (botData.counter == botData.allPostsWordList.length) {

// 		// Testing
// 		for (x = 0; x < botData.allParsedTweets.length; x++) {
// 			console.log("Tweets:       " + botData.allParsedTweets[x]);

// 			for (z = 0; z < botData.wordList[x].length; z++) {
// 				console.log(botData.wordList[x][0][0].word);
// 			}
// 			// console.log("Word List:    " + botData.wordList[x][0][0].word);
// 			console.log('---------');
// 			console.log('');
// 		}



// 		cb(null, botData);
// 	};
// };


findNouns = function(botData, cb) {
	console.log('--Find Nouns');

	for (i = 0; i < botData.wordList.length; i++) {
	    botData.nounList[i] = [];

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
    	if ((botData.nounList[j].length < 2) || (botData.nounList[j].length > 4)) {
    		botData.nounList.splice(j, 1);
    		botData.allParsedTweets.splice(j, 1);
    	};
    }

    for (k = 0; k < botData.nounList.length; k++) {
		botData.allFlickrSearchStrings[k] = botData.nounList[k].join(',');
    };

	// allParsedTweets
    // allPosts xxx
    // allPostsWordList xxx
    // wordList xxx
    // nounList xxx
    // allFlickrSearchStrings

    cb(null, botData);
}


// ===========================
// Flickr
// ===========================
var flickrPrefix = "https://api.flickr.com/services/rest/?",
	flickrKey = process.env.DESIREBOT_FLICKR_KEY;

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
		'interestingness-desc', 
		'relevance'
		];

	var totalSorts = sortOptions.length;
	var randomSort = Math.floor(Math.random() * totalSorts);
	
	return sortOptions[randomSort];
}


getAllFlickrIDs = function(botData, cb) {
	console.log('--Get All Flickr IDs');
	
    async.map(botData.allFlickrSearchStrings, getFlickrID, function(err, flickrResults){
    	for (i = 0; i < flickrResults.length; i++) {
   			if (flickrResults[i].length > 0) {
				// var pos = Math.floor(Math.random() * flickrResults[i].length);

				// Randomize from returned selection? Or grab first?
				var pos = 0;
				var randomID = flickrResults[i][pos].id;
				var title = flickrResults[i][pos].title;

				botData.allFlickrIDs[i] = randomID;
				botData.allFlickrTitles[i] = title;
			} else {
				botData.allFlickrIDs[i] = '';
				botData.allFlickrTitles[i] = '';
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
    				+ "&safe_search=2"
    				+ "&content_type=4"
    				+ "&format=json"
    				+ "&sort=" + sortOption
    				+ "&content_type=4"
    				+ "&tag_mode=all"
    				+ "&page=10"
    				+ "&nojsoncallback=1"
    				+ "&tags=" + flickrString;

    client.get(flickrURL, function(data, response) {
		if (response.statusCode === 200) {
			var root = data.photos.photo;
			cb (null, root);
		} else {
			// Flickr search error - bad response.
			cb(null, "");
    	}
    });
}


flickrIDClean = function(botData, cb) {
	console.log("--Flickr ID Clean");


	// Noun list is not matching up. Go back up and find out where this is happening.
	// This would all probably be easier if you started writing tests, don't you think?





	for (i = botData.allFlickrIDs.length; i >= 0; i--) {
		if (botData.allFlickrIDs[i] == "") {
			botData.allFlickrIDs.splice(i, 1);
			botData.allFlickrSearchStrings.splice(i, 1);
			botData.allFlickrTitles.splice(i, 1);
			botData.allParsedTweets.splice(i, 1);
		};
	}


	// allParsedTweets
    // allPosts xxx
    // allPostsWordList xxx
    // wordList xxx
    // nounList xxx
    // allFlickrSearchStrings
    // allFlickrIDs
    // allFlickrTitles

	cb(null, botData);
}


getAllFlickrSizes = function(botData, cb) {
	console.log('--Get All Flickr IDs');

    async.map(botData.allFlickrIDs, getFlickrSizes, function(err, flickrResults){
    	for (i = 0; i < flickrResults.length; i++) {
    		for (j = 0; j < flickrResults[i].length; j++) {
    			var currentPic = flickrResults[i][j];
    			var picURL = currentPic.source;
    			var picPage = currentPic.url;

				if (currentPic.label == "Medium") {
					botData.allFlickrURLs[i] = picURL;
					botData.allFlickrPages[i] = picPage;
					break;
				} else {
					botData.allFlickrURLs[i] = '';
					botData.allFlickrPages[i] = '';
				}
    		}
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
			cb('Flickr error response.', botData);
    	}
    });
}


formatTweet = function(botData, cb) {
	console.log('--Format Tweet');

	// If we have one or more images, grab one at random
	if (botData.allFlickrURLs.length > 0) {
		for (i = botData.allParsedTweets.length; i >= 0; i--) {
			if (botData.allFlickrURLs[i] == '') {
  				botData.allParsedTweets.splice(i, 1);
  				botData.allFlickrURLs.splice(i, 1);
  				botData.allFlickrSearchStrings.splice(i, 1);
  				botData.allFlickrPages.splice(i, 1);
  				botData.allFlickrTitles.splice(i, 1);
			}
		}

		var randomPos = Math.floor(Math.random() * botData.allParsedTweets.length);

		botData.finalTweet = botData.allParsedTweets[randomPos];
		botData.finalPic = botData.allFlickrURLs[randomPos];

		console.log("Search String: " + botData.allFlickrSearchStrings[randomPos]);
		console.log("Tweet:         " + botData.finalTweet);
		console.log("Pic:           " + botData.allFlickrPages[randomPos]);

		tp.update({
		    status: botData.finalTweet,
		    media: request(botData.finalPic)
		},
		function (err, result) {
		    if (err) {
		        return console.error('Nope!', err);
		    } else {
		    console.log("Successful post!");		    	
		    }
		});
	} else {
		cb("We don't have any Flickr images at all. Abort mission!", botData);
	}
}


// ===========================
// Execute
// ===========================
run = function() {
	console.log("========= Starting! =========");

    async.waterfall([
		getPublicTweet, 
		extractWordsFromTweet,
		getAllWordData, 
		findNouns,
		getAllFlickrIDs,
		flickrIDClean,
		getAllFlickrSizes,
		formatTweet
    ],
    function(err, botData) {
		if (err) {
			console.log('There was an error posting to Twitter: ', err);
		}
    });
}


run();


// setInterval(function() {
//   try {
//     run();
//   }
//   catch (e) {
//     console.log(e);
//   }
// }, 60000 * 30);