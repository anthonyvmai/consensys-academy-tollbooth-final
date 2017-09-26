import React, { Component } from 'react'
import RegulatorContract from '../build/contracts/Regulator.json'
import TollBoothOperatorContract from '../build/contracts/TollBoothOperator.json'
import getWeb3 from '../utils/getWeb3'

import OneFieldSubmit from './OneFieldSubmit.js'
import TwoFieldSubmit from './TwoFieldSubmit.js'
import ThreeFieldSubmit from './ThreeFieldSubmit.js'
import UnorderedList from './UnorderedList.js'

class Operator extends Component {
    constructor(props) {
        super(props)

        this.state = {
            web3: null,
            contractInstance: null,
            operatorOwner: null,
            tollboothAddress: "",
            tollbooths: [],
            entryBooth: "",
            exitBooth: "",
            priceWeis: "",
            routePrices: [],
            vehicleType: "",
            multiplier: "",
            multipliers: []
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
                this.setState({ contractInstance: operatorInstance, operatorOwner: accounts[1]})
                this.addSetTollboothListener(this)
                this.addSetRoutePriceListener(this)
                this.addSetMultiplierListener(this)
                this.initLogTollBoothAdded(this, this.state.operatorOwner, this.state.contractInstance)
                this.initLogRoutePriceSet(this, this.state.operatorOwner, this.state.contractInstance)
                this.initLogMultiplierSet(this, this.state.operatorOwner, this.state.contractInstance)
            })
        })
    }

    getOperatorAddress(address, instance) {
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

    initLogTollBoothAdded(component, address, instance) {
        let eventNew = instance.LogTollBoothAdded({owner: address},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newTollbooths = JSON.parse(JSON.stringify(component.state.tollbooths))
                newTollbooths.push({
                    key: result.args.tollBooth,
                    sender: result.args.sender,
                    tollBooth: result.args.tollBooth
                })
                component.setState({ tollbooths: newTollbooths })
            }
        })
    }

    initLogRoutePriceSet(component, address, instance) {
        let eventNew = instance.LogRoutePriceSet({owner: address},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newRoutePrices = JSON.parse(JSON.stringify(component.state.routePrices))
                newRoutePrices.push({
                    key: result.args.entryBooth,
                    sender: result.args.sender,
                    entryBooth: result.args.entryBooth,
                    exitBooth: result.args.exitBooth,
                    priceWeis : result.args.priceWeis.toNumber()
                })
                component.setState({ routePrices: newRoutePrices})
            }
        })
    }

    initLogMultiplierSet(component, address, instance) {
        let eventNew = instance.LogMultiplierSet({owner: address},{fromBlock: 0, toBlock: 'latest'})
        eventNew.get(function(err, res) {
            if (err) {
                console.log(err)
                return
            }
            for (let i = 0; i < res.length; i++) {
                let result = res[i]
                let newMultipliers = JSON.parse(JSON.stringify(component.state.multipliers))
                newMultipliers.push({
                    key: result.args.vehicleType,
                    sender: result.args.sender,
                    vehicleType: result.args.vehicleType.toNumber(),
                    multiplier: result.args.multiplier.toNumber()
                })
                component.setState({ multipliers: newMultipliers})
            }
        })
    }

    addSetTollboothListener(component) {
        const updateEvent = this.state.contractInstance.LogTollBoothAdded()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newTollbooths = JSON.parse(JSON.stringify(component.state.tollbooths))
            newTollbooths.push({
                key: result.args.tollBooth,
                sender: result.args.sender,
                tollBooth: result.args.tollBooth
            })
            component.setState({ tollbooths: newTollbooths })
            console.log("Changed event received Tollbooth, value: " + newTollbooths)
        })
    }

    addSetRoutePriceListener(component) {
        const updateEvent = this.state.contractInstance.LogRoutePriceSet()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newRoutePrices = JSON.parse(JSON.stringify(component.state.routePrices))
            newRoutePrices.push({
                key: result.args.entryBooth,
                sender: result.args.sender,
                entryBooth: result.args.entryBooth,
                exitBooth: result.args.exitBooth,
                priceWeis : result.args.priceWeis.toNumber()
            })
            component.setState({ routePrices: newRoutePrices})
            console.log("Changed event received RoutePrice, value: " + newRoutePrices)
        })
    }

    addSetMultiplierListener(component) {
        const updateEvent = this.state.contractInstance.LogMultiplierSet()
        updateEvent.watch(function(err, result) {
            if (err) {
                console.log(err)
                return
            }
            let newMultipliers = JSON.parse(JSON.stringify(component.state.multipliers))
            newMultipliers.push({
                key: result.args.vehicleType,
                sender: result.args.sender,
                vehicleType: result.args.vehicleType.toNumber(),
                multiplier: result.args.multiplier.toNumber()
            })
            component.setState({ multipliers: newMultipliers})
            console.log("Changed event received Multiplier, value: " + newMultipliers)
        })
    }

    submitTollbooth() {
        return this.state.contractInstance.addTollBooth(
            this.state.tollboothAddress,
            {from: this.state.operatorOwner})
        .catch((err) => {
            console.log(err)
            return alert(err)
        })
    }

    submitRoutePrice() {
        return this.state.contractInstance.setRoutePrice(
            this.state.entryBooth,
            this.state.exitBooth,
            this.state.priceWeis,
            {from: this.state.operatorOwner, gas: 2000000})
        .catch((err) => {
            console.log(err)
            return alert(err)
        })
    }

    submitMultiplier() {
        return this.state.contractInstance.setMultiplier(
            this.state.vehicleType,
            this.state.multiplier,
            {from: this.state.operatorOwner})
        .catch((err) => {
            console.log(err)
            return alert(err)
        })
    }

    handleChangeTollboothAddress = (e) => {
        this.setState({tollboothAddress: e.target.value})
    }

    handleChangeEntryBooth = (e) => {
        this.setState({entryBooth: e.target.value})
    }

    handleChangeExitBooth = (e) => {
        this.setState({exitBooth: e.target.value})
    }

    handleChangePriceWeis = (e) => {
        this.setState({priceWeis: parseInt(e.target.value, 10)})
    }

    handleChangeVehicleType = (e) => {
        this.setState({vehicleType: parseInt(e.target.value, 10)})
    }

    handleChangeMultiplier = (e) => {
        this.setState({multiplier: parseInt(e.target.value, 10)})
    }

    renderTollboothField() {
        return (
            <OneFieldSubmit
                firstName={"address"}
                firstValue={this.state.tollboothAddress}
                onChangeFirst={() => this.handleChangeTollboothAddress}
                onClick={() => this.submitTollbooth()}
            />
        )
    }

    renderRoutePriceField() {
        return (
            <ThreeFieldSubmit
                firstName={"entryBooth"}
                firstValue={this.state.entryBooth}
                onChangeFirst={() => this.handleChangeEntryBooth}
                secondName={"exitBooth"}
                secondValue={this.state.exitBooth}
                onChangeSecond={() => this.handleChangeExitBooth}
                thirdName={"priceWeis"}
                thirdValue={this.state.priceWeis}
                onChangeThird={() => this.handleChangePriceWeis}
                onClick={() => this.submitRoutePrice()}
            />
        )
    }

    renderMultiplierField() {
        return (
            <TwoFieldSubmit
                firstName={"vehicleType"}
                firstValue={this.state.vehicleType}
                onChangeFirst={() => this.handleChangeVehicleType}
                secondName={"multiplier"}
                secondValue={this.state.multiplier}
                onChangeSecond={() => this.handleChangeMultiplier}
                onClick={() => this.submitMultiplier()}
            />
        )
    }

    renderTollbooths() {
        const tollbooths = this.state.tollbooths.map((d, i) =>
                <li key={i}>sender: {d.sender}<br/>
                tollBooth: {d.tollBooth}</li>)
        return (
            <UnorderedList
                listItems={tollbooths}
            />
        )
    }

    renderRoutePrices() {
        const routePrices = this.state.routePrices.map((d, i) =>
                <li key={i}>sender: {d.sender}<br/>
                entryBooth: {d.entryBooth}<br/>
                exitBooth: {d.exitBooth}<br/>
                priceWeis: {d.priceWeis}</li>)
        return (
            <UnorderedList
                listItems={routePrices}
            />
        )
    }

    renderMultipliers() {
        const multipliers = this.state.multipliers.map((d, i) =>
                <li key={i}>sender: {d.sender}<br/>
                vehicleType: {d.vehicleType}<br/>
                multiplier: {d.multiplier}</li>)
        return (
            <UnorderedList
                listItems={multipliers}
            />
        )
    }

    render() {
        return (
            <div className="App">
                <main className="container">
                    <div className="pure-g">
                        <div className="pure-u-1-1">
                            <h2>Operator</h2>
                            <p>{"owner accounts[1]: " + this.state.operatorOwner}</p>
                            <h3>Tollbooths</h3>
                            {this.renderTollboothField()}
                            {this.renderTollbooths()}
                            <h3>Route Prices</h3>
                            {this.renderRoutePriceField()}
                            {this.renderRoutePrices()}
                            <h3>Multipliers</h3>
                            {this.renderMultiplierField()}
                            {this.renderMultipliers()}
                        </div>
                    </div>
                </main>
            </div>
        )
    }
}

export default Operator
