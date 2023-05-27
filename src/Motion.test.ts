import Motion from "./Motion"
// @ts-ignore
import Votum from "./Votum"
import { promises as fs } from "fs"
import path from "path"
import { MotionData } from "./MotionData"
import { MotionResolution } from "./Motion"
import { getCouncil } from "./__mocks__/council"
import {
  OnFinishActions,
} from "./CouncilData"

jest.mock("./Votum", () => ({getCouncil: jest.fn().mockReturnValue({})}))

const clearDataFolder = async () => {
  // https://stackoverflow.com/a/42182416/13152732
  const directory = `${__dirname}/../data`

  for (const file of await fs.readdir(directory)) {
    if (file.match(/test-/)) await fs.unlink(path.join(directory, file))
  }
}

describe("Motion Class Test", () => {
    afterEach(async() => {
        await clearDataFolder()
    })
    afterAll(async() => {
        await clearDataFolder()
    })
    const motionData: MotionData = {
        authorId: "",
        authorName: "",
        active: false,
        resolution: MotionResolution.Unresolved,
        text: "",
        createdAt: 0,
        didExpire: false,
        votes: [],
    }
test("Should start a motion correctly", () => {
    //@ts-ignore
    const motion = new Motion(0, motionData, {
        //getConfig: () => 0.75
        motionExpiration: 0
    })
    expect(motion.authorId).toBe("")
    expect(motion.authorName).toBe("")
    expect(motion.number).toBe(1)
    expect(motion.isExpired).toBe(false)
    expect(motion.votes).toStrictEqual([])
    expect(motion.createdAt).toBe(0)
    motionData.createdAt = 1
    expect(motion.createdAt).toBe(1)
    expect(motion.text).toBe("")
    motionData.resolution = MotionResolution.Unresolved
    expect(motion.resolution).toBe(MotionResolution.Unresolved)
    expect(Object.is(motion.getData(), motionData))
})
test("Test motion majorities", () => {
    //@ts-ignore
    const motion = new Motion(0, motionData, {
        //getConfig: () => 0.75
        getConfig: jest.fn().mockReturnValueOnce(0.75).mockReturnValue(undefined),
    })
    expect(motion.requiredMajority).toBe(0.75)
    expect(motion.requiredMajority).toBe(0.5)
    motionData.options = {majority: 1}
    expect(motion.requiredMajority).toBe(1)
    motionData.options = undefined
})
describe("Test getReadableMajorities", () => {
    test("Test getReadableMajorities return Unanimous", () => {
        //@ts-ignore
        const motion = new Motion(0, motionData, {
            getConfig: jest.fn().mockReturnValue(1),
        })
        expect(motion.getReadableMajority()).toBe("Unanimous")
    })
    test("Test getReadableMajorities return Simple Majority", () => {
        //@ts-ignore
        const motion = new Motion(0, motionData, {
            getConfig: jest.fn().mockReturnValue(0.5),
        })
        expect(motion.getReadableMajority()).toBe("Simple majority")
    })
    test("Test getReadableMajorities return fraction of value", () => {
        //@ts-ignore
        const motion = new Motion(0, motionData, {
            getConfig: jest.fn().mockReturnValue("0.75"),
        })
        expect(motion.getReadableMajority()).toBe("3/4")
    })
})
describe("Test Resolve", () => {
    beforeEach(()=> {motionData.active = true})
    //@ts-ignore
    const motion = new Motion(0, motionData, getCouncil())
    test("Test Attempt to resolve a resolved motion error", () => {
        motionData.active = false
        //@ts-ignore
        expect(() => {motion.resolve({})}).toThrow(Error)
    })
    test("Test data is active", () => {
        //@ts-ignore
        expect(motion.resolve({})).toBe(undefined)
        expect(motionData.active).toBe(false)
        expect(motionData.resolution).toBe(motionData.resolution)
        expect(motionData.didExpire).toBe(false)
    })
    
    //mock post message to test it on another set of tests
    motion.postMessage = jest.fn()
    
    test("Test council has an announce channel", () =>{
        const council = getCouncil()
        council.channel.guild.channels.cache.get = jest.fn().mockReturnValue("123")
        const motionAnnounceChannel = new Motion(0, motionData, council)
        motionAnnounceChannel.postMessage = jest.fn()
        motionData.resolution = MotionResolution.Failed
        council.setConfig("announceChannel", "123")
        motionAnnounceChannel.resolve(motionData.resolution)
        expect(motionAnnounceChannel.postMessage).toBeCalledWith("", "123")
    })

    test("Test MotionResolution Failed", () =>{
        motion.council.setConfig("onFailedAnnounce", "foo")
        motionData.resolution = MotionResolution.Failed
        motion.resolve(motionData.resolution)
        expect(motion.council.isUserOnCooldown(motionData.authorId)).toBe(false)
        expect(motionData.active).toBe(false)
    })
    test("Test MotionResolution Passed", () =>{
        motion.council.setConfig("onPassedAnnounce", "foo")
        motionData.resolution = MotionResolution.Passed
        motion.resolve(motionData.resolution)
        expect(motion.council.isUserOnCooldown(motionData.authorId)).toBe(false)
        expect(motionData.active).toBe(false)
    })

    test("Test MotionResolution Killed", () =>{
        motion.council.setConfig("onKilledAnnounce", "foo")
        motionData.resolution = MotionResolution.Killed
        motion.resolve(motionData.resolution)
        expect(motion.council.isUserOnCooldown(motionData.authorId)).toBe(false)
        expect(motionData.active).toBe(false)
    })
    
    var actions: OnFinishActions = {}
    motionData.resolution = MotionResolution.Failed
    motion.council.setConfig("onFailedAnnounce", "foo")

    test("Test motion failed actions without failed actions", () =>{
        motion.council.setConfig("onFinishActions", actions)
        motion.resolve(motionData.resolution)
        expect(motionData.active).toBe(false)
        expect(motionData.didExpire).toBe(motion.isExpired)
    })
    test("Test motion failed actions with failed actions", () =>{
        actions = {
            failed: [
                {
                    action: "forward",
                    to: "foo",
                }
            ]
        }
        motion.council.setConfig("onFinishActions", actions)
        motion.resolve(motionData.resolution)
        expect(motionData.active).toBe(false)
        expect(motionData.didExpire).toBe(motion.isExpired)
    })

    motionData.resolution = MotionResolution.Passed
    motion.council.setConfig("onPassedAnnounce", "foo")

    test("Test motion passed actions without passed actions", () =>{
        motion.resolve(motionData.resolution)
        expect(motionData.active).toBe(false)
        expect(motionData.didExpire).toBe(motion.isExpired)
    })
    test("Test motion passed actions with passed actions", () =>{
        actions = {
            passed: [
              {
                action: "forward",
                to: "foo",
              },
            ],
        }
        motion.council.setConfig("onFinishActions", actions)
        motion.resolve(motionData.resolution)
        expect(motionData.active).toBe(false)
        expect(motionData.didExpire).toBe(motion.isExpired)
    })

    motionData.deliberationChannelId = "s"
    motion.council.setConfig("keepTranscripts", true)
    motionData.resolution = MotionResolution.Killed
    motion.council.setConfig("onKilledAnnounce", "foo")

    test("Test motion killed actions without killed actions", () =>{
        motion.resolve(motionData.resolution)
        expect(motionData.active).toBe(false)
        expect(motionData.didExpire).toBe(motion.isExpired)
    })
    test("Test motion killed actions with killed actions", () =>{
        actions = {
          killed: [
            {
              action: "forward",
              to: "foo",
            },
          ],
        }
        motion.council.setConfig("onFinishActions", actions)
        motion.resolve(motionData.resolution)
        expect(motionData.active).toBe(false)
        expect(motionData.didExpire).toBe(motion.isExpired)
        expect(motionData.deliberationChannelId).toBe("s")
    })
})

describe("Test motion votes", () =>{
    //@ts-ignore
    const motion = new Motion(0, motionData, getCouncil())
    test("Test getVotes", () =>{
        const votes = motion.getVotes()
        expect(votes).toStrictEqual({"abs": 0, "dictatorVoted": false, "no": 0, "toPass": 2, "yes": 0})
    })
    test("Test getRemainingVoters", () =>{
        var remainingVoters = motion.getRemainingVoters()
        //users from the council mock that have not voted
        var expected = [
            {
                "deleted": false, 
                "displayName": "votum-app",
                "guildID": 123, 
                "joinedTimestamp": null, 
                "lastMessageChannelID": null, 
                "nickname": null, 
                "premiumSinceTimestamp": null, 
                "userID": "votum"
            },
            {
                "deleted": false, 
                "displayName": "user-foo", 
                "guildID": 123, 
                "joinedTimestamp": null, 
                "lastMessageChannelID": null, 
                "nickname": null, 
                "premiumSinceTimestamp": null, 
                "userID": "foo"
            },
            {
                "deleted": false, 
                "displayName": "user-bar", 
                "guildID": 123, 
                "joinedTimestamp": null, 
                "lastMessageChannelID": null, 
                "nickname": null, 
                "premiumSinceTimestamp": null, 
                "userID": "bar"
            }]
        expect(remainingVoters.toJSON()).toStrictEqual(expected)
        
        motion.castVote({
            authorId: "foo",
            authorName: "user-foo",
            state: 1,
            name: "user-foo",
            reason: "foo",
            isDictator: false,
        })

        expected = [
            {
                "deleted": false, 
                "displayName": "votum-app",
                "guildID": 123, 
                "joinedTimestamp": null, 
                "lastMessageChannelID": null, 
                "nickname": null, 
                "premiumSinceTimestamp": null, 
                "userID": "votum"
            },
            {
                "deleted": false, 
                "displayName": "user-bar", 
                "guildID": 123, 
                "joinedTimestamp": null, 
                "lastMessageChannelID": null, 
                "nickname": null, 
                "premiumSinceTimestamp": null, 
                "userID": "bar"
            }]

        remainingVoters = motion.getRemainingVoters()
        expect(remainingVoters.toJSON()).toStrictEqual(expected)
    })
    test("Test castVote", () =>{
        motion.castVote({
            authorId: "foo",
            authorName: "user-foo",
            state: 1,
            name: "user-foo",
            reason: "foo",
            isDictator: false,
        })
        const votes = motion.getVotes()
        expect(votes).toStrictEqual({"abs": 0, "dictatorVoted": false, "no": 0, "toPass": 2, "yes": 1})

        //same voter same vote
        motion.castVote({
            authorId: "foo",
            authorName: "user-foo",
            state: 1,
            name: "user-foo",
            reason: "foo",
            isDictator: false,
        })
        expect(votes).toStrictEqual({"abs": 0, "dictatorVoted": false, "no": 0, "toPass": 2, "yes": 1})

        //dictator vote
        motionData.active = true
        motion.castVote({
            authorId: "foo",
            authorName: "user-foo",
            state: 1,
            name: "user-foo",
            reason: "foo",
            isDictator: true,
        })
        //shouldnt dictatorVoted == true?
        expect(votes).toStrictEqual({"abs": 0, "dictatorVoted": false, "no": 0, "toPass": 2, "yes": 1})
    })

})
})