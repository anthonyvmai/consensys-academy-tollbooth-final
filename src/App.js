import React, { Component } from 'react'
import RegulatorContract from './build/contracts/Regulator.json'
import TollBoothOperatorContract from './build/contracts/TollBoothOperator.json'
import getWeb3 from './utils/getWeb3'

import Home from './components/Home.js'
import Regulator from './components/Regulator.js'
import Operator from './components/Operator.js'
import Vehicle from './components/Vehicle.js'
import Tollbooth from './components/Tollbooth.js'

import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'


const App = () => (
    <Router>
        <div>
            <nav className="navbar pure-menu pure-menu-horizontal">
                <a href="/" className="pure-menu-heading pure-menu-link">Home</a>
                <a href="/regulator" className="pure-menu-heading pure-menu-link">Regulator</a>
                <a href="/operator" className="pure-menu-heading pure-menu-link">Operator</a>
                <a href="/vehicle" className="pure-menu-heading pure-menu-link">Vehicle</a>
                <a href="/tollbooth" className="pure-menu-heading pure-menu-link">Tollbooth</a>
            </nav>
            <hr/>
            <Route exact path="/" component={Home}/>
            <Route path="/regulator" component={Regulator}/>
            <Route path="/operator" component={Operator}/>
            <Route path="/vehicle" component={Vehicle}/>
            <Route path="/tollbooth" component={Tollbooth}/>
        </div>
    </Router>
)

export default App
