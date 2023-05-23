import Motion from "./Motion"
// @ts-ignore
import Votum from "./Votum"
import { promises as fs } from "fs"
import path from "path"
import { MotionData } from "./MotionData"
import { MotionResolution } from "./Motion"
import { getCouncil } from "./__mocks__/council"

jest.mock("./Votum", () => jest.fn().mockImplementation(() => ({})))

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
    const foo: MotionData = {
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
    const motion = new Motion(0, foo, {
        //getConfig: () => 0.75
        motionExpiration: 0
    })
    expect(motion.authorId).toBe("")
    expect(motion.authorName).toBe("")
    expect(motion.number).toBe(1)
    expect(motion.isExpired).toBe(false)
    expect(motion.votes).toStrictEqual([])
    expect(motion.createdAt).toBe(0)
    motion.createdAt = 1
    expect(motion.createdAt).toBe(1)
    expect(motion.text).toBe("")
    expect(motion.resolution).toBe(MotionResolution.Unresolved)
    expect(Object.is(motion.getData(), foo))
})
test("Test motion majorities", () => {
    //@ts-ignore
    const motion = new Motion(0, foo, {
        //getConfig: () => 0.75
        getConfig: jest.fn().mockReturnValueOnce(0.75).mockReturnValue(undefined),
    })
    expect(motion.requiredMajority).toBe(0.75)
    expect(motion.requiredMajority).toBe(0.5)
    foo.options = {majority: 1}
    expect(motion.requiredMajority).toBe(1)
    foo.options = undefined
})
describe("Test getReadableMajorities", () => {
    test("Test getReadableMajorities return Unanimous", () => {
        //@ts-ignore
        const motion = new Motion(0, foo, {
            getConfig: jest.fn().mockReturnValue(1),
        })
        expect(motion.getReadableMajority()).toBe("Unanimous")
    })
    test("Test getReadableMajorities return Simple Majority", () => {
        //@ts-ignore
        const motion = new Motion(0, foo, {
            getConfig: jest.fn().mockReturnValue(0.5),
        })
        expect(motion.getReadableMajority()).toBe("Simple majority")
    })
    test("Test getReadableMajorities return fraction of value", () => {
        //@ts-ignore
        const motion = new Motion(0, foo, {
            getConfig: jest.fn().mockReturnValue("0.75"),
        })
        expect(motion.getReadableMajority()).toBe("3/4")
    })
})
describe("Test Resolve", () => {
    //@ts-ignore
    const motion = new Motion(0, foo, getCouncil())
    test("Test Attempt to resolve a resolved motion error", () => {
        //@ts-ignore
        expect(() => {motion.resolve({})}).toThrow(Error)
    })
    test("Test data is active", () => {
        foo.active = true
        //@ts-ignore
        expect(motion.resolve({})).toBe(undefined)
        expect(foo.active).toBe(false)
        expect(foo.resolution).toBe(foo.resolution)
        expect(foo.didExpire).toBe(false)
    })
    
    //mock post message to test it on another set of tests
    motion.postMessage = jest.fn()
    
    test("Test MotionResolution Failed", () =>{
        foo.active = true
        motion.council.setConfig("onFailedAnnounce", "foo")
        const motionResolve = MotionResolution.Failed
        motion.resolve(motionResolve)
        expect(motion.council.isUserOnCooldown(foo.authorId)).toBe(false)
        expect(foo.active).toBe(false)
    })
    test("Test MotionResolution Passed", () =>{
        foo.active = true
        motion.council.setConfig("onPassedAnnounce", "foo")
        const motionResolve = MotionResolution.Passed
        motion.resolve(motionResolve)
        expect(motion.council.isUserOnCooldown(foo.authorId)).toBe(false)
        expect(foo.active).toBe(false)
    })

    test("Test MotionResolution Killed", () =>{
        foo.active = true
        motion.council.setConfig("onKilledAnnounce", "foo")
        const motionResolve = MotionResolution.Killed
        motion.resolve(motionResolve)
        expect(motion.council.isUserOnCooldown(foo.authorId)).toBe(false)
        expect(foo.active).toBe(false)
    })

    test("Test actions", () =>{
        foo.active = true
        motion.council.setConfig("onFinishActions", 
        {
            failed: [{action: "forward", atMajority: 1, options: undefined, to: 123}], 
            passed: false, 
            killed: false
        })
        motion.council.setConfig("onFailedAnnounce", "foo")
        var motionResolve = MotionResolution.Failed
        motion.resolve(motionResolve)

        foo.active = true
        motion.council.setConfig("onFinishActions", {failed: false, passed: true, killed: false})
        motion.council.setConfig("onPassedAnnounce", "foo")
        motionResolve = MotionResolution.Passed
        motion.resolve(motionResolve)

        foo.deliberationChannelId = "s"
        motion.council.setConfig("keepTranscripts", true)
        foo.active = true
        motion.council.setConfig("onFinishActions", {failed: false, passed: false, killed: true})
        motion.council.setConfig("onKilledAnnounce", "foo")
        motionResolve = MotionResolution.Killed
        motion.resolve(motionResolve)
        expect(foo.active).toBe(false)
        expect(foo.deliberationChannelId).toBe("s")
    })
})

describe("Test motion votes", () =>{
    //@ts-ignore
    const motion = new Motion(0, foo, getCouncil())
    test("Test getVotes", () =>{
        const votes = motion.getVotes()
        expect(votes).toStrictEqual({"abs": 0, "dictatorVoted": false, "no": 0, "toPass": 2, "yes": 0})
    })
    test("Test getRemainingVoters", () =>{
        const remainingVoters = motion.getRemainingVoters()
        //users from the council mock that have not voted
        const expected = [
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
        foo.active = true
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