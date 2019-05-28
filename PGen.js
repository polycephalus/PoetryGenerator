//relocate?:
var tracery = require('tracery-grammar');

var grammar_file = require('./JabberGrammar_test01.json');
var grammar = tracery.createGrammar(grammar_file);

// var word = require('./wordo');
var { Word, NN, Vpast, Vinf, JJ} = require('./word');

grammar.addModifiers(tracery.baseEngModifiers);

class Stanza {
    constructor() {
        this.sentences = [];
        this.verses = [[],[]];
    }

    initStanza() {
        this.initVerses();

        //while not rhyme compatible        
        this.generateSentences();
        this.getLast();
        // this.rhymeCheck();
        console.log(this.rhymeCheck());
        //------------------------------rhyme check

        this.getSyllDist(0);
        this.distSyll(0);
        
        
        this.replaceBlanks(0);
    }

    generateSentences() {
        //ltr: checking rhyme compatibility
        for (let i = 0; i < 2; i++) {
            var found = false;
            while(!found) {
                this.sentences[i] = grammar.flatten('#ES#');
                if (this.sentenceSplit(i)) {
                    found = this.syllLimitCheck(i);
                } else {
                    continue
                }
            }
        }
    }

    getLast() {
        for (let i = 0; i < this.verses.length; i++) {
            for (let j = 0; j < 2; j++) {
                var verse = this.verses[i][j];
                var len = verse.words().length;
                verse.last = verse.words()[len-1]; //last word of line 
            }
        }
    }

    rhymeCheck() {
        //valid rhymes: 
        // - all POS with themselves
        // - _NN with _Vinf or _Vpast
        for (let i = 0; i < 2; i++) {
            var w1 = this.verses[0][i].last
            var w2 = this.verses[1][i].last
        
            if (
                w1 == w2 ||
                (w1 == '_NN' && w2 == '_Vinf') || 
                (w1 == '_NN' && w2 == '_Vpast') ||
                (w1 == '_Vinf' && w2 == '_NN') || 
                (w1 == '_Vpast' && w2 == '_NN')
            ) {
                continue;
            } else { 
                return false;
            }
        }
        return true;
    }

    initVerses() {
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                this.verses[i][j] = {
                    verseStr: '',
                    verseStrFill: this.verseStr,
                    metre: 0,
                    toDistLen: 0,
                    syllDist: [],
                    words: function() {
                        return this.verseStr.match(/\w+/g);
                    },
                    blanks: function() {
                        return this.verseStr.match(/_\w+/g);
                    },
                    fills: [],
                    last: ''
                }
            }
        }
        this.verses[0][0].metre = 8;
        this.verses[0][1].metre = 8;
        this.verses[1][0].metre = 8;
        this.verses[1][1].metre = 6;
    }

    sentenceSplit(senID) {
        var poss_splits = this.sentences[senID].split(/ (?=and the|did|in the)/g);
        var min_syll = []; //min amount of syllables per split

        poss_splits.forEach(split => {
            var min = this.getMinSyll(split);
            min_syll.push(min);
        });

        if (min_syll.length < 2) {
            //no possible split
            return false;
        } else if (min_syll.length == 2) {
            this.verses[senID][0].verseStr = poss_splits[0];
            this.verses[senID][1].verseStr = poss_splits[1];
            return true;
        } else {
            var splitID = this.getBalancedSplit(min_syll);
            this.verses[senID][0].verseStr = poss_splits.slice(0, splitID).join(' ');
            this.verses[senID][1].verseStr = poss_splits.slice(splitID, poss_splits.length).join(' ');
            return true;
        }
    }

    getMinSyll(verse) {
        //takes verse str, returns num of minSyll
        var wordList = verse.match(/\w+/g); //arr of words
        var minTwo = RegExp(/_JJ|_Vinf/); //words that consist of at least 2 syllables
        //removed global flag in regexp

        var minSyllCount = 0;

        wordList.forEach(word => {
            // var minTwo = RegExp(/_JJ|_Vpast/g);
            if(minTwo.test(word)) {
                minSyllCount += 2;
            } else {
                minSyllCount++;
            }
        });
        
        return minSyllCount;
    }

    getBalancedSplit(min_syll) {
        var tiny_rec; //smallest diff
        var balanced_splitID;

        for (var i = 1; i < min_syll.length; i++) {
            var arr1 = min_syll.slice(0, i);
            var arr2 = min_syll.slice(i, min_syll.length+1);
            
            var onesum = arr1.reduce((acc, val) => acc + val);
            var twosum = arr2.reduce((acc, val) => acc + val);
            var diff = Math.abs(onesum - twosum);
            
            if (tiny_rec == null || tiny_rec > diff) {
                tiny_rec = diff;
                balanced_splitID = i;
            }
            
        }

        return balanced_splitID;
    }

    syllLimitCheck(senID) {
        //checking syllable capacity
        //if syll to be filled > capacity return false
        for (var i = 0; i < this.verses[senID].length; i++) {
            var verse = this.verses[senID][i];

            var capacity = verse.blanks().length * 3; //max 3 syllables/word
            var filledLen = verse.words().length - verse.blanks().length; //all words - blanks
            var toDistLen = verse.metre - filledLen;
            verse.toDistLen = toDistLen;

            var minSyll = this.getMinSyll(verse.verseStr); //min amount of syllable it takes to fill the blanks

            //check syllable capacity of verse
            //check if verse fits into metre
            if(toDistLen>capacity || minSyll>verse.metre) return false;
        }
        return true;
    }

    //change to 'getSyllDist'?
    getSyllDist(senID) {
        //distribution of syllabes across blanks
        var verse = this.verses[senID][0];
        var blanks = this.verses[senID][0].blanks();
        var re = RegExp(/_JJ|_Vinf/); //min 2 syll -should be in Stanza class?

        //min dist-------------------
        for (var i=0; i<blanks.length; i++) {
            if (re.test(blanks[i])) {
                verse.syllDist[i] = 2;
            } else {
                verse.syllDist[i] = 1;
            }
        }

        var syllsum = verse.syllDist.reduce((acc, val) => acc + val);
        verse.toDistLen -= syllsum; //minus distributed syllables

        //rand dist------------------
        while (verse.toDistLen>0) {
            var randomID = Math.floor(Math.random() * blanks.length);
            if (verse.syllDist[randomID]<3) {
                verse.syllDist[randomID]++;
                verse.toDistLen--;
            }
        }
    }

    distSyll(senID) {
        //for each blank
        var verse = this.verses[senID][0];
        var blanks = verse.blanks();
        var fills = verse.fills;

        for (var i=0; i<blanks.length; i++) { //each blank
            var word = '';
            var w = null;

            switch(blanks[i]) { //make separate
                case '_JJ':
                var w = new JJ(verse.syllDist[i]);
                break;

                case '_Vpast':
                var w = new Vpast(verse.syllDist[i]);
                break;

                case '_NN':
                var w = new NN(verse.syllDist[i], true);
                break;

                case '_NNpl':
                var w = new NN(verse.syllDist[i], false);
                break;

                default:
                w = new Word(verse.syllDist[i]);
            }
            word = w.concatWord();
            word = w.fillWord(word); 
            
            fills[i] = word;

            console.log(fills);
            console.log(verse.syllDist);
        }
    }
    

    //rename to getRand ---------------------------------------------------------!!
    getRandomSyll(syllList) {
        var random = Math.floor(Math.random() * syllList.length);
        var syll = syllList[random];

        return syll;
    }

    replaceBlanks(senID) {
        var verse = this.verses[senID][0];
        var string = verse.verseStr;
        var fills = verse.fills;
        var strFill = verse.verseStrFill;
        console.log('FILLS: '+fills);
        
        var i=0;
        var re = RegExp(/_\w+/g);
        strFill = string.replace(re, getSyll);
        
        
        function getSyll() {
            var word = fills[i++];
            return word;
        }
        console.log(strFill);
    }
}

var s = new Stanza();
s.initStanza();

for (var verse in s.verses[0]) {
    console.log(s.verses[0][verse].verseStr);
}
for (var verse in s.verses[1]) {
    console.log(s.verses[1][verse].verseStr);
}

//--------------------------------------------------------------
var j = new Vinf(3);

console.log();
for (let i = 0; i < 10; i++) {
    newWord = j.concatWord();
    newWord = j.fillWord(newWord);
    console.log('NEW: '+newWord);
}

var a = '_NN';
var b = '_NN';

if (a == b) {
    console.log('YIS');
}
