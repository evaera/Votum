import { CouncilWeights } from "./Council"
import { MotionVote } from "./MotionData"

export default function calculateVoteTotals({
  votes,
  totalSize,
  requiredMajority,
  weights,
}: {
  votes: MotionVote[]
  totalSize: number
  requiredMajority: number
  weights?: CouncilWeights
}): {
  yes: number
  no: number
  abs: number
  toPass: number
  dictatorVoted: boolean
} {
  const voteTotals = {
    [-1]: 0,
    [0]: 0,
    [1]: 0,
  }

  let dictatorVoted = false

  for (const vote of votes) {
    const weight = weights?.users[vote.authorId]

    if (vote.state !== undefined) voteTotals[vote.state] += weight || 1

    if (vote.isDictator && vote.state !== 0) dictatorVoted = true
  }

  const effectiveSize = totalSize - voteTotals[0]

  let toPass = Math.ceil(effectiveSize * requiredMajority)

  // Simple majority requires 50% + 1 vote
  if (requiredMajority === 0.5 && effectiveSize % 2 === 0) {
    toPass += 1
  }

  return {
    no: voteTotals[-1],
    yes: voteTotals[1],
    abs: voteTotals[0],
    toPass,
    dictatorVoted,
  }
}
