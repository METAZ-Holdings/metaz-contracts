const BN = require('bn.js');

require('dotenv').config();

const {
    OWNER,
    SIGNER_FACTORY,
    UNIVERSAL_MINTER,
    BASE_URI,
} = process.env;

const FactoryERC721 = artifacts.require("FactoryERC721");
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
        FactoryERC721, SIGNER_FACTORY, UNIVERSAL_MINTER, RedeemInst.address, BASE_URI
    );

    let FactoryERC721Inst = await FactoryERC721.deployed();
    await FactoryERC721Inst.transferOwnership(OWNER);
    console.log("FactoryERC721 =", FactoryERC721Inst.address);
};