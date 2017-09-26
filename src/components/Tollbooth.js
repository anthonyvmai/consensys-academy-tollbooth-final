import React, { Component } from 'react'
import RegulatorContract from '../build/contracts/Regulator.json'
import TollBoothOperatorContract from '../build/contracts/TollBoothOperator.json'
import getWeb3 from '../utils/getWeb3'

import OneFieldSubmit from './OneFieldSubmit.js'
import UnorderedList from './UnorderedList.js'

class Tollbooth extends Component {
	constructor(props) {
		super(props)

		this.state = {
			web3: null,
			regulator: null,
			contractInstance: null,
			operatorOwner: null,
			tollbooth: null,
			exitSecretClear: "",
			exits: [],
			pendings: []
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
                this.setState({ regulator: regulatorInstance, contractInstance: operatorInstance, operatorOwner: accounts[1], tollbooth: accounts[3]})
                this.addSetExitListener(this)
                this.addSetPendingListener(this)
                return
            }).then(() => {
                this.initLogRoadExited(this, this.state.tollbooth, this.state.contractInstance)
                this.initLogPendingPayment(this, this.state.tollbooth, this.state.contractInstance)
            })
        })
	}

    initLogRoadExited(component, address, instance) {
        let eventNew = instance.LogRoadExited({owner: address},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newExits = JSON.parse(JSON.stringify(component.state.exits))
                newExits.push({
                    key: result.args.exitSecretHashed,
                    exitBooth: result.args.exitBooth,
                    exitSecretHashed: result.args.exitSecretHashed,
                    finalFee: result.args.finalFee.toNumber(),
                    refundWeis: result.args.refundWeis.toNumber()
                })
                component.setState({ exits: newExits })
            }
        })
    }

    initLogPendingPayment(component, address, instance) {
        let eventNew = instance.LogPendingPayment({owner: address},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newPendings = JSON.parse(JSON.stringify(component.state.pendings))
                newPendings.push({
                    key: result.args.exitSecretHashed,
                    exitSecretHashed: result.args.exitSecretHashed,
                    entryBooth: result.args.entryBooth,
                    exitBooth: result.args.exitBooth
                })
                component.setState({ pendings: newPendings })
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

    addSetExitListener(component) {
        const updateEvent = this.state.contractInstance.LogRoadExited()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newExits = JSON.parse(JSON.stringify(component.state.exits))
            newExits.push({
                key: result.args.exitSecretHashed,
                exitBooth: result.args.exitBooth,
                exitSecretHashed: result.args.exitSecretHashed,
                finalFee: result.args.finalFee.toNumber(),
                refundWeis: result.args.refundWeis.toNumber()
            })
            component.setState({ exits: newExits })
            console.log("Changed event received Exit, value: " + newExits)
        })
    }

    addSetPendingListener(component) {
        const updateEvent = this.state.contractInstance.LogPendingPayment()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newPendings = JSON.parse(JSON.stringify(component.state.pendings))
            newPendings.push({
                key: result.args.exitSecretHashed,
                exitSecretHashed: result.args.exitSecretHashed,
                entryBooth: result.args.entryBooth,
                exitBooth: result.args.exitBooth
            })
            component.setState({ pendings: newPendings })
            console.log("Changed event received Pending, value: " + newPendings)
        })
    }

	submitExit() {
	    return this.state.contractInstance.reportExitRoad(
            this.state.exitSecretClear,
            {from: this.state.tollbooth, gas: 2000000})
        .then(tx => {
            console.log(tx)
        })
        .catch((err) => {
            console.log(err)
            return alert(err)
        })
    }

    handleChangeExitSecretClear = (e) => {
        this.setState({exitSecretClear: e.target.value})
    }

    renderExitField() {
        return (
            <OneFieldSubmit
                firstName={"exitSecretClear"}
                firstValue={this.state.exitSecretClear}
                onChangeFirst={() => this.handleChangeExitSecretClear}
                onClick={() => this.submitExit()}
            />
        )
    }

    renderExits() {
        const exits = this.state.exits.map((d) =>
                <li>exitBooth: {d.exitBooth}<br/>
                exitSecretHashed: {d.exitSecretHashed}<br/>
                finalFee: {d.finalFee}<br/>
                refundWeis: {d.refundWeis}</li>)
        return (
            <UnorderedList
                listItems={exits}
            />
        )
    }

    renderPendings() {
        const pendings = this.state.pendings.map((d) =>
                <li>exitSecretHashed: {d.exitSecretHashed}<br/>
                entryBooth: {d.entryBooth}<br/>
                exitBooth: {d.exitBooth}</li>)
        return (
            <UnorderedList
                listItems={pendings}
            />
        )
    }

	render() {
		return (
            <div className="App">
                <main className="container">
                    <div className="pure-g">
                        <div className="pure-u-1-1">
                            <h2>Tollbooth</h2>
                            <p>Remember to register this tollbooth address in the operator</p>
                            <p>{"tollbooth accounts[3]: " + this.state.tollbooth}</p>
                            <h3>Exits</h3>
                            {this.renderExitField()}
                            <h4>Completed</h4>
                            {this.renderExits()}
                            <h4>Pending</h4>
                            {this.renderPendings()}
                        </div>
                    </div>
                </main>
            </div>
		)
	}
}

export default Tollbooth
