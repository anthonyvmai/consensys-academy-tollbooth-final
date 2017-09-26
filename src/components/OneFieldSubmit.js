import React, { Component } from 'react'

class OneFieldSubmit extends Component {
    render() {
        return (
            <div>
                <input type="text" placeholder={this.props.firstName}
                    value={this.props.firstValue}
                    onChange={this.props.onChangeFirst()}/>
                <button className="changeButton" onClick={() => this.props.onClick()}>submit</button>
            </div>
        )
    }
}

export default OneFieldSubmit
