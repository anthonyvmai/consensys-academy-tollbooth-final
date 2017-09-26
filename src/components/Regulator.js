import React, { Component } from 'react'
import RegulatorContract from '../build/contracts/Regulator.json'
import getWeb3 from '../utils/getWeb3'

import TwoFieldSubmit from './TwoFieldSubmit.js'
import UnorderedList from './UnorderedList.js'

class Regulator extends Component {
	constructor(props) {
		super(props)

		this.state = {
			web3: null,
			contractInstance: null,
			regulatorOwner: null,
			vehicleAddress: "",
			vehicleType: "",
			vehicles: [],
			owner: "",
			deposit: "",
			operators: []
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

		this.state.web3.eth.getAccounts((error, accounts) => {
			regulator.deployed().then(instance => {
                this.setState({ contractInstance: instance, regulatorOwner: accounts[0]})
                this.addSetVehicleListener(this)
                this.addSetOperatorListener(this)
                this.initLogVehicleTypeSet(this, this.state.regulatorOwner, this.state.contractInstance)
                this.initLogTollBoothOperatorCreated(this, this.state.regulatorOwner, this.state.contractInstance)
                return
			})
		})
	}

    initLogVehicleTypeSet(component, address, instance) {
        let eventNew = instance.LogVehicleTypeSet({owner: address},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newVehicles = JSON.parse(JSON.stringify(component.state.vehicles))
                newVehicles.push({
                    key: result.args.vehicle,
                    sender: result.args.sender,
                    vehicle: result.args.vehicle,
                    vehicleType: result.args.vehicleType.toNumber()
                })
                component.setState({ vehicles: newVehicles })
            }
        })
    }

    initLogTollBoothOperatorCreated(component, address, instance) {
        let eventNew = instance.LogTollBoothOperatorCreated({},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newOperators = JSON.parse(JSON.stringify(component.state.operators))
                newOperators.push({
                    key: result.args.newOperator,
                    sender: result.args.sender,
                    newOperator: result.args.newOperator,
                    owner: result.args.owner,
                    depositWeis: result.args.depositWeis.toNumber()
                })
                component.setState({ operators: newOperators })
            }
        })
    }

    addSetVehicleListener(component) {
        const updateEvent = this.state.contractInstance.LogVehicleTypeSet()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newVehicles = JSON.parse(JSON.stringify(component.state.vehicles))
            newVehicles.push({
                key: result.args.vehicle,
                sender: result.args.sender,
                vehicle: result.args.vehicle,
                vehicleType: result.args.vehicleType.toNumber()
            })
            component.setState({ vehicles: newVehicles })
            console.log("Changed event received Vehicle, value: " + newVehicles)
        })
    }

    addSetOperatorListener(component) {
        const updateEvent = this.state.contractInstance.LogTollBoothOperatorCreated()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newOperators = JSON.parse(JSON.stringify(component.state.operators))
            newOperators.push({
                key: result.args.newOperator,
                sender: result.args.sender,
                newOperator: result.args.newOperator,
                owner: result.args.owner,
                depositWeis: result.args.depositWeis.toNumber()
            })
            component.setState({ operators: newOperators })
            console.log("Changed event received Operator, value: " + newOperators)
        })
    }

	submitVehicleType() {
	    return this.state.contractInstance.setVehicleType(
            this.state.vehicleAddress,
            this.state.vehicleType,
            {from: this.state.regulatorOwner})
        .catch((err) => {
            return alert(err)
        })
    }

	submitOperator() {
	    return this.state.contractInstance.createNewOperator(
            this.state.owner,
            this.state.deposit,
            {from: this.state.regulatorOwner, gas: 2000000})
        .catch((err) => {
            return alert(err)
        })
    }

    handleChangeAddress = (e) => {
        this.setState({vehicleAddress: e.target.value})
    }

    handleChangeType = (e) => {
        this.setState({vehicleType: parseInt(e.target.value, 10)})
    }

    handleChangeOwner = (e) => {
        this.setState({owner: e.target.value})
    }

    handleChangeDeposit = (e) => {
        this.setState({deposit: parseInt(e.target.value, 10)})
    }

    renderVehicleTypeField() {
        return (
            <TwoFieldSubmit
                firstName={"address"}
                firstValue={this.state.vehicleAddress}
                secondName={"type"}
                secondValue={this.state.vehicleType}
                onChangeFirst={() => this.handleChangeAddress}
                onChangeSecond={() => this.handleChangeType}
                onClick={() => this.submitVehicleType()}
            />
        )
    }

    renderOperatorField() {
        return (
            <TwoFieldSubmit
                firstName={"owner"}
                firstValue={this.state.owner}
                secondName={"deposit"}
                secondValue={this.state.deposit}
                onChangeFirst={() => this.handleChangeOwner}
                onChangeSecond={() => this.handleChangeDeposit}
                onClick={() => this.submitOperator()}
            />
        )
    }

    renderVehicles () {
        const vehicles = this.state.vehicles.map((d, i) =>
                <li key={i}>sender: {d.sender}<br/>
                vehicle: {d.vehicle}<br/>
                type: {d.vehicleType}</li>)
        return (
            <UnorderedList
                listItems={vehicles}
            />
        )
    }

    renderOperators () {
        const operators = this.state.operators.map((d, i) =>
                <li key={i}>sender: {d.sender}<br/>
                newOperator: {d.newOperator}<br/>
                owner: {d.owner}<br/>
                depositWeis: {d.depositWeis}</li>)
        return (
            <UnorderedList
                listItems={operators}
            />
        )
    }

	render() {
		return (
            <div className="App">
                <main className="container">
                    <div className="pure-g">
                        <div className="pure-u-1-1">
                            <h2>Regulator</h2>
                            <p>{"owner accounts[0]: " + this.state.regulatorOwner}</p>
                            <h3>Operators</h3>
                            {this.renderOperatorField()}
                            {this.renderOperators()}
                            <h3>Vehicles</h3>
                            {this.renderVehicleTypeField()}
                            {this.renderVehicles()}
                        </div>
                    </div>
                </main>
            </div>
		)
	}
}

export default Regulator
