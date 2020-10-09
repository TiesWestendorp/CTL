const bdd = require('./bdd')
window.bdd = bdd
window.ctl = require('./ctl')
window.fair_ctl = require('./fair_ctl')
window.test = 1

const [a, _a] = window.ctl.variable()
const [b, _b] = window.ctl.variable()

const initial    = bdd.and(a,b)
const transition = bdd.orN([
  bdd.andN([a, _a,          b,          bdd.not(_b)]),
  bdd.andN([a, bdd.not(_a), b,          _b]),
  bdd.andN([bdd.not(a), _a, bdd.not(b), bdd.not(_b)]),
])

//console.warn("EF(b) =")
//console.warn(bdd.and(initial, window.ctl.EF(b, transition)))

//console.warn("EG(b) =")
//console.warn(bdd.and(initial, window.ctl.EG(b, transition)))

console.warn(window.ctl.source(transition))
//console.warn(transition)
//console.warn("AG(b) = ")
//console.warn(window.ctl.AG(b, transition))

//console.warn("EF(NOT (a OR b)) = ")
//console.warn(window.ctl.EF(bdd.not(bdd.or(a, b)), transition))

//console.warn(bdd.existsN(initial, [a._label, b._label]))
