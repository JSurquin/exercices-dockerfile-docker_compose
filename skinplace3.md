# Skinplace — Documentation complète

> Scrappé le 11/03/2026 depuis https://skinplace.stoplight.io/docs/skinplace
> Source : API Stoplight interne (nodes + data bundlés)

---
## Table des matières

1. [IPN signature](#9bbegvp9w1nxu-ipn-signature) *(article)*
2. [Pay by Steam skins](#7rxey1sx64c04-pay-by-steam-skins) *(article)*
3. [Response codes](#w9es5um6noqyu-response-codes) *(article)*
4. [Websocket-events](#ksghkis7wbdzx-websocket-events) *(article)*
5. [V3](#fpalzr7l4kd46-v3) *(http_service)*
6. [Sell items](#05pvzdnl2ci9z-sell-items) *(http_operation)*
7. [Get payment state](#3iolz5xedy42g-get-payment-state) *(http_operation)*
8. [Get instant history](#qje4jz2ej5j5y-get-instant-history) *(http_operation)*
9. [Sell items](#jpiik7tg71333-sell-items) *(http_operation)*
10. [Purchase an item](#ybtp7vr04x805-purchase-an-item) *(http_operation)*
11. [Get grouped items for purchase](#xpxouj9o78zxs-get-grouped-items-for-purchase) *(http_operation)*
12. [Get purchase history](#l2izzbk6abpia-get-purchase-history) *(http_operation)*
13. [Get purchase buy custom id](#8thynmxb34whm-get-purchase-buy-custom-id) *(http_operation)*
14. [Get websoket auth tokens](#ikn1vhoskwyl0-get-websoket-auth-tokens) *(http_operation)*
15. [Get account balance](#tnayfco2k00ek-get-account-balance) *(http_operation)*
16. [Get balance refills](#vagm47whk2k1i-get-balance-refills) *(http_operation)*
17. [Get list of hold orders](#ifskqjahqv3o7-get-list-of-hold-orders) *(http_operation)*
18. [Get grouped list of hold items](#noy1gyxvj8upk-get-grouped-list-of-hold-items) *(http_operation)*
19. [Get full stock hold items](#t8aifq3b990lt-get-full-stock-hold-items) *(http_operation)*
20. [Steam items listing](#nerky78a1uzxq-steam-items-listing) *(http_operation)*
21. [InventoryItem](#dm9dlbu10xbxg-inventory-item) *(model)*
22. [InstantTrade](#vepcbt8tu33mn-instant-trade) *(model)*
23. [InstantTrade](#n1gx9zlk4annl-instant-trade) *(model)*
24. [InstantBot](#jwr3xuwfc1asl-instant-bot) *(model)*
25. [Payment](#jhhkcsy9tek8k-payment) *(model)*
26. [PurchaseTrade](#785ce9baffb0e-purchase-trade) *(model)*
27. [HoldItemOrder](#8j7piq07qui7n-hold-item-order) *(model)*
28. [ListingSteamItem](#800a1e8b4a2ed-listing-steam-item) *(model)*
29. [ProtectionStatus](#nz34jmzjpjr20-protection-status) *(model)*
30. [ResponseStatus](#la8hbxhk0n3nr-response-status) *(model)*

---

## IPN signature

**URL :** `https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn-signature`

---
stoplight-id: 9bbegvp9w1nxu
---

<h1 style="text-align: center;">IPN</h1>

### IPN signature

**signature** is sha256 hash from concatenated string based on request field **token** and merchant **secret key**. Used for verification incoming request.

```php
$signature = hash('sha256', $token . $secret);

if ($signature !== $_REQUEST['signature']) {
  die('wrong params');
}
```

### IPN request

IPN will be sent for each successful or failed transaction via GET request to url provided by merchant. In the response we are waiting 200 status code and text:

`ok`

otherwise we will retry IPN request by the next schedule:

- after 1 minute
- after 5 minutes
- after 30 minutes

**Warning!** Your servers should be ready to receive duplicate IPN messages and not to add aditional amount to the balance.

**IMPORTANT!** Due to recent steam update ([?](https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD)) we hold the money for 8 days after a successful trade. After this period, the funds will be transferred from the temporary hold balance to the main balance and will be available for withdrawal. After that you will get additional IPN with new "protection_status". 


<h2 style="text-align: center;">Pay by Steam skins</h2>

### IPN example

```
https://example.com/result?
   &type=payment
   &payment_id=1
   &amount=6.66
   &multiplier_amount=6.66
   &multiplier=1
   &order_id=12345
   &currency=USD
   &token=c92c9ee69e1782320c820e570bf59385
   &create_date=2017-06-08+21%3A48%3A02
   &status=complete
   &transaction_id=45f7fa62-622f-48bc-b606-dccd2c662bad
   &ip=0.0.0.0
   &steamid=11112222333444
   &trade_offer_id=123123
   &trade_offer_state=3
   &protection_status=unconfirmed
   &protection_time=2025-12-12 23:59:59
   &protection_causer=buyer
   &signature=8e27a52faba8b7253e94b1c2b0898ff11713c8dd80d60a112922bf66336fd331
```

### IPN params


```json jsonSchema
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "description": "Payment type, in this case it will be constant - 'payment'"
    },
    "type": {
      "type": "number",
      "description": "Payment id"
    },
    "amount": {
      "type": "number",
      "description": "Original amount in payment currency"
    },
    "multiplier_amount": {
      "type": "number",
      "description": "Multiplier amount in USD, depends on merchant settings"
    },
    "multiplier": {
      "type": "number",
      "description": "Amount multiplier (1 by default)"
    },
     "account": {
      "type": "string",
      "description": "User's account identifier in merchant system"
    },
     "order_id": {
      "type": "string",
      "description": "Unique custom order id to identify payment"
    },
    "transaction_id": {
      "type": "string",
      "description": "Unique id of payment transaction"
    },
    "token": {
      "type": "string",
      "description": "Payment token (For a check payment status)"
    },
    "currency": {
      "type": "string",
      "description": "Payment currency. For now only 'USD' is supported"
    },
    "status": {
      "type": "string",
      "enum": ["complete", "cancelled", "active"]
      "description": "Payment status"
    },
    "create_date": {
      "type": "string",
      "description": "IPN creation date"
    },
    "steamid": {
      "type": "string",
      "description": "User's steam ID"
    },
    "trade_offer_id": {
      "type": "string",
      "description": "Trade offer ID"
    },
    "trade_offer_state": {
      "type": "number",
      "description": "Trade offer state"
    },
     "protection_status": {
      "type": "string",
      "enum": ["unconfirmed", "confirmed", "rollback"]
      "description": "Status of trade item protection"
    },
     "protection_time": {
      "type": "string",
      "description": "Trade item protection time. The time when we are ready to make the final trade status and unhold money to balance"
    },
    "protection_causer": {
      "type": "string",
      "enum": ["buyer", "seller"]
      "description": "Causer of rollback"
    },
    "signature": {
      "type": "string",
      "description": "IPN signature, used for protection purposes"
    }
  }
}
```

<h2 style="text-align: center;">Multiple instant IPNs</h2>

## Finish trade

This IPN will be sent each time a payment trade changes its current state.

### IPN example

```
https://example.com/result?
   &type=payment_trade
   &amount=6.66
   &multiplier_amount=6.66
   &multiplier=1
   &create_date=2017-06-08+21%3A48%3A02
   &status=complete
   &transaction_id=45f7fa62-622f-48bc-b606-dccd2c662bad
   &ip=0.0.0.0
   &steamid=11112222333444
   &tradeoffer_id=123123
   &protection_status=unconfirmed
   &protection_time=2025-12-12 23:59:59
   &hash=8e27a52faba8b7253e94b1c2b0898ff11713c8dd80d60a112922bf66336fd331
```

## Finish payment

This IPN will be sent when whole payment is processed.

### IPN example

```
https://example.com/result?
   &type=payment_finish
   &amount=6.66
   &amount_processed=6.66
   &multiplier_amount=6.66
   &multiplier=1
   &create_date=2017-06-08+21%3A48%3A02
   &status=complete
   &transaction_id=45f7fa62-622f-48bc-b606-dccd2c662bad
   &steamid=11112222333444
   &trade_offer_id=123123
   &trade_offer_state=1
   &hash=8e27a52faba8b7253e94b1c2b0898ff11713c8dd80d60a112922bf66336fd331
```

---

## Pay by Steam skins

**URL :** `https://skinplace.stoplight.io/docs/skinplace/7rxey1sx64c04-pay-by-steam-skins`

---
stoplight-id: 7rxey1sx64c04
---

# Pay by Steam skins

Skinplace is a payment system powered by steam trades ([?](https://help.steampowered.com/en/faqs/view/1115-91C5-050C-1D60#whatisoffer)).

<h2 id="transaction_flow" style="text-align: center;">Transaction flow</h2>

1. The user clicks the "Pay by Steam skins" **link**/**button**;
2. The user is redirected to Skinplace payform.
3. The user will need to login via steam ([?](https://steamcommunity.com/)). So his steam inventory can be retrieved. If the user is using Skinplace payfrom for the first time he will need to provide his trade link ([?](https://steamcommunity.com/profiles/76561199274521258/tradeoffers/privacy#trade_offer_access_url)).
4. User selects the skins from his inventory and clicks on "Sell selected skins" button. Our system will create a payment, and then the user will need to confirm the trade on his Steam Guard mobile app and/or Steam website.
5. If the trade is successful, the amount equal to the price of sold items will be transferred to the merchant account on Skinplace. Regardless of trade's state Skinplace will then send an IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) to a webhook on merchant's website, informing if the trade succeeded or failed. It is the merchant's responsibility to validate & handle incoming IPNs and finalize the payment.
6. The merchant can choose to customize the payform (a custom logo, colors);

<h2 id="payform_preview" style="text-align: center;">Payform preview down below</h2>

_**<p style="text-align: center;">Select skins to pay</p>**_

![Screenshot 2023-11-24 at 19.20.41.png](https://stoplight.io/api/v1/projects/cHJqOjIxMjM4OQ/branches/YnI6NTI3NjU2OA/images/%2Fassets%2Fimages%2FScreenshot%202023-11-24%20at%2019.20.41.png)

_**<p style="text-align: center;">Confirm trade</p>**_

![Screenshot 2023-11-24 at 19.19.03.png](https://stoplight.io/api/v1/projects/cHJqOjIxMjM4OQ/branches/YnI6NTI3NjU2OA/images/%2Fassets%2Fimages%2FScreenshot%202023-11-24%20at%2019.19.03.png)

_**<p style="text-align: center;">Notification on success</p>**_

![Screenshot 2023-11-24 at 19.25.22.png](https://stoplight.io/api/v1/projects/cHJqOjIxMjM4OQ/branches/YnI6NTI3NjU2OA/images/%2Fassets%2Fimages%2FScreenshot%202023-11-24%20at%2019.25.22.png)

_**<p style="text-align: center;">Notification on failure</p>**_

![Screenshot 2023-11-24 at 19.20.27.png](https://stoplight.io/api/v1/projects/cHJqOjIxMjM4OQ/branches/YnI6NTI3NjU2OA/images/%2Fassets%2Fimages%2FScreenshot%202023-11-24%20at%2019.20.27.png)

<h2 id="integration_process" style="text-align: center;">Intergration process</h2>

<h3>Integration keys:</h2>

- public_key - is used for payment link generation.
- secret_key - is used for validating incoming [IPN](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn) requests.

<h3 id="integration_process_step1">Step 1:</h2>

User clicks the payment **link**/**button** on the merchant's website.

##### Request url:

```
https://skin.place/payform?token=[merchant_public_key]&account=[internal_user_identifier]&return_url=[link_to_return_on_merchant_website]&template=[custom_merchant_template]&signature=[request_signature]

```

##### Request params:

```json jsonSchema
{
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "description": "Merchant public key"
    },
    "account": {
      "type": "string",
      "description": "User's identifier on merchant's website, provdied to connect payment on SkinPlace with merchant service via IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn))"
    },
    "order_id": {
      "type": "string",
      "description": "Custom merchant order id, provdied to connect payment on SkinPlace with merchant service via IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)). Optional param."
    },
    "return_url": {
      "type": "string",
      "description": "Custom return url where user can be redirected after successful payment"
    },
    "template": {
      "type": "string",
      "description": "Custom merchant template name for payform customization (logo, colors, etc.)"
    },
    "signature": {
      "type": "string",
      "description": "Required if merchant account is configured to work with signature"
    }
  }
}
```

#### Signature:

The signature is a SHA-256 hash generated from request parameters concatenated into a single string, along with the merchant's secret token. Here’s an example of how to generate it:

```php
// Payform request data
$requestData = ['token' => 'token', 'account' => 'account', 'order_id' => 'order_id', 'return_url' => 'return_url', 'template' => 'template'];

// Sort array by keys
ksort($requestData);

// Combine request data string
$paramsString = implode('', $requestData);

// Generate request signature
$signature = hash('sha256', $paramsString . $secret);

```

<h3 id="integration_process_step2">Step 2:</h2>

On every successful or failed payment merchant will recieve IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) notification on merchant result url. After successful processing incoming IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) merchant should transfer funds to user's account.


---

## Response codes

**URL :** `https://skinplace.stoplight.io/docs/skinplace/w9es5um6noqyu-response-codes`

---
stoplight-id: w9es5um6noqyu
---

# Response codes

## Instant

- **parse_inventory** - Failed to load inventory after multiple attempts (usually due to Steam errors).
- **private_inventory** - Inventory is set to private.
- **empty_inventory** - User has an empty inventory.
- **wrong_signature** - Incorrect request signature.
- **tradelink_error** - Invalid Steam trade token.
- **already_exist** - An active payment already exists.
- **operation_locked** - Another payment is right now in progress.
- **offer_expired** - Required items are no longer available.
- **steam_down** - Internal errors with Steam servers.
- **deposit_min** - Item's price is less than the minimum deposit amount.
- **deposit_max** - Item's price exceeds the maximum amount allowed per transaction.
- **disabled** - Instant sell is temporarily disabled.

## Purchase

- **disabled** - Items purchase is temporary disabled due to maintance.
- **not_found** - The item not found.
- **tradelink_error** - User have invalid trade link. (additionally you will get the reason of an error: **escrow**, **private_inventory**)
- **banned** - User is banned in our system.
- **duplicate_custom_id** - The current custom id is already been used.
- **not_enough_balance** - Not enough balance for current purchase.
- **system** - General system error.



---

## Websocket-events

**URL :** `https://skinplace.stoplight.io/docs/skinplace/ksghkis7wbdzx-websocket-events`

---
stoplight-id: ksghkis7wbdzx
---

# Websocket-events

### Create item event

```json
{
    "result": {
        "channel": "offers",
        "data": {
            "data": {
                "offers": [
                    {
                        "id": 192283070,
                        "game": "csgo",
                        "price": 23.22,
                        "steam_market_hash_name": "Desert Eagle | Kumicho Dragon (Well-Worn)",
                        "class_id": "1560745178",
                        "instance_id": "7404830396",
                        "asset_id": "45876995915",
                        "paint_index": 527,
                        "paint_seed": 819,
                        "float": 0.392635,
                        "link": "steam:\/\/rungame\/730\/76561202255233023\/+csgo_econ_action_preview%20S76561199851959675A45876995915D12458084702800996877",
                        "stickers": []
                    }
                ],
                "socket": null,
                "type": "created"
            },
            "offset": 298
        }
    }
}

```

### Update item event

```json

{
    "result": {
        "channel": "offers",
        "data": {
            "data": {
                "offers": [
                    {
                        "id": 192283070,
                        "game": "csgo",
                        "price": 23.22,
                        "steam_market_hash_name": "Desert Eagle | Kumicho Dragon (Well-Worn)",
                        "class_id": "1560745178",
                        "instance_id": "7404830396",
                        "asset_id": "45876995915",
                        "paint_index": 527,
                        "paint_seed": 819,
                        "float": 0.392635,
                        "link": "steam:\/\/rungame\/730\/76561202255233023\/+csgo_econ_action_preview%20S76561199851959675A45876995915D12458084702800996877",
                        "stickers": []
                    }
                ],
                "socket": null,
                "type": "updated"
            },
            "offset": 298
        }
    }
}

```

### Remove item event

```json

{
    "result": {
        "channel": "offers",
        "data": {
            "data": {
                "offers": [
                    192330613
                ],
                "socket": null,
                "type": "deleted"
            },
            "offset": 1
        }
    }
}


```

---

## V3 — Vue d'ensemble API

**URL :** `https://skinplace.stoplight.io/docs/skinplace/fpalzr7l4kd46-v3`

Welcome to the [Skinplace](https://skin.place) API! Use it to trade items for real money!

If you have any questions or suggestions feel free to contact us at: manager@skins.place

**Serveurs :**
- `undefined` — 

---

## `POST /api/v3/instant/inventory` — Sell items

**URL :** `https://skinplace.stoplight.io/docs/skinplace/05pvzdnl2ci9z-sell-items`

On every successful or failed payment merchant will recieve IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) notification on merchant result url. After successful processing incoming IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) merchant should transfer funds to user's account.

**IMPORTANT!** Due to recent steam update ([?](https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD)) we hold the money for 8 days after a successful trade. After this period, the funds will be transferred from the temporary hold balance to the main balance and will be available for withdrawal. After that you will get additional IPN with new "protection_status".

**Authentification** : héritée du service (voir Authorization)

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "signature": {
      "type": "string",
      "description": "Request signature. sha256 hash from concatenation 'steamid' and 'merchant_secret_key'. You can get 'merchant_secret_key' on merchant profile page."
    },
    "public_key": {
      "type": "string",
      "description": "Merchant public key"
    },
    "project": {
      "type": "string",
      "enum": [
        "csgo",
        "rust"
      ],
      "description": "Project name",
      "examples": [
        "csgo"
      ]
    },
    "steamid": {
      "type": "string",
      "description": "User steamid"
    },
    "trade_token": {
      "type": "string",
      "description": "User trade token ([?](https://steamcommunity.com/profiles/76561199274521258/tradeoffers/privacy#trade_offer_access_url))"
    },
    "offers": {
      "type": "array",
      "description": "List of items asset id from instant inventory request",
      "items": {
        "type": "string"
      }
    },
    "ipn_url": {
      "type": "string",
      "description": "If an IPN URL is not provided in the request, the IPN URL from the merchant's profile will be used."
    },
    "order_id": {
      "type": "string",
      "description": "Custom merchant order id, provdied to connect payment on SkinPlace with merchant service via IPN"
    },
    "send_offer_sync": {
      "type": "integer",
      "enum": [
        0,
        1
      ],
      "description": "Indicate whether the trade will be sent in sync or async mode. In sync mode, you will receive the trade offer ID in response. Sync mode by default.",
      "default": 1,
      "examples": [
        1
      ]
    }
  },
  "required": [
    "signature",
    "public_key",
    "project",
    "steamid",
    "trade_token",
    "offers"
  ]
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "examples": [
        "success"
      ]
    },
    "token": {
      "type": "string",
      "description": "Transaction token"
    },
    "inventory": {
      "type": "object",
      "properties": {
        "steam_market_hash_name": {
          "type": "string",
          "description": "Steam market hash name"
        },
        "assetid": {
          "type": "string",
          "description": "Unique item asset id"
        },
        "appid": {
          "type": "integer",
          "description": "Steam project id. 730 - csgo, 252490 - rust"
        },
        "project": {
          "type": "string",
          "description": "Steam project name"
        },
        "skip_reason": {
          "type": "string",
          "enum": [
            "trade_lock",
            "low_price",
            "high_price",
            "system_lock"
          ],
          "description": "Reason of item skip"
        },
        "untouchable": {
          "type": "boolean",
          "description": "Steam untouchable"
        },
        "item_id": {
          "type": "integer",
          "description": "System steam item id"
        },
        "steam_short_name": {
          "type": "string",
          "description": "Steam short name"
        },
        "is_stattrak": {
          "type": "integer",
          "enum": [
            0,
            1
          ],
          "examples": [
            0
          ]
        },
        "rarity": {
          "type": "string",
          "description": "Steam rarity",
          "examples": [
            "Consumer"
          ]
        },
        "rarity_color": {
          "type": "string",
          "description": "Steam rarity color",
          "examples": [
            "b0c3d9"
          ]
        },
        "steam_itemtype": {
          "type": "string",
          "description": "Steam item type",
          "examples": [
            "Pistol"
          ]
        },
        "exterior": {
          "type": "string",
          "description": "Steam exterior",
          "examples": [
            "Field-Tested"
          ]
        },
        "phase": {
          "type": [
            "string",
            "null"
          ],
          "description": "Item phase, for csgo only",
          "examples": [
            "Ruby"
          ]
        },
        "shorten_exterior": {
          "type": "string",
          "enum": [
            "FN",
            "MW",
            "FT",
            "WW",
            "BS"
          ],
          "description": "Short representation of steam item exterior",
          "examples": [
            "FN"
          ]
        },
        "price": {
          "type": "number",
          "description": "Item price with merchant multiplier if exists."
        },
        "price_original": {
          "type": "number",
          "description": "Item price without multiplier"
        },
        "price_real": {
          "type": "number",
          "description": "Item steam price"
        },
        "inspect_url": {
          "type": "string",
          "description": "Inspect in game url"
        },
        "icon_url": {
          "type": "string",
          "description": "Item icon"
        },
        "descriptions": {
          "type": "array",
          "description": "List of steam item descriptions",
          "items": {
            "type": "object",
            "properties": {
              "type": {
                "type": "string",
                "examples": [
                  "html"
                ]
              },
              "value": {
                "type": "string",
                "examples": [
                  "The Bizon SMG is low-damage, but offers a uniquely designed high-capacity drum magazine that reloads quickly. It has been spray-painted using short pieces of tape as stencils."
                ]
              }
            }
          }
        },
        "stickers": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {
                "type": "string"
              },
              "icon_url": {
                "type": "string"
              },
              "price": {
                "type": "number"
              },
              "steam_price": {
                "type": "number"
              },
              "type": {
                "type": "string",
                "enum": [
                  "Sticker",
                  "Charm"
                ]
              }
            },
            "x-examples": {
              "Example 1": {
                "name": "GODSENT | 2020 RMR",
                "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXQ9QVcJY8gulRPQV6CF7b9mMjcVxMidQVTsOj2LVU10arLdz8a6Nnnl9LYzqalMO2BxWoAv5Uli72R8I-gxkS6rGAOjlFD",
                "price": 0.02,
                "steam_price": 0.02,
                "type": "Sticker"
              }
            }
          }
        }
      },
      "x-examples": {
        "Example": {
          "market_name": "PP-Bizon | Sand Dashed (Well-Worn)",
          "market_hash_name": "PP-Bizon | Sand Dashed (Well-Worn)",
          "steam_market_hash_name": "PP-Bizon | Sand Dashed (Well-Worn)",
          "assetid": "29987072005",
          "appid": 730,
          "project": "csgo",
          "skip_reason": null,
          "untouchable": true,
          "item_id": 5535,
          "steam_short_name": "PP-Bizon | Sand Dashed",
          "is_stattrak": 0,
          "rarity": "Consumer",
          "rarity_color": "b0c3d9",
          "steam_itemtype": "SMG",
          "exterior": "Well-Worn",
          "shorten_exterior": "WW",
          "phase": null,
          "price": 0.02,
          "price_original": 0.02,
          "price_real": 0.03,
          "inspect_url": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561199274521258A29987072005D5089074789179053812",
          "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLO_JAlfwOP3ZTxS6eOlnI-Zg8jnMrXVqWZU7Mxkh9bN9J7yjRrm8xI5ajr0IYXGclI3Z16DqVLqlb_t0MPvvc7KzCMyvyUns3ndzkTkn1gSOcRWfgr_",
          "descriptions": [
            {
              "type": "html",
              "value": "Exterior: Well-Worn"
            },
            {
              "type": "html",
              "value": " "
            },
            {
              "type": "html",
              "value": "The Bizon SMG is low-damage, but offers a uniquely designed high-capacity drum magazine that reloads quickly. It has been spray-painted using short pieces of tape as stencils."
            },
            {
              "type": "html",
              "value": " "
            },
            {
              "type": "html",
              "value": "The Italy Collection",
              "color": "9da1a9"
            },
            {
              "type": "html",
              "value": " "
            }
          ]
        }
      }
    },
    "steamtrade": {
      "type": "object",
      "title": "InstantTrade",
      "properties": {
        "trade_offer_id": {
          "type": [
            "string",
            "null"
          ],
          "description": "Steam trade offer id. Can be null in a case if trade has not been created yet."
        },
        "trade_offer_state": {
          "type": [
            "integer",
            "null"
          ],
          "description": "Steam trade offer state. Can be null in a case if trade has not been created yet."
        },
        "price": {
          "type": "number",
          "description": "Price including a custom multiplier, if present in the merchant profile"
        },
        "price_market": {
          "type": "number",
          "description": "The price without multiplier."
        },
        "status": {
          "type": "string",
          "enum": [
            "active",
            "pending",
            "cancelled",
            "finished"
          ],
          "description": "Payment trade status"
        },
        "time_created": {
          "type": "string"
        },
        "bot": {
          "type": [
            "object",
            "null"
          ],
          "title": "InstantBot",
          "properties": {
            "name": {
              "type": "string"
            },
            "avatar": {
              "type": "string"
            },
            "profile_url": {
              "type": "string"
            },
            "level": {
              "type": "string"
            },
            "registration_date": {
              "type": "string"
            },
            "steamid": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "trade_offer_id",
        "trade_offer_state",
        "price",
        "price_market",
        "status"
      ]
    }
  },
  "required": [
    "status",
    "token",
    "inventory"
  ]
}
```

---

## `GET /api/v3/instant/payment/trade/{token}` — Get payment state

**URL :** `https://skinplace.stoplight.io/docs/skinplace/3iolz5xedy42g-get-payment-state`

Get current payment state in single instant trade processing by transaction token

**IMPORTANT!** Due to recent steam update ([?](https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD)) we hold the money for 8 days after a successful trade. After this period, the funds will be transferred from the temporary hold balance to the main balance and will be available for withdrawal. After that you will get additional IPN with new "protection_status".

**Authentification requise** : oui

**Paramètres :**
| Nom | In | Type | Requis | Description |
|-----|----|------|--------|-------------|
| `undefined` | path | ? | non |  |

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string"
    },
    "token": {
      "type": "string",
      "description": "Payment transaction token"
    },
    "steamtrade": {
      "type": "object",
      "title": "InstantTrade",
      "properties": {
        "trade_offer_id": {
          "type": [
            "string",
            "null"
          ],
          "description": "Steam trade offer id. Can be null in a case if trade has not been created yet."
        },
        "trade_offer_state": {
          "type": [
            "integer",
            "null"
          ],
          "description": "Steam trade offer state. Can be null in a case if trade has not been created yet."
        },
        "price": {
          "type": "number",
          "description": "Price including a custom multiplier, if present in the merchant profile"
        },
        "price_market": {
          "type": "number",
          "description": "The price without multiplier."
        },
        "status": {
          "type": "string",
          "enum": [
            "active",
            "pending",
            "cancelled",
            "finished"
          ],
          "description": "Payment trade status"
        },
        "time_created": {
          "type": "string"
        },
        "bot": {
          "type": [
            "object",
            "null"
          ],
          "title": "InstantBot",
          "properties": {
            "name": {
              "type": "string"
            },
            "avatar": {
              "type": "string"
            },
            "profile_url": {
              "type": "string"
            },
            "level": {
              "type": "string"
            },
            "registration_date": {
              "type": "string"
            },
            "steamid": {
              "type": "string"
            }
          }
        }
      },
      "required": [
        "trade_offer_id",
        "trade_offer_state",
        "price",
        "price_market",
        "status"
      ]
    },
    "payment": {
      "type": "object",
      "title": "Payment",
      "properties": {
        "type": {
          "type": "string",
          "description": "Payment type, in this case it will be constant - 'payment'",
          "examples": [
            "payment"
          ]
        },
        "amount": {
          "type": "number",
          "description": "Original amount in payment currency"
        },
        "multiplier_amount": {
          "type": "number",
          "description": "Multiplier amount in USD, depends on merchant settings"
        },
        "multiplier": {
          "type": "number",
          "description": "Amount multiplier (1 by default)"
        },
        "order_id": {
          "type": "string",
          "description": "Unique custom order id to identify payment"
        },
        "token": {
          "type": "string",
          "description": "Transaction token"
        },
        "currency": {
          "type": "string",
          "description": "Payment currency. For now only 'USD' is supported",
          "examples": [
            "USD"
          ]
        },
        "status": {
          "type": "string",
          "enum": [
            "complete",
            "cancelled",
            "active"
          ],
          "description": "Payment status"
        },
        "steamid": {
          "type": "string",
          "description": "User's steam ID"
        },
        "transaction_id": {
          "type": "string",
          "description": "Unique id of transaction"
        },
        "tradeofferid": {
          "type": "string",
          "description": "Trade offer ID"
        },
        "payment_id": {
          "type": "integer",
          "description": "Unique id of payment"
        },
        "protection_status": {
          "type": "string",
          "enum": [
            "unconfirmed",
            "confirmed",
            "rollback"
          ],
          "title": "ProtectionStatus"
        },
        "protection_time": {
          "type": "string",
          "examples": [
            "2025-01-01 23:59:59"
          ]
        }
      }
    }
  },
  "required": [
    "token",
    "steamtrade",
    "payment"
  ]
}
```

---

## `GET /api/v3/instant/history` — Get instant history

**URL :** `https://skinplace.stoplight.io/docs/skinplace/qje4jz2ej5j5y-get-instant-history`

Get history of recent instant deposit in descending order.

**IMPORTANT!** Due to recent steam update ([?](https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD)) we hold the money for 8 days after a successful trade. After this period, the funds will be transferred from the temporary hold balance to the main balance and will be available for withdrawal. After that you will get additional IPN with new "protection_status".

**Authentification** : héritée du service (voir Authorization)

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "tokens": {
      "type": "array"
    },
    "order_ids": {
      "type": "array"
    },
    "limit": {
      "type": "integer"
    },
    "offset": {
      "type": "integer"
    }
  }
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string"
          },
          "steamtrade": {
            "type": "object",
            "title": "InstantTrade",
            "properties": {
              "trade_offer_id": {
                "type": [
                  "string",
                  "null"
                ],
                "description": "Steam trade offer id. Can be null in a case if trade has not been created yet."
              },
              "trade_offer_state": {
                "type": [
                  "integer",
                  "null"
                ],
                "description": "Steam trade offer state. Can be null in a case if trade has not been created yet."
              },
              "price": {
                "type": "number",
                "description": "Price including a custom multiplier, if present in the merchant profile"
              },
              "price_market": {
                "type": "number",
                "description": "The price without multiplier."
              },
              "status": {
                "type": "string",
                "enum": [
                  "active",
                  "pending",
                  "cancelled",
                  "finished"
                ],
                "description": "Payment trade status"
              },
              "time_created": {
                "type": "string"
              },
              "bot": {
                "type": [
                  "object",
                  "null"
                ],
                "title": "InstantBot",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "avatar": {
                    "type": "string"
                  },
                  "profile_url": {
                    "type": "string"
                  },
                  "level": {
                    "type": "string"
                  },
                  "registration_date": {
                    "type": "string"
                  },
                  "steamid": {
                    "type": "string"
                  }
                }
              }
            },
            "required": [
              "trade_offer_id",
              "trade_offer_state",
              "price",
              "price_market",
              "status"
            ]
          },
          "payment": {
            "type": "object",
            "title": "Payment",
            "properties": {
              "type": {
                "type": "string",
                "description": "Payment type, in this case it will be constant - 'payment'",
                "examples": [
                  "payment"
                ]
              },
              "amount": {
                "type": "number",
                "description": "Original amount in payment currency"
              },
              "multiplier_amount": {
                "type": "number",
                "description": "Multiplier amount in USD, depends on merchant settings"
              },
              "multiplier": {
                "type": "number",
                "description": "Amount multiplier (1 by default)"
              },
              "order_id": {
                "type": "string",
                "description": "Unique custom order id to identify payment"
              },
              "token": {
                "type": "string",
                "description": "Transaction token"
              },
              "currency": {
                "type": "string",
                "description": "Payment currency. For now only 'USD' is supported",
                "examples": [
                  "USD"
                ]
              },
              "status": {
                "type": "string",
                "enum": [
                  "complete",
                  "cancelled",
                  "active"
                ],
                "description": "Payment status"
              },
              "steamid": {
                "type": "string",
                "description": "User's steam ID"
              },
              "transaction_id": {
                "type": "string",
                "description": "Unique id of transaction"
              },
              "tradeofferid": {
                "type": "string",
                "description": "Trade offer ID"
              },
              "payment_id": {
                "type": "integer",
                "description": "Unique id of payment"
              },
              "protection_status": {
                "type": "string",
                "enum": [
                  "unconfirmed",
                  "confirmed",
                  "rollback"
                ],
                "title": "ProtectionStatus"
              },
              "protection_time": {
                "type": "string",
                "examples": [
                  "2025-01-01 23:59:59"
                ]
              }
            }
          }
        }
      }
    }
  }
}
```

---

## `POST /api/v3/instant/inventory/multiple` — Sell items

**URL :** `https://skinplace.stoplight.io/docs/skinplace/jpiik7tg71333-sell-items`

The difference in multiple instant that you can recieve in response severtal steam trades. On every successful or failed payment merchant will recieve IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) notification on merchant result url. After successful processing incoming IPN ([?](https://skinplace.stoplight.io/docs/skinplace/9bbegvp9w1nxu-ipn)) merchant should transfer funds to user's account. Multiple instant IPNs section.

**IMPORTANT!** Due to recent steam update ([?](https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD)) we hold the money for 8 days after a successful trade. After this period, the funds will be transferred from the temporary hold balance to the main balance and will be available for withdrawal. After that you will get additional IPN with new "protection_status".

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "signature": {
      "type": "string",
      "description": "Request signature. sha256 hash from concatenation 'steamid' and 'merchant_secret_key'. You can get 'merchant_secret_key' on merchant profile page."
    },
    "project": {
      "type": "string",
      "enum": [
        "csgo",
        "rust"
      ],
      "description": "Project name",
      "examples": [
        "csgo"
      ]
    },
    "steamid": {
      "type": "string",
      "description": "User steamid"
    },
    "trade_token": {
      "type": "string",
      "description": "User trade token ([?](https://steamcommunity.com/profiles/76561199274521258/tradeoffers/privacy#trade_offer_access_url))"
    },
    "offers": {
      "type": "array",
      "description": "List of items asset id from instant inventory request",
      "items": {
        "type": "string"
      }
    },
    "ipn_url": {
      "type": "string",
      "description": "If an IPN URL is not provided in the request, the IPN URL from the merchant's profile will be used."
    },
    "order_id": {
      "type": "string",
      "description": "Custom merchant order id, provdied to connect payment on SkinPlace with merchant service via IPN"
    },
    "send_offer_sync": {
      "type": "integer",
      "enum": [
        0,
        1
      ],
      "description": "Indicate whether the trade will be sent in sync or async mode. In sync mode, you will receive the trade offer ID in response. Sync mode by default.",
      "default": 1,
      "examples": [
        1
      ]
    }
  },
  "required": [
    "signature",
    "project",
    "steamid",
    "trade_token",
    "offers"
  ]
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "examples": [
        "success"
      ]
    },
    "token": {
      "type": "string",
      "description": "Transaction token"
    },
    "amount": {
      "type": "number",
      "description": "Total payment amount"
    },
    "steamtrade": {
      "type": "array",
      "items": {
        "type": "object",
        "title": "InstantTrade",
        "properties": {
          "tradeofferid": {
            "type": [
              "string",
              "null"
            ]
          },
          "token": {
            "type": "string"
          },
          "price": {
            "type": "number"
          },
          "price_market": {
            "type": "number"
          },
          "status": {
            "type": "string",
            "enum": [
              "cancelled",
              "error",
              "active",
              "finished"
            ]
          },
          "bot": {
            "type": [
              "object",
              "null"
            ],
            "title": "InstantBot",
            "properties": {
              "name": {
                "type": "string"
              },
              "avatar": {
                "type": "string"
              },
              "profile_url": {
                "type": "string"
              },
              "level": {
                "type": "string"
              },
              "registration_date": {
                "type": "string"
              },
              "steamid": {
                "type": "string"
              }
            }
          }
        },
        "required": [
          "tradeofferid",
          "price"
        ]
      }
    }
  },
  "required": [
    "status",
    "token",
    "amount"
  ]
}
```

---

## `POST /api/v3/purchase` — Purchase an item

**URL :** `https://skinplace.stoplight.io/docs/skinplace/ybtp7vr04x805-purchase-an-item`

This method is provided to purchase listed item by item **id** or by **steam_market_hash_name**

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "steam_market_hash_name": {
      "type": "string",
      "description": "Required if **id** is missed"
    },
    "steamid": {
      "type": "string",
      "description": "Buyer steamid64"
    },
    "trade_token": {
      "type": "string",
      "description": "Buyer trade token",
      "minLength": 8,
      "maxLength": 8
    },
    "price": {
      "type": "number",
      "description": "Item price"
    },
    "custom_id": {
      "type": "string",
      "description": "Custom order id"
    },
    "game": {
      "type": "string",
      "description": "Required if **id** is missed"
    },
    "phase": {
      "type": "string",
      "description": "In a case of purchase by **steam_market_hash_name** you can additionally provide item **phase**"
    }
  },
  "required": [
    "steam_market_hash_name",
    "steamid",
    "trade_token",
    "price",
    "game",
    "id"
  ],
  "x-examples": {
    "Example 1": {
      "steam_market_hash_name": "P250 | Sand Dune (Well-Worn)",
      "steamid": "76561199274521258",
      "trade_token": "HZCDvbU7",
      "price": 0.06,
      "custom_id": "test_P250",
      "game": "csgo"
    }
  }
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "price": {
          "type": "number"
        },
        "state": {
          "type": "string",
          "enum": [
            "cancelled",
            "finished",
            "active"
          ]
        },
        "steamid": {
          "type": "string"
        },
        "custom_id": {
          "type": "string"
        },
        "game": {
          "type": "string",
          "enum": [
            "csgo",
            "dota2"
          ]
        },
        "steam_market_hash_name": {
          "type": "string"
        },
        "trade": {
          "type": "object",
          "properties": {
            "state": {
              "type": [
                "integer",
                "null"
              ],
              "description": "Steam trade offer state"
            }
          }
        },
        "causer": {
          "type": "string",
          "enum": [
            "buyer",
            "seller",
            null
          ],
          "description": "Entity that caused the trade cancellation",
          "examples": [
            "buyer"
          ]
        },
        "protection_status": {
          "type": "string",
          "enum": [
            "unconfirmed",
            "confirmed",
            "rollback"
          ]
        },
        "protection_time": {
          "type": "string",
          "examples": [
            "2025-01-01 23:59:59"
          ]
        },
        "protection_causer": {
          "type": "string",
          "enum": [
            "buyer",
            "seller",
            null
          ]
        },
        "protection_rollback_amount": {
          "type": [
            "number",
            "null"
          ],
          "description": "Rollback amount in a case of trade was rolled back."
        },
        "time_created": {
          "type": "string",
          "examples": [
            "2025-01-01 23:59:59"
          ]
        },
        "time_finished": {
          "type": [
            "string",
            "null"
          ],
          "examples": [
            "2025-01-01 23:59:59"
          ]
        }
      },
      "x-examples": {
        "Example 1": {
          "price": 0.5,
          "state": "active",
          "steamid": "77777777777777777",
          "custom_id": "custom_id",
          "game": "csgo",
          "steam_market_hash_name": "P250 | Sand Dune (Well-Worn)",
          "trade": {
            "state": 1
          },
          "causer": null,
          "time_created": "2025-01-01 23:59:59",
          "time_finished": null
        }
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    },
    "error_message": {
      "type": "string",
      "enum": [
        "disabled",
        "not_found",
        "tradelink_error",
        "banned",
        "duplicate_custom_id",
        "not_enough_balance",
        "system"
      ]
    }
  },
  "required": [
    "data",
    "status"
  ]
}
```

---

## `GET /api/v3/purchase/items` — Get grouped items for purchase

**URL :** `https://skinplace.stoplight.io/docs/skinplace/xpxouj9o78zxs-get-grouped-items-for-purchase`

Get list of grouped items by **steam_market_hash_name** with minimal price and count.

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "game": {
      "type": "string"
    },
    "search": {
      "type": "string"
    },
    "phases": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "Phase 1",
          "Phase 2",
          "Phase 3",
          "Phase 4",
          "Sapphire",
          "Ruby",
          "Black Pearl",
          "Emerald"
        ]
      }
    },
    "steam_market_hash_name": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "game"
  ]
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "steam_market_hash_name": {
            "type": "string"
          },
          "price": {
            "type": "number"
          },
          "count": {
            "type": "integer"
          },
          "phase": {
            "type": "null"
          }
        }
      }
    },
    "status": {
      "type": "string"
    },
    "error_message": {
      "const": "wrong_params"
    }
  },
  "x-examples": {
    "Example 1": {
      "items": [
        {
          "steam_market_hash_name": "Sticker | IEM | Rio 2022",
          "price": 0.02,
          "count": 1,
          "phase": null
        },
        {
          "steam_market_hash_name": "MAG-7 | Storm (Well-Worn)",
          "price": 14.41,
          "count": 10,
          "phase": null
        }
      ],
      "status": "success"
    }
  }
}
```

---

## `GET /api/v3/purchase/history` — Get purchase history

**URL :** `https://skinplace.stoplight.io/docs/skinplace/l2izzbk6abpia-get-purchase-history`

Get list of purchases

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "custom_id": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "limit": {
      "type": "integer",
      "minimum": 0,
      "maximum": 500
    },
    "offset": {
      "type": "integer",
      "minimum": 0
    },
    "protection_status": {
      "type": "string",
      "enum": [
        "unconfirmed",
        "confirmed",
        "rollback"
      ]
    },
    "time_from": {
      "type": [
        "string",
        "null"
      ],
      "examples": [
        "2025-01-01 23:59:59"
      ]
    },
    "time_to": {
      "type": [
        "string",
        "null"
      ],
      "examples": [
        "2025-01-01 23:59:59"
      ]
    },
    "sort_order": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_key": {
      "type": "string",
      "enum": [
        "id",
        "time_created"
      ]
    }
  }
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "price": {
            "type": "number"
          },
          "state": {
            "type": "string",
            "enum": [
              "cancelled",
              "finished",
              "active"
            ]
          },
          "steamid": {
            "type": "string"
          },
          "custom_id": {
            "type": "string"
          },
          "game": {
            "type": "string",
            "enum": [
              "csgo",
              "dota2"
            ]
          },
          "steam_market_hash_name": {
            "type": "string"
          },
          "trade": {
            "type": "object",
            "properties": {
              "state": {
                "type": [
                  "integer",
                  "null"
                ],
                "description": "Steam trade offer state"
              }
            }
          },
          "causer": {
            "type": "string",
            "enum": [
              "buyer",
              "seller",
              null
            ],
            "description": "Entity that caused the trade cancellation",
            "examples": [
              "buyer"
            ]
          },
          "protection_status": {
            "type": "string",
            "enum": [
              "unconfirmed",
              "confirmed",
              "rollback"
            ]
          },
          "protection_time": {
            "type": "string",
            "examples": [
              "2025-01-01 23:59:59"
            ]
          },
          "protection_causer": {
            "type": "string",
            "enum": [
              "buyer",
              "seller",
              null
            ]
          },
          "protection_rollback_amount": {
            "type": [
              "number",
              "null"
            ],
            "description": "Rollback amount in a case of trade was rolled back."
          },
          "time_created": {
            "type": "string",
            "examples": [
              "2025-01-01 23:59:59"
            ]
          },
          "time_finished": {
            "type": [
              "string",
              "null"
            ],
            "examples": [
              "2025-01-01 23:59:59"
            ]
          }
        },
        "x-examples": {
          "Example 1": {
            "price": 0.5,
            "state": "active",
            "steamid": "77777777777777777",
            "custom_id": "custom_id",
            "game": "csgo",
            "steam_market_hash_name": "P250 | Sand Dune (Well-Worn)",
            "trade": {
              "state": 1
            },
            "causer": null,
            "time_created": "2025-01-01 23:59:59",
            "time_finished": null
          }
        }
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    },
    "error_message": {
      "const": "wrong_params"
    }
  }
}
```

---

## `GET /api/v3/purchase/history/{custom_id}` — Get purchase buy custom id

**URL :** `https://skinplace.stoplight.io/docs/skinplace/8thynmxb34whm-get-purchase-buy-custom-id`

**Authentification requise** : oui

**Paramètres :**
| Nom | In | Type | Requis | Description |
|-----|----|------|--------|-------------|
| `undefined` | path | ? | non |  |

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "price": {
          "type": "number"
        },
        "state": {
          "type": "string",
          "enum": [
            "cancelled",
            "finished",
            "active"
          ]
        },
        "steamid": {
          "type": "string"
        },
        "custom_id": {
          "type": "string"
        },
        "game": {
          "type": "string",
          "enum": [
            "csgo",
            "dota2"
          ]
        },
        "steam_market_hash_name": {
          "type": "string"
        },
        "trade": {
          "type": "object",
          "properties": {
            "state": {
              "type": [
                "integer",
                "null"
              ],
              "description": "Steam trade offer state"
            }
          }
        },
        "causer": {
          "type": "string",
          "enum": [
            "buyer",
            "seller",
            null
          ],
          "description": "Entity that caused the trade cancellation",
          "examples": [
            "buyer"
          ]
        },
        "protection_status": {
          "type": "string",
          "enum": [
            "unconfirmed",
            "confirmed",
            "rollback"
          ]
        },
        "protection_time": {
          "type": "string",
          "examples": [
            "2025-01-01 23:59:59"
          ]
        },
        "protection_causer": {
          "type": "string",
          "enum": [
            "buyer",
            "seller",
            null
          ]
        },
        "protection_rollback_amount": {
          "type": [
            "number",
            "null"
          ],
          "description": "Rollback amount in a case of trade was rolled back."
        },
        "time_created": {
          "type": "string",
          "examples": [
            "2025-01-01 23:59:59"
          ]
        },
        "time_finished": {
          "type": [
            "string",
            "null"
          ],
          "examples": [
            "2025-01-01 23:59:59"
          ]
        }
      },
      "x-examples": {
        "Example 1": {
          "price": 0.5,
          "state": "active",
          "steamid": "77777777777777777",
          "custom_id": "custom_id",
          "game": "csgo",
          "steam_market_hash_name": "P250 | Sand Dune (Well-Worn)",
          "trade": {
            "state": 1
          },
          "causer": null,
          "time_created": "2025-01-01 23:59:59",
          "time_finished": null
        }
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    },
    "error_message": {
      "const": "wrong_params"
    }
  }
}
```

---

## `GET /api/v3/purchase/websocket` — Get websoket auth tokens

**URL :** `https://skinplace.stoplight.io/docs/skinplace/ikn1vhoskwyl0-get-websoket-auth-tokens`

Get list of websocket tokens. Use this data to auth to channel.

```json
{"params":{"token":"your_auth_access_token"},"id":1}
```

**Authentification requise** : oui

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "tokens": {
          "type": "object",
          "properties": {
            "items": {
              "type": "string",
              "description": "Token for items updates"
            }
          }
        },
        "url": {
          "type": "string",
          "description": "Websocket connection url"
        }
      }
    },
    "status": {
      "type": "string"
    }
  },
  "x-examples": {
    "Example 1": {
      "data": {
        "tokens": {
          "items": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMiIsImNoYW5uZWxzIjpbIm9mZmVycyMyMiIsIm9mZmVycyJdfQ.L-2hUUOqtFxTX47fxC7ajE8sbgNmMp6-ubz9Kf0Mxyo"
        },
        "url": "wss://ws.skin.place/connection/websocket"
      },
      "status": "success"
    }
  }
}
```

---

## `GET /api/v3/balance` — Get account balance

**URL :** `https://skinplace.stoplight.io/docs/skinplace/tnayfco2k00ek-get-account-balance`

Get merchant account balance: deposit and total amount. The total amount can be used for purchases, while the deposit amount is locked for withdrawal.

**Authentification requise** : oui

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "total": {
          "type": "number",
          "description": "Total account balance including deposit amount"
        },
        "deposit": {
          "type": "number",
          "description": "Deposit amount. Cannot be withdrawn."
        },
        "hold": {
          "type": "number",
          "description": "Balance for the trade with hold protection"
        }
      },
      "required": [
        "total",
        "deposit",
        "hold"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    }
  },
  "x-examples": {
    "Example 1": {
      "data": {
        "total": 1999.6,
        "deposit": 1000
      },
      "status": "success"
    }
  }
}
```

---

## `GET /api/v3/balance/refills` — Get balance refills

**URL :** `https://skinplace.stoplight.io/docs/skinplace/vagm47whk2k1i-get-balance-refills`

Get list of recent refills in descending order.

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "time_from": {
      "type": "string",
      "examples": [
        "2025-01-01"
      ]
    },
    "time_to": {
      "type": "string",
      "examples": [
        "2025-01-02"
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
    },
    "offset": {
      "type": "integer",
      "minimum": 0
    }
  }
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "amount": {
            "type": "number"
          },
          "time_created": {
            "type": "string"
          }
        }
      }
    },
    "status": {
      "type": "string"
    }
  },
  "x-examples": {
    "Example 1": {
      "data": [
        {
          "type": "USDTT",
          "amount": 199,
          "time_created": "2025-02-02 01:01:01"
        },
        {
          "type": "USDTT",
          "amount": 23.55,
          "time_created": "2025-02-02 02:02:02"
        }
      ],
      "status": "success"
    }
  }
}
```

---

## `GET /api/v3/hold/orders` — Get list of hold orders

**URL :** `https://skinplace.stoplight.io/docs/skinplace/ifskqjahqv3o7-get-list-of-hold-orders`

Get list of orders. To withdraw an order you are need to pass order **id** in withdraw method when **time_unhold** has passed.

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "steamid": {
      "type": "string"
    },
    "state": {
      "type": "string",
      "enum": [
        "active",
        "pending",
        "cancelled",
        "finished"
      ]
    },
    "time_unhold_from": {
      "type": "string",
      "examples": [
        "2025-12-12 23:59:59"
      ]
    },
    "time_unhold_to": {
      "type": "string",
      "examples": [
        "2025-12-12 23:59:59"
      ]
    },
    "time_created_from": {
      "type": "string",
      "examples": [
        "2025-12-12 23:59:59"
      ]
    },
    "time_created_to": {
      "type": "string",
      "examples": [
        "2025-12-12 23:59:59"
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "offset": {
      "type": "integer",
      "minimum": 0
    },
    "sort_order": {
      "type": "string",
      "enum": [
        "ASC",
        "DESC"
      ]
    },
    "sort_key": {
      "type": "string",
      "enum": [
        "price",
        "time_created",
        "time_unhold"
      ]
    },
    "custom_id": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "title": "HoldItemOrder",
        "properties": {
          "steamid": {
            "type": "string"
          },
          "state": {
            "type": "string",
            "enum": [
              "active",
              "pending",
              "finished",
              "cancelled"
            ]
          },
          "time_created": {
            "type": "string",
            "examples": [
              "2025-12-12 23:59:59"
            ]
          },
          "time_unhold": {
            "type": "string",
            "examples": [
              "2025-12-12 23:59:59"
            ]
          },
          "custom_id": {
            "type": [
              "string",
              "null"
            ]
          },
          "item": {
            "type": "object",
            "title": "PurchaseHoldItem",
            "properties": {
              "game": {
                "type": "string",
                "enum": [
                  "csgo",
                  "dota2",
                  "rust"
                ]
              },
              "price": {
                "type": "number"
              },
              "steam_market_hash_name": {
                "type": "string"
              },
              "phase": {
                "type": "string",
                "enum": [
                  "Phase 1",
                  "Phase 2",
                  "Phase 3",
                  "Phase 4",
                  "Sapphire",
                  "Ruby",
                  "Black Pearl",
                  "Emerald"
                ]
              },
              "class_id": {
                "type": "string"
              },
              "instance_id": {
                "type": "string"
              },
              "asset_id": {
                "type": "string"
              },
              "paint_index": {
                "type": "number"
              },
              "paint_seed": {
                "type": "number"
              },
              "float": {
                "type": "number"
              },
              "stickers": {
                "type": "array",
                "items": {
                  "type": "string",
                  "examples": [
                    "Sticker | Rush 4x20 (Holo)"
                  ]
                }
              },
              "time_unhold": {
                "type": "string",
                "description": "Item unhold time"
              }
            },
            "x-examples": {
              "Example 1": {
                "game": "csgo",
                "price": 0.45,
                "steam_market_hash_name": "MAG-7 | Storm (Well-Worn)",
                "phase": null,
                "class_id": "519987180",
                "instance_id": "519977179",
                "asset_id": "41165110534",
                "paint_index": 785,
                "paint_seed": 493,
                "float": 0.204017,
                "stickers": [
                  "Sticker | Rush 4x20 (Holo)"
                ],
                "time_unhold": "2025-12-12 23:59:59"
              }
            }
          }
        }
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    }
  }
}
```

---

## `GET /api/v3/hold/grouped` — Get grouped list of hold items

**URL :** `https://skinplace.stoplight.io/docs/skinplace/noy1gyxvj8upk-get-grouped-list-of-hold-items`

Get list of hold items grouped by market hash name and phase.

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "game": {
      "type": "string",
      "enum": [
        "csgo",
        "rust",
        "dota2"
      ],
      "title": "Game"
    },
    "steam_market_hash_name": {
      "type": "array"
    },
    "phases": {
      "type": "array"
    }
  }
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "steam_market_hash_name": {
            "type": "string"
          },
          "price": {
            "type": "number"
          },
          "count": {
            "type": "integer"
          },
          "phase": {
            "type": "string",
            "enum": [
              "Phase 1",
              "Phase 2",
              "Phase 3",
              "Phase 4",
              "Sapphire",
              "Ruby",
              "Black Pearl",
              "Emerald"
            ],
            "title": "Phase",
            "description": "Item phase"
          }
        }
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ],
      "title": "ResponseStatus"
    }
  }
}
```

---

## `GET /api/v3/hold/full` — Get full stock hold items

**URL :** `https://skinplace.stoplight.io/docs/skinplace/t8aifq3b990lt-get-full-stock-hold-items`

Get entire list of hold items on sale with all additional data. (Long response time)

**Authentification** : héritée du service (voir Authorization)

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "timde": {
      "type": "integer"
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "game": {
            "type": "string",
            "enum": [
              "csgo",
              "dota2",
              "rust"
            ]
          },
          "price": {
            "type": "number"
          },
          "steam_market_hash_name": {
            "type": "string"
          },
          "phase": {
            "type": "string",
            "enum": [
              "Phase 1",
              "Phase 2",
              "Phase 3",
              "Phase 4",
              "Sapphire",
              "Ruby",
              "Black Pearl",
              "Emerald"
            ]
          },
          "class_id": {
            "type": "string"
          },
          "instance_id": {
            "type": "string"
          },
          "asset_id": {
            "type": "string"
          },
          "paint_index": {
            "type": "number"
          },
          "paint_seed": {
            "type": "number"
          },
          "float": {
            "type": "number"
          },
          "url_name": {
            "type": "string"
          },
          "url_inspect": {
            "type": [
              "string",
              "null"
            ]
          },
          "exterior": {
            "type": "string"
          },
          "stickers": {
            "type": "array",
            "items": {
              "type": "string",
              "examples": [
                "Sticker | Rush 4x20 (Holo)"
              ]
            }
          }
        },
        "x-examples": {
          "Example 1": {
            "game": "csgo",
            "price": 0.45,
            "steam_market_hash_name": "MAG-7 | Storm (Well-Worn)",
            "phase": null,
            "class_id": "519987180",
            "instance_id": "519977179",
            "asset_id": "41165110534",
            "paint_index": 785,
            "paint_seed": 493,
            "float": 0.204017,
            "url_name": "mag-7-storm",
            "exterior": "Well-Worn",
            "stickers": [
              "Sticker | Rush 4x20 (Holo)"
            ]
          }
        }
      }
    }
  }
}
```

---

## `GET /api/v3/items/listing` — Steam items listing

**URL :** `https://skinplace.stoplight.io/docs/skinplace/nerky78a1uzxq-steam-items-listing`

**Authentification requise** : oui

**Request body :**
*Content-Type: application/json*
```json
{
  "type": "object",
  "properties": {
    "game": {
      "type": "string",
      "enum": [
        "csgo",
        "rust",
        "dota2"
      ],
      "title": "Game"
    },
    "search": {
      "type": "string"
    },
    "phase": {
      "type": "string",
      "enum": [
        "Phase 1",
        "Phase 2",
        "Phase 3",
        "Phase 4",
        "Sapphire",
        "Ruby",
        "Black Pearl",
        "Emerald"
      ],
      "title": "Phase",
      "description": "Item phase"
    },
    "limit": {
      "type": "number"
    },
    "offset": {
      "type": "number"
    }
  },
  "required": [
    "game"
  ]
}
```

**Réponses :**

**200** OK
*application/json*
```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "game": {
            "type": "string",
            "enum": [
              "csgo",
              "dota2",
              "rust"
            ]
          },
          "steam_market_hash_name": {
            "type": "string"
          },
          "exterior": {
            "type": "string"
          },
          "rarity": {
            "type": "string"
          },
          "rarity_color": {
            "type": "string"
          },
          "item_type": {
            "type": "string"
          },
          "phase": {
            "type": "string",
            "enum": [
              "Phase 1",
              "Phase 2",
              "Phase 3",
              "Phase 4",
              "Sapphire",
              "Ruby",
              "Black Pearl",
              "Emerald"
            ],
            "title": "Phase",
            "description": "Item phase"
          },
          "item_url": {
            "type": "string"
          },
          "icon_url": {
            "type": "string"
          },
          "descriptions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "color": {
                  "type": [
                    "string",
                    "null"
                  ]
                },
                "value": {
                  "type": "string"
                },
                "appData": {
                  "type": "null"
                }
              }
            }
          }
        },
        "x-examples": {
          "Example 1": {
            "game": "csgo",
            "steam_market_hash_name": "★ Gut Knife | Doppler (Factory New)",
            "exterior": "Factory New",
            "rarity": "Covert",
            "rarity_color": "eb4b4b",
            "item_type": "Knife",
            "phase": "Ruby",
            "item_url": "https://skin.place/buy-cs2-skins/gut-knife-doppler-ruby?exterior=Factory+New&is_stattrak=0&is_souvenir=0",
            "icon_url": "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1ObcTjxP086jlpm0mvbmMbfUn3FU7Pp9g-7J4cL32AWy-kRtZjrxcYHHJlBqYFnR_Va4xervjJe-6MjLmCdjvnV35XvbgVXp1pNfnFsg",
            "descriptions": [
              {
                "type": "html",
                "color": null,
                "value": "Exterior: Factory New",
                "appData": null
              },
              {
                "type": "html",
                "color": null,
                "value": " ",
                "appData": null
              },
              {
                "type": "html",
                "color": null,
                "value": "The most notable feature of a gut knife is the gut hook on the spine of the blade.  Originally popularized as an aid for field dressing game, the gut hook is also effective at  cutting through fibrous materials like rope, webbing, or safety belts with ease. It has been painted with black and silver metallic paints using a marbleizing medium, then candy coated.\n\n<i>Getting lost in its color can prove fatal</i>",
                "appData": null
              },
              {
                "type": "html",
                "color": null,
                "value": " ",
                "appData": null
              }
            ]
          }
        }
      }
    },
    "status": {
      "type": "string",
      "enum": [
        "success",
        "error"
      ]
    }
  }
}
```

---

## Schema : `InventoryItem`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/dm9dlbu10xbxg-inventory-item`

```json
{
  "type": "object",
  "properties": {
    "steam_market_hash_name": {
      "type": "string",
      "description": "Steam market hash name"
    },
    "assetid": {
      "type": "string",
      "description": "Unique item asset id"
    },
    "appid": {
      "type": "integer",
      "description": "Steam project id. 730 - csgo, 252490 - rust"
    },
    "project": {
      "type": "string",
      "description": "Steam project name"
    },
    "skip_reason": {
      "type": "string",
      "enum": [
        "trade_lock",
        "low_price",
        "high_price",
        "system_lock"
      ],
      "description": "Reason of item skip"
    },
    "untouchable": {
      "type": "boolean",
      "description": "Steam untouchable"
    },
    "item_id": {
      "type": "integer",
      "description": "System steam item id"
    },
    "steam_short_name": {
      "type": "string",
      "description": "Steam short name"
    },
    "is_stattrak": {
      "type": "integer",
      "enum": [
        0,
        1
      ],
      "examples": [
        0
      ]
    },
    "rarity": {
      "type": "string",
      "description": "Steam rarity",
      "examples": [
        "Consumer"
      ]
    },
    "rarity_color": {
      "type": "string",
      "description": "Steam rarity color",
      "examples": [
        "b0c3d9"
      ]
    },
    "steam_itemtype": {
      "type": "string",
      "description": "Steam item type",
      "examples": [
        "Pistol"
      ]
    },
    "exterior": {
      "type": "string",
      "description": "Steam exterior",
      "examples": [
        "Field-Tested"
      ]
    },
    "phase": {
      "type": [
        "string",
        "null"
      ],
      "description": "Item phase, for csgo only",
      "examples": [
        "Ruby"
      ]
    },
    "shorten_exterior": {
      "type": "string",
      "enum": [
        "FN",
        "MW",
        "FT",
        "WW",
        "BS"
      ],
      "description": "Short representation of steam item exterior",
      "examples": [
        "FN"
      ]
    },
    "price": {
      "type": "number",
      "description": "Item price with merchant multiplier if exists."
    },
    "price_original": {
      "type": "number",
      "description": "Item price without multiplier"
    },
    "price_real": {
      "type": "number",
      "description": "Item steam price"
    },
    "inspect_url": {
      "type": "string",
      "description": "Inspect in game url"
    },
    "icon_url": {
      "type": "string",
      "description": "Item icon"
    },
    "descriptions": {
      "type": "array",
      "description": "List of steam item descriptions",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "examples": [
              "html"
            ]
          },
          "value": {
            "type": "string",
            "examples": [
              "The Bizon SMG is low-damage, but offers a uniquely designed high-capacity drum magazine that reloads quickly. It has been spray-painted using short pieces of tape as stencils."
            ]
          }
        }
      }
    },
    "stickers": {
      "type": "array",
      "items": {
        "$ref": "#/%24defs/ItemSticker"
      }
    }
  },
  "x-examples": {
    "Example": {
      "market_name": "PP-Bizon | Sand Dashed (Well-Worn)",
      "market_hash_name": "PP-Bizon | Sand Dashed (Well-Worn)",
      "steam_market_hash_name": "PP-Bizon | Sand Dashed (Well-Worn)",
      "assetid": "29987072005",
      "appid": 730,
      "project": "csgo",
      "skip_reason": null,
      "untouchable": true,
      "item_id": 5535,
      "steam_short_name": "PP-Bizon | Sand Dashed",
      "is_stattrak": 0,
      "rarity": "Consumer",
      "rarity_color": "b0c3d9",
      "steam_itemtype": "SMG",
      "exterior": "Well-Worn",
      "shorten_exterior": "WW",
      "phase": null,
      "price": 0.02,
      "price_original": 0.02,
      "price_real": 0.03,
      "inspect_url": "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561199274521258A29987072005D5089074789179053812",
      "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLO_JAlfwOP3ZTxS6eOlnI-Zg8jnMrXVqWZU7Mxkh9bN9J7yjRrm8xI5ajr0IYXGclI3Z16DqVLqlb_t0MPvvc7KzCMyvyUns3ndzkTkn1gSOcRWfgr_",
      "descriptions": [
        {
          "type": "html",
          "value": "Exterior: Well-Worn"
        },
        {
          "type": "html",
          "value": " "
        },
        {
          "type": "html",
          "value": "The Bizon SMG is low-damage, but offers a uniquely designed high-capacity drum magazine that reloads quickly. It has been spray-painted using short pieces of tape as stencils."
        },
        {
          "type": "html",
          "value": " "
        },
        {
          "type": "html",
          "value": "The Italy Collection",
          "color": "9da1a9"
        },
        {
          "type": "html",
          "value": " "
        }
      ]
    }
  },
  "$defs": {
    "ItemSticker": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "icon_url": {
          "type": "string"
        },
        "price": {
          "type": "number"
        },
        "steam_price": {
          "type": "number"
        },
        "type": {
          "type": "string",
          "enum": [
            "Sticker",
            "Charm"
          ]
        }
      },
      "x-examples": {
        "Example 1": {
          "name": "GODSENT | 2020 RMR",
          "icon_url": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXQ9QVcJY8gulRPQV6CF7b9mMjcVxMidQVTsOj2LVU10arLdz8a6Nnnl9LYzqalMO2BxWoAv5Uli72R8I-gxkS6rGAOjlFD",
          "price": 0.02,
          "steam_price": 0.02,
          "type": "Sticker"
        }
      }
    }
  }
}
```

---

## Schema : `InstantTrade`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/vepcbt8tu33mn-instant-trade`

```json
{
  "type": "object",
  "title": "InstantTrade",
  "properties": {
    "trade_offer_id": {
      "type": [
        "string",
        "null"
      ],
      "description": "Steam trade offer id. Can be null in a case if trade has not been created yet."
    },
    "trade_offer_state": {
      "type": [
        "integer",
        "null"
      ],
      "description": "Steam trade offer state. Can be null in a case if trade has not been created yet."
    },
    "price": {
      "type": "number",
      "description": "Price including a custom multiplier, if present in the merchant profile"
    },
    "price_market": {
      "type": "number",
      "description": "The price without multiplier."
    },
    "status": {
      "type": "string",
      "enum": [
        "active",
        "pending",
        "cancelled",
        "finished"
      ],
      "description": "Payment trade status"
    },
    "time_created": {
      "type": "string"
    },
    "bot": {
      "$ref": "#/%24defs/InstantBot"
    }
  },
  "required": [
    "trade_offer_id",
    "trade_offer_state",
    "price",
    "price_market",
    "status"
  ],
  "$defs": {
    "InstantBot": {
      "type": [
        "object",
        "null"
      ],
      "title": "InstantBot",
      "properties": {
        "name": {
          "type": "string"
        },
        "avatar": {
          "type": "string"
        },
        "profile_url": {
          "type": "string"
        },
        "level": {
          "type": "string"
        },
        "registration_date": {
          "type": "string"
        },
        "steamid": {
          "type": "string"
        }
      }
    }
  }
}
```

---

## Schema : `InstantTrade`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/n1gx9zlk4annl-instant-trade`

```json
{
  "type": "object",
  "title": "InstantTrade",
  "properties": {
    "tradeofferid": {
      "type": [
        "string",
        "null"
      ]
    },
    "token": {
      "type": "string"
    },
    "price": {
      "type": "number"
    },
    "price_market": {
      "type": "number"
    },
    "status": {
      "type": "string",
      "enum": [
        "cancelled",
        "error",
        "active",
        "finished"
      ]
    },
    "bot": {
      "$ref": "#/%24defs/InstantBot"
    }
  },
  "required": [
    "tradeofferid",
    "price"
  ],
  "$defs": {
    "InstantBot": {
      "type": [
        "object",
        "null"
      ],
      "title": "InstantBot",
      "properties": {
        "name": {
          "type": "string"
        },
        "avatar": {
          "type": "string"
        },
        "profile_url": {
          "type": "string"
        },
        "level": {
          "type": "string"
        },
        "registration_date": {
          "type": "string"
        },
        "steamid": {
          "type": "string"
        }
      }
    }
  }
}
```

---

## Schema : `InstantBot`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/jwr3xuwfc1asl-instant-bot`

```json
{
  "type": [
    "object",
    "null"
  ],
  "title": "InstantBot",
  "properties": {
    "name": {
      "type": "string"
    },
    "avatar": {
      "type": "string"
    },
    "profile_url": {
      "type": "string"
    },
    "level": {
      "type": "string"
    },
    "registration_date": {
      "type": "string"
    },
    "steamid": {
      "type": "string"
    }
  }
}
```

---

## Schema : `Payment`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/jhhkcsy9tek8k-payment`

```json
{
  "type": "object",
  "title": "Payment",
  "properties": {
    "type": {
      "type": "string",
      "description": "Payment type, in this case it will be constant - 'payment'",
      "examples": [
        "payment"
      ]
    },
    "amount": {
      "type": "number",
      "description": "Original amount in payment currency"
    },
    "multiplier_amount": {
      "type": "number",
      "description": "Multiplier amount in USD, depends on merchant settings"
    },
    "multiplier": {
      "type": "number",
      "description": "Amount multiplier (1 by default)"
    },
    "order_id": {
      "type": "string",
      "description": "Unique custom order id to identify payment"
    },
    "token": {
      "type": "string",
      "description": "Transaction token"
    },
    "currency": {
      "type": "string",
      "description": "Payment currency. For now only 'USD' is supported",
      "examples": [
        "USD"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "complete",
        "cancelled",
        "active"
      ],
      "description": "Payment status"
    },
    "steamid": {
      "type": "string",
      "description": "User's steam ID"
    },
    "transaction_id": {
      "type": "string",
      "description": "Unique id of transaction"
    },
    "tradeofferid": {
      "type": "string",
      "description": "Trade offer ID"
    },
    "payment_id": {
      "type": "integer",
      "description": "Unique id of payment"
    },
    "protection_status": {
      "$ref": "#/%24defs/ProtectionStatus"
    },
    "protection_time": {
      "type": "string",
      "examples": [
        "2025-01-01 23:59:59"
      ]
    }
  },
  "$defs": {
    "ProtectionStatus": {
      "type": "string",
      "enum": [
        "unconfirmed",
        "confirmed",
        "rollback"
      ],
      "title": "ProtectionStatus"
    }
  }
}
```

---

## Schema : `PurchaseTrade`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/785ce9baffb0e-purchase-trade`

```json
{
  "type": "object",
  "properties": {
    "price": {
      "type": "number"
    },
    "state": {
      "type": "string",
      "enum": [
        "cancelled",
        "finished",
        "active"
      ]
    },
    "steamid": {
      "type": "string"
    },
    "custom_id": {
      "type": "string"
    },
    "game": {
      "type": "string",
      "enum": [
        "csgo",
        "dota2"
      ]
    },
    "steam_market_hash_name": {
      "type": "string"
    },
    "trade": {
      "type": "object",
      "properties": {
        "state": {
          "type": [
            "integer",
            "null"
          ],
          "description": "Steam trade offer state"
        }
      }
    },
    "causer": {
      "type": "string",
      "enum": [
        "buyer",
        "seller",
        null
      ],
      "description": "Entity that caused the trade cancellation",
      "examples": [
        "buyer"
      ]
    },
    "protection_status": {
      "type": "string",
      "enum": [
        "unconfirmed",
        "confirmed",
        "rollback"
      ]
    },
    "protection_time": {
      "type": "string",
      "examples": [
        "2025-01-01 23:59:59"
      ]
    },
    "protection_causer": {
      "type": "string",
      "enum": [
        "buyer",
        "seller",
        null
      ]
    },
    "protection_rollback_amount": {
      "type": [
        "number",
        "null"
      ],
      "description": "Rollback amount in a case of trade was rolled back."
    },
    "time_created": {
      "type": "string",
      "examples": [
        "2025-01-01 23:59:59"
      ]
    },
    "time_finished": {
      "type": [
        "string",
        "null"
      ],
      "examples": [
        "2025-01-01 23:59:59"
      ]
    }
  },
  "x-examples": {
    "Example 1": {
      "price": 0.5,
      "state": "active",
      "steamid": "77777777777777777",
      "custom_id": "custom_id",
      "game": "csgo",
      "steam_market_hash_name": "P250 | Sand Dune (Well-Worn)",
      "trade": {
        "state": 1
      },
      "causer": null,
      "time_created": "2025-01-01 23:59:59",
      "time_finished": null
    }
  }
}
```

---

## Schema : `HoldItemOrder`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/8j7piq07qui7n-hold-item-order`

```json
{
  "type": "object",
  "title": "HoldItemOrder",
  "properties": {
    "steamid": {
      "type": "string"
    },
    "state": {
      "type": "string",
      "enum": [
        "active",
        "pending",
        "finished",
        "cancelled"
      ]
    },
    "time_created": {
      "type": "string",
      "examples": [
        "2025-12-12 23:59:59"
      ]
    },
    "time_unhold": {
      "type": "string",
      "examples": [
        "2025-12-12 23:59:59"
      ]
    },
    "custom_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "item": {
      "$ref": "#/%24defs/PurchaseHoldItem"
    }
  },
  "$defs": {
    "PurchaseHoldItem": {
      "type": "object",
      "title": "PurchaseHoldItem",
      "properties": {
        "game": {
          "type": "string",
          "enum": [
            "csgo",
            "dota2",
            "rust"
          ]
        },
        "price": {
          "type": "number"
        },
        "steam_market_hash_name": {
          "type": "string"
        },
        "phase": {
          "type": "string",
          "enum": [
            "Phase 1",
            "Phase 2",
            "Phase 3",
            "Phase 4",
            "Sapphire",
            "Ruby",
            "Black Pearl",
            "Emerald"
          ]
        },
        "class_id": {
          "type": "string"
        },
        "instance_id": {
          "type": "string"
        },
        "asset_id": {
          "type": "string"
        },
        "paint_index": {
          "type": "number"
        },
        "paint_seed": {
          "type": "number"
        },
        "float": {
          "type": "number"
        },
        "stickers": {
          "type": "array",
          "items": {
            "type": "string",
            "examples": [
              "Sticker | Rush 4x20 (Holo)"
            ]
          }
        },
        "time_unhold": {
          "type": "string",
          "description": "Item unhold time"
        }
      },
      "x-examples": {
        "Example 1": {
          "game": "csgo",
          "price": 0.45,
          "steam_market_hash_name": "MAG-7 | Storm (Well-Worn)",
          "phase": null,
          "class_id": "519987180",
          "instance_id": "519977179",
          "asset_id": "41165110534",
          "paint_index": 785,
          "paint_seed": 493,
          "float": 0.204017,
          "stickers": [
            "Sticker | Rush 4x20 (Holo)"
          ],
          "time_unhold": "2025-12-12 23:59:59"
        }
      }
    }
  }
}
```

---

## Schema : `ListingSteamItem`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/800a1e8b4a2ed-listing-steam-item`

```json
{
  "type": "object",
  "properties": {
    "game": {
      "type": "string",
      "enum": [
        "csgo",
        "dota2",
        "rust"
      ]
    },
    "steam_market_hash_name": {
      "type": "string"
    },
    "exterior": {
      "type": "string"
    },
    "rarity": {
      "type": "string"
    },
    "rarity_color": {
      "type": "string"
    },
    "item_type": {
      "type": "string"
    },
    "phase": {
      "$ref": "#/%24defs/Phase"
    },
    "item_url": {
      "type": "string"
    },
    "icon_url": {
      "type": "string"
    },
    "descriptions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "color": {
            "type": [
              "string",
              "null"
            ]
          },
          "value": {
            "type": "string"
          },
          "appData": {
            "type": "null"
          }
        }
      }
    }
  },
  "x-examples": {
    "Example 1": {
      "game": "csgo",
      "steam_market_hash_name": "★ Gut Knife | Doppler (Factory New)",
      "exterior": "Factory New",
      "rarity": "Covert",
      "rarity_color": "eb4b4b",
      "item_type": "Knife",
      "phase": "Ruby",
      "item_url": "https://skin.place/buy-cs2-skins/gut-knife-doppler-ruby?exterior=Factory+New&is_stattrak=0&is_souvenir=0",
      "icon_url": "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1ObcTjxP086jlpm0mvbmMbfUn3FU7Pp9g-7J4cL32AWy-kRtZjrxcYHHJlBqYFnR_Va4xervjJe-6MjLmCdjvnV35XvbgVXp1pNfnFsg",
      "descriptions": [
        {
          "type": "html",
          "color": null,
          "value": "Exterior: Factory New",
          "appData": null
        },
        {
          "type": "html",
          "color": null,
          "value": " ",
          "appData": null
        },
        {
          "type": "html",
          "color": null,
          "value": "The most notable feature of a gut knife is the gut hook on the spine of the blade.  Originally popularized as an aid for field dressing game, the gut hook is also effective at  cutting through fibrous materials like rope, webbing, or safety belts with ease. It has been painted with black and silver metallic paints using a marbleizing medium, then candy coated.\n\n<i>Getting lost in its color can prove fatal</i>",
          "appData": null
        },
        {
          "type": "html",
          "color": null,
          "value": " ",
          "appData": null
        }
      ]
    }
  },
  "$defs": {
    "Phase": {
      "type": "string",
      "enum": [
        "Phase 1",
        "Phase 2",
        "Phase 3",
        "Phase 4",
        "Sapphire",
        "Ruby",
        "Black Pearl",
        "Emerald"
      ],
      "title": "Phase",
      "description": "Item phase"
    }
  }
}
```

---

## Schema : `ProtectionStatus`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/nz34jmzjpjr20-protection-status`

```json
{
  "type": "string",
  "enum": [
    "unconfirmed",
    "confirmed",
    "rollback"
  ],
  "title": "ProtectionStatus"
}
```

---

## Schema : `ResponseStatus`

**URL :** `https://skinplace.stoplight.io/docs/skinplace/la8hbxhk0n3nr-response-status`

```json
{
  "type": "string",
  "enum": [
    "success",
    "error"
  ],
  "title": "ResponseStatus"
}
```

---

