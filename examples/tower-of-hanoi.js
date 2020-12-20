// Tower of Hanoi: https://en.wikipedia.org/wiki/Tower_of_Hanoi
// TODO: fix
const { ROBDD } = require('reduced-ordered-binary-decision-diagrams')
const { CTL }   = require('../lib/computation-tree-logic')

const n = 4

const fromTo = (from, to) => {
  return Array.from({length:to-from}, (v,k)=>k+from)
}

const rod_indices = [0, 1, 2]
let disc_indices  = []
for(let j = 0; j < n; j++) disc_indices.push(j)

let disc = []
for(let i = 0; i < 3; i++) {
  disc.push([])
  for(let j = 0; j < n; j++) {
    disc[i].push(CTL.variable())
  }
}

let transition = ROBDD.orN(disc_indices.map(disc_index => ROBDD.orN(rod_indices.map(rod_index => ROBDD.orN([
  [1, 2].map(offset => ROBDD.orN([
    // Rod j
    ROBDD.xor(...disc[rod_index][disc_index]), // move disc i off of j
    ROBDD.andN(fromTo(0, disc_index).map(index   => ROBDD.eql(...disc[rod_index][index]))), // all else remaining equal
    ROBDD.andN(fromTo(disc_index+1, n).map(index => ROBDD.eql(...disc[rod_index][index]))), // all else remaining equal

    // Rod j+offset
    ROBDD.xor(...disc[(rod_index+offset)%3][disc_index]), // move disc i onto j+1
    ROBDD.andN(fromTo(0, disc_index).map(index   => ROBDD.eql(...disc[(rod_index+offset)%3][index]))), // all else remaining equal
    ROBDD.andN(fromTo(disc_index+1, n).map(index => ROBDD.eql(...disc[(rod_index+offset)%3][index]))), // all else remaining equal

    // Rod j-offset
    ROBDD.andN(fromTo(0, disc_index).map(index => ROBDD.and(...disc[(rod_index+3-offset)%3][index]))), // if all discs < i are on j+2
    ROBDD.andN(fromTo(disc_index, n).map(index => ROBDD.eql(...disc[(rod_index+3-offset)%3][index])))  // all else remaining equal
  ]))
])))))

const on_peg_1 = ROBDD.andN(disc_indices.map(disc_index => ROBDD.andN([ROBDD.not(disc[0][disc_index][0])])))
const on_peg_2 = ROBDD.andN(disc_indices.map(disc_index => ROBDD.andN([ROBDD.not(disc[1][disc_index][0])])))
const on_peg_3 = ROBDD.andN(disc_indices.map(disc_index => ROBDD.andN([ROBDD.not(disc[2][disc_index][0])])))

const from_1_to_3 = ROBDD.imp(on_peg_1, CTL.EF(on_peg_3, transition))

console.warn("There is a way to move the tower from peg 1 to 3:", from_1_to_3)
