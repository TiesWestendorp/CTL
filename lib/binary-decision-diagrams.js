class BDD {
  constructor(_label, _then, _else) {
    this._label = _label
    this._then  = _then
    this._else  = _else
  }

  get isTerminal()    { return false }
  get isSatisfiable() { return this !== BDD.False }
  get isTautology()   { return this === BDD.True  }
  numberOfSatisfyingAssignments(number_of_variables) {
    if (this.isTerminal) return this.value * Math.pow(2, number_of_variables)
    return (this._then.numberOfSatisfyingAssignments(number_of_variables) + this._else.numberOfSatisfyingAssignments(number_of_variables))/2
  }

  static cacheReset() {
    BDD.cache = {}
  }
  static reset() {
    BDD.cacheReset()
    BDD.vars  = 0
  }
  static variable() {
    return BDD.get(BDD.vars++, BDD.True, BDD.False)
  }
  static get(_label, _then, _else) {
    if (_then === _else) {
      return _then
    }
    let bdd
    let cached = BDD.cache[_label]
    if (cached) {
      bdd = cached.find(bdd => bdd._then === _then && bdd._else === _else)
      if (!bdd) {
        bdd = new BDD(_label, _then, _else)
        cached.push(bdd, BDD.noCacheNot(bdd))
      }
    } else {
      bdd = new BDD(_label, _then, _else)
      BDD.cache[_label] = [bdd, BDD.noCacheNot(bdd)]
    }
    return bdd
  }
  static noCacheNot(A) {
    if (A === BDD.True)  return BDD.False
    if (A === BDD.False) return BDD.True
    return new BDD(A._label, BDD.noCacheNot(A._then), BDD.noCacheNot(A._else))
  }

  /*
   * Replace True by _then and False by _else recursively in A
   */
  static conditional(A, _then, _else) {
    if (A === BDD.True)       return _then
    if (A === BDD.False)      return _else
    if (_then === _else)      return _then
    if (A === _then)          return BDD.conditional(A, BDD.True, _else)
    if (A === _else)          return BDD.conditional(A, _then, BDD.False)
    if (A === BDD.not(_then)) return BDD.conditional(A, BDD.False, _else)
    if (A === BDD.not(_else)) return BDD.conditional(A, _then, BDD.True)
    if (_then.isTerminal && _else.isTerminal) {
      return _then.value ? A : BDD.not(A)
    }
    const rootLabel = Math.min(A._label, _then._label, _else._label)
    switch( 4 * (A._label === rootLabel) + 2 * (_then._label === rootLabel) + (_else._label === rootlabel) ) {
      case 1: return BDD.get(rootLabel, BDD.conditional(A, _then, _else._then),             BDD.conditional(A, _then, _else._else))
      case 2: return BDD.get(rootLabel, BDD.conditional(A, _then._then, _else),             BDD.conditional(A, _then._else, _else))
      case 3: return BDD.get(rootLabel, BDD.conditional(A, _then._then, _else._then),       BDD.conditional(A, _then._else, _else._else))
      case 4: return BDD.get(rootLabel, BDD.conditional(A._then, _then, _else),             BDD.conditional(A._else, _then, _else))
      case 5: return BDD.get(rootLabel, BDD.conditional(A._then, _then, _else._then),       BDD.conditional(A._else, _then, _else._else))
      case 6: return BDD.get(rootLabel, BDD.conditional(A._then, _then._then, _else),       BDD.conditional(A._else, _then._then, _else))
      case 7: return BDD.get(rootLabel, BDD.conditional(A._then, _then._then, _else._then), BDD.conditional(A._else, _then._else, _else._else))
    }
  }

  /*
   * Replace all labels according to mapping
   * Precondition: forall label1, label2: label1 < label2 => mapping[label1] < mapping[label2] (where implicitly mapping[label] === label when not label in mapping)
   */
  static substitute(A, mapping) {
    if (A === BDD.True)  return BDD.True
    if (A === BDD.False) return BDD.False
    return BDD.get(A._label in mapping ? mapping[A._label] : A._label, BDD.substitute(A._then, mapping), BDD.substitute(A._else, mapping))
  }


  /*
   * Unary + binary boolean operations
   */
  static not(A) {
    if (A === BDD.True)  return BDD.False
    if (A === BDD.False) return BDD.True
    return BDD.get(A._label, BDD.not(A._then), BDD.not(A._else))
  }
  static and(A, B) {
    if (A === BDD.True)   return B
    if (B === BDD.True)   return A
    if (A === BDD.False)  return BDD.False
    if (B === BDD.False)  return BDD.False
    if (A === B)          return A
    if (A === BDD.not(B)) return BDD.False
    if (A._label === B._label) {
      return BDD.get(A._label, BDD.and(A._then, B._then), BDD.and(A._else, B._else))
    } else if (A._label < B._label) {
      return BDD.get(A._label, BDD.and(A._then, B), BDD.and(A._else, B))
    } else {
      return BDD.get(B._label, BDD.and(A, B._then), BDD.and(A, B._else))
    }
  }
  static or(A, B) {
    if (A === BDD.True)   return BDD.True
    if (B === BDD.True)   return BDD.True
    if (A === BDD.False)  return B
    if (B === BDD.False)  return A
    if (A === B)          return A
    if (A === BDD.not(B)) return BDD.True
    if (A._label === B._label) {
      return BDD.get(A._label, BDD.or(A._then, B._then), BDD.or(A._else, B._else))
    } else if (A._label < B._label) {
      return BDD.get(A._label, BDD.or(A._then, B), BDD.or(A._else, B))
    } else {
      return BDD.get(B._label, BDD.or(A, B._then), BDD.or(A, B._else))
    }
  }
  static eql(A, B) {
    if (A === BDD.True)   return B
    if (B === BDD.True)   return A
    if (A === BDD.False)  return BDD.not(B)
    if (B === BDD.False)  return BDD.not(A)
    if (A === B)          return BDD.True
    if (A === BDD.not(B)) return BDD.False
    if (A._label === B._label) {
      return BDD.get(A._label, BDD.eql(A._then, B._then), BDD.eql(A._else, B._else))
    } else if (A._label < B._label) {
      return BDD.get(A._label, BDD.eql(A._then, B), BDD.eql(A._else, B))
    } else {
      return BDD.get(B._label, BDD.eql(A, B._then), BDD.eql(A, B._else))
    }
  }
  static xor(A, B)  { return BDD.not(BDD.eql(A, B)) }
  static nor(A, B)  { return BDD.not(BDD.or(A, B))  }
  static nand(A, B) { return BDD.not(BDD.and(A, B)) }


  /*
   * n-ary boolean operations
   */
  static andN(As) {
    if (As.length === 0) return BDD.True
    if (As.length === 1) return As[0]
    if (As[0] === BDD.True)  return BDD.andN(As.slice(1))
    if (As[0] === BDD.False) return BDD.False
    return BDD.and(As[0], BDD.andN(As.slice(1)))
  }
  static orN(As) {
    if (As.length === 0) return BDD.True
    if (As.length === 1) return As[0]
    if (As[0] === BDD.True)  return BDD.True
    if (As[0] === BDD.False) return BDD.orN(As.slice(1))
    return BDD.or(As[0], BDD.orN(As.slice(1)))
  }


  /*
   * Quantifiers
   * Note: Complexity improvement possible for these methods by using binary
   *       rather than linear search, though this should make no difference
   *       in practice.
   * Precondition: labels sorted
   */
  static existsN(A, labels) {
    if (A.isTerminal) return A
    const index = labels.findIndex(label => label >= A._label)
    if (index === -1) return A
    if (A._label === labels[index]) {
      labels = labels.slice(index + 1)
      return BDD.or(BDD.existsN(A._then, labels), BDD.existsN(A._else, labels))
    } else {
      labels = labels.slice(index)
      return BDD.get(A._label, BDD.existsN(A._then, labels), BDD.existsN(A._else, labels))
    }
  }
  static forallN(A, labels) {
    if (A.isTerminal) return A
    const index = labels.findIndex(label => label >= A._label)
    if (index === -1) return A
    if (A._label === labels[index]) {
      labels = labels.slice(index + 1)
      return BDD.and(BDD.forallN(A._then, labels), BDD.forallN(A._else, labels))
    } else {
      labels = labels.slice(index)
      return BDD.get(A._label, BDD.forallN(A._then, labels), BDD.forallN(A._else, labels))
    }
  }
}

BDD.reset()
BDD.True  = Object.create(BDD.prototype, { value: { get: () => true  }, isTerminal: { get: () => true } })
BDD.False = Object.create(BDD.prototype, { value: { get: () => false }, isTerminal: { get: () => true } })

module.exports = BDD
