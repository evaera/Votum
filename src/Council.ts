import * as path from 'path'
import * as fs from 'fs'
import { Snowflake, TextChannel } from 'discord.js'
import onChange = require('on-change')
import Motion, { MotionData } from './Motion'

interface CouncilData {
  enabled: boolean,
  name: string,
  announceChannel?: Snowflake,
  councilorRole?: Snowflake,
  userCooldown: number,
  userCooldowns: { [index: string]: number },
  motions: MotionData[]
}

export default class Council {
  private static defaultData: CouncilData = {
    enabled: false,
    name: 'Council',
    userCooldown: 0,
    userCooldowns: {},
    motions: []
  }

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

  public set announceChannel (channelId: string | undefined) {
    this.data.announceChannel = channelId
  }

  public get councilorRole (): Snowflake | undefined {
    return this.data.councilorRole
  }

  public set councilorRole (role: Snowflake | undefined) {
    this.data.councilorRole = role
  }

  public get userCooldown (): number {
    return this.data.userCooldown
  }

  public set userCooldown (role: number) {
    this.data.userCooldown = role
  }

  public get size (): number {
    const roleId = this.councilorRole || '0'
    const role = this.channel.guild.roles.get(roleId)

    if (role) {
      return role.members.size
    } else {
      return this.channel.members.size
    }
  }

  public get currentMotion (): Motion | undefined {
    for (const motion of this.data.motions) {
      if (motion.active) {
        return new Motion(motion, this)
      }
    }
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

  public getMotion(id: number): Motion {
    const motion = this.data.motions[id]

    if (motion == null) {
      throw new Error(`Motion ID ${id} for council ${this.id} does not exist.`)
    }

    return new Motion(motion, this)
  }

  public createMotion(data: MotionData): Motion {
    this.data.motions.push(data)

    return new Motion(data, this)
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
        fs.writeFile(this.dataPath, JSON.stringify(this.data), () => {})
      }, 0)
    }) as CouncilData
  }
}
