import React, { Component } from 'react'
import RegulatorContract from '../build/contracts/Regulator.json'
import TollBoothOperatorContract from '../build/contracts/TollBoothOperator.json'
import getWeb3 from '../utils/getWeb3'

import OneFieldSubmit from './OneFieldSubmit.js'
import ThreeFieldSubmit from './ThreeFieldSubmit.js'
import UnorderedList from './UnorderedList.js'

class Vehicle extends Component {
	constructor(props) {
		super(props)

		this.state = {
			web3: null,
			regulator: null,
			contractInstance: null,
			operatorOwner: null,
			vehicle: null,
			entryBooth: "",
			hashMe: "",
			hashed: "",
			exitSecretHashed: "",
			depositedWeis: "",
			enters: [],
			balance: "",
			secrets: [],
			exits: []
		}
	}

	componentWillMount() {
		getWeb3
		.then(results => {
			this.setState({
				web3: results.web3
			})

			this.instantiateContract()
		})
		.catch(() => {
			console.log('Error finding web3.')
		})
	}

	instantiateContract() {
		const contract = require('truffle-contract')
		const regulator = contract(RegulatorContract)
		regulator.setProvider(this.state.web3.currentProvider)

        let regulatorInstance
		const operator = contract(TollBoothOperatorContract)
		operator.setProvider(this.state.web3.currentProvider)

		this.state.web3.eth.getAccounts((error, accounts) => {
			regulator.deployed().then(instance => {
			    regulatorInstance = instance
			    return this.getOperatorAddress(accounts[1], regulatorInstance)
            }).then(operatorAddress => {
                return operator.at(operatorAddress)
            }).then(operatorInstance => {
                this.setState({ regulator: regulatorInstance, contractInstance: operatorInstance, operatorOwner: accounts[1], vehicle: accounts[2]})
                this.addSetEnterListener(this)
                return
            }).then(() => {
                this.setState({ balance: this.state.web3.eth.getBalance(accounts[2]).toString(10) })
                this.initLogRoadEntered(this, this.state.vehicle, this.state.contractInstance)
                this.initLogRoadExited(this, this.state.vehicle, this.state.contractInstance)
            })
        })
	}

    initLogRoadEntered(component, address, instance) {
        let eventNew = instance.LogRoadEntered({owner: component.state.vehicle},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newEnters = JSON.parse(JSON.stringify(component.state.enters))
                newEnters.push({
                    key: result.args.vehicle,
                    vehicle: result.args.vehicle,
                    entryBooth: result.args.entryBooth,
                    exitSecretHashed: result.args.exitSecretHashed,
                    depositedWeis: result.args.depositedWeis.toNumber()
                })
                let newSecrets = JSON.parse(JSON.stringify(component.state.secrets))
                newSecrets.push(result.args.exitSecretHashed)
                component.setState({ enters: newEnters, secrets: newSecrets })
            }
        })
    }

    initLogRoadExited(component, address, instance) {
        let eventNew = instance.LogRoadExited({owner: component.state.vehicle},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newExits = JSON.parse(JSON.stringify(component.state.exits))
                if (component.state.secrets.indexOf(result.args.exitSecretHashed) >= 0) {
                    newExits.push({
                        key: result.args.exitSecretHashed,
                        exitBooth: result.args.exitBooth,
                        exitSecretHashed: result.args.exitSecretHashed,
                        finalFee: result.args.finalFee.toNumber(),
                        refundWeis: result.args.refundWeis.toNumber()
                    })
                    component.setState({ exits: newExits })
                }
            }
        })
    }

    getOperatorAddress(address, instance){
        return new Promise(function(resolve, reject){
            let eventNewOperator = instance.LogTollBoothOperatorCreated({owner: address},{fromBlock: 0, toBlock: 'latest'})
            eventNewOperator.get(function(err, result) {
                if (err) {
                    console.log(err)
                    return
                }
                let operatorContractAddress = result[0].args.newOperator
                resolve(operatorContractAddress)
            })
        })
    }

    addSetEnterListener(component) {
        const updateEvent = this.state.contractInstance.LogRoadEntered()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newEnters = JSON.parse(JSON.stringify(component.state.enters))
            newEnters.push({
                key: result.args.vehicle,
                vehicle: result.args.vehicle,
                entryBooth: result.args.entryBooth,
                exitSecretHashed: result.args.exitSecretHashed,
                depositedWeis: result.args.depositedWeis.toNumber()
            })
            let newSecrets = JSON.parse(JSON.stringify(component.state.secrets))
            newSecrets.push(result.args.exitSecretHashed)
            component.setState({ enters: newEnters, secrets: newSecrets })
            component.setState({ balance: component.state.web3.eth.getBalance(component.state.vehicle).toString(10) })
            console.log("Changed event received Enter, value: " + newEnters)
        })
    }

    addSetExitListener(component) {
        const updateEvent = this.state.contractInstance.LogRoadExited()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            if (component.state.secrets.indexOf(result.args.exitSecretHashed) >= 0) {
                let newExits = JSON.parse(JSON.stringify(component.state.exits))
                newExits.push({
                    key: result.args.exitSecretHashed,
                    exitBooth: result.args.exitBooth,
                    exitSecretHashed: result.args.exitSecretHashed,
                    finalFee: result.args.finalFee.toNumber(),
                    refundWeis: result.args.refundWeis.toNumber()
                })
                component.setState({ exits: newExits })
                console.log("Changed event received Exit (this vehicle), value: " + newExits)
            } else {
                console.log("Changed event received Exit (different vehicle)")
            }
        })
    }

	submitEnter() {
	    return this.state.contractInstance.enterRoad(
            this.state.entryBooth,
            this.state.exitSecretHashed,
            {from: this.state.vehicle, value: this.state.depositedWeis, gas: 2000000})
        .then(() => {
            let newSecrets = JSON.parse(JSON.stringify(this.state.secrets))
            newSecrets.push(this.state.exitSecretHashed)
        })
        .catch((err) => {
            console.log(err)
            return alert(err)
        })
    }

	submitHashMe() {
	    return this.state.contractInstance.hashSecret(this.state.hashMe)
	    .then(h => {
	        this.setState({ hashed: h})
        })
        .catch((err) => {
            console.log(err)
            return alert(err)
        })
    }

    handleChangeHashMe = (e) => {
        this.setState({hashMe: e.target.value})
    }

    handleChangeEntryBooth = (e) => {
        this.setState({entryBooth: e.target.value})
    }

    handleChangeExitSecretHashed = (e) => {
        this.setState({exitSecretHashed: e.target.value})
    }

    handleChangeDepositedWeis = (e) => {
        this.setState({depositedWeis: parseInt(e.target.value, 10)})
    }

    renderHashMe() {
        return (
            <OneFieldSubmit
                firstName={"exitSecretClear"}
                firstValue={this.state.hashMe}
                onChangeFirst={() => this.handleChangeHashMe}
                onClick={() => this.submitHashMe()}
            />
        )
    }

    renderEnterField() {
        return (
            <ThreeFieldSubmit
                firstName={"entryBooth"}
                firstValue={this.state.entryBooth}
                onChangeFirst={() => this.handleChangeEntryBooth}
                secondName={"exitSecretHashed"}
                secondValue={this.state.exitSecretHashed}
                onChangeSecond={() => this.handleChangeExitSecretHashed}
                thirdName={"depositedWeis"}
                thirdValue={this.state.depositedWeis}
                onChangeThird={() => this.handleChangeDepositedWeis}
                onClick={() => this.submitEnter()}
            />
        )
    }

    renderEnters() {
        const enters = this.state.enters.map((d, i) =>
                <li key={i}>vehicle: {d.vehicle}<br/>
                entryBooth: {d.entryBooth}<br/>
                exitSecretHashed: {d.exitSecretHashed}<br/>
                depositedWeis: {d.depositedWeis}</li>)
        return (
            <UnorderedList
                listItems={enters}
            />
        )
    }

    renderExits() {
        const exits = this.state.exits.map((d, i) =>
                <li key={i}>exitBooth: {d.exitBooth}<br/>
                exitSecretHashed: {d.exitSecretHashed}<br/>
                finalFee: {d.finalFee}<br/>
                refundWeis: {d.refundWeis}</li>)
        return (
            <UnorderedList
                listItems={exits}
            />
        )
    }

	render() {
		return (
            <div className="App">
                <main className="container">
                    <div className="pure-g">
                        <div className="pure-u-1-1">
                            <h2>Vehicle</h2>
                            <p>Remember to set vehicleType, set multiplier, register entryBooth</p>
                            <p>{"vehicle accounts[2]: " + this.state.vehicle}</p>
                            <h3>Balance</h3>
                            {this.state.balance}
                            <h3>Hash</h3>
                            {this.renderHashMe()}
                            {this.state.hashed}
                            <h3>Enters</h3>
                            {this.renderEnterField()}
                            {this.renderEnters()}
                            <h3>Exits</h3>
                            {this.renderExits()}
                        </div>
                    </div>
                </main>
            </div>
		)
	}
}

export default Vehicle
