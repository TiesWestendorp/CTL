const bdd = require('./binary-decision-diagrams.js')
const ctl = require('./computation-tree-logic.js')

// fairness - a list of BDDs indicating a set of fairness constraints that should occur infinitely often
class FairCTL {
  static reset() {
    ctl.reset()
  }

  static EX(p, fairness, trans) {
    if (fairness.length == 0) return ctl.EX(p, trans)
    return bdd.andN(fairness.map(cond => ctl.EX(ctl.EU(p, bdd.and(p, cond), trans), trans)))
  }
  static EP(p, fairness, trans) {
    if (fairness.length == 0) return ctl.EP(p, trans)
    // TODO
  }
  static EG(p, fairness, trans) { return ctl.gfp(u => bdd.and(p, FairCTL.EX(u, fairness, trans))) }
  static EF(p, fairness, trans) { return ctl.lfp(u => bdd.or(p,  FairCTL.EX(u, fairness, trans))) }
  static EU(p, q, trans) { return ctl.lfp(u => bdd.or(p, bdd.and(q, FairCTL.EX(u, fairness, trans)))) }

  static AX(p,    trans) { return bdd.not(FairCTL.EX(bdd.not(p), fairness, trans)) }
  static AP(p,    trans) { return bdd.not(FairCTL.EP(bdd.not(p), fairness, trans)) }
  static AG(p,    trans) { return ctl.gfp(u => bdd.and(p, FairCTL.AX(u, fairness, trans))) }
  static AF(p,    trans) { return ctl.lfp(u => bdd.or(p,  FairCTL.AX(u, fairness, trans))) }
  static AU(p, q, trans) { return ctl.lfp(u => bdd.or(p, bdd.and(q, FairCTL.AX(u, fairness, trans)))) }
}
FairCTL.reset()

module.exports = FairCTL
