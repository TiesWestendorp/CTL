"use strict"

// All compositional statements ensure that the resulting BDD is an ROBDD (reduced and ordered).
// TODO: asynchronous calls of multiargument operations
// Global pre- and post-condition: variable ordering is increasing
class BDD {
  constructor(_label, _then, _else) {
    this._label = _label
    this._then  = _then
    this._else  = _else
  }

  get isTerminal()    { return false }
  get isSatisfiable() { return this !== BDD.False }
  get isTautology()   { return this === BDD.True  }

  static reset() {
    BDD.cache = {}
    BDD.vars  = 0
  }

  static variable() { return BDD.get(BDD.vars++, BDD.True, BDD.False) }

  static get(_label, _then, _else) {
    if (_then === _else) {
      return _then
    }
    let bdd
    // TODO: OBTAIN A LOCK
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
    // TODO: RELEASE LOCK
    return bdd
  }

  static noCacheNot(A) {
    if (A === BDD.True)  return BDD.False
    if (A === BDD.False) return BDD.True
    return new BDD(A._label, BDD.noCacheNot(A._then), BDD.noCacheNot(A._else))
  }

  static not(A) {
    if (A === BDD.True)  return BDD.False
    if (A === BDD.False) return BDD.True
    return BDD.get(A._label, BDD.not(A._then), BDD.not(A._else))
  }

  // Precondition: forall key in mapping: mapping[key] > key
  static substitute(A, mapping) {
    if (A === BDD.True)  return BDD.True
    if (A === BDD.False) return BDD.False
    return BDD.get(mapping[A._label], BDD.substitute(A._then, mapping), BDD.substitute(A._else, mapping))
  }

  static exists(A, label) {
    if (A.isTerminal)  return A
    if (A._label === label) {
      return BDD.or(A._then, A._else)
    } else if (A._label < label) {
      return BDD.get(A._label, BDD.exists(A._then, label), BDD.exists(A._else, label))
    } else {
      return A
    }
  }

  static forall(A, label) {
    if (A.isTerminal)  return A
    if (A._label === label) {
      return BDD.and(A._then, A._else)
    } else if (A._label < label) {
      return BDD.get(A._label, BDD.forall(A._then, label), BDD.forall(A._else, label))
    } else {
      return A
    }
  }

  static conditional(A, _then, _else) {
    if (A === BDD.True)       return _then
    if (A === BDD.False)      return _else
    if (_then === _else)      return _then
    if (A === _then)          return BDD.conditional(A, BDD.True, _else)
    if (A === _else)          return BDD.conditional(A, _then, BDD.False)
    if (A === BDD.not(_then)) return BDD.conditional(A, BDD.False, _else)
    if (A === BDD.not(_else)) return BDD.conditional(A, _then, BDD.True)
    if (_then.isTerminal() && _else.isTerminal()) {
      return (_then === BDD.True) ? A : BDD.not(A)
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

  // Precondition: labels sorted
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

  // Precondition: labels sorted
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

  static _existsN(A, labels) {
    // TODO: optimize!
    let result = A
    for(let i = 0; i < labels.length; i++) {
      result = BDD.exists(result, labels[i])
    }
    return result
  }

  static _forallN(A, labels) {
    // TODO: optimize!
    let result = A
    for(let i = 0; i < labels.length; i++) {
      result = BDD.forall(result, labels[i])
    }
    return result
  }
}

BDD.reset()
BDD.True  = Object.create(BDD.prototype, { value: { get: () => true  }, isTerminal: { get: () => true } })
BDD.False = Object.create(BDD.prototype, { value: { get: () => false }, isTerminal: { get: () => true } })

module.exports = BDD
