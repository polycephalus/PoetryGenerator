class Word {
    constructor(syllnum) {
        this.syllnum = syllnum;

        this.vowels = ['a', 'e', 'i', 'o', 'u', 'ou', 'oi'];
        this.consonants = ['b', 'd', 'f', 'g', 'm', 'n', 'p', 'r', 's', 't', 'v'];

        this.digraphs = ['st', 'ch', 'sh', 'ph', 'fr']; //_d
        this.connectors = ['bb', 'st', 'rw', 'kv', 'sw', 'sc', 'fr', 'fl', 'mp', 'dr']; //_c_c
        this.diultim = ['ck', 'st', 'ch', 'sh', 'ff', 'ph', 'sc', 'gh', 'ff']; //_u

        this.trigraphs = ['rtl'] //_u_c

        this.protosyll = [
            ['_c_v_u', '_c_vng', '_cill', '_cetch', '_c_vrn'], //wock  
            ['_v_c', '_c_v'], //er
            ['_c_v_d'] //jabb
        ];
    }

    getRand(arr) {
        var random = Math.floor(Math.random() * arr.length);
        return arr[random];
    }

    concatWord() {
        var word = ''; //reset

        for (let i = 0; i < this.syllnum; i++) {
            word = word.replace(/^/, this.getRand(this.protosyll[i]));
        }
        // console.log(word);
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
}

class NN extends Word{
    constructor(syllnum, isSingular) {
        super(syllnum);
        this.isSingular = isSingular;
        this.protosyll[1] = ['_v_c'];
    }

    concatWord() {
        if(!this.isSingular) {
            this.protosyll[0] = ['_c_vves', '_vbles', '_c_vps', '_c_vts'];
        }
        var word = super.concatWord();
        return word;
    }
}

class Vpast extends Word{
    constructor(syllnum) {
        super(syllnum); 
        this.protosyll[1] = ['out', 'de', 're', 'un', 'pro']; //pro?
        this.protosyll[2] = ['_c_v'];
    }

    concatWord() {
        var word = '';

        if (this.syllnum == 2) {
            word = word.concat('', super.getRand(this.protosyll[1]));
        }

        if (this.syllnum == 2 || this.syllnum == 1) {
            word = word.concat('', super.getRand(this.protosyll[0]))
            word = word.concat('', 'ed');
        } else {
            word = '_c_v_c_c_vsted';
        }
        
        return word;
    }
}

class Vinf extends Word {

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
    Vpast,
    Vinf,
    JJ
};