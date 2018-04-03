import * as path from 'path'
import * as fs from 'fs'
import { Snowflake } from 'discord.js'
import onChange = require('on-change')
import Votum from './Votum'

interface Motion {
  author: Snowflake,
  authorName: Snowflake,
  id: number
}

interface CouncilData {
  enabled: boolean,
  announceChannel: Snowflake | null,
  userCooldown: number,
  motions: Motion[]
}

export default class Council {
  private static defaultSettings: CouncilData = {
    enabled: false,
    announceChannel: null,
    userCooldown: 0,
    motions: []
  }

  public id: Snowflake
  public data: CouncilData
  private dataPath: string

  constructor (id: Snowflake) {
    this.id = id

    this.dataPath = path.join(__dirname, `../data/${this.id}.json`)
    this.loadData()
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
