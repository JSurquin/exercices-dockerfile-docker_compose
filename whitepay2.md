# Whitepay — Documentation complète

> Scrappé le 11/03/2026 depuis https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0
> Scope : méthodes génériques + France

---
## Getting started

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0`

copyCopy

# flag-checkeredGetting started

Learn how to get Whitepay set up in your project.

[](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)

**HTTP API**

Learn how to integrate your application using HTTP protocol

[](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)

**Webhooks**

Setting up webhooks and main types of events

[](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

**API Reference**

API entity attributes description and their types

* * *

### 

[hashtag](#quick-start)

Quick start

Learn how to integrate Whitepay products. Here you can explore our guides and examples.

* * *

### 

[hashtag](#getting-help)

Getting help

If you have any problems or questions, feel free to write to **support@whitepay.com** We will answer all your questions as quickly as possible.

#### 

[hashtag](#submit-an-issue)

Submit an issue

In case of any questions or problems with functionality, you can contact us. Our Support Team is ready to help you at any time - write to us on Telegram **@whitepay\_support** or by email .

[NextAuthorizationchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)

Last updated 1 year ago

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/authorization`

copyCopy

# webhookAuthorization

### 

[hashtag](#base-url)

Base URL

Copy
```
https://api.whitepay.com
```

### 

[hashtag](#generate-api-token)

Generate API Token

**Whitepay HTTP API** utilizes Bearer Tokens, you can get your API Token on "Settings" -> "Tokens" page in CRM.

### 

[hashtag](#authorizing-request)

Authorizing request

To authorize your request using generated Bearer Token you should pass it to **"Authorization"** header of your Request.

#### 

[hashtag](#request-headers-example)

Request headers example

Copy
```
Accept: application/json
Content-Type: application/json
Authorization: Bearer {Your Token Goes Here}
```

[PreviousGetting startedchevron-left](/1Q957FgGhSNqAyGWQqz0)[NextCrypto acquiringchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)

Last updated 1 year ago

---
## Crypto acquiring

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring`

copyCopy

# bitcoinCrypto acquiring

* * *

1.  [**Create new crypto order**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring#create-new-crypto-order)
    
2.  [**Show crypto order details**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring#show-crypto-order-details)
    
3.  [**Show crypto orders list**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring#show-crypto-orders-list)
    
4.  [**Show invoice currencies for crypto order creation**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring#show-invoice-currencies-for-crypto-order-creation)
    
5.  [**Complete crypto order**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring#complete-crypto-order)
    
6.  [**Order status change**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring#order-status-change)
    

* * *

## 

[hashtag](#create-new-crypto-order)

Create new crypto order

`**[POST]**` `**/private-api/crypto-orders/{slug}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

**Parameters**

Attribute

Type

Required

Description

amount

decimal

yes

min value depends on currency / max 10000000

currency

string

yes

currency ticker

external\_order\_id

string

no

unique order identifier in client Database (usually Internal Payment or Order ID used). number of characters: min 1, max 255. allowed symbols: aA-zZ, 0-9. Special characters: “-“, “\_“.

successful\_link

string

no

link used to redirect user from payment form after order completion. has to be URL

failure\_link

string

no

link used to redirect user from payment form after order failure. has to be URL

email

string

no

end users email

description

string

no

order description

form\_additional\_data

string

no

additional data that will be displayed on payment form

**Request payload**

Example

Copy
```
{
  "amount": "100",
  "currency": "EUR",
  "external_order_id": "2362325124",
  "successful_link": "https://merchant.website.com",
  "failure_link": "https://merchant.website.com"
}
```

**Response payload**

200

Copy
```
{
   "order":{
      "id":"5f96a6c7-d2f6-4e20-8ace-9f398b8ce43e",
      "currency":"EUR",
      "order_number":"348883076",
      "value":"100",
      "expected_amount":null,
      "received_total":"0",
      "exchange_rate":null,
      "clean_exchange_rate":null,
      "is_internal":null,
      "deposited_currency":null,
      "received_currency":null,
      "status":"INIT",
      "external_order_id":"2362325124",
      "created_at":"2024-12-05 09:51:25",
      "completed_at":null,
      "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/5f96a6c7-d2f6-4e20-8ace-9f398b8ce43e",
      "successful_link":null,
      "failure_link":null,
      "transactions":[
         
      ]
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#show-crypto-order-details)

Show crypto order details

`**[GET]**` `**/private-api/crypto-orders/{slug}/{orderId}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. Can be found on each payment page settings page in CRM.

orderId

string

yes

unique identifier of order

**Response payload**

200

Copy
```
{
   "order":{
      "id":"9ab10f7b-f213-4317-8db3-7a817df38d12",
      "currency":"USDT",
      "order_number":"996384161",
      "value":"10",
      "expected_amount":"10",
      "received_total":"9.9",
      "exchange_rate":"1",
      "clean_exchange_rate":"1",
      "is_internal":true,
      "deposited_currency":"USDT",
      "received_currency":"USDT",
      "status":"COMPLETE",
      "external_order_id":null,
      "created_at":"2024-12-04 15:09:25",
      "completed_at":"2024-12-04 15:27:50",
      "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/9ab10f7b-f213-4317-8db3-7a817df38d12",
      "successful_link":null,
      "failure_link":null,
      "transactions":[
         {
            "id":"9da52478-23bd-4dec-90c6-4499fa3bae28",
            "type":"CRYPTO_INVOICE",
            "currency":"USDT",
            "value":"10",
            "status":"COMPLETE",
            "hash":"internal_transaction_97c2fa1f-e8ea-48fa-94e6-51cf26dc8d1a",
            "is_internal":true,
            "created_at":"2024-12-04 15:27:50",
            "completed_at":"2024-12-04 15:27:50",
            "explorer_link":"https://whitebit.com"
         }
      ]
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#show-crypto-orders-list)

Show crypto orders list

`**[GET]**` `**/private-api/crypto-orders/{slug}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. Can be found on each payment page settings page in CRM.

**Filters**

Parameter

Type

Required

Description

page

int

no

page number

per\_page

int

no

count of items per page

date\_from

date

no

Format: 2022-06-01+00:00:00

date\_to

date

no

Format: 2022-06-01+00:00:00

completed\_at\_from

date

no

Format: 2022-06-01+00:00:00

completed\_at\_to

date

no

Format: 2022-06-01+00:00:00

order\_status\_id

uuid

no

Ref. Order Status ID

external\_order\_id

string

no

Ref. External Order ID

**Response payload**

200

Copy
```
{
   "orders":[
      {
         "id":"8949dd5f-ffe4-42b9-a91b-795767de541d",
         "currency":"USDT",
         "order_number":"325941418",
         "value":"10",
         "expected_amount":null,
         "received_total":"0",
         "exchange_rate":null,
         "clean_exchange_rate":null,
         "is_internal":null,
         "deposited_currency":null,
         "received_currency":"USDT",
         "status":"DECLINED",
         "external_order_id":null,
         "created_at":"2024-12-06 12:46:23",
         "completed_at":null,
         "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/8949dd5f-ffe4-42b9-a91b-795767de541d",
         "successful_link":null,
         "failure_link":null,
         "transactions":[
            
         ]
      },
      {
         "id":"9ab10f7b-f213-4317-8db3-7a817df38d12",
         "currency":"USDT",
         "order_number":"996384161",
         "value":"10",
         "expected_amount":"10",
         "received_total":"9.9",
         "exchange_rate":"1",
         "clean_exchange_rate":"1",
         "is_internal":true,
         "deposited_currency":"USDT",
         "received_currency":"USDT",
         "status":"COMPLETE",
         "external_order_id":null,
         "created_at":"2024-12-04 15:09:25",
         "completed_at":"2024-12-04 15:27:50",
         "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/9ab10f7b-f213-4317-8db3-7a817df38d12",
         "successful_link":null,
         "failure_link":null,
         "transactions":[
            {
               "id":"9da52478-23bd-4dec-90c6-4499fa3bae28",
               "type":"CRYPTO_INVOICE",
               "currency":"USDT",
               "value":"10",
               "status":"COMPLETE",
               "hash":"internal_transaction_97c2fa1f-e8ea-48fa-94e6-51cf26dc8d1a",
               "is_internal":true,
               "created_at":"2024-12-04 15:27:50",
               "completed_at":"2024-12-04 15:27:50",
               "explorer_link":"https://whitebit.com"
            }
         ]
      }
   ],
   "meta":{
      "current_page":1,
      "last_page":203,
      "total":3033
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#show-invoice-currencies-for-crypto-order-creation)

Show invoice currencies for crypto order creation

`**[GET]**` `**/currencies/crypto-order-target-currencies**`

**Response payload**

200

Copy
```
{
   "currencies":[
      {
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "ticker":"USDT",
         "is_fiat":false,
         "title":"Tether US",
         "is_used_for_order_exchange":true,
         "is_billable":true,
         "precision":2,
         "icon":"https://media.whitepay.com/e2d19518-2d8e-4c95-9db0-89f64b792da9/AWS-S3-Bucket-Cost-(1).png",
         "crm_icon":"https://media.whitepay.com/e2d19518-2d8e-4c95-9db0-89f64b792da9/AWS-S3-Bucket-Cost-(1).png",
         "max_amount":"10000000",
         "min_amount":"5"
      },
      {
         "id":"5c6e08b8-58a8-4f1c-ac5e-972616ce8ffd",
         "ticker":"PLN",
         "is_fiat":true,
         "title":"Polish zloty",
         "is_used_for_order_exchange":true,
         "is_billable":false,
         "precision":2,
         "icon":"https://media.whitepay.com/99b7502b-fbc6-49a5-824a-6f879cd2a645/PLN.svg",
         "crm_icon":"https://media.whitepay.com/99b7502b-fbc6-49a5-824a-6f879cd2a645/PLN.svg",
         "max_amount":"10000000",
         "min_amount":"20.43"
      },
      {
         "id":"6e2372bb-76b4-48b0-9d74-39f6902cabf8",
         "ticker":"UAH",
         "is_fiat":true,
         "title":"UAH Hryvnia",
         "is_used_for_order_exchange":true,
         "is_billable":true,
         "precision":2,
         "icon":"https://media.whitepay.com/7e1ed266-d512-4c35-ac82-6c137bce4a99/UAH.svg",
         "crm_icon":"https://media.whitepay.com/7e1ed266-d512-4c35-ac82-6c137bce4a99/UAH.svg",
         "max_amount":"10000000",
         "min_amount":"215.7"
      },
      {
         "id":"a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
         "ticker":"EUR",
         "is_fiat":true,
         "title":"Euro",
         "is_used_for_order_exchange":true,
         "is_billable":false,
         "precision":2,
         "icon":"https://media.whitepay.com/currency-default-icon.svg",
         "crm_icon":"https://media.whitepay.com/currency-default-icon.svg",
         "max_amount":"10000000",
         "min_amount":"4.74"
      },
      {
         "id":"9b7a5e4a-25c3-4a96-be23-d00e99c73208",
         "ticker":"CZK",
         "is_fiat":true,
         "title":"Czech koruna",
         "is_used_for_order_exchange":true,
         "is_billable":true,
         "precision":2,
         "icon":"https://media.whitepay.com/2028c9b6-ca72-4338-88a2-bcfaf9dc7381/CZK.svg",
         "crm_icon":"https://media.whitepay.com/2028c9b6-ca72-4338-88a2-bcfaf9dc7381/CZK.svg",
         "max_amount":"10000000",
         "min_amount":"119.41"
      },
      {
         "id":"2b49449f-7757-4ad0-8e42-1ac75a002ecf",
         "ticker":"USD",
         "is_fiat":true,
         "title":"US Dollar",
         "is_used_for_order_exchange":true,
         "is_billable":false,
         "precision":2,
         "icon":"https://media.whitepay.com/64e774de-448e-47f0-9254-1ccaf038fb24/USD.svg",
         "crm_icon":"https://media.whitepay.com/64e774de-448e-47f0-9254-1ccaf038fb24/USD.svg",
         "max_amount":"10000000",
         "min_amount":"5.04"
      },
      {
         "id":"c6a9a789-2718-4d77-8351-02468948a361",
         "ticker":"TRY",
         "is_fiat":false,
         "title":"Turkish lira",
         "is_used_for_order_exchange":false,
         "is_billable":false,
         "precision":2,
         "icon":"https://media.whitepay.com/currency-default-icon.svg",
         "crm_icon":"https://media.whitepay.com/currency-default-icon.svg",
         "max_amount":"10000000",
         "min_amount":"176.6"
      },
      {
         "id":"671ea2bb-327c-4836-b65e-b75446b1d984",
         "ticker":"GBP",
         "is_fiat":true,
         "title":"Polish zloty",
         "is_used_for_order_exchange":true,
         "is_billable":false,
         "precision":2,
         "icon":"https://media.whitepay.com/currency-default-icon.svg",
         "crm_icon":"https://media.whitepay.com/currency-default-icon.svg",
         "max_amount":"10000000",
         "min_amount":"4.02"
      }
   ]
}
```

Check out invoice currencies entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#complete-crypto-order)

Complete crypto order

`**[POST]**` `**/private-api/crypto-orders/{slug}/{orderId}/complete**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. Can be found on each payment page settings page in CRM.

orderId

string

yes

Whitepay internal order identifier

circle-exclamation

**You should know!**

This method allows to complete order in `PARTIALLY_FULFILLED` or `DECLINED` status in case if this order has at least **one** complete transaction.

**Response payload**

200

Copy
```
{
   "order":{
      "id":"011b97ab-8ebe-4ac9-a461-e7b2b120c356",
      "currency":"USDT",
      "order_number":"291912903",
      "value":"11",
      "expected_amount":"10",
      "received_total":"9.9",
      "exchange_rate":"1",
      "clean_exchange_rate":"1",
      "is_internal":true,
      "deposited_currency":"USDT",
      "received_currency":"USDT",
      "status":"COMPLETE",
      "external_order_id":"64323363423",
      "created_at":"2024-12-09 13:27:00",
      "completed_at":"2024-12-09 13:40:18",
      "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/011b97ab-8ebe-4ac9-a461-e7b2b120c356",
      "successful_link":null,
      "failure_link":null,
      "transactions":[
         {
            "id":"9daf0aa7-dfd6-4ceb-a28a-1ce27e6cba17",
            "type":"CRYPTO_INVOICE",
            "currency":"USDT",
            "value":"10",
            "status":"COMPLETE",
            "hash":"internal_transaction_13a674ce-bb20-4772-976d-303476192a77",
            "is_internal":true,
            "created_at":"2024-12-09 13:33:56",
            "completed_at":"2024-12-09 13:33:56",
            "explorer_link":"https://whitebit.com"
         }
      ]
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

## 

[hashtag](#order-status-change)

Order status change

[PreviousAuthorizationchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)[NextCrypto top-upchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)

Last updated 1 year ago

---
## Crypto top-up

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up`

copyCopy

# bitcoinCrypto top-up

* * *

1.  [**Create new crypto order**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up#create-new-crypto-order)
    
2.  [**Show invoice currencies for crypto top-up order creation**](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up#get-show-invoice-currencies-for-crypto-order-creation)
    

* * *

## 

[hashtag](#create-new-crypto-order)

Create new crypto order

`**[POST]**` `**/private-api/crypto-topups/{slug}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

**Parameters**

Attribute

Type

Required

Description

amount

decimal

yes

invoice amount. min value depends on currency. becomes required in case if “currency“ was specified.

currency

string

yes

invoice currency. becomes required in case if “amount“ was specified.

external\_order\_id

string

no

unique order identifier in client Database (usually Internal Payment or Order ID used). number of characters: min 1, max 255. allowed symbols: aA-zZ, 0-9. Special characters: “-“, “\_“.

successful\_link

string

no

link used to redirect user from payment form after order completion. has to be URL

failure\_link

string

no

link used to redirect user from payment form after order failure. has to be URL

email

string

no

end users email

description

string

no

order description

**Request payload**

Example

Copy
```
{
  "amount":"20",
  "currency":"USD",
  "external_order_id":"323523",
  "successful_link": "https://merchant.website.com",
  "failure_link": "https://merchant.website.com"
}
```

**Response payload**

200

Copy
```
{
   "order":{
      "id":"c80e472d-8fd2-4b5b-b5ef-a3a27b3066d2",
      "currency":"USD",
      "order_number":"914569220",
      "value":"20",
      "expected_amount":null,
      "received_total":"0",
      "exchange_rate":null,
      "clean_exchange_rate":null,
      "is_internal":null,
      "deposited_currency":null,
      "received_currency":"USDT",
      "status":"INIT",
      "external_order_id":"323523",
      "created_at":"2024-12-09 13:44:50",
      "completed_at":null,
      "acquiring_url":"https://merchant.pay.whitepay.com/topup-orders/crypto/c80e472d-8fd2-4b5b-b5ef-a3a27b3066d2",
      "successful_link":null,
      "failure_link":null,
      "transactions":[
         
      ]
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#get-show-invoice-currencies-for-crypto-order-creation)

Show invoice currencies for crypto top-up order creation

`**[GET]**` `**/private-api/currencies/crypto-topup-target-currencies**`

**Response payload**

200

Copy
```
{
   "currencies":[
      {
         "id":"9b7a5e4a-25c3-4a96-be23-d00e99c73208",
         "ticker":"CZK",
         "min_amount":"119.41",
         "precision":2,
         "max_amount":"10000000"
      },
      {
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "ticker":"USDT",
         "min_amount":"5",
         "precision":2,
         "max_amount":"10000000"
      },
      {
         "id":"6e2372bb-76b4-48b0-9d74-39f6902cabf8",
         "ticker":"UAH",
         "min_amount":"215.71",
         "precision":2,
         "max_amount":"10000000"
      },
      {
         "id":"5c6e08b8-58a8-4f1c-ac5e-972616ce8ffd",
         "ticker":"PLN",
         "min_amount":"20.43",
         "precision":2,
         "max_amount":"10000000"
      },
      {
         "id":"2b49449f-7757-4ad0-8e42-1ac75a002ecf",
         "ticker":"USD",
         "min_amount":"5.04",
         "precision":2,
         "max_amount":"10000000"
      },
      {
         "id":"a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
         "ticker":"EUR",
         "min_amount":"4.74",
         "precision":2,
         "max_amount":"10000000"
      },
      {
         "id":"671ea2bb-327c-4836-b65e-b75446b1d984",
         "ticker":"GBP",
         "min_amount":"4.02",
         "precision":2,
         "max_amount":"10000000"
      }
   ]
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

To get order details/list check [Misc](/1Q957FgGhSNqAyGWQqz0/http-api/misc).

* * *

## 

[hashtag](#order-status-change)

Order status change

There is no `DECLINED` status for invoices of `CRYPTO_TOPUP` type.

[PreviousCrypto acquiringchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)[NextStatic walletschevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)

Last updated 1 year ago

---
## Static wallets

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets`

copyCopy

# walletStatic wallets

* * *

1.  [**Get a list of available currencies**](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets#get-get-a-list-of-available-currencies)
    
2.  [**Create an order**](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets#post-create-an-order)
    
3.  [**Receive order details**](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets#receive-order-details)
    

* * *

## 

[hashtag](#get-get-a-list-of-available-currencies)

Get a list of available currencies

`**[GET]**` `**/acquiring/{slug}/currencies**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

**Response payload**

Example

Copy
```
{
   "currencies":[
      {
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "precision":2,
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "ticker":"USDT",
         "is_fiat":false,
         "is_stable":true,
         "name":"Tether US",
         "limits":{
            "ERC20":{
               "min":"5",
               "max":null
            },
            "TON":{
               "min":"5",
               "max":null
            },
            "TRC20":{
               "min":"5",
               "max":null
            }
         },
         "min":"5",
         "max":"0",
         "preset_donation_values":[
            "10.00000000000000000000",
            "25.00000000000000000000",
            "50.00000000000000000000",
            "100.00000000000000000000"
         ],
         "networks":{
            "TRC20":{
               "min_amount":"5",
               "max_amount":"0",
               "fixed":"1",
               "flex":{
                  "min_fee":"0",
                  "max_fee":"0",
                  "percent":"0"
               }
            },
            "TON":{
               "min_amount":"5",
               "max_amount":"0",
               "fixed":"1",
               "flex":{
                  "min_fee":"0",
                  "max_fee":"0",
                  "percent":"0"
               }
            },
            "ERC20":{
               "min_amount":"5",
               "max_amount":"0",
               "fixed":"27.08",
               "flex":{
                  "min_fee":"0",
                  "max_fee":"0",
                  "percent":"0"
               }
            }
         },
         "exchange_rate":null
      }
   ]
}
```

Check out order currencies entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#post-create-an-order)

Create an order

`**[POST]**` `**/acquiring/{slug}/pay**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

**Parameters**

Attribute

Type

Required

Description

amount

decimal

yes

order amount

currency\_id

string

yes

order currency id

network

string

yes

currency network

external\_order\_id

string

no

additional external invoice id

email

string

no

end users email

description

string

no

order description

**Request payload**

Example

Copy
```
{
   "amount":"25",
   "currency_id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
   "external_order_id":"23523124",
   "network":"TON",
   "description":"description for static wallet",
   "email":"john.doe@gmail.com"
}
```

**Response payload**

200

Copy
```
{
   "order":{
      "id":"67b732c5-1f00-439e-8ca2-a79dadd79e14"
   }
}
```

* * *

## 

[hashtag](#receive-order-details)

Receive order details

`**[GET]**` `**/acquiring/{slug}/order/{orderID}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

orderID

string

yes

Whitepay internal order id

circle-exclamation

**Pay attention!**

For some networks/currencies, a "memo" parameter is required to create a successful payment. We return this parameter in the "wallet" object. The "memo" must be shown to the end client. Otherwise, _**funds may be lost**_. You can find an example in response payload below.

**Response payload**

200

Copy
```
{
   "order":{
      "id":"d783bd85-c06a-443f-b640-5f957dd80252",
      "min_deposit_amount":"5",
      "amount":null,
      "expected_amount":"25",
      "network_fee":"1",
      "status":"OPEN",
      "order_type":"CRYPTO_DONATION",
      "exchange_rate":null,
      "received_total":"0",
      "invoice_reminder":"25",
      "payment_url":null,
      "successful_link":null,
      "failure_link":null,
      "redirect_after_seconds":null,
      "fixated_at":"2025-03-12 09:49:04",
      "wallet":{
         "address":"EQAigd8MjqsJejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
         "network":"TON",
         "memo":"6106200105"
      },
      "currency":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/e2d19518-2d8e-4c95-9db0-89f64b792da9/AWS-S3-Bucket-Cost-(1).png",
         "limits":{
            "ARBITRUM":{
               "min":"5",
               "max":null
            },
            "BEP20":{
               "min":"5",
               "max":null
            },
            "CCHAIN":{
               "min":"5",
               "max":null
            },
            "EOS":{
               "min":"10",
               "max":null
            },
            "ERC20":{
               "min":"5",
               "max":null
            },
            "NEAR":{
               "min":"5",
               "max":null
            },
            "OMNI":{
               "min":"60",
               "max":null
            },
            "POLYGON":{
               "min":"5",
               "max":null
            },
            "SOL":{
               "min":"5",
               "max":null
            },
            "TON":{
               "min":"5",
               "max":null
            },
            "TRC20":{
               "min":"5",
               "max":null
            }
         },
         "networks":[
            "POLYGON",
            "ARBITRUM",
            "SOL",
            "CCHAIN",
            "NEAR",
            "TON",
            "TRC20",
            "ERC20"
         ],
         "precision":6,
         "ticker":"USDT"
      },
      "currency_target":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/e2d19518-2d8e-4c95-9db0-89f64b792da9/AWS-S3-Bucket-Cost-(1).png",
         "precision":6,
         "ticker":"USDT"
      },
      "merchant_fee":null,
      "merchant_fee_percentage":null,
      "merchant_fee_currency":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/e2d19518-2d8e-4c95-9db0-89f64b792da9/AWS-S3-Bucket-Cost-(1).png",
         "precision":6,
         "ticker":"USDT"
      },
      "transactions":[
         
      ],
      "created_at":"2025-03-12 09:49:04",
      "is_refund_available":null,
      "number":"009481398",
      "external_order_id":"23523124",
      "is_able_to_express":true,
      "express_url":null,
      "express_date_updated_at":null,
      "calculated_value":null,
      "email":"john.doe@gmail.com",
      "description":"description for static wallet",
      "form_additional_data":null,
      "feedbacks":[
         
      ],
      "required_params":[
         
      ]
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

[PreviousCrypto top-upchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)[NextFiat acquiringchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)

Last updated 10 months ago

---
## Fiat acquiring

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring`

copyCopy

# euro-signFiat acquiring

* * *

1.  [**Create new fiat order**](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring#create-new-fiat-order)
    
2.  [**Show invoice currencies for fiat order creation**](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring#show-invoice-currencies-for-fiat-order-creation)
    
3.  [**Order status change**](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring#order-status-change)
    

* * *

## 

[hashtag](#create-new-fiat-order)

Create new fiat order

`**[POST]**` `**/private-api/orders/{slug}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

**Parameters**

Attribute

Type

Required

Description

amount

decimal

yes

invoice amount. min/max values differs for different invoice currencies

currency

string

yes

fiat currency ticker

external\_order\_id

string

no

unique order identifier in client Database (usually Internal Payment or Order ID used). number of characters: min 1, max 255. allowed symbols: aA-zZ, 0-9. Special characters: “-“, “\_“.

**Request payload**

Example

Copy
```
{
  "amount": "15",
  "currency": "EUR",
  "external_order_id": "INV-123"
}
```

**Response payload**

200

Copy
```
{
  "order": {
    "id": "12700f28-8f3c-4e25-9ae2-ae1b023bda05",
    "currency": "EUR",
    "order_number": "999545517",
    "value": "15",
    "expected_amount": "15",
    "received_total": "0",
    "exchange_rate": null,
    "clean_exchange_rate": null,
    "is_internal": null,
    "deposited_currency": "EUR",
    "received_currency": "EUR",
    "status": "OPEN",
    "external_order_id": "Inv-7",
    "created_at": "2024-01-22 11:29:41",
    "completed_at": null,
    "acquiring_url": "https://whitebit.com/payment/deposit?transactionId=cf118697-b968-4fd0-a933-3de84c127d49&amount=15&currency=EUR",
    "successful_link": "https://whitepay.com/clients",
    "failure_link": "https://whitepay.com/support",
    "transactions": []
  }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#show-invoice-currencies-for-fiat-order-creation)

Show invoice currencies for fiat order creation

`**[GET]**` `**/currencies/fiat-order-target-currencies**`

**Response payload**

200

Copy
```
{
  "currencies": [
    {
      "id": "2b49449f-7757-4ad0-8e42-1ac75a002ecf",
      "ticker": "USD",
      "is_fiat": true,
      "title": "US Dollar",
      "is_used_for_order_exchange": true,
      "min_amount": "10",
      "max_amount": "4000",
      "is_billable": false,
      "precision": 2
    },
    {
      "id": "a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
      "ticker": "EUR",
      "is_fiat": true,
      "title": "Euro",
      "is_used_for_order_exchange": true,
      "min_amount": "15",
      "max_amount": "10000",
      "is_billable": false,
      "precision": 2
    }
  ]
}
```

Check out invoice currencies entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#order-status-change)

Order status change

To get order details/list check [Misc](/1Q957FgGhSNqAyGWQqz0/http-api/misc).

[PreviousStatic walletschevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)[NextBalancechevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/balance)

Last updated 1 year ago

---
## Balance

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/balance`

copyCopy

# walletBalance

* * *

1.  [**Account balance**](/1Q957FgGhSNqAyGWQqz0/http-api/balance#account-balance)
    
2.  [**Exchange rates fo balance**](/1Q957FgGhSNqAyGWQqz0/http-api/balance#exchange-rates-fo-balance)
    
3.  [**Create request for balance conversion**](/1Q957FgGhSNqAyGWQqz0/http-api/balance#create-request-for-balance-conversion)
    

* * *

## 

[hashtag](#account-balance)

Account balance

`**[GET]**` `**/private-api/balances/**`

**Response payload**

200

Copy
```
{
  "balances": [
    {
      "id": "9a747ebd-1b42-4bd2-a72e-62ffedd3f4aa",
      "currency": {
        "id": "d9da4bdc-1c0b-4835-8ec6-a7118247340f",
        "ticker": "USDT",
        "is_fiat": false,
        "is_used_for_order_exchange": true,
        "icon": "https://media.whitepay.com/currency-default-icon.svg",
        "crm_icon": "https://media.whitepay.com/currency-default-icon.svg",
        "precision": 4,
        "title": "Tether US"
      },
      "value": "87.06441001"
    }
  ]
}
```

Check out Account balance entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#exchange-rates-for-balance)

Exchange rates for balance

`**[GET]**` `**/private-api/balances/{balanceId}**`

Attribute

Type

Required

Description

balanceID

string

yes

balance id in specified balance currency

**Response payload**

200

Copy
```
{
   "balance":{
      "id":"d27a375e-873c-43ec-a72a-4be585a34f5f",
      "currency":{
         "id":"69914245-e4e4-42ed-8d87-951fe95ccf8d",
         "ticker":"XMR",
         "is_fiat":false,
         "is_stable":false,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/427370ac-a257-4802-b847-bd9a21488621/XMR.svg",
         "crm_icon":"https://media.whitepay.com/427370ac-a257-4802-b847-bd9a21488621/XMR.svg",
         "precision":5,
         "title":"Monero",
         "min_exchange_amount":"0.00496"
      },
      "value":"0.12164823",
      "currencies":[
         {
            "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
            "precision":8,
            "exchange_rate":"200.56",
            "ticker":"USDT",
            "name":"Tether US",
            "title":"Tether US",
            "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg"
         },
         {
            "id":"7b8ab62a-76fe-4d24-ae5f-c757bfce60f6",
            "precision":8,
            "exchange_rate":"0.002021",
            "ticker":"BTC",
            "name":"Bitcoin",
            "title":"Bitcoin",
            "icon":"https://media.whitepay.com/6656e375-a881-4eb1-87a2-26d36971e434/BTC.svg"
         },
         {
            "id":"5992d102-05c8-4c02-8d59-f642fc25d0ca",
            "precision":8,
            "exchange_rate":"200.51",
            "ticker":"USDC",
            "name":"USD Coin",
            "title":"USD Coin",
            "icon":"https://media.whitepay.com/3dc94acd-f27c-462e-aa60-418f8fdd0287/USDC.svg"
         },
         {
            "id":"b9285bd5-b2bb-4e9a-ab49-6d0a7ffb3973",
            "precision":8,
            "exchange_rate":"196.90",
            "ticker":"TUSD",
            "name":"TrueUSD",
            "title":"TrueUSD",
            "icon":"https://media.whitepay.com/44217dfb-f398-4362-8a6e-d67f650c0a22/TUSD.svg"
         }
      ],
      "is_convertable":true,
      "balance_conversion_fee":"1"
   }
}
```

Check out Account balance entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#create-request-for-balance-conversion)

Create request for balance conversion

`**[POST]**` `**/private-api/balances/{balanceID}**`

Attribute

Type

Required

Description

balanceID

string

yes

balance id in specified balance currency

**Parameters**

Attribute

Type

Required

Description

currency\_to

string

yes

currency into which the balance will be exchanged

amount\_to\_convert

decimal

yes

the amount in the balance currency that will be converted

**Request payload**

Example

Copy
```
{
  "currency_to":"USDT",
  "amount_to_convert":"40"
}
```

**Response payload**

200

422

Copy
```
{
  "transaction":{
    "id":"85fec40f-b4df-4b52-a725-6cffdea4cf0e",
    "type":"CONVERT",
    "currency":"DOGE",
    "value":"40",
    "status":"INIT",
    "hash":null,
    "is_internal":false,
    "created_at":"2024-07-11 09:36:46",
    "completed_at":null,
    "currency_from":"DOGE",
    "value_from":"40.00000000",
    "currency_to":"USDT",
    "value_to":"0.00000000"
  }
}
```

Copy
```
{
   "message":"The given data was invalid",
   "errors":{
      "amount_to_convert":[
         "Insufficient funds, available: 0.12164823 XMR"
      ]
   }
}
```

Check out Transaction entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

[PreviousFiat acquiringchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)[NextWithdrawalchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)

Last updated 6 months ago

---
## Withdrawal

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal`

copyCopy

# money-simple-from-bracketWithdrawal

* * *

1.  [**Create request for automated withdrawal**](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal#post-create-request-for-automated-withdrawal)
    
2.  [**Create request for IBAN withdrawal**](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal#post-create-request-for-iban-withdrawal)
    
3.  [**Show withdrawal fees and limits**](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal#show-withdrawal-fees-and-limits)
    

* * *

## 

[hashtag](#post-create-request-for-automated-withdrawal)

Create request for automated withdrawal

This request should be executed to initiate automated withdrawal request.

`**[POST]**` `**/private-api/{slug}/withdrawal**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for the company.

**Parameters**

Attribute

Type

Required

Description

amount

string

yes

amount to withdraw

currency

string

no

currency for withdraw

wallet

string

yes

wallet address

network

string

yes

cryptocurrency network

memo

string

yes, in case if currencies network requires memo

memo tag

external\_id

string

no

external id for withdrawal operation

include\_fee\_in\_amount

boolean

no

if “true“ - "amount" parameter will be increased on the amount of network fee

if “false“ - "amount" won't be changed

in case if parameter won't be sent in request - system will validate it as "false" value

comment

string

no

description for withdrawal operation

type

string

yes, in case if you are from EEA

travel rule receiver type. values: “individual” or “entity”

vasp

string

yes, in case if you are from EEA

travel rule destination platform (VASP) name

name

string

yes, in case if you are from EEA

if individual - individual\_name, if entity - entity\_name

address

string

yes, in case if you are from EEA

if individual - individual\_address, if entity - entity\_address

**Request payload**

Without memo

With memo

Travel rule

Copy
```
{
   "amount":"100",
   "currency":"USDT",
   "wallet":"djfhku2h345h43l63jh423j4v2",
   "network":"TRC20",
   "external_id":"123456",
   "comment":"comment for withdrawal"
}
```

Copy
```
{
    "currency": "TON",
    "network": "TON",
    "amount": 7,
    "wallet": "EQAigd8MjqsJejMuIB0UPhErOlGe22dezkpjvpWt9k1rtkG8",
    "memo": "2722623253",
    "comment": "withdrawal comment",
    "email": "john.doe@gmail.com",
    "external_id": "external id"
}
```

Copy
```
{
   "amount":"100",
   "currency":"USDT",
   "wallet":"djfhku2h345h43l63jh423j4v2",
   "network":"TRC20",
   "external_id":"123456",
   "comment":"comment for withdrawal",
   "travelRule":{
      "type":"individual",
      "vasp":"Whitepay",
      "name":"John Doe",
      "address":"123 Business Street, London, UK"
   }
}
```

**Response payload**

200

422

Copy
```
{
   "request_id":"a1363250-966e-453e-bab3-59b6342d2cfe",
   "transactions":[
      {
         "id":"a1363250-966e-453e-bab3-59b6342d2cfe",
         "currency":{
            "id":"cc49ce25-4cbc-4dbe-bb55-b2453eb48430",
            "ticker":"TON",
            "is_fiat":false,
            "visible_ticker":null,
            "is_stable":false,
            "is_used_for_order_exchange":false,
            "icon":"https://media.whitepay.com/currency-default-icon.svg",
            "crm_icon":"https://media.whitepay.com/currency-default-icon.svg",
            "precision":2,
            "title":"Toncoin"
         },
         "value":"6.435",
         "status":"PENDING_WITHDRAWAL",
         "type":"CRYPTO_WALLET",
         "network":"TON",
         "memo":"2722623253",
         "fee":"0.15",
         "created_at":"2026-03-03 12:37:24",
         "completed_at":null,
         "email":"someemail@gmail.com",
         "description":null,
         "travel_rule":{}
      }
   ]
}
```

Copy
```
{
    "message": "The given data was invalid",
    "errors": {
        "amount": [
            "The balance is not enough. Max: 14.85 USDT"
        ]
    }
}
```

Check out Transaction entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#post-create-request-for-iban-withdrawal)

Create request for IBAN withdrawal

This request should be executed to initiate funds withdrawal to IBAN.

`**[POST]**` `**/private-api/withdrawal-iban**`

**Parameters**

Attribute

Type

Required

Description

amount

string

yes

amount to withdraw

iban

string

yes

data on bank account (IBAN, address etc)

exchange\_currency

string

yes/no

currency of exchange after withdrawal. Required in case if main balance is in crypto.

external\_id

string

no

external id for withdrawal operation

comment

string

no

description for withdrawal operation

**Request payload**

Example

Copy
```
{
   "amount":"200",
   "iban":"IBAN address",
   "exchange_currency":"EUR",
   "external_id":"35235212",
   "comment":"comment"
}
```

**Response payload**

200

422

Copy
```
{
  "request_id": "baa8c39a-2c95-4967-8437-7920513041a1"
}
```

Copy
```
{
   "message":"The given data was invalid",
   "errors":{
      "amount":[
         "Insufficient funds"
      ]
   }
}
```

* * *

## 

[hashtag](#show-withdrawal-fees-and-limits)

Show withdrawal fees and limits

This request should be executed to get data on withdrawal fees and limits.

`**[GET]**` `**/private-api/withdrawals/fees**`

**Filters**

Parameters

Type

Required

Description

ticker

string

no

currency ticker to get data on specified currency

**Response** **payload**

200

Copy
```
{
   "currencies":[
      {
         "fees":null,
         "network_fees":{
            "TRC20":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "TON":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "CCHAIN":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "ERC20":{
               "fixed":"9.54",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "NEAR":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"1",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "ARBITRUM":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "POLYGON":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            },
            "SOL":{
               "fixed":"1",
               "max_amount":"0",
               "min_amount":"10",
               "is_memo_required":false,
               "flex":{
                  "minFee":"0",
                  "maxFee":"0",
                  "percent":"0"
               }
            }
         },
         "networks":[
            "TRC20",
            "TON",
            "CCHAIN",
            "ERC20",
            "NEAR",
            "ARBITRUM",
            "POLYGON",
            "SOL"
         ],
         "currency":{
            "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
            "ticker":"USDT",
            "is_fiat":false,
            "title":"Tether US",
            "is_used_for_order_exchange":true,
            "is_billable":true,
            "precision":2,
            "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
            "crm_icon":"https://media.whitepay.com/e2d19518-2d8e-4c95-9db0-89f64b792da9/AWS-S3-Bucket-Cost-(1).png",
            "networks":{
               "deposits":[
                  "TRC20",
                  "TON",
                  "CCHAIN",
                  "ERC20",
                  "NEAR",
                  "ARBITRUM",
                  "POLYGON",
                  "SOL"
               ],
               "withdraws":[
                  "TRC20",
                  "TON",
                  "CCHAIN",
                  "ERC20",
                  "NEAR",
                  "ARBITRUM",
                  "POLYGON",
                  "SOL"
               ]
            },
            "exchange_currencies":[
               {
                  "id":"6e2372bb-76b4-48b0-9d74-39f6902cabf8",
                  "ticker":"UAH",
                  "is_fiat":true,
                  "is_stable":false,
                  "is_used_for_order_exchange":true,
                  "icon":"https://media.whitepay.com/daf4a261-bba4-4bad-9731-00e091184eae/UAH.svg",
                  "crm_icon":"https://media.whitepay.com/daf4a261-bba4-4bad-9731-00e091184eae/UAH.svg",
                  "precision":2,
                  "title":"UAH Hryvnia",
                  "min_exchange_amount":"0"
               },
               {
                  "id":"2b49449f-7757-4ad0-8e42-1ac75a002ecf",
                  "ticker":"USD",
                  "is_fiat":true,
                  "is_stable":false,
                  "is_used_for_order_exchange":true,
                  "icon":"https://media.whitepay.com/0d109b34-8ee3-44d2-92b7-27003944d781/USD.svg",
                  "crm_icon":"https://media.whitepay.com/0d109b34-8ee3-44d2-92b7-27003944d781/USD.svg",
                  "precision":2,
                  "title":"US Dollar",
                  "min_exchange_amount":"1"
               },
               {
                  "id":"a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
                  "ticker":"EUR",
                  "is_fiat":true,
                  "is_stable":true,
                  "is_used_for_order_exchange":true,
                  "icon":"https://media.whitepay.com/03f2fa65-4930-4064-be1c-a15793c380f9/eur.svg",
                  "crm_icon":"https://media.whitepay.com/03f2fa65-4930-4064-be1c-a15793c380f9/eur.svg",
                  "precision":2,
                  "title":"Euro",
                  "min_exchange_amount":"2"
               }
            ]
         },
         "company_crypto_withdrawal_commission":"0"
      }
   ],
   "meta":{
      "current_page":1,
      "last_page":1,
      "total":1
   }
}
```

* * *

[PreviousBalancechevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/balance)[NextConversion with withdrawalchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)

Last updated 7 days ago

---
## Conversion with withdrawal

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal`

copyCopy

# money-bill-transferConversion with withdrawal

* * *

1.  [**General**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#general)
    
2.  [**Basic flow**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#basic-flow)
    
3.  [**Currencies to be converted list**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#currencies-to-be-converted-list)
    
4.  [**Create request to make a payout**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-make-a-payout)
    
5.  [**Create request to refresh exchange rate**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-refresh-exchange-rate)
    
6.  [**Create request to confirm payout request**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-confirm-payout-request)
    
7.  [**Create request to make an instant payout**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-make-an-instant-payout)
    

* * *

## 

[hashtag](#general)

General

These API methods allow the user to:

-   Create a request for withdrawal of funds with conversion
    
-   Update the request to get the current exchange rate
    
-   Confirm a previously created request for its execution
    

The main feature is that the user sends the equivalent in fiat currency that he would like to withdraw from the account.

This method is ideal for businesses that work with crypto and fiat currencies and have their clients' balance in fiat.

* * *

## 

[hashtag](#statuses)

Statuses

Possible statuses for transactions of "CONVERSION\_WITHDRAWAL" type are:

-   `WAITING_CONFIRMATION` - transaction was created, but we are waiting for confirmation
    
-   `PENDING_WITHDRAWAL` - transaction was confirmed, but we haven't yet sent request to withdraw funds (on this step we can make a conversion etc)
    
-   `PROCESSING_WITHDRAWAL` - request to withdraw funds was sent and funds are already in blockchain
    
-   `COMPLETE` - withdrawal completed
    
-   `DECLINED` - withdrawal declined
    

The basic flow for statuses change is - WAITING\_CONFIRMATION -> PENDING\_WITHDRAWAL -> PROCESSING\_WITHDRAWAL -> COMPLETE

* * *

## 

[hashtag](#basic-flow)

Basic flow

* * *

## 

[hashtag](#currencies-to-be-converted-list)

Currencies to be converted list

API endpoint that return list of currencies that can be converted.

`**[GET]**` `**/private-api/convert-withdrawal/currencies**`

**Response** **payload**

200

Copy
```
{
   "currencies":[
      {
         "id":"a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
         "ticker":"EUR",
         "precision":2
      }
   ],
   "meta":{
      "current_page":1,
      "last_page":1,
      "total":1
   }
}
```

* * *

## 

[hashtag](#create-request-to-make-a-payout)

Create request to make a payout

API endpoint to make a request for funds conversion & withdrawal.

`**[POST]**` `**/private-api/convert-withdrawal**`

**Parameters**

Attribute

Type

Required

Description

currency

string

yes

the currency to be converted

amount

string

yes

the amount in currency to be converted

target\_currency

string

yes

the currency into which the conversion will take place

address

string

yes

the address of the crypto wallet to which the funds will be withdrawn

network

string

yes

crypto wallet network

memo

string

yes/no

crypto wallet memo

external\_id

string

no

external id

type

string

yes, in case if you are from EEA

travel rule receiver type. values: “individual” or “entity”

vasp

string

yes, in case if you are from EEA

travel rule destination platform (VASP) name

name

string

yes, in case if you are from EEA

if individual - individual\_name, if entity - entity\_name

address

string

yes, in case if you are from EEA

if individual - individual\_address, if entity - entity\_address

**Request** **payload**

Without memo

With memo

Travel rule

Copy
```
{
   "currency":"EUR",
   "amount":50,
   "target_currency":"USDT",
   "address":"EQAigd8Mjq1JejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
   "network":"TRC20",
   "external_id":"external id"
}
```

Copy
```
{
   "currency":"USDT",
   "amount":5,
   "target_currency":"TON",
   "address":"EQAigd8MjqsJejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
   "network":"TON",
   "memo":"2722623253",
   "external_id":"external id"
}
```

Copy
```
{
   "currency":"EUR",
   "amount":50,
   "target_currency":"USDT",
   "address":"EQAigd8MjqsJejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
   "network":"TON",
   "memo":"4116605216",
   "external_id":"23523512",
   "travelRule":{
      "type":"individual",
      "vasp":"Whitepay",
      "name":"John Doe",
      "address":"123 Business Street, London, UK"
   }
}
```

**Response** **payload**

200

Copy
```
{
   "transaction":{
      "id":"a1362c77-d509-4436-b498-b7b4197ed402",
      "currency":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "ticker":"USDT",
         "is_fiat":false,
         "visible_ticker":null,
         "is_stable":true,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "precision":2,
         "title":"Tether US"
      },
      "value":"5",
      "target_currency":{
         "id":"cc49ce25-4cbc-4dbe-bb55-b2453eb48430",
         "ticker":"TON",
         "is_fiat":false,
         "visible_ticker":null,
         "is_stable":false,
         "is_used_for_order_exchange":false,
         "icon":"https://media.whitepay.com/currency-default-icon.svg",
         "crm_icon":"https://media.whitepay.com/currency-default-icon.svg",
         "precision":2,
         "title":"Toncoin"
      },
      "target_value":"3.46689108",
      "status":"WAITING_CONFIRMATION",
      "type":"CONVERT_WITHDRAWAL",
      "network":"TON",
      "address":"EQAigd8MjqsJejMuIB0UPhErOlGe22de1kpjvpWt9kOrtkG8",
      "memo":"2722623253",
      "fee":null,
      "exchange_rate":"1.44221433111766522529",
      "estimated_at":"2026-03-03 12:21:33",
      "created_at":"2026-03-03 12:21:03",
      "completed_at":null,
      "external_id":"test_0.1.10.10",
      "email":null,
      "description":null,
      "travel_rule":{}
   }
}
```

* * *

## 

[hashtag](#create-request-to-refresh-exchange-rate)

Create request to refresh exchange rate

API endpoint to create a request to update the exchange rate if the previous one has expired.

`**[POST]**` `**/private-api/convert-withdrawal/{transactionID}/refresh**`

Attribute

Type

Required

Description

transactionID

string

yes

Whitepay transaction id

**Response** **payload**

200

Copy
```
{
   "transaction":{
      "id":"9d8a6c88-e55c-487e-9f1c-427dfd0ab0ef",
      "currency":{
         "id":"a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
         "ticker":"EUR",
         "is_fiat":true,
         "is_stable":true,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/03f2fa65-4930-4064-be1c-a15793c380f9/eur.svg",
         "crm_icon":"https://media.whitepay.com/03f2fa65-4930-4064-be1c-a15793c380f9/eur.svg",
         "precision":2,
         "title":"Euro"
      },
      "value":"50",
      "target_currency":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "ticker":"USDT",
         "is_fiat":false,
         "is_stable":true,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "precision":2,
         "title":"Tether US"
      },
      "target_value":"50.665446",
      "status":"WAITING_CONFIRMATION",
      "type":"CONVERT_WITHDRAWAL",
      "network":"TON",
      "address":"EQAigd8MjqsJejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
      "memo":"4116605216",
      "fee":null,
      "exchange_rate":"0.98686588093984211645",
      "estimated_at":"2024-11-21 08:44:17",
      "created_at":"2024-11-21 08:41:59",
      "completed_at":null,
      "external_id":"23523512"
   }
}
```

* * *

## 

[hashtag](#create-request-to-confirm-payout-request)

Create request to confirm payout request

API endpoint to confirm payout request execution.

`**[POST]**` `**/private-api/convert-withdrawal/{transactionID}/confirm**`

Attribute

Type

Required

Description

transactionID

string

yes

Whitepay transaction id

**Response payload**

200

422

Copy
```
{
   "transaction":{
      "id":"9d8a6c88-e55c-487e-9f1c-427dfd0ab0ef",
      "currency":{
         "id":"a4d2e5b4-aa82-43dc-af9c-663e8d5c33d5",
         "ticker":"EUR",
         "is_fiat":true,
         "is_stable":true,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/03f2fa65-4930-4064-be1c-a15793c380f9/eur.svg",
         "crm_icon":"https://media.whitepay.com/03f2fa65-4930-4064-be1c-a15793c380f9/eur.svg",
         "precision":2,
         "title":"Euro"
      },
      "value":"50",
      "target_currency":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "ticker":"USDT",
         "is_fiat":false,
         "is_stable":true,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "precision":2,
         "title":"Tether US"
      },
      "target_value":"50.665446",
      "status":"PENDING_WITHDRAWAL",
      "type":"CONVERT_WITHDRAWAL",
      "network":"TON",
      "address":"EQAigd8MjqsJejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
      "memo":"4116605216",
      "fee":null,
      "exchange_rate":"0.98686588093984211645",
      "estimated_at":"2024-11-21 08:44:17",
      "created_at":"2024-11-21 08:41:59",
      "completed_at":null,
      "external_id":"23523512"
   }
}
```

Copy
```
{
   "message":"The given data was invalid",
   "errors":{
      "transaction":[
         "Time to confirm expired"
      ]
   }
}
```

circle-exclamation

**You should know!**

Withdrawal request can be confirmed in 30 seconds only. In case if 30 seconds have lasted - a new exchange rate should be received.

* * *

## 

[hashtag](#create-request-to-make-an-instant-payout)

Create request to make an instant payout

API endpoint to make an instant payout.

The main difference is that this method doesn't need a confirmation or rate refresh, because a payout will be made instantly. **"**[**Create request to make a payout**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-make-a-payout)**"**, **"**[**Create request to refresh exchange rate**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-refresh-exchange-rate)**"** and **"**[**Create request to confirm payout**](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal#create-request-to-confirm-payout-request)**"** request are combined into one.

`**[POST]**` `**/private-api/convert-withdrawal/instant**`

**Parameters**

Attribute

Type

Required

Description

currency

string

yes

the currency to be converted

amount

string

yes

the amount in currency to be converted

target\_currency

string

yes

the currency into which the conversion will take place

address

string

yes

the address of the crypto wallet to which the funds will be withdrawn

network

string

yes

crypto wallet network

memo

string

yes/no

crypto wallet memo

external\_id

string

no

external id

type

string

yes, in case if you are from EEA

travel rule receiver type. values: “individual” or “entity”

vasp

string

yes, in case if you are from EEA

travel rule destination platform (VASP) name

name

string

yes, in case if you are from EEA

if individual - individual\_name, if entity - entity\_name

address

string

yes, in case if you are from EEA

if individual - individual\_address, if entity - entity\_address

**Request** **payload**

Without memo

With memo

Travel rule

Copy
```
{
   "currency":"EUR",
   "amount":50,
   "target_currency":"USDT",
   "address":"EQAigd8Mjq1JejMuIB0UPhErOlGe22dezkpjvpWt9kOrtkG8",
   "network":"TRC20",
   "external_id":"external id"
}
```

Copy
```
{
   "currency":"TRY",
   "amount":398.59,
   "target_currency":"XLM",
   "address":"GDTSOI56XNVAKJNJBLJGRNZIVOCIZJRBIDKTWSCYEYNFAZEMBLN75RMN",
   "network":"STELLAR",
   "memo":"53620124552836",
   "external_id":"86ab6ad21cabd2d723fdc0fe"
}
```

Copy
```
{
   "currency":"TRY",
   "amount":398.59,
   "target_currency":"XLM",
   "address":"GDTSOI56XNVAKJNJBLJGRNZIVOCIZJRBIDKTWSCYEYNFAZEMBLN75RMN",
   "network":"STELLAR",
   "memo":"53620124552836",
   "external_id":"86ab6ad21cabd2d723fdc0fe",
   "travelRule":{
      "type":"individual",
      "vasp":"WhiteBIT",
      "name":"Falcon",
      "address":"ONE"
   }
}
```

**Response** **payload**

200

Copy
```
{
   "transaction":{
      "id":"a1362c77-d509-4436-b498-b7b4197ed402",
      "currency":{
         "id":"d9da4bdc-1c0b-4835-8ec6-a7118247340f",
         "ticker":"USDT",
         "is_fiat":false,
         "visible_ticker":null,
         "is_stable":true,
         "is_used_for_order_exchange":true,
         "icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "crm_icon":"https://media.whitepay.com/c9409283-ed01-436f-bb6d-8763ff06ba54/USDT-(2).svg",
         "precision":2,
         "title":"Tether US"
      },
      "value":"5",
      "target_currency":{
         "id":"cc49ce25-4cbc-4dbe-bb55-b2453eb48430",
         "ticker":"TON",
         "is_fiat":false,
         "visible_ticker":null,
         "is_stable":false,
         "is_used_for_order_exchange":false,
         "icon":"https://media.whitepay.com/currency-default-icon.svg",
         "crm_icon":"https://media.whitepay.com/currency-default-icon.svg",
         "precision":2,
         "title":"Toncoin"
      },
      "target_value":"3.46099797",
      "status":"PENDING_WITHDRAWAL",
      "type":"CONVERT_WITHDRAWAL",
      "network":"TON",
      "address":"EQAigd8MjqsJejMuIB0UPhErOlGe12dezkpjvpWt9kOrtkG8",
      "memo":"2722623253",
      "fee":null,
      "exchange_rate":"1.44467001811041224043",
      "estimated_at":"2026-03-03 12:32:37",
      "created_at":"2026-03-03 12:21:03",
      "completed_at":null,
      "external_id":"external id",
      "email":null,
      "description":null,
      "travel_rule":{}
   }
}
```

[PreviousWithdrawalchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)[NextRefundchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/refund)

Last updated 7 days ago

---
## Refund

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/refund`

copyCopy

# rotate-leftRefund

* * *

1.  [**General**](/1Q957FgGhSNqAyGWQqz0/http-api/refund#general)
    
2.  [**Refund flow**](/1Q957FgGhSNqAyGWQqz0/http-api/refund#refund-flow)
    
3.  [**Create request to make manual refund**](/1Q957FgGhSNqAyGWQqz0/http-api/refund#create-request-to-make-manual-refund)
    
4.  [**Create request to make automated refund**](/1Q957FgGhSNqAyGWQqz0/http-api/refund#create-request-to-make-automated-refund)
    

* * *

## 

[hashtag](#general)

General

These API methods allow the user to make a refund of invoice.

* * *

## 

[hashtag](#refund-flow)

Refund flow

### 

[hashtag](#manual-refund)

Manual refund

### 

[hashtag](#auto-refund)

Auto refund

### 

[hashtag](#additional-cases)

Additional cases

**Case 1**

-   User wasn’t responding for 30 days from “REFUND“ transaction creation.
    
-   The transaction status is changed to "DECLINED".
    
-   Webhook of “event\_type“:”refund::declined” is sent.
    

**Case** **2**

-   Withdrawal wasn’t completed due to issues on the provider's side.
    
-   The transaction status is changed to "DECLINED".
    
-   Webhook of “event\_type“:”refund::declined” is sent.
    

circle-exclamation

**You should know!**

The refund functionality only refunds funds that were received within the expected invoice amount - “expected\_amount“.  Overpayments and underpayments will be automatically processed through a different flow.

* * *

## 

[hashtag](#create-request-to-make-manual-refund)

Create request to make manual refund

API endpoint to create a request to make manual refund.

`**[POST]**` `**/private-api/refunds/orders/{orderID}**`

Attribute

Type

Required

Description

orderID

string

yes

Whitepay order id

**Parameters**

Attribute

Type

Required

Description

email

string

Required if users email wasn't specified during invoice creation

End users email

name

string

no

End users full name

external\_id

string

no

Unique refund identifier in client Database . number of characters: min 1, max 255.

**Request payload**

Example

Copy
```
{
   "email":"john.doe@gmail.com",
   "name":"John Doe"
}
```

**Response payload**

201

Copy
```
{
    "order": {
        "id": "e1bf8a24-f65b-4696-be2e-3b95c5cecaaf",
        "currency": "EUR",
        "order_number": "418429717",
        "value": "10",
        "expected_amount": "11.6522",
        "received_total": "11.13",
        "exchange_rate": "0.85820703",
        "clean_exchange_rate": "0.9992",
        "is_internal": true,
        "deposited_currency": "USDC",
        "received_currency": "USDT",
        "status": "COMPLETE",
        "external_order_id": null,
        "created_at": "2025-07-18 07:02:30",
        "completed_at": "2025-07-18 07:04:07",
        "is_refund_available": false,
        "is_refunded": false,
        "acquiring_url": "https://merchant.pay.whitepay.com/crypto-orders/e1bf8a24-f65b-4696-be2e-3b95c5cecaaf",
        "successful_link": null,
        "failure_link": null,
        "fee_amount": "0.5",
        "fee_currency": "USDT",
        "is_min_fee_applied": true,
        "transactions": [
            {
                "id": "9963deaa-b5d1-4324-b3f0-e43932629445",
                "type": "REFUND",
                "currency": "USDT",
                "value": "11.13",
                "status": "INIT",
                "hash": null,
                "is_internal": false,
                "created_at": "2025-07-18 07:05:24",
                "completed_at": null,
                "explorer_link": null,
                "email": "john.doe@gmail.com",
                "description": null,
                "travel_rule": {
                    "vasp": null,
                    "name": null,
                    "type": null,
                    "address": null
                }
            },
            {
                "id": "9f6b12be-45fe-4c84-89b6-3b453e41d36b",
                "type": "CRYPTO_INVOICE",
                "currency": "USDC",
                "value": "11.6522",
                "status": "COMPLETE",
                "hash": "6816e185-73f6-43df-812b-cfc46d3986e3",
                "is_internal": true,
                "created_at": "2025-07-18 07:04:07",
                "completed_at": "2025-07-18 07:04:07",
                "explorer_link": null,
                "email": "john.doe@gmail.com",
                "description": null,
                "travel_rule": {
                    "vasp": null,
                    "name": null,
                    "type": null,
                    "address": null
                },
                "fee_amount": "0.5",
                "fee_currency": "USDT",
                "is_min_fee_applied": true
            }
        ],
        "email": "john.doe@gmail.com",
        "description": null
    }
}
```

* * *

## 

[hashtag](#create-request-to-make-automated-refund)

Create request to make automated refund

API endpoint to create a request to make automated refund.

`**[POST]**` `**/private-api/refunds/orders/{orderID}/instant**`

Attribute

Type

Required

Description

orderID

string

yes

Whitepay order id

**Parameters**

Attribute

Type

Required

Description

wallet

string

yes

wallet address

network

string

yes

cryptocurrency network

memo

string

yes, in case if currencies network requires memo

memo tag

external\_id

string

no

Unique refund identifier in client Database . number of characters: min 1, max 255.

type

string

yes, in case if you are from EEA

travel rule receiver type. values: “individual” or “entity”

vasp

string

yes, in case if you are from EEA

travel rule destination platform (VASP) name

name

string

yes, in case if you are from EEA

if individual - individual\_name, if entity - entity\_name

address

string

yes, in case if you are from EEA

if individual - individual\_address, if entity - entity\_address

**Request payload**

Example

Travel rule

Copy
```
{
   "wallet":"0x4aD92c1A11Da776aE2F6e3b42D54E25584882212",
   "network":"WHITECHAIN",
   "memo":"2524084800"
}
```

Copy
```
{
   "wallet":"0x4aD92c1A11Da776aE2F6e3b42D54E25584882212",
   "network":"WHITECHAIN",
   "memo":"2524084800",
   "type":"individual",
   "vasp":"Whitepay",
   "name":"John Doe",
   "address":"123 Business Street, London, UK"
}
```

**Response payload**

201

Copy
```
{
   "order":{
      "id":"030df45b-fb13-4050-abb8-0eb211ddf93b",
      "currency":"EUR",
      "order_number":"245467107",
      "value":"19.99",
      "expected_amount":"23.2842",
      "received_total":"22.74",
      "exchange_rate":"0.85852208",
      "clean_exchange_rate":"0.9992",
      "is_internal":true,
      "deposited_currency":"USDC",
      "received_currency":"USDT",
      "status":"COMPLETE",
      "external_order_id":null,
      "created_at":"2025-07-18 07:13:23",
      "completed_at":"2025-07-18 07:15:18",
      "is_refund_available":false,
      "is_refunded":false,
      "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/030df45b-fb13-4050-abb8-0eb211ddf93b",
      "successful_link":null,
      "failure_link":null,
      "fee_amount":"0.5",
      "fee_currency":"USDT",
      "is_min_fee_applied":true,
      "transactions":[
         {
            "id":"df5e2c8d-bce9-47a3-9d2b-c0a1fae79707",
            "type":"REFUND",
            "currency":"USDT",
            "value":"22.74",
            "status":"INIT",
            "hash":null,
            "is_internal":false,
            "created_at":"2025-07-18 07:17:44",
            "completed_at":null,
            "explorer_link":null,
            "email":null,
            "description":null,
            "travel_rule":{
               "vasp":null,
               "name":null,
               "type":null,
               "address":null
            }
         },
         {
            "id":"9f6b16bd-5d78-439e-b13d-6dea66590dfb",
            "type":"CRYPTO_INVOICE",
            "currency":"USDC",
            "value":"23.2842",
            "status":"COMPLETE",
            "hash":"f494a734-746c-49ef-9830-9fbf9efeaa2c",
            "is_internal":true,
            "created_at":"2025-07-18 07:15:18",
            "completed_at":"2025-07-18 07:15:18",
            "explorer_link":null,
            "email":null,
            "description":null,
            "travel_rule":{
               "vasp":null,
               "name":null,
               "type":null,
               "address":null
            },
            "fee_amount":"0.5",
            "fee_currency":"USDT",
            "is_min_fee_applied":true
         }
      ],
      "email":null,
      "description":null
   }
}
```

[PreviousConversion with withdrawalchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)[NextMiscchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/misc)

Last updated 1 month ago

---
## Misc

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/misc`

copyCopy

# flaskMisc

* * *

1.  [**Show order details**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#show-order-details)
    
2.  [**Show orders list**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#show-orders-list)
    
3.  [**Order statuses list**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#order-statuses-list)
    
4.  [**Show transaction details**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#show-transaction-details)
    
5.  [**Show transactions list**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#get-get-usdt-uah-exchange-rate)
    
6.  [**Get USDT/UAH exchange rate**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#get-get-usdt-uah-exchange-rate-1)
    
7.  [**Exchange rates for external currencies**](/1Q957FgGhSNqAyGWQqz0/http-api/misc#get-exchange-rates-for-external-currencies)
    

* * *

## 

[hashtag](#show-order-details)

Show order details

`**[GET]**` `**/private-api/orders/{slug}/{orderId}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

orderId

string

yes

unique identifier of order

**Response payload**

200

Copy
```
{
   "order":{
      "id":"db1aab80-83ec-4566-9c81-6bfda1c53c4e",
      "currency":"USDT",
      "order_number":"716274867",
      "value":"10",
      "expected_amount":"10",
      "received_total":"9.9",
      "exchange_rate":"1",
      "clean_exchange_rate":"1",
      "is_internal":true,
      "deposited_currency":"USDT",
      "received_currency":"USDT",
      "status":"COMPLETE",
      "external_order_id":null,
      "created_at":"2024-12-02 10:03:26",
      "completed_at":"2024-12-02 10:21:32",
      "acquiring_url":"https://merchant.pay.whitepay.com/crypto-orders/db1aab80-83ec-4566-9c81-6bfda1c53c4e",
      "successful_link":null,
      "failure_link":null,
      "transactions":[
         {
            "id":"9da0b0f6-b071-4166-aa23-7f17746afe52",
            "type":"CRYPTO_INVOICE",
            "currency":"USDT",
            "value":"10",
            "status":"COMPLETE",
            "hash":"internal_transaction_e82549fe-1a52-4db2-a2fe-f4a315a78d24",
            "is_internal":true,
            "created_at":"2024-12-02 10:21:32",
            "completed_at":"2024-12-02 10:21:32",
            "explorer_link":"https://whitebit.com"
         }
      ]
   }
}
```

Check out order entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#show-orders-list)

Show orders list

`**[GET]**` `**/private-api/orders/{slug}**`

Attribute

Type

Required

Description

slug

string

yes

unique instance name defined for payment page. can be found on each payment page settings page in CRM.

**Filters**

Parameters

Type

Required

Description

page

int

no

page number

per\_page

int

no

count of items per page

date\_from

date

no

format: 2022-06-01+00:00:00

date\_to

date

no

format: 2022-06-01+00:00:00

completed\_at\_from

date

no

format: 2022-06-01+00:00:00

completed\_at\_to

date

no

format: 2022-06-01+00:00:00

order\_status\_id

uuid

no

ref. order status ID

external\_order\_id

string

no

ref. external order ID

**Response payload**

200

Copy
```
{
   "orders":[
      {
         "id":"9adc7d67-8fdd-4419-8ac7-161b09f12fdd",
         "currency":"USDT",
         "order_number":"651463516",
         "value":"5",
         "expected_amount":"5",
         "received_total":"4.95",
         "exchange_rate":null,
         "clean_exchange_rate":null,
         "is_internal":true,
         "deposited_currency":"USDT",
         "received_currency":"USDT",
         "status":"COMPLETE",
         "external_order_id":null,
         "created_at":"2024-12-09 14:25:17",
         "completed_at":"2024-12-09 14:25:44",
         "acquiring_url":null,
         "successful_link":null,
         "failure_link":null,
         "transactions":[
            {
               "id":"9daf1d2e-63b7-432f-b946-4db156e2ea10",
               "type":"CRYPTO_DONATION",
               "currency":"USDT",
               "value":"5",
               "status":"COMPLETE",
               "hash":"WB_PAY_cca1053a-429a-4f80-a19a-6ca00cff9ae0",
               "is_internal":true,
               "created_at":"2024-12-09 14:25:44",
               "completed_at":"2024-12-09 14:25:44",
               "explorer_link":"https://whitebit.com",
               "fee_amount":"0.05",
               "fee_currency":"USDT"
            }
         ]
      },
      {
         "id":"adb975fc-9cdc-4344-a299-cbe740af52e2",
         "currency":"USDT",
         "order_number":"422872245",
         "value":null,
         "expected_amount":"5",
         "received_total":"0",
         "exchange_rate":null,
         "clean_exchange_rate":null,
         "is_internal":null,
         "deposited_currency":"USDT",
         "received_currency":"USDT",
         "status":"OPEN",
         "external_order_id":null,
         "created_at":"2024-12-09 14:25:04",
         "completed_at":null,
         "acquiring_url":null,
         "successful_link":null,
         "failure_link":null,
         "transactions":[
            
         ]
      }
   ],
   "meta":{
      "current_page":1,
      "last_page":345,
      "total":5162
   }
}
```

Check out pagination entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#order-statuses-list)

Order statuses list

`**[GET]**` `**/private-api/order-statuses**`

**Response payload**

200

Copy
```
{
  "order_statuses": [
    {
      "id": "5af96312-b7b9-4d21-9958-30285a54f4c8",
      "label": "CANCELED"
    },
    {
      "id": "7f8550ad-11da-4060-8d1d-54a6d9c08e10",
      "label": "INIT"
    },
    {
      "id": "f46218e8-e883-4478-abac-f5b8c94f97c2",
      "label": "PARTIALLY_FULFILLED"
    },
    {
      "id": "ab306dbd-b837-413a-add5-3bd76542c1c4",
      "label": "COMPLETE"
    },
    {
      "id": "1ca06987-ede3-44e3-be1c-f883e82d267b",
      "label": "DECLINED"
    },
    {
      "id": "984617f8-81fc-4971-b5d0-acebbc6d9d9c",
      "label": "OPEN"
    }
  ]
}
```

Check out order status entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#show-transaction-details)

Show transaction details

`**[GET]**` `**/private-api/transactions/{transactionId}**`

Attribute

Type

Required

Description

transactionId

string

yes

Whitepay internal transaction id

**Response payload**

200

Copy
```
{
   "transaction":{
      "id":"9daf0aa7-dfd6-4ceb-a28a-1ce27e6cba17",
      "type":"CRYPTO_INVOICE",
      "currency":"USDT",
      "value":"10",
      "status":"COMPLETE",
      "hash":"internal_transaction_13a674ce-bb20-4772-976d-303476192a77",
      "is_internal":true,
      "created_at":"2024-12-09 13:33:56",
      "completed_at":"2024-12-09 13:33:56",
      "explorer_link":"https://whitebit.com"
   }
}
```

Check out Transaction entity [reference](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api) for detailed description.

* * *

## 

[hashtag](#get-get-usdt-uah-exchange-rate)

Show transactions list

`**[GET]**` `**/private-api/transactions**`

**Filters**

Parameters

Type

Required

Description

page

int

no

page number

per\_page

int

no

count of items per page

date\_from

date

no

format: 2022-06-01+00:00:00

date\_to

date

no

format: 2022-06-01+00:00:00

completed\_at\_from

date

no

format: 2022-06-01+00:00:00

completed\_at\_to

date

no

format: 2022-06-01+00:00:00

external\_id

string

no

ref. external transaction ID

**Response payload**

200

Copy
```
{
   "transactions":[
      {
         "id":"9d98b9b6-64ce-444d-b147-1ffa9afd2d30",
         "type":"CRYPTO_TOPUP",
         "currency":"USDT",
         "value":"10",
         "status":"COMPLETE",
         "hash":"internal_transaction_d2202363-f078-46a8-a0a9-dbbbeb23ece3",
         "is_internal":true,
         "created_at":"2024-11-28 11:19:23",
         "completed_at":"2024-11-28 11:19:23",
         "explorer_link":"https://whitebit.com",
         "fee_amount":"0.094711",
         "fee_currency":"EUR"
      },
      {
         "id":"9d98a3de-f32c-43e1-ac0d-75320f1f9a51",
         "type":"CRYPTO_INVOICE",
         "currency":"POL",
         "value":"12.7",
         "status":"COMPLETE",
         "hash":"0xfdecb2ce11c85d216a7bdbb7b5aa6e93a91642f35db63b8898768d9393b0b7fd",
         "is_internal":false,
         "created_at":"2024-11-28 10:18:18",
         "completed_at":"2024-11-28 10:36:05",
         "explorer_link":"https://polygonscan.com/tx/0xfdecb2ce11c85d216a7bdbb7b5aa6e93a91642f35db63b8898768d9393b0b7fd"
      }
   ],
   "meta":{
      "current_page":1,
      "last_page":267,
      "total":4000
   }
}
```

* * *

## 

[hashtag](#get-get-usdt-uah-exchange-rate-1)

Get USDT/UAH exchange rate

`**[GET]**` `**/rates**`

**Response payload**

200

Copy
```
{
  "USDT_UAH":"39,00"
}
```

* * *

## 

[hashtag](#get-exchange-rates-for-external-currencies)

Exchange rates for external currencies

Returns exchange rate for external currencies in pair to USDT

`**[GET]**` `**/private-api/exchange-rates/{currencyTicker}**`

**Response payload**

200

Copy
```
{
  "ticker": "NGN", 
  "exchange_rate": "1660.2759444311"
}
```

[PreviousRefundchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/refund)[NextAuthorizationchevron-right](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)

Last updated 7 months ago

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/webhooks/authorization`

copyCopy

# webhookAuthorization

## 

[hashtag](#generate-webhook-signature-token)

Generate webhook signature token

**Whitepay Webhooks** utilizes Signature Token for signing Requests which sends to Webhook Targets. Webhooks are divided into general and webhooks related to payment pages. You can get your Signature Token on "Settings"-> "Tokens" page in CRM for general webhook settings or on Payment page settings page for payment page webhook settings.

## 

[hashtag](#general-webhook-settings)

General webhook settings

## 

[hashtag](#payment-page-webhook-settings)

Payment page webhook settings

## 

[hashtag](#signature-validation)

Signature validation

Each webhook request includes **"Signature"** header.

circle-exclamation

**Security tip**

Before process data from Webhook's body, you should validate "Signature" header with locally signed payload.

JavaScript

PHP

Copy
```
const { HmacSHA256 } = require('crypto-js');
const payloadJson = JSON.stringify(payload)
const signature = HmacSHA256(JSON.stringify(req.body).replace(/\//g, “\\/“), secret).toString()
```

Copy
```
$payloadJson = json_encode($payload);
$signature = hash_hmac('sha256', $payloadJson, $secret);
```

`$secret` - Signature key from CRM Settings page

`$payload` - Request body

[PreviousMiscchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/misc)[NextEventschevron-right](/1Q957FgGhSNqAyGWQqz0/webhooks/events)

Last updated 8 months ago

---
## Events

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/webhooks/events`

copyCopy

# arrow-right-arrow-leftEvents

## 

[hashtag](#webhooks-settings)

Webhooks settings

After webhook token generation you will be able to configure trigger events depending on their type.

## 

[hashtag](#general-webhook-settings)

General webhook settings

### 

[hashtag](#withdrawals)

Withdrawals

-   Withdrawal is completed - withdrawal transaction was successful and its status was changed to **COMPLETE**. ("event\_type": "withdrawal::completed")
    
-   Withdrawal is declined - withdrawal transaction was declined for any reason and its status was changed to **DECLINED**. ("event\_type": "withdrawal::declined")
    
-   Conversion & withdrawal is completed - withdrawal transaction with conversion was successful and its status was changed to **COMPLETE**. ("event\_type": "conversion\_withdrawal::completed")
    
-   Conversion & withdrawal is declined - withdrawal transaction with conversion was declined for any reason and its status was changed to **DECLINED**. ("event\_type": "conversion\_withdrawal::declined")
    

### 

[hashtag](#refunds)

Refunds

-   Refund is completed - refund transaction was successful and its status was changed to **COMPLETE**. ("event\_type": "refund::completed")
    
-   Refund is declined - refund transaction was declined for any reason and its status was changed to **DECLINED**. ("event\_type": "refund::declined")
    

### 

[hashtag](#other)

Other

-   Rollback to account - overpayment amount was transferred to the account. ("event\_type": "rollback::to\_merchant")
    
-   Rollback to client - overpayment amount was transferred to the client. ("event\_type": "rollback::to\_client")
    

### 

[hashtag](#events)

Events

### 

[hashtag](#withdrawal-complete-declined)

Withdrawal Complete/Declined

Event will be triggered when Withdrawal status changes to COMPLETE or DECLINED.

**Request payload**

Complete

Declined

Copy
```
{
    "transaction": {
        "id": "a12bf600-89a6-4538-9a2c-d7bbded51aa6",
        "order_id": null,
        "external_order_id": null,
        "currency": "USDT",
        "visible_ticker": null,
        "value": "16",
        "is_internal": true,
        "type": "WITHDRAWAL",
        "status": "COMPLETE",
        "hash": "91004a73-5860-44ad-9c5b-33416ad3be2f",
        "created_at": "2026-02-26 10:30:28",
        "completed_at": "2026-02-26 10:32:52",
        "fee_amount": "1.6",
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "USDT",
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": "14.4",
        "received_currency": "USDT",
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": "ext_id_26.02",
        "comment": "some comment"
    },
    "event_type": "withdrawal::completed"
}
```

Copy
```
{
    "transaction": {
        "id": "a12a42dd-ad20-400d-829f-3f2634e48f61",
        "order_id": null,
        "external_order_id": null,
        "currency": "USDT",
        "visible_ticker": null,
        "value": "11",
        "is_internal": false,
        "type": "WITHDRAWAL",
        "status": "DECLINED",
        "hash": null,
        "created_at": "2026-02-25 14:13:45",
        "completed_at": null,
        "fee_amount": null,
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": null,
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": "USDT",
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": "external id",
        "comment": "some comment"
    },
    "event_type": "withdrawal::declined"
}
```

### 

[hashtag](#withdrawal-complete-declined-1)

Conversion & withdrawal Complete/Declined

Event will be triggered when Conversion & withdrawal status changes to COMPLETE or DECLINED.

Complete

Declined

Copy
```
{
    "transaction": {
        "id": "a12a6238-cf47-4544-93cf-eb56d10a7946",
        "order_id": null,
        "external_order_id": null,
        "currency": "USDT",
        "visible_ticker": null,
        "value": "7",
        "is_internal": true,
        "type": "CONVERT_WITHDRAWAL",
        "status": "COMPLETE",
        "hash": "5063acdc-129a-464b-b01e-6ea7b90abd47",
        "created_at": "2026-02-25 15:41:25",
        "completed_at": "2026-02-25 15:43:06",
        "fee_amount": "0.0693",
        "merchant_fee_amount": "0.069999",
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "USDT",
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": "41.9621193",
        "received_amount": "41.7621193",
        "received_currency": "XLM",
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "conversion_withdrawal::completed"
}
```

Copy
```
{
    "transaction": {
        "id": "a1080af5-371d-4245-a480-da4659ff143b",
        "order_id": null,
        "external_order_id": null,
        "currency": "USDT",
        "visible_ticker": null,
        "value": "100",
        "is_internal": false,
        "type": "CONVERT_WITHDRAWAL",
        "status": "DECLINED",
        "hash": null,
        "created_at": "2026-02-08 13:59:16",
        "completed_at": null,
        "fee_amount": null,
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": null,
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": "USDT",
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": "convert&withdrawal_08.02",
        "comment": null
    },
    "event_type": "conversion_withdrawal::declined"
}
```

### 

[hashtag](#withdrawal-complete-declined-2)

Refund Complete/Declined

Event will be triggered when Refund status changes to COMPLETE or DECLINED.

Complete

Declined

Copy
```
{
    "transaction": {
        "id": "a0e79927-e9bf-4a6e-97e1-f6709a1ba43d",
        "order_id": "6265daff-2a04-4d54-b925-5aed24f03c90",
        "external_order_id": null,
        "currency": "LTC",
        "visible_ticker": null,
        "value": "0.14346812",
        "is_internal": true,
        "type": "REFUND",
        "status": "COMPLETE",
        "hash": "8a17e8c7-ec6b-43d9-b093-f2185e002c69",
        "created_at": "2026-01-23 10:54:34",
        "completed_at": "2026-01-23 10:54:56",
        "fee_amount": "0.0014491",
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "USDC",
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": null,
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": "external id",
        "comment": null
    },
    "event_type": "refund::completed"
}
```

Copy
```
{
    "transaction": {
        "id": "41497ef8-60a2-43b8-be47-cbd687723e0c",
        "order_id": "e7e95370-277a-48e9-a557-1357b1a6d386",
        "external_order_id": "d67yu8iu",
        "currency": "USDT",
        "value": "",
        "is_internal": false,
        "type": "REFUND",
        "status": "DECLINED",
        "hash": null,
        "created_at": "2025-02-06 10:51:09",
        "completed_at": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "refund::declined"
}
```

### 

[hashtag](#rollback-to-client-account)

Rollback to client/account

Event will be triggered when overpaid invoice amount is transferred to merchant or client.

**Request payload**

To merchant

To client

Copy
```
{
    "transaction": {
        "id": "a0d9d916-7fb6-45c3-a1b1-ea64f0a29048",
        "order_id": "0b9271bd-f8de-4135-b6b4-cc7c34cb37dd",
        "external_order_id": null,
        "currency": "ETH",
        "visible_ticker": null,
        "value": "16.18146865",
        "is_internal": false,
        "type": "ROLLBACK_TO_MERCHANT",
        "status": "COMPLETE",
        "hash": null,
        "created_at": "2026-01-16 14:51:44",
        "completed_at": "2026-01-16 14:51:55",
        "fee_amount": "0.16",
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "USDT",
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [
            {
                "id": "d7dc1b33-5c7f-4bf5-afe3-8d8e072b9b90",
                "amount": "0.00496",
                "result_amount": "16.34146865",
                "status": "CLOSED",
                "pair": "ETH_USDT",
                "currency_from_ticker": "ETH",
                "currency_to_ticker": "USDT",
                "date": "2026-01-16",
                "time": "14:51:46",
                "exchange_rate": "3295.31",
                "created_at": "2026-01-16 14:51:46"
            }
        ],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": null,
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "rollback::to_merchant"
}
```

Copy
```
{
    "transaction": {
        "id": "fd547649-a217-4990-840f-277ff72b472a",
        "order_id": "d869be91-7fa8-4855-acc8-5129052afc82",
        "external_order_id": null,
        "currency": "USDT",
        "visible_ticker": null,
        "value": "3.95",
        "is_internal": true,
        "type": "ROLLBACK_TO_CLIENT",
        "status": "COMPLETE",
        "hash": "5d280be2-9241-4e25-b801-b79d76824bd5",
        "created_at": "2026-01-12 12:19:02",
        "completed_at": "2026-01-12 12:19:33",
        "fee_amount": null,
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": null,
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": null,
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "rollback::to_client"
}
```

* * *

## 

[hashtag](#payment-page-webhook-settings)

Payment page webhook settings

### 

[hashtag](#invoices)

Invoices

-   Invoice is completed - full amount on specified invoice was received and order status was changed to **COMPLETE**. ("event\_type": "order::completed")
    
-   Invoice is declined - invoice wasn’t completed in time and its status was changed to **DECLINED**. ("event\_type": "order::declined")
    
-   Invoice is partially paid - invoice was partially paid and the order changed its status to **PARTIALLY\_FULFILLED**. ("event\_type": "order::partially\_fulfilled")
    
-   Final amount was received - invoice was completed and all exchange operations minus fees have been finished. ("event\_type": "order::final\_amount\_was\_received")
    

### 

[hashtag](#transactions)

Transactions

-   Transaction is completed - deposit transaction was received and its status was changed to **COMPLETE**. ("event\_type": "transaction::completed")
    
-   Transaction is declined - deposit transactions was cancelled for any reason and its status was changed to **DECLINED**. ("event\_type": "transaction::declined")
    
-   Transaction exchange is completed - amount received via transaction was successfully exchanged. ("event\_type": "transaction::was\_final\_exchange")
    
-   Transaction is AML Frozen - the deposit transaction was temporarily blocked due to AML checks and its status was changed to “AML\_FROZEN”. The funds are on hold until the verification is completed. ("event\_type": "transaction::aml\_frozen")
    

### 

[hashtag](#events-1)

Events

### 

[hashtag](#invoice-status-changed)

Invoices events

**Request payload**

Completed

Declined

Partially paid

Final amount received

Copy
```
{
    "order": {
        "id": "2b6c9157-1d6f-47d6-80c8-cf06be9b487b",
        "currency": "EUR",
        "visible_ticker": null,
        "order_number": "177210459199086",
        "value": "20",
        "expected_amount": "23.857808",
        "received_total": "0",
        "is_internal": true,
        "exchange_rate": "0.83829998128914441762",
        "clean_exchange_rate": null,
        "deposited_currency": "USDT",
        "deposited_currency_visible_ticker": null,
        "received_currency": "EUR",
        "received_currency_visible_ticker": null,
        "status": "COMPLETE",
        "external_order_id": null,
        "comment": null,
        "created_at": "2026-02-26 11:16:31",
        "completed_at": "2026-02-26 11:17:06",
        "acquiring_url": "https:\/\/merchant.pay.whitepay.com\/topup-orders\/crypto\/2b6c9157-1d6f-47d6-80c8-cf06be9b487b",
        "fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": "0",
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": "0",
        "fee_currency": "EUR",
        "fee_currency_visible_ticker": null
    },
    "event_type": "order::completed"
}
```

Copy
```
{
    "order": {
        "id": "de04fd29-d264-4965-b277-ccc475141b8a",
        "currency": "USDT",
        "visible_ticker": null,
        "order_number": "177218760342980",
        "value": "111",
        "expected_amount": "111",
        "received_total": "0",
        "is_internal": null,
        "exchange_rate": "1",
        "clean_exchange_rate": "1",
        "deposited_currency": "USDT",
        "deposited_currency_visible_ticker": null,
        "received_currency": "USDT",
        "received_currency_visible_ticker": null,
        "status": "DECLINED",
        "external_order_id": "Additional",
        "comment": "Additional",
        "created_at": "2026-02-27 10:20:03",
        "completed_at": null,
        "acquiring_url": "https:\/\/merchant.pay.whitepay.com\/crypto-orders\/de04fd29-d264-4965-b277-ccc475141b8a",
        "fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "USDT",
        "fee_currency_visible_ticker": null
    },
    "event_type": "order::declined"
}
```

Copy
```
{
    "order": {
        "id": "270c8dab-cc62-4dc8-aeab-a7ba7754d5ae",
        "currency": "UAH",
        "visible_ticker": null,
        "order_number": "177185570378733",
        "value": "1000",
        "expected_amount": "23.38",
        "received_total": "0",
        "is_internal": true,
        "exchange_rate": "42.77159965782720273738",
        "clean_exchange_rate": "0.8478",
        "deposited_currency": "USDC",
        "deposited_currency_visible_ticker": null,
        "received_currency": "EUR",
        "received_currency_visible_ticker": null,
        "status": "PARTIALLY_FULFILLED",
        "external_order_id": null,
        "comment": null,
        "created_at": "2026-02-23 14:08:23",
        "completed_at": null,
        "acquiring_url": "https:\/\/merchant.pay.whitepay.com\/crypto-orders\/270c8dab-cc62-4dc8-aeab-a7ba7754d5ae",
        "fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "EUR",
        "fee_currency_visible_ticker": null
    },
    "event_type": "order::partially_fulfilled"
}
```

Copy
```
{
    "order": {
        "id": "2b6c9157-1d6f-47d6-80c8-cf06be9b487b",
        "currency": "EUR",
        "visible_ticker": null,
        "order_number": "177210459199086",
        "value": "20",
        "expected_amount": "23.857808",
        "received_total": "20.00163559",
        "is_internal": true,
        "exchange_rate": "0.83829998128914441762",
        "clean_exchange_rate": null,
        "deposited_currency": "USDT",
        "deposited_currency_visible_ticker": null,
        "received_currency": "EUR",
        "received_currency_visible_ticker": null,
        "status": "COMPLETE",
        "external_order_id": null,
        "comment": null,
        "created_at": "2026-02-26 11:16:31",
        "completed_at": "2026-02-26 11:17:06",
        "acquiring_url": "https:\/\/merchant.pay.whitepay.com\/topup-orders\/crypto\/2b6c9157-1d6f-47d6-80c8-cf06be9b487b",
        "fee_amount": "0.202037",
        "business_commission_amount": null,
        "business_commission_percentage": "0",
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": "EUR",
        "fee_currency_visible_ticker": null
    },
    "event_type": "order::final_amount_was_received"
}
```

### 

[hashtag](#transactions-events)

Transactions events

**Request payload**

Completed

Declined

AML Frozen

Final amount received

Copy
```
{
    "transaction": {
        "id": "a126351b-bdd0-463d-b12d-b78dc5ac6615",
        "order_id": "036cad37-fd14-4f6f-9b4b-6261f545c760",
        "external_order_id": null,
        "currency": "ETH",
        "visible_ticker": null,
        "value": "0.004",
        "is_internal": false,
        "type": "DEPOSIT",
        "status": "COMPLETE",
        "hash": "0x744dc91c2761bc52096ed94f17c5f4e0a39590472a01074d66f1a261bf350fc1",
        "created_at": "2026-02-23 13:51:58",
        "completed_at": "2026-02-23 14:30:31",
        "fee_amount": null,
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": null,
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": null,
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "transaction::completed"
}
```

Copy
```
{
    "transaction": {
        "id": "a0ab2bbb-969e-4c6b-9f3e-d8ac5a87e006",
        "order_id": "652b5d39-36db-460a-b10b-c4c7ed176642",
        "external_order_id": null,
        "currency": "USDT",
        "visible_ticker": null,
        "value": "10",
        "is_internal": true,
        "type": "DEPOSIT",
        "status": "DECLINED",
        "hash": "768fa885-9061-422a-ab80-c1c088176e1c",
        "created_at": "2025-12-24 09:58:55",
        "completed_at": null,
        "fee_amount": null,
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": null,
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": null,
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "transaction::declined"
}
```

Copy
```
{
    "transaction": {
        "id": "a126351b-bdd0-463d-b12d-b78dc5ac6615",
        "order_id": "036cad37-fd14-4f6f-9b4b-6261f545c760",
        "external_order_id": null,
        "currency": "ETH",
        "visible_ticker": null,
        "value": "0.004",
        "is_internal": false,
        "type": "DEPOSIT",
        "status": "AML_FROZEN",
        "hash": "0x744dc91c2761bc52096ed941b7c5f4e0a39190472a01074d66f1a261bf350fc0",
        "created_at": "2026-02-23 13:51:58",
        "completed_at": null,
        "fee_amount": null,
        "merchant_fee_amount": null,
        "business_commission_amount": null,
        "business_commission_percentage": null,
        "business_spread_commission_amount": null,
        "business_spread_commission_percentage": null,
        "fee_currency": null,
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": null,
        "external_currencies": [],
        "received_total": null,
        "transaction_received_total": null,
        "external_id": null,
        "comment": null
    },
    "event_type": "transaction::aml_frozen"
}
```

Copy
```
{
    "transaction": {
        "id": "a126351b-bdd0-463d-b12d-b78dc5ac6615",
        "order_id": "036cad37-fd14-4f6f-9b4b-6261f545c760",
        "external_order_id": null,
        "currency": "ETH",
        "visible_ticker": null,
        "value": "0.004",
        "is_internal": false,
        "type": "DEPOSIT",
        "status": "COMPLETE",
        "hash": "0x744dc91c1761bc52096ed94fb7c5f4e0a39190472a01074d66f1a261bf350fc0",
        "created_at": "2026-02-23 13:51:58",
        "completed_at": "2026-02-23 14:30:31",
        "fee_amount": "0.129033",
        "merchant_fee_amount": null,
        "business_commission_amount": "0.09677547",
        "business_commission_percentage": "1.5",
        "business_spread_commission_amount": "0.04516188",
        "business_spread_commission_percentage": "0.7",
        "fee_currency": "EUR",
        "fee_currency_visible_ticker": null,
        "is_min_fee_applied": false,
        "decline_reason": null,
        "stock_orders": [
            {
                "id": "2db6b89a-a075-447d-97c3-7fcdad4467cb",
                "amount": "0.004",
                "result_amount": "6.49686036",
                "status": "CLOSED",
                "pair": "ETH_EUR",
                "currency_from_ticker": "ETH",
                "currency_to_ticker": "EUR",
                "date": "2026-02-23",
                "time": "14:30:33",
                "exchange_rate": "1624.54",
                "created_at": "2026-02-23 14:30:33"
            }
        ],
        "received_after_conversion": null,
        "received_amount": null,
        "received_currency": "EUR",
        "external_currencies": [
            {
                "currency": "USD",
                "amount": "7.34"
            },
            {
                "currency": "KZT",
                "amount": "3647.85"
            }
        ],
        "received_total": "6.22589001",
        "transaction_received_total": "6.225890",
        "external_id": null,
        "comment": null
    },
    "event_type": "transaction::was_final_exchange"
}
```

[PreviousAuthorizationchevron-left](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)[NextHTTP APIchevron-right](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

Last updated 11 days ago

---
## HTTP API

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/api-reference/http-api`

copyCopy

# webhookHTTP API

## 

[hashtag](#responses)

Responses

### 

[hashtag](#pagination)

Pagination

Attribute

Type

Description

per\_page

int

current represented page

last\_page

int

last represented page (number of pages)

total

int

total number of entities

### 

[hashtag](#status-sodes)

Status сodes

Code

Name

Description

200

OK

Indicates that the request has succeeded.

401

Unauthorized

Indicates that the request requires user authentication information. The client MAY repeat the request with a suitable Authorization header field.

404

Not Found

The server can not find the requested resource.

422

Unprocessable Entity

The server understands the content type and syntax of the request entity, but still server is unable to process the request for some reason.

500

Internal Server Error

The server encountered an unexpected condition that prevented it from fulfilling the request.

### 

[hashtag](#account-balance)

Account balance

Attribute

Type

Description

id

string

unique key

currency

[objectarrow-up-right](https://docs.whitepay.com/docs/reference/http#currency)

balance currency

* * *

## 

[hashtag](#entities)

Entities

### 

[hashtag](#order)

Order

Attribute

Type

Description

id

string

internal order identifier

currency

string

invoice currency (ticker)

value

string (numeric)

invoice currency amount

deposit\_currency

string

currency of deposit (ticker)

received\_currency

string

balance currency (ticker)

received\_total

string (numeric)

received amount in balance currency

expected\_amount

string (numeric)

expected amount to be deposited

order status

string

order status label

external\_order\_id

string

external order identifier

created\_at

datetime

date of order creation

completed\_at

datetime

date of order completion

acquiring\_url

string

unique payment form url. should be used to redirect website customer to the payment form.

is\_internal

boolean

identifies whether payment was made via WhiteBIT platform or not where true = WhiteBIT platform payment and false = any other platform.

exchange\_rate

string (numeric)

fixated exchange rate of invoice

successful\_link

string

link used to redirect user from payment form after order completion. for crypto acquiring orders only. has to be URL.

failure\_link

string

link used to redirect user from payment form in case of order failure. for crypto acquiring orders only. has to be URL.

order\_number

string

unique 15-digit numeric order identifier in Whitepay CRM system.

### 

[hashtag](#transaction)

Transaction

Attribute

Type

Description

id

string

internal transaction identifier

currency

string

transaction currency

value

string (numeric)

transaction amount

status

string

transaction status

hash

string

transaction hash

is\_internal

boolean

identifies whether payment was made via WhiteBIT platform or not where true = WhiteBIT platform payment and false = any other platform

created\_at

datetime

date of transaction creation

completed\_at

datetime

date of transaction completion

### 

[hashtag](#order-status)

Order status

Attribute

Type

Description

id

string

Internal Whitepay status identifier

label

string

Status label

### 

[hashtag](#invoice-currencies)

Invoice currencies

Attribute

Type

Description

id

string

internal currency identifier

ticker

string

currency ticker

is\_fiat

boolean

a parameter that determines whether the currency is fiat

title

string

currency title

min\_amount

string (numeric)

min currency amount for order creation

max\_amount

string (numeric)

max currency amount for order creation

precision

string (numeric)

currency precision - number of characters after the decimal point

icon

string

currency icon for acquiring form

### 

[hashtag](#currency)

Currency

Attribute

Type

Description

id

string

currency id

ticker

string

currency ticker

title

string

currency title

value

string (numeric)

value in this currency

[PreviousEventschevron-left](/1Q957FgGhSNqAyGWQqz0/webhooks/events)

Last updated 11 days ago

---
## Getting started

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/#quick-start`

copyCopy

# flag-checkeredGetting started

Learn how to get Whitepay set up in your project.

[](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)

**HTTP API**

Learn how to integrate your application using HTTP protocol

[](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)

**Webhooks**

Setting up webhooks and main types of events

[](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

**API Reference**

API entity attributes description and their types

* * *

### 

[hashtag](#quick-start)

Quick start

Learn how to integrate Whitepay products. Here you can explore our guides and examples.

* * *

### 

[hashtag](#getting-help)

Getting help

If you have any problems or questions, feel free to write to **support@whitepay.com** We will answer all your questions as quickly as possible.

#### 

[hashtag](#submit-an-issue)

Submit an issue

In case of any questions or problems with functionality, you can contact us. Our Support Team is ready to help you at any time - write to us on Telegram **@whitepay\_support** or by email .

[NextAuthorizationchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)

Last updated 1 year ago

---
## Getting started

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/introduction`

copyCopy

# flag-checkeredGetting started

Learn how to get Whitepay set up in your project.

[](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)

**HTTP API**

Learn how to integrate your application using HTTP protocol

[](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)

**Webhooks**

Setting up webhooks and main types of events

[](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

**API Reference**

API entity attributes description and their types

* * *

### 

[hashtag](#quick-start)

Quick start

Learn how to integrate Whitepay products. Here you can explore our guides and examples.

* * *

### 

[hashtag](#getting-help)

Getting help

If you have any problems or questions, feel free to write to **support@whitepay.com** We will answer all your questions as quickly as possible.

#### 

[hashtag](#submit-an-issue)

Submit an issue

In case of any questions or problems with functionality, you can contact us. Our Support Team is ready to help you at any time - write to us on Telegram **@whitepay\_support** or by email .

[NextAuthorizationchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)

Last updated 1 year ago

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api`

copyCopy

# webhookAuthorization

### 

[hashtag](#base-url)

Base URL

Copy
```
https://api.whitepay.com
```

### 

[hashtag](#generate-api-token)

Generate API Token

**Whitepay HTTP API** utilizes Bearer Tokens, you can get your API Token on "Settings" -> "Tokens" page in CRM.

### 

[hashtag](#authorizing-request)

Authorizing request

To authorize your request using generated Bearer Token you should pass it to **"Authorization"** header of your Request.

#### 

[hashtag](#request-headers-example)

Request headers example

Copy
```
Accept: application/json
Content-Type: application/json
Authorization: Bearer {Your Token Goes Here}
```

[PreviousGetting startedchevron-left](/1Q957FgGhSNqAyGWQqz0)[NextCrypto acquiringchevron-right](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)

Last updated 1 year ago

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/webhooks`

copyCopy

# webhookAuthorization

## 

[hashtag](#generate-webhook-signature-token)

Generate webhook signature token

**Whitepay Webhooks** utilizes Signature Token for signing Requests which sends to Webhook Targets. Webhooks are divided into general and webhooks related to payment pages. You can get your Signature Token on "Settings"-> "Tokens" page in CRM for general webhook settings or on Payment page settings page for payment page webhook settings.

## 

[hashtag](#general-webhook-settings)

General webhook settings

## 

[hashtag](#payment-page-webhook-settings)

Payment page webhook settings

## 

[hashtag](#signature-validation)

Signature validation

Each webhook request includes **"Signature"** header.

circle-exclamation

**Security tip**

Before process data from Webhook's body, you should validate "Signature" header with locally signed payload.

JavaScript

PHP

Copy
```
const { HmacSHA256 } = require('crypto-js');
const payloadJson = JSON.stringify(payload)
const signature = HmacSHA256(JSON.stringify(req.body).replace(/\//g, “\\/“), secret).toString()
```

Copy
```
$payloadJson = json_encode($payload);
$signature = hash_hmac('sha256', $payloadJson, $secret);
```

`$secret` - Signature key from CRM Settings page

`$payload` - Request body

[PreviousMiscchevron-left](/1Q957FgGhSNqAyGWQqz0/http-api/misc)[NextEventschevron-right](/1Q957FgGhSNqAyGWQqz0/webhooks/events)

Last updated 8 months ago

---
## HTTP API

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/api-reference`

copyCopy

# webhookHTTP API

## 

[hashtag](#responses)

Responses

### 

[hashtag](#pagination)

Pagination

Attribute

Type

Description

per\_page

int

current represented page

last\_page

int

last represented page (number of pages)

total

int

total number of entities

### 

[hashtag](#status-sodes)

Status сodes

Code

Name

Description

200

OK

Indicates that the request has succeeded.

401

Unauthorized

Indicates that the request requires user authentication information. The client MAY repeat the request with a suitable Authorization header field.

404

Not Found

The server can not find the requested resource.

422

Unprocessable Entity

The server understands the content type and syntax of the request entity, but still server is unable to process the request for some reason.

500

Internal Server Error

The server encountered an unexpected condition that prevented it from fulfilling the request.

### 

[hashtag](#account-balance)

Account balance

Attribute

Type

Description

id

string

unique key

currency

[objectarrow-up-right](https://docs.whitepay.com/docs/reference/http#currency)

balance currency

* * *

## 

[hashtag](#entities)

Entities

### 

[hashtag](#order)

Order

Attribute

Type

Description

id

string

internal order identifier

currency

string

invoice currency (ticker)

value

string (numeric)

invoice currency amount

deposit\_currency

string

currency of deposit (ticker)

received\_currency

string

balance currency (ticker)

received\_total

string (numeric)

received amount in balance currency

expected\_amount

string (numeric)

expected amount to be deposited

order status

string

order status label

external\_order\_id

string

external order identifier

created\_at

datetime

date of order creation

completed\_at

datetime

date of order completion

acquiring\_url

string

unique payment form url. should be used to redirect website customer to the payment form.

is\_internal

boolean

identifies whether payment was made via WhiteBIT platform or not where true = WhiteBIT platform payment and false = any other platform.

exchange\_rate

string (numeric)

fixated exchange rate of invoice

successful\_link

string

link used to redirect user from payment form after order completion. for crypto acquiring orders only. has to be URL.

failure\_link

string

link used to redirect user from payment form in case of order failure. for crypto acquiring orders only. has to be URL.

order\_number

string

unique 15-digit numeric order identifier in Whitepay CRM system.

### 

[hashtag](#transaction)

Transaction

Attribute

Type

Description

id

string

internal transaction identifier

currency

string

transaction currency

value

string (numeric)

transaction amount

status

string

transaction status

hash

string

transaction hash

is\_internal

boolean

identifies whether payment was made via WhiteBIT platform or not where true = WhiteBIT platform payment and false = any other platform

created\_at

datetime

date of transaction creation

completed\_at

datetime

date of transaction completion

### 

[hashtag](#order-status)

Order status

Attribute

Type

Description

id

string

Internal Whitepay status identifier

label

string

Status label

### 

[hashtag](#invoice-currencies)

Invoice currencies

Attribute

Type

Description

id

string

internal currency identifier

ticker

string

currency ticker

is\_fiat

boolean

a parameter that determines whether the currency is fiat

title

string

currency title

min\_amount

string (numeric)

min currency amount for order creation

max\_amount

string (numeric)

max currency amount for order creation

precision

string (numeric)

currency precision - number of characters after the decimal point

icon

string

currency icon for acquiring form

### 

[hashtag](#currency)

Currency

Attribute

Type

Description

id

string

currency id

ticker

string

currency ticker

title

string

currency title

value

string (numeric)

value in this currency

[PreviousEventschevron-left](/1Q957FgGhSNqAyGWQqz0/webhooks/events)

Last updated 11 days ago

---
