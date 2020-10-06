(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict"

// All compositional statements ensure that the resulting BDD is an ROBDD (reduced and ordered).
// TODO: asynchronous calls of multiargument operations
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

  // Substitute may violate ROBDD invariant if mapping is not increasing
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

  static existsN(A, labels) {
    // TODO: optimize!
    let result = A
    for(let i = 0; i < labels.length; i++) {
      result = BDD.exists(result, labels[i])
    }
    return result
  }

  static forallN(A, labels) {
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

},{}],2:[function(require,module,exports){
"use strict"

const bdd = require('./bdd.js')

// TODO:
//  - Witness and counterexample generation (Tree-like counterexample in model checking by Clarke et al)
//  - Optimize n-ary exists (should require only one pass)
//  - Substitute can mess-up variable ordering!
//  - Implement other boolean operators (xor, nor, nand, nxor, etc)
//  - FORCE variable ordering
//  - Parallelized computation
class CTL {
  static reset() {
    bdd.reset()
    CTL.state          = []
    CTL.nextState      = []
    CTL.mapStateToNext = {}
  }

  static fp(initial, operation) {
    let current = initial
    let previous
    while (current != previous) {
      previous = current
      current = operation(current)
    }
    return current
  }
  static lfp(operation) { return CTL.fp(bdd.False, operation) }
  static gfp(operation) { return CTL.fp(bdd.True,  operation) }

  static variable() {
    let [current, next] = [bdd.variable(), bdd.variable()]
    CTL.state.push(current._label)
    CTL.nextState.push(next._label)
    CTL.mapStateToNext[current._label] = next._label
    return [current, next]
  }

  static AX(p,    trans) { return bdd.forallN(bdd.and(trans, bdd.substitute(p, CTL.mapStateToNext)), CTL.nextState) }
  static AG(p,    trans) { return CTL.gfp(u => bdd.and(p, CTL.AX(u, trans))) }
  static AF(p,    trans) { return CTL.lfp(u => bdd.or(p,  CTL.AX(u, trans))) }
  static AU(p, q, trans) { return CTL.lfp(u => bdd.or(p, bdd.and(q, CTL.AX(u, trans)))) }
  static EX(p,    trans) { return bdd.existsN(bdd.and(trans, bdd.substitute(p, CTL.mapStateToNext)), CTL.nextState) }
  static EG(p,    trans) { return CTL.gfp(u => bdd.and(p, CTL.EX(u, trans))) }
  static EF(p,    trans) { return CTL.lfp(u => bdd.or(p,  CTL.EX(u, trans))) }
  static EU(p, q, trans) { return CTL.lfp(u => bdd.or(p, bdd.and(q, CTL.EX(u, trans)))) }
}
CTL.reset()

module.exports = CTL

},{"./bdd.js":1}],3:[function(require,module,exports){
"use strict"

const bdd = require('./bdd.js')
const ctl = require('./ctl.js')

class FairCTL {
  static reset() {
    ctl.reset()
  }

  static EG(p, r, fairness, trans) { return ctl.fp(r, u => bdd.and(p, CTL.EX(CTL.EU(p, bdd.and(u, fairness), trans), trans))) }
  static EU(p1, p2, r, fairness, trans) {}
  static EX(p, r, fairness, trans) {}
  static EF(p, r, fairness, trans) {}
}
FairCTL.reset()

module.exports = FairCTL

// static BDD BddFairEU(BDD b1, BDD b2, BDD r, BDD F, andl_context_t* andl_context) {
//     LACE_ME;
//     BDD fair = BddFairEG(sylvan_true, r, F, andl_context);
//     return BddEU(b1, sylvan_and(b2, fair), andl_context);
// }
//
// static BDD BddFairEX(BDD b, BDD r, BDD F, andl_context_t* andl_context) {
// 	LACE_ME;
//     BDD fair = BddFairEG(sylvan_true, r, F, andl_context);
//     return BddEX(sylvan_and(b, fair), andl_context);
// }
//
// static BDD BddFairEF(BDD b, BDD r, BDD F, andl_context_t* andl_context) {
// 	LACE_ME;
//     BDD fair = BddFairEG(sylvan_true, r, F, andl_context);
//     return BddEF(sylvan_and(b, fair), andl_context);
// }

},{"./bdd.js":1,"./ctl.js":2}],4:[function(require,module,exports){
const bdd = require('./bdd')
window.bdd = require('./bdd')
window.ctl = require('./ctl')
window.fair_ctl = require('./fair_ctl')
window.test = 1

const [a, _a] = window.ctl.variable()
const [b, _b] = window.ctl.variable()

const initial    = bdd.and(a,b)
const transition = bdd.and(bdd.not(bdd.eql(a, _a)), bdd.eql(b, _b))

console.warn("EF(b) =")
console.warn(bdd.and(initial, window.ctl.EF(b, transition)))
console.warn(bdd.and(initial, window.ctl.EF(b, transition)).isSatisfiable)

console.warn("EG(b) =")
console.warn(bdd.and(initial, window.ctl.EG(b, transition)))
console.warn(bdd.and(initial, window.ctl.EG(b, transition)).isSatisfiable)

console.warn("AG(b) = ")
console.warn(bdd.and(initial, window.ctl.AG(b, transition)))
console.warn(bdd.and(initial, window.ctl.AG(b, transition)).isSatisfiable)

console.warn(bdd.existsN(initial, [a._label, b._label]))

},{"./bdd":1,"./ctl":2,"./fair_ctl":3}]},{},[4]);
