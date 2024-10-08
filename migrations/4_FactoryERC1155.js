const BN = require('bn.js');

require('dotenv').config();

const {
    OWNER,
    UNIVERSAL_MINTER,
    BASE_URI
} = process.env;

const FactoryERC1155 = artifacts.require("FactoryERC1155");
const Redeem = artifacts.require("Redeem");

const debug = "true";

const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

module.exports = async function (deployer, network) {
    if (network == "test" || network == "development")
        return;

    let RedeemInst = await Redeem.deployed();

    await deployer.deploy(
        FactoryERC1155, UNIVERSAL_MINTER, RedeemInst.address, BASE_URI
    );

    let FactoryERC1155Inst = await FactoryERC1155.deployed();
    await FactoryERC1155Inst.transferOwnership(OWNER);
    console.log("FactoryERC1155 =", FactoryERC1155Inst.address);
};