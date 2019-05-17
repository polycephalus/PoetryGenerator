exports.word = {
    vowels: ['a', 'e', 'i', 'o', 'u', 'ui', 'ou'],
    consonants: ['b', 'd', 'f', 'g', 'm', 'n', 'p', 'r', 's', 't', 'v', 'ch', 'sh', 'kv', 'sw', 'ph'], //no c, k...'gr', 'pr', 'st', 'str'           
    idk: ['b', 'f', 'g', 'm', 'p', 's', 'ch', 'sh'], //special _l consonants

    primsyll: ['out', 'de', 're', 'un', 'pre', '', '', ''],
    midprotosyll: ['_c_v'],
    protosyll: ['_al', '_c_vng', '_cill', '_cetch', '_c_vrn', '_c_vrv', '_cas'],

    getRand: function(arr) {
        var random = Math.floor(Math.random() * arr.length);
        return arr[random];
    },

    //take POS, syllnum
    getWord: function(POS, syllnum) {
        var newWord = '';

        //assemble word from protosyll & pre/suffixes befitting its POS
        //switch...
        switch(POS) {
            case '_Vpast': //add primsyll if syllnum allows (excl. 3 syll?)
            // for (var i = 0; i < syllnum; i++) {
            //     var syll = this.getRand(this.protosyll);
            //     newWord = newWord.concat('', syll);                                
            // }
            var first = this.getRand(this.primsyll);
            var mid = this.getRand(this.midprotosyll); //no good
            var last = this.getRand(this.protosyll);
            
            newWord = newWord.concat('', first, last, 'ed');
            break;
        }

        //fill in protosyll-------------------------------------------
        // newWord = newWord.replace(/_\w/g, function(match){
        //     var word = '';
        //     switch(match) {
        //         case '_c':
        //         word = self.getRand(self.consonants);
        //         break;
    
        //         case '_v':
        //         word = self.getRand(self.vowels);
        //         break;
    
        //         case '_a':
        //         unit = getRand(self.idk);
        //         break;
        //     }
        //     return word;
        // });

        newWord = newWord.replace(/_\w/g, match => {
            var word = '';
            switch(match) {
                case '_c':
                word = this.getRand(this.consonants);
                break;
    
                case '_v':
                word = this.getRand(this.vowels);
                break;
    
                case '_a':
                unit = getRand(this.idk);
                break;
            }
            return word;
        });
        return newWord;
    }
}