// Dining philosophers problem: https://en.wikipedia.org/wiki/Dining_philosophers_problem

const { ROBDD } = require('reduced-ordered-binary-decision-diagrams')
const { CTL }   = require('computation-tree-logic')

const n = 3

let indices = []
let left_utensils = []
let right_utensils = []
let eating = []
for(let i = 0; i < n; i++) {
  indices.push(i)
  left_utensils.push(CTL.variable())  // philosopher i has left utensil
  right_utensils.push(CTL.variable()) // philosopher i has right utensil
  eating.push(CTL.variable())         // philosopher i is eating
}

let transitions = []
for(let i = 0; i < n; i++) {
  let indices_except_i = []
  for(let j = 0; j < n; j++) {
    if (j !== i) indices_except_i.push(j)
  }

  const left_philosopher  = (i+1)%n
  const right_philosopher = (i+n-1)%n

  // if possible, philosopher i grabs left utensil
  transitions.push(ROBDD.andN([
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...left_utensils[j]))),
    ROBDD.andN(         indices.map(j => ROBDD.eql(...right_utensils[j]))),
    ROBDD.andN(         indices.map(j => ROBDD.eql(...eating[j]))),
    ROBDD.not(left_utensils[i][0]), ROBDD.not(right_utensils[left_philosopher][0]),
    left_utensils[i][1]
  ]))

  // if possible, philosopher i grabs right utensil
  transitions.push(ROBDD.andN([
    ROBDD.andN(         indices.map(j => ROBDD.eql(...left_utensils[j]))),
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...right_utensils[j]))),
    ROBDD.andN(         indices.map(j => ROBDD.eql(...eating[j]))),
    ROBDD.not(right_utensils[i][0]), ROBDD.not(left_utensils[right_philosopher][0]),
    right_utensils[i][1]
  ]))

  // if philosopher i has both utensils, start eating
  transitions.push(ROBDD.andN([
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...left_utensils[j]))),
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...right_utensils[j]))),
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...eating[j]))),
    ROBDD.and(...left_utensils[i]),
    ROBDD.and(...right_utensils[i]),
    ROBDD.not(eating[i][0]), eating[i][1]
  ]))

  // if philosopher i is eating, he may finish eating and return utensils
  transitions.push(ROBDD.andN([
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...left_utensils[j]))),
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...right_utensils[j]))),
    ROBDD.andN(indices_except_i.map(j => ROBDD.eql(...eating[j]))),
    left_utensils[i][0],            right_utensils[i][0],            eating[i][0],
    ROBDD.not(left_utensils[i][1]), ROBDD.not(right_utensils[i][1]), ROBDD.not(eating[i][1])
  ]))
}

const initial = ROBDD.andN([
  ROBDD.andN(indices.map(i => ROBDD.not(left_utensils[i][0]))),
  ROBDD.andN(indices.map(i => ROBDD.not(right_utensils[i][0]))),
  ROBDD.andN(indices.map(i => ROBDD.not(eating[i][0]))),
])
const transition = ROBDD.orN(transitions)
const fairness = indices.map(i => eating[i][0])

const reachable = CTL.reachable(initial, transition)
const deadlocks = CTL.deadlock(transition)
const reachable_deadlocks = ROBDD.and(reachable, deadlocks)

console.warn("Number of reachable states:",    reachable.numberOfSatisfyingAssignments(3*n))
console.warn("Number of reachable deadlocks:", reachable_deadlocks.numberOfSatisfyingAssignments(3*n))
console.warn("Does there exist a loop that avoids deadlocks?", ROBDD.imp(initial, CTL.EG(ROBDD.not(deadlocks), transition)).isTautology)
