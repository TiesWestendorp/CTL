"use strict"

const bdd = require('./bdd.js')
const ctl = require('./ctl.js')

// fairness - a list of BDDs indicating a set of fairness constraints that should occur infinitly often
class FairCTL {
  static reset() {
    ctl.reset()
  }

  static EX(p, fairness, trans) {
    if (fairness.size == 0) return ctl.EX(p, trans)
    return bdd.andN(fairness.map(cond => ctl.EX(ctl.EU(p, bdd.and(p, cond), trans), trans)))
  }
  static EG(p, fairness, trans) { return ctl.gfp(u => bdd.and(p, FairCTL.EX(u, trans))) }
  static EF(p, fairness, trans) { return ctl.lfp(u => bdd.or(p,  FairCTL.EX(u, trans))) }
  static EU(p, q, trans) { return ctl.lfp(u => bdd.or(p, bdd.and(q, FairCTL.EX(u, trans)))) }
  static AX(p,    trans) { return bdd.not(FairCTL.EX(bdd.not(p), trans)) }
  static AG(p,    trans) { return ctl.gfp(u => bdd.and(p, FairCTL.AX(u, trans))) }
  static AF(p,    trans) { return ctl.lfp(u => bdd.or(p,  FairCTL.AX(u, trans))) }
  static AU(p, q, trans) { return ctl.lfp(u => bdd.or(p, bdd.and(q, FairCTL.AX(u, trans)))) }
}
FairCTL.reset()

module.exports = FairCTL
