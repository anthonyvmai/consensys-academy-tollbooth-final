pragma solidity ^0.4.13;

import "./Owned.sol";
import "./interfaces/DepositHolderI.sol";

contract DepositHolder is Owned, DepositHolderI {

    uint private deposit;

    function DepositHolder(uint _deposit) payable {

        require(_deposit != 0);

        deposit = _deposit;
    }

    function setDeposit(uint depositWeis)
        fromOwner
        public
        returns(bool success) {

        require(depositWeis != 0);
        require(depositWeis != deposit);

        LogDepositSet(msg.sender, depositWeis);

        return true;
    }

    function getDeposit()
        constant
        public
        returns(uint weis) {

        return deposit;
    }
}

