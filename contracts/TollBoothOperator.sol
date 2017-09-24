pragma solidity ^0.4.13;

import "./Pausable.sol";
import "./Regulated.sol";
import "./MultiplierHolder.sol";
import "./DepositHolder.sol";
import "./RoutePriceHolder.sol";
import "./interfaces/TollBoothOperatorI.sol";

contract TollBoothOperator is Pausable, Regulated, MultiplierHolder, DepositHolder,
    TollBoothOperatorI, RoutePriceHolder {

    struct VehicleSecret {
        bytes32 hashedSecret;
        address vehicle;
        address entryBooth;
        uint deposit;
    }

    struct VehicleSecretFifoQueue {
        uint start;
        VehicleSecret[] vehicleSecrets;
    }

    // (hashedSecret => VehicleSecret)
    mapping (bytes32 => VehicleSecret) private vehicleSecrets;

    // (entryBooth => (exitBooth => VehicleSecretFifoQueue))
    mapping (address => mapping (address => VehicleSecretFifoQueue)) private pendingPayments;

    // fees collectable by the owner
    uint private collectableFees;

    function TollBoothOperator(bool _paused, uint _deposit, address _regulator)
        Pausable(_paused)
        DepositHolder(_deposit)
        Regulated(_regulator) {

        // all assignments/requires handled in super constructors
    }

    function hashSecret(bytes32 secret)
        constant
        public
        returns(bytes32 hashed) {

        return keccak256(secret);
    }

    function enterRoad(address entryBooth,
                       bytes32 exitSecretHashed)
        whenNotPaused
        public
        payable
        returns (bool success) {

        uint vehicleType = getRegulator().getVehicleType(msg.sender);
        uint requiredDeposit = getDeposit() * getMultiplier(vehicleType);

        require(isTollBooth(entryBooth));
        require(vehicleType != 0);
        require(msg.value >= requiredDeposit);
        require(vehicleSecrets[exitSecretHashed].hashedSecret == 0); // make sure secret hasn't been used

        vehicleSecrets[exitSecretHashed] = VehicleSecret({
            hashedSecret: exitSecretHashed,
            vehicle: msg.sender,
            entryBooth: entryBooth,
            deposit: msg.value
        });

        LogRoadEntered(msg.sender, entryBooth, exitSecretHashed, msg.value);

        return true;
    }

    function getVehicleEntry(bytes32 exitSecretHashed)
        constant
        public
        returns(address vehicle,
                address entryBooth,
                uint depositedWeis) {

        // storage pointer 
        VehicleSecret storage vehicleSecret = vehicleSecrets[exitSecretHashed];

        return (vehicleSecret.vehicle, vehicleSecret.entryBooth, vehicleSecret.deposit);
    }

    /**
     * Event emitted when a vehicle used a route that has no known fee.
     * It is a signal for the oracle to provide a price for the pair.
     * @param exitSecretHashed The hashed secret that was defined at the time of entry.
     * @param entryBooth The address of the booth the vehicle entered at.
     * @param exitBooth The address of the booth the vehicle exited at.
     */
    event LogPendingPayment(
        bytes32 indexed exitSecretHashed,
        address indexed entryBooth,
        address indexed exitBooth);

    /**
     * Called by the exit booth.
     *     It should roll back when the contract is in the `true` paused state.
     *     It should roll back when the sender is not a toll booth.
     *     It should roll back if the exit is same as the entry.
     *     It should roll back if the secret does not match a hashed one.
     * @param exitSecretClear The secret given by the vehicle as it passed by the exit booth.
     * @return status:
     *   1: success, -> emits LogRoadExited
     *   2: pending oracle -> emits LogPendingPayment
     */
    function reportExitRoad(bytes32 exitSecretClear)
        whenNotPaused
        public
        returns (uint status) {

        bytes32 hashedSecret = hashSecret(exitSecretClear);
        // storage pointer 
        VehicleSecret storage vehicleSecret = vehicleSecrets[hashedSecret];
        uint routePrice = getRoutePrice(vehicleSecret.entryBooth, msg.sender);

        require(isTollBooth(msg.sender));
        require(vehicleSecret.entryBooth != msg.sender);
        require(vehicleSecret.hashedSecret == hashedSecret);

        if (routePrice == 0) {
            pendingPayments[vehicleSecret.entryBooth][msg.sender].vehicleSecrets.push(vehicleSecret);

            LogPendingPayment(vehicleSecret.hashedSecret, vehicleSecret.entryBooth, msg.sender);

            return 2;
        } else {
            uint vehicleType = getRegulator().getVehicleType(vehicleSecret.vehicle);
            uint multipliedRoutePrice = routePrice * getMultiplier(vehicleType);
            uint refund = multipliedRoutePrice < vehicleSecret.deposit ? vehicleSecret.deposit - multipliedRoutePrice : 0;
            vehicleSecret.deposit = 0;
            if (refund > 0) vehicleSecret.vehicle.transfer(refund);
            collectableFees += multipliedRoutePrice;

            LogRoadExited(msg.sender, vehicleSecret.hashedSecret, multipliedRoutePrice, refund);

            return 1;
        }
    }

    function getPendingPaymentCount(address entryBooth, address exitBooth)
        constant
        public
        returns (uint count) {

        // storage pointer
        VehicleSecretFifoQueue storage queue = pendingPayments[entryBooth][exitBooth];
        return queue.vehicleSecrets.length - queue.start;
    }

    function clearSomePendingPayments(address entryBooth,
                                      address exitBooth,
                                      uint count)
        whenNotPaused
        public
        returns (bool success) {

        uint routePrice = getRoutePrice(entryBooth, exitBooth);

        require(isTollBooth(entryBooth) && isTollBooth(exitBooth));
        require(routePrice != 0);
        require(getPendingPaymentCount(entryBooth, exitBooth) >= count);
        require(count != 0);

        // storage pointer
        VehicleSecretFifoQueue storage queueStruct = pendingPayments[entryBooth][exitBooth];

        for (uint i = 0; i < count; i++) {
            // storage pointer
            VehicleSecret storage vehicleSecret = queueStruct.vehicleSecrets[queueStruct.start];
            uint vehicleType = getRegulator().getVehicleType(vehicleSecret.vehicle);
            uint multipliedRoutePrice = routePrice * getMultiplier(vehicleType);
            uint refund = multipliedRoutePrice < vehicleSecret.deposit ? vehicleSecret.deposit - multipliedRoutePrice : 0;
            vehicleSecrets[vehicleSecret.hashedSecret].deposit = 0;
            if (refund > 0) vehicleSecret.vehicle.transfer(refund);
            collectableFees += multipliedRoutePrice;

            // delete(vehicleSecret); TODO
            queueStruct.start++;

            LogRoadExited(exitBooth, vehicleSecret.hashedSecret, multipliedRoutePrice, refund);
        }

        return true;
    }

    function getCollectedFeesAmount()
        constant
        public
        returns(uint amount) {

        return collectableFees;
    }

    function withdrawCollectedFees()
        fromOwner
        public
        returns(bool success) {

        uint toCollect = collectableFees;
        collectableFees = 0;
        msg.sender.transfer(toCollect);

        LogFeesCollected(msg.sender, toCollect);

        return true;
    }
}

