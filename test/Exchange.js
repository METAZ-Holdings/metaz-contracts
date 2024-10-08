const { expect } = require('chai');
const { BN, expectEvent, expectRevert, makeInterfaceId, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const EthCrypto = require("eth-crypto");
const FactoryERC721 = artifacts.require('FactoryERC721');
const ERC721Instance = artifacts.require('ERC721Instance');
const FactoryERC1155 = artifacts.require('FactoryERC1155');
const ERC1155Instance = artifacts.require('ERC1155Instance');
const Exchange = artifacts.require('Exchange');
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
    'Exchange',
    ([
        deployer,
        owner,
        signer2,
        user1,
        user2
    ]) => {

        it('Trade and force trade batch', async () => {

            let chainID = await web3.eth.getChainId();

            TokenInst = await token.new("", "");
            await TokenInst.mint(user1, ONE_TOKEN.mul(new BN(50)));
            await TokenInst.mint(user2, ONE_TOKEN.mul(new BN(50)));

            FactoryERC721Inst = await FactoryERC721.new(owner, owner, owner, "a/");
            await FactoryERC721Inst.transferOwnership(owner);
            FactoryERC1155Inst = await FactoryERC1155.new(owner, owner, "a/");
            await FactoryERC1155Inst.transferOwnership(owner);

            let tx = await FactoryERC721Inst.deployERC721Instance("", "", false, {from: owner});
            let Instance721 = await ERC721Instance.at(tx.logs[0].args.instance);
            await Instance721.mint([ONE, TWO], [user1, user2], {from: owner});

            tx = await FactoryERC1155Inst.deployERC1155Instance("", "", {from: owner});
            let Instance1155 = await ERC1155Instance.at(tx.logs[0].args.instance);
            await Instance1155.createNewToken([ONE], [owner], [ZERO], {from: owner});
            await Instance1155.mint([user1, user2], [ZERO, ZERO], [ONE, ONE], {from: owner});

            ExchangeInst = await Exchange.new();
            await ExchangeInst.grantRole(await ExchangeInst.DEFAULT_ADMIN_ROLE(), owner);
            await ExchangeInst.renounceRole(await ExchangeInst.DEFAULT_ADMIN_ROLE(), deployer);
            await ExchangeInst.grantRole(await ExchangeInst.SIGNER_ROLE(), signer2, {from: owner});

            await TokenInst.approve(ExchangeInst.address, ONE_TOKEN.mul(new BN(50)), {from: user1});
            await TokenInst.approve(ExchangeInst.address, ONE_TOKEN.mul(new BN(50)), {from: user2});
            await Instance721.setApprovalForAll(ExchangeInst.address, true, {from: user1});
            await Instance721.setApprovalForAll(ExchangeInst.address, true, {from: user2});
            await Instance1155.setApprovalForAll(ExchangeInst.address, true, {from: user1});
            await Instance1155.setApprovalForAll(ExchangeInst.address, true, {from: user2});

            signer = EthCrypto.createIdentity();

            await time.advanceBlock();
            let TIME = new BN(await time.latest()).add(new BN(60));
            let signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1}), "Invalid signature");

            await ExchangeInst.grantRole(await ExchangeInst.SIGNER_ROLE(), signer.address, {from: owner});

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer.address], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await time.increase(time.duration.minutes(2));
            await expectRevert(ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1}), "Deadline passed");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1}), "Invalid length");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1, value: ONE}), "Cannot send native currency while paying with token");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID + 1},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1}), "Invalid signature");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user1, user2]},
                    {type: "address[2]", value: [Instance1155.address, TokenInst.address]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await ExchangeInst.trade(ZERO, [user1, user2], [Instance1155.address, TokenInst.address], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1});

            expect(await Instance1155.balanceOf(user1, ZERO)).bignumber.equal(ZERO);
            expect(await Instance1155.balanceOf(user2, ZERO)).bignumber.equal(TWO);
            expect(await TokenInst.balanceOf(user1)).bignumber.equal(ONE_TOKEN.mul(new BN(60)));
            expect(await TokenInst.balanceOf(user2)).bignumber.equal(ONE_TOKEN.mul(new BN(30)));
            expect(await TokenInst.balanceOf(owner)).bignumber.equal(ONE_TOKEN.mul(FIVE));
            expect(await TokenInst.balanceOf(signer2)).bignumber.equal(ONE_TOKEN.mul(FIVE));

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "0"},
                    {type: "address[2]", value: [user2, user1]},
                    {type: "address[2]", value: [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ZERO, [user2, user1], [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user2, value: ONE}), "Order ID already used");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "1"},
                    {type: "address[2]", value: [user2, user1]},
                    {type: "address[2]", value: [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ONE, [user2, user1], [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user2, value: ONE}), "Wrong sender for native currency trade");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "1"},
                    {type: "address[2]", value: [user2, user1]},
                    {type: "address[2]", value: [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]},
                    {type: "uint256[2]", value: ["0", "1"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await expectRevert(ExchangeInst.trade(ONE, [user2, user1], [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"], [ZERO, ONE], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1, value: ONE}), "Wrong payment amount");

            await time.advanceBlock();
            TIME = new BN(await time.latest()).add(new BN(60));
            signature = EthCrypto.sign(signer.privateKey, EthCrypto.hash.keccak256([
                {type: "string", value: "\x19Ethereum Signed Message:\n32"},
                {type: "bytes32", value: EthCrypto.hash.keccak256([
                    {type: "uint256", value: chainID},
                    {type: "uint256", value: "1"},
                    {type: "address[2]", value: [user2, user1]},
                    {type: "address[2]", value: [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"]},
                    {type: "uint256[2]", value: ["0", "2"]},
                    {type: "address[]", value: [owner, signer2]},
                    {type: "uint256[]", value: [ONE_TOKEN.mul(TEN).toString(), ONE_TOKEN.mul(FIVE).toString(), ONE_TOKEN.mul(FIVE).toString()]},
                    {type: "uint256", value: TIME.toString()}])
                }])
            );
            await ExchangeInst.trade(ONE, [user2, user1], [Instance1155.address, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"], [ZERO, TWO], [owner, signer2], [ONE_TOKEN.mul(TEN), ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], TIME, signature, {from: user1, value: ONE_TOKEN.mul(TWENTY)});

            expect(await Instance1155.balanceOf(user1, ZERO)).bignumber.equal(TWO);
            expect(await Instance1155.balanceOf(user2, ZERO)).bignumber.equal(ZERO);

            await expectRevert(ExchangeInst.forceTradeBatch([[user1, user2], [user2, user1]], [[Instance721.address, TokenInst.address], [Instance721.address, TokenInst.address]], [[ZERO, ZERO], [ONE, ZERO]], [[owner], []], [[ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], [ZERO]], {from: owner}), "AccessControl: account " + owner.toLowerCase() + " is missing role " + await ExchangeInst.SIGNER_ROLE());

            await ExchangeInst.forceTradeBatch([[user1, user2], [user2, user1]], [[Instance721.address, TokenInst.address], [Instance721.address, TokenInst.address]], [[ZERO, ZERO], [ONE, ZERO]], [[owner], []], [[ONE_TOKEN.mul(FIVE), ONE_TOKEN.mul(FIVE)], [ZERO]], {from: signer2});

            expect(await Instance721.ownerOf(ZERO)).equal(user2);
            expect(await Instance721.ownerOf(ONE)).equal(user1);
            expect(await TokenInst.balanceOf(user1)).bignumber.equal(ONE_TOKEN.mul(new BN(65)));
            expect(await TokenInst.balanceOf(user2)).bignumber.equal(ONE_TOKEN.mul(new BN(TWENTY)));
            expect(await TokenInst.balanceOf(owner)).bignumber.equal(ONE_TOKEN.mul(TEN));
            expect(await TokenInst.balanceOf(signer2)).bignumber.equal(ONE_TOKEN.mul(FIVE));
        })
    }
)