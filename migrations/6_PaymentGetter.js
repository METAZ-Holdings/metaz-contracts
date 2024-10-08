const BN = require('bn.js');

require('dotenv').config();

const {
    OWNER,
    SIGNER_PAYMENT_GETTER
} = process.env;

const PaymentGetter = artifacts.require("PaymentGetter");

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
        PaymentGetter, SIGNER_PAYMENT_GETTER
    );

    let PaymentGetterInst = await PaymentGetter.deployed();
    await PaymentGetterInst.transferOwnership(OWNER);
    console.log("PaymentGetter =", PaymentGetterInst.address);
};