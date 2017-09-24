pragma solidity ^0.4.13;

import "./interfaces/RegulatedI.sol";
import "./interfaces/RegulatorI.sol";

contract Regulated is RegulatedI {
    RegulatorI private theRegulator;

    function Regulated(address regulator) {

        require(regulator != 0);

        theRegulator = RegulatorI(regulator);
    }

    function setRegulator(address newRegulator)
        public
        returns (bool success) {

        require(msg.sender == address(theRegulator));
        require(newRegulator != 0);
        require(newRegulator != address(theRegulator));

        LogRegulatorSet(theRegulator, newRegulator);

        theRegulator = RegulatorI(newRegulator);

        return true;
    }

    function getRegulator()
        constant
        public
        returns(RegulatorI regulator) {

        return theRegulator;
    }
}
