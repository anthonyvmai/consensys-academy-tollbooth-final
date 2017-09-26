import React, { Component } from 'react'

class TwoFieldSubmit extends Component {
    render() {
        return (
            <div>
                <input type="text" placeholder={this.props.firstName}
                    value={this.props.firstValue}
                    onChange={this.props.onChangeFirst()}/>
                <input type="text" placeholder={this.props.secondName}
                    value={this.props.secondValue}
                    onChange={this.props.onChangeSecond()}/>
                <button className="changeButton" onClick={() => this.props.onClick()}>submit</button>
            </div>
        )
    }
}

export default TwoFieldSubmit
