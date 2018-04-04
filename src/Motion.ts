import { Snowflake } from 'discord.js'

export interface MotionData {
  author: Snowflake,
  authorName: Snowflake,
  id: number
}

export default class Motion {
  private data: MotionData

  constructor (motionData: MotionData) {
    this.data = motionData
  }
}
