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
