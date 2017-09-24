pragma solidity ^0.4.13;

import "./interfaces/OwnedI.sol";

contract Owned is OwnedI {
    address private theOwner;

    modifier fromOwner() {

        require(msg.sender == theOwner);

        _;
    }

    function Owned() {
        theOwner = msg.sender;
    }

    function setOwner(address newOwner)
        fromOwner
        public
        returns(bool success) {

        require(newOwner != theOwner);
        require(newOwner != 0);

        LogOwnerSet(theOwner, newOwner);

        theOwner = newOwner;

        return true;
    }

    function getOwner()
        constant
        public
        returns(address owner) {

        return theOwner;
    }
}
