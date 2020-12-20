const { ROBDD } = require('reduced-ordered-binary-decision-diagrams')
const { CTL }   = require('./computation-tree-logic.js')

// fairness - a list of BDDs indicating a set of fairness constraints that should occur infinitely often
class FairCTL {
  static reset() {
    CTL.reset()
  }

  static EX(p, fairness, trans) {
    if (fairness.length == 0) return CTL.EX(p, trans)
    return bdd.andN(fairness.map(cond => CTL.EX(CTL.EU(p, bdd.and(p, cond), trans), trans)))
  }
  static EP(p, fairness, trans) {
    if (fairness.length == 0) return CTL.EP(p, trans)
    // TODO
  }
  static EG(p, fairness, trans) { return CTL.gfp(u => bdd.and(p, FairCTL.EX(u, fairness, trans))) }
  static EF(p, fairness, trans) { return CTL.lfp(u => bdd.or(p,  FairCTL.EX(u, fairness, trans))) }
  static EU(p, q, trans) { return CTL.lfp(u => bdd.or(p, bdd.and(q, FairCTL.EX(u, fairness, trans)))) }

  static AX(p,    trans) { return bdd.not(FairCTL.EX(bdd.not(p), fairness, trans)) }
  static AP(p,    trans) { return bdd.not(FairCTL.EP(bdd.not(p), fairness, trans)) }
  static AG(p,    trans) { return CTL.gfp(u => bdd.and(p, FairCTL.AX(u, fairness, trans))) }
  static AF(p,    trans) { return CTL.lfp(u => bdd.or(p,  FairCTL.AX(u, fairness, trans))) }
  static AU(p, q, trans) { return CTL.lfp(u => bdd.or(p, bdd.and(q, FairCTL.AX(u, fairness, trans)))) }
}
FairCTL.reset()

module.exports.FairCTL = FairCTL
