// Wolf, goat and cabbage problem: https://en.wikipedia.org/wiki/Wolf,_goat_and_cabbage_problem

const { ROBDD } = require('reduced-ordered-binary-decision-diagrams')
const { CTL }   = require('computation-tree-logic')

const wolf    = CTL.variable()
const goat    = CTL.variable()
const cabbage = CTL.variable()
const self    = CTL.variable()

const transition = ROBDD.orN([
  ROBDD.andN([ROBDD.xor(...self),                                           ROBDD.eql(...wolf), ROBDD.eql(...goat), ROBDD.eql(...cabbage)]), // cross without taking anything
  ROBDD.andN([ROBDD.eql(self[0], wolf[0]),    ROBDD.eql(self[1], wolf[1]),    ROBDD.xor(...wolf), ROBDD.eql(...goat), ROBDD.eql(...cabbage)]), // take wolf to other side
  ROBDD.andN([ROBDD.eql(self[0], goat[0]),    ROBDD.eql(self[1], goat[1]),    ROBDD.eql(...wolf), ROBDD.xor(...goat), ROBDD.eql(...cabbage)]), // take goat to other side
  ROBDD.andN([ROBDD.eql(self[0], cabbage[0]), ROBDD.eql(self[1], cabbage[1]), ROBDD.eql(...wolf), ROBDD.eql(...goat), ROBDD.xor(...cabbage)]), // take cabbage to other side
])

const initial = ROBDD.andN([
  ROBDD.not(wolf[0]),
  ROBDD.not(goat[0]),
  ROBDD.not(cabbage[0]),
  ROBDD.not(self[0])
])

const alive = ROBDD.or(
  ROBDD.eql(goat[0], self[0]),
  ROBDD.and(ROBDD.xor(wolf[0], goat[0]), ROBDD.xor(goat[0], cabbage[0]))
)
const done  = ROBDD.andN([wolf[0], goat[0], cabbage[0], self[0]])

const losable  = ROBDD.imp(initial, CTL.EF(ROBDD.not(alive), transition)).isTautology
const solvable = ROBDD.imp(initial, CTL.EU(alive, done, transition)).isTautology

console.warn("There is a way to lose:", losable)
console.warn("There is a way to solve the puzzle:", solvable)
