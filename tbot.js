var Stanza = require('./PGen');

var Twit = require('twit');
var config = require('./config');

var T = new Twit(config);

T.post('statuses/update', { status: 'test. ' }, function(err, data, response) {
    console.log(data)
  })


var s = new Stanza();
s.initStanza();

//make a getStanza?
for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
        console.log(s.verses[i][j].verseStrFill);    
    }    
}