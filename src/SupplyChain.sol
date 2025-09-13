// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    address public immutable i_owner;
    constructor() {
        i_owner = msg.sender;
    }
    struct Product {
    uint256 productId;            // Unique ID (can be incremented or derived from hash)
    string name;                  // Product name (e.g., "Organic Rice 1kg")
    string batchId;               // Batch/Lot identifier
    string category;              // Category (e.g., Dairy, Grains, Snacks)

    // Production Info
    address producer;             // Producer/manufacturer address
    uint256 productionDate;       // Timestamp of production
    uint256 expiryDate;           // Expiry / Best before

    // Quality / Certification
    address qualityInspector;    // Address of the inspector
    string[] certifications;      // e.g., "Organic", "ISO9001"
    bool qualityApproved;         // Flag after inspection

        // Supply Chain Journey
    address distributor;         // Current distributor
    address retailer;            // Current retailer
    address currentOwner;        // Current owner (could be distributor, retailer, or consumer)
    address[] ownersHistory;      // Track all owners in sequence
    uint256[] transferTimestamps; // Matching timestamps for each transfer

    // Logistics (optional, expandable)
    string logisticsInfo;         // e.g., "Kept at 4°C during transport"

    // Consumer Facing
    bool verified;                // True if every step signed & approved
    string metadataURI;           // Off-chain storage (IPFS/Arweave/Pinata for detailed docs, images)
}
Product[] public products;
mapping(uint256 productId => Product) public productById;
// for viewing the product details - for consumers
function viewProduct(uint256 productId) external view returns (Product memory) {
    return productById[productId];
}
/* roles
1. producer
2. quality inspector
3. distributor
4. retailer
5. consumer (view only)
*/
modifier onlyOwner() {
    require(msg.sender == i_owner, "Not owner");
    _;
}
modifier onlyProducer(uint256 productId) {
    require(msg.sender == productById[productId].producer, "Not producer");
    _;
}
modifier onlyQualityInspector(uint256 productId) {
    require(msg.sender == productById[productId].qualityInspector, "Not quality inspector");
    _;
}
modifier onlyDistributor(uint256 productId) {
    require(msg.sender == productById[productId].distributor, "Not distributor");
    _;
}
modifier onlyRetailer(uint256 productId) {
    require(msg.sender == productById[productId].retailer, "Not retailer");
    _;
}
//role arrays
address[] public producers;
address[] public qualityInspectors;
address[] public distributors;
address[] public retailers;
// mappings for roles
mapping(address => string) public producerByAddress;
mapping(address => string) public qualityInspectorByAddress;
mapping(address => string) public distributorByAddress;
mapping(address => string) public retailerByAddress;
}