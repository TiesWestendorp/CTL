const bdd = require('./bdd')
window.bdd = require('./bdd')
window.ctl = require('./ctl')
window.fair_ctl = require('./fair_ctl')
window.test = 1

const [a, _a] = window.ctl.variable()
const [b, _b] = window.ctl.variable()

const initial    = bdd.and(a,b)
const transition = bdd.and(bdd.not(bdd.eql(a, _a)), bdd.eql(b, _b))

console.warn("EF(b) =")
console.warn(bdd.and(initial, window.ctl.EF(b, transition)))
console.warn(bdd.and(initial, window.ctl.EF(b, transition)).isSatisfiable)

console.warn("EG(b) =")
console.warn(bdd.and(initial, window.ctl.EG(b, transition)))
console.warn(bdd.and(initial, window.ctl.EG(b, transition)).isSatisfiable)

console.warn("AG(b) = ")
console.warn(bdd.and(initial, window.ctl.AG(b, transition)))
console.warn(bdd.and(initial, window.ctl.AG(b, transition)).isSatisfiable)

console.warn(bdd.existsN(initial, [a._label, b._label]))
