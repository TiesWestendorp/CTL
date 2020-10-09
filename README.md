# computation-tree-logic: CTL for JS

This library offers a way to *verify CTL properties for given transition functions*. The transition function and states are represented by binary decision diagrams. Fairness conditions can be imposed.

<details>
  <summary>Computation tree logic (CTL)</summary>
  ```
  Computation tree logic (CTL) is a branching-time logic, meaning that its model of time is a tree-like structure in which the future is not determined; there are different paths in the future, any one of which might be an actual path that is realized. It is used in formal verification of software or hardware artifacts, typically by software applications known as model checkers which determine if a given artifact possesses safety or liveness properties. For example, CTL can specify that when some initial condition is satisfied (e.g., all program variables are positive or no cars on a highway straddle two lanes), then all possible executions of a program avoid some undesirable condition (e.g., dividing a number by zero or two cars colliding on a highway). In this example, the safety property could be verified by a model checker that explores all possible transitions out of program states satisfying the initial condition and ensures that all such executions satisfy the property. Computation tree logic is in a class of temporal logics that includes linear temporal logic (LTL). Although there are properties expressible only in CTL and properties expressible only in LTL, all properties expressible in either logic can also be expressed in CTL*."
  ```
</details>
<details>
  <summary>Binary decision diagrams (BDD)</summary>
  ```
  In computer science, a binary decision diagram (BDD) or branching program is a data structure that is used to represent a Boolean function. On a more abstract level, BDDs can be considered as a compressed representation of sets or relations. Unlike other compressed representations, operations are performed directly on the compressed representation, i.e. without decompression. Other data structures used to represent Boolean functions include negation normal form (NNF), Zhegalkin polynomials, and propositional directed acyclic graphs (PDAG).
  ```
</details>
~ Wikipedia, 09/10/2020 (https://en.wikipedia.org/wiki/Computation_tree_logic)
~ Wikipedia, 09/10/2020 (https://en.wikipedia.org/wiki/Binary_decision_diagram)

`
const bdd = require('binary-decision-diagrams')
const ctl = require('computation-tree-logic')

const [a, _a] = ctl.variable()
const [b, _b] = ctl.variable()

const initial    = bdd.and(a,b)
const transition = bdd.orN([
  bdd.andN([a,          b,          _a,          bdd.not(_b)]),
  bdd.andN([a,          bdd.not(b), bdd.not(_a), bdd.not(_b)]),
  bdd.andN([bdd.not(a), bdd.not(b), _a,          _b]),
  bdd.andN([bdd.not(a), b,          _a,          _b]),
])

// Prints the reachable states from the initial state
console.warn(ctl.reachable(initial, transition))

//
`

## Installation

All compositional statements ensure that the resulting BDD is an ROBDD (reduced and ordered).


Global pre- and post-condition: variable ordering is increasing

# Future
 - Parse CTL property from string
 - Witness and counterexample generation (Tree-like counterexample in model checking by Clarke et al)?
 - Partial transitions?
 - FORCE variable ordering?
