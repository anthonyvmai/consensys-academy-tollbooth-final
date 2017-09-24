pragma solidity ^0.4.13;

import "./Owned.sol";
import "./interfaces/TollBoothHolderI.sol";

contract TollBoothHolder is Owned, TollBoothHolderI {
    mapping(address => bool) private tollBooths;

    function addTollBooth(address tollBooth)
        fromOwner
        public
        returns(bool success) {

        require(!tollBooths[tollBooth]);
        require(tollBooth != 0);

        tollBooths[tollBooth] = true;

        LogTollBoothAdded(msg.sender, tollBooth);

        return true;
    }

    function isTollBooth(address tollBooth)
        constant
        public
        returns(bool isIndeed) {

        return tollBooths[tollBooth];
    }

    function removeTollBooth(address tollBooth)
        fromOwner
        public
        returns(bool success) {

        require(tollBooths[tollBooth]);
        require(tollBooth != 0);

        tollBooths[tollBooth] = false;

        LogTollBoothRemoved(msg.sender, tollBooth);

        return true;
    }
}

