import { Snowflake, Message, TextChannel, GuildMember, Collection } from 'discord.js'
import Council from './Council'
import Votum from './Votum'
import { MotionData, MotionVote } from './MotionData'

export enum MotionVoteType { Majority, Unanimous }
export enum MotionResolution { Unresolved, Killed, Passed, Failed }
export enum CastVoteStatus { New, Changed, Failed }

interface EmbedField {
  name: string,
  value: string,
  inline?: boolean
}

function getEmbedLength (embed: any): number {
  return JSON.stringify(embed).length
}

export default class Motion {
  public council: Council
  public motionIndex: number
  private data: MotionData
  private votesToPass: number

  constructor (motionIndex: number, motionData: MotionData, council: Council) {
    this.data = motionData
    this.council = council
    this.motionIndex = motionIndex

    if (this.data.voteType === MotionVoteType.Majority) {
      this.votesToPass = Math.ceil(this.council.size / 2)
    } else {
      this.votesToPass = this.council.size
    }
  }

  public get authorId (): Snowflake {
    return this.data.authorId
  }

  public get authorName (): string {
    return this.data.authorName
  }

  public get number (): number {
    return this.motionIndex + 1
  }

  public get isExpired (): boolean {
    return !!(this.council.motionExpiration && Date.now() - this.data.createdAt > this.council.motionExpiration)
  }

  public get votes (): MotionVote[] {
    return this.data.votes
  }

  public get createdAt (): number {
    return this.data.createdAt
  }

  public get text (): string {
    return this.data.text
  }

  public get resolution (): MotionResolution {
    return this.data.resolution
  }

  public async postMessage (text?: string | true, channel?: TextChannel): Promise<Message | Message[]> {
    let author

    try {
      author = await Votum.bot.users.fetch(this.data.authorId)
    } catch (e) {
      // do nothing
    }

    if (this.data.active) {
      this.checkVotes()
    }

    let type = ''
    if (this.data.voteType === MotionVoteType.Unanimous) {
      type = ' (unanimous)'
    }

    let title = `#${this.number} | `
    if (this.data.active) {
      if (text === true) {
        title += 'New motion proposed' + type
      } else {
        title += 'Currently active motion' + type
      }
    } else if (this.data.resolution === MotionResolution.Passed) {
      title += 'Motion Passed' + type
    } else if (this.data.resolution === MotionResolution.Killed) {
      title += 'Motion Killed'
    } else {
      title += 'Motion Failed'
    }

    const votes = text === true ? '' : '\n\n' + this.getVotesAsEmoji()

    let embeds: any[] = [{
      title,
      description: this.data.text.substring(0, 2000 - votes.length) + votes,
      author: {
        name: this.data.authorName,
        icon_url: author ? author.displayAvatarURL() : undefined
      },
      color: this.data.active ? 0x3498db : (this.data.resolution === MotionResolution.Passed ? 0x2ecc71 : 0x636e72),
      fields: this.getVotesAsFields(),
      footer: {
        text: this.getVoteHint()
      }
    }]

    const isInvalid = (embed: any, extra = 0) => (embed.fields.length > 25 || getEmbedLength(embed) + extra >= 6000)

    let currentIndex = 1
    while (isInvalid(embeds[0])) {
      const field = embeds[0].fields.pop()

      if (embeds[currentIndex] != null && isInvalid(embeds[currentIndex], getEmbedLength(field))) {
        currentIndex++
      }

      if (embeds[currentIndex] == null) {
        embeds[currentIndex] = {
          title: `${title} (cont.)`,
          color: embeds[0].color,
          fields: []
        }
      }

      embeds[currentIndex].fields.push(field)
    }

    return embeds.map(embed => (channel || this.council.channel).send(typeof text !== 'undefined' ? (text === true ? this.council.mentionString : text) : '', { embed }))[0]
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

    if (resolution === MotionResolution.Failed || resolution === MotionResolution.Passed) {
      this.council.setUserCooldown(this.data.authorId, this.data.createdAt)

      if (this.council.announceChannel) {
        this.postMessage('', this.council.channel.guild.channels.get(this.council.announceChannel) as TextChannel)
      }
    }
  }

  public getRemainingVoters (): Collection<string, GuildMember> {
    const votedUsers: {[index: string]: true} = {}

    for (let vote of this.data.votes) {
      votedUsers[vote.authorId] = true
    }

    return this.council.members.filter(member => !votedUsers[member.id] && !member.user.bot)
  }

  private checkVotes (): void {
    if (this.resolution !== MotionResolution.Unresolved) {
      return
    }

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
