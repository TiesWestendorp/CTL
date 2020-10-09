(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict"

// All compositional statements ensure that the resulting BDD is an ROBDD (reduced and ordered).

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
   * n-nary boolean operations
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

},{}],2:[function(require,module,exports){
"use strict"

const bdd = require('./bdd.js')

class CTL {
  static reset() {
    bdd.reset()
    CTL.state          = []
    CTL.nextState      = []
    CTL.mapStateToNext = {}
    CTL.mapNextToState = {}
    CTL.variables      = []
  }

  static fp(initial, operation) {
    let [previous, current] = [undefined, initial]
    while (current != previous) [previous, current] = [current, operation(current)]
    return current
  }
  static lfp(operation) { return CTL.fp(bdd.False, operation) } // least fixed-point
  static gfp(operation) { return CTL.fp(bdd.True,  operation) } // greatest fixed-point

  static variable() {
    let [current, next] = [bdd.variable(), bdd.variable()]
    CTL.state.push(current._label)
    CTL.nextState.push(next._label)
    CTL.mapStateToNext[current._label] = next._label
    CTL.mapNextToState[next._label] = current._label
    CTL.variables.push(current)
    CTL.variables.push(next)
    return [current, next]
  }

  static EX(p,    trans) { return bdd.existsN(bdd.and(trans, bdd.substitute(p, CTL.mapStateToNext)), CTL.nextState) }
  static EP(p,    trans) { return bdd.substitute(bdd.existsN(bdd.and(trans, p), CTL.state), CTL.mapNextToState) }
  static EG(p,    trans) { return CTL.gfp(u => bdd.and(p, CTL.EX(u, trans))) }
  static EF(p,    trans) { return CTL.lfp(u => bdd.or(p,  CTL.EX(u, trans))) }
  static EU(p, q, trans) { return CTL.lfp(u => bdd.or(p, bdd.and(q, CTL.EX(u, trans)))) }

  static AX(p,    trans) { return bdd.not(CTL.EX(bdd.not(p), trans)) }
  static AP(p,    trans) { return bdd.not(CTL.EP(bdd.not(p), trans)) }
  static AG(p,    trans) { return CTL.gfp(u => bdd.and(p, CTL.AX(u, trans))) }
  static AF(p,    trans) { return CTL.lfp(u => bdd.or(p,  CTL.AX(u, trans))) }
  static AU(p, q, trans) { return CTL.lfp(u => bdd.or(p, bdd.and(q, CTL.AX(u, trans)))) }

  static reachable(p, trans) { return CTL.lfp(u => bdd.or(p, CTL.EP(u, trans))) } // find all states reachable from p
  static source(trans)       { return CTL.AP(bdd.False, trans) } // find all states without transitions to them
  static deadlock(trans)     { return CTL.AX(bdd.False, trans) } // find all states without transitions from them
}
CTL.reset()

module.exports = CTL

},{"./bdd.js":1}],3:[function(require,module,exports){
"use strict"

const bdd = require('./bdd.js')
const ctl = require('./ctl.js')

// fairness - a list of BDDs indicating a set of fairness constraints that should occur infinitly often
class FairCTL {
  static reset() {
    ctl.reset()
  }

  static EX(p, fairness, trans) {
    if (fairness.length == 0) return ctl.EX(p, trans)
    return bdd.andN(fairness.map(cond => ctl.EX(ctl.EU(p, bdd.and(p, cond), trans), trans)))
  }
  static EG(p, fairness, trans) { return ctl.gfp(u => bdd.and(p, FairCTL.EX(u, fairness, trans))) }
  static EF(p, fairness, trans) { return ctl.lfp(u => bdd.or(p,  FairCTL.EX(u, fairness, trans))) }
  static EU(p, q, trans) { return ctl.lfp(u => bdd.or(p, bdd.and(q, FairCTL.EX(u, fairness, trans)))) }
  static AX(p,    trans) { return bdd.not(FairCTL.EX(bdd.not(p), fairness, trans)) }
  static AG(p,    trans) { return ctl.gfp(u => bdd.and(p, FairCTL.AX(u, fairness, trans))) }
  static AF(p,    trans) { return ctl.lfp(u => bdd.or(p,  FairCTL.AX(u, fairness, trans))) }
  static AU(p, q, trans) { return ctl.lfp(u => bdd.or(p, bdd.and(q, FairCTL.AX(u, fairness, trans)))) }
}
FairCTL.reset()

module.exports = FairCTL

},{"./bdd.js":1,"./ctl.js":2}],4:[function(require,module,exports){
const bdd = require('./bdd')
window.bdd = bdd
window.ctl = require('./ctl')
window.fair_ctl = require('./fair_ctl')
window.test = 1

const [a, _a] = window.ctl.variable()
const [b, _b] = window.ctl.variable()

const initial    = bdd.and(a,b)
const transition = bdd.orN([
  bdd.andN([a,          b,          _a,          bdd.not(_b)]),
  bdd.andN([a,          bdd.not(b), bdd.not(_a), bdd.not(_b)]),
  bdd.andN([bdd.not(a), bdd.not(b), _a,          _b]),
  bdd.andN([bdd.not(a), b,          _a,  _b]),
])

//console.warn("EF(b) =")
//console.warn(bdd.and(initial, window.ctl.EF(b, transition)))

//console.warn("EG(b) =")
//console.warn(bdd.and(initial, window.ctl.EG(b, transition)))

console.warn(window.ctl.source(transition).numberOfSatisfyingAssignments(window.ctl.state.length))
console.warn(window.ctl.deadlock(transition).numberOfSatisfyingAssignments(window.ctl.state.length))
console.warn(window.ctl.reachable(window.ctl.source(transition), transition).numberOfSatisfyingAssignments(window.ctl.state.length))
//console.warn(transition)
//console.warn("AG(b) = ")
//console.warn(window.ctl.AG(b, transition))

//console.warn("EF(NOT (a OR b)) = ")
//console.warn(window.ctl.EF(bdd.not(bdd.or(a, b)), transition))

//console.warn(bdd.existsN(initial, [a._label, b._label]))

},{"./bdd":1,"./ctl":2,"./fair_ctl":3}]},{},[4]);
