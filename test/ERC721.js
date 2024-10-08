const { expect } = require('chai');
const { BN, expectEvent, expectRevert, makeInterfaceId, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const EthCrypto = require("eth-crypto");
const FactoryERC721 = artifacts.require('FactoryERC721');
const ERC721Instance = artifacts.require('ERC721Instance');

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

let FactoryERC721Inst;
let signer;
let chainID;

contract (
    'ERC721 factory and instance',
    ([
        deployer,
        owner,
        user1,
        user2
    ]) => {

        beforeEach (async () => {

            chainID = await web3.eth.getChainId();

            FactoryERC721Inst = await FactoryERC721.new(owner, owner, owner, "a/");
            await FactoryERC721Inst.transferOwnership(owner);

            signer = EthCrypto.createIdentity();

            await expectRevert(FactoryERC721Inst.setSigner(signer.address), "Ownable: caller is not the owner");
            await FactoryERC721Inst.setSigner(signer.address, {from: owner});
        })

        it('Main functionality', async () => {

            await expectRevert(FactoryERC721Inst.deployERC721Instance("", "", false), "Ownable: caller is not the owner");
            let tx = await FactoryERC721Inst.deployERC721Instance("", "", false, {from: owner});
            let Instance = await ERC721Instance.at(tx.logs[0].args.instance);

            await expectRevert(Instance.mint([ONE, TWO], [user1, user2]), "Not authorized for mint");
            await Instance.mint([ONE, TWO], [user1, user2], {from: owner});
            expect(await Instance.totalSupply()).bignumber.equal(TWO);
            expect(await Instance.balanceOf(user1)).bignumber.equal(ONE);
            expect(await Instance.balanceOf(user2)).bignumber.equal(ONE);
            await Instance.setApprovalForAll(owner, true, {from: user2});
            await expectRevert(Instance.burn(ZERO, {from: user1}), "Not authorized for burn");
            await Instance.transferFrom(user1, owner, ZERO, {from: user1});
            await Instance.burn(ZERO, {from: owner});
            await Instance.burn(ONE, {from: owner});
            expect(await Instance.totalSupply()).bignumber.equal(ZERO);

            await Instance.mint([THREE], [user1], {from: owner});
            await time.advanceBlock();
            await expectRevert(Instance.claim(ZERO, TWO, new BN(await time.latest()).add(new BN(60)), "0x", {from: user1}), "This collection is not claimable");
        })

        it('Universal minter test', async () => {

            let tx = await FactoryERC721Inst.deployERC721Instance("", "", false, {from: owner});
            let Instance = [];
            Instance.push(await ERC721Instance.at(tx.logs[0].args.instance));
            tx = await FactoryERC721Inst.deployERC721Instance("", "", false, {from: owner});
            Instance.push(await ERC721Instance.at(tx.logs[0].args.instance));

            await expectRevert(Instance[0].mint([ZERO], [user1]), "Not authorized for mint");
            await expectRevert(Instance[1].mint([ZERO], [user1]), "Not authorized for mint");

            await expectRevert(FactoryERC721Inst.setUniversalMinter(deployer), "Ownable: caller is not the owner");
            await FactoryERC721Inst.setUniversalMinter(deployer, {from: owner});

            await Instance[0].mint([ZERO], [user1]);
            await Instance[1].mint([ZERO], [user1]);

            tx = await FactoryERC721Inst.deployERC721Instance("", "", false, {from: owner});
            Instance.push(await ERC721Instance.at(tx.logs[0].args.instance));
            await Instance[2].mint([ZERO], [user1]);

            await FactoryERC721Inst.setUniversalMinter(owner, {from: owner});

            await expectRevert(Instance[0].mint([ONE], [user1]), "Not authorized for mint");
            await expectRevert(Instance[1].mint([ONE], [user1]), "Not authorized for mint");
            await expectRevert(Instance[2].mint([ONE], [user1]), "Not authorized for mint");
        })

        it('Claim', async () => {

            await expectRevert(FactoryERC721Inst.deployERC721Instance("", "", true), "Ownable: caller is not the owner");
            let tx = await FactoryERC721Inst.deployERC721Instance("", "", true, {from: owner});
            let Instance = await ERC721Instance.at(tx.logs[0].args.instance);

            await Instance.mint([ONE, TWO], [user1, user2], {from: owner});

            await time.advanceBlock();
            let TIME = new BN(await time.latest()).add(new BN(60));
            let signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(Instance.claim(ZERO, ZERO, TIME, signature, {from: user2}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await time.increase(time.duration.minutes(2));
            await expectRevert(Instance.claim(ZERO, ZERO, TIME, signature, {from: user2}), "Deadline passed");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(Instance.claim(ZERO, ZERO, TIME.add(new BN(600)), signature, {from: user2}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(Instance.claim(ZERO, ZERO, TIME, signature, {from: user2}), "Not an owner");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID + 1},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(Instance.claim(ZERO, ZERO, TIME, signature, {from: user1}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user1},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await Instance.claim(ZERO, ZERO, TIME, signature, {from: user1});

            await Instance.safeTransferFrom(user1, user2, ZERO, {from: user1});
            expect(await Instance.balanceOf(user2)).bignumber.equal(TWO);

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address", value: user2},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(Instance.claim(ZERO, ZERO, TIME, signature, {from: user2}), "Claim ID used");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "1"},
                    {type: "address", value: user2},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "0"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(Instance.claim(ONE, ZERO, TIME, signature, {from: user2}), "Already claimed");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "1"},
                    {type: "address", value: user2},
                    {type: "address", value: Instance.address},
                    {type: "uint256", value: "1"},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await Instance.claim(ONE, ONE, TIME, signature, {from: user2});
        })
    }
)