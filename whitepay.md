# Whitepay — Documentation complète

> Scrappé le 11/03/2026 depuis https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0
> Scope : méthodes génériques + France

---
## Getting started

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/authorization`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Crypto acquiring

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Crypto top-up

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Static wallets

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Fiat acquiring

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Balance

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/balance`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Withdrawal

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Conversion with withdrawal

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Refund

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/refund`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Misc

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api/misc`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/webhooks/authorization`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Events

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/webhooks/events`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## HTTP API

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/api-reference/http-api`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Getting started

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/introduction`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/http-api`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## Authorization

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/webhooks`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## HTTP API

**URL :** `https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/api-reference`

[![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)![](https://docs.whitepay.com/1Q957FgGhSNqAyGWQqz0/~gitbook/image?url=https%3A%2F%2F1780970917-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Forganizations%252FEXfpjmeJJDTHygsqn4h2%252Fsites%252Fsite_5mN04%252Ficon%252Fi8nYCFsaZX7nYOfysfN6%252Fnew%2520logo.png%3Falt%3Dmedia%26token%3D610a8872-1911-4845-8619-2c301fb4484c&width=32&dpr=3&quality=100&sign=31ea27fc&sv=2)

docs.whitepay.com

](/1Q957FgGhSNqAyGWQqz0)

-   Introduction
    
    -   [flag-checkeredGetting started](/1Q957FgGhSNqAyGWQqz0)
-   HTTP API
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/http-api/authorization)
    -   [bitcoinCrypto acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-acquiring)
    -   [bitcoinCrypto top-up](/1Q957FgGhSNqAyGWQqz0/http-api/crypto-top-up)
    -   [walletStatic wallets](/1Q957FgGhSNqAyGWQqz0/http-api/static-wallets)
    -   [euro-signFiat acquiring](/1Q957FgGhSNqAyGWQqz0/http-api/fiat-acquiring)
    -   [walletBalance](/1Q957FgGhSNqAyGWQqz0/http-api/balance)
    -   [money-simple-from-bracketWithdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/withdrawal)
    -   [money-bill-transferConversion with withdrawal](/1Q957FgGhSNqAyGWQqz0/http-api/conversion-with-withdrawal)
    -   [rotate-leftRefund](/1Q957FgGhSNqAyGWQqz0/http-api/refund)
    -   [flaskMisc](/1Q957FgGhSNqAyGWQqz0/http-api/misc)
-   Webhooks
    
    -   [webhookAuthorization](/1Q957FgGhSNqAyGWQqz0/webhooks/authorization)
    -   [arrow-right-arrow-leftEvents](/1Q957FgGhSNqAyGWQqz0/webhooks/events)
-   API reference
    
    -   [webhookHTTP API](/1Q957FgGhSNqAyGWQqz0/api-reference/http-api)

chevron-upchevron-down

[gitbookPowered by GitBook](https://www.gitbook.com/?utm_source=content&utm_medium=trademark&utm_campaign=RMhnrQ1sZzvHAlRgWxE7)

xmark

---
## https://docs.whitepay.com/docs/reference/http#currency

**URL :** `https://docs.whitepay.com/docs/reference/http#currency`

```
Authentication missing to access this content
```

---
