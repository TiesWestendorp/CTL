const { ROBDD } = require('reduced-ordered-binary-decision-diagrams')

class CTL {
  static reset() {
    ROBDD.reset()
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
  static lfp(operation) { return CTL.fp(ROBDD.False, operation) } // least fixed-point
  static gfp(operation) { return CTL.fp(ROBDD.True,  operation) } // greatest fixed-point

  static variable() {
    let current, next
    CTL.variables.push(current = ROBDD.variable())
    CTL.variables.push(next = ROBDD.variable())
    CTL.state.push(CTL.mapNextToState[next._label] = current._label)
    CTL.nextState.push(CTL.mapStateToNext[current._label] = next._label)
    return [current, next]
  }

  static EX(p,    trans) { return ROBDD.existsN(ROBDD.and(trans, ROBDD.substitute(p, CTL.mapStateToNext)), CTL.nextState) }
  static EP(p,    trans) { return ROBDD.substitute(ROBDD.existsN(ROBDD.and(trans, p), CTL.state), CTL.mapNextToState) }
  static EG(p,    trans) { return CTL.gfp(u => ROBDD.and(p, CTL.EX(u, trans))) }
  static EF(p,    trans) { return CTL.lfp(u => ROBDDROBDD.or(p,  CTL.EX(u, trans))) }
  static EU(p, q, trans) { return CTL.lfp(u => ROBDD.or(p, ROBDD.and(q, CTL.EX(u, trans)))) }

  static AX(p,    trans) { return ROBDD.not(CTL.EX(ROBDD.not(p), trans)) }
  static AP(p,    trans) { return ROBDD.not(CTL.EP(ROBDD.not(p), trans)) }
  static AG(p,    trans) { return CTL.gfp(u => ROBDD.and(p, CTL.AX(u, trans))) }
  static AF(p,    trans) { return CTL.lfp(u => ROBDD.or(p,  CTL.AX(u, trans))) }
  static AU(p, q, trans) { return CTL.lfp(u => ROBDD.or(p, ROBDD.and(q, CTL.AX(u, trans)))) }

  static reachable(p, trans) { return CTL.lfp(u => ROBDD.or(p, CTL.EP(u, trans))) } // find all states reachable from p
  static source(trans)       { return CTL.AP(ROBDD.False, trans) } // find all states without transitions to them
  static deadlock(trans)     { return CTL.AX(ROBDD.False, trans) } // find all states without transitions from them
}
CTL.reset()

module.exports.CTL = CTL
