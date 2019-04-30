<p align="center">
  <a href="https://discordapp.com/oauth2/authorize?client_id=430737691454341130&scope=bot&permissions=85000"><img src="https://i.imgur.com/pnEEVdz.png" alt="Votum" /></a>
  <br>
  <a href="https://discordapp.com/oauth2/authorize?client_id=430737691454341130&scope=bot&permissions=402656264"><img src="https://i.imgur.com/2UBikON.png" alt="Add" /></a>
  <br>
  <a href="https://github.com/evaera/Votum">View Source on GitHub</a>
  <br><br>
  <a href="https://discord.gg/27AhKrU"><img src="https://img.shields.io/discord/425800792679645204.svg?label=Discord" /></a>
</p>

> Need help? Have a suggestion, comment, or problem? Join the [Discord server](https://discord.gg/27AhKrU).

# Votum

A Discord bot for managing small party voting systems such as a council or small group who want to deliberate on matters democratically. Contributions and suggestions are welcome.

Looking for a bot that provides quick on-the-fly poll-based votes to your entire community? Check out [Poll Dancer](https://eryn.io/PollDancer)

## Commands

### Admin commands
These commands can only be run by someone with the `Manage Server` permission, or with a role named `Votum Admin`.

| Command         | Description |
| -------------   | ----------- |
| `!Council [name]` | Create a council (or rename) in the channel you run this in, with an optional name.
| `!Council remove` | Remove a council from the channel you run this in.
| `!CouncilStats` | Displays some statistics about your council.
| `!config [key] [value]` | Configures a setting in this council. See the table below.
| `!config [key] $remove`  | Sets this setting back to its default.

### Configuration Points

| Key | Value type | Description | Default |
| ------------- | ---------- | ----------- | ------- |
| `councilor.role` | `role` | Define a role that councilors must have to vote. Otherwise, anyone that can see the channel can vote and will be counted for the majority count. | None
| `propose.role` | `role` | Restricts proposing motions to users with this role only (in addition to the councilor role). | None
| `user.cooldown` | `number` | Set the number of hours a councilor must wait between proposals. (Killed motions do not trigger the cooldown). | `0`
| `user.cooldown.kill` | `boolean` | Whether or not killing motions should trigger the cooldown. | false
| `motion.expiration` | `number` | Set the number of hours a motion can remain active. | `0`
| `announce.channel` | `channel` | Designate a channel where all passed and failed (not killed) motions will be logged. | None
| `on.passed.announce` | `channel` | A channel that announces *passed* motions only. | None
| `on.killed.announce` | `channel` | A channel that announces *killed* motions only. | None
| `on.failed.announce` | `channel` | A channel that announces *failed* motions only. | None
| `councilor.motion.disable` | `boolean` | Whether or not creating new motions is disabled in this council (only accepts forwarded motions) | false
| `motion.queue` | `boolean` | If enabled, motions can be created when another is active and will be queued, automatically starting when the current motion ends. | false
| `majority.default` | `majority-type` | The default majority for motions. Fraction or percentage. | 1/2
| `majority.minimum` | `majority-type` | The minimum majority councilors can create motions with. | 1/2
| `majority.reached.ends` | `boolean` | Whether or not motions end as soon as majority is reached. Otherwise, all councilors will need to vote. | true
| `on.finish.actions` | `json` | A set of actions that will take place when a motion resolves. See [Finish Actions](#finish-actions) | None
| `reason.required.yes` | `boolean` | Whether or not the user must provide a reason with a positive vote. | true
| `reason.required.no` | `boolean` | Whether or not the user must provide a reason with a negative vote. | true
| `reason.required.abstain` | `boolean` | Whether or not the user must provide a reason with a neutral vote. | false

### Councilor commands

| Command         | Description |
| -------------   | ----------- |
| `!motion` | See the current motion.
| `!motion <motion text>` | Call a motion with the given text.
| `!motion [options] <motion text>` | Call a motion with [Motion options](#motion-options)
| `!motion kill` | Kill the current motion. (Only admins or the motion author can do this).
| `!yes \| aye \| si \| yea \| yay \| ja \| oui <reason>` | Vote yes with a mandatory reason.
| `!no \| nay \| negative \| nope \| nein <reason>` | Vote no with a mandatory reason.
| `!abstain [reason]` | Abstain from voting with an optional reason.
| `!lazyvoters` | Mentions any council members who haven't voted on the current motion yet.
| `!archive [range]` | Allows you to view past motions. Provide a range of numbers to view a summary, or provide a single number to view a motion.

#### Motion Options

Motion options are special flags you can put at the beginning of your motion to change options about the motion. Right now, the only options available are for changing the majority type.

| Option flag | Aliases | Type | Description |
| ----------- | ------- | ---- | ----------- |
| `majority`  | `m`     | `majority type` | A percentage or fraction indicating the majority type.
| `unanimous` | `u`     | `boolean` | Specifies the motion should be unanimous (shortcut for `-m 100%`)

##### Example

To start a motion with 2/3rd majority, you could use the commands (all are equivalent):<br>
- `!motion -m 2/3 Motion text goes here`
- `!motion --majority 2/3 Motion text goes here`
- `!motion --majority 66% Motion text goes here`

Unanimous motion (all are equivalent):<br>
- `!motion -u Motion text goes here`
- `!motion --unanimous Motion text goes here`
- `!motion -m 100% Motion text goes here`
- `!motion -m 1/1 Motion text goes here`


## Voting

- Multiple councils can be defined in one Discord server, as the councils are based on channels.
- Upon a tie, the motion will remain forever until someone breaks the tie.
- The councilor cooldown is not triggered if the motion is killed.
- When a motion expires, the outcome is determined by majority votes. If there are more "yes" than "no" votes, it will pass, and vice-versa.
- If you do not set a Councilor role, the total number of voters is determined by who can see the channel. It's recommended that you set a role for councilors so that you can be sure that only possible voters count towards the total number needed for majority.

## Quick set-up guide

1. Pick a channel that your councilors will deliberate in.
2. Run `!Council My Council` to mark this channel as a council. (Change "My Council" to whatever you want it to be named.)
3. Create a role for the members of your council and give it to your voters. Then, run `!config councilor.role RoleNameHere`.
4. Run `!motion This is my first motion`. You're all done! Check out the other configuration options above for more advanced use.

## Finish Actions

With the `on.finish.actions` configuration point, you can supply custom JSON configuration that tells Votum what to do with your motion once it resolves. Most prominently, you can forward your motion into other councils (based on the majority type) with potentially different options. Use [this link](https://json-editor.github.io/json-editor/?schema=N4IgJgpgZglgdjALjA9nAziAXKAhgY2TW1EQE8AHCbEXAJztzJABoRlEAbarEAQUKo4rEEggBbTDnaUeIFACMAVhEIiO3GgKLC2dCAEcArjH1hsAbVqDibRChABdNrjBgkQ3JwAKdFFTpkCCkoL3QINgo/AKCpPEQAWVwlFDokZmlyKho4I3EFCDp1JE1ePkQAAkQACxh0CvFk1PTeNkhQo05EbAAGNnF4GHE83v7cAA8hkawARjYIcdxxCm4pCx6AOgBWRwBfFxthTNkadEQ0uABzYq45bSERdtxO7t4RBaWV4MsQKFSAd3o5mcIAguXEPz+dEBdGB+3YDmO2V4Zwu1zsJTkAGEUEY4PgYJwKgBJAAij2gzy6NHei2Wqx+PSZACYAMxsnpsjns1lMpyRXCIRCFI4gAB6AAp1gBaACcjgA1ABKAAkIHh/h0cRkyJAqPg6PYmJoAHkKFqKvqrhT0Pg0uaHrwzRarZcKv9avhqhUUAA3QppSD1GoQCoLOrIK4NFA6H0OtCYeZ0r5rEDS6WNFJpcgVZkAelZTl2xeLbBVtuqElwNGqQooWDzeaU6DQ0orVY2qUuebAjCgiGlPQA7Hn240AMTqE68RQqNQY240ABqMbyFQSMaEFXuCZErncOi8vn8hVi2FCnHCLjgZBNUEsoH0xlMEHMWCsFFw6HCcJYj8MJhmJCuCEq+RZ/iAT6AWB74gAA1oS3BwiCUQnoEMDfNIn7fjBoAqvo968OOPbQIMWp5gQOg3KUIDeF+P7qmwoSgW+eEETQxHtGRQjoBRhzUXIABiIFIYx8GIbhID4dAHEkbACDkZRDwLjRADSEnmCWQA==&value=N4IgDghgzlCmAmIBcBtAugXyA===&lib_switcher=&prompt_before_delete&upload=function(a,b,c)%7Bconsole.log(%22Upload%20handler%20required%20for%20upload%20editor%22)%7D&theme=bootstrap2&iconlib=fontawesome4&object_layout=normal&show_errors=interaction) to be taken to a form where you can generate a valid JSON configuration for this option. The actions have these fields:

| field | type | description |
| ----- | ---- | ----------- |
| action | string enum (forward) | The action. Only `forward` is supported.
| to    | snowflake | The discord ID of the channel of the new council
| atMajority? | number | A number between 0-1 that will filter this action from triggering unless the motion resolved with this given majority (optional)
| options? | string | [Motion options](#motion-options)
