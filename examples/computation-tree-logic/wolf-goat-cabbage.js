const bdd = require('../../lib/binary-decision-diagrams')
const ctl = require('../../lib/computation-tree-logic')

let wolf    = ctl.variable()
let goat    = ctl.variable()
let cabbage = ctl.variable()
let self    = ctl.variable()

let transition = bdd.orN([
  bdd.andN([bdd.xor(...self),                                           bdd.eql(...wolf), bdd.eql(...goat), bdd.eql(...cabbage)]), // cross without taking anything
  bdd.andN([bdd.eql(self[0], wolf[0]),    bdd.eql(self[1], wolf[1]),    bdd.xor(...wolf), bdd.eql(...goat), bdd.eql(...cabbage)]), // take wolf to other side
  bdd.andN([bdd.eql(self[0], goat[0]),    bdd.eql(self[1], goat[1]),    bdd.eql(...wolf), bdd.xor(...goat), bdd.eql(...cabbage)]), // take goat to other side
  bdd.andN([bdd.eql(self[0], cabbage[0]), bdd.eql(self[1], cabbage[1]), bdd.eql(...wolf), bdd.eql(...goat), bdd.xor(...cabbage)]), // take cabbage to other side
])

const initial = bdd.andN([
  bdd.not(wolf[0]),
  bdd.not(goat[0]),
  bdd.not(cabbage[0]),
  bdd.not(self[0])
])

const alive = bdd.orN([
  bdd.eql(goat[0], self[0]),
  bdd.and(bdd.xor(wolf[0], goat[0]), bdd.xor(goat[0], cabbage[0]))
])
const done  = bdd.andN([wolf[0], goat[0], cabbage[0], self[0]])

console.warn("There is a way to solve the puzzle: ", bdd.and(initial, ctl.EU(alive, done, transition)).isSatisfiable)
