pragma solidity ^0.4.13;

import "./interfaces/RegulatorI.sol";
import "./interfaces/TollBoothOperatorI.sol";
import "./TollBoothOperator.sol";
import "./Owned.sol";

contract Regulator is Owned, RegulatorI {

    mapping (address => uint) private vehicleTypes;

    mapping (address => bool) private operators;

    function setVehicleType(address vehicle, uint vehicleType)
        fromOwner
        public
        returns(bool success) {

        require(vehicleTypes[vehicle] != vehicleType);
        require(vehicle != 0);

        vehicleTypes[vehicle] = vehicleType;

        LogVehicleTypeSet(msg.sender, vehicle, vehicleType);

        return true;
    }

    function getVehicleType(address vehicle)
        constant
        public
        returns(uint vehicleType) {

        return vehicleTypes[vehicle];
    }

    function createNewOperator(address owner,
                               uint deposit)
        fromOwner
        public
        returns(TollBoothOperatorI newOperator) {

        require(owner != getOwner());

        TollBoothOperator operator = new TollBoothOperator(true, deposit, address(this));
        operator.setOwner(owner);
        operators[address(operator)] = true;

        LogTollBoothOperatorCreated(msg.sender, operator, owner, deposit);

        return operator;
    }

    function removeOperator(address operator)
        fromOwner
        public
        returns(bool success) {

        require(operators[operator]);

        operators[operator] = false;

        LogTollBoothOperatorRemoved(msg.sender, operator);

        return true;
    }

    function isOperator(address operator)
        constant
        public
        returns(bool indeed) {

        return operators[operator];
    }
}

