require('bluebird').promisifyAll(web3.eth, { suffix: "Promise" })

let Regulator = artifacts.require("./Regulator.sol");
let TollBoothOperator = artifacts.require("./TollBoothOperator.sol")

module.exports = function(deployer, network, accounts) {
    const deposit = 100
    let newOperator
    deployer.deploy(Regulator, {from: accounts[0]})
    deployer.then(() => {
        return Regulator.deployed()
    }).then(theRegulator => {
        return theRegulator.createNewOperator(accounts[1], deposit, {from: accounts[0]})
    }).then(tx => {
        let operatorAddress = tx.logs[1].args.newOperator
        console.log(operatorAddress)
        return TollBoothOperator.at(operatorAddress).setPaused(false, {from: accounts[1]})
    })
}
