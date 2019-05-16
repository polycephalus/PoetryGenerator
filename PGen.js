//relocate?:
var tracery = require('tracery-grammar');

var grammar_file = require('./JabberGrammar_test01.json');
var grammar = tracery.createGrammar(grammar_file);

grammar.addModifiers(tracery.baseEngModifiers);

class Stanza {
    constructor() {
        this.sentences = [];
        this.verses = [[],[]];

        // this.universyll = ['bla', 'tel', 'man', 'xome'];
        this.universyll = ['ju', 'lia', 'ma', 'lin', 'ska'];
        // this.JJsyll = ['thy', 'ish', '_ish', '_ious', '_al', 'xome'];
        this.JJsyll = ['thy', 'ish', 'mious', 'pal', 'xome'];
        this.Vpastsyll = ['_ed'];
    }

    initStanza() {
        this.initVerses();

        //just the 1st sentence for now
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
        this.getSyllDist(0);
        this.distSyll(0);

        this.replaceBlanks(0);
    }

    initVerses() {
        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                this.verses[i][j] = {
                    verseStr: '',
                    verseStrFill: this.verseStr, //-----------hm
                    metre: 0,
                    toDistLen: 0,
                    syllDist: [],
                    words: function() {
                        return this.verseStr.match(/\w+/g);
                    },
                    blanks: function() {
                        return this.verseStr.match(/_\w+/g);
                    },
                    fills: []
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
        //add universyll (un until the last?)
        var verse = this.verses[senID][0];
        var blanks = verse.blanks();
        var fills = verse.fills;

        for (var i=0; i<blanks.length; i++) { //each blank
            var word = '';
            for (var j=0; j<verse.syllDist[i]-1; j++) { //each syllable in blank
                var syll = this.getRandomSyll(this.universyll);
                word = word.concat('', syll);
            }
            var last = '';
            switch(blanks[i]) { //make separate
                case '_JJ':
                last = this.getRandomSyll(this.JJsyll);
                break;

                case '_Vpast':
                last = this.getRandomSyll(this.Vpastsyll);
                break;

                default:
                last = this.getRandomSyll(this.universyll);
            }
            word = word.concat('', last);
            fills[i] = word;
        }
        console.log(fills);
        console.log(verse.syllDist);
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
        
        
        function getSyll(match) {
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
//0     00
//1     01
//2     10
//3     11

// for (var verse in verses) {
//     console.log(verse+':\n\tID: '+verses[verse].ID);
//     console.log('str:\t '+verses[verse].verseStr);
//     console.log('\tblanks:\t '+verses[verse].blanks());
// }
var vowels = ['a', 'e', 'i', 'o', 'u'];
var consonants = ['b', 'd', 'f', 'g', 'm', 'n', 'p', 'r', 's', 't', 'v', 'ch', 'sh', 'kv']; //no c, k...'gr', 'pr', 'st', 'str'
var protosyll = ['_cl', '_c_vng', '_cill', '_cetch', '_c_vrn', '_c_vrv'];
var primsyll = ['out', 'de', 're', 'un', 'pre', '', '', '']; //-----antepenultimate

function getRand(chararr) {
    var random = Math.floor(Math.random() * chararr.length);
    return chararr[random];
}

function getSyll() {
    var randP = getRand(protosyll);
    var newWord = '';

    newWord = randP.replace(/_\w/g, function(match){
        if (/_c/.test(match)) {
            return getRand(consonants);
        } else if (/_v/.test(match)) {
            return getRand(vowels);
        }
    })

    newWord = newWord.concat('', 'ed');
    newWord = newWord.replace(/^/, getRand(primsyll));
    return newWord;
}

var string = 'The dog _Vpast. ';

console.log('');
for (let i = 0; i < 10; i++) {
    var pult = string.replace(/_Vpast/, getSyll);
    console.log('STR: '+pult);
}