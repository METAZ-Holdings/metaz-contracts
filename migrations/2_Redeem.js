const BN = require('bn.js');

require('dotenv').config();

const {
    OWNER,
    SIGNER_REDEEM,
    DEPLOYER
} = process.env;

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

    await deployer.deploy(
        Redeem
    );

    let RedeemInst = await Redeem.deployed();
    await RedeemInst.grantRole(await RedeemInst.DEFAULT_ADMIN_ROLE(), OWNER);
    await RedeemInst.grantRole(await RedeemInst.SIGNER_ROLE(), SIGNER_REDEEM);
    await RedeemInst.renounceRole(await RedeemInst.DEFAULT_ADMIN_ROLE(), DEPLOYER);
    console.log("Redeem =", RedeemInst.address);
};