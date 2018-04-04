import * as path from 'path'
import * as fs from 'fs'
import { Snowflake, Role } from 'discord.js'
import onChange = require('on-change')
import Votum from './Votum'
import Motion, { MotionData } from './Motion'

interface CouncilData {
  enabled: boolean,
  name: string,
  announceChannel: Snowflake | null,
  councilorRole: Snowflake | null,
  userCooldown: number,
  motions: MotionData[]
}

export default class Council {
  private static defaultSettings: CouncilData = {
    enabled: false,
    name: 'Council',
    councilorRole: null,
    announceChannel: null,
    userCooldown: 0,
    motions: []
  }

  public id: Snowflake
  private data: CouncilData
  private dataPath: string

  constructor (id: Snowflake) {
    this.id = id

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

  public get councilorRole (): Snowflake | null {
    return this.data.councilorRole
  }

  public set councilorRole (role: Snowflake | null) {
    this.data.councilorRole = role
  }

  private loadData (): void {
    let data: CouncilData
    try {
      const parsedSettings = JSON.parse(fs.readFileSync(this.dataPath, { encoding: 'utf8' }))
      data = Object.assign({}, Council.defaultSettings, parsedSettings)
    } catch (e) {
      data = JSON.parse(JSON.stringify(Council.defaultSettings))
    }

    this.data = onChange(data, () => {
      setTimeout(() => {
        fs.writeFile(this.dataPath, JSON.stringify(this.data), () => {})
      }, 0)
    }) as CouncilData
  }
}
