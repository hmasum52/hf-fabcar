/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // step-1: load the network configuration
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // step-2: Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // step-3: Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // step-4: Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get('appUser');

        // We return if the user is already in the wallet. 
        // This will happen if you execute startFabric.sh and the wallet subdirectory contains these identities
        // The Fabcar application is not designed for multiple enrollments by a user. When this happens,
        // you need to delete the contents of the wallet subdirectory and try the client again
        if (userIdentity) {
            console.log('An identity for the user "appUser" already exists in the wallet');
            return;
        }

        // step-5: Check to see if we've already enrolled the admin user.
        // The wallet subdirectory is then checked for the admin identity, 
        // which should exist because we always execute enrollAdmin.js first.If the admin is not found, we return.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // step-6: build a user object for authenticating with the CA
        // At this point, these identities do not exist in the Fabcar test network.

        // To build the user identity, we begin by using wallet to get a provider of the x509 type 
        // and use it to create a User object from the admin identity.
        const identityProvider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await identityProvider.getUserContext(adminIdentity, 'admin');

        // step-7: Register the user, enroll the user, and import the new identity into the wallet.
        // The application user secret is like a password, except the user will not know it and does not care to know
        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'appUser',
            role: 'client'
        }, adminUser);

        // enroll the user with username "appUser"
        const enrollment = await ca.enroll({
            enrollmentID: 'appUser', // username
            enrollmentSecret: secret //The application user secret is like a password, except the user will not know it
        });

        // create identity object
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        // save the identify object in the wallet file
        await wallet.put('appUser', x509Identity);
        console.log('Successfully registered and enrolled admin user "appUser" and imported it into the wallet');

    } catch (error) {
        console.error(`Failed to register user "appUser": ${error}`);
        process.exit(1);
    }
}

main();
