import React, { Component } from 'react'

class ThreeFieldSubmit extends Component {
    render() {
        return (
            <div>
                <input type="text" placeholder={this.props.firstName}
                    value={this.props.firstValue}
                    onChange={this.props.onChangeFirst()}/>
                <input type="text" placeholder={this.props.secondName}
                    value={this.props.secondValue}
                    onChange={this.props.onChangeSecond()}/>
                <input type="text" placeholder={this.props.thirdName}
                    value={this.props.thirdValue}
                    onChange={this.props.onChangeThird()}/>
                <button className="changeButton" onClick={() => this.props.onClick()}>submit</button>
            </div>
        )
    }
}

export default ThreeFieldSubmit
