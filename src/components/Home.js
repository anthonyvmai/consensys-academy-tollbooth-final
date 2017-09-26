import React from 'react'

const Home = () => (
    <div className="App">
        <main className="container">
            <div className="pure-g">
                <div className="pure-u-1-1">
                    <h2>Home</h2>
                    <p>UI for demoing purposes. Please use metamask and import at least 4 accounts (regulator, operator, vehicle, tollbooth).</p>
                    <p>You must manually refresh the page after switching metamask accounts.</p>
                    <p>Regulator owner: accounts[0]</p>
                    <p>TollBoothOperator owner: accounts[1]</p>
                </div>
            </div>
        </main>
    </div>
)

export default Home
