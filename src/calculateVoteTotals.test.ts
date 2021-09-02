import calculateVoteTotals from "./calculateVoteTotals"

test("council of 2 with 1 abstain 1 yes should pass", () => {
  const result = calculateVoteTotals({
    votes: [
      {
        authorId: "0",
        authorName: "bob",
        name: "abstain",
        state: 0,
      },
    ],
    requiredMajority: 0.5,
    totalSize: 2,
  })

  expect(result).toEqual({
    no: 0,
    yes: 0,
    abs: 1,
    toPass: 1,
    dictatorVoted: false,
  })
})

test("simple majority rounding should be correct", () => {
  const result = calculateVoteTotals({
    votes: [],
    requiredMajority: 0.5,
    totalSize: 7,
  })

  expect(result).toEqual({
    no: 0,
    yes: 0,
    abs: 0,
    toPass: 4,
    dictatorVoted: false,
  })
})

test("council of 4", () => {
  const result = calculateVoteTotals({
    votes: [],
    requiredMajority: 0.5,
    totalSize: 4,
  })

  expect(result).toEqual({
    no: 0,
    yes: 0,
    abs: 0,
    toPass: 3,
    dictatorVoted: false,
  })
})

test("council of 5", () => {
  const result = calculateVoteTotals({
    votes: [],
    requiredMajority: 0.5,
    totalSize: 5,
  })

  expect(result).toEqual({
    no: 0,
    yes: 0,
    abs: 0,
    toPass: 3,
    dictatorVoted: false,
  })
})

test("66% council of 5", () => {
  const result = calculateVoteTotals({
    votes: [],
    requiredMajority: 2 / 3,
    totalSize: 5,
  })

  expect(result).toEqual({
    no: 0,
    yes: 0,
    abs: 0,
    toPass: 4,
    dictatorVoted: false,
  })
})
