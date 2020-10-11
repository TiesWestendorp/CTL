// Königsberg bridge problem: https://en.wikipedia.org/wiki/Seven_Bridges_of_K%C3%B6nigsberg

const bdd = require('../../lib/binary-decision-diagrams')
const ctl = require('../../lib/computation-tree-logic')

const exceptIndex = (list, index) => {
  return list.slice(0, index).concat(list.slice(index+1))
}

let positions = []
let bridges = []
for(let i = 0; i < 4; i++) positions.push(ctl.variable())
for(let i = 0; i < 7; i++) bridges.push(ctl.variable())

let transition = bdd.orN([
  bdd.andN([ // crossing bridge 0
    bdd.xor(...positions[0]), bdd.xor(...positions[1]), bdd.eql(...positions[2]), bdd.eql(...positions[3]),
    bdd.or(positions[0][0], positions[1][0]),
    bdd.not(bridges[0][0]), bridges[0][1],
    bdd.andN(exceptIndex(bridges, 0).map(bridge => bdd.eql(...bridge)))
  ]),
  bdd.andN([ // crossing bridge 1
    bdd.xor(...positions[0]), bdd.xor(...positions[1]), bdd.eql(...positions[2]), bdd.eql(...positions[3]),
    bdd.or(positions[0][0], positions[1][0]),
    bdd.not(bridges[1][0]), bridges[1][1],
    bdd.andN(exceptIndex(bridges, 1).map(bridge => bdd.eql(...bridge)))
  ]),
  bdd.andN([ // crossing bridge 2
    bdd.eql(...positions[0]), bdd.xor(...positions[1]), bdd.xor(...positions[2]), bdd.eql(...positions[3]),
    bdd.or(positions[1][0], positions[2][0]),
    bdd.not(bridges[2][0]), bridges[2][1],
    bdd.andN(exceptIndex(bridges, 2).map(bridge => bdd.eql(...bridge)))
  ]),
  bdd.andN([ // crossing bridge 3
    bdd.eql(...positions[0]), bdd.xor(...positions[1]), bdd.xor(...positions[2]), bdd.eql(...positions[3]),
    bdd.or(positions[1][0], positions[2][0]),
    bdd.not(bridges[3][0]), bridges[3][1],
    bdd.andN(exceptIndex(bridges, 3).map(bridge => bdd.eql(...bridge)))
  ]),
  bdd.andN([ // crossing bridge 4
    bdd.xor(...positions[0]), bdd.eql(...positions[1]), bdd.eql(...positions[2]), bdd.xor(...positions[3]),
    bdd.or(positions[0][0], positions[3][0]),
    bdd.not(bridges[4][0]), bridges[4][1],
    bdd.andN(exceptIndex(bridges, 4).map(bridge => bdd.eql(...bridge)))
  ]),
  bdd.andN([ // crossing bridge 5
    bdd.eql(...positions[0]), bdd.xor(...positions[1]), bdd.eql(...positions[2]), bdd.xor(...positions[3]),
    bdd.or(positions[1][0], positions[3][0]),
    bdd.not(bridges[5][0]), bridges[5][1],
    bdd.andN(exceptIndex(bridges, 5).map(bridge => bdd.eql(...bridge)))
  ]),
  bdd.andN([ // crossing bridge 6
    bdd.eql(...positions[0]), bdd.eql(...positions[1]), bdd.xor(...positions[2]), bdd.xor(...positions[3]),
    bdd.or(positions[2][0], positions[3][0]),
    bdd.not(bridges[6][0]), bridges[6][1],
    bdd.andN(exceptIndex(bridges, 6).map(bridge => bdd.eql(...bridge)))
  ])
])

// SANITY CHECK: if only a single position is set, only a single position will remain set
const single_position = bdd.and(
  bdd.orN(positions.map(position => position[0])),
  bdd.andN([0,1,2,3].map(i => bdd.imp(
    positions[i][0],
    bdd.andN(exceptIndex(positions, i).map(position => bdd.not(position[0])))
  )))
)
const one_position_at_a_time = bdd.imp(single_position, ctl.AG(single_position, transition)).isTautology
console.warn("Sanity check: only at one position at a time? ", one_position_at_a_time)


const starting_position = positions[0][0]
const every_bridge_used = bdd.andN(bridges.map(bridge => bridge[0]))

// Start at position 0, with no bridges used
let initial = bdd.andN([
  starting_position,
  bdd.andN(exceptIndex(positions, 0).map(position => bdd.not(position[0]))),
  bdd.andN(bridges.map(bridge => bdd.not(bridge[0])))
])
console.warn("Can we solve the puzzle? ", bdd.and(initial, ctl.EF(bdd.and(starting_position, every_bridge_used), transition)).isSatisfiable)

// Start at position 0, with bridges 0 and 6 used
initial = bdd.andN([
  starting_position,
  bridges[0][0], bridges[6][0],
  bdd.andN(exceptIndex(positions, 0).map(position => bdd.not(position[0]))),
  bdd.andN(bridges.slice(1,6).map(bridge => bdd.not(bridge[0])))
])
console.warn("Can we solve the puzzle, if we remove bridges 0 and 6? ", bdd.and(initial, ctl.EF(bdd.and(starting_position, every_bridge_used), transition)).isSatisfiable)
