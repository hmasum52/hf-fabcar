'use strict';
const path = require('path');
const fs = require('fs');
const { Wallets, Wallet } = require("fabric-network");
/**
 * 
 * @param {string} networkName e.g. 'test-network'
 * @param {string} orgName e.g. 'org1.example.com'
 * @param {string} orgConnectionJson e.g. "'connection-org1.json'"
 * @returns {JSON} connection profile object
 */
exports.buildCcp = function (networkName, orgName, orgConnectionJson) {
    const ccpPath = path.resolve(__dirname, '..', '..', networkName, 'organizations',
        'peerOrganizations', orgName, orgConnectionJson);
    // console.log(ccpPath);
    return JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
}

/**
 * 
 * @param {string} currentWorkingDirectory 
 * @returns {Promise<Wallet>} an instance of Wallet
 */
exports.buildWallet = async function(currentWorkingDirectory) {
    const walletPath = path.join(currentWorkingDirectory, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    return wallet;
}