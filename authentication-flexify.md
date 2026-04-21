To request any Flexify APIs, you'll need an API key representing your account.

Log in to your existing account to Production Merchant Portal and get your API credentials on the API Keys page. You can find this page by clicking the 'Projects' page and the 'Project' page.

 Api Keys 

caution
Keep in mind that your API keys have much power, so take care of their safety. Please do not post them on GitHub, in client-side code, or anywhere else that is publicly available.

Authentication
Introduction
Flexify API needs you to authenticate each request you send by signing it.

It should be noted that all requests without authentication will be rejected.

All authentication in the H2H Gate API and HPP Gate API is handled using HMAC-SHA256 signature.

The HMAC signature is just some extra data provided with a request to identify the end-user using a hashed value. The signature is part of the Authorization header of your request.

caution
Before using H2H or HPP Gate APIs your server's IP MUST BE allowed on Flexify side.

Signature
Get your Api Keys and follow samples below to sign requests.

Javascript
PHP
POST
const request = require('request');
const sha256 = require('crypto-js/sha256');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const base64 = require('crypto-js/enc-base64');
const moment = require('moment');

const apiKey = 'f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9';
const apiSecret = 'd4479c0af1a913c93fa65a9e82fe7374a74890daaa7a8abb423b4a0e47a405a1';

const date = moment().utc().format();
// >> 2022-01-01T01:00:00Z

const host = 'h2h.flexify.finance'; // For H2H Gate Api
// const host = 'hpp.flexify.finance'; For HPP Gate Api

// Request body example
const body = '{"some": "variable"}';

// Get hash of body using SHA256 algo and encode it the result with Base64
const digest = 'SHA-256='+base64.stringify(sha256(body));
// >> SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=

// Preparing signature payload
const signaturePayload = 'host: ' + host + 'digest: ' + digest + 'content-length: ' + Buffer.byteLength(body, 'utf8') + 'date: ' + date;
// >> host: h2h.flexify.financedigest: SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=content-length: 20date: 2022-01-01T01:00:00Z

// Creating signature using HMAC-SHA256 and encode it the result with Base64
const signature = base64.stringify(hmacSHA256(signaturePayload, apiSecret));
// >> XuYYBkHcj6wUeK6i0hJVLwPtsEE+e+pXIBPeoiLxujA=

// Preapring authorization
const authorization = 'Signature keyId="' + apiKey + '", algorithm="HmacSHA256", headers="host digest content-length date", signature="' + signature + '"';
// >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length date", signature="XuYYBkHcj6wUeK6i0hJVLwPtsEE+e+pXIBPeoiLxujA="

// Post request
request(
    {
        'method': 'POST',
        'url': 'https://h2h.flexify.finance/v1/payment',
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': authorization, // >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length date", signature="XuYYBkHcj6wUeK6i0hJVLwPtsEE+e+pXIBPeoiLxujA="
            'Digest': digest, // >> SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=
            'Host': host, // >> h2h.flexify.finance
            'Date': date // >> 2022-01-01T01:00:00Z
        },
        body: body
    },
    function (error, response, body) {
        console.log('error: ', error);
        console.log('statusCode: ', response && response.statusCode);
        console.log('body:', body);
    }
);
GET
// Preparing signature payload
const signaturePayload = 'host: ' + host + 'date: ' + date;
// >> host: h2h.flexify.financedate: 2022-01-01T01:00:00Z

// Creating signature using HMAC-SHA256 and encode it the result with Base64.
const signature = base64.stringify(hmacSHA256(signaturePayload, apiSecret));
// >> 2TDHARcWgr94OTNZP7rBCQbF05lkLyMl4EJAbRfmamE=

// Preapring authorization
const authorization = 'Signature keyId="' + apiKey + '", algorithm="HmacSHA256", headers="host date", signature="' + signature + '"';
// >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host date", signature="2TDHARcWgr94OTNZP7rBCQbF05lkLyMl4EJAbRfmamE="

// Get request
request(
    {
        'method': 'GET',
        'url': 'https://h2h.flexify.finance/v1/balance',
        'headers': {
            'Content-Type': 'application/json',
            'Authorization': authorization, // >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host date", signature="2TDHARcWgr94OTNZP7rBCQbF05lkLyMl4EJAbRfmamE="
            'Host': host, // >> h2h.flexify.finance
            'Date': date // >> 2022-01-01T01:00:00Z
        }
    },
    function (error, response, body) {
        console.log('error: ', error);
        console.log('statusCode: ', response && response.statusCode);
        console.log('body:', body);
    }
);
