class Word {
    constructor(syllnum) {
        this.syllnum = syllnum;
        this.lastproto = '';
        this.blank = '';

        this.vowels = ['a', 'e', 'i', 'o', 'u', 'ou', 'oi'];
        this.consonants = ['b', 'd', 'f', 'g', 'm', 'n', 'p', 'r', 's', 't', 'v'];

        this.digraphs = ['st', 'ch', 'sh', 'ph', 'fr', 'fl', 'gr']; //_d
        this.connectors = ['bb', 'st', 'kv', 'sc', 'fr', 'fl', 'mp', 'dr']; //_c_c 'sw'
        this.diultim = ['ck', 'st', 'ch', 'sh', 'ff', 'ph', 'sc', 'gh', 'ff']; //_u

        this.trigraphs = ['rtl'] //_u_c

        this.protosyll = [
            ['_cing', '_cill', '_cetch', '_curn', '_cock'],
            ['_c_v_c'], // '_v_c', '_c_v', 
            ['_c_v_c']
        ];
    }

    getBlank() {
        return this.blank;
    }

    getRand(arr) {
        var random = Math.floor(Math.random() * arr.length);
        return arr[random];
    }

    concatWord() {
        var word = ''; //reset

        for (let i = 0; i < this.syllnum; i++) {
            var proto = this.getRand(this.protosyll[i]);
            word = word.replace(/^/, proto);

            if (i == 0) this.lastproto = proto;
        }
        // console.log(word);
        this.blank = word;

        return word;
    }

    fillWord(newWord) {
        //ugly regexp
        newWord = newWord.replace(/_c_c|_\w/g, match => {
            var unit = '';
            switch(match) {
                case '_c_c':
                unit = this.getRand(this.connectors);
                break;

                case '_c':
                unit = this.getRand(this.consonants);
                break;
    
                case '_v':
                unit = this.getRand(this.vowels);
                break;
    
                case '_u':
                unit = this.getRand(this.diultim);
                break;

                case '_d':
                unit = this.getRand(this.digraphs);
            }
            return unit;
        });
        return newWord;
    }
    //set & get last
}

class NN extends Word{
    constructor(syllnum, isSingular) {
        super(syllnum);
        this.isSingular = isSingular;
        this.protosyll[1] = ['_c_v', '_c_v'];
    }

    concatWord() {
        if(!this.isSingular) {
            this.protosyll[0] = ['_c_vves', '_caps', '_cits'];
            if (this.syllnum>1) this.protosyll[0].push('bles');
        }
        var word = super.concatWord();
        this.blank = word;

        return word;
    }
}

class Verb extends Word{
    constructor(syllnum) {
        super(syllnum); 
        this.protosyll[1] = ['out', 'de', 're', 'un', 'pro']; //pro?
        this.protosyll[2] = ['_c_v'];
    }

    concatWord() {
        var word = '';
        
        if (this.syllnum == 2) {
            word = word.concat('', super.getRand(this.protosyll[1]));
        } else if (this.syllnum == 3) {
            word = '_c_v_c_v';
        }

        return word;
    }
}

class Vpast extends Verb {
    constructor(syllnum) {
        super(syllnum);
    }

    concatWord(isNNRhyme) {
        var word = super.concatWord(); //Verb

        function getChoiceRange(isNNRhyme) {
            return (isNNRhyme ? 2 : 3);
        }

        var lastproto = '';

        //if rhyme w/_NN random out of...
        var random = Math.floor(Math.random() * getChoiceRange(isNNRhyme));
        switch (random) {
            case 0:
                lastproto = '_dabe';
                break;
            case 1:
                lastproto = '_dew';
                break;
            case 2:
                lastproto = super.getRand(this.protosyll[0]) + 'ed';
                break;
        }

        this.lastproto = lastproto;
        word = word.concat('', lastproto);
        this.blank = word;

        return word;
    }
}

class Vinf extends Verb {
    constructor(syllnum) {
        super(syllnum);
        this.protosyll[0] = ['_cill', '_cetch', '_curn', '_cock'];
    }

    concatWord() {
        var word = super.concatWord();
        this.lastproto = this.getRand(this.protosyll[0])
        word = word.concat('', this.lastproto);
        this.blank = word;

        return word;
    }
}

class JJ extends Word {
    constructor(syllnum) {
        super(syllnum);
        this.protosyll[0] = ['_cious', '_dish', '_c_cal', 'xome', 'thy'];
        this.protosyll[1] = ['_d_v', '_c_v', '_c_vn'];
        this.protosyll[2] = ['re', 'un', 'de'];
    }
}

module.exports = {
    Word,
    NN,
    Verb,
    Vpast,
    Vinf,
    JJ
};