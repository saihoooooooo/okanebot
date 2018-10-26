class MarkovChain {
  constructor(n) {
    this.data = {};
  }

  add(words) {
    for (let i = 0; i <= words.length; i++) {
      let now = words[i];
      if (now === undefined) {
        now = null
      };

      let prev = words[i - 1];
      if (prev === undefined) {
        prev = null
      };

      if (this.data[prev] === undefined) {
        this.data[prev] = [];
      }

      this.data[prev].push(now);
    }
  }

  sample(word) {
    let words = this.data[word];
    if (words === undefined) {
      words = [];
    }

    return words[Math.floor(Math.random() * words.length)];
  }

  make(argword) {
    let sentence = [];
    let word;
    if (argword != null && this.exists(argword)) {
      word = argword;
    } else {
      word = this.sample(null);
    }

    while (word) {
      sentence.push(word);
      if (sentence.length >= 100) {
        break;
      }

      word = this.sample(word);
    }

    return sentence.join('');
  }

  exists(word) {
    return this.data[word] !== undefined;
  }
}

module.exports = MarkovChain;
