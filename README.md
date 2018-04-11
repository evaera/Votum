<p align="center">
  <a href="https://discordapp.com/oauth2/authorize?client_id=430737691454341130&scope=bot&permissions=85000"><img src="https://i.imgur.com/pnEEVdz.png" alt="Votum" /></a>
  <br>
  <a href="https://discordapp.com/oauth2/authorize?client_id=298796807323123712&scope=bot&permissions=402656264"><img src="https://i.imgur.com/2UBikON.png" alt="Add" /></a>
</p>


# Votum

A Discord bot for managing small party voting systems such as a council or small group who want to deliberate on matters democratically. Work in progress.

## Commands

### Admin commands
These commands can only be run by someone with the `Manage Server` permission, or with a role named `Votum Admin`.

| Command         | Description |
| -------------   | ----------- |
| `!Council [name]` | Create a council (or rename) in the channel you run this in, with an optional name.
| `!Council remove` | Remove a council from the channel you run this in.
| `!CouncilorRole <role>` | Define a role that councilors must have to vote. Otherwise, anyone that can see the channel can vote and will be counted for the majority count.
| `!CouncilorRole remove` | Remove the councilor role.
| `!MotionAnnounceChannel <channel>` | Designate a channel where all passed and failed (not killed) motions will be logged.
| `!MotionAnnounceChannel remove` | Remove the announce channel.
| `!MotionExpire <hours>` | Set the number of hours a motion can remain active. Default `0` (expiration disabled).
| `!CouncilorCooldown <hours>` | Set the number of hours a councilor must wait between proposals. (Killed motions do not trigger the cooldown). Default `0` (no cooldown).

### Councilor commnads

| Command         | Description |
| -------------   | ----------- |
| `!motion` | See the current motion.
| `!motion <motion text>` | Call a motion with the given text.
| `!motion -u <motion text>` | Call a unanimous motion with the given text (any "no" vote will end the motion).
| `!motion kill` | Kill the current motion. (Only admins or the motion author can do this).
| `!yes \| aye \| si \| yea \| yay \| ja \| oui <reason>` | Vote yes with a mandatory reason.
| `!no \| nay \| negative \| nope \| nein <reason>` | Vote no with a mandatory reason.
| `!abstain [reason]` | Abstain from voting with an optional reason.

## Voting

- Multiple councils can be defined in one Discord server, as the councils are based on channels.
- Upon a tie, the motion will remain forever until someone breaks the tie.
- The councilor cooldown is not triggered if the motion is killed.
- When a motion expires, the outcome is determined by majority votes. If there are more "yes" than "no" votes, it will pass, and vice-versa.
- If you do not set a Councilor role, the total number of voters is determined by who can see the channel. It's recommended that you set a role for councilors so that you can be sure that only possible voters count towards the total number needed for majority.

## Quick set-up guide

1. Pick a channel that your councilors will deliberate in.
2. Run `!Council My Council` to mark this channel as a council. (Change "My Council" to whatever you want it to be named.)
3. Create a role for the members of your council and give it to your voters. Then, run `!CouncilorRole RoleNameHere`.
4. Run `!motion This is my first motion`. You're all done! Check out the other configuration options above for more advanced use.

## Goals

Contributions and suggestions are welcome.

- [x] Load and save data per council
- [x] Define councils on a per-channel basis
- [x] Start motions
- [x] Ability to vote on motions, display data and accept reasons
  - [ ] Multiple vote types
- [x] Implement user cooldown
- [x] Ability to kill a motion
- [x] Settings for when a motion passes: unanimous, majority
- [x] Detect when a motion has passed or failed
- [x] Motion expiration
- [x] Define which people can vote or call motions
- [ ] Add status message and web page to show where to invite from Discord
- [ ] Allow mandatory reasons to be configurable
- [ ] A command to show historical motion history
- [ ] Update to support sharding
