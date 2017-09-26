import React, { Component } from 'react'

class UnorderedList extends Component {
    render() {
        return (
            <div>
                <ul>
                    {this.props.listItems}
                </ul>
            </div>
        )
    }
}

export default UnorderedList
