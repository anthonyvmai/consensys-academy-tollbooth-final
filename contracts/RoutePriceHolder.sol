pragma solidity ^0.4.13;

import "./Owned.sol";
import "./TollBoothHolder.sol";
import "./interfaces/RoutePriceHolderI.sol";

contract RoutePriceHolder is Owned, TollBoothHolder, RoutePriceHolderI {

    // entryBooth => (exitbooth => price)
    mapping(address => mapping(address => uint)) private routePrices;

    function setRoutePrice(address entryBooth,
                           address exitBooth,
                           uint priceWeis)
        fromOwner
        public
        returns(bool success) {

        require(isTollBooth(entryBooth) && isTollBooth(exitBooth));
        require(entryBooth != exitBooth);
        require(entryBooth != 0 && exitBooth != 0);
        require(routePrices[entryBooth][exitBooth] != priceWeis);

        routePrices[entryBooth][exitBooth] = priceWeis;

        LogRoutePriceSet(msg.sender, entryBooth, exitBooth, priceWeis);

        if (getPendingPaymentCount(entryBooth, exitBooth) > 0) {
            clearSomePendingPayments(entryBooth, exitBooth, 1);
        }

        return true;
    }

    function getRoutePrice(address entryBooth,
                           address exitBooth)
        constant
        public
        returns(uint priceWeis) {

        return routePrices[entryBooth][exitBooth];
    }

    function getPendingPaymentCount(address entryBooth, address exitBooth)
        constant
        public
        returns (uint count);

    function clearSomePendingPayments(address entryBooth, address exitBooth, uint count)
        public
        returns (bool success);
}

