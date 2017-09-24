pragma solidity ^0.4.13;

import "./Owned.sol";
import "./interfaces/PausableI.sol";

contract Pausable is Owned, PausableI {

    bool private paused;

    modifier whenPaused() {

        require(paused);

        _;
    }

    modifier whenNotPaused() {

        require(!paused);

        _;
    }

    function Pausable(bool _paused) {

        paused = _paused;
    }

    function setPaused(bool newState)
        fromOwner
        public
        returns (bool success) {

        require(newState != paused);

        paused = newState;

        LogPausedSet(msg.sender, newState);

        return true;
    }

    function isPaused()
        constant
        public
        returns(bool isIndeed) {

        return paused;
    }
}
