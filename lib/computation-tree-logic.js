const bdd = require('./binary-decision-diagrams.js')

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
    let current, next
    CTL.variables.push(current = bdd.variable())
    CTL.variables.push(next = bdd.variable())
    CTL.state.push(CTL.mapNextToState[next._label] = current._label)
    CTL.nextState.push(CTL.mapStateToNext[current._label] = next._label)
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
