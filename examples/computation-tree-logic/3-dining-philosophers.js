// Dining philosophers problem: https://en.wikipedia.org/wiki/Dining_philosophers_problem

const bdd = require('../../lib/binary-decision-diagrams')
const ctl = require('../../lib/computation-tree-logic')

const n = 3

let indices = []
let left_utensils = []
let right_utensils = []
let eating = []
for(let i = 0; i < n; i++) {
  indices.push(i)
  left_utensils.push(ctl.variable())  // philosopher i has left utensil
  right_utensils.push(ctl.variable()) // philosopher i has right utensil
  eating.push(ctl.variable())         // philosopher i is eating
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
  transitions.push(bdd.andN([
    bdd.andN(indices_except_i.map(j => bdd.eql(...left_utensils[j]))),
    bdd.andN(         indices.map(j => bdd.eql(...right_utensils[j]))),
    bdd.andN(         indices.map(j => bdd.eql(...eating[j]))),
    bdd.not(left_utensils[i][0]), bdd.not(right_utensils[left_philosopher][0]),
    left_utensils[i][1]
  ]))

  // if possible, philosopher i grabs right utensil
  transitions.push(bdd.andN([
    bdd.andN(         indices.map(j => bdd.eql(...left_utensils[j]))),
    bdd.andN(indices_except_i.map(j => bdd.eql(...right_utensils[j]))),
    bdd.andN(         indices.map(j => bdd.eql(...eating[j]))),
    bdd.not(right_utensils[i][0]), bdd.not(left_utensils[right_philosopher][0]),
    right_utensils[i][1]
  ]))

  // if philosopher i has both utensils, start eating
  transitions.push(bdd.andN([
    bdd.andN(indices_except_i.map(j => bdd.eql(...left_utensils[j]))),
    bdd.andN(indices_except_i.map(j => bdd.eql(...right_utensils[j]))),
    bdd.andN(indices_except_i.map(j => bdd.eql(...eating[j]))),
    bdd.and(...left_utensils[i]),
    bdd.and(...right_utensils[i]),
    bdd.not(eating[i][0]), eating[i][1]
  ]))

  // if philosopher i is eating, he may finish eating and return utensils
  transitions.push(bdd.andN([
    bdd.andN(indices_except_i.map(j => bdd.eql(...left_utensils[j]))),
    bdd.andN(indices_except_i.map(j => bdd.eql(...right_utensils[j]))),
    bdd.andN(indices_except_i.map(j => bdd.eql(...eating[j]))),
    left_utensils[i][0],          right_utensils[i][0],          eating[i][0],
    bdd.not(left_utensils[i][1]), bdd.not(right_utensils[i][1]), bdd.not(eating[i][1])
  ]))
}

const initial = bdd.andN([
  bdd.andN(indices.map(i => bdd.not(left_utensils[i][0]))),
  bdd.andN(indices.map(i => bdd.not(right_utensils[i][0]))),
  bdd.andN(indices.map(i => bdd.not(eating[i][0]))),
])
const transition = bdd.orN(transitions)
const fairness = indices.map(i => eating[i][0])

const reachable = ctl.reachable(initial, transition)
const deadlocks = ctl.deadlock(transition)
const reachable_deadlocks = bdd.and(reachable, deadlocks)

console.warn("Number of reachable states:",    reachable.numberOfSatisfyingAssignments(3*n))
console.warn("Number of reachable deadlocks:", reachable_deadlocks.numberOfSatisfyingAssignments(3*n))
console.warn("Does there exist a loop that avoids deadlocks?", bdd.imp(initial, ctl.EG(bdd.not(deadlocks), transition)).isTautology)
