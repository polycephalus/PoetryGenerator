//relocate?:
var tracery = require('tracery-grammar');

var grammar_file = require('./JabberGrammar_test01.json');
var grammar = tracery.createGrammar(grammar_file);

grammar.addModifiers(tracery.baseEngModifiers);

class Stanza {
    constructor() {
        this.verses = [[],[]];
        this.sentences = [];
    }

    initStanza() {
        this.initVerses();

        //just the 1st sentence for now
        //ltr: checking rhyme compatibility
        var found = false;
        while(!found) {
            this.sentences[0] = grammar.flatten('#ES#');
            if (this.sentenceSplit(0)) {
                //limit check
                console.log('VALID. ');
                found = this.syllLimitCheck(0);
                // found = true; //-----------------------------------------temp!!
            } else {
                //continue
                console.log('INVALID. ');
            }
        }
    }

    initVerses() {
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                this.verses[i][j] = {
                    verseStr: '',
                    metre: 0,
                    words: function() {
                        return this.verseStr.match(/\w+/g);
                    },
                    blanks: function() {
                        return this.verseStr.match(/_\w+/g);
                    }
                }
            }
        }
        this.verses[0][0].metre = 8;
        this.verses[0][1].metre = 8;
        this.verses[1][0].metre = 8;
        this.verses[1][0].metre = 6;
    }

    sentenceSplit(senID) {
        var poss_splits = this.sentences[senID].split(/ (?=and the|did|in the)/g);
        var min_syll = []; //min amount of syllables per split

        poss_splits.forEach(split => {
            var min = this.getMinSyll(split);
            min_syll.push(min);
        });

        console.log(min_syll);

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
        // var minTwo = RegExp(/_JJ|_Vpast/g); //words that consist of at least 2 syllables

        var minSyllCount = 0;

        wordList.forEach(word => {
            var minTwo = RegExp(/_JJ|_Vpast/g);
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
        for (let i = 0; i < this.verses[senID].length; i++) {
            var verse = this.verses[senID][i];

            var capacity = verse.blanks().length * 3; //max 3 syllables/word
            var filledLen = verse.words().length - verse.blanks().length; //all words - blanks
            var toDistLen = verse.metre - filledLen;

            var minSyll = this.getMinSyll(verse.verseStr); //min amount of syllable it takes to fill the blanks

            //check syllable capacity of verse
            //check if verse fits into metre
            if(toDistLen>capacity || minSyll>verse.metre) return false;
        }
        return true;
    }
}

var s = new Stanza();
s.initStanza();

for (var verse in s.verses[0]) {
    console.log(s.verses[0][verse].verseStr);
}

//0     00
//1     01
//2     10
//3     11

// for (var verse in verses) {
//     console.log(verse+':\n\tID: '+verses[verse].ID);
//     console.log('str:\t '+verses[verse].verseStr);
//     console.log('\tblanks:\t '+verses[verse].blanks());
// }