pragma solidity ^0.4.13;

import "../Owned.sol";
import "../TollBoothHolder.sol";
import "../RoutePriceHolder.sol";

contract RoutePriceHolderMock is TollBoothHolder, RoutePriceHolder {

    function RoutePriceHolderMock() {
    }

    function getPendingPaymentCount(address entryBooth, address exitBooth)
        constant
        public
        returns (uint count) {
    }

    function clearSomePendingPayments(address entryBooth, address exitBooth, uint count)
        public
        returns (bool success) {
    }
}

