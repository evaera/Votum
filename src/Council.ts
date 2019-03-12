import { Collection, GuildMember, Snowflake, TextChannel } from 'discord.js'
import * as fs from 'fs'
import onChange from 'on-change'
import * as path from 'path'
import { CouncilData, DefaultCouncilData } from './CouncilData'
import Motion from './Motion'
import { MotionData } from './MotionData'

export default class Council {
  private static defaultData = DefaultCouncilData

  public id: Snowflake
  public channel: TextChannel
  private data: CouncilData
  private dataPath: string

  constructor (channel: TextChannel) {
    this.channel = channel
    this.id = channel.id

    this.dataPath = path.join(__dirname, `../data/${this.id}.json`)
    this.loadData()
  }

  public get enabled () {
    return this.data.enabled
  }

  public set enabled (state: boolean) {
    this.data.enabled = state
  }

  public get name () {
    return this.data.name
  }

  public set name (state: string) {
    this.data.name = state
  }

  public get announceChannel (): string | undefined {
    return this.data.announceChannel
  }

  public get councilorRole (): Snowflake | undefined {
    return this.data.councilorRole
  }

  public get userCooldown (): number {
    return this.data.userCooldown
  }

  public get motionExpiration (): number {
    return this.data.motionExpiration
  }

  public setConfig<T extends keyof CouncilData> (key: T, value: CouncilData[T]) {
    this.data[key] = value
  }

  public getConfig<T extends keyof CouncilData> (key: T): CouncilData[T] {
    return this.data[key]
  }

  public get mentionString () {
    if (this.data.councilorRole) {
      return `<@&${this.data.councilorRole}>`
    }

    return ''
  }

  public get size (): number {
    return this.members.size
  }

  public get members (): Collection<Snowflake, GuildMember> {
    const roleId = this.councilorRole || '0'
    const role = this.channel.guild.roles.get(roleId)

    if (role) {
      return role.members
    } else {
      return this.channel.members
    }
  }

  public get currentMotion (): Motion | undefined {
    for (const [index, motion] of this.data.motions.entries()) {
      if (motion.active) {
        return new Motion(index, motion, this)
      }
    }
  }

  public get numMotions (): number {
    return this.data.motions.length
  }

  public isUserOnCooldown (id: Snowflake): boolean {
    if (!this.data.userCooldowns[id]) {
      return false
    }

    if (Date.now() - this.data.userCooldowns[id] < this.data.userCooldown) {
      return true
    }

    return false
  }

  public getUserCooldown (id: Snowflake): number {
    return this.userCooldown - (Date.now() - (this.data.userCooldowns[id] || 0))
  }

  public setUserCooldown (id: Snowflake, time: number = Date.now()): void {
    this.data.userCooldowns[id] = time
  }

  public getMotion (id: number): Motion {
    const motion = this.data.motions[id]

    if (motion == null) {
      throw new Error(`Motion ID ${id} for council ${this.id} does not exist.`)
    }

    return new Motion(id, motion, this)
  }

  public createMotion (data: MotionData): Motion {
    this.data.motions.push(data)

    return new Motion(this.data.motions.length - 1, data, this)
  }

  private loadData (): void {
    let data: CouncilData
    try {
      const parsedSettings = JSON.parse(fs.readFileSync(this.dataPath, { encoding: 'utf8' }))
      data = Object.assign({}, JSON.parse(JSON.stringify(Council.defaultData)), parsedSettings)
    } catch (e) {
      data = JSON.parse(JSON.stringify(Council.defaultData))
    }

    this.data = onChange(data, () => {
      setTimeout(() => {
        fs.writeFile(this.dataPath, JSON.stringify(this.data, undefined, 2), () => undefined)
      }, 0)
    }) as CouncilData
  }
}
