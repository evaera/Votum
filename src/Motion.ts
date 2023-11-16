import { ChannelType, Collection, GuildMember, Message, Snowflake, TextChannel, } from "discord.js"
import { Either } from "fp-ts/lib/Either"
import * as t from "io-ts"
import minimist from "minimist"
import num2fraction from "num2fraction"
import calculateVoteTotals from "./calculateVoteTotals"
import Council, { CouncilWeights } from "./Council"
import { OnFinishAction } from "./CouncilData"
import { MotionData, MotionMetaOptions, MotionOptions, MotionVote, } from "./MotionData"
import { buildPieChartWithResults, forwardMotion } from "./Util"
import { container } from "@sapphire/framework"

export enum LegacyMotionVoteType {
  Majority,
  Unanimous,
}
export enum MotionResolution {
  Unresolved,
  Killed,
  Passed,
  Failed,
}
export enum CastVoteStatus {
  New,
  Changed,
  Failed,
}

const DEFAULT_MAJORITY = 0.5

interface EmbedField {
  name: string
  value: string
  inline?: boolean
}

function getEmbedLength(embed: any): number {
  return JSON.stringify(embed).length
}

export default class Motion {
  public council: Council
  public motionIndex: number
  private weights?: CouncilWeights
  private data: MotionData
  private creatingChannelPromise?: Promise<unknown>

  static parseMotionOptions(
    input: string
  ): Either<t.Errors, [string, MotionOptions]> {
    const args = minimist<
      MotionMetaOptions & { [K in keyof MotionOptions]: string }
    >(input.split(" "), {
      stopEarly: true,
      boolean: ["unanimous", "showChart"],
      alias: {
        u: "unanimous",
        m: "majority",
      },
    })

    if (args.unanimous) {
      args.majority = "100%"
    }

    return MotionOptions.decode(args).map(
      (options): [string, MotionOptions] => [args._.join(" "), options]
    )
  }

  constructor(motionIndex: number, motionData: MotionData, council: Council) {
    this.data = motionData
    this.council = council
    this.motionIndex = motionIndex
  }

  public get authorId(): Snowflake {
    return this.data.authorId
  }

  public get authorName(): string {
    return this.data.authorName
  }

  public get number(): number {
    return this.motionIndex + 1
  }

  public get isExpired(): boolean {
    return !!(
      this.council.motionExpiration &&
      Date.now() - this.data.createdAt > this.council.motionExpiration
    )
  }

  public get votes(): MotionVote[] {
    return this.data.votes
  }

  public get createdAt(): number {
    return this.data.createdAt
  }

  public set createdAt(when: number) {
    this.data.createdAt = when
  }

  public get text(): string {
    return this.data.text
  }

  public get resolution(): MotionResolution {
    return this.data.resolution
  }

  public get requiredMajority(): number {
    if (!this.data.options) {
      return this.council.getConfig("majorityDefault") || DEFAULT_MAJORITY
    }

    return (
      this.data.options.majority ||
      this.council.getConfig("majorityDefault") ||
      DEFAULT_MAJORITY
    )
  }

  public getData() {
    return this.data
  }

  public getReadableMajority(): string {
    if (this.requiredMajority === 1) {
      return "Unanimous"
    }

    switch (this.requiredMajority) {
      case 1:
        return "Unanimous"
      case 0.5:
        return "Simple majority"
      default:
        return num2fraction(this.requiredMajority)
    }
  }

  private async generateTranscript() {
    if (!this.data.deliberationChannelId) {
      return
    }

    const channel = this.council.channel.guild.channels.cache.find(
      (channel) => channel.id === this.data.deliberationChannelId
    ) as TextChannel | undefined

    if (!channel) {
      return
    }

    const messages: string[] = []
    let lastId: string | undefined

    for (let i = 0; i < 50; i++) {
      const collection = await channel.messages.fetch({
        limit: 50,
        ...(lastId && {
          before: lastId,
        }),
      })

      const batch = collection.values()

      // Convert the IterableIterator to an array
      const batchArray = Array.from(batch)

      for (const message of batchArray) {
        if (message.author.bot) {
          continue
        }

        messages.push(
          `${new Date(message.createdTimestamp).toISOString()} <${
            message.author.tag
          }> ${message.content.replace(/(\n\n+)/g, "\n")}`
        )
      }

      if (batchArray.length < 50) {
        break
      }

      lastId = batchArray[batchArray.length - 1].id
    }

    messages.reverse()

    const votes = this.getVotes()

    const header = [
      `Council: ${this.council.name}`,
      `Date: ${new Date().toISOString()}`,
      `Motion: #${this.number}`,
      `Resolution: ${MotionResolution[this.resolution]}`,
      `Proposed by: ${this.authorName}`,
      "",
      `For: ${votes.yes}`,
      `Against: ${votes.no}`,
      `Abstain: ${votes.abs}`,
      "",
      "#".repeat(50),
      "",
      this.text,
      "",
      "#".repeat(50),
      "",
      [...this.data.votes]
        .map((vote) => `<${vote.authorName}> **${vote.name}** ${vote.reason}`)
        .join("\n\n"),
      "",
      "#".repeat(50),
    ]

    const transcript = [header.join("\n"), messages.join("\n\n")].join("\n\n")

    let postChannel = this.council.channel

    if (this.council.announceChannel) {
      postChannel =
        (this.council.channel.guild.channels.resolve(
          this.council.announceChannel
        ) as TextChannel) || postChannel
    }

    postChannel.send({
      files: [
        {
          name: `${this.council.name}-motion-${this.number}-transcript.txt`,
          attachment: Buffer.from(transcript),
        },
      ],
    })
  }

  private async deleteDeliberationChannel() {
    if (this.data.deliberationChannelId) {
      if (this.council.getConfig("keepTranscripts")) {
        await this.generateTranscript()
      }
      const channel = this.council.channel.guild.channels.cache.find(
        (channel) => channel.id === this.data.deliberationChannelId
      )

      if (channel) {
        this.data.deliberationChannelId = undefined
        channel.delete()
      }
    }
  }

  private async createDeliberationChannel() {
    if (this.resolution !== MotionResolution.Unresolved) {
      return
    }

    if (!this.council.getConfig("createDeliberationChannels")) {
      return
    }

    if (this.creatingChannelPromise) {
      await this.creatingChannelPromise.catch(() => {})
    }

    if (this.data.deliberationChannelId) {
      return
    }

    const guild = this.council.channel.guild
    const categoryId = this.council.channel.parent?.id

    const channelName = `motion-${this.number}`

    const channelPromise = guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryId,
      permissionOverwrites: Array.from(this.council.channel.permissionOverwrites.cache.values()),
    })

    channelPromise.catch(console.error)

    this.creatingChannelPromise = channelPromise
    const channel = await channelPromise
    this.creatingChannelPromise = undefined

    this.data.deliberationChannelId = channel.id

    const motionMessage = await this.postMessage("", channel)

    const messages = Array.isArray(motionMessage)
      ? motionMessage
      : [motionMessage]

    for (const message of messages) {
      await message.pin()
    }
  }

  public async postMessage(
    text?: string | true,
    channel?: TextChannel
  ): Promise<Message | Message[]> {
    await this.council.channel.guild.members.fetch() // Privileged intents fix

    this.createDeliberationChannel()

    this.weights = await this.council.calculateWeights()

    let author

    try {
      author = await container.client.users.fetch(this.data.authorId)
    } catch (e) {
      // do nothing
    }

    if (this.data.active) {
      this.checkVotes()
    }

    let title = this.defineMotionMessageTitle(text);

    let chartUrl = null;
    if (!this.data.active && this.data.options?.showChart) {
      chartUrl = buildPieChartWithResults(this.getVotes())
    }

    const votes = text === true ? "" : "\n\n" + this.getVotesAsEmoji()
    const inactiveMotionColor = this.data.resolution === MotionResolution.Passed ? 0x2ecc71 : 0x636e72

    let embeds: any[] = [
      {
        title,
        description: this.data.text.substring(0, 2000 - votes.length) + votes,
        author: {
          name: this.data.authorName,
          icon_url: author ? author.displayAvatarURL() : undefined,
        },
        color: this.data.active
          ? 0x3498db
          : inactiveMotionColor,
        fields: this.getVotesAsFields(),
        footer: {
          text: this.getVoteHint(),
        },
        thumbnail: {
          url: `http://assets.imgix.net/~text?txt=${encodeURIComponent(
            this.getReadableMajority()
          )}&txtclr=3498db&txtsize=20&h=50&txtfont=Georgia`,
        },
        image: { url: chartUrl }
      },
    ]

    this.fixInvalidEmbedMessage(embeds, title);

    const getText = (str: any) => { return str === true ? this.council.mentionString : str }

    return embeds.map((embed) => {
      const options = {
        content: typeof text !== "undefined" ? getText(text) : "",
        embeds: [embed],
      };
      return (channel || this.council.channel).send(options);
    })[0];
  }

  public castVote(newVote: MotionVote): CastVoteStatus {
    if (newVote.isDictator && newVote.state !== 0) {
      this.resolve(
        newVote.state === 1 ? MotionResolution.Passed : MotionResolution.Failed
      )
    }

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

  private getTotal(): number {
    return this.weights?.total || this.council.size
  }

  public getVotes(): {
    yes: number
    no: number
    abs: number
    toPass: number
    dictatorVoted: boolean
  } {
    return calculateVoteTotals({
      votes: this.data.votes,
      requiredMajority: this.requiredMajority,
      totalSize: this.getTotal(),
      weights: this.weights,
    })
  }

  public resolve(resolution: MotionResolution): void {
    if (this.data.active === false) {
      throw new Error("Attempt to resolve a resolved motion.")
    }

    this.data.active = false
    this.data.resolution = resolution
    this.data.didExpire = this.isExpired

    if (
      (resolution === MotionResolution.Failed ||
        resolution === MotionResolution.Passed) &&
      !this.council.getConfig("userCooldownKill")
    ) {
      this.council.setUserCooldown(this.data.authorId, this.data.createdAt)

      if (this.council.announceChannel) {
        this.postMessage(
          "",
          this.council.channel.guild.channels.cache.get(
            this.council.announceChannel
          ) as TextChannel
        )
      }
    }

    if (
      resolution === MotionResolution.Passed &&
      this.council.getConfig("onPassedAnnounce")
    ) {
      this.postMessage(
        "",
        this.council.channel.guild.channels.cache.get(
          this.council.getConfig("onPassedAnnounce")!
        ) as TextChannel
      )
    } else if (
      resolution === MotionResolution.Failed &&
      this.council.getConfig("onFailedAnnounce")
    ) {
      this.postMessage(
        "",
        this.council.channel.guild.channels.cache.get(
          this.council.getConfig("onFailedAnnounce")!
        ) as TextChannel
      )
    } else if (
      resolution === MotionResolution.Killed &&
      this.council.getConfig("onKilledAnnounce")
    ) {
      this.postMessage(
        "",
        this.council.channel.guild.channels.cache.get(
          this.council.getConfig("onKilledAnnounce")!
        ) as TextChannel
      )
    }

    const newCurrentMotion = this.council.currentMotion
    if (newCurrentMotion) {
      newCurrentMotion.createdAt = Date.now()
      setTimeout(
        () =>
          newCurrentMotion
            .postMessage(true)
            .then(() => undefined)
            .catch((e) => {
              throw e
            }),
        2000
      )
    }

    this.deleteDeliberationChannel()
    this.finishResolvedMotion(resolution)
  }

  public getRemainingVoters(): Collection<string, GuildMember> {
    const votedUsers: { [index: string]: true } = {}

    for (let vote of this.data.votes) {
      if (vote.state !== undefined) {
        votedUsers[vote.authorId] = true
      }
    }

    return this.council.members.filter(
      (member) => !votedUsers[member.id] && !member.user.bot
    )
  }

  private checkVotes(): void {
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

    if (
      this.council.getConfig("majorityReachedEnds") ||
      [...this.data.votes].filter((vote) => vote.state !== undefined).length ===
      this.council.size
    ) {
      if (votes.yes >= votes.toPass) {
        // Reached majority
        this.resolve(MotionResolution.Passed)
      } else if (
        this.data.voteType === LegacyMotionVoteType.Unanimous &&
        votes.no > 0
      ) {
        // Legacy unanimous
        this.resolve(MotionResolution.Failed)
      } else if (votes.no >= votes.toPass || votes.toPass === 0) {
        // If "no" has the majority...
        this.resolve(MotionResolution.Failed)
      } else if (this.getTotal() - (votes.no + votes.abs) < votes.toPass) {
        // If a majority could no longer be reached
        this.resolve(MotionResolution.Failed)
      }
    }
  }

  private getVoteHint(): string {
    const votes = this.getVotes()

    if (this.data.active === false) {
      return this.getVoteResult();
    }

    if (votes.yes === votes.no && this.isExpired) {
      return `The motion is expired, but is tied. The next vote will close the motion.`
    } else if (votes.yes === 0 && votes.no === 0) {
      return `This motion requires ${votes.toPass} vote${
        this.checkPluralVotes(votes.toPass, 0)
      } to pass or fail.`
    } else if (
      (votes.yes >= votes.no && votes.yes >= votes.toPass) ||
      (votes.no >= votes.yes && votes.no >= votes.toPass)
    ) {
      return `This motion has reached the required majority, but is being held until all councilors have voted.`
    } else if (votes.yes >= votes.no) {
      return `With ${votes.toPass - votes.yes} more vote${
        this.checkPluralVotes(votes.toPass, votes.yes)
      } for this motion, it will pass.`
    } else if (votes.no > votes.yes) {
      return `With ${votes.toPass - votes.no} more vote${
        this.checkPluralVotes(votes.toPass, votes.no)
      } against this motion, it will fail.`
    }

    return `This motion requires ${votes.toPass} votes to pass or fail.`
  }

  private checkPluralVotes(pass: number, quantity: number): string {
    return pass - quantity === 1 ? "" : "s"
  }

  private getVoteResult(): string {
    const votes = this.getVotes()
    return (
      `Results final.` +
      (this.data.voteType === LegacyMotionVoteType.Unanimous
        ? " (Unanimous vote was required)"
        : "") +
      (this.data.didExpire ? " (Motion expired.)" : "") +
      (votes.dictatorVoted ? " (Dictator ended vote immediately)" : "")
    )
  }

  private getVotesAsEmoji(): string {
    const votes = this.getVotes()

    return `:thumbsup: **For** ${votes.yes}\n\n:thumbsdown: **Against** ${votes.no}\n\n:flag_white: **Abstain** ${votes.abs}`
  }

  private getVotesAsFields(): EmbedField[] {
    const fields: EmbedField[] = []

    for (const vote of this.data.votes) {
      const weight = this.weights?.users[vote.authorId]
      fields.push({
        name: vote.authorName + (weight && weight > 1 ? ` [${weight}]` : ""),
        value: `**${vote.name}**  ${vote.reason || ""}`.substring(0, 1024),
        inline: true,
      })
    }

    return fields
  }

  private finishResolvedMotion(resolution: MotionResolution): void {
    const actions = this.council.getConfig("onFinishActions") as any
    if (!actions) return

    switch (resolution) {
      case MotionResolution.Failed:
        if (actions.failed) this.performFinishActions(actions.failed)
        break
      case MotionResolution.Passed:
        if (actions.passed) this.performFinishActions(actions.passed)
        break
      case MotionResolution.Killed:
        if (actions.killed) this.performFinishActions(actions.killed)
        break
    }
  }

  private performFinishActions(actions: OnFinishAction[]) {
    actions = JSON.parse(JSON.stringify(actions))
    return Promise.all(
      actions
        .filter(
          (action) =>
            action.atMajority === undefined ||
            Math.abs(action.atMajority - this.requiredMajority) < 0.01
        )
        .map((action) => {
          if (action.action === "forward") {
            return forwardMotion(this, action.to, action.options)
          }
        })
    )
  }

  private defineMotionMessageTitle(text?: string | true): string {
    let type = ""
    if (this.data.voteType === LegacyMotionVoteType.Unanimous) {
      type = " (unanimous)"
    }

    let title = `#${this.number} | `
    if (this.data.active) {
      if (text === true) {
        title += "New motion proposed" + type
      } else {
        title += "Currently active motion" + type
      }
    } else if (this.data.resolution === MotionResolution.Passed) {
      title += "Motion Passed" + type
    } else if (this.data.resolution === MotionResolution.Killed) {
      title += "Motion Killed"
    } else {
      title += "Motion Failed"
    }

    return title;
  }

  private fixInvalidEmbedMessage(embeds: any[], title: string) {
    const isInvalid = (embed: any, extra = 0) =>
      embed.fields.length > 25 || getEmbedLength(embed) + extra >= 6000

    let currentIndex = 1
    while (isInvalid(embeds[0])) {
      const field = embeds[0].fields.pop()

      if (
        embeds[currentIndex] != null &&
        isInvalid(embeds[currentIndex], getEmbedLength(field))
      ) {
        currentIndex++
      }

      if (embeds[currentIndex] == null) {
        embeds[currentIndex] = {
          title: `${title} (cont.)`,
          color: embeds[0].color,
          fields: [],
        }
      }

      embeds[currentIndex].fields.push(field)
    }
  }
}
