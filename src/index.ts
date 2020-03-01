/// <reference path="./typings/on-change.d.ts" />

import Discord from "discord.js"
import path from "path"

require("dotenv").config()

const shardingManager = new Discord.ShardingManager(
  path.join(__dirname, "Votum.js"),
  {
    token: process.env.TOKEN,
  }
)

shardingManager.on("shardCreate", shard => {
  console.log(`Launching shard ${shard.id + 1}/${shardingManager.totalShards}`)
})

shardingManager.spawn()
