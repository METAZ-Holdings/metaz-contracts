const { expect } = require('chai');
const { BN, expectEvent, expectRevert, makeInterfaceId, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const EthCrypto = require("eth-crypto");
const PaymentGetter = artifacts.require('PaymentGetter');
const token = artifacts.require('token');

const MINUS_ONE = new BN(-1);
const ZERO = new BN(0);
const ONE = new BN(1);
const TWO = new BN(2);
const THREE = new BN(3);
const FOUR = new BN(4);
const FIVE = new BN(5);
const SIX = new BN(6);
const SEVEN = new BN(7);
const EIGHT = new BN(8);
const NINE = new BN(9);
const TEN = new BN(10);
const TWENTY = new BN(20);

const DECIMALS = new BN(18);
const ONE_TOKEN = TEN.pow(DECIMALS);
const TWO_TOKEN = ONE_TOKEN.mul(TWO);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

require('dotenv').config();
const {
} = process.env;

contract (
    'Payment getter',
    ([
        deployer,
        owner,
        user1,
        user2
    ]) => {

        it('Main functionality', async () => {

            let chainID = await web3.eth.getChainId();

            TokenInst = await token.new("", "");
            await TokenInst.mint(user1, ONE_TOKEN.mul(new BN(50)));
            await TokenInst.mint(user2, ONE_TOKEN.mul(new BN(50)));

            PaymentGetterInst = await PaymentGetter.new(owner);
            await PaymentGetterInst.transferOwnership(owner);

            signer = EthCrypto.createIdentity();

            await PaymentGetterInst.setSigner(signer.address, {from: owner});

            await TokenInst.approve(PaymentGetterInst.address, ONE_TOKEN.mul(new BN(50)), {from: user1});
            await TokenInst.approve(PaymentGetterInst.address, ONE_TOKEN.mul(new BN(50)), {from: user2});

            await time.advanceBlock();
            let TIME = new BN(await time.latest()).add(new BN(60));
            let signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(30)), TIME, signature, {from: user1}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user2}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID + 1},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await time.increase(time.duration.minutes(2));
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1}), "Deadline passed");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1, value: ONE}), "Cannot send native currency while paying with token");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1});
            expect(await TokenInst.balanceOf(user1)).bignumber.equal(ONE_TOKEN.mul(new BN(30)));
            expect(await TokenInst.balanceOf(owner)).bignumber.equal(ONE_TOKEN.mul(TWENTY));

            let BALANCE = new BN(await web3.eth.getBalance(owner));

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user2, value: ONE_TOKEN.mul(TWENTY)}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user2, value: ONE_TOKEN.mul(TWENTY)}), "Payment ID used");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "1"},
                    {type: "address", value: user2},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ONE, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user2, value: ONE_TOKEN.mul(TWENTY).add(ONE)}), "Wrong payment amount");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "1"},
                    {type: "address", value: user2},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await PaymentGetterInst.doPayment(ZERO, ONE, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user2, value: ONE_TOKEN.mul(TWENTY)});

            expect(new BN(await web3.eth.getBalance(owner))).bignumber.equal(BALANCE.add(ONE_TOKEN.mul(TWENTY)));

            expect(await PaymentGetterInst.paymentIDUsed(ZERO, ZERO)).equal(true);
            expect(await PaymentGetterInst.paymentIDUsed(ZERO, ONE)).equal(true);
            expect(await PaymentGetterInst.paymentIDUsed(ZERO, TWO)).equal(false);
            expect(await PaymentGetterInst.paymentIDUsed(ONE, ZERO)).equal(false);

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "0"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1}), "Payment ID used");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint8", value: "1"},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: PaymentGetterInst.address},
                    {type: "address", value: TokenInst.address},
                    {type: "uint256", value: ONE_TOKEN.mul(TWENTY).toString()},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1}), "Invalid signature");
            await expectRevert(PaymentGetterInst.doPayment(ZERO, ONE, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1}), "Invalid signature");
            await PaymentGetterInst.doPayment(ONE, ZERO, TokenInst.address, ONE_TOKEN.mul(new BN(20)), TIME, signature, {from: user1});
            expect(await TokenInst.balanceOf(user1)).bignumber.equal(ONE_TOKEN.mul(TEN));
            expect(await TokenInst.balanceOf(owner)).bignumber.equal(ONE_TOKEN.mul(new BN(40)));
            expect(await PaymentGetterInst.paymentIDUsed(ZERO, ZERO)).equal(true);
            expect(await PaymentGetterInst.paymentIDUsed(ZERO, ONE)).equal(true);
            expect(await PaymentGetterInst.paymentIDUsed(ZERO, TWO)).equal(false);
            expect(await PaymentGetterInst.paymentIDUsed(ONE, ZERO)).equal(true);
            expect(await PaymentGetterInst.paymentIDUsed(ONE, ONE)).equal(false);
        })
    }
)