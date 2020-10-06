"use strict"

const bdd = require('./bdd.js')

// TODO:
//  - Witness and counterexample generation (Tree-like counterexample in model checking by Clarke et al)
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
