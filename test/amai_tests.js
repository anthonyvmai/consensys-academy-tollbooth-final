Promise = require("bluebird")
const toBytes32 = require("../utils/toBytes32.js");
const randomIntIn = require("../utils/randomIntIn.js");

if (typeof web3.eth.getAccountsPromise === "undefined") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" })
}

const Regulator = artifacts.require("./Regulator.sol")
const TollBoothOperator = artifacts.require("./TollBoothOperator.sol")

contract('TollBoothOperator', accounts => {

    describe("amai tests", () => {

        let owner0, owner1,
            booth0, booth1,
            vehicle0, vehicle1,
            regulator, operator
        const deposit = randomIntIn(2, 1000)
        const diff = randomIntIn(1, deposit - 1)
        const vehicleType = randomIntIn(1, 1000)
        const multiplier = randomIntIn(1, 1000)
        const tmpSecret = randomIntIn(1, 1000)
        const secret0 = toBytes32(tmpSecret)
        const secret1 = toBytes32(tmpSecret + randomIntIn(1, 1000))
        let hashed0, hashed1

        before("should prepare", () => {
            assert.isAtLeast(accounts.length, 8)
            owner0 = accounts[0]
            owner1 = accounts[1]
            booth0 = accounts[2]
            booth1 = accounts[3]
            vehicle0 = accounts[4]
            vehicle1 = accounts[5]
            return web3.eth.getBalancePromise(owner0)
                .then(balance => assert.isAtLeast(web3.fromWei(balance).toNumber(), 10))
        })

        let vehicle0BeforeBalance, vehicle1BeforeBalance

        beforeEach("setup", () => {
            return Regulator.new({ from: owner0 })
                .then(instance => regulator = instance)
                .then(() => regulator.setVehicleType(vehicle0, vehicleType, { from: owner0 }))
                .then(() => regulator.setVehicleType(vehicle1, vehicleType, { from: owner0 }))
                .then(() => regulator.createNewOperator(owner1, deposit, { from: owner0 }))
                .then(tx => operator = TollBoothOperator.at(tx.logs[1].args.newOperator))
                .then(() => operator.addTollBooth(booth0, { from: owner1 }))
                .then(() => operator.addTollBooth(booth1, { from: owner1 }))
                .then(() => operator.setMultiplier(vehicleType, multiplier, { from: owner1 }))
                .then(() => operator.setPaused(false, { from: owner1 }))
                .then(() => operator.hashSecret(secret0))
                .then(hash => hashed0 = hash)
                .then(() => operator.hashSecret(secret1))
                .then(hash => hashed1 = hash)
        })

        it("should handle Scenario 1", () => {
            return operator.setRoutePrice(booth0, booth1, deposit, { from: owner1 })
                .then(() => operator.enterRoad(booth0, hashed0, { from: vehicle0, value: deposit * multiplier }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(balance => vehicle0BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(vehicle0AfterBalance => assert.deepEqual(vehicle0AfterBalance, vehicle0BeforeBalance))
                .then(() => operator.getCollectedFeesAmount())
                .then(fees => assert.deepEqual(fees.toNumber(), deposit * multiplier))
        })

        it("should handle Scenario 2", () => {
            return operator.setRoutePrice(booth0, booth1, deposit + diff, { from: owner1 })
                .then(() => operator.enterRoad(booth0, hashed0, { from: vehicle0, value: deposit * multiplier }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(balance => vehicle0BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(vehicle0AfterBalance => assert.deepEqual(vehicle0AfterBalance, vehicle0BeforeBalance))
                .then(() => operator.getCollectedFeesAmount())
                .then(fees => assert.deepEqual(fees.toNumber(), deposit * multiplier))
        })

        it("should handle Scenario 3", () => {
            return operator.setRoutePrice(booth0, booth1, deposit - diff, { from: owner1 })
                .then(() => operator.enterRoad(booth0, hashed0, { from: vehicle0, value: deposit * multiplier }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(balance => vehicle0BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(vehicle0AfterBalance => assert.deepEqual(vehicle0AfterBalance.minus(vehicle0BeforeBalance).toNumber(), diff * multiplier))
                .then(() => operator.getCollectedFeesAmount())
                .then(fees => assert.deepEqual(fees.toNumber(), (deposit - diff) * multiplier))
        })

        it("should handle Scenario 4", () => {
            return operator.setRoutePrice(booth0, booth1, deposit, { from: owner1 })
                .then(() => operator.enterRoad(booth0, hashed0, { from: vehicle0, value: (deposit + diff) * multiplier }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(balance => vehicle0BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(vehicle0AfterBalance => assert.deepEqual(vehicle0AfterBalance.minus(vehicle0BeforeBalance).toNumber(), diff * multiplier))
                .then(() => operator.getCollectedFeesAmount())
                .then(fees => assert.deepEqual(fees.toNumber(), deposit * multiplier))
        })

        it("should handle Scenario 5", () => {
            return operator.enterRoad(booth0, hashed0, { from: vehicle0, value: deposit * multiplier })
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(balance => vehicle0BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
                .then(() => operator.setRoutePrice(booth0, booth1, deposit - diff, { from: owner1 }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(vehicle0AfterBalance => assert.deepEqual(vehicle0AfterBalance.minus(vehicle0BeforeBalance).toNumber(), diff * multiplier))
                .then(() => operator.getCollectedFeesAmount())
                .then(fees => assert.deepEqual(fees.toNumber(), (deposit - diff) * multiplier))
        })

        it("should handle Scenario 6", () => {
            return operator.enterRoad(booth0, hashed0, { from: vehicle0, value: (deposit + diff) * multiplier })
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(balance => vehicle0BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret0, { from: booth1 }))
                .then(() => operator.enterRoad(booth0, hashed1, { from: vehicle1, value: deposit * multiplier }))
                .then(() => web3.eth.getBalancePromise(vehicle1))
                .then(balance => vehicle1BeforeBalance = balance)
                .then(() => operator.reportExitRoad(secret1, { from: booth1 }))
                .then(() => operator.setRoutePrice(booth0, booth1, deposit - diff, { from: owner1 }))
                .then(() => web3.eth.getBalancePromise(vehicle0))
                .then(vehicle0AfterBalance => assert.deepEqual(vehicle0AfterBalance.minus(vehicle0BeforeBalance).toNumber(), 2 * diff * multiplier))
                .then(() => operator.clearSomePendingPayments(booth0, booth1, 1))
                .then(() => web3.eth.getBalancePromise(vehicle1))
                .then(vehicle1AfterBalance => assert.deepEqual(vehicle1AfterBalance.minus(vehicle1BeforeBalance).toNumber(), diff * multiplier))
                .then(() => operator.getCollectedFeesAmount())
                .then(fees => assert.deepEqual(fees.toNumber(), 2 * (deposit - diff) * multiplier))
        })
    })
})
