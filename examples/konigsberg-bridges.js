// Königsberg bridge problem: https://en.wikipedia.org/wiki/Seven_Bridges_of_K%C3%B6nigsberg

const { ROBDD } = require('reduced-ordered-binary-decision-diagrams')
const { CTL }   = require('computation-tree-logic')

const exceptIndex = (list, index) => {
  return list.slice(0, index).concat(list.slice(index+1))
}

let positions = []
let bridges = []
for(let i = 0; i < 4; i++) positions.push(CTL.variable())
for(let i = 0; i < 7; i++) bridges.push(CTL.variable())

let transition = ROBDD.orN([
  ROBDD.andN([ // crossing bridge 0 brings you from 0 to 1 or vice versa
    ROBDD.xor(...positions[0]), ROBDD.xor(...positions[1]), ROBDD.eql(...positions[2]), ROBDD.eql(...positions[3]),
    ROBDD.or(positions[0][0], positions[1][0]),
    ROBDD.not(bridges[0][0]), bridges[0][1],
    ROBDD.andN(exceptIndex(bridges, 0).map(bridge => ROBDD.eql(...bridge)))
  ]),
  ROBDD.andN([ // crossing bridge 1 brings you from 0 to 1 or vice versa
    ROBDD.xor(...positions[0]), ROBDD.xor(...positions[1]), ROBDD.eql(...positions[2]), ROBDD.eql(...positions[3]),
    ROBDD.or(positions[0][0], positions[1][0]),
    ROBDD.not(bridges[1][0]), bridges[1][1],
    ROBDD.andN(exceptIndex(bridges, 1).map(bridge => ROBDD.eql(...bridge)))
  ]),
  ROBDD.andN([ // crossing bridge 2 brings you from 1 to 2 or vice versa
    ROBDD.eql(...positions[0]), ROBDD.xor(...positions[1]), ROBDD.xor(...positions[2]), ROBDD.eql(...positions[3]),
    ROBDD.or(positions[1][0], positions[2][0]),
    ROBDD.not(bridges[2][0]), bridges[2][1],
    ROBDD.andN(exceptIndex(bridges, 2).map(bridge => ROBDD.eql(...bridge)))
  ]),
  ROBDD.andN([ // crossing bridge 3 brings you from 1 to 2 or vice versa
    ROBDD.eql(...positions[0]), ROBDD.xor(...positions[1]), ROBDD.xor(...positions[2]), ROBDD.eql(...positions[3]),
    ROBDD.or(positions[1][0], positions[2][0]),
    ROBDD.not(bridges[3][0]), bridges[3][1],
    ROBDD.andN(exceptIndex(bridges, 3).map(bridge => ROBDD.eql(...bridge)))
  ]),
  ROBDD.andN([ // crossing bridge 4 brings you from 0 to 3 or vice versa
    ROBDD.xor(...positions[0]), ROBDD.eql(...positions[1]), ROBDD.eql(...positions[2]), ROBDD.xor(...positions[3]),
    ROBDD.or(positions[0][0], positions[3][0]),
    ROBDD.not(bridges[4][0]), bridges[4][1],
    ROBDD.andN(exceptIndex(bridges, 4).map(bridge => ROBDD.eql(...bridge)))
  ]),
  ROBDD.andN([ // crossing bridge 5 brings you from 1 to 3 or vice versa
    ROBDD.eql(...positions[0]), ROBDD.xor(...positions[1]), ROBDD.eql(...positions[2]), ROBDD.xor(...positions[3]),
    ROBDD.or(positions[1][0], positions[3][0]),
    ROBDD.not(bridges[5][0]), bridges[5][1],
    ROBDD.andN(exceptIndex(bridges, 5).map(bridge => ROBDD.eql(...bridge)))
  ]),
  ROBDD.andN([ // crossing bridge 6 brings you from 2 to 3 or vice versa
    ROBDD.eql(...positions[0]), ROBDD.eql(...positions[1]), ROBDD.xor(...positions[2]), ROBDD.xor(...positions[3]),
    ROBDD.or(positions[2][0], positions[3][0]),
    ROBDD.not(bridges[6][0]), bridges[6][1],
    ROBDD.andN(exceptIndex(bridges, 6).map(bridge => ROBDD.eql(...bridge)))
  ])
])

// SANITY CHECK: if only a single position is set, only a single position will remain set
const single_position = ROBDD.and(
  ROBDD.orN(positions.map(position => position[0])),
  ROBDD.andN([0,1,2,3].map(i => ROBDD.imp(
    positions[i][0],
    ROBDD.andN(exceptIndex(positions, i).map(position => ROBDD.not(position[0])))
  )))
)
const one_position_at_a_time = ROBDD.imp(single_position, CTL.AG(single_position, transition)).isTautology
console.warn("Sanity check: only at one position at a time? ", one_position_at_a_time)

const starting_position = positions[0][0]
const every_bridge_used = ROBDD.andN(bridges.map(bridge => bridge[0]))

// Start at position 0, with no bridges used
let initial = ROBDD.andN([
  starting_position,
  ROBDD.andN(exceptIndex(positions, 0).map(position => ROBDD.not(position[0]))),
  ROBDD.andN(bridges.map(bridge => ROBDD.not(bridge[0])))
])
console.warn("Can we solve the puzzle? ", ROBDD.imp(initial, CTL.EF(ROBDD.and(starting_position, every_bridge_used), transition)).isTautology)

// Start at position 0, with bridges 0 and 6 used
initial = ROBDD.andN([
  starting_position,
  bridges[0][0], bridges[6][0],
  ROBDD.andN(exceptIndex(positions, 0).map(position => ROBDD.not(position[0]))),
  ROBDD.andN(bridges.slice(1,6).map(bridge => ROBDD.not(bridge[0])))
])
console.warn("Can we solve the puzzle, if we remove bridges 0 and 6? ", ROBDD.imp(initial, CTL.EF(ROBDD.and(starting_position, every_bridge_used), transition)).isTautology)
