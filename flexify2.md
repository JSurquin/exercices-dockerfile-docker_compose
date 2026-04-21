# Flexify Finance — Documentation complète

> Scrappé le 11/03/2026 depuis https://docs.flexify.finance
> Scope : méthodes génériques + France

---
## Introduction

**URL :** `https://docs.flexify.finance/docs`

On this page

# Introduction

With Flexify, you get an opportunity to manage various API processes from different providers and companies, accept payments, make payouts and check statuses.

This up-to-date and extensive documentation includes instructions on how to set up and use the Flexify Host-to-host and Hosted Payment Page integrations, as well as examples and developer tools.

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

Our API has been built using REST concepts and standards. To make your developer's job easier, we employ a variety of resources as well as relevant HTTP codes.

Flexify API is HTTPS only and returns JSON payloads, following JSON API conventions.

You can use the Flexify in test mode, which will not cause any genuine requests to be sent to a real-life financial institution. The API key used to authenticate the request defines whether it is in live or test mode.

## Payments and Payouts[​](#payments-and-payouts "Direct link to heading")

The Flexify payments API lets you to accept payments for products and services from your end-users via the most common payment methods and make payouts (single or batch).

Flexify payments can be processed across multiple channels, including on the website, in-app, or elsewhere on the web.

##### info

To execute payments and payouts, your account ought to be antecedently configured. It also needs to be connected to payment providers with active payment routes.

## Our endpoints[​](#our-endpoints "Direct link to heading")

H2H Gate API Endpoints:

Type

Url

Host to host

https://h2h.flexify.finance

Hosted payment page

https://hpp.flexify.finance

Merchant portal

https://my.flexify.finance

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/`

On this page

# Introduction

With Flexify, you get an opportunity to manage various API processes from different providers and companies, accept payments, make payouts and check statuses.

This up-to-date and extensive documentation includes instructions on how to set up and use the Flexify Host-to-host and Hosted Payment Page integrations, as well as examples and developer tools.

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

Our API has been built using REST concepts and standards. To make your developer's job easier, we employ a variety of resources as well as relevant HTTP codes.

Flexify API is HTTPS only and returns JSON payloads, following JSON API conventions.

You can use the Flexify in test mode, which will not cause any genuine requests to be sent to a real-life financial institution. The API key used to authenticate the request defines whether it is in live or test mode.

## Payments and Payouts[​](#payments-and-payouts "Direct link to heading")

The Flexify payments API lets you to accept payments for products and services from your end-users via the most common payment methods and make payouts (single or batch).

Flexify payments can be processed across multiple channels, including on the website, in-app, or elsewhere on the web.

##### info

To execute payments and payouts, your account ought to be antecedently configured. It also needs to be connected to payment providers with active payment routes.

## Our endpoints[​](#our-endpoints "Direct link to heading")

H2H Gate API Endpoints:

Type

Url

Host to host

https://h2h.flexify.finance

Hosted payment page

https://hpp.flexify.finance

Merchant portal

https://my.flexify.finance

---
## Api Keys

**URL :** `https://docs.flexify.finance/docs/getting-started/general`

# Api Keys

To request any Flexify APIs, you'll need an API key representing your account.

Log in to your existing account to Production Merchant Portal and get your API credentials on the API Keys page. You can find this page by clicking the 'Projects' page and the 'Project' page.

![ Api Keys ](/assets/images/api-keys-5247b7479b864d0ef7b7aeb5d12a68ed.png#center)

##### caution

Keep in mind that your API keys have much power, so take care of their safety. Please do not post them on GitHub, in client-side code, or anywhere else that is publicly available.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

With Flexify API, you can take card (credit and debit) transfer payments for goods or services on your commerce app or website. Our Payment APIs also allow you to check payment statuses.

Thanks to the REST setup, your website or application can immediately start making requests to the API, which charges your customers for their purchases using different providers. All funds will be deposited to your account instantly.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![Payment cash flow](/assets/ideal-img/payment-cash-flow.b07ba8d.1030.png)

Contact us If you need such methods as hold, or capture. With these methods you can place a hold on a card to reserve funds now, but capture them only after a service is completed. When a card payment is captured, the automatic collection ends up with success.

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Payment**:

-   Prepare a request following [instructions](/docs/payment/main_methods/h2h/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://h2h.flexify.finance/v1/payment
-   Receive a [callback](/docs/payment/main_methods/h2h/callback) or make [check](/docs/payment/main_methods/h2h/check) request.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payout/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

The Payouts API is a fast and convenient way for transferring funds from your business account to a contact's bank card. In particular, you can issue loans to bank cards, make insurance payments, cashback or return money to customers.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payout processing at the picture below:

![Payout cash flow](/assets/ideal-img/payout-cash-flow.77da4bf.921.png)

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Payout**:

-   Prepare a request following [instructions](/docs/payout/main_methods/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://h2h.flexify.finance/v1/payout
-   Receive a сallback or make check request.

## Our endpoints[​](#our-endpoints "Direct link to heading")

Type

Url

Host to host

https://h2h.flexify.finance

Merchant portal

https://my.flexify.finance

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/refund/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

The Refunds API allows you to process refunds for successful payment transactions. You can refund the full amount or a partial amount to the original payment method.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in refund processing at the picture below:

![Refund cash flow](/assets/ideal-img/payout-cash-flow.77da4bf.921.png)

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Refund**:

-   Prepare a request following [instructions](/docs/refund/main_methods/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://h2h.flexify.finance/v1/refund
-   Receive a callback or make check request.

## Important restrictions[​](#important-restrictions "Direct link to heading")

-   Refund requests are allowed only for successful parent payment transactions
-   Refunds are allowed only within 180 days from the parent transaction creation date

## Our endpoints[​](#our-endpoints "Direct link to heading")

Type

Url

Host to host

https://h2h.flexify.finance

---
## Authentication

**URL :** `https://docs.flexify.finance/docs/getting-started/auth`

On this page

# Authentication

## Introduction[​](#introduction "Direct link to heading")

Flexify API needs you to authenticate each request you send by signing it.

It should be noted that all requests without authentication will be rejected.

All authentication in the **H2H Gate API** and **HPP Gate API** is handled using **HMAC-SHA256** signature.

The **HMAC** signature is just some extra data provided with a request to identify the end-user using a hashed value. The signature is part of the **Authorization** header of your request.

##### caution

Before using **H2H** or **HPP** Gate APIs your server's IP **MUST BE** allowed on Flexify side.

## Signature[​](#signature "Direct link to heading")

Get your [Api Keys](/docs/getting-started/general) and follow samples below to sign requests.

-   Javascript
-   PHP

POST

```
const request = require('request');const sha256 = require('crypto-js/sha256');const hmacSHA256 = require('crypto-js/hmac-sha256');const base64 = require('crypto-js/enc-base64');const moment = require('moment');const apiKey = 'f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9';const apiSecret = 'd4479c0af1a913c93fa65a9e82fe7374a74890daaa7a8abb423b4a0e47a405a1';const date = moment().utc().format();// >> 2022-01-01T01:00:00Zconst host = 'h2h.flexify.finance'; // For H2H Gate Api// const host = 'hpp.flexify.finance'; For HPP Gate Api// Request body exampleconst body = '{"some": "variable"}';// Get hash of body using SHA256 algo and encode it the result with Base64const digest = 'SHA-256='+base64.stringify(sha256(body));// >> SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=// Preparing signature payloadconst signaturePayload = 'host: ' + host + 'digest: ' + digest + 'content-length: ' + Buffer.byteLength(body, 'utf8') + 'date: ' + date;// >> host: h2h.flexify.financedigest: SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=content-length: 20date: 2022-01-01T01:00:00Z// Creating signature using HMAC-SHA256 and encode it the result with Base64const signature = base64.stringify(hmacSHA256(signaturePayload, apiSecret));// >> XuYYBkHcj6wUeK6i0hJVLwPtsEE+e+pXIBPeoiLxujA=// Preapring authorizationconst authorization = 'Signature keyId="' + apiKey + '", algorithm="HmacSHA256", headers="host digest content-length date", signature="' + signature + '"';// >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length date", signature="XuYYBkHcj6wUeK6i0hJVLwPtsEE+e+pXIBPeoiLxujA="// Post requestrequest(    {        'method': 'POST',        'url': 'https://h2h.flexify.finance/v1/payment',        'headers': {            'Content-Type': 'application/json',            'Authorization': authorization, // >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length date", signature="XuYYBkHcj6wUeK6i0hJVLwPtsEE+e+pXIBPeoiLxujA="            'Digest': digest, // >> SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=            'Host': host, // >> h2h.flexify.finance            'Date': date // >> 2022-01-01T01:00:00Z        },        body: body    },    function (error, response, body) {        console.log('error: ', error);        console.log('statusCode: ', response && response.statusCode);        console.log('body:', body);    });
```
Copy

GET

```
// Preparing signature payloadconst signaturePayload = 'host: ' + host + 'date: ' + date;// >> host: h2h.flexify.financedate: 2022-01-01T01:00:00Z// Creating signature using HMAC-SHA256 and encode it the result with Base64.const signature = base64.stringify(hmacSHA256(signaturePayload, apiSecret));// >> 2TDHARcWgr94OTNZP7rBCQbF05lkLyMl4EJAbRfmamE=// Preapring authorizationconst authorization = 'Signature keyId="' + apiKey + '", algorithm="HmacSHA256", headers="host date", signature="' + signature + '"';// >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host date", signature="2TDHARcWgr94OTNZP7rBCQbF05lkLyMl4EJAbRfmamE="// Get requestrequest(    {        'method': 'GET',        'url': 'https://h2h.flexify.finance/v1/balance',        'headers': {            'Content-Type': 'application/json',            'Authorization': authorization, // >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host date", signature="2TDHARcWgr94OTNZP7rBCQbF05lkLyMl4EJAbRfmamE="            'Host': host, // >> h2h.flexify.finance            'Date': date // >> 2022-01-01T01:00:00Z        }    },    function (error, response, body) {        console.log('error: ', error);        console.log('statusCode: ', response && response.statusCode);        console.log('body:', body);    });
```
Copy

POST

```
$apiKey = 'f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9';$apiSecret = 'd4479c0af1a913c93fa65a9e82fe7374a74890daaa7a8abb423b4a0e47a405a1';$host = 'h2h.flexify.finance';// $host = 'hpp.flexify.finance'; For HPP Gate Api$now = new \DateTimeImmutable();$date = $now->format(\DateTime::ATOM);// 2022-01-01T01:00:00+00:00$body = '{"some": "variable"}';// Get hash of body using SHA256 algo and encode it the result with Base64.$digest = 'SHA-256=' . base64_encode(hash('sha256', $body, true));// >> SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=// Preparing signature payload$signaturePayload = 'host: ' . $host . 'digest: ' . $digest . 'content-length: ' . strlen($body) . 'date: ' . $date;// >> host: h2h.flexify.financedigest: SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=content-length: 20date: 2022-01-01T01:00:00+00:00// Creating signature using HMAC-SHA256 and encode it the result with Base64$signature = base64_encode(hash_hmac('sha256', $signaturePayload, $apiSecret, true));// >> b1/8yZk03G3EtJFKnBndh0wwXs+jvsgWaInetqYih3w=$authorization = 'Signature keyId="' . $apiKey . '", algorithm="HmacSHA256", headers="host digest content-length date", signature="' . $signature . '"';// >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length date", signature="b1/8yZk03G3EtJFKnBndh0wwXs+jvsgWaInetqYih3w="$ch = curl_init();curl_setopt($ch, CURLOPT_URL, 'https://' . $host . '/v1/payment');curl_setopt($ch, CURLOPT_POST, 1);curl_setopt($ch, CURLOPT_POSTFIELDS, $body);curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);curl_setopt($ch, CURLOPT_HTTPHEADER, [    'Content-Type: application/json',    'Authorization: ' . $authorization, // >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length date", signature="b1/8yZk03G3EtJFKnBndh0wwXs+jvsgWaInetqYih3w="    'Digest: ' . $digest, // >> SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=    'Host: ' . $host, // >> h2h.flexify.finance    'Date: ' . $date, // >> 2022-01-01T01:00:00+00:00]);$output = curl_exec($ch);curl_close($ch);var_dump($output);
```
Copy

GET

```
// Preparing signature payload$signaturePayload = 'host: ' . $host . 'date: ' . $date;// >> host: h2h.flexify.financedate: 2022-01-01T01:00:00+00:00// Creating signature using HMAC-SHA256 and encode it the result with Base64$signature = base64_encode(hash_hmac('sha256', $signaturePayload, $apiSecret, true));// >> l+7Pm0QoQP+VbUawc+X9b//Xj25NoFtYX5uAK142hAI=$authorization = 'Signature keyId="' . $apiKey . '", algorithm="HmacSHA256", headers="host date", signature="' . $signature . '"';// >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host date", signature="l+7Pm0QoQP+VbUawc+X9b//Xj25NoFtYX5uAK142hAI="$ch = curl_init();curl_setopt($ch, CURLOPT_URL, 'https://' . $host . '/v1/balance');curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);curl_setopt($ch, CURLOPT_HTTPHEADER, [    'Content-Type: application/json',    'Authorization: ' . $authorization, // >> Signature keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host date", signature="l+7Pm0QoQP+VbUawc+X9b//Xj25NoFtYX5uAK142hAI="    'Host: ' . $host, // >> h2h.flexify.finance    'Date: ' . $date, // >> 2022-01-01T01:00:00+00:00]);$output = curl_exec($ch);curl_close($ch);var_dump($output);
```
Copy

---
## Statuses

**URL :** `https://docs.flexify.finance/docs/getting-started/status`

# Statuses

There is you can find known statuses.

Status

Success

Final

Explanation

H2H

HPP

new

false

false

Created

+

+

opened

false

false

Customer is opened checkout page

\-

+

pending

false

false

Is not completed yet. Wait for a callback or make check request

+

+

success

true

true

Completed successfuly

+

+

declined

false

true

Declined. On the [error codes](/docs/getting-started/error-codes) page you can find explanation.

+

\-

failed

false

true

Declined. On the [error codes](/docs/getting-started/error-codes) page you can find explanation.

\-

+

expired

false

true

Expired after 20 min for payment intention and 7 days for payment

+

+

error

false

true

Failed

+

\-

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/getting-started/card-token`

On this page

# Introduction

Thanks to this method, you can create card tokens without generating a card transaction. You will be able to use this token for all card H2H payments and payouts.

Also, you can view these transactions in our admin panel using the transaction type "tokenization".

## Request[​](#request "Direct link to heading")

Use the URL POST https://h2h.flexify.financev1/card/tokenize to create card token without create card payment.

```
{    "card": { // required        "pan": "4242424242424242", // required        "holder_name": "Holder Name", // required        "exp_month": "10", // required        "exp_year": "2035" // required    },    "customer": { // required        "identifier": "12345", // required, may be used any unique value from system of merchant        "email": "user@example.com", // optional        "phone": "333333333", // optional        "first_name": "Darth", // optional        "last_name": "Vader", // optional        "middle_name": "Skywalker", // optional        "country": "UA", // optional, ISO 3166-1        "state_code": "NY", // optional, ISO 3166-2 subdivision code representing the state or province        "city": "Kyiv", // optional        "address": "Stepana street, 9", // optional        "zip_code": "38082365", // optional        "itn": "X1234567890", // optional        "birthday": "2006-01-02", // optional        "ip": "192.168.0.1", // optional        "gender": "female" // optional    }}
```
Copy

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

-   Created
-   Declined

```
{    "error_code": 0,    "error_reason": "",    "identifier": "PM00000000CML8A",    "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",    "card": {        "bin": "535528",        "last_4": "0887",        "exp_month": "10",        "exp_year": "2029",        "country": "UA",        "brand": "mastercard",        "token": "bcc0e3b4-1040-41f3-9499-2411350119fd",        "holder_name": "Test name example"    },    "timestamp": "2024-04-01T18:08:24Z"}
```
Copy

```
{    "error_code": 1001,    "error_reason": "Transaction is declined",    "identifier": "PM00000000CML8A",    "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",    "timestamp": "2024-04-01T18:08:24Z"}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "65578e53-ee92-47f4-9202-c4c5c957244",  "error_fields": [    {      "field": "customer.identifier",      "message": "customer.identifier is a required field"    }  ],  "timestamp": "2024-02-09T10:48:09Z"}
```
Copy

---
## Error codes

**URL :** `https://docs.flexify.finance/docs/getting-started/error-codes`

# Error codes

Code

Reason

Description

0

Ok

Request completed without errors

1

General internal error

Unexpected error occurred

2

Internal transport timeout

Internal timeout occurred. Try again later

5

Access denied

You are not able to perform this action

10

Authorization error

Error occurred while authorization performing

11

Invalid authorization signature

Invalid signature or invalid / inactive API secret

30

Invalid params

We are unable to process the request due to incorrect or missing params. Check swagger api doc.

31

Missing required params

We are unable to process the request due to incorrect or missing params. Check swagger api doc

35

Resource not found

The requested resource is undefined

100

Transaction queued

The requested transaction is in queue

101

Transaction not found

The requested transaction is undefined

105

Transaction expired

Transaction timeout expired

108

Duplicated transaction

Transaction request with the same information has already been submitted

115

Refund not possible

Unable to process the the refund

120

Blocked routing

No route available for payment lightning

121

Route is invalid

An issue has been detected in the routing settings. For instance, it could be due to a disabled project or bank

200

Transaction processing error

An unexpected internal processing error occurred

210

Bank connection error

The bank is not available. Connection error occurred

211

Bank connection timeout

Request timeout expired while establishing connection with the bank

212

Processing timeout

Request timeout expired while waiting for the bank response

213

3D Secure failed

The cardholder hasn't entered their details correctly

451

General risk decline

General risk decline. Project scope

452

General risk decline

General risk decline. System scope

500

Insufficient funds on account

Your Project's account doesn't have enough funds for the transaction

620

Payment intention expired

Payment intention timeout expired

1000

Bank internal error

Internal error occurred

1001

General bank decline

General bank decline

1002

Duplicated transaction on bank

Transaction with the specified parameters already exists

1003

Undefined transaction on bank

Transaction was not found on the bank side

1005

Transaction expired on bank

Transaction expired on the bank side

1020

Insufficient funds on the card

There are insufficient funds on the user card to make the payment

1021

Invalid amount

The amount passed in the payment request is not supported or invalid. Please Check swagger api documentation

1022

Invalid currency

The currency passed in the payment request is not supported or invalid. Please Check swagger api documentation

1023

Invalid CVV

The credit card CVV was entered incorrectly

1024

Invalid PAN

The credit card information was entered incorrectly or the credit card is invalid

1030

Invalid or absent customer email

Invalid or absent customer email

1031

Invalid or absent customer phone

Invalid or absent customer phone

1032

Invalid or absent customer country

Invalid or absent customer country

1033

Invalid or absent customer state code

Invalid or absent customer state code

1034

Invalid or absent customer city

Invalid or absent customer city

1035

Invalid or absent customer address

Invalid or absent customer address

1036

Invalid or absent customer zip code

Invalid or absent customer zip code

1037

Invalid or absent customer first name

Invalid or absent customer first name

1038

Invalid or absent customer last name

Invalid or absent customer last name

1039

Invalid or absent customer middle name

Invalid or absent customer middle name

1050

Bank does not support transaction

The requested operation is not supported by the bank

1051

Bank not supports currency

The currency is not supported for this type of transaction. Please contact technical support

1052

Bank not supports country

The country code is not supported for this type of transaction. Please contact technical support

1053

Bank not supports card type

The card type that is being used has not been set up to support this type of transaction. Please сontact technical support

1054

Bank not supports payment method

The payment method that is being used has not been set up. Please сontact technical support

1110

Card lost or stolen

Transaction declined due to card had been lost or stolen

1111

Card expired

Transaction declined due to card had expired

1112

Card limit exceeded

Contact financial institution to increase online payment limits or try different card

1113

Transaction not permitted for card

Transaction cannot be performed for this card

1114

Decline by issuer

The card issuer stopped the transaction

1120

Insufficient funds on the card

The card does not have enough funds to cover the order

1121

Insufficient funds on the bank account

The card does not have enough funds to cover the order

1130

Refund not possible

Unable to make a Refund due to a reason on the Bank's side

1131

Refund limit exceeded

Unable to make a Refund due to insufficient funds on the card

1132

Limit exceeded

You have exceeded the maximum transaction limit set by the Bank

1140

3D secure failed

The client could not pass the 3Ds authentication for some reason

1141

3D secure expired

The client did not pass the 3Ds authentication within the deadline

1200

Risk decline by bank

Transaction is declined by Bank's Antifraud system

---
## Request

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h/request`

On this page

# Request

# Payment Request

Here you can find instructions on how to make a Payment Intention request.

Use the URL https://h2h.flexify.finance/v1/payment to send Payment request to the Gate API.

## Credit card method[​](#credit-card-method "Direct link to heading")

### Request[​](#request "Direct link to heading")

-   Card Initial
-   By Token

```
{  "method": "card", // required  "mode": "initial", // required  "reference": "order-00001", // required  "currency": "USD", // required, you can use any currency that is supported by your provider  "amount": 25.01, // required  "description": "My order", // conditional  "card": { // required    "pan": "4242424242424242",    "holder_name": "Holder Name",    "cvv": "125",    "exp_month": "10",    "exp_year": "2035"  },  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "phone": "333333333", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // conditional    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // conditional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "ip": "192.168.0.1", // conditional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "redirect_url": "https://merchant.domain/customer_pending_page",  "callback_url": "https://merchant.domain/callback",  "extra": {    "browser": { // the object is not required, but highly desirable for increasing conversion      "ip": "192.0.2.1",      "header_accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", // optional      "language": "uk",      "screen_color_depth": 24,      "screen_height": 1080,      "screen_pixel_depth": 24,      "screen_width": 1920,      "timezone_offset_minutes": -120, // optional      "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",      "window_height": 531,      "window_width": 1848    },    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

Card token you can get on the success payment response or in the callback notification on success payment.

```
{  "mode": "token",  "method": "card",  "reference": "order-00002",  "currency": "USD",  "amount": 25.01,  "card": {    "token": "328e85d1-5b3e-4ee0-9c81-e18d7a9ab435", // required    "cvv": "125" // conditional  },  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant.    "email": "user@example.com",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA", // ISO 3166-1    "state_code": "NY", // ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "phone": "333333333",    "ip": "192.168.0.1",    "gender": "female",    "identity": "identity card"  },  "redirect_url": "https://merchant.domain/customer_pending_page",  "callback_url": "https://merchant.domain/callback",  "extra": {    "browser": { // the object is not required, but highly desirable for increasing conversion      "ip": "192.0.2.1",      "header_accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", // optional      "language": "uk",      "screen_color_depth": 24,      "screen_height": 1080,      "screen_pixel_depth": 24,      "screen_width": 1920,      "timezone_offset_minutes": -120, // optional      "user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",      "window_height": 531,      "window_width": 1848    },    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

### Response flow diagram[​](#response-flow-diagram "Direct link to heading")

![ Payment Response Flow ](/assets/images/payment-response-flow-2ead6ff8900f50992dcc6e1f42b59e93.png#center)

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - Transaction is **Failed**.
    
    All error codes you can find at [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    If status field is **not equals** to success and pending - Transaction is **Failed**.
    
    All payment statuses you can find at [Payment Statuses](/docs/getting-started/status) section.
    
    If status field is **equals** to pending, need to handle response:
    
    -   If in the response presents an "сhallenge" object, please follow the [challenge](/docs/payment/main_methods/h2h/challenge) instructions;
    -   If in the response absents an "сhallenge" object, please make the [check status](/docs/payment/main_methods/h2h_card_redirect/check) of transaction, find "сhallenge" object and follow the [challenge](/docs/payment/main_methods/h2h/challenge) instructions.

#### Response examples for Card method[​](#response-examples-for-card-method "Direct link to heading")

-   Pending with challenge
-   Pending without challenge
-   Success
-   Decline
-   Error

If you get non-final pending status follow [3DS Challenge](/docs/payment/main_methods/h2h/challenge).

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "challenge": {    "challenge_type": "redirect",    "challenge_redirect": {      "url": "https://challenge.domain.com/payment/3ds/challenge/65578e53-ee92-47f4-9202-c4c5c9572449"    }  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

If you get non-final pending status follow [3DS Challenge](/docs/payment/main_methods/h2h/challenge).

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

Final status success means the Payment is completed successfully.

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML73",  "request_id": "d7a9eb96-c91f-411b-82f8-3f716568f0b8",  "reference": "health-payment-1617300413503",  "status": "success",  "type": "payment",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "timestamp": "2021-04-01T18:06:55Z"}
```
Copy

Final status declined means the Payment is declined.

```
{  "error_code": 1001,  "error_reason": "Transaction is declined",  "identifier": "PM00000000CML9H",  "request_id": "4aa05b84-8031-48b5-8c90-6a81d1f08cc6",  "reference": "ref-1617300541",  "status": "declined",  "type": "payment",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2021-04-01T18:09:02Z"}
```
Copy

Final status error means the Payment is failed.

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "identifier": "PM000000012MAX3",  "request_id": "d2348e57-4ef5-4a7a-8a6c-ef046bf90b5f",  "reference": "ref-1644404008488",  "status": "error",  "type": "payment",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2022-02-09T10:53:33Z"}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "reference",      "message": "reference is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You should wait for a [callback](/docs/payment/main_methods/h2h/callback) or make [check](/docs/payment/main_methods/h2h/check) to get status of transaction.

---
## Challenges

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h/challenge`

On this page

# Challenges

If you get a Payment response with status pending you should prepare a **challenge** for your Customer.

Look at the field challenge.challenge\_type to detect what is the type of challenge need to perform.

## Challenge Types:[​](#challenge-types "Direct link to heading")

### Redirect[​](#redirect "Direct link to heading")

If you get challenge.challenge\_type with value redirect then you should redirect your Customer to the URL in the field challenge.challenge\_redirect.url.

After the Customer passes [Three-D Secure](https://en.wikipedia.org/wiki/3-D_Secure), they will be automatically redirected to the URL specified in the redirect\_url field of your request.

#### Response example from [request of create payment](/docs/payment/main_methods/h2h/request#response-examples-for-card-method)[​](#response-example-from-request-of-create-payment "Direct link to heading")

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "challenge": {    "challenge_type": "redirect",    "challenge_redirect": {      "url": "https://challenge.domain.com/payment/3ds/challenge/65578e53-ee92-47f4-9202-c4c5c9572449"    }  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

### OTP (African region only)[​](#otp-african-region-only "Direct link to heading")

If you get challenge.challenge\_type with value otp then you should ask the user to enter a code that will be sent to the specified email or phone number. If the user has not received the otp code, you can request [re-sending the otp code](/docs/payment/main_methods/h2h/challenge#resend-otp), only one attempt available (attention, not available for all providers).

After the Customer passes otp challenge you need to create request to method which described below and handle the response of this method:

-   If status of transaction move to success or declined, this means that work with this transaction is completed and no further actions are not needed.
-   If status of transaction still in pending you need complete the following challenge, which described from this page (if challenge\_type without changed, this means that the user entered incorrect data).

#### Response example from [request of create payment](/docs/payment/main_methods/h2h/request#response-examples-for-card-method)[​](#response-example-from-request-of-create-payment-1 "Direct link to heading")

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "challenge": {    "challenge_type": "otp"  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

#### Complete otp challenge[​](#complete-otp-challenge "Direct link to heading")

_Request_

Use the URL: https://h2h.flexify.finance/v1/payment/challenge/otp

```
{  "reference": "order1111", // string, required  "otp": "625424" // required}
```
Copy

_Response_

-   Pending
-   Success
-   Declined

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "challenge": {    "challenge_type": "address_verification" // Can be any challenge described on this page  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

#### Resend otp[​](#resend-otp "Direct link to heading")

_Request_

Use the URL: https://h2h.flexify.finance/v1/payment/challenge/otp/resend

```
{  "reference": "order1111" // string, required}
```
Copy

_Response_

-   Pending
-   Success
-   Declined

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "challenge": {    "challenge_type": "address_verification" // Can be any challenge described on this page  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

### PIN (African region only)[​](#pin-african-region-only "Direct link to heading")

If you get challenge.challenge\_type with value card\_pin then you should ask the user to enter a pin code of his card.

After the Customer passes card\_pin challenge you need to create request to method which described below and handle the response of this method:

-   If status of transaction move to success or declined, this means that work with this transaction is completed and no further actions are not needed.
-   If status of transaction still in pending you need complete the following challenge, which described from this page (if challenge\_type without changed, this means that the user entered incorrect data).

#### Response example from [request of create payment](/docs/payment/main_methods/h2h/request#response-examples-for-card-method)[​](#response-example-from-request-of-create-payment-2 "Direct link to heading")

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "challenge": {    "challenge_type": "otp"  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

#### Complete card pin challenge[​](#complete-card-pin-challenge "Direct link to heading")

_Request_

Use the URL: https://h2h.flexify.finance/v1/payment/challenge/card-pin

```
{  "reference": "order1111", // string, required  "card_pin": "4214" // string, required}
```
Copy

_Response_

-   Pending
-   Success
-   Declined

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "challenge": {    "challenge_type": "otp" // Can be any challenge described on this page  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

### Address verification (African region only)[​](#address-verification-african-region-only "Direct link to heading")

If you get challenge.challenge\_type with value address\_verification then you should ask the user to enter his address details information.

After the Customer passes address\_verification challenge you need to create request to method which described below and handle the response of this method:

-   If status of transaction move to success or declined, this means that work with this transaction is completed and no further actions are not needed.
-   If status of transaction still in pending you need complete the following challenge, which described from this page (if challenge\_type without changed, this means that the user entered incorrect data).

#### Response example from [request of create payment](/docs/payment/main_methods/h2h/request#response-examples-for-card-method)[​](#response-example-from-request-of-create-payment-3 "Direct link to heading")

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "challenge": {    "challenge_type": "address_verification"  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

#### Complete address verification challenge[​](#complete-address-verification-challenge "Direct link to heading")

_Request_

Use the URL: https://h2h.flexify.finance/v1/payment/challenge/address-verification

```
{  "reference": "order1111", // string, required  "country": "Nigeria", // string, required. Without ISO verification  "state_code": "Lagos", // string, required. Without ISO verification  "city": "Lekki", // string, required  "address": "address", // string, required  "zip_code": "101010" // string, required}
```
Copy

_Response_

-   Pending
-   Success
-   Declined

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "challenge": {    "challenge_type": "otp" // Can be any challenge described on this page  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

### Phone verification (African region only)[​](#phone-verification-african-region-only "Direct link to heading")

If you get challenge.challenge\_type with value phone\_verification then you should ask the user to enter the phone number which tied to the bank account.

After the Customer passes phone\_verification challenge you need to create request to method which described below and handle the response of this method:

-   If status of transaction move to success or declined, this means that work with this transaction is completed and no further actions are not needed.
-   If status of transaction still in pending you need complete the following challenge, which described from this page (if challenge\_type without changed, this means that the user entered incorrect data).

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "challenge": {    "challenge_type": "phone_verification"  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

#### Complete phone verification challenge[​](#complete-phone-verification-challenge "Direct link to heading")

_Request_

Use the URL: https://h2h.flexify.finance/v1/payment/challenge/phone-verification

```
{  "reference": "order1111", // string, required  "phone": "2348000000000" // string, required}
```
Copy

_Response_

-   Pending
-   Success
-   Declined

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "challenge": {    "challenge_type": "address_verification" // Can be any challenge described on this page  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

## Callback[​](#callback "Direct link to heading")

After Payment transaction is completed we will send the callback notification with a final status of transaction.

Follow the [callback](/docs/payment/main_methods/h2h/callback) docs to get more information.

## Check[​](#check "Direct link to heading")

Otherwise you can make a check request to obtain Payment details.

Follow the [check](/docs/payment/main_methods/h2h/check) docs to get more information.

---
## Check Request

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h/check`

On this page

# Check Request

You can perform a check request to obtain Payment details.

Use the URL https://h2h.flexify.finance/v1/payment/check to send a check request to the Gate API.

## Request[​](#request "Direct link to heading")

```
{  "reference": "order-00001"}
```
Copy

## Response - 200 OK[​](#response---200-ok "Direct link to heading")

-   Pending
-   Success
-   Declined
-   Not Found
-   In Queue

```
{    "error_code": 0,    "error_reason": "",    "identifier": "PM00000000FONI1",    "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "currency": "USD",    "amount": "25.01",    "status": "pending",    "card": {      "bin": "401200",      "last_4": "3119",      "exp_month": "11",      "exp_year": "2055",      "brand": "visa"    },    "transaction_external_meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    },    "challenge": {      "challenge_type": "redirect",      "challenge_redirect": {          "url": "https://some_url_for_redirect"      }    },    "timestamp": "2024-04-01T18:08:24Z",    "status_date": "2024-04-01T18:08:54Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "card": {    "bin": "424242",    "last_4": "4242",    "exp_month": "10",    "exp_year": "2035",    "brand": "visa",    "token": "65b1538d-315f-4d73-9350-cf3bdaf4397c"  },  "transaction_external_meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "transaction_external_meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  },  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

Transaction not found.

```
{  "error_code": 101,  "error_reason": "Transaction not found",  "request_id": "0a799552-95a4-4120-b71a-54e8c20b9b31",  "timestamp": "2022-02-10T21:31:15Z"}
```
Copy

Transaction is queue. Check it again later.

```
{  "error_code": 100,  "error_reason": "Transaction queued",  "request_id": "0a799552-95a4-4120-b71a-54e8c20b9b31",  "timestamp": "2022-02-10T21:31:15Z"}
```
Copy

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h/callback`

On this page

# Callback

We send a callback notification to the URL you passed in the transaction request in the callback\_url field on every completed transaction.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

#### Callback examples for Card transactions[​](#callback-examples-for-card-transactions "Direct link to heading")

-   Success
-   Declined
-   Error
-   Expired

Final status success means the Payment is completed successfully.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "method": "card",  "type": "payment",  "card": {    "holder_name": "Test name example",    "bin": "535528",    "last_4": "0887",    "exp_month": "10",    "exp_year": "2029",    "country": "UA",    "brand": "mastercard",    "token": "bcc0e3b4-1040-41f3-9499-2411350119fd"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "success",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USD",  "billing_amount": "25.01",  "billing_currency": "USD",  "fee_amount": "3.75",  "fee_currency": "USD",  "error_code": 0,  "error_reason": "",  "timestamp": "2022-02-09T13:12:19.440901",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

Final status declined means the Payment is declined.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:10:10.230238",  "request_id": "f3d9b070-6b7e-40f9-84c3-1281b26c5700",  "reference": "order-00001",  "method": "card",  "type": "payment",  "card": {    "bin": "535528",    "last_4": "0887",    "country": "UA",    "brand": "mastercard"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "declined",  "status_date": "2022-02-09T13:10:15.283125",  "amount": "25.01",  "currency": "USD",  "billing_amount": "25.01",  "billing_currency": "USD",  "fee_amount": "3.75",  "fee_currency": "USD",  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-09T13:10:16.318749",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

Final status error means the Payment is error.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:10:10.230238",  "request_id": "f3d9b070-6b7e-40f9-84c3-1281b26c5700",  "reference": "order-00001",  "method": "card",  "type": "payment",  "card": {    "bin": "535528",    "last_4": "0887",    "country": "UA",    "brand": "mastercard"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "error",  "status_date": "2022-02-09T13:10:15.283125",  "amount": "25.01",  "currency": "USD",  "error_code": 200,  "error_reason": "Transaction processing error",  "timestamp": "2022-02-09T13:10:16.318749",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

Final status expired means the Payment is expired.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:09:28.502989",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "reference": "order-00001",  "method": "card",  "type": "payment",  "card": {    "bin": "535528",    "last_4": "0887",    "country": "UA",    "brand": "mastercard"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "expired",  "status_date": "2022-02-09T13:12:29.251612",  "amount": "25.01",  "currency": "USD",  "error_code": 105,  "error_reason": "Transaction expired",  "timestamp": "2022-02-09T13:12:30.291332",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

---
## Test cards

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h/test`

# Test cards

Here you can find test cards for Payment.

Number

Currency

3ds

Expected status

Error Code

Error Reason

Details

4242424242424242

XTS

\-

success

0

Any cvv, any expiration date

5352783000000210

XTS

V1

success

0

Any cvv, any expiration date

4012000000003010

XTS

V2\_Frictionless

success

0

Any cvv, any expiration date

4012000000003119

XTS

V2\_Challenge

success

0

Any cvv, any expiration date

4012000000003242

XTS

V2\_Challenge

declined

1140

3D secure failed

Any cvv, any expiration date

4012000000004240

XTS

\-

declined

1110

Card lost or stolen

Any cvv, any expiration date

4012000000006740

XTS

\-

declined

1120

Insufficient funds on card

Any cvv, any expiration date

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payment/method_matchmaker/hpp/callback`

On this page

# Callback

We send a callback notification to the URL you passed in the transaction request in the callback\_url field on every completed transaction.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

#### Callback examples[​](#callback-examples "Direct link to heading")

-   Success
-   Failed
-   Error
-   Expired
-   Intention Expired

Final status success means the Payment is completed successfully.

```
{  "error_code": 0,  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "success",  "amount": "12.23",  "currency": "USD",  "billing_amount": "25.01", // may be empty  "billing_currency": "USD", // may be empty  "fee_amount": "3.75", // may be empty  "fee_currency": "USD", // may be empty  "payment": {    "error_code": 0,    "identifier": "PM0000000000002",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a2",    "reference": "order-00001",    "method": "card", // displays the method which the customer was chosen    "type": "payment",    "mode": "initial",    "status": "success",    "status_date": "2024-02-09T13:12:18.395695",    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male"    },    "card": {      // if the selected payment method not equal to "card" - this object will be empty      "holder_name": "Holder Name",      "bin": "424242",      "last_4": "4242",      "exp_month": "09",      "exp_year": "2030",      "country": "US",      "brand": "mastercard",      "token": "ddff2245-2417-4889-9a6e-44b6344d57e8"    },    "mobile_money": {      // if the selected payment method not equal to "mobile_money" - this object will be empty      "phone": "2348120000004"    },    "virtial_account": {      "provider_bank_name": "Wema",      "name": "Darth Vaider virtual account",      "number": "7650000006"    },    "creation_date": "2024-02-09T13:12:10.886803"  }}
```
Copy

Final status failed means the Payment is completed failed.

```
{  "error_code": 1120,  "error_reason": "Insufficient funds on card",  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "failed",  "amount": "12.23",  "currency": "USD",  "billing_amount": "25.01", // may be empty  "billing_currency": "USD", // may be empty  "fee_amount": "3.75", // may be empty  "fee_currency": "USD", // may be empty  "payment": {    "error_code": 1120,    "error_reason": "Insufficient funds on card",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card", // displays the method which the customer was chosen    "type": "payment",    "mode": "initial",    "status": "declined",    "status_date": "2024-02-09T13:12:18.395695",    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male"    },    "card": {      // if the selected payment method not equal to "card" - this object will be empty      "holder_name": "Holder Name",      "bin": "424242",      "last_4": "4242",      "exp_month": "09",      "exp_year": "2030",      "country": "US",      "brand": "mastercard",      "token": "ddff2245-2417-4889-9a6e-44b6344d57e8"    },    "mobile_money": {      // if the selected payment method not equal to "mobile_money" - this object will be empty      "phone": "2348120000004"    },    "virtial_account": {      "provider_bank_name": "Wema",      "name": "Darth Vaider virtual account",      "number": "7650000006"    },    "creation_date": "2024-02-09T13:12:10.886803"  }}
```
Copy

Final status error means the Payment is error.

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "error",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 200,    "error_reason": "Transaction processing error",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card", // displays the method which the customer was chosen    "type": "payment",    "mode": "initial",    "status": "error",    "status_date": "2024-02-09T13:12:18.395695",    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male"    },    "card": {      // if the selected payment method not equal to "card" - this object will be empty      "holder_name": "Holder Name",      "bin": "424242",      "last_4": "4242",      "exp_month": "09",      "exp_year": "2030",      "country": "US",      "brand": "mastercard",      "token": "ddff2245-2417-4889-9a6e-44b6344d57e8"    },    "mobile_money": {      // if the selected payment method not equal to "mobile_money" - this object will be empty      "phone": "2348120000004"    },    "virtial_account": {      "provider_bank_name": "Wema",      "name": "Darth Vaider virtual account",      "number": "7650000006"    },    "creation_date": "2024-02-09T13:12:10.886803"  }}
```
Copy

Final status expired means the Payment is expired.

```
{  "error_code": 105,  "error_reason": "Transaction expired",  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "expired",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 105,    "error_reason": "Transaction expired",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card", // displays the method which the customer was chosen    "type": "payment",    "mode": "initial",    "status": "expired",    "status_date": "2024-02-09T13:12:18.395695",    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male"    },    "card": {      // if the selected payment method not equal to "card" - this object will be empty      "holder_name": "Holder Name",      "bin": "424242",      "last_4": "4242",      "exp_month": "09",      "exp_year": "2030",      "country": "US",      "brand": "mastercard",      "token": "ddff2245-2417-4889-9a6e-44b6344d57e8"    },    "mobile_money": {      // if the selected payment method not equal to "mobile_money" - this object will be empty      "phone": "2348120000004"    },    "virtial_account": {      "provider_bank_name": "Wema",      "name": "Darth Vaider virtual account",      "number": "7650000006"    },    "creation_date": "2024-02-09T13:12:10.886803"  }}
```
Copy

Final status expired without payment object means the Payment Intention is expired before create transaction.

```
{  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "expired",  "currency": "USD",  "amount": "12.23",  "error_code": 620,  "error_reason": "Payment intention expired"}
```
Copy

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

---
## Request

**URL :** `https://docs.flexify.finance/docs/payout/main_methods/request`

On this page

# Request

# Payout Request

Here you can find instructions how to make Payout request.

Use the URL https://h2h.flexify.finance/v1/payout to send a Payout request to the Gate API.

## Credit Card Method[​](#credit-card-method "Direct link to heading")

### Request[​](#request "Direct link to heading")

-   Initial by Card
-   By Token

```
{  "method": "card", // required  "mode": "initial", // required  "reference": "order-00001", // required  "currency": "USD", // required, you can use any currency that is supported by your provider  "amount": 25.01, // required  "description": "My order", // conditional  "card": {    "pan": "4242424242424242", // required    "exp_month": "12", // conditional    "exp_year": "2027", // conditional    "holder_name": "Darth" // conditional  },  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // conditional    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // conditional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "phone": "333333333", // optional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "sender_customer": {    "first_name": "Jeanne", // conditional    "last_name": "Doe", // conditional    "country": "FR", // conditional, ISO 3166-1    "city": "Paris", // conditional    "address": "133 avenue des Champs-Elysees", // conditional    "zip_code": "75008" // conditional  },  "callback_url": "https://merchant.domain/callback", // conditional  "extra": {    "meta": {      // any field which may be needed for transaction routing and integration      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh    }  }}
```
Copy

Card token you can get on [payment](/docs/payment/main_methods/h2h/request) response or payment [callback](/docs/payment/main_methods/h2h/callback) notification.

```
{  "method": "card", // required  "mode": "token", // required  "reference": "order-00001", // required  "currency": "EUR", // required  "amount": 25.01, // required  "description": "My order", // conditional  "card": {    "token": "328e85d1-5b3e-4ee0-9c81-e18d7a9ab435" // required  },  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // conditional,    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // conditional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "phone": "333333333", // optional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "sender_customer": {    "first_name": "Jeanne", // conditional    "last_name": "Doe", // conditional    "country": "FR", // conditional, ISO 3166-1    "city": "Paris", // conditional,    "address": "133 avenue des Champs-Elysees", // conditional    "zip_code": "75008" // conditional  },  "callback_url": "https://merchant.domain/callback", // conditional  "extra": {    "meta": {      // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

### Response flow diagram[​](#response-flow-diagram "Direct link to heading")

![ Payout Response Flow ](/assets/images/payout-response-flow-5fb09d3536a128f65701e784a3c8c5c4.png#center)

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - transaction is **Failed**.
    
    All error codes you can find at [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    The field status always has pending status if there are no errors.
    
    Make [check](/docs/payout/main_methods/check) request or wait for a callback to get final transaction status.
    
    All payout statuses you can find at [Payout Statuses](/docs/getting-started/status) section.
    

#### Response example[​](#response-example "Direct link to heading")

-   Pending
-   Error

If you get non-final pending status follow callback or [check](/docs/payout/main_methods/check) instructions.

```
{  "error_code": 0,  "error_reason": "",  "request_id": "caa8f24b-0183-4c1f-8b23-e4870a533307",  "reference": "order-00001",  "status": "pending",  "type": "payout",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2022-02-01T15:57:19Z"}
```
Copy

Final status error means the Payout is failed.

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "identifier": "PT0000000000D8I",  "request_id": "caa8f24b-0183-4c1f-8b23-e4870a533307",  "reference": "order-00001",  "status": "error",  "type": "payout",  "method": "card",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2022-02-01T15:57:19Z"}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "reference",      "message": "reference is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You should wait for a callback or make check to get status of transaction.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payout/method_matchmaker/h2h/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

With Flexify API, you can give the user a choice of more than 10 payout methods (including card, crypto, bank transfer and locale methods) and many providers using one integration.

Thanks to the REST setup, your website or application can immediately start making requests to the API, which charges your customers for their purchases using different providers. All funds will be withdrawal from your account.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payout processing at the picture below:

![Payout cash flow](/assets/ideal-img/payout-cash-flow.77da4bf.921.png)

### How it works?[​](#how-it-works "Direct link to heading")

1.  Merchant makes a [request](/docs/payout/method_matchmaker/h2h/available_methods) with specified currency and amount for get avalilable payout methods;
2.  Flexify returns available payout methods for specified customer;
3.  Merchant displays to the customer a list of available payout methods in terms of providers (if present);
4.  Customer chooses payout method and fills needed for this method data _(view data which user should fill for specified method in our documentation)_;
5.  Merchant prepares a request of selected by user payout method;
6.  Flexify makes payout together with provider and returns response to merchant;
7.  Merchant handles challenges from Flexify side using instruction with specified payout method;
8.  Flexify confirms payout and sends callback.

---
## Request

**URL :** `https://docs.flexify.finance/docs/refund/main_methods/request`

On this page

# Request

# Refund Request

Here you can find instructions how to make Refund request.

Use the URL https://h2h.flexify.finance/v1/refund to send a Refund request to the Gate API.

## Important restrictions[​](#important-restrictions "Direct link to heading")

-   Refund requests are allowed only for successful parent payment transactions
-   Refunds are allowed only within 180 days from the parent transaction creation date

## Card Method[​](#card-method "Direct link to heading")

### Request[​](#request "Direct link to heading")

```
{  "parent_reference": "ref-1617300503", // required, reference of the parent payment transaction  "description": "My order", // conditional  "callback_url": "https://merchant.domain/callback" // conditional}
```
Copy

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - transaction is **Failed**.
    
    All error codes you can find at [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    The field status always has pending status if there are no errors.
    
    All refund statuses you can find at [Refund Statuses](/docs/getting-started/status) section.
    

#### Response example[​](#response-example "Direct link to heading")

-   Pending
-   Error

```
{  "error_code": 0,  "error_reason": "",  "request_id": "caa8f24b-0183-4c1f-8b23-e4870a533307",  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "status": "pending",  "type": "refund",  "method": "card",  "currency": "USD",  "amount": "25.01",  "timestamp": "2022-02-01T15:57:19Z"}
```
Copy

```
{  "error_code": 1001,  "error_reason": "Transaction is declined",  "request_id": "4aa05b84-8031-48b5-8c90-6a81d1f08cc6",  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "status": "error",  "type": "refund",  "method": "card",  "currency": "USD",  "amount": "25.01",  "timestamp": "2021-04-01T18:09:02Z"}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "parent_reference",      "message": "parent_reference is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You should wait for a callback or make check to get status of transaction.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/getting-started/callback/intro`

On this page

# Introduction

We send a callback notification to the URL you passed in the transaction request in the callback\_url field on every completed transaction.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

---
## Get transaction report request

**URL :** `https://docs.flexify.finance/docs/getting-started/report/transaction`

On this page

# Get transaction report request

Use the URL Merchant https://api.flexify.finance/v1/report/transaction to get list of transaction.

Use the URL Admin https://admin-api.flexify.finance/v1/report/transaction to get list of transaction.

## Request[​](#request "Direct link to heading")

Header `Authorization`: **Basic** + space + **Base64** of `api_key:secret_key` (Username = Api key, Password = Secret key).

**Example (Admin):**

```
curl --location 'https://admin-api.asquad.dev/v1/report/transaction?created_at_from=2024-11-17T22%3A00%3A00.000Z&size=5&page=0&created_at_to=2024-11-29T21%3A59%3A59.999Z' \  --header 'Content-Type: application/json' \  --header 'Authorization: Basic <base64(api_key:secret_key)>'
```
Copy

**Example (Merchant):**

```
curl --location 'https://api.asquad.dev/v1/report/transaction?merchant_identifier=MR_XXX&created_at_from=2024-11-17T22%3A00%3A00.000Z&size=5&page=0&created_at_to=2024-11-29T21%3A59%3A59.999Z' \  --header 'Content-Type: application/json' \  --header 'Authorization: Basic <base64(api_key:secret_key)>'
```
Copy

## Fields explanations[​](#fields-explanations "Direct link to heading")

Field

Required

Description

`merchant_identifier`

true\*

This is the name of your merchant in our admin panel and start with MR\_. For example: MR\_TEST. Merchant report: required, Admin report: optional

`created_at_from`

true\*

ISO 8601 datetime format. May be empty if `updated_at_from` and `updated_at_to` are specified.

`created_at_to`

true\*

ISO 8601 datetime format. May be empty if `updated_at_from` and `updated_at_to` are specified.

`updated_at_from`

true\*

ISO 8601 datetime format. May be empty if `created_at_from` and `created_at_to` are specified.

`updated_at_to`

true\*

ISO 8601 datetime format. May be empty if `created_at_from` and `created_at_to` are specified.

`size`

false

For pagination. How many transactions will be displayed on the page. Highly recommended to use.

`page`

false

For pagination. The number of page. Highly recommended to use.

### Response examples[​](#response-examples "Direct link to heading")

-   200 OK Merchant
-   200 OK Admin
-   403\. When your ip address is blocked
-   403\. When credentials are incorrect

```
{  "content": [    {      "callbackDelivered": false,      "request_id": "819ac52d-efb7-4407-b7f3-b16d5d7ac93f",      "order": {        "order_id": 95020,        "order_identifier": "ORD000000003109F"      },      "transaction_identifier": "PM000000003AEOR",      "parent_transaction_id": null,      "parent_transaction_identifier": null,      "project_id": 2947,      "project_identifier": "PJ_TEST",      "project_name": "Test",      "merchant_id": 2975,      "merchant_identifier": "MR_TEST,      "merchant_name": "Test",      "description": "test",      "type": "payment",      "mode": "initial",      "source": "api",      "method": "card",      "status": "pending",      "status_date": "2024-12-17T14:06:15.345Z",      "previous_status": "pending",      "currency": "EUR",      "amount": "100",      "converted_amount": null,      "converted_currency": null,      "exchange_rate": null,      "exchange_rate_with_risk": null,      "exchange_rate_date": null,      "exchange_risk_rate": null,      "fee_amount": "0",      "fee_source": null,      "rr_amount": "0",      "billing_amount": "100",      "card_id": 6512,      "pan_id": 3859,      "card_token": null,      "card_bin": "401288",      "card_last4": "1881",      "card_mask": "401288******1881",      "card_brand": "visa",      "card_holder": "Test name",      "customer_id": 58488,      "customer_identifier": "ident-1734444371",      "customer_email": "user@example.com",      "customer_phone": "+380972515153",      "customer_itn": "X1234567890",      "customer_zip_code": "38082365",      "customer_first_name": "Darth",      "customer_middle_name": "Skywalker",      "customer_last_name": "Vader",      "customer_ip": null,      "mid_type": "ecomm",      "reference": "ref-1734444371",      "error_public_code": null,      "error_public_reason": null,      "balance_after": null,      "creation_date": "2024-12-17T14:06:12.026Z",      "update_date": "2024-12-17T14:06:15.385Z",      "billing_date": null,      "account_retentions": null,      "redirect_url": null,      "3ds": null,      "callback": {        "url": "https://api.flexify.finance/callback/h2h",        "delivered": false,        "delivered_at": null      },      "widget_id": null,      "widget_identifier": null,      "widget_theme": null,      "cascading_history": null,      "ltrs_id": null,      "ltrs_status": null,      "ltrs_provider_name": null,      "ltrs_reason": null,      "ltrs_date": null,      "receipt_link": null,      "iban_id": null,      "iban_enabled": null,      "iban": null,      "iban_bank_code": null,      "iban_country_code": null,      "iban_itn": null,      "iban_details_id": null,      "iban_first_name": null,      "iban_last_name": null,      "iban_middle_name": null,      "iban_address_id": null,      "card_country": "UA",      "iban_address": null,      "upi_account": null,      "crypto": null,      "virtual_account": null,      "bank_transfer": null,      "sepa": null,      "fps": null,      "mobile_money": null,      "wallet": null,      "bank_account": null,      "pix": null,      "mefete": null,      "papara": null,      "parolapara": null,      "moneytolia": null,      "batch_identifier": null    }  ],  "pageable": {    "page": 0,    "size": 1,    "sort": {      "orders": [],      "sorted": false,      "unsorted": true,      "empty": true    },    "unpaged": false,    "paged": true  },  "total": 7466,  "last": false,  "first": true,  "empty": false}
```
Copy

```
{  "content": [    {      "callbackDelivered": true,      "request_id": "520ce3ae-50dc-48cb-b81b-226177b1532d",      "order": {        "order_id": 95026,        "order_identifier": "ORD00000000310GL"      },      "transaction_id": 105226,      "transaction_identifier": "PT000000003AEVX",      "parent_transaction_id": null,      "parent_transaction_identifier": null,      "project_id": 646,      "project_identifier": "PJ_TEST",      "project_name": "Test",      "merchant_id": 675,      "merchant_identifier": "MR_TEST",      "merchant_name": "Test",      "description": "Test description",      "type": "payout",      "mode": "initial",      "source": "api",      "method": "card",      "status": "success",      "status_date": "2024-12-17T14:25:46.210Z",      "previous_status": "pending",      "currency": "EUR",      "amount": "10",      "converted_amount": null,      "converted_currency": null,      "exchange_rate": null,      "exchange_rate_with_risk": null,      "exchange_rate_date": null,      "exchange_risk_rate": null,      "fee_amount": "0",      "fee_source": "NONE",      "rr_amount": "0",      "billing_amount": "10",      "card_id": 903,      "pan_id": 702,      "card_token": null,      "card_bin": "518615",      "card_last4": "0045",      "card_mask": "518615******0045",      "card_brand": "mastercard",      "card_holder": null,      "card_bank_name": "",      "customer_id": 58470,      "customer_identifier": "transaction_decline@gmail.com",      "customer_email": "payout_decline@gmail.com",      "customer_phone": null,      "customer_itn": null,      "customer_zip_code": null,      "customer_first_name": "Test",      "customer_middle_name": null,      "customer_last_name": "Str",      "customer_ip": null,      "mid_id": 788,      "mid_identifier": "MID_TEST_CARD_PAYOUT",      "mid_name": "Test Payout Card",      "mid_type": null,      "bank_id": 718,      "bank_identifier": "BN_TEST",      "bank_name": "Test",      "bank_transaction_id": "GP881400022371",      "bank_session_id": null,      "reference": "ref-123",      "error_code": null,      "error_reason": null,      "error_unsafe_reason": null,      "error_unsafe_code": null,      "error_public_code": null,      "error_public_reason": null,      "balance_after": "97702.26",      "creation_date": "2024-12-17T14:22:42.452Z",      "update_date": "2024-12-17T14:25:47.460Z",      "billing_date": "2024-12-17T14:25:46.393Z",      "account_retentions": null,      "redirect_url": null,      "3ds": null,      "callback": {        "url": "https://api.flexify.finance/callback/h2h",        "delivered": true,        "delivered_at": "2024-12-17T14:25:47.427Z"      },      "widget_id": null,      "widget_identifier": null,      "widget_theme": null,      "cascading_history": null,      "ltrs_id": null,      "ltrs_status": null,      "ltrs_provider_name": null,      "ltrs_reason": null,      "ltrs_date": null,      "receipt_link": null,      "iban_system_id": null,      "iban_id": null,      "iban_enabled": null,      "iban_enabled_system_wide": null,      "iban": null,      "iban_bank_code": null,      "iban_country_code": null,      "iban_itn": null,      "iban_details_id": null,      "iban_first_name": null,      "iban_last_name": null,      "iban_middle_name": null,      "iban_address_id": null,      "card_country": "GB",      "iban_address": null,      "upi_account": null,      "crypto": null,      "virtual_account": null,      "bank_transfer": null,      "sepa": null,      "fps": null,      "mobile_money": null,      "wallet": null,      "bank_account": null,      "pix": null,      "mefete": null,      "papara": null,      "parolapara": null,      "moneytolia": null,      "reconciliation": null,      "batch_id": null,      "batch_identifier": null    }  ],  "pageable": {    "page": 0,    "size": 1,    "sort": {      "orders": [],      "sorted": false,      "unsorted": true,      "empty": true    },    "unpaged": false,    "paged": true  },  "total": 7466,  "last": false,  "first": true,  "empty": false}
```
Copy

```
<html>  <head>    <title>403 Forbidden</title>  </head>  <body>    <center>      <h1>403 Forbidden</h1>    </center>  </body></html>
```
Copy

```
1
```
Copy

---
## Check Request

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h_card_redirect/check`

On this page

# Check Request

You can perform a check request to obtain Payment details.

Use the URL https://h2h.flexify.finance/v1/payment/check to send a check request to the Gate API.

##### info

On the OpenApi [Payment Check Operation](/api#operation/payment_check) page you can find the request object explanation.

## Request[​](#request "Direct link to heading")

```
{  "reference": "order-00001"}
```
Copy

## Response - 200 OK[​](#response---200-ok "Direct link to heading")

-   Pending
-   Success
-   Declined
-   Not Found
-   In Queue

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "method": "card_redirect",  "type": "payment",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "challenge": {    "challenge_type": "redirect",    "challenge_redirect": {      "url": "https://some_url_for_redirect"    }  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "type": "payment",  "method": "card_redirect",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "success",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "identifier": "PM00000000FONI1",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "reference": "order-00001",  "type": "payment",  "method": "card_redirect",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

Transaction not found.

```
{  "error_code": 101,  "error_reason": "Transaction not found",  "request_id": "0a799552-95a4-4120-b71a-54e8c20b9b31",  "timestamp": "2022-02-10T21:31:15Z"}
```
Copy

Transaction is queue. Check it again later.

```
{  "error_code": 100,  "error_reason": "Transaction queued",  "request_id": "0a799552-95a4-4120-b71a-54e8c20b9b31",  "timestamp": "2022-02-10T21:31:15Z"}
```
Copy

---
## Callback Verification

**URL :** `https://docs.flexify.finance/docs/getting-started/callback/verification`

On this page

# Callback Verification

##### caution

We strongly recommend **do not avoid** signature verification. It will lead to a critical **vulnerability**. The intruder can emulate a callback and send it to your system. Also, you can whitelist our range of IPs to prevent the attack. Ask our Manager about a range of IPs.

## Example[​](#example "Direct link to heading")

Okay, let's imagine you got a callback to your URL https://merchant.com/callback from our system.

```
POST /callback HTTP/1.1Host: merchant.comContent-Type: application/jsonSignature: keyId="f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9", algorithm="HmacSHA256", headers="host digest content-length", signature="k1wrWHTlaan9coI1dRDoY6HMbsoBSyxbsncwyW84jks="Digest: SHA-256=WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=Content-Length: 20{"some": "variable"}
```
Copy

Verify a callback signature using your [Api Keys](/docs/getting-started/general).

```
const sha256 = require("crypto-js/sha256");const hmacSHA256 = require("crypto-js/hmac-sha256");const base64 = require("crypto-js/enc-base64");// Prepare Api keysvar apiKey = "f5b0899bd9412f75e5d734fce7cb601a4f096e34695gh9f9ab6f1717196704a9";var apiSecret =  "d4479c0af1a913c93fa65a9e82fe7374a74890daaa7a8abb423b4a0e47a405a1";// Get hash of body using SHA256 algo and encode the result with Base64const digest = "SHA-256=" + base64.stringify(sha256('{"some": "variable"}'));// >> WxDSD/tnly6hK+scOrP/tacMY2lnwHRmgZnm66gv2gU=if (req.headers["digest"] !== digest) {  throw Error(    "Invalid digest. Expected " + digest + " got " + req.headers["digest"]  );}// Preparing signature paramslet signatureParams = {};req.headers["signature"].split(", ").forEach((item) => {  const n = item.indexOf("=");  const key = item.substring(0, n);  const value = item.substring(n + 2, item.length - 1);  signatureParams[key] = value;});// Check api keyif (signatureParams["keyId"] !== apiKey) {  throw Error("Invalid api key");}// Obtaining signed headersconst signedHeaders = signatureParams["headers"];if (!signedHeaders) {  throw Error("Undefined authorization param `headers`");}// Preparing signature payloadlet signaturePayload = "";signatureParams["headers"].split(" ").forEach((item) => {  const header = req.headers[item.toLowerCase()];  if (!header) {    throw Error("Undefined header " + item);  }  signaturePayload += item + ": " + header;});// Creating signature using HMAC-SHA256 and encode it the result with Base64.const signature = base64.stringify(hmacSHA256(signaturePayload, apiSecret));// >> k1wrWHTlaan9coI1dRDoY6HMbsoBSyxbsncwyW84jks=if (signature !== signatureParams["signature"]) {  throw Error("Invalid signature");}console.log("Signature verified");
```
Copy

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h_card_redirect/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

With Flexify API, you can take card (credit and debit) transfers using a payment page which setuped from the provider side. Our Payment APIs also allow you to check payment statuses.

Thanks to the REST setup, your website or application can immediately start making requests to the API, which charges your customers for their purchases using different providers. All funds will be deposited to your account instantly.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![Payment cash flow](/assets/ideal-img/payment-cash-flow.b07ba8d.1030.png)

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Payment**:

-   Prepare a request following [instructions](/docs/payment/main_methods/h2h_card_redirect/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://h2h.flexify.finance/v1/payment
-   Handle response. Redirect customer to specified redirect url.
-   Receive a [callback](/docs/payment/main_methods/h2h_card_redirect/callback) or make [check](/docs/payment/main_methods/h2h_card_redirect/check) request.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/method_matchmaker/hpp/intro`

On this page

# Introduction

With Flexify API, you can give the user a choice of more than 10 payment methods (including card, crypto, bank transfer and locale methods) and many providers using one integration.

The user will be shown for payment only those methods that are available to him. All funds will be deposited to your account instantly.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![Payment cash flow](/assets/ideal-img/payment-cash-flow.b07ba8d.1030.png)

**How exactly it works:**

1.  Merchant makes a [request](/docs/payment/method_matchmaker/hpp/request) with specified currency and amount _(The more fields are sent from the merchant, the less the customer will have to fill out and the more accurately the available payment methods will be displayed)_;
2.  Flexify gets available payment methods and generates the payment intention;
3.  Merchant redirects the customer to specified from [response of create payment](/docs/payment/method_matchmaker/hpp/request#response---200-ok) url;
4.  Customer chooses payment method using the Flexify HPP page and fills needed for this method data;
5.  Flexify displays to the customer the needed for processing payment data;
6.  Customer makes a payment using instruction;
7.  Flexify handles data given from provider, changes status of transaction to 'success' and sends callback to the merchant;
8.  If customer chooses "crypto" and currency from the callback is different from the currency of transaction, merchant will make a request to [convert](/docs/payment/crypto/staticWallet/h2h/conversion) crypto currency from [callback](/docs/payment/method_matchmaker/hpp/callback) to needed fiat currency _(optional)_.

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Payment**:

-   Prepare a request following [instructions](/docs/payment/method_matchmaker/hpp/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://hpp.flexify.finance/v1/payment-intention
-   Receive a [callback](/docs/payment/method_matchmaker/hpp/callback) or make [check](/docs/payment/method_matchmaker/hpp/check) request

---
## Request

**URL :** `https://docs.flexify.finance/docs/payment/method_matchmaker/hpp/request`

On this page

# Request

# Payment Request

Here you can find instructions on how to make a Payment Intention request with selection method by user.

Use the URL https://hpp.flexify.finance/v1/payment-intention to send Payment Intention request to the Gate API.

## Example[​](#example "Direct link to heading")

```
{  "reference": "order-0001", // required  "currency": "USD", // required  "amount": "12.23", // required  "description": "descripion", // optional  "virtual_account": {    // optional    "name": "Test virtual account", // optional    "customer_bank_verification_number": "12345678901" // optional  },  "blik": {    // optional    "code": "777000" // optional, only 6 numeric digits  },  "bank_account_africa": {    // optional    "account_number": "2215381176", // optional    "bank_code": "033", // optional    "bank_verification_number": "01234567899", // optional    "account_dob_day": "12", // optional    "account_dob_month": "12", // optional    "account_dob_year": "2012" // optional  },  "wallet_m10": {    // optional    "account_number": "994502166554" // optional  },  "wallet_todito": {    // optional    "number": "2660893978", // optional    "verification_code": "1322" // optional  },  "wallet_vega": {    // optional, user account information that is conducting the payment    "user_id": "U000390", // optional    "user_password": "85e50554e1a17a294e74915d27410c6b" // optional  },  "customer": {    // required    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // optional    "phone": "333333333", // optional    "first_name": "Darth", // optional    "last_name": "Vader", // optional    "middle_name": "Skywalker", // optional    "country": "UA", // optional, ISO 3166-1    "state_code": "NY", // optional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // optional    "address": "Stepana street, 9", // optional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "ip": "192.168.0.1", // optional    "gender": "female" // optional  },  "widget": {    "method": "auto", // required    "locale": "en" // optional  },  "redirect_url": "https://merchant.domain/pending", // optional  "callback_url": "https://merchant.domain/callback", // conditional  "cancel_url": "https://merchant.domain/cancel" // optional}
```
Copy

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - Payment intention is **Failed**.
    
    All error codes you can find in [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    If status field is **not equals** to new - Payment intention is **Failed**.
    
    If status field is **equals** to new, redirect the Customer to the redirect\_url.
    

##### info

On the [Payment intention statuses](/docs/getting-started/status) page you can find all known statuses.

#### Response examples - 200 OK[​](#response-examples---200-ok "Direct link to heading")

```
{  "error_code": 0,  "identifier": "HPI0000000046GPX",  "reference": "hpp-payment-202306221129",  "request_id": "c17a96fd-d5ba-46fd-afd9-1c26d084ac89",  "status": "new",  "redirect_url": "https://..."}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

```
{  "request_id": "e76789fa-cb93-4643-9506-0314c8f82450",  "error_code": 1,  "error_reason": "Invalid fields: \nreference - must match \"[a-z0-9-_]+\";\n reference - size must be between 1 and 40",  "timestamp": "2022-02-09T17:32:46.131339",  "error_fields": {    "reference": "must match \"[a-z0-9-_]+\"; size must be between 1 and 40"  }}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You can retry the request.

---
## Check Request

**URL :** `https://docs.flexify.finance/docs/payment/method_matchmaker/hpp/check`

On this page

# Check Request

You can perform a check request to obtain Payment details.

Use the URL https://hpp.flexify.finance/v1/payment-intention/check to send a check request to the Gate API.

## Request[​](#request "Direct link to heading")

```
{  "reference": "order-00001"}
```
Copy

## Response[​](#response "Direct link to heading")

-   New
-   Opened
-   Pending
-   Success
-   Failed
-   Expired

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "new",  "amount": "12.23",  "currency": "USD",  "redirect_url": "https://checkout.domain.com/payment/12d3f1bd-8ddf-4fc2-b5ed-0279923cac99/e35133f0af43a8277360ee29814bde498a2beaa9ef86bd8a38b86bf25803d6b2"}
```
Copy

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "opened",  "amount": "12.23",  "currency": "USD"}
```
Copy

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "pending",  "amount": "12.23",  "currency": "USD"}
```
Copy

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "success",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 0,    "identifier": "PM0000000000002",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a2",    "reference": "order-00001",    "method": "card", // displays the method which the customer was chosen    "type": "payment",    "mode": "initial",    "status": "success",    "status_date": "2022-02-09T13:12:18.395695",    "card": { // if the selected payment method not equal to "card" - this object will be empty      "bin": "424242",      "last_4": "4242",      "exp_month": "10",      "exp_year": "2035",      "brand": "visa"    },    "creation_date": "2022-02-09T13:12:10.886803"  }}
```
Copy

```
{  "error_code": 1120,  "error_reason": "Insufficient funds on card",  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "failed",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 1120,    "error_reason": "Insufficient funds on card",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card", // displays the method which the customer was chosen    "type": "payment",    "mode": "initial",    "status": "declined",    "status_date": "2022-02-09T13:12:18.395695",    "card": { // if the selected payment method not equal to "card" - this object will be empty      "bin": "424242",      "last_4": "0000",      "exp_month": "12",      "exp_year": "2025",      "brand": "visa"    },    "creation_date": "2022-02-09T13:12:10.886803"  }}
```
Copy

```
{  "error_code": 105,  "error_reason": "Transaction expired",  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "expired",  "amount": "12.23",  "currency": "USD"}
```
Copy

---
## Check Request

**URL :** `https://docs.flexify.finance/docs/payout/main_methods/check`

On this page

# Check Request

You can perform check request to obtain Payout details.

Use the URL https://h2h.flexify.finance/v1/payout/check to send check request to the Gate API.

## Request[​](#request "Direct link to heading")

```
{  "reference": "order-00001"}
```
Copy

## Response - 200 OK[​](#response---200-ok "Direct link to heading")

-   Pending
-   Success
-   Declined
-   Error
-   Not Found
-   In Queue

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PT000000000000K",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "mode": "initial",  "currency": "EUR",  "amount": "25.01",  "status": "pending",  "timestamp": "2022-02-01T16:13:12Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PT000000000000K",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "mode": "initial",  "currency": "EUR",  "amount": "25.01",  "status": "success",  "timestamp": "2022-02-01T16:13:12Z",  "status_date": "2022-02-01T16:13:02Z"}
```
Copy

```
{  "error_code": 1110,  "error_reason": "Card lost or stolen",  "identifier": "PT000000000000K",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "mode": "initial",  "currency": "EUR",  "amount": "25.01",  "status": "declined",  "timestamp": "2022-02-01T16:13:12Z",  "status_date": "2022-02-01T16:13:02Z"}
```
Copy

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "identifier": "PT0000000000D8I",  "request_id": "caa8f24b-0183-4c1f-8b23-e4870a533307",  "reference": "order-00001",  "method": "card",  "type": "payout",  "mode": "initial",  "currency": "EUR",  "amount": "25.01",  "status": "error",  "timestamp": "2022-02-01T15:57:19Z",  "status_date": "2022-02-01T15:57:09Z"}
```
Copy

Transaction not found.

```
{  "error_code": 101,  "error_reason": "Transaction not found",  "request_id": "0a799552-95a4-4120-b71a-54e8c20b9b31",  "timestamp": "2022-02-10T21:31:15Z"}
```
Copy

Transaction is queue. Check it again later.

```
{  "error_code": 100,  "error_reason": "Transaction queued",  "request_id": "0a799552-95a4-4120-b71a-54e8c20b9b31",  "timestamp": "2022-02-10T21:31:15Z"}
```
Copy

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payout/main_methods/callback`

On this page

# Callback

On every completed Payout we send a callback notification to the URL you passed in the [request](/docs/payout/main_methods/request) in the callback\_url field.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

## Example[​](#example "Direct link to heading")

-   Success
-   Declined
-   Error
-   Expired

Final status success means the Payout is completed successfully.

```
{  "identifier": "PT000000000000K",  "creation_date": "2022-02-01T15:42:02.795648",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "card": {    "bin": "424242",    "last_4": "4242",    "brand": "visa"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "success",  "status_date": "2022-02-01T15:42:04.072452",  "amount": "25.01",  "currency": "EUR",  "billing_amount": "25.01",  "billing_currency": "EUR",  "fee_amount": "3.75",  "fee_currency": "EUR",  "error_code": 0,  "error_reason": "",  "timestamp": "2022-02-01T15:42:05.132564"}
```
Copy

Final status declined means the Payout is declined.

```
{  "identifier": "PT000000000000K",  "creation_date": "2022-02-01T15:42:02.795648",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "card": {    "bin": "424242",    "last_4": "4242",    "brand": "visa"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "declined",  "status_date": "2022-02-01T15:42:04.072452",  "amount": "25.01",  "currency": "EUR",  "billing_amount": "25.01",  "billing_currency": "EUR",  "fee_amount": "3.75",  "fee_currency": "EUR",  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-01T15:42:05.132564"}
```
Copy

Final status error means the Payout is failed.

```
{  "identifier": "PT000000000000K",  "creation_date": "2022-02-01T15:42:02.795648",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "card": {    "bin": "424242",    "last_4": "4242",    "brand": "visa"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "error",  "status_date": "2022-02-01T15:42:04.072452",  "amount": "25.01",  "currency": "EUR",  "error_code": 200,  "error_reason": "Transaction processing error",  "timestamp": "2022-02-01T15:42:05.132564"}
```
Copy

Final status expired means the Payout is expired.

```
{  "identifier": "PT000000000000K",  "creation_date": "2022-02-01T15:42:02.795648",  "request_id": "66bde914-5b70-48aa-8f72-6ac76f050fe9",  "reference": "order-00001",  "method": "card",  "type": "payout",  "card": {    "bin": "424242",    "last_4": "4242",    "brand": "visa"  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "mode": "initial",  "status": "expired",  "status_date": "2022-02-01T15:42:04.072452",  "amount": "25.01",  "currency": "EUR",  "error_code": 105,  "error_reason": "Transaction expired",  "timestamp": "2022-02-01T15:42:05.132564"}
```
Copy

---
## Test cards

**URL :** `https://docs.flexify.finance/docs/payout/main_methods/test`

# Test cards

Here you can find test cards for Payout.

##### caution

On initial request you always get pending status. Make [check request](/docs/payout/main_methods/check) to get **terminal** status or wait for a [callback](/docs/payout/main_methods/callback).

Number

Currency

Expected status after check

Error Code

Error Reason

Details

4242424242424242

XTS

success

0

4012000000004240

XTS

declined

1110

Card lost or stolen

---
## Get available methods

**URL :** `https://docs.flexify.finance/docs/payout/method_matchmaker/h2h/available_methods`

On this page

# Get available methods

# Info about method

This method will allow you, based on the values ​​you passed, to determine which payout methods are available to the user.

## Get available payout methods[​](#get-available-payout-methods "Direct link to heading")

### Request[​](#request "Direct link to heading")

Use the URL https://h2h.flexify.finance/v1/payout/available-methods to send request for get available payout methods.

```
{  "currency": "USD", // required  "amount": 25.01, // conditional  "description": "My order", // optional  "customer": {    "identifier": "12345", // optional, may be used any unique value from system of merchant    "email": "user@example.com", // optional    "phone": "333333333", // optional    "first_name": "Darth", // optional    "last_name": "Vader", // optional    "middle_name": "Skywalker", // optional    "country": "UA", // optional, ISO 3166-1    "state_code": "32", // optional, ISO 3166-2    "city": "Kyiv", // optional    "address": "Stepana street, 9", // optional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "ip": "192.168.0.1", // optional    "gender": "female" // optional  },  "browser": {    "ip": "192.0.2.1", // optional, ISO 3166-1    "country": "UA" // optional, ISO 3166-1  }}
```
Copy

### Logic of handle response[​](#logic-of-handle-response "Direct link to heading")

You should display to customer list of payout methods using following logic:

1.  Show to user available payout methods with image and alias name (setup on merchant side);
2.  Sort payout methods by priority (sort from min to max). May be in a negative value or empty;
3.  When user was selected payout method, necessary to show him a list of fields that need to be filled to successfully create a payout;
4.  Show to the user list of "channel" which possible for processing the payout, use "channel\*ui\_code" as a unique identifier. Request a list of available channels from our manager (optional step);
5.  Follow the instructions on the page from the specified payout method (for example: [card](/docs/payout/main_methods/request#response---200-ok)).

### Response examples[​](#response-examples "Direct link to heading")

#### Response - 200 OK[​](#response---200-ok "Direct link to heading")

```
{  "request_id": "51b6a7c4-11e0-4fbc-a372-c44df340560c",  "available_methods": [    {      "method": "card",      "priority": -1,      "currency": "UAH",      "validation": {        "min_amount": "10",        "max_amount": "1500"      }    },    {      "method": "crypto",      "priority": 1,      "currency": "BTC",      "validation": {        "min_amount": "0.00001"      }    },    {      "method": "crypto",      "priority": 2,      "currency": "ETH",      "validation": {        "max_amount": "0,55"      }    },    {      "method": "card_redirect",      "priority": 10,      "currency": "UAH"    },    {      "method": "card_redirect",      "currency": "UAH"    },    {      "method": "virtual_account",      "priority": 130,      "currency": "NGN",      "channel": {        "name": "Globus Bank",        "ui_code": "globus",        "priority": 1      }    },    {      "method": "virtual_account",      "priority": 130,      "currency": "NGN",      "channel": {        "name": "Providus Bank",        "ui_code": "providus",        "priority": null      }    },    {      "method": "deposit_opay",      "priority": 130,      "currency": "NGN",      "public_fields": [        {          "name": "betting_merchant_name",          "value": "test_merchant"        }      ]    }  ]}
```
Copy

#### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "currency",      "message": "currency is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

#### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

Please, resend request.

---
## Check Request

**URL :** `https://docs.flexify.finance/docs/refund/main_methods/check`

On this page

# Check Request

You can perform check request to obtain Refund details.

Use the URL https://h2h.flexify.finance/v1/refund/check to send check request to the Gate API.

The endpoint is used to retrieve the current refund status.

## Request[​](#request "Direct link to heading")

```
{  "reference": "ref-1617300503", // required, if "identifier" is not provided  "identifier": "RF00000000CML8A" // required, if "reference" is not provided}
```
Copy

## Response - 200 OK[​](#response---200-ok "Direct link to heading")

-   Success
-   Pending
-   Declined

```
{  "error_code": 0,  "error_reason": "",  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "method": "card",  "type": "refund",  "currency": "USD",  "amount": "25.01",  "status": "success",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:07:03Z"}
```
Copy

```
{  "error_code": 0,  "error_reason": "",  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "method": "card",  "type": "refund",  "currency": "USD",  "amount": "25.01",  "status": "pending",  "timestamp": "2024-04-01T18:08:24Z",  "status_date": "2024-04-01T18:08:54Z"}
```
Copy

```
{  "error_code": 1140,  "error_reason": "3D secure failed",  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "request_id": "8f0b50db-7ede-4edb-b36c-8b5cffdf9310",  "method": "card",  "type": "refund",  "currency": "USD",  "amount": "25.01",  "status": "declined",  "timestamp": "2021-04-01T18:08:24Z",  "status_date": "2021-04-01T18:08:20Z"}
```
Copy

---
## Callback

**URL :** `https://docs.flexify.finance/docs/refund/main_methods/callback`

On this page

# Callback

The system will send callbacks for refund-related events. Callbacks must be sent when the refund status changes.

On every completed Refund we send a callback notification to the URL you passed in the [request](/docs/refund/main_methods/request) in the callback\_url field.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

## Example[​](#example "Direct link to heading")

-   Success
-   Declined
-   Error
-   Expired

Final status success means the Refund is completed successfully.

```
{  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "method": "card",  "type": "refund",  "customer": {    "identifier": "12345"  },  "status": "success",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USD",  "billing_amount":"100.6",  "billing_currency":"USD",  "fee_amount":"0",  "fee_currency":"USD"  "error_code": 0,  "error_reason": "",  "timestamp": "2022-02-09T13:12:19.440901"}
```
Copy

Final status declined means the Refund is declined.

```
{  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "method": "card",  "type": "refund",  "customer": {    "identifier": "12345"  },  "status": "declined",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USD",  "billing_amount":"100.6",  "billing_currency":"USD",  "fee_amount":"0",  "fee_currency":"USD"  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-09T13:12:19.440901"}
```
Copy

Final status error means the Refund is failed.

```
{  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "method": "card",  "type": "refund",  "customer": {    "identifier": "12345"  },  "status": "error",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USD",  "billing_amount":"100.6",  "billing_currency":"USD",  "fee_amount":"0",  "fee_currency":"USD"  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-09T13:12:19.440901"}
```
Copy

Final status expired means the Refund is expired.

```
{  "reference": "ref-1617300503",  "parent_identifier": "PM00000000CML8A",  "identifier": "RF00000000CML8A",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "method": "card",  "type": "refund",  "customer": {    "identifier": "12345"  },  "status": "expired",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USD",  "billing_amount":"100.6",  "billing_currency":"USD",  "fee_amount":"0",  "fee_currency":"USD"  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-09T13:12:19.440901"}
```
Copy

---
## Retry strategy

**URL :** `https://docs.flexify.finance/docs/getting-started/callback/retry_strategy`

On this page

# Retry strategy

## Retries[​](#retries "Direct link to heading")

We use retries in the case when we don't receive a 200 HTTP-code from your server. To avoid DDoS on your server from our side, we have an increasing time period for callbacks. Full list of retries time periods:

Number of retryes

Time

1

_0d 00h 00m 05s_

2

_0d 00h 00m 05s_

3

_0d 00h 00m 05s_

4

_0d 00h 00m 30s_

5

_0d 00h 00m 30s_

6

_0d 00h 00m 30s_

7

_0d 00h 01m 00s_

8

_0d 00h 01m 00s_

9

_0d 00h 01m 00s_

10

_0d 00h 05m 00s_

11

_0d 00h 10m 00s_

12

_0d 00h 30m 00s_

13

_0d 01h 00m 00s_

14

_0d 01h 00m 00s_

15

_0d 01h 00m 00s_

## Timeouts[​](#timeouts "Direct link to heading")

We have 30 seconds limit for every callback response. So if your server will not respond within 30 seconds we will terminate the connection and mark the callback as unsuccessful. We will retry to send this callback again according to our retries policy. Sometimes callback handlers can contain complex business logic and take time to execute. That's why we recommend you save callback data and respond with 200 HTTP code. And after that process callback data in an async way.

---
## Authorization

**URL :** `https://docs.flexify.finance/docs/getting-started/report/auth`

# Authorization

We use basic API authorization for each request via the merchant API. Before accessing the API report, you need to generate personal credentials in the admin panel:

-   Click on your profile icon;
-   Select "Profile"; ![ Select &quot;Profile&quot; ](/assets/images/set_profile-c6f84673b086fa27130795f18de64f0b.png#center)
-   Navigate to "Reporting API Keys";
-   Click "New", enter the IPv4 address from which requests will be sent and click "Save";
-   Copy the generated API key to use in all future requests. ![ Create report api keys flow ](/assets/images/create_report_api_keys_flow-ccc04a731a68ebac793b9815bfc61719.png#center)

##### caution

The generated credentials are personal and provide access to all functions available to you as a user. Please do not share them with third parties.

---
## Request

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h_card_redirect/request`

On this page

# Request

# Payment Request

Here you can find instructions on how to make a Payment request.

Use the URL https://h2h.flexify.finance/v1/payment to send Payment request to the Gate API.

## Credit card method[​](#credit-card-method "Direct link to heading")

### Request example[​](#request-example "Direct link to heading")

```
{  "method": "card_redirect", // required  "mode": "initial", // required  "reference": "order-00001", // required  "currency": "USD", // required  "amount": 25.01, // required, you can use any currency that is supported by your provider  "description": "My order", // optional  "card_redirect": { // optional    "provider_identifier": "provider_for_test" // optional  },  "customer": {    "identifier": "user@example.com", // required, may be used any unique value from system of merchant    "email": "user@example.com", // required    "phone": "380982241221", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // conditional    "address": "Stepana street, 9", // conditional    "zip_code": "3808236535", // conditional    "itn": "X1234567890", // conditional    "birthday": "2006-01-02", // conditional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "redirect_url": "https://merchant.domain/customer_pending_page", // conditional  "callback_url": "https://merchant.domain/callback", // conditional  "cancel_url": "https://merchant.domain/cancel", // optional   "extra": {    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

### Response flow diagram[​](#response-flow-diagram "Direct link to heading")

![ Payment Response Flow ](/assets/images/payment-response-flow-2ead6ff8900f50992dcc6e1f42b59e93.png#center)

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - Transaction is **Failed**.
    
    All error codes you can find at [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    If status field is **not equals** to success and pending - Transaction is **Failed**.
    
    All payment statuses you can find at [Payment Statuses](/docs/getting-started/status) section.
    
    If status field is **equals** to pending, need to handle response:
    
    -   If in the response presents an "сhallenge" object, please follow the [challenge](/docs/payment/main_methods/h2h/challenge) instructions;
    -   If in the response absents an "сhallenge" object, please make the [check status](/docs/payment/main_methods/h2h_card_redirect/check) of transaction, find "сhallenge" object and follow the [challenge](/docs/payment/main_methods/h2h/challenge) instructions.

#### Response examples[​](#response-examples "Direct link to heading")

##### info

For pending status Flexify return self URL, this is done in order to reduce the some actions on the part of merchants: collecting Pixel data, generating HTML forms, etc...

After completing the needed system action, the user will be redirect to provider page automaticly.

-   Pending
-   Decline
-   Error

If you get non-final pending status follow [Redirect challenge](/docs/payment/main_methods/h2h/challenge).

```
{  "error_code": 0,  "error_reason": "",  "identifier": "PM00000000CML8A",  "request_id": "65578e53-ee92-47f4-9202-c4c5c9572449",  "reference": "ref-1617300503",  "status": "pending",  "type": "payment",  "method": "card_redirect",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "billing_amount": "25.01",  "billing_currency": "USD",  "fee_amount": "3.75",  "fee_currency": "USD",  "challenge": {    "challenge_type": "redirect",    "challenge_redirect": {      "url": "https://challenge.domain.com/payment/3ds/challenge/65578e53-ee92-47f4-9202-c4c5c9572449"    }  },  "timestamp": "2021-04-01T18:08:24Z"}
```
Copy

Final status declined means the Payment is declined.

```
{  "error_code": 1001,  "error_reason": "Transaction is declined",  "identifier": "PM00000000CML9H",  "request_id": "4aa05b84-8031-48b5-8c90-6a81d1f08cc6",  "reference": "ref-1617300541",  "status": "declined",  "type": "payment",  "method": "card_redirect",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2021-04-01T18:09:02Z"}
```
Copy

Final status error means the Payment is failed.

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "identifier": "PM000000012MAX3",  "request_id": "d2348e57-4ef5-4a7a-8a6c-ef046bf90b5f",  "reference": "ref-1644404008488",  "status": "error",  "type": "payment",  "method": "card_redirect",  "mode": "initial",  "currency": "USD",  "amount": "25.01",  "timestamp": "2022-02-09T10:53:33Z"}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "reference",      "message": "reference is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You should wait for a [callback](/docs/payment/main_methods/h2h_card_redirect/callback) or make [check](/docs/payment/main_methods/h2h_card_redirect/check) to get status of transaction.

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/h2h_card_redirect/callback`

On this page

# Callback

We send a callback notification to the URL you passed in the transaction request in the callback\_url field on every completed transaction.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

#### Response examples for Card transactions[​](#response-examples-for-card-transactions "Direct link to heading")

-   Success
-   Declined
-   Error
-   Expired

Final status success means the Payment is completed successfully.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "type": "payment",  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "method": "card_redirect",  "mode": "initial",  "status": "success",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USD",  "error_code": 0,  "error_reason": "",  "timestamp": "2022-02-09T13:12:19.440901",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

Final status declined means the Payment is declined.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:10:10.230238",  "request_id": "f3d9b070-6b7e-40f9-84c3-1281b26c5700",  "reference": "order-00001",  "type": "payment",  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "method": "card_redirect",  "mode": "initial",  "status": "declined",  "status_date": "2022-02-09T13:10:15.283125",  "amount": "25.01",  "currency": "USD",  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-09T13:10:16.318749",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

Final status error means the Payment is error.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:10:10.230238",  "request_id": "f3d9b070-6b7e-40f9-84c3-1281b26c5700",  "reference": "order-00001",  "type": "payment",  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "method": "card_redirect",  "mode": "initial",  "status": "error",  "status_date": "2022-02-09T13:10:15.283125",  "amount": "25.01",  "currency": "USD",  "error_code": 200,  "error_reason": "Transaction processing error",  "timestamp": "2022-02-09T13:10:16.318749",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

Final status expired means the Payment is expired.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:09:28.502989",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "reference": "order-00001",  "type": "payment",  "customer": {    "identifier": "12345",    "email": "user@example.com",    "phone": "333333333",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "country": "UA",    "state_code": "32",    "city": "Kyiv",    "address": "Stepana street, 9",    "zip_code": "38082365",    "itn": "X1234567890",    "birthday": "2006-01-02",    "ip": "192.168.0.1",    "gender": "male",    "identity": "identity card"  },  "method": "card_redirect",  "mode": "initial",  "status": "expired",  "status_date": "2022-02-09T13:12:29.251612",  "amount": "25.01",  "currency": "USD",  "error_code": 105,  "error_reason": "Transaction expired",  "timestamp": "2022-02-09T13:12:30.291332",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

---
## H2H Gateway Openapi (1.0.0)

**URL :** `https://docs.flexify.finance/api#operation/payment_check`

!function(){function t(t){document.documentElement.setAttribute("data-theme",t)}var e=function(){var t=null;try{t=localStorage.getItem("theme")}catch(t){}return t}();t(null!==e?e:"light")}()

[Skip to main content](#)

[

![Logo](/logo/black)

](/)[Introduction](/docs/)[General information](/docs/getting-started/general)[Payment](/docs/payment/main_methods/h2h/intro)[Payout](/docs/payout/intro)[Refund](/docs/refund/intro)

🌜

🌞

-   Authentication
-   H2H Openapi 3.0
    -   Payment
        -   postPayment Init
        -   postPayment Check
    -   Payout
        -   postPayout Init
        -   postPayout Check
    -   Balance
        -   getBalance
-   HPP Openapi 3.0
    -   Payment Intention
        -   postPayment Intention
        -   postPayment Intention Check

[Documentation Powered by ReDoc](https://github.com/Redocly/redoc)

# H2H Gateway Openapi (1.0.0)

# [](#section/Authentication)Authentication

## [](#section/Authentication/Signature)Signature

Follow the [Authentication](/docs/getting-started/auth) instructions to sign requests.

Security Scheme Type

API Key

Header parameter name:

Authorization

# [](#tag/Payment)Payment

On the [Payment](/docs/payment/main_methods/h2h/intro) documentation page you can find more information.

## [](#operation/payment)Payment Init

This method allows you to send a Payment transaction.

##### Authorizations:

[Signature](#section/Authentication/Signature)

##### Request Body schema: application/json

Request body

reference

required

string (reference) \[ 1 .. 40 \]

Merchant's order id or transaction id

method

required

string (method)

Value: "card"

Transaction's method

mode

required

string (mode)

Enum: "initial" "token"

Transaction's mode

amount

required

number <double> (amount) \[ 0.5 .. 1000000 \]

Amount with 2 minor units

currency

required

string (currency) \[ 3 .. 3 \]

ISO 4217 Code

card

object (Card Data)

This object is required when we use `method`: `card`.

customer

object (customerRequest)

Customer details

description

string (description) <= 255

Description of transaction

callback\_url

string <url> (callback\_url)

Url to receive a callback about request completion

redirect\_url

string <url> (redirect\_url)

Url to redirect customer after 3d-secure challenge

### Responses

**200**

Payment response

**400**

Bad request

**504**

Internal Gateway Timeout

**default**

Error Response

post/payment

https://h2h.flexify.finance/payment

### Request samples

-   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001",      -   "method": "card",      -   "mode": "initial",      -   "amount": 10.15,      -   "currency": "USD",      -   "card": {          -   "cvv": "123",              -   "exp_month": "12",              -   "exp_year": "2024",              -   "holder_name": "Darth Vader",              -   "pan": "4242424242420000",              -   "token": "55b40b0c-e450-485e-a6fd-6ba628857efa"                   },      -   "customer": {          -   "identifier": "1000",              -   "birthday": "2006-01-02",              -   "email": "user@example.com",              -   "first_name": "Darth",              -   "last_name": "Vader",              -   "phone": "333333333",              -   "ip": "192.168.0.1",              -   "gender": "female"                   },      -   "description": "Earth Planet",      -   "callback_url": "[http://merchant.domain/callback](http://merchant.domain/callback)",      -   "redirect_url": "[http://merchant.domain/pending](http://merchant.domain/pending)"       }`

### Response samples

-   200
-   400
-   default

Content type

application/json

Copy

Expand all Collapse all

`{  -   "error_code": 0,      -   "identifier": "PM00000000CML9H",      -   "reference": "order-1001",      -   "type": "payment",      -   "method": "card",      -   "mode": "initial",      -   "status": "pending",      -   "amount": "10.15",      -   "currency": "USD",      -   "card": {          -   "bin": "424242",              -   "brand": "visa",              -   "exp_month": "01",              -   "exp_year": "2024",              -   "last_4": "0000",              -   "token": "55b40b0c-e450-485e-a6fd-6ba628857efa"                   },      -   "challenge": {          -   "challenge_redirect": {                  -   "url": "[https://challenge.domain.com/some/path](https://challenge.domain.com/some/path)"                               },              -   "challenge_type": "redirect"                   },      -   "eci": "string",      -   "rrn": "string",      -   "request_id": "266ea41d-adf5-480b-af50-15b940c2b846",      -   "timestamp": "2021-04-02T17:44:24Z"       }`

## [](#operation/payment_check)Payment Check

This method allows you to obtain a Payment transaction's details.

##### Authorizations:

[Signature](#section/Authentication/Signature)

##### Request Body schema: application/json

Request body

reference

required

string

Merchant's order id or transaction id

### Responses

**200**

Payment response

**504**

Internal Gateway Timeout

**default**

Error Response

post/payment/check

https://h2h.flexify.finance/payment/check

### Request samples

-   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001"       }`

### Response samples

-   200
-   default

Content type

application/json

Copy

Expand all Collapse all

`{  -   "error_code": 1001,      -   "error_reason": "General bank decline",      -   "identifier": "PM00000000CML9H",      -   "reference": "order-1001",      -   "type": "payment",      -   "method": "card",      -   "mode": "initial",      -   "status": "declined",      -   "amount": "10.15",      -   "currency": "USD",      -   "card": {          -   "bin": "424242",              -   "brand": "visa",              -   "exp_month": "01",              -   "exp_year": "2024",              -   "last_4": "0000",              -   "token": "55b40b0c-e450-485e-a6fd-6ba628857efa"                   },      -   "challenge": {          -   "challenge_redirect": {                  -   "url": "[https://challenge.domain.com/some/path](https://challenge.domain.com/some/path)"                               },              -   "challenge_type": "redirect"                   },      -   "eci": "string",      -   "rrn": "string",      -   "request_id": "266ea41d-adf5-480b-af50-15b940c2b846",      -   "timestamp": "2021-04-02T17:44:24Z"       }`

# [](#tag/Payout)Payout

On the [Payout](/docs/payout/method_matchmaker/h2h/intro) documentation page you can find more information.

## [](#operation/payout)Payout Init

This method allows you to send a Payout transaction.

##### Authorizations:

[Signature](#section/Authentication/Signature)

##### Request Body schema: application/json

Request body

reference

required

string (reference) \[ 1 .. 40 \]

Merchant's order id or transaction id

method

required

string

Value: "card"

Payment method: card

mode

required

string

Enum: "initial" "token"

Payment mode

amount

required

number <double> \[ 0.5 .. 14999 \]

Amount with 2 minor units

currency

required

string (currency) \[ 3 .. 3 \]

ISO 4217 Code

card

object (payoutCardRequest)

Card Data

customer

object (customerRequest)

Customer details

description

string (description) <= 255

Description of transaction

callback\_url

string <url> (callback\_url)

Url to receive a callback about request completion

### Responses

**200**

Payment response

**504**

Internal Gateway Timeout

**default**

Error Response

post/payout

https://h2h.flexify.finance/payout

### Request samples

-   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001",      -   "method": "card",      -   "mode": "initial",      -   "amount": 10.15,      -   "currency": "USD",      -   "card": {          -   "Mode": "string",              -   "pan": "4242424242420000",              -   "token": "55b40b0c-e450-485e-a6fd-6ba628857efa"                   },      -   "customer": {          -   "identifier": "1000",              -   "birthday": "2006-01-02",              -   "email": "user@example.com",              -   "first_name": "Darth",              -   "last_name": "Vader",              -   "phone": "333333333",              -   "ip": "192.168.0.1",              -   "gender": "female"                   },      -   "description": "Earth Planet",      -   "callback_url": "[http://merchant.domain/callback](http://merchant.domain/callback)"       }`

### Response samples

-   200
-   default

Content type

application/json

Example

pending

pending

processing

success

declined

error

Copy

Expand all Collapse all

`{  -   "error_code": 0,      -   "reference": "order-1001",      -   "type": "payout",      -   "method": "card",      -   "mode": "initial",      -   "status": "pending",      -   "amount": "10.15",      -   "currency": "USD",      -   "request_id": "266ea41d-adf5-480b-af50-15b940c2b846",      -   "timestamp": "2021-04-02T17:44:24Z"       }`

## [](#operation/payout_check)Payout Check

This method allows you to obtain a Payout transaction's details.

##### Authorizations:

[Signature](#section/Authentication/Signature)

##### Request Body schema: application/json

Request body

reference

required

string

Merchant's order id or transaction id

### Responses

**200**

Payout response

**504**

Internal Gateway Timeout

**default**

Error Response

post/payout/check

https://h2h.flexify.finance/payout/check

### Request samples

-   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001"       }`

### Response samples

-   200
-   default

Content type

application/json

Example

pending

pending

processing

success

declined

error

Copy

Expand all Collapse all

`{  -   "error_code": 0,      -   "reference": "order-1001",      -   "type": "payout",      -   "method": "card",      -   "mode": "initial",      -   "status": "pending",      -   "amount": "10.15",      -   "currency": "USD",      -   "request_id": "266ea41d-adf5-480b-af50-15b940c2b846",      -   "timestamp": "2021-04-02T17:44:24Z"       }`

# [](#tag/Balance)Balance

## [](#operation/balance)Balance

This method allows you to get Project's balances.

##### Authorizations:

[Signature](#section/Authentication/Signature)

### Responses

**200**

Balance response

**default**

Error Response

get/balance

https://h2h.flexify.finance/balance

### Response samples

-   200
-   default

Content type

application/json

Copy

Expand all Collapse all

`{  -   "error_code": 0,      -   "balance": {          -   "current_balance": "-100.00",              -   "available_balance": "900.00",              -   "overdraft_limit": "1000.00",              -   "overdraft_used": "100.00",              -   "billing_date": "2021-04-02T17:44:24Z",              -   "currency": "USD"                   }       }`

# [](#tag/Payment-Intention)Payment Intention

On the [Payment](/docs/payment/main_methods/hpp/intro) documentation page you can find more information.

## [](#operation/payment_intention)Payment Intention

This method allows you to create a Payment intention.

##### Authorizations:

[Signature](#section/Authentication/Signature)

##### Request Body schema: application/json

Request body

reference

required

string (reference) \[ 1 .. 40 \]

Merchant's order id or transaction id

currency

required

string (currency) \[ 3 .. 3 \]

ISO 4217 Code

amount

required

string <number> (amount\_str) \[ 0.5 .. 1000000 \]

Amount with 2 minor units

description

string (description) <= 255

Description of transaction

customer

object (customerRequest)

Customer details

widget

object (widgetRequest)

Widget options

callback\_url

string <url> (callback\_url)

Url to receive a callback about request completion

redirect\_url

string <url> (redirect\_url)

Url to redirect customer after 3d-secure challenge

cancel\_url

string <url>

Url to return Customer after cancellation Payment intention.

### Responses

**200**

Payment intention response

**400**

Bad request

**504**

Follow the [documentation](/docs/payment/main_methods/hpp/request#response---504-gateway-timeout) to get more information about 504 Gateway Timeout

**default**

Error Response

post/payment-intention

https://h2h.flexify.finance/payment-intention

### Request samples

-   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001",      -   "currency": "USD",      -   "amount": "10.15",      -   "description": "Earth Planet",      -   "customer": {          -   "identifier": "1000",              -   "birthday": "2006-01-02",              -   "email": "user@example.com",              -   "first_name": "Darth",              -   "last_name": "Vader",              -   "phone": "333333333",              -   "ip": "192.168.0.1",              -   "gender": "female"                   },      -   "widget": {          -   "method": "card"                   },      -   "callback_url": "[http://merchant.domain/callback](http://merchant.domain/callback)",      -   "redirect_url": "[http://merchant.domain/pending](http://merchant.domain/pending)",      -   "cancel_url": "[http://merchant.domain/cancel](http://merchant.domain/cancel)"       }`

### Response samples

-   200
-   400
-   default

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001",      -   "request_id": "266ea41d-adf5-480b-af50-15b940c2b846",      -   "status": "new",      -   "redirect_url": "[https://checkout.domain.com/checkout](https://checkout.domain.com/checkout)",      -   "timestamp": "2021-04-02T17:44:24Z",      -   "error_code": 0       }`

## [](#operation/payment_intention_check)Payment Intention Check

This method allows you to create a Payment intention.

##### Authorizations:

[Signature](#section/Authentication/Signature)

##### Request Body schema: application/json

Request body

reference

required

string

Merchant's order id or transaction id

### Responses

**200**

Payment intention response

**400**

Bad request

**504**

Follow the [documentation](/docs/payment/main_methods/hpp/request#response---504-gateway-timeout) to get more information about 504 Gateway Timeout

**default**

Error Response

post/payment-intention/check

https://h2h.flexify.finance/payment-intention/check

### Request samples

-   Payload

Content type

application/json

Copy

Expand all Collapse all

`{  -   "reference": "order-1001"       }`

### Response samples

-   200
-   400
-   default

Content type

application/json

Example

new

new

opened

pending

success

failed

expired

Copy

Expand all Collapse all

`{  -   "status": "new",      -   "reference": "order-1001",      -   "request_id": "266ea41d-adf5-480b-af50-15b940c2b846",      -   "amount": "10.15",      -   "currency": "USD",      -   "timestamp": "2021-04-02T17:44:24Z",      -   "redirect_url": "[https://checkout.domain.com/checkout](https://checkout.domain.com/checkout)",      -   "error_code": 0       }`

Documentation

-   [Introduction](/docs)
-   [General information](/docs/getting-started/general)
-   [Payment](/docs/payment/main_methods/h2h/intro)
-   [Payout](/docs/payout/intro)
-   [Refund](/docs/refund/intro)

Copyright © 2026 Flexify

---
## Crypto conversion

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/h2h/conversion`

On this page

# Crypto conversion

Here you can find how to get conversion for the specified cryptocurrency pair.

Please use the URL https://h2h.flexify.finance/v1/exchange/conversion to conversion for the specified cryptocurrency pair. For sending a request, please use signature according to [instructions](/docs/getting-started/auth). Below you can find request and response examples.

### Available currencies:[​](#available-currencies "Direct link to heading")

**Fiat:** UAH, KZT, EUR, USD,INR, BRL

**Crypto:** USDTERC20, USDTTRC20, USDTMATIC, USDCERC20, USDCTRC20, USDCMATIC, USDCXLM, BTC, BCH, LTC, ETH, DOGE, MATIC, TRX

### Request example:[​](#request-example "Direct link to heading")

```
{  "conversion_currency": "EUR", // required  "conversion_amount": 106.8, // required  "pay_currency": "USDT", // required  "risk_rate": 0 // optional}
```
Copy

### Response example – 200 Success:[​](#response-example--200-success "Direct link to heading")

```
{  "conversion_currency": "EUR",  "conversion_amount": "100.6",  "pay_currency": "USDTERC20",  "pay_amount": "107.754927", // six symbols after comma  "rate": "1.0711225", // seven symbols after comma  "rate_date": "2023-09-06T14:49:33Z"}
```
Copy

### Response example – 400 Bad request:[​](#response-example--400-bad-request "Direct link to heading")

```
{  "error_code": 400,  "error_reason": "Exchange currency pair not found",  "request_id": "e2a6d656-50e0-4efa-af04-c4eee1b17cd6",  "timestamp": "2023-09-20T10:07:29Z"}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

---
## Get available methods

**URL :** `https://docs.flexify.finance/docs/payment/method_matchmaker/h2h/available_methods`

On this page

# Get available methods

# Info about method

This method will allow you, based on the values ​​you passed, to determine which payment methods are available to the user.

## Get available payment methods[​](#get-available-payment-methods "Direct link to heading")

### Request[​](#request "Direct link to heading")

Use the URL https://h2h.flexify.finance/v1/payment/available-methods to send request for get available payment methods.

```
{  "currency": "USD", // required  "amount": 25.01, // required  "description": "My order", // optional  "customer": {    "identifier": "12345", // optional, may be used any unique value from system of merchant    "email": "user@example.com", // optional    "phone": "333333333", // optional    "first_name": "Darth", // optional    "last_name": "Vader", // optional    "middle_name": "Skywalker", // optional    "country": "UA", // optional, ISO 3166-1    "state_code": "NY", // optional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // optional    "address": "Stepana street, 9", // optional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "ip": "192.168.0.1", // optional    "gender": "female" // optional  },  "browser": {    "ip": "192.0.2.1", // optional, ISO 3166-1    "country": "UA" // optional, ISO 3166-1  }}
```
Copy

### Logic of handle response[​](#logic-of-handle-response "Direct link to heading")

You should display to customer list of payment methods using following logic:

1.  Show to user available payment methods with image and alias name (setup on merchant side);
2.  Sort payment methods by priority (sort from min to max). May be in a negative value or empty;
3.  When user was selected payment method, necessary to show him a list of fields that need to be filled to successfully create a payment;
4.  Show to the user list of "channel" which possible for processing the payment, use "channel\*ui\_code" as a unique identifier. Request a list of available channels from our manager (optional step);
5.  Follow the instructions on the page from the specified payment method (for example: [card](/docs/payment/main_methods/h2h/request#response---200-ok)).

### Response examples[​](#response-examples "Direct link to heading")

#### Response - 200 OK[​](#response---200-ok "Direct link to heading")

```
{  "request_id": "51b6a7c4-11e0-4fbc-a372-c44df340560c",  "available_methods": [    {      "method": "card",      "priority": -1,      "currency": "UAH",      "validation": {        "min_amount": "10",        "max_amount": "1500"      }    },    {      "method": "crypto",      "priority": 1,      "currency": "BTC",      "validation": {        "min_amount": "0.00001"      }    },    {      "method": "crypto",      "priority": 2,      "currency": "ETH",      "validation": {        "max_amount": "0,55"      }    },    {      "method": "card_redirect",      "priority": 10,      "currency": "UAH"    },    {      "method": "card_redirect",      "currency": "UAH"    },    {      "method": "virtual_account",      "priority": 130,      "currency": "NGN",      "channel": {        "name": "Globus Bank",        "ui_code": "globus",        "priority": 1      }    },    {      "method": "virtual_account",      "priority": 130,      "currency": "NGN",      "channel": {        "name": "Providus Bank",        "ui_code": "providus",        "priority": null      }    },    {      "method": "deposit_opay",      "priority": 130,      "currency": "NGN",      "public_fields": [        {          "name": "betting_merchant_name",          "value": "test_merchant"        }      ]    }  ]}
```
Copy

#### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "currency",      "message": "currency is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

#### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

Please, resend request.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payout/crypto/intro`

# Introduction

With Flexify API, you can seamlessly integrate payout in crypto into your commerce app or website.

Utilizing the REST setup, your website or application can quickly initiate requests to the API, enabling your customers to conveniently make payout using various cryptocurrencies like Bitcoin, Ethereum, and more..

By leveraging Flexify API, you can effortlessly tap into the world of crypto, offering your customers a modern and flexible payment option while expanding your business opportunities in the rapidly evolving cryptocurrency landscape.

**How exactly Crypto payout works:**

1.  The customer specifies an amount one of the allowed cryptocurrencies ([view](/docs/payment/crypto/staticWallet/h2h/conversion#available-currencies)) for payout;
2.  Merchant should make a request for [conversion](/docs/payment/crypto/staticWallet/h2h/conversion) of crypto to fiat in order for the approximate payout amount in the merchant portal to be displayed _(optional)_;
3.  The customer indicates an _crypto\_address_ and _address\_tag_ (if needed) and approves the payout;
4.  Merchant should make a request to [create](/docs/payout/crypto/payout) payout;
5.  Flexify validates received data and creates payout to requested crypto\_address with response in "pending" status.
6.  Flexify processes the payout and sends callback to the merchant;
7.  Merchant makes a request to [convert](/docs/payment/crypto/staticWallet/h2h/conversion) crypto currency from [callback](/docs/payment/crypto/staticWallet/h2h/callback) to needed fiat currency _(optional)_.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/getting-started/balance/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

The Balance API is a fast and convenient way to get Project's balances.

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Payout**:

-   Prepare a request following [instructions](/docs/getting-started/balance/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://h2h.flexify.finance/v1/balance

---
## Balance Request

**URL :** `https://docs.flexify.finance/docs/getting-started/balance/request`

On this page

# Balance Request

Use the URL https://h2h.flexify.finance/v1/balance to obtain balance.

## Request[​](#request "Direct link to heading")

```
GET /v1/balanceHost: h2h.host.nameAuthorization: Signature keyId="***", algorithm="HmacSHA256", headers="host date", signature="***"Date: 2020-11-30T11:15:09.445Z
```
Copy

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

-   Without Overdraft
-   Unused Overdraft
-   Used Overdraft

```
{    "error_code": 0,    "balance": [        {            "current_balance": "50.00",            "available_balance": "50.00",            "overdraft_limit": "0.00",            "overdraft_used": "0.00",            "currency": "USD",            "billing_date": "2022-05-11T00:00:00Z"        }    ]}
```
Copy

```
{    "error_code": 0,    "balance": [        {            "current_balance": "50.00",            "available_balance": "1050.00",            "overdraft_limit": "1000.00",            "overdraft_used": "0.00",            "currency": "USD",            "billing_date": "2022-05-11T00:00:00Z"        }    ]}
```
Copy

```
{    "error_code": 0,    "balance": [        {            "current_balance": "-100.00",            "available_balance": "900.00",            "overdraft_limit": "1000.00",            "overdraft_used": "100.00",            "currency": "USD",            "billing_date": "2022-05-11T00:00:00Z"        }    ]}
```
Copy

## Fields explanations[​](#fields-explanations "Direct link to heading")

Field

Description

`current_balance`

Project's account balance. Formula: `balance` - `overdraft_used`. May be a negative value if there is zero amount on the Project account balance and some part of the set `overdraft_limit` has been used

`available_balance`

Available balance in Project account. Formula: `current_balance` + `overdraft_limit`

`overdraft_limit`

Set overdraft limit for the Project account

`overdraft_used`

Overdraft limit used

`currency`

Project account currency

`billing_date`

Recent balance changes

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/hpp/intro`

On this page

# Introduction

With Flexify API, you can take card (credit and debit) transfer payments for goods or services on your commerce app or website. Our Payment APIs also allow you to check payment statuses.

Thanks to the REST setup, your website or application can immediately start making requests to the API, which charges your customers for their purchases using different providers. All funds will be deposited to your account instantly.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![Payment cash flow](/assets/ideal-img/payment-cash-flow.b07ba8d.1030.png)

Contact us If you need such methods as hold, or capture. With these methods you can place a hold on a card to reserve funds now, but capture them only after a service is completed. When a card payment is captured, the automatic collection ends up with success.

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Payment**:

-   Prepare a request following [instructions](/docs/payment/main_methods/hpp/request)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://hpp.flexify.finance/v1/payment-intention
-   Receive a [callback](/docs/payment/main_methods/hpp/callback) or make [check](/docs/payment/main_methods/hpp/check) request.

---
## Request

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/hpp/request#response---504-gateway-timeout`

On this page

# Request

# Payment Request

Here you can find instructions on how to make a Payment Intention request.

Use the URL https://hpp.flexify.finance/v1/payment-intention to send Payment Intention request to the Gate API.

## Examples[​](#examples "Direct link to heading")

-   Card
-   Apple Pay
-   Google Pay
-   Crypto Pay

```
{  "reference": "order-0001", // required  "currency": "USD", // required, you can use any currency that is supported by your provider  "amount": "12.23", // required  "description": "descripion", // optional  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "phone": "333333333", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // conditional    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // conditional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "widget": {    "method": "card", // required    "locale": "en" // optional   },  "redirect_url": "https://merchant.domain/pending",  "callback_url": "https://merchant.domain/callback",  "cancel_url": "https://merchant.domain/cancel",  "extra": {    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

```
{  "reference": "order-0001", // required  "currency": "USD", // required, you can use any currency that is supported by your provider  "amount": "12.23", // required  "description": "descripion", // optional  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // optional,    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "phone": "333333333", // conditional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "widget": {    "method": "apple_pay", // required    "locale": "en" // optional  },  "redirect_url": "https://merchant.domain/pending",  "callback_url": "https://merchant.domain/callback",  "cancel_url": "https://merchant.domain/cancel",  "extra": {    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

```
{  "reference": "order-0001", // required  "currency": "USD", // required, you can use any currency that is supported by your provider  "amount": "12.23", // required  "description": "descripion", // optional  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // optional,    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "phone": "333333333", // conditional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "widget": {    "method": "google_pay", // required    "locale": "en" // optional  },  "redirect_url": "https://merchant.domain/pending",  "callback_url": "https://merchant.domain/callback",  "cancel_url": "https://merchant.domain/cancel",  "extra": {    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

```
{  "reference": "order-0001", // required  "currency": "USD", // required, you can use any currency that is supported by your provider  "amount": "12.23", // required  "description": "descripion", // optional  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // conditional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "country": "UA", // conditional, ISO 3166-1    "state_code": "NY", // conditional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // optional,    "address": "Stepana street, 9", // conditional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "phone": "333333333", // conditional    "ip": "192.168.0.1", // optional    "gender": "female", // optional    "identity": "identity card" // conditional  },  "widget": {    "method": "crypto", // required    "locale": "en" // optional  },  "redirect_url": "https://merchant.domain/pending",  "callback_url": "https://merchant.domain/callback",  "cancel_url": "https://merchant.domain/cancel",  "extra": {    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - Payment intention is **Failed**.
    
    All error codes you can find in [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    If status field is **not equals** to new - Payment intention is **Failed**.
    
    If status field is **equals** to new, redirect the Customer to the redirect\_url.
    

##### info

On the [Payment intention statuses](/docs/getting-started/status) page you can find all known statuses.

#### Response examples - 200 OK[​](#response-examples---200-ok "Direct link to heading")

```
{  "error_code": 0,  "identifier": "HPI0000000046GPX",  "reference": "hpp-payment-202306221129",  "request_id": "c17a96fd-d5ba-46fd-afd9-1c26d084ac89",  "status": "new",  "redirect_url": "https://..."}
```
Copy

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

```
{  "request_id": "e76789fa-cb93-4643-9506-0314c8f82450",  "error_code": 1,  "error_reason": "Invalid fields: \nreference - must match \"[a-z0-9-_]+\";\n reference - size must be between 1 and 40",  "timestamp": "2022-02-09T17:32:46.131339",  "error_fields": {    "reference": "must match \"[a-z0-9-_]+\"; size must be between 1 and 40"  }}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You can retry the request.

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/h2h/intro`

On this page

# Introduction

With Flexify API, you can seamlessly integrate crypto processing capabilities into your commerce app or website. It empowers you to accept cryptocurrency payments for goods and services, including popular options like Bitcoin, Ethereum, and more. Our Payment APIs provide a streamlined way to work with crypto payments.

Utilizing the REST setup, your website or application can quickly initiate requests to the API, enabling your customers to conveniently make purchases using various cryptocurrencies.

By leveraging Flexify API, you can effortlessly tap into the world of crypto processing, offering your customers a modern and flexible payment option while expanding your business opportunities in the rapidly evolving cryptocurrency landscape.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![CryptoM flow](/assets/ideal-img/crypto-pay-flow.26fb324.1030.png)

**How exactly Crypto works:**

1.  The customer specifies a cryptocurrency for payment and fiat amount which should pay;
2.  Merchant shall make a request for [conversion](/docs/payment/crypto/staticWallet/h2h/conversion) of fiat to crypto in order for the approximate payment amount to be displayed _(optional)_;
3.  Merchant make a request to [create](/docs/payment/crypto/staticWallet/h2h/payment) an address on selected currency and transport;
4.  Flexify create permanent address for user in selected currency and transport;
5.  Merchant shows created permanent address to Customer;
6.  Customer make a payment to permanent address. **NOTE! The customer can use address multiple times at any time with any time intervals**;
7.  Flexify receive a payment, validate it, create a 'success' transaction and send Webhook to the merchant;
8.  Merchant make a request to [convert](/docs/payment/crypto/staticWallet/h2h/conversion) crypto currency from [callback](/docs/payment/crypto/staticWallet/h2h/callback) to needed fiat currency _(optional)_.

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Crypto**:

-   Prepare a request to following [instructions](/docs/payment/crypto/staticWallet/h2h/payment)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL https://h2h.flexify.finance/v1/crypto/address
-   Receive a [callback](/docs/payment/crypto/staticWallet/h2h/callback).

---
## Create address for pay

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/h2h/payment`

On this page

# Create address for pay

# Create crypto address

There is you can find instructions how to create permanent crypto address.

Use the URL https://h2h.flexify.finance/v1/crypto/address to create permanent crypto address for selected user.

### Request example[​](#request-example "Direct link to heading")

```
{  "reference": "order-00001", // required  "customer": {    "identifier": "12345", // required    "email": "user@example.com", // optional    "first_name": "Darth", // optional    "last_name": "Vader", // optional    "middle_name": "Skywalker", // optional    "itn": "X1234567890", // optional    "zip_code": "38082365" // optional  },  "currency": "BTC", // required, allowed only USDTERC20, USDTTRC20, USDTMATIC, USDCERC20, USDCTRC20, USDCMATIC, USDCXLM, BTC, BCH, LTC, ETH, DOGE, MATIC, TRX  "mid_identifier": "MID_AT_2526", // conditional  "description": "deposit" // optional}
```
Copy

### Response - 200 example[​](#response---200-example "Direct link to heading")

```
{  "error_code": 0,  "error_reason": "",  "reference": "ref-1692078341",  "request_id": "0466aeb4-e545-4f8f-889e-09a86cb6fee9",  "currency": "BTC",  "identifier": "CS000000020HK2C",  "address": "175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W",  "address_tag": null, // if empty do not returned in response  "address_uri": "bitcoin:175tWpb8K1S7NmH4Zx6rewF9WQrcZv245W",  "address_qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAACv0lEQVR42u2XPa6lMAyFjVKkgw1EyjbosiXuBvjZAGwpXbYRiQ1AlyK6nmNGeswrpni4mZEuurpC+ZAS7GP7QPy3iz7kQ/4ZEqkptUu1if5MfktEVkESn2k/LG9sTsaNx4qC0CtheccyJ/O2rlGSkrtYh+BP5ndQk5SnkgdCMPaNlYTPuB89NewGaxb+Fp0fE+Qnudf9+5a5HxOBu+zGfrV++66qHxMcOZh3T7hexbWBhqAgyDC5ATDwSrntoUoFKZl6pBoyrF10SNRLQyJ1xXUpjzaPfSbsFhSkuFcxCAPHOlrs41qrIMmsfSXrl4IsUUu8JA2BWKA+Ec5o64RCsQrCvNp97vct5imardQ2aMg+B2xilmgOyoOlr5p7QqTt8dq7jpGoSqHesX5AIh+SFrOkOhDk84d2HhApNdlqJr/FOqXcsIbsS6Kxp+76J8KDClL43YsSt5S7Ig9uSUESZIjMmFl2kK4waQi76crPix1qrkm1YwVBzSV/FnMiBhbSdnd3eUAkJw5jFt0dwbheQkGSvHcrmUGJXFMoKQhn7EO95LzFkct+6+ABgZCLma1HEeMNuuS/ussTUswaiKBEpjFUHH60CpL8jB4Abs3v6H7V3BMSpZVy9NKYEYzg56AgxR9IMtPQ5yEgHnT3nQckuSmKEtd+fwd0U7NqCFyYuAB0PiexjPApCpLEf7U95g9GLmzUrZ0nJBK03IqtuGZj0hHsg7cnKBHLBn7nno0PSOGF61RE1xhrG9JuNQROZ3/bfYG/TrAA5vYUDwhSzRg+0kpP+QIg0pArDLht2MgAt3W0CiIe1hy2wlPAiLWSIgWBe4WoCX3UbPEaIEFDYF1pKqIgGLGR/qi5ZyRi8kg4x8BX89MRyCfma27j7HliDcH3HI5cJ4SW4WFzpyFYiDuCelBtyTVi9BTk88X/If8n+QVMJAQQoBsc3AAAAABJRU5ErkJggg==",  "timestamp": "2023-08-15T05:45:42Z"}
```
Copy

Where:

-   **`address_uri`** and **`address`** are the address of wallet what was generated for selected _currency_ and _customer.identifier_;

### Response - 400 Bad request[​](#response---400-bad-request "Direct link to heading")

-   Invalid Params

```
{  "error_code": 30,  "error_reason": "Invalid params",  "request_id": "36b61e02-fab7-4fb6-81b7-6e12f0acda16",  "error_fields": [    {      "field": "reference",      "message": "reference is a required field"    }  ],  "timestamp": "2022-02-09T10:48:09Z"}
```
Copy

### Response - 504 Gateway Timeout[​](#response---504-gateway-timeout "Direct link to heading")

This code means that **Gateway Timeout** occurred after 30 seconds.

You should resend this request.

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/h2h/callback`

On this page

# Callback

The WEBHOOK\_URL field you can set in admin page on your merchant settings.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

Since we receive a deposit in the permanent address from your customer, we will send a callback to your server. Below, you can find an example of callbacks by their status.

**Note! We will send callbacks only for “success” transaction.**

#### Callback examples for Crypto transaction[​](#callback-examples-for-crypto-transaction "Direct link to heading")

-   Success

Final status success means the Payment is completed successfully.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2024-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "customer": {    "identifier": "12345",    "email": "user@example.com",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "itn": "X1234567890",    "zip_code": "38082365"  },  "method": "crypto",  "type": "payment",  "crypto": {    "address": "0x1066A658E321dC04A8490C3CcE6cd28d4E56B8c3", // may be empty,  contact with our manager for details    "transaction_hash": "0x971499ecc4387938989a474878d0edc44e852757883b106b10dad8fcf4015a6f", // may be empty, contact with our manager for details    "address_tag": null, // may be empty, contact with our manager for details    "currency": "BTC",    "amount": "0,000016"  },  "mode": "provided",  "status": "success",  "status_date": "2024-02-09T13:12:18.395695",  "amount": "25.01",  "currency": "USDTERC20",  "error_code": 0,  "error_reason": "",  "timestamp": "2024-02-09T13:12:19.440901",  "extra_data": {} // contact with our manager for details}
```
Copy

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/method_matchmaker/h2h/intro`

On this page

# Introduction

##### caution

Keep in mind that to use the Flexify H2H integration, you must maintain **[PCI Compliance](https://en.wikipedia.org/wiki/Payment_Card_Industry_Data_Security_Standard)** for card transactions.

With Flexify API, you can give the user a choice of more than 10 payment methods (including card, crypto, bank transfer and locale methods) and many providers using one integration.

Thanks to the REST setup, your website or application can immediately start making requests to the API, which charges your customers for their purchases using different providers. All funds will be deposited to your account instantly.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![Payment cash flow](/assets/ideal-img/payment-cash-flow.b07ba8d.1030.png)

### How it works?[​](#how-it-works "Direct link to heading")

1.  Merchant makes a [request](/docs/payment/method_matchmaker/h2h/available_methods) with specified currency and amount for get avalilable payment methods;
2.  Flexify returns available payment methods for specified customer;
3.  Merchant displays to the customer a list of available payment methods in terms of providers (if present);
4.  Customer chooses payment method and fills needed for this method data _(view data which user should fill for specified method in our documentation)_;
5.  Merchant prepares a request of selected by user payment method;
6.  Flexify makes payment together with provider and returns response to merchant;
7.  Merchant handles challenges from Flexify side using instruction with specified payment method;
8.  Flexify confirms payment and sends callback.

---
## Payout to address

**URL :** `https://docs.flexify.finance/docs/payout/crypto/payout`

On this page

# Payout to address

# Payout Request

Here you can find instructions how to make Payout request.

Use the URL https://h2h.flexify.finance/v1/payout to send a Payout request to the Gate API.

## Crypto Method[​](#crypto-method "Direct link to heading")

```
{  "method": "crypto",  "mode": "initial",  "reference": "order-00001",  "currency": "USDTERC20",  "amount": 25.01,  "description": "My order",  // required if method = crypto  "crypto": {    "address": "0xb00e5760c0ab29ecdc51e39eea0e841a14415755", // required    "address_tag": "" // optional    "currency": "", // optional, if currency = fiat → crypto.currency must exist and must be only crypto  },  "customer": {    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // optional    "first_name": "Darth", // optional    "last_name": "Vader", // optional    "middle_name": "Skywalker", // optional    "country": "UA", // optional, ISO 3166-1    "state_code": "NY", // optional, ISO 3166-2 subdivision code representing the state or province    "city": "Kyiv", // optional,    "address": "Stepana street, 9", // optional    "zip_code": "38082365", // optional    "itn": "X1234567890", // optional    "birthday": "2006-01-02", // optional    "phone": "333333333", // optional    "ip": "192.168.0.1", // optional    "gender": "female" // optional  },  "callback_url": "https://merchant.domain/callback", // conditional  "extra": {    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

### Response flow diagram[​](#response-flow-diagram "Direct link to heading")

![ Payout Response Flow ](/assets/images/payout-response-flow-5fb09d3536a128f65701e784a3c8c5c4.png#center)

### Response - 200 OK[​](#response---200-ok "Direct link to heading")

1.  First, you should check error\_code field of response.
    
    If error\_code field is **not equals** to 0 - transaction is **Failed**.
    
    All error codes you can find at [Error codes](/docs/getting-started/error-codes) section.
    
2.  Second, you should check status field.
    
    The field status always has pending status if there are no errors.
    
    Make [check](/docs/payout/main_methods/check) request or wait for a callback to get final transaction status.
    
    All payout statuses you can find at [Payout Statuses](/docs/getting-started/status) section.
    

#### Crypto method response examples[​](#crypto-method-response-examples "Direct link to heading")

-   Pending
-   Error

If you get non-final pending status follow callback or [check](/docs/payout/main_methods/check) instructions.

```
{  "error_code": 0,  "error_reason": "",  "request_id": "caa8f24b-0183-4c1f-8b23-e4870a533307",  "reference": "order-00001",  "status": "pending",  "type": "payout",  "method": "crypto",  "mode": "initial",  "currency": "USDTERC20",  "amount": "100.5",  "timestamp": "2022-02-01T15:57:19Z"}
```
Copy

Final status error means the Payout is failed.

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "identifier": "PT0000000000D8I",  "request_id": "caa8f24b-0183-4c1f-8b23-e4870a533307",  "reference": "order-00001",  "status": "error",  "type": "payout",  "method": "crypto",  "mode": "initial",  "currency": "USDTERC20",  "amount": "100.5",  "timestamp": "2022-02-01T15:57:19Z"}
```
Copy

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payout/crypto/callback`

On this page

# Callback

The WEBHOOK\_URL field you can set in admin page on your merchant settings.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

Since we receive a deposit in the permanent address from your customer, we will send a callback to your server. Below, you can find an example of callbacks by their status.

#### Callback examples for Crypto transaction[​](#callback-examples-for-crypto-transaction "Direct link to heading")

-   Success
-   Declined
-   Error
-   Expired

Final status success means the Payout is completed successfully.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2023-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "method": "crypto",  "type": "payout",  "crypto": {    "address": "0xb00e5760c0ab29ecdc51e39eea0e841a14415755",    "address_tag": "" // optional  },  "customer": {    "identifier": "12345",    "email": "user@example.com",    "first_name": "Darth",    "last_name": "Vader",    "middle_name": "Skywalker",    "itn": "X1234567890"  },  "mode": "initial",  "status": "success",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "0.000019",  "currency": "BTC",  "error_code": 0,  "error_reason": "",  "timestamp": "2022-02-09T13:12:19.440901"}
```
Copy

Final status declined means the Payout is declined.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "method": "crypto",  "type": "payout",  "crypto": {    "address": "0xb00e5760c0ab29ecdc51e39eea0e841a14415755",    "address_tag": "" // optional  },  "mode": "initial",  "status": "declined",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "0.000019",  "currency": "BTC",  "error_code": 1001,  "error_reason": "General bank decline",  "timestamp": "2022-02-10T10:12:19.440201"}
```
Copy

Final status error means the Payout is failed.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "method": "crypto",  "type": "payout",  "crypto": {    "address": "0xb00e5760c0ab29ecdc51e39eea0e841a14415755",    "address_tag": "" // optional  },  "mode": "initial",  "status": "error",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "0.000019",  "currency": "BTC",  "error_code": 200,  "error_reason": "Transaction processing error",  "timestamp": "2022-02-10T11:01:19.440201"}
```
Copy

Final status expired means the Payout is expired.

```
{  "identifier": "PM00000000FONI1",  "creation_date": "2022-02-09T13:12:10.886803",  "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",  "reference": "order-00001",  "method": "crypto",  "type": "payout",  "crypto": {    "address": "0xb00e5760c0ab29ecdc51e39eea0e841a14415755",    "address_tag": "" // optional  },  "mode": "initial",  "status": "expired",  "status_date": "2022-02-09T13:12:18.395695",  "amount": "0.000019",  "currency": "BTC",  "error_code": 105,  "error_reason": "Transaction expired",  "timestamp": "2022-02-17T10:12:19.440201"}
```
Copy

---
## Binance Pay

**URL :** `https://docs.flexify.finance/docs/payout/crypto/binance`

On this page

# Binance Pay

**Binance Pay – Payout API Overview**

Binance Pay enables secure, contactless, and borderless cryptocurrency payouts. Designed for businesses, the Payout API allows you to automate mass disbursements globally to Binance users and non-users alike.

-   **Mass Payouts:** Send up to 500 transfers per batch using supported cryptocurrencies (fiat is not supported).
-   **Flexible Recipient Options:** Transfer funds via Binance ID or email. Non-Binance users will be invited to register and complete KYC to claim funds.
-   **Business Use Cases:** Supports direct transfers, affiliate commissions, crypto rewards, reimbursements, settlements, and more.
-   **Wallet Flexibility:** Funds can be sent to the recipient's Funding Wallet, Spot Wallet, or both.
-   **Status Tracking:** Easily monitor the payout status (e.g. accepted, processing, success, partial success, failed, canceled) via API queries.

Binance Pay Payouts provide a scalable and compliant way to manage large-volume crypto payments for partners, users, or employees.

### Request[​](#request "Direct link to heading")

```
{  "method": "binance_pay", // required  "mode": "initial", // required, always "initial"  "reference": "order-00001", // required  "currency": "USDC", // required, only cryptocurrencies  "amount": 25.01, // required  "description": "My order", // optional  "binance_pay": { // required    "account": "1234456" / "test@gmail.com" // required  },  "customer": { // required    "identifier": "12345" // required, may be used any unique value from system of merchant  },  "extra": { // optional    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-04-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

---
## Check Request

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/hpp/check`

On this page

# Check Request

You can perform a check request to obtain Payment details.

Use the URL https://hpp.flexify.finance/v1/payment-intention/check to send a check request to the Gate API.

## Request[​](#request "Direct link to heading")

```
{  "reference": "order-00001"}
```
Copy

## Response[​](#response "Direct link to heading")

-   New
-   Opened
-   Pending
-   Success
-   Failed
-   Expired

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "new",  "amount": "12.23",  "currency": "USD",  "redirect_url": "https://checkout.domain.com/payment/12d3f1bd-8ddf-4fc2-b5ed-0279923cac99/e35133f0af43a8277360ee29814bde498a2beaa9ef86bd8a38b86bf25803d6b2"}
```
Copy

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "opened",  "amount": "12.23",  "currency": "USD",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "pending",  "amount": "12.23",  "currency": "USD",  "meta": {    "meta_data1": "text",    "meta_data2": 50,    "meta_data3": true,    "meta_data4": "2024-02-20T14:00:00+02"  }}
```
Copy

```
{  "error_code": 0,  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "success",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 0,    "identifier": "PM0000000000002",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a2",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "status": "success",    "status_date": "2022-02-09T13:12:18.395695",    "card": {      "bin": "424242",      "last_4": "4242",      "exp_month": "10",      "exp_year": "2035",      "brand": "visa"    },    "creation_date": "2022-02-09T13:12:10.886803",    "meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    }  }}
```
Copy

```
{  "error_code": 1120,  "error_reason": "Insufficient funds on card",  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "failed",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 1120,    "error_reason": "Insufficient funds on card",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "status": "declined",    "status_date": "2022-02-09T13:12:18.395695",    "card": {      "bin": "424242",      "last_4": "0000",      "exp_month": "12",      "exp_year": "2025",      "brand": "visa"    },    "creation_date": "2022-02-09T13:12:10.886803",    "meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    }  }}
```
Copy

```
{  "error_code": 105,  "error_reason": "Transaction expired",  "reference": "order-00001",  "identifier": "HPI0000000046GR4",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "expired",  "amount": "12.23",  "currency": "USD"}
```
Copy

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/hpp/callback`

On this page

# Callback

We send a callback notification to the URL you passed in the transaction request in the callback\_url field on every completed transaction.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

#### Callback examples for Card transactions[​](#callback-examples-for-card-transactions "Direct link to heading")

-   Success
-   Failed
-   Error
-   Expired
-   Intention Expired

Final status success means the Payment is completed successfully.

```
{  "error_code": 0,  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "success",  "amount": "12.23",  "currency": "USD",  "billing_amount": "25.01",  "billing_currency": "USD",  "fee_amount": "3.75",  "fee_currency": "USD",  "payment": {    "error_code": 0,    "identifier": "PM0000000000002",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a2",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "status": "success",    "status_date": "2022-02-09T13:12:18.395695",    "card": {      "bin": "424242",      "last_4": "4242",      "exp_month": "10",      "exp_year": "2035",      "brand": "visa",      "holder_name": "Test name example",      "token": "bcc0e3b4-1040-41f3-9499-2411350119fd"    },    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male",      "identity": "identity card"    },    "meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    },    "creation_date": "2022-02-09T13:12:10.886803"  }}
```
Copy

Final status failed means the Payment is completed failed.

```
{  "error_code": 1120,  "error_reason": "Insufficient funds on card",  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "failed",  "amount": "12.23",  "currency": "USD",  "billing_amount": "25.01",  "billing_currency": "USD",  "fee_amount": "3.75",  "fee_currency": "USD",  "payment": {    "error_code": 1120,    "error_reason": "Insufficient funds on card",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "status": "declined",    "status_date": "2022-02-09T13:12:18.395695",    "card": {      "bin": "424242",      "last_4": "4242",      "exp_month": "10",      "exp_year": "2035",      "brand": "visa",      "holder_name": "Test name example"    },    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male",      "identity": "identity card"    },    "meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    },    "creation_date": "2022-02-09T13:12:10.886803"  }}
```
Copy

Final status error means the Payment is error.

```
{  "error_code": 200,  "error_reason": "Transaction processing error",  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "error",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 200,    "error_reason": "Transaction processing error",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "status": "error",    "status_date": "2022-02-09T13:12:18.395695",    "card": {      "bin": "424242",      "last_4": "0000",      "exp_month": "12",      "exp_year": "2025",      "brand": "visa",      "holder_name": "Test name example"    },    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male",      "identity": "identity card"    },    "meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    },    "creation_date": "2022-02-09T13:12:10.886803"  }}
```
Copy

Final status expired means the Payment is expired.

```
{  "error_code": 105,  "error_reason": "Transaction expired",  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "expired",  "amount": "12.23",  "currency": "USD",  "payment": {    "error_code": 105,    "error_reason": "Transaction expired",    "identifier": "PM0000000000001",    "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",    "reference": "order-00001",    "method": "card",    "type": "payment",    "mode": "initial",    "status": "expired",    "status_date": "2022-02-09T13:12:18.395695",    "card": {      "holder_name": "Test name example",      "bin": "535528",      "last_4": "0887",      "exp_month": "10",      "exp_year": "2029",      "country": "UA",      "brand": "mastercard"    },    "customer": {      "identifier": "12345",      "email": "user@example.com",      "phone": "333333333",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "country": "UA",      "state_code": "32",      "city": "Kyiv",      "address": "Stepana street, 9",      "zip_code": "38082365",      "itn": "X1234567890",      "birthday": "2006-01-02",      "ip": "192.168.0.1",      "gender": "male",      "identity": "identity card"    },    "meta": {      "meta_data1": "text",      "meta_data2": 50,      "meta_data3": true,      "meta_data4": "2024-02-20T14:00:00+02"    },    "creation_date": "2022-02-09T13:12:10.886803"  }}
```
Copy

Final status expired without payment object means the Payment Intention is expired before create transaction.

```
{  "reference": "order-00001",  "request_id": "de2fc4ea-0b64-4ba4-b1f3-eb4394e158a1",  "status": "expired",  "currency": "USD",  "amount": "12.23",  "error_code": 620,  "error_reason": "Payment intention expired"}
```
Copy

## Flow diagram[​](#flow-diagram "Direct link to heading")

![ Callback Flow ](/assets/images/callback-flow-b9f0f374c870a0b74b19e2d5d63320db.png#center)

---
## Test cards

**URL :** `https://docs.flexify.finance/docs/payment/main_methods/hpp/test`

# Test cards

Here you can find test cards for Payment.

Number

Currency

3ds

Expected status

Error Code

Error Reason

Details

4242424242424242

XTS

\-

success

0

Any cvv, any expiration date

5352783000000210

XTS

V1

success

0

Any cvv, any expiration date

4012000000003010

XTS

V2\_Frictionless

success

0

Any cvv, any expiration date

4012000000003119

XTS

V2\_Challenge

success

0

Any cvv, any expiration date

4012000000003242

XTS

V2\_Challenge

declined

1140

3D secure failed

Any cvv, any expiration date

4012000000004240

XTS

\-

declined

1110

Card lost or stolen

Any cvv, any expiration date

4012000000006740

XTS

\-

declined

1120

Insufficient funds on card

Any cvv, any expiration date

---
## Introduction

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/hpp/intro`

On this page

# Introduction

With Flexify API, you can seamlessly integrate crypto processing capabilities into your commerce app or website. It empowers you to accept cryptocurrency payments for goods and services, including popular options like Bitcoin, Ethereum, and more. Our Payment APIs provide a streamlined way to work with crypto payments.

Utilizing the REST setup, your website or application can quickly initiate requests to the API, enabling your customers to conveniently make purchases using various cryptocurrencies.

By leveraging Flexify API, you can effortlessly tap into the world of crypto processing, offering your customers a modern and flexible payment option while expanding your business opportunities in the rapidly evolving cryptocurrency landscape.

## Diagram flow[​](#diagram-flow "Direct link to heading")

You can see a visualization of the role played by Flexify in payment processing at the picture below:

![CryptoM flow](/assets/ideal-img/crypto-pay-flow.26fb324.1030.png)

**How exactly Crypto works:**

1.  The customer specifies a cryptocurrency for payment;
2.  Merchant make a request to create payment on selected currency and transport;
3.  Flexify display to customer crypto address and amount which user should pay (with ability to recalculate the pay amount if merchant allows it);
4.  Customer make a payment to permanent address. **NOTE! The customer can use address multiple times at any time with any time intervals**;
5.  Flexify receive a payment, validate it, create a 'success' transaction and send callback to the merchant;
6.  Merchant make a request to [convert](/docs/payment/crypto/staticWallet/h2h/conversion) crypto currency from [callback](/docs/payment/crypto/staticWallet/hpp/callback) to needed fiat currency _(optional)_.

## How to start?[​](#how-to-start "Direct link to heading")

There is you can find steps to make **Crypto**:

-   Prepare a request to following [instructions](/docs/payment/crypto/staticWallet/hpp/payment)
-   Sign the request with [instructions](/docs/getting-started/auth)
-   Send the request to the URL /v1/crypto/address
-   Receive a [callback](/docs/payment/crypto/staticWallet/hpp/callback).

---
## Payment

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/hpp/payment`

# Payment

For more details about crypto payments, please check the HPP [documentation](/docs/payment/main_methods/hpp/request)

---
## Callback

**URL :** `https://docs.flexify.finance/docs/payment/crypto/staticWallet/hpp/callback`

On this page

# Callback

The WEBHOOK\_URL field you can set in admin page on your merchant settings.

##### tip

We strongly recommend validating the callback signature to avoid suspicious activity. Follow the [callback](/docs/getting-started/callback/verification) docs to prepare callback verification.

Since we receive a deposit in the permanent address from your customer, we will send a callback to your server. Below, you can find an example of callbacks by their status.

**Note! We will send callbacks only for “success” transaction.**

#### Callback examples for Crypto transaction[​](#callback-examples-for-crypto-transaction "Direct link to heading")

-   Success

Final status success means the Payment is completed successfully.

```
{    "identifier": "PM00000000FONI1",    "creation_date": "2024-02-09T13:12:10.886803",    "request_id": "ad8f2092-fe60-458c-9caa-4106006a51a3",    "reference": "order-00001",    "customer": {      "identifier": "12345",      "email": "user@example.com",      "first_name": "Darth",      "last_name": "Vader",      "middle_name": "Skywalker",      "itn": "X1234567890",      "zip_code": "38082365"    },    "method": "crypto",    "type": "payment",    "crypto": {      "address": "0x1066A658E321dC04A8490C3CcE6cd28d4E56B8c3", // may be empty, contact with our manager for details      "transaction_hash": "0x971499ecc4387938989a474878d0edc44e852757883b106b10dad8fcf4015a6f", // may be empty, contact with our manager for details      "address_tag": null, // may be empty, contact with our manager for details      "currency": "BTC",      "amount": "0,000016"    },    "mode": "provided",    "status": "success",    "status_date": "2024-02-09T13:12:18.395695",    "amount": "25.01",      "currency": "USDTERC20",     "error_code": 0,    "error_reason": "",    "timestamp": "2024-02-09T13:12:19.440901",    "extra_data": {} // contact with our manager for details}
```
Copy

---
## H2H

**URL :** `https://docs.flexify.finance/docs/payment/crypto/binancePay/h2h_binance_pay_payment`

On this page

# H2H

## Introduction[​](#introduction "Direct link to heading")

### What is the Binance Pay ?[​](#what-is-the-binance-pay- "Direct link to heading")

**Binance Pay** is a contactless, borderless and secure cryptocurrency payment technology designed by **Binance**.  
**Binance Pay** allows **Binance** customer to pay and get paid in crypto from your friends and family worldwide.

### Request[​](#request "Direct link to heading")

```
{  "method": "binance_pay", // required  "mode": "initial", // required, always "initial" for this method  "reference": "order-00001", // required  "currency": "UAH", // required, supports fiat (e.g., UAH, USD) and crypto (e.g., BTC, ETH)  "amount": 25.01, // required, can be fiat or crypto depending on currency  "description": "My order", // optional  "binance_pay": { // conditional    "account": "1234456" / "test@gmail.com", // conditional (use for payout only)    "receiver_first_name": "Darth", // optional    "receiver_last_name": "Vader", // optional    "receiver_middle_name": "Skywalker", // optional    "receiver_phone": "2348035776359", // optional    "receiver_country": "ID", // optional, ISO 3166-1    "receiver_state_code": "JK", // optional, ISO 3166-2 subdivision code representing the state or province    "receiver_city": "Jakarta", // optional    "receiver_address": "Thomas Animashaun Street, 2", // optional    "receiver_zip_code": "100213" // optional  },  "customer": { // required    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // optional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "phone": "2348035776359", // optional    "country": "ID", // optional, ISO 3166-1    "ip": "192.168.0.1" // optional  },   "redirect_url": "https://merchant.domain/customer_pending_page", // optional  "callback_url": "https://merchant.domain/callback", // optional  "cancel_url": "https://merchant.domain/cancel", // optional  "extra": { // optional    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

---
## HPP

**URL :** `https://docs.flexify.finance/docs/payment/crypto/binancePay/hpp_binance_pay_payment`

On this page

# HPP

## Introduction[​](#introduction "Direct link to heading")

### What is the Binance Pay ?[​](#what-is-the-binance-pay- "Direct link to heading")

**Binance Pay** is a contactless, borderless and secure cryptocurrency payment technology designed by **Binance**.  
**Binance Pay** allows **Binance** customer to pay and get paid in crypto from your friends and family worldwide.

Merchant Acquiring (C2B) - Payment by **QR code​**  
In this scenario, users are able to make payments by scanning QR Codes provided by Binance and shown by merchants.

Merchants cooperate with **Binance** to get different **QR Codes** for different products.

Merchants display page with **QR Codes** for users to scan or browser authorization for continue.

Users open **Binance APP** and scan **QR Codes** or authorize from browser.

Users confirm payments by entering passcode or by clicking “confirm” button.

**Binance** notify Merchants and Users the status of payments.

### Request[​](#request "Direct link to heading")

```
{  "reference": "order-00001", // required  "currency": "UAH", // required, supports fiat (e.g., UAH, USD) and crypto (e.g., BTC, ETH)  "amount": 25.01, // required, can be fiat or crypto depending on currency  "description": "My order", // optional  "binance_pay": { // conditional    "account": "1234456" / "test@gmail.com", // conditional (use for payout only)    "receiver_first_name": "Darth", // optional    "receiver_last_name": "Vader", // optional    "receiver_middle_name": "Skywalker", // optional    "receiver_phone": "2348035776359", // optional    "receiver_country": "ID", // optional, ISO 3166-1    "receiver_state_code": "JK", // optional, ISO 3166-2 subdivision code representing the state or province    "receiver_city": "Jakarta", // optional    "receiver_address": "Thomas Animashaun Street, 2", // optional    "receiver_zip_code": "100213" // optional  },  "customer": { // required    "identifier": "12345", // required, may be used any unique value from system of merchant    "email": "user@example.com", // optional    "first_name": "Darth", // conditional    "last_name": "Vader", // conditional    "middle_name": "Skywalker", // optional    "phone": "2348035776359", // optional    "country": "ID", // optional, ISO 3166-1    "ip": "192.168.0.1" // optional  },  "widget": {    "method": "binance_pay", // required    "locale": "en" // optional  },  "redirect_url": "https://merchant.domain/customer_pending_page", // optional  "callback_url": "https://merchant.domain/callback", // optional  "cancel_url": "https://merchant.domain/cancel", // optional  "extra": { // optional    "meta": { // any field which may be needed for transaction routing and integration. Below is an example of parameters with available data types      "meta_data1[min0, max255]": "text", // type: string      "meta_data2[min1, max64]": 50, // type: int      "meta_data3[min1, max64]": true, // type: boolean      "meta_data4": "2024-02-20T14:00:00+02" // attention to datetime format: YYYY-MM-DDThh:mm:ss±hh. ISO 8601    }  }}
```
Copy

---
