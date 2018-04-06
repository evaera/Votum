import { Snowflake, Message, TextChannel } from 'discord.js'
import Council from './Council'
import Votum from './Votum'

export enum MotionVoteType { Majority, Unanimous }
export enum MotionResolution { Unresolved, Killed, Passed, Failed }
export enum CastVoteStatus { New, Changed, Failed }

export interface MotionVote {
  authorId: Snowflake,
  authorName: string,
  state: 1 | 0 | -1,
  name: string,
  reason?: string
}

export interface MotionData {
  authorId: Snowflake,
  authorName: string,
  active: boolean,
  resolution: MotionResolution,
  text: string,
  voteType: MotionVoteType,
  createdAt: number,
  deletedAt?: number,
  didExpire: boolean,
  votes: MotionVote[]
}

interface EmbedField {
  name: string,
  value: string,
  inline?: boolean
}

export default class Motion {
  public council: Council
  private data: MotionData
  private votesToPass: number

  constructor (motionData: MotionData, council: Council) {
    this.data = motionData
    this.council = council

    if (this.data.voteType === MotionVoteType.Majority) {
      this.votesToPass = Math.floor(this.council.size / 2)
    } else {
      this.votesToPass = this.council.size
    }
  }

  public get author (): Snowflake {
    return this.data.authorId
  }

  public get isExpired (): boolean {
    return !!(this.council.motionExpiration && Date.now() - this.data.createdAt > this.council.motionExpiration)
  }

  public async postMessage (text?: string | true, channel?: TextChannel): Promise<Message | Message[]> {
    let author

    try {
      author = await Votum.bot.users.fetch(this.data.authorId)
    } catch (e) {}

    if (this.data.active) {
      this.checkVotes()
    }

    let type = ''
    if (this.data.voteType === MotionVoteType.Unanimous) {
      type = ' (unanimous)'
    }

    let title
    if (this.data.active) {
      if (text === true) {
        title = 'New motion proposed' + type
      } else {
        title = 'Currently active motion' + type
      }
    } else if (this.data.resolution === MotionResolution.Passed) {
      title = 'Motion Passed' + type
    } else if (this.data.resolution === MotionResolution.Killed) {
      title = 'Motion Killed'
    } else {
      title = 'Motion Failed'
    }

    return (channel || this.council.channel).send(typeof text !== 'undefined' ? (text === true ? '@everyone' : text) : '', { embed: {
      title,
      description: this.data.text + (text === true ? '' : '\n\n' + this.getVotesAsEmoji()),
      author: {
        name: this.data.authorName,
        icon_url: author ? author.displayAvatarURL() : undefined
      },
      color: this.data.active ? 0x3498db : (this.data.resolution === MotionResolution.Passed ? 0x2ecc71 : 0x636e72),
      fields: this.getVotesAsFields(),
      footer: {
        text: this.getVoteHint()
      }
    }})
  }

  public castVote (newVote: MotionVote): CastVoteStatus {
    for (const [index, vote] of this.data.votes.entries()) {
      if (vote.authorId === newVote.authorId) {
        this.data.votes[index] = newVote
        return CastVoteStatus.Changed
      }
    }

    this.data.votes.push(newVote)
    this.checkVotes()
    return CastVoteStatus.New
  }

  public getVotes (): {yes: number, no: number, abs: number, toPass: number} {
    const votes = {
      [-1]: 0,
      [0]: 0,
      [1]: 0
    }

    for (const vote of this.data.votes) {
      votes[vote.state]++
    }

    return {
      no: votes[-1],
      yes: votes[1],
      abs: votes[0],
      toPass: this.votesToPass - votes[0]
    }
  }

  public resolve (resolution: MotionResolution): void {
    if (this.data.active === false) {
      throw new Error('Attempt to resolve a resolved motion.')
    }

    this.data.active = false
    this.data.resolution = resolution
    this.data.didExpire = this.isExpired

    if (resolution === MotionResolution.Failed || resolution == MotionResolution.Passed) {
      this.council.setUserCooldown(this.data.authorId, this.data.createdAt)

      if (this.council.announceChannel) {
        this.postMessage('', this.council.channel.guild.channels.get(this.council.announceChannel) as TextChannel)
      }
    }
  }

  private checkVotes (): void {
    const votes = this.getVotes()

    if (this.isExpired) {
      if (votes.yes > votes.no) {
        this.resolve(MotionResolution.Passed)
      } else if (votes.no > votes.yes) {
        this.resolve(MotionResolution.Failed)
      }
    }

    if (votes.yes >= votes.toPass) {
      this.resolve(MotionResolution.Passed)
    } else if (this.data.voteType === MotionVoteType.Unanimous && votes.no > 0) {
      this.resolve(MotionResolution.Failed)
    } else if (votes.no >= votes.toPass || votes.toPass === 0) {
      this.resolve(MotionResolution.Failed)
    }
  }

  private getVoteHint (): string {
    if (this.data.active === false) {
      return `Results final.` + (this.data.voteType === MotionVoteType.Unanimous ? ' (Unanimous vote was required)' : '') + (this.data.didExpire ? ' (Motion expired.)' : '')
    }

    const votes = this.getVotes()

    if (votes.yes === votes.no && this.isExpired) {
      return `The motion is expired, but is tied. The next vote will close the motion.`
    } else if (votes.yes === 0 && votes.no === 0) {
      return `This motion requires ${votes.toPass} vote${votes.toPass === 1 ? '' : 's'} to pass or fail.`
    } else if (votes.yes >= votes.no) {
      return `With ${votes.toPass - votes.yes} more vote${votes.toPass - votes.yes === 1 ? '' : 's'} for this motion, it will pass.`
    } else if (votes.no > votes.yes) {
      return `With ${votes.toPass - votes.no} more vote${votes.toPass - votes.no === 1 ? '' : 's'} against this motion, it will fail.`
    }

    return `This motion requires ${votes.toPass} votes to pass or fail.`
  }

  private getVotesAsEmoji (): string {
    const votes = this.getVotes()

    return `:thumbsup: **For** ${votes.yes}\n\n:thumbsdown: **Against** ${votes.no}\n\n:flag_white: **Abstain** ${votes.abs}`
  }

  private getVotesAsFields (): EmbedField[] {
    const fields: EmbedField[] = []

    for (const vote of this.data.votes) {
      fields.push({
        name: vote.authorName,
        value: `**${vote.name}**  ${vote.reason || ''}`.substring(0, 1024),
        inline: true
      })
    }

    return fields
  }
}
