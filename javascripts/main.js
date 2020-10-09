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
console.warn(window.ctl.reachable(initial, transition).numberOfSatisfyingAssignments(window.ctl.state.length))
//console.warn(transition)
//console.warn("AG(b) = ")
//console.warn(window.ctl.AG(b, transition))

//console.warn("EF(NOT (a OR b)) = ")
//console.warn(window.ctl.EF(bdd.not(bdd.or(a, b)), transition))

//console.warn(bdd.existsN(initial, [a._label, b._label]))
