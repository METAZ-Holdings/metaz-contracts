const { expect } = require('chai');
const { BN, expectEvent, expectRevert, makeInterfaceId, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const EthCrypto = require("eth-crypto");
const FactoryERC721 = artifacts.require('FactoryERC721');
const ERC721Instance = artifacts.require('ERC721Instance');
const FactoryERC1155 = artifacts.require('FactoryERC1155');
const ERC1155Instance = artifacts.require('ERC1155Instance');
const Redeem = artifacts.require('Redeem');

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
    'Redeem',
    ([
        deployer,
        owner,
        user1,
        user2
    ]) => {

        it('Create and process redeem', async () => {

            let chainID = await web3.eth.getChainId();

            RedeemInst = await Redeem.new();
            await RedeemInst.grantRole(await RedeemInst.DEFAULT_ADMIN_ROLE(), owner);
            await RedeemInst.renounceRole(await RedeemInst.DEFAULT_ADMIN_ROLE(), deployer);

            FactoryERC721Inst = await FactoryERC721.new(owner, owner, RedeemInst.address, "a/");
            await FactoryERC721Inst.transferOwnership(owner);
            FactoryERC1155Inst = await FactoryERC1155.new(owner, RedeemInst.address, "a/");
            await FactoryERC1155Inst.transferOwnership(owner);

            let tx = await FactoryERC721Inst.deployERC721Instance("", "", false, {from: owner});
            let Instance721 = await ERC721Instance.at(tx.logs[0].args.instance);
            await Instance721.mint([ONE], [user1], {from: owner});

            tx = await FactoryERC1155Inst.deployERC1155Instance("", "", {from: owner});
            let Instance1155 = await ERC1155Instance.at(tx.logs[0].args.instance);
            await Instance1155.createNewToken([ONE], [owner], [ZERO], {from: owner});
            await Instance1155.mint([user2], [ZERO], [THREE], {from: owner});

            await Instance721.setApprovalForAll(RedeemInst.address, true, {from: user1});
            await Instance1155.setApprovalForAll(RedeemInst.address, true, {from: user2});

            signer = EthCrypto.createIdentity();

            await time.advanceBlock();
            let TIME = new BN(await time.latest()).add(new BN(60));
            let signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance721.address},
                    {type: "uint256[2]", value: ["0", "0"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(RedeemInst.createRedeem(ZERO, Instance721.address, [ZERO, ZERO], TIME, signature, {from: user1}), "Invalid signature");

            await RedeemInst.grantRole(await RedeemInst.SIGNER_ROLE(), signer.address, {from: owner});

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance721.address},
                    {type: "uint256[2]", value: ["0", "0"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(RedeemInst.createRedeem(ZERO, Instance721.address, [ZERO, ZERO], TIME, signature, {from: user2}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance721.address},
                    {type: "uint256[2]", value: ["0", "0"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await time.increase(time.duration.minutes(2));
            await expectRevert(RedeemInst.createRedeem(ZERO, Instance721.address, [ZERO, ZERO], TIME, signature, {from: user1}), "Deadline passed");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID + 1},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance721.address},
                    {type: "uint256[2]", value: ["0", "0"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(RedeemInst.createRedeem(ZERO, Instance721.address, [ZERO, ZERO], TIME, signature, {from: user1}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance721.address},
                    {type: "uint256[2]", value: ["0", "0"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await RedeemInst.createRedeem(ZERO, Instance721.address, [ZERO, ZERO], TIME, signature, {from: user1});

            expect(await Instance721.ownerOf(ZERO)).equal(RedeemInst.address);

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance1155.address},
                    {type: "uint256[2]", value: ["0", "2"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(RedeemInst.createRedeem(ZERO, Instance1155.address, [ZERO, TWO], TIME, signature, {from: user2}), "Order ID already used");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "658"},
                    {type: "address", value: user2},
                    {type: "address", value: RedeemInst.address},
                    {type: "address", value: Instance1155.address},
                    {type: "uint256[2]", value: ["0", "2"]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await RedeemInst.createRedeem(new BN(658), Instance1155.address, [ZERO, TWO], TIME, signature, {from: user2});

            expect(await Instance1155.balanceOf(user2, ZERO)).bignumber.equal(ONE);
            expect(await Instance1155.balanceOf(RedeemInst.address, ZERO)).bignumber.equal(TWO);

            await expectRevert(RedeemInst.processRedeem(ZERO, false, {from: owner}), "AccessControl: account " + owner.toLowerCase() + " is missing role " + await RedeemInst.SIGNER_ROLE());
            await RedeemInst.grantRole(await RedeemInst.SIGNER_ROLE(), owner, {from: owner});
            await RedeemInst.processRedeem(ZERO, false, {from: owner});
            await expectRevert(RedeemInst.processRedeem(ZERO, true, {from: owner}), "Already processed");
            await expectRevert(RedeemInst.processRedeem(ZERO, false, {from: owner}), "Already processed");
            expect(await Instance721.ownerOf(ZERO)).equal(user1);

            await expectRevert(RedeemInst.processRedeem(new BN(658), true, {from: owner}), "ID does not exist");
            await expectRevert(RedeemInst.processRedeem(TWO, true, {from: owner}), "ID does not exist");
            await RedeemInst.processRedeem(ONE, true, {from: owner});
            expect(await Instance1155.totalSupply(ZERO)).bignumber.equal(ONE);
            expect(await Instance1155.balanceOf(user2, ZERO)).bignumber.equal(ONE);
        })
    }
)