"use strict"

const bdd = require('./bdd.js')

//  - Witness and counterexample generation (Tree-like counterexample in model checking by Clarke et al)
//  - FORCE variable ordering
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

  static reachable(p, trans) { return CTL.lfp(u => bdd.or(p, CTL.EP(u, trans))) }
  static source(trans)       { return CTL.AP(bdd.False, trans) }
  static deadlock(trans)     { return CTL.AX(bdd.False, trans) }
}
CTL.reset()

module.exports = CTL
