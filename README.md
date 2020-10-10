# computation-tree-logic: CTL for JS

This library offers a way to *verify CTL properties for given transition functions*. The transition function and states are represented by *binary decision diagrams*. *Fairness conditions* can be imposed.

The satisfying states of the CTL property are computed via fixed-point computations.

The binary decision diagram is internally guaranteed to be *reduced* and *ordered*. The variable ordering is determined on instantiation.

<details>
  <summary>Binary decision diagrams (BDD)</summary>
  <ol>
    In <a href="https://en.wikipedia.org/wiki/Computer_science">computer science</a>, a <b>binary decision diagram</b> (<b>BDD</b>) or <b>branching program</b> is a <a href="https://en.wikipedia.org/wiki/Data_structure">data structure</a> that is used to represent a <a href="https://en.wikipedia.org/wiki/Boolean_function">Boolean function</a>. On a more abstract level, BDDs can be considered as a <a href="https://en.wikipedia.org/wiki/Data_compression">compressed</a> representation of <a href="https://en.wikipedia.org/wiki/Set_(mathematics)">sets</a> or <a href="https://en.wikipedia.org/wiki/Relation_(mathematics)">relations</a>. Unlike other compressed representations, operations are performed directly on the compressed representation, i.e. without decompression. Other <a href="https://en.wikipedia.org/wiki/Data_structure">data structures</a> used to represent <a href="https://en.wikipedia.org/wiki/Boolean_function">Boolean functions</a> include <a href="https://en.wikipedia.org/wiki/Negation_normal_form">negation normal form</a> (NNF), <a href="https://en.wikipedia.org/wiki/Zhegalkin_polynomial">Zhegalkin polynomials</a>, and <a href="https://en.wikipedia.org/wiki/Propositional_directed_acyclic_graph">propositional directed acyclic graphs</a> (PDAG).
    ~ <a href="https://en.wikipedia.org/wiki/Binary_decision_diagram">Wikipedia</a>, 09/10/2020
  </ol>
</details>
<details>
  <summary>Computation tree logic (CTL)</summary>
  <ol>
    <b>Computation tree logic</b> (<b>CTL</b>) is a branching-time <a href="https://en.wikipedia.org/wiki/Mathematical_logic">logic</a>, meaning that its model of time is a tree-like structure in which the future is not determined; there are different paths in the future, any one of which might be an actual path that is realized. It is used in <a href="https://en.wikipedia.org/wiki/Formal_verification">formal verification</a> of software or hardware artifacts, typically by software applications known as <a href="https://en.wikipedia.org/wiki/Model_checker">model checkers</a> which determine if a given artifact possesses <a href="https://en.wikipedia.org/wiki/Safety_(distributed_computing)">safety</a> or <a href="https://en.wikipedia.org/wiki/Liveness">liveness</a> properties. For example, CTL can specify that when some initial condition is satisfied (e.g., all program variables are positive or no cars on a highway straddle two lanes), then all possible executions of a program avoid some undesirable condition (e.g., dividing a number by zero or two cars colliding on a highway). In this example, the safety property could be verified by a model checker that explores all possible transitions out of program states satisfying the initial condition and ensures that all such executions satisfy the property. Computation tree logic is in a class of <a href="https://en.wikipedia.org/wiki/Temporal_logic">temporal logics</a> that includes <a href="https://en.wikipedia.org/wiki/Linear_temporal_logic">linear temporal logic</a> (LTL). Although there are properties expressible only in CTL and properties expressible only in LTL, all properties expressible in either logic can also be expressed in <a href="https://en.wikipedia.org/wiki/CTL*">CTL*</a>.
    ~ <a href="https://en.wikipedia.org/wiki/Computation_tree_logic">Wikipedia</a>, 09/10/2020
  </ol>
</details>
<details>
  <summary>Fair computation tree logic</summary>
  <ol>
    <b>Fair computational tree logic</b> is conventional <a href="https://en.wikipedia.org/wiki/Computational_tree_logic">computational tree logic</a> studied with explicit fairness constraints.
    ~ <a href="https://en.wikipedia.org/wiki/Fair_computational_tree_logic">Wikipedia</a>, 09/10/2020
  </ol>
</details>


## Installation

## Example

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

## Future plans
 - Parse CTL property from string
 - Witness and counterexample generation (Tree-like counterexample in model checking by Clarke et al)?
 - Partial transitions?
 - FORCE variable ordering?
