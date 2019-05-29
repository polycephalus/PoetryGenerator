//relocate?:
var tracery = require('tracery-grammar');

var grammar_file = require('./JabberGrammar_test01.json');
var grammar = tracery.createGrammar(grammar_file);

// var word = require('./wordo');
var { Word, NN, Verb, Vpast, Vinf, JJ} = require('./word');

grammar.addModifiers(tracery.baseEngModifiers);

class Stanza {
    constructor() {
        this.sentences = [];
        this.verses = [[],[]];
    }

    initStanza() {
        this.initVerses();

        //while not rhyme compatible 
        var isRhymeCompatible = false;
        while (!isRhymeCompatible) {
            this.generateSentences();
            this.getLast();
            isRhymeCompatible = this.rhymeCheck();
        }

        for (var i = 0; i < 2; i++) {
            for (var j = 0; j < 2; j++) {
                this.getSyllDist(i, j);
                this.distSyll(i, j);
                
                // this.replaceBlanks(i, j); //to string
            }   
        }

        this.rhyme();
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
                    skeleton: '',
                    lastPOS: '',
                    last: '' //POS last
                }
            }
        }
        this.verses[0][0].metre = 8;
        this.verses[0][1].metre = 8;
        this.verses[1][0].metre = 8;
        this.verses[1][1].metre = 6;
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
                verse.lastPOS = verse.words()[len-1]; //last word of line 
            }
        }
    }

    rhymeCheck() {
        //valid rhymes: 
        // - all POS with themselves
        // - _NN with _Vinf or _Vpast
        for (let i = 0; i < 2; i++) {
            var w1 = this.verses[0][i].lastPOS
            var w2 = this.verses[1][i].lastPOS
        
            if (
                w1 == w2 ||
                (w1 == '_NN' && w2 == '_Vinf') || 
                (w1 == '_NN' && w2 == '_Vpast') ||
                (w1 == '_Vinf' && w2 == '_NN') || 
                (w1 == '_Vpast' && w2 == '_NN')
                // (w1 == '_NN'|| '_NNpl' && w2 == '_Vinf' || '_Vpast') ||
                // (w1 == '_Vinf' || '_Vpast' && w1 == '_NN' || '_NNpl')
            ) {
                continue;
            } else { 
                return false;
            }
        }
        return true;
    }

    sentenceSplit(senID) {
        var poss_splits = this.sentences[senID].split(/ (?=and the|did|in the|Twas)/g);
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
    getSyllDist(senID, verID) {
        //distribution of syllabes across blanks
        var verse = this.verses[senID][verID];
        var blanks = this.verses[senID][verID].blanks();
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

    distSyll(senID, verID) {
        //for each blank
        var verse = this.verses[senID][verID];
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

                case '_Vinf':
                var w = new Vinf(verse.syllDist[i]);
                break;

                default:
                w = new Word(verse.syllDist[i]);
            }
            word = w.concatWord();
            word = w.fillWord(word);

            if (i == blanks.length-1) { //storing blank last word of verse, last syll
                verse.last = w.lastproto;
                verse.skeleton = w.getBlank();
            }
            
            fills[i] = word;
        }
    }
    

    //rename to getRand ---------------------------------------------------------!!
    getRandomSyll(syllList) {
        var random = Math.floor(Math.random() * syllList.length);
        var syll = syllList[random];

        return syll;
    }

    replaceBlanks(senID, verID) {
        var verse = this.verses[senID][verID];
        var string = verse.verseStr;
        var fills = verse.fills;
        var strFill = verse.verseStrFill;
        
        var i=0;
        var re = RegExp(/_\w+/g);
        strFill = string.replace(re, getSyll);
        
        
        function getSyll() {
            var word = fills[i++];
            return word;
        }

        function toUpper(str) {
            return str.charAt(0).toUpperCase() + str.slice(1); 
        }
        verse.verseStrFill = toUpper(strFill);
        // console.log(strFill);
    }

    rhyme() {
        for (let i = 0; i < 2; i++) {
            var V1 = this.verses[0][i];
            var V2 = this.verses[1][i];

            var w = new Word(0);

            if (V1.lastPOS == V2.lastPOS) {
                //get blank word (skeleton || call w.getBlank())
                //slice off last syll, replace w/last syll of other
                var blank = V2.skeleton;
                var last_syll = V2.last;

                var new_word = blank.slice(0, -last_syll.length);
                var new_word = new_word.concat('', V1.last);
                var new_word = w.fillWord(new_word);

                this.verses[1][i].fills[V2.fills.length-1] = new_word;

            } else if (V1.lastPOS == '_NN') {
                var new_words = swap(V2, V1);
                this.verses[0][i].fills[V1.fills.length-1] = new_words[0];
                if (new_words[1]) {
                    this.verses[1][i].fills[V2.fills.length-1] = new_words[1];
                }

            } else if (V2.lastPOS == '_NN') {
                var new_words = swap(V1, V2);
                this.verses[1][i].fills[V2.fills.length-1] = new_words[0];
                if (new_words[1]) {
                    this.verses[0][i].fills[V1.fills.length-1] = new_words[1];
                }
            }

            function swap(dominant, recessive) {
                var other_new_word; //undef
                
                //if Vpast gen new
                if (dominant.lastPOS == '_Vpast') {
                    var v = new Vpast(1);
                    v.concatWord(true);
                    var new_last = v.getBlank();
                    var dom_old = dominant.skeleton;
                    var dom_old_last = dominant.last;
                    var dom_new = dom_old.slice(0, -dom_old_last.length);
                    var dom_new = dom_new.concat('', new_last);
                    console.log('FLAG-------------------');
                    console.log(dom_old);
                    console.log(dom_old_last);
                    console.log(new_last);
                    console.log(dom_new);
                    other_new_word = v.fillWord(dom_new);
                } else {
                    var new_last = dominant.last;
                }

                var new_word = recessive.skeleton;
                var old_last = recessive.last;

                new_word = new_word.slice(0, -old_last.length);
                new_word = new_word.concat('', new_last);
                new_word = new_word.replace(/_dew/g, '_cue');
                new_word = new_word.replace(/_d/g, '_c');
                // console.log(new_word);
                new_word = w.fillWord(new_word);
                // console.log('new: '+new_word);

                var new_words = [new_word, other_new_word]

                return new_words;
            }
            
            this.replaceBlanks(0, i);
            this.replaceBlanks(1, i);
        }
    }
}

var s = new Stanza();
s.initStanza();


for (var verse in s.verses[0]) {
    console.log(s.verses[0][verse].verseStrFill);
}
for (var verse in s.verses[1]) {
    console.log(s.verses[1][verse].verseStrFill);
}

//--------------------------------------------------------------
var j = new NN(3, false);

console.log();
for (let i = 0; i < 10; i++) {
    newWord = j.concatWord();
    newWord = j.fillWord(newWord);
    console.log('NEW: '+newWord);
}

// console.log(s.verses[0][0].blanks())