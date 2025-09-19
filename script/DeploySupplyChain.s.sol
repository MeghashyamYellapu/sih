// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {SupplyChain} from "../src/SupplyChain.sol";
import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

contract DeploySupplyChain is Script {
    function run() external {
        vm.startBroadcast();
        SupplyChain sc = new SupplyChain();
        console2.log("SupplyChain deployed at:", address(sc));
        vm.stopBroadcast();
    }
}