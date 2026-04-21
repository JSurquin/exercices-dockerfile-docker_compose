# Kycaid — Documentation complète

> Scrappé le 11/03/2026 depuis https://docs.kycaid.com
> Source : endpoints Markdown GitBook + llms.txt

---
## Authentication with API key

**URL :** `https://docs.kycaid.com/api/authentication-wtih-api-key.md`

# Authentication with API key

To authorise for using API, you need to add following parameter to the header of a request:

- Type: `API Key`
- Key: `Authorization`
- Value: `Token {api_key}`

---
## Getting your API key

**URL :** `https://docs.kycaid.com/api/getting-your-api-key.md`

# Getting your API key

---
## Try Kycaid API with Postman

**URL :** `https://docs.kycaid.com/api/try-kycaid-api-with-postman.md`

# Try Kycaid API with Postman

---
## Transaction screening completed

**URL :** `https://docs.kycaid.com/callbacks/transaction-screening-completed.md`

# Transaction screening completed

Our system sends this webhook notification to your configured `callback_url` immediately after the screening process is finished. Use this to automate your internal transaction approval workflows.

## Example


```json
{
  "request_id": "<value>",
  "type": "TRANSACTION_SCREENING_COMPLETED",
  "screening_result": "<approved/declined>",
  "applicant_id": "<value>",
  "external_applicant_id": "<value>",
  "external_applicant_registered_at": "<value>",
  "transaction": {
    "direction": "<value>",
    "amount": "<value>",
    "asset": "<value>",
    "created_at": "<value>"
  },
  "ruleset_id": "<value>",
  "result": [
    {
      "rule_name": "verified_applicant",
      "rule_description": "Verified applicant",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "min_days_registration",
      "rule_description": "Minimum days from registration datetime",
      "calculated": "30.0",
      "min_threshold": "1.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "min_days_verification",
      "rule_description": "Minimum days from verification datetime",
      "calculated": "18.0",
      "min_threshold": "7.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_tx_24h",
      "rule_description": "Maximum transactions for 24 hours",
      "calculated": "2.0",
      "max_threshold": "10.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_tx_1m",
      "rule_description": "Maximum transactions for 1 month",
      "calculated": "2.0",
      "max_threshold": "10.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_volume_1tx",
      "rule_description": "Maximum volume of one transaction",
      "asset": "SOL",
      "calculated": "18.970925",
      "max_threshold": "50.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_volume_24h",
      "rule_description": "Maximum volume of transactions for 24 hours",
      "asset": "SOL",
      "calculated": "42.108152",
      "max_threshold": "100.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_volume_1m",
      "rule_description": "Maximum volume of transactions for 1 month",
      "asset": "SOL",
      "calculated": "346.028810",
      "max_threshold": "1500.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_volume_registration",
      "rule_description": "Maximum volume of transactions since registration datetime",
      "asset": "SOL",
      "calculated": "1790.157252",
      "max_threshold": "10000.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "max_volume_verification",
      "rule_description": "Maximum volume of transactions since verification datetime",
      "asset": "SOL",
      "calculated": "1790.157252",
      "max_threshold": "5000.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "diff_txs",
      "rule_description": "Difference between incoming and outgoing transactions (incoming minus outgoing)",
      "calculated": "-17.0",
      "min_threshold": "-50.0",
      "max_threshold": "50.0",
      "status": "<passed/rejected>"
    },
    {
      "rule_name": "ratio_volume",
      "rule_description": "Ratio between incoming and outgoing volumes (incoming divided by outgoing)",
      "details": [
        {
          "asset": "SOL",
          "volume_incoming": "35.1099",
          "volume_outgoing": "17.6051",
          "ratio": "1.9943"
        },
        {
          "asset": "USDT",
          "volume_incoming": "460.0",
          "volume_outgoing": "212.0",
          "ratio": "2.1698"
        }
      ],
      "min_threshold": "0.5",
      "max_threshold": "20.0",
      "status": "<passed/rejected>"
    }
  ]
}
```

---
## decline-reasons

**URL :** `https://docs.kycaid.com/decline-reasons.md`

## Decline reasons

| Decline reason | Description |
|  --- | --- |
| `AGE_RESTRICTION` | The person’s document does does not meet the minimum age requirements. |
| `ANONYMIZING_NETWORK` | Our system detected that the person is using an anonymous network. |
| `BAD_QUALITY` | The document image provided is of poor quality and unreadable. |
| `COMPROMISED_PERSON` | The person has been flagged as compromised in a blacklist database. |
| `COMPULSION` | The document capture may have been forced, indicating potential coercion or lack of consent. |
| `DIFFERENT_FACES` | The face in the document does not match the selfie, indicating a discrepancy. |
| `DOCUMENT_DAMAGED` | The document is physically damaged and cannot be recognised. |
| `DOCUMENT_INCOMPLETE` | The document is missing required sections or pages for verification. |
| `DUPLICATE` | An applicant with this document already exists in our system, creating an unauthorized duplication. |
| `EDITED_DOCUMENT` | The document has been tampered with or edited, raising concerns about authenticity. |
| `EXPIRED_DOCUMENT` | The document has passed its expiration date and is no longer valid. |
| `FAKE_DOCUMENT` | The document is fraudulent, contains signs of forgery, or does not correspond to an official format. |
| `FRAUDULENT` | The document shows clear signs of fraudulent activity or intent. |
| `IP_MISMATCH` | The issuing country of the document does not match the person’s IP address. |
| `LIMIT_REACHED_OTP` | The wrong one-time password (OTP) was entered multiple times during document confirmation, reaching the maximum number of attempts. |
| `MULTIPLE_PERSON` | The image contains images of multiple, which is not allowed. |
| `NO_SELFIE` | A required selfie was not provided. |
| `OTHER` | Any issue or reason not covered by the predefined categories. |
| `PROHIBITED_JURISDICTION` | The document originates from a jurisdiction that is restricted or prohibited by a policy. |
| `QES_MISMATCH` | Information from the Qualified Electronic Signature (QES) does not match the person’s profile. |
| `TAX_ID_REQUIRED` | A valid tax identification number is mandatory but was not provided. |
| `WRONG_DOB` | The date of birth provided does not match the one on the document. |
| `WRONG_DOCUMENT` | The submitted document type is not supported for the document owner type. |
| `WRONG_INFO` | The information provided does not match the details in the document. |
| `WRONG_NAME` | The names provided do not align with those on the document. |

---
## Working with the documentation

**URL :** `https://docs.kycaid.com/index.html.md`

# Working with the documentation

The documentation is here to help you integrate and use the Kycaid services effectively. It provides clear instructions and examples to guide you through tasks like setting up APIs and solving common issues. By following steps described in “Guides” section, you can save time and avoid problems during implementation.

Contact us anytime
If you couldn’t find the answer to your question, feel free to reach out to us at [support@kycaid.com](mailto:support@kycaid.com). We're here to help!

Documentation v1
Access the articles from the [previous version of the documentation](https://docs-v1.kycaid.com/)

---
## Database screening

**URL :** `https://docs.kycaid.com/callbacks/database-screening.md`

# Database screening

Content migration in progress
Please refer to the [**legacy documentation**](https://docs-v1.kycaid.com/#database-screening) for this article

---
## Document expired

**URL :** `https://docs.kycaid.com/callbacks/document-expired.md`

# Document expired

Content migration in progress
Please refer to the [**legacy documentation**](https://docs-v1.kycaid.com/#monitoring-document-expired) for this article

---
## Service result

**URL :** `https://docs.kycaid.com/callbacks/service-result.md`

# Service result

Content migration in progress
Please refer to the [**legacy documentation**](https://docs-v1.kycaid.com/#crypto-result-callback) for this article

---
## Signed documents

**URL :** `https://docs.kycaid.com/callbacks/signed-documents.md`

# Signed documents

Content migration in progress
Please refer to the [**legacy documentation**](https://docs-v1.kycaid.com/#signed-documents-callback) for this article

---
## Completed Diia authorisation

**URL :** `https://docs.kycaid.com/callbacks/ua-diia-auth-completed.md`

# Completed Diia authorisation

Content migration in progress
Please refer to the [**legacy documentation**](https://docs-v1.kycaid.com/#ua-diia-auth-completed) for this article

---
## Set up a custom domain name

**URL :** `https://docs.kycaid.com/guides/set-up-a-custom-domain-name.md`

# Set up a custom domain name

There are two ways to setup your server for a custom domain name for forms: using Apache HTTP Server or Nginx.

## Apache HTTP Server

Prerequisites
- Debian or Ubuntu operating systems
- Apache HTTP Server version 2.4.59


1. Install the `apache2` package:



```bash
sudo apt update
sudo apt install apache2
```

1. Enable required Apache modules:



```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
```

1. Obtain a valid SSL certificate (e.g., [Let’s Encrypt](https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu)).
2. Use the following example configuration, modifying `kyc.example.com` to match your domain and certificate details:



```bash forms-reverse-proxy-apache.conf
<VirtualHost *:443>
    ServerAdmin webmaster@localhost
    ServerName kyc.example.com
    DocumentRoot /var/www/kyc.example.com

    SSLEngine On
    SSLProxyEngine On
    SSLProxyVerify none
    SSLProxyCheckPeerCN off
    SSLProxyCheckPeerName off

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass / https://forms.kycaid.com/
    ProxyPassReverse / https://forms.kycaid.com/

    ErrorLog ${APACHE_LOG_DIR}/reverseproxy_error.log
    CustomLog ${APACHE_LOG_DIR}/reverseproxy_access.log combined

    SSLCertificateFile /etc/letsencrypt/live/kyc.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/kyc.example.com/privkey.pem
</VirtualHost>
```

## Nginx

Prerequisites
- Debian or Ubuntu operating systems
- Nginx version 1.22.1


1. Install the `nginx` package:



```bash
sudo apt update
sudo apt install nginx
```

1. Obtain a valid SSL certificate (e.g. [Let’s Encrypt](https://www.f5.com/company/blog/nginx/using-free-ssltls-certificates-from-lets-encrypt-with-nginx)).
2. Use the following example configuration, modifying `kyc.example.com` to match your domain and certificate details:



```bash forms-reverse-proxy-nginx.conf
# Reverse proxy for kyc.example.com
server {
    server_name kyc.example.com;
    root /var/www/kyc.example.com;
    index index.html;

    # Reverse proxy settings
    location / {
        proxy_pass https://forms.kycaid.com;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;

    ssl_certificate /etc/letsencrypt/live/kyc.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kyc.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Redirect HTTP to HTTPS
server {
    if ($host = kyc.example.com) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    listen [::]:80;
    server_name kyc.example.com;
    return 404;
}
```

---
## FAQ

**URL :** `https://docs.kycaid.com/guides/faq.md`

# FAQ

### What should I do if I didn’t get a callback?

You can check the status of:

- [Get an applicant](/objects/applicants/applicant-get)
- [Get a document](/objects/documents/document-get)
- [Get a verification](/objects/verifications/verification-get)


### How to test requests with “Try it” button?

1. Click the **Try it** button under a request to open **Try it console**


Highlighted location of the the ”Try it” button
1. Click the **Security** tab for API key settings


Highlighted location of the the ”Try it” button
1. Hover the **{$inputs.API-Key}** variable and click the **Set value** button


Highlighted location of the the ”Try it” button
Highlighted location of the the ”Try it” button
1. The **Value** input field will appear. You may find your API key in the **API keys** section in the **Dashboard**. Copy and paste your API key into the **Value** input field. The key will be stored only in the local files


Highlighted location of the the ”Try it” button
Highlighted location of the the ”Try it” button
Highlighted location of the the ”Try it” button
1. Perform the request by clicking **Send** button and observe results


Highlighted location of the the ”Try it” button
Highlighted location of the the ”Try it” button

---
## Form integration

**URL :** `https://docs.kycaid.com/guides/form-integration.md`

# Form integration

A *form* in Kycaid is a widget designed for seamless integration into your services, supporting KYC (Know Your Customer) and KYB (Know Your Business) processes, such as user identification via document uploads or video interviews.

## Getting an ID of a form

An *ID of a form* (referred to as `form_id` in our system) is a unique identifier assigned by our system when a form is created. This ID is generated in a 36-characters UUID-like format (e.g., `18505b6f056f2143c41b97f4924dca24ea82`).

Creating a form
If you have not created a form yet, you have to create one. [Log in to the Dashboard](https://app.kycaid.com/login), navigate to the [Forms](https://app.kycaid.com/forms/list) page, and click **Create new**. Enter a name for the form and click **Save changes**.

To retrieve a `form_id`, go to the [Forms](https://app.kycaid.com/forms/list) page and click **Copy** in the **Form ID** column while hovering over the target form ID:

Highlighted location of the “Copy” icon button
## Getting a form URL

### From the Dashboard

To obtain the form URL from the Dashboard, click the **Link** button:

Highlighted location of the “Link” icon button
Then, click the **Generate link** in the modal window that appears:

Highlighted location of the “Generate link” primary button in the modal window
After the link is generated, you can copy it or open it in a new tab.

Highlighted location of the form URL, together with the “Run” and the “Copy URL” buttons
### Using the API

To retrieve a one-time URL for a form using the API, use the [Get a form URL](/objects/forms/form-get-url) API request with the `form_id`, which you can obtain by following the instructions in the [previous section](#getting-an-id-of-a-form).

One form, multiple URLs
You don’t need to create a new form for every verification. Instead, you can retrieve a unique one-time URL for each user.

#### For new users

If a user does not have a corresponding applicant in our system, an applicant will be created after the user completes their first form and submits it for verification. Alternatively, you can create an applicant in advance using the [Create an applicant object](/objects/applicants/applicant-create) API request.

#### For users with created applicants

If a user has already submitted a form and you need to provide them with another verification attempt, use the [Get a form URL](/objects/forms/form-get-url) API request with `applicant_id` of their applicant.

Avoid creating duplicates
If an `applicant_id` of an applicant was not used, a duplicate applicant will be created, potentially breaking the connection between applicants and verifications, and hindering versioning consistency.

#### Linking applicants to users in your system

When making the [Get a form URL](/objects/forms/form-get-url) API request, you can include a user identifier from your system (e.g. `user_id`) with the `external_applicant_id` parameter. This ensures consistency across the whole user verification process and allows you to track your users at each step.

## Providing a form to a user

You can provide users with a form using the following methods:

- A *direct URL* to a form (obtained via the instructions in the [previous section](#getting-a-url-to-a-form)).
- Embedding a form in an *iframe* within a browser.
- Displaying the form using a *native WebView* on iOS or Android devices.


For the iframe and native WebView, there are additional settings available, that are listed below.

### Custom domain name for a form

See [Set up a custom domain name](/guides/set-up-a-custom-domain-name) article for instructions on configuring a custom domain name for your forms.

## Form display settings

Set container minimum sizes for an iframe and WKWebView
For the form to display correctly on mobile screen sizes, use the following minimum container dimensions. A minimum height is required for each corresponding width.

- **Width 320 px**: Minimum height 700 px
- **Width 375 px**: Minimum height 715 px
- **Width 425 px**: Minimum height 775 px
- **Width 500 px**: Minimum height 835 px
- **Width 600 px**: Minimum height 950 px
- **Width 700 px**: Minimum height 1060 px
- **Width 767 px**: Minimum height 1135 px


### Default form language

By default, our system sets the form language based on the locale of the user’s browser. However, you can override this using the `lang` query parameter. In the following example:


```
https://forms.kycaid.com/65e5b4121d92424b9e3af5e443cca0d3b024/?lang=en
```

the default form language is set to English (`en`).

All supported languages
All supported languages are listed by **Get languages** request.

### Settings for iframe

To ensure proper microphone and camera within the iframe, permissions must be granted at both the server level (via HTTP header) and the browser level (via HTML attributes):

1. **Server-side**: your web server must include the `Permissions-Policy` header in the reponse for the page that hosts the iframe. This tells the browser that your site is authorised to share hardware access with Kycaid.



```http
Permissions-Policy: camera=(self "https://forms.kycaid.com"), microphone=(self "https://forms.kycaid.com")
```

1. **Client-side**: you must also explicitly delegate these permissions to the `iframe` element using the `allow` attribute in your HTML code:



```html
<iframe allow="microphone *;camera *;midi *;encrypted-media *;clipboard-read;clipboard-write;"></iframe>
```

### iframe postMessage communication

Resizing
Our system automatically resizes iframes to adapt to the screen size of the user’s device.

When using the iframe solution, the form communicates with the parent page via cross-origin postMessage events.

#### Outbound events

The iframe sends the following messages to the parent page:

**FORM_COMPLETED** sent when the applicant successfully completes the form.


```json
{
  "event": "FORM_COMPLETED",
  "applicant_id": "[...]",
  "verification_id": "[...]"
}
```

**IFRAME_RESIZED** sent whenever the content height of the form changes.


```json
{
  "event": "IFRAME_RESIZED",
  "width": "[...]",
  "height": "[...]"
}
```

#### Inbound commands

The parent page can send the following message to the iframe:

**INITIATE_IFRAME_RESIZE** triggers a manual recalculation of the form content size. This should be sent once the parent page has fully loaded.


```json
{
  "event": "INITIATE_IFRAME_RESIZE"
}
```

### Automatic iframe resizing script

Instead of handling postMessage events manually, you can use our helper script to manage iframe dimensions automatically.

1. Include the script on your page:



```html
<script src="https://forms-new.kycaid.com/scripts/iframe-resizer.min.js"></script>
```

1. Control resising using the following JavaScript commands:


- To start: `window.kycaid.iframeResizer.start('{iframe_id}')`
- To stop: `window.kycaid.iframeResizer.stop()`


### Settings for iOS WKWebView

Set the `allowsInlineMediaPlayback` parameter to `true` to enable proper camera functionality.

Note that the WKWebViewConfiguration should only be used during the first initialisation of the WebView and can’t be changed afterward.

## Getting verification status

### Using the cross-origin postMessage event

When a user submits a completed form in an iframe, the form triggers a cross-origin postMessage event:


```json
{
  "event": "FORM_COMPLETED",
  "applicant_id": "[...]",
  "verification_id": "[...]"
}
```

This allows your system to handle the form completion event programmatically.

### Using the *Verification completed* callback

Our server provides the results of the user verification check by sending the [**Verification completed**](https://docs.kycaid.com/#verification-completed) callback in JSON format to the URL specified in the form settings:

Highlighted location of the “The URL on which result of verification will come” block
The verification process may take anywhere from 10 seconds to 15 minutes, depending on various factors. It is important to store `applicant_id` and `verification_id` from the callback for future operations related to the applicant and verification.

### Using the *Verification status changed* callback

To additionally track when a user completes and submits a form, enable the **Send the callback when verification is created** option (disabled by default) in the form settings:

Highlighted location of the “Send the callback when verification is created” block
Once enabled, our server will send the [**Verification status changed**](https://docs.kycaid.com/#verification-status-changed) callback in JSON format to your server (to the same URL specified in the form settings as for **Verification completed** callback) when a user submits a form for verification.

Responding to a callback
After sending a callback, our server waits for a `200` HTTP response (with any response body) from your server to confirm successful delivery. If your server does not respond within 10 seconds, another callback is sent 1 minute later, with subsequent retries at these intervals:

- 5 minutes
- 10 minutes
- 30 minutes
- 1 hour
- 3 hours
- 6 hours
- 12 hours
- 24 hours.


Controlling restart
To prevent a user from restarting a form after submission, you can disable the button used to open the form upon receiving the **Verification status changed** callback. Optionally, re-enable it after receiving the **Verification completed** callback if you want the user to make another verification attempt.

### Using API

You can retrieve information about the verification process by making different API requests:

- Verification with [Get a verification](https://docs.kycaid.com/#retrieve-a-verification) (see `status` property).
- Applicant with [Get an applicant](/objects/applicants/applicant-get).
- Document with [Get a document](/objects/documents/document-get).


## Understanding verification results

There are three status levels:

1. The highest level is the `verified` property of a verification, which defines the overall verification status. This property can be retrieved using the  [Get a verification](https://docs.kycaid.com/#retrieve-a-verification) API. The `verified` property may have one of the following values:


- `null`: the applicant is under verification,
- `true`: the applicant has passed verification,
- `false`: the applicant has failed verification


1. A lower, more specific level is the `verifications.{verification_type}.verified` property of a verification, which indicates the verification result for the specific verification type. Here, `{verification_type}` can be one of the following:


- `profile`
- `document`
- `facial`
- `address`
- `aml`
- `financial`
- `payment_method`
- `tax_id`
- `database_screening`
- `company`


`verifications.{verification_type}.verified` can have one of the following values:

- `true`: a verification has passed for that specific type
- `false`: a verification failed for the specific type


1. The lowest and most specific level is the `decline_reasons` property of an applicant, which provides detailed reasons for a failed verification. This property can be retrieved using the [Get an applicant](/objects/applicants/applicant-get) API. The `decline_reasons` property lists specific causes that led to the verification failure, offering deeper insights for troubleshooting and resolution. For a detailed list of possible reasons and their descriptions, refer to the [Decline reasons](/decline-reasons) article.


## Additional verification attempts

If a user fails the verification process and you want to allow another attempt, generate a new URL for the form (see [Getting a form URL](#for-users-with-created-applicants) section) using the `applicant_id` from the **Verification completed** callback. This ensures that our system maintains the connection between data from multiple verifications of the user.

---
## Overview

**URL :** `https://docs.kycaid.com/knowledge-base.md`

# Overview

Version: 1.0

## Servers

```
https://api.kycaid.com
```

## Security

### API-Key

Type: apiKey
In: header
Name: API-Key

## Download OpenAPI description

[Overview](https://docs.kycaid.com/_bundle/knowledge-base.yaml)

## Business activities

Business activities

### Get business activities

 - [GET /business-activities](https://docs.kycaid.com/knowledge-base/business-activities/get-business-activities.md): Retrieve a list of business activities and their identifiers from our system to use them while creating a KYB applicant (a company)

## Languages

Languages

### Get languages

 - [GET /languages](https://docs.kycaid.com/knowledge-base/languages/get-languages.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## Countries

Countries

### Get countries

 - [GET /countries](https://docs.kycaid.com/knowledge-base/countries/get-countries.md): Retrieve a list of countries and their codes from our system to use them for country-specific parameters

---
## Overview

**URL :** `https://docs.kycaid.com/non-doc.md`

# Overview

Version: 1.0

## Servers

```
https://api.kycaid.com
```

## Security

### API-Key

Type: apiKey
In: header
Name: API-Key

## Download OpenAPI description

[Overview](https://docs.kycaid.com/_bundle/non-doc.yaml)

## 🇧🇷 Brazil

Brazil

### CPF number

 - [GET /services/br/cpf/{cpf_number}](https://docs.kycaid.com/non-doc/brazil/br-cpf.md): The Brazil CPF verification service allows you to verify the identity of an individual in Brazil using their individual taxpayer identification number (Cadastro de Pessoas Físicas). The service returns the person’s full name, date of birth, and gender

### CPF number (alternative)

 - [GET /services/br/cpf/2/{cpf_number}](https://docs.kycaid.com/non-doc/brazil/br-cpf-2.md): The alternative Brazil CPF verification service allows you to verify the identity of an individual in Brazil using their individual taxpayer identification number (Cadastro de Pessoas Físicas). The service returns the person’s full name, date of birth, and CPF registration status, including whether the CPF is active, suspended, or cancelled. No document upload is required for verification. This enables quick and automated identity checks against official records.

## 🇮🇳 India

🇮🇳 India

### Aadhaar number

 - [POST /services/in/aadhaar/generate-otp](https://docs.kycaid.com/non-doc/india/in-aadhaar.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article

## 🇰🇿 Kazakhstan

🇰🇿 Kazakhstan

### IIN (basic)

 - [POST /services/kz/iin/request](https://docs.kycaid.com/non-doc/kazakhstan/kz-iin-basic.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### IIN (extended)

 - [POST /services/kz/personal-data/request](https://docs.kycaid.com/non-doc/kazakhstan/kz-iin-extended.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## 🇲🇽 Mexico

🇲🇽 Mexico

### CURP

 - [GET /services/mx/curp/curp_number](https://docs.kycaid.com/non-doc/mexico/mx-curp.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## 🇳🇬 Nigeria

🇳🇬 Nigeria

### NIN

 - [POST /services/ng/nin](https://docs.kycaid.com/non-doc/nigeria/ng-nin.md): The Nigeria NIN (National Identification Number) service provides a method for checking and confirming person idenitity using their NIN. It utilizes the provided 11-digit NIN to query the official national database. The service returns a detailed response including the NIN holder's registered identity data (full name, date of birth, address, and gender) upon a successful match.

## 🇵🇪 Peru

🇵🇪 Peru

### DNI number (extended)

 - [GET /services/pe/dni-extra/{dni_number}](https://docs.kycaid.com/non-doc/peru/pe-dni-extended.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## 🇹🇷 Turkey

🇹🇷 Turkey

### Türkiye Cumhuriyeti Kimlik Numarası

 - [POST /services/tr/identity-number](https://docs.kycaid.com/non-doc/turkey/tr-tckn.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## 🇺🇸 USA

🇺🇸 USA

### eIDV

 - [POST /services/us/eidv](https://docs.kycaid.com/non-doc/usa/us-eidv.md): The USA eIDV (electronic Identity Verification) service provides automated, remote identity verification for individuals within the United States. It utilizes a person's first name, last name, and date of birth to check against official records. The service returns a match score along with a detailed description of the verification outcome, enabling quick and reliable identity checks.

---
## Form URL expired

**URL :** `https://docs.kycaid.com/callbacks/form-url-expired.md`

# Form URL expired

Our system sends the “**Form URL expired**” callback when it detects that the time elapsed since the applicant first opened the form exceeds the limit defined in the “**Form URL expiration period**” setting.

## Schema

## Example


```json
{
  "type": "FORM_URL_EXPIRED",
  "applicant_id": "aa6ca3a10440624d671b9ef4771c32cb9d3a",
  "external_applicant_id": null,
  "form_id": "24148eb10810e24b2c1afaa4b9759008d352",
  "form_token": "d2177cdf067d424a221b5d045dc616bf81f9",
  "expired_at": "",
  "request_id": "5eb27e030be7f24a7f19c794926f1d2f2abc"
}
```

---
## Verification completed

**URL :** `https://docs.kycaid.com/callbacks/verification-completed.md`

# Verification completed

Our system sends the “Verification completed” callback when verification status is set by our system, our manager, or your project member. This callback includes the `status` parameter set to `completed`.

## Schema

## Example


```json
{
  "type": "VERIFICATION_COMPLETED",
  "request_id": "b730d77f049ae24c9b18f054399b7307eb3b",
  "verification_id": "270128a807f3c24bfd1b8da4a4af7d2080c4",
  "applicant_id": "723f46ab04feb64f442946f2952a67eaecf7",
  "form_id": "203148eb10810e24b2c1afaa4b9759008d352",
  "form_token": "d2177cdf067d425a221b5d045dc616bf81f9",
  "status": "completed",
  "verified": true,
  "verifications": {
    "profile": {
      "verified": true,
      "comment": "",
      "decline_reasons": []
    },
    "document": {
      "verified": true,
      "comment": "",
      "decline_reasons": []
    }
  },
  "applicant": {
    "applicant_id": "723f46ab04feb64f442946f2953a67eaeca7",
    "external_applicant_id": "cb1eebbe-9945-4e64-8f60-c930f1e3e237",
    "type": "PERSON",
    "created_at": "2025-02-14 12:55:12",
    "profile_status": "valid",
    "profile_comment": null,
    "first_name": "Josh",
    "origin_first_name": "Джош",
    "middle_name": null,
    "origin_middle_name": null,
    "last_name": "Coffey",
    "origin_last_name": "Кофі",
    "residence_country": "GB",
    "nationality": null,
    "dob": "1976-02-21",
    "gender": "M",
    "email": null,
    "phone": null,
    "phone_status": null,
    "wallet_address": null,
    "telegram_username": null,
    "pep": null,
    "custom_field_1": null,
    "custom_field_2": null,
    "custom_field_3": null,
    "custom_field_4": null,
    "custom_field_5": null,
    "decline_reasons_ids": null,
    "decline_reasons": [],
    "addresses": [],
    "documents": [
      {
        "document_id": "f4424a5c0a97424265184fc4fa8388787b91",
        "type": "PASSPORT",
        "provider": "MANUAL",
        "status": "valid",
        "comment": null,
        "document_number": "FX739910",
        "additional_number": null,
        "issue_date": "2019-11-22",
        "expiry_date": "2029-11-22",
        "issuing_authority": "8017",
        "income_sources": [],
        "annual_income": null,
        "transaction_amount": null,
        "transaction_purpose": null,
        "origin_funds": null,
        "card_number": null,
        "account_number": null,
        "portrait": "https://storage.googleapis.com/kycaid/portraits/0654ce820dcbb24e161aea24541324626d90.jpg",
        "front_side_id": "136138ff07539248ad1955f445f58b4e57dc",
        "front_side": "https://storage.googleapis.com/kycaid/files/72fc74300ca8d248b418d064c82027979666.jpg",
        "front_side_size": 355543,
        "front_side_signature": null,
        "back_side_id": null,
        "back_side": null,
        "back_side_size": null,
        "origin_back_side": null,
        "origin_back_side_size": null,
        "back_side_signature": null,
        "other_side_1_id": null,
        "other_side_1": null,
        "other_side_1_size": null,
        "origin_other_side_1": null,
        "origin_other_side_1_size": null,
        "other_side_1_signature": null,
        "other_side_2_id": null,
        "other_side_2": null,
        "other_side_2_size": null,
        "origin_other_side_2": null,
        "origin_other_side_2_size": null,
        "other_side_2_signature": null,
        "other_side_3_id": null,
        "other_side_3": null,
        "other_side_3_size": null,
        "origin_other_side_3": null,
        "origin_other_side_3_size": null,
        "other_side_3_signature": null,
        "created_at": "2025-02-14 12:55:12",
        "decline_reasons_ids": null,
        "decline_reasons": []
      }
    ],
    "questionnaires": [],
    "verification_status": "valid",
    "verifications_count": 1
  },
  "client_info": {
    "ip": "193.194.107.42",
    "device": {
      "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
      "model": "iPhone",
      "type": "mobile",
      "vendor": "Apple",
      "engine": {
        "name": "WebKit",
        "version": "605.1.15"
      },
      "os": {
        "name": "iOS",
        "version": "18.3.1"
      },
      "browser": {
        "name": "Mobile Safari",
        "version": "18.3"
      }
    },
    "address": {
      "city": "London",
      "region": "London",
      "country_code": "GB"
    },
    "location": {
      "latitude": 52.408,
      "longitude": 31.5403
    }
  },
  "verification_statuses": {
    "duplicates": [],
    "ludoman": null,
    "agreed_with_tc": null,
    "face_match_confidence": null
  },
  "verification_attempts_left": null
}
```

---
## Verification status changed

**URL :** `https://docs.kycaid.com/callbacks/verification-status-changed.md`

# Verification status changed

Our system sends the “Verification status changed” callback when a user completes and submits a form. Please note that this callback is sent with the `verification_status` parameter set to `pending`.

Enable in the Dashboard first
The callback must be enabled in the Dashboard for a specific form before use. For instructions, see [Using the “Verification status changed” callback](/guides/form-integration#using-the-verification_status_changed-callback).

## Schema

## Example


```json
{
  "type": "VERIFICATION_STATUS_CHANGED",
  "verification_status": "pending",
  "applicant_id": "aa6ca3a10440624d671b9ef4771c32cb9d3a",
  "external_applicant_id": "",
  "form_id": "24148eb10810e24b2c1afaa4b9759008d352",
  "form_token": "d2177cdf067d424a221b5d045dc616bf81f9",
  "verification_id": "270128a807f3c24bfb1b8da4a4af7d2080c4",
  "verification_attempts_left": null,
  "request_id": "5eb27e030be7f24a7f19c794926f1d2f2abc"
}
```

---
## Overview

**URL :** `https://docs.kycaid.com/objects.md`

# Overview

Version: 1.0

## Servers

```
https://api.kycaid.com
```

## Security

### API-Key

Type: apiKey
In: header
Name: API-Key

## Download OpenAPI description

[Overview](https://docs.kycaid.com/_bundle/objects.yaml)

## Addresses

Addresses

### Create an address

 - [POST /addresses](https://docs.kycaid.com/objects/addresses/address-create.md): Create and add an address object to an applicant or an affiliated person. Only one address per type may be added to an object

### Update an address

 - [PATCH /addresses/{address_id}](https://docs.kycaid.com/objects/addresses/address-update.md): Update records of an address object in our system

In case when an address becomes a part of a created verification, then our system will create a copy of an address object and will provide you with a different address_id in a response

### Delete an address

 - [DELETE /addresses/{address_id}](https://docs.kycaid.com/objects/addresses/address-delete.md): Deletes an address object from our system

Please note, that addresses may be deleted only before a verification was created

## Affiliated persons

Affiliated persons

### Create an affiliated person

 - [POST /affiliated-persons](https://docs.kycaid.com/objects/affiliated-persons/affiliated-person-create.md): Create and add an affiliated person for an applicant object

### Update an affiliated person

 - [PATCH /affiliated-persons/{affiliated_person_id}](https://docs.kycaid.com/objects/affiliated-persons/affiliated-person-update.md): Update records of an affiliated person object in our system

### Delete an affiliated person

 - [DELETE /affiliated-persons/{affiliated_person_id}](https://docs.kycaid.com/objects/affiliated-persons/affiliated-person-delete.md): Delete records of an affiliated person object from our system

## Applicants

Applicants

### Create an applicant

 - [POST /applicants](https://docs.kycaid.com/objects/applicants/applicant-create.md): Create a new applicant object in the system

### Get an applicant

 - [GET /applicants/{applicant_id}](https://docs.kycaid.com/objects/applicants/applicant-get.md): Get data on a created applicant

### Update an applicant

 - [PATCH /applicants/{applicant_id}](https://docs.kycaid.com/objects/applicants/applicant-update.md): Update data of a created applicant

## Documents

Documents

### Create a document

 - [POST /documents](https://docs.kycaid.com/objects/documents/document-create.md): Create a new document object in our system

### Get a document

 - [GET /documents/{document_id}](https://docs.kycaid.com/objects/documents/document-get.md): Get records of a created document object

### Update a document

 - [PATCH /documents/{document_id}](https://docs.kycaid.com/objects/documents/document-update.md): Update records of a created document object

### Delete a document

 - [DELETE /documents/{document_id}](https://docs.kycaid.com/objects/documents/document-delete.md): Delete records of a created document object

## Files

Files

### Create a file

 - [POST /files](https://docs.kycaid.com/objects/files/file-create.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Update a file

 - [PUT /files/file_id](https://docs.kycaid.com/objects/files/file-update.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## Forms

Forms

### Get a form URL

 - [POST /forms/{form_id}/urls](https://docs.kycaid.com/objects/forms/form-get-url.md): Retrieve a URL for a form

### Get forms

 - [GET /forms](https://docs.kycaid.com/objects/forms/forms-get.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## Verifications

Verifications

### Create a verification

 - [POST /verifications](https://docs.kycaid.com/objects/verifications/verification-create.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Get a verification

 - [GET /verifications/{verification_id}](https://docs.kycaid.com/objects/verifications/verification-get.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Get a report

 - [GET /verifications/report](https://docs.kycaid.com/objects/verifications/verification-report-get.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Update verification status

 - [POST /verifications/{verification_id}/status](https://docs.kycaid.com/objects/verifications/verification-update-status.md): This endpoint is used to programmatically change the status of an existing verification record. This is typically utilised by your systems to finalise or adjust a verification's outcome after review

---
## Overview

**URL :** `https://docs.kycaid.com/risks-check.md`

# Overview

Version: 1.0

## Servers

```
https://api.kycaid.com
```

## Security

### API-Key

Type: apiKey
In: header
Name: API-Key

## Download OpenAPI description

[Overview](https://docs.kycaid.com/_bundle/risks-check.yaml)

## Blacklist databases

Access and query global databases to identify individuals or entities previously flagged for high-risk activities. Use this tool to cross-reference user data against known risk records


### Persons 1

 - [POST /bdb/persons](https://docs.kycaid.com/risks-check/blacklist-databases/bdb-persons.md): Retrieve information on persons from the Kycaid blacklist databases to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

### Persons 2

 - [POST /bdb/persons-2](https://docs.kycaid.com/risks-check/blacklist-databases/bdb-persons-2.md): Retrieve information on persons from the Kycaid blacklist databases using fuzzy search to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

### Documents

 - [POST /bdb/documents](https://docs.kycaid.com/risks-check/blacklist-databases/bdb-documents.md): Retrieve information on documents from the Kycaid blacklist databases to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

### Tax ID numbers

 - [POST /bdb/tax-ids](https://docs.kycaid.com/risks-check/blacklist-databases/bdb-tax-ids.md): Retrieve information on tax ID numbers from the Kycaid blacklist databases to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

## Adverse media check

Search and analyze public sources for negative news or reputational risks associated with an individual. It helps detect potential issues that might not yet be reflected in official government or regulatory databases.


### Adverse media check

 - [POST /services/amc](https://docs.kycaid.com/risks-check/adverse-media-check/amc.md): The adverse media check screens individuals against news articles. This service may help to identify potential involvement in financial crimes, serious offenses, political exposure, or reputational risks

## Crypto

Verify the risk profile of cryptocurrency addresses. Detect links to illicit wallets, mixing services, or high-risk exchanges to ensure the safety of digital asset transfers.


### Crypto address

 - [POST /services/crypto/address-verification](https://docs.kycaid.com/risks-check/crypto/crypto-address-verification.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Crypto transaction

 - [POST /services/crypto/transaction-verification](https://docs.kycaid.com/risks-check/crypto/crypto-transaction-verification.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## Phone numbers

Validate phone numbers and assess their technical risk level. Identify virtual numbers (VOIP), disposable SIMs, and ecarrier-specific data to flag potential fraudulent activity.


### Send SMS

 - [POST /services/phone-number/check/request](https://docs.kycaid.com/risks-check/phone-numbers/phone-number-send-sms.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Send PIN code from SMS

 - [POST /services/phone-number/check/submit-pin-code](https://docs.kycaid.com/risks-check/phone-numbers/phone-number-send-pin-code.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

## Transaction screening

Transaction screening allows for real-time analysis of financial operations based on your custom risk logic. Use this tool to evaluate payment parameters, such as directions and amounts, to automate decision-making and identify potentially suspicious activities.


### Submit transaction for screening

 - [POST /services/transaction-screening](https://docs.kycaid.com/risks-check/transaction-screening/submit-transaction.md): Use this endpoint to submit transaction data for screening. The system analyzes the payment parameters against your selected ruleset_id and delivers the result asynchronously to your callback_url. To identify the customer, you must provide either an internal applicant_id or your external_applicant_id.

## QES

Verify Qualified Electronic Signatures (QES) to confirm the authenticity and legal integrity of digitally signed documents.


### SmartID • Start

 - [POST /services/ua/smartid/start](https://docs.kycaid.com/risks-check/qes/qes-smartid-start.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### SmartID • Get status

 - [POST /services/ua/smartid/status](https://docs.kycaid.com/risks-check/qes/qes-smartid-get-status.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Diia.Signature • Start

 - [POST /services/ua/diia-signature/start](https://docs.kycaid.com/risks-check/qes/qes-diia-signature-start.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

### Diia.Signature • Get status

 - [POST /services/ua/diia-signature/status](https://docs.kycaid.com/risks-check/qes/qes-diia-signature-get-status.md): {% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

---
## Get business activities

**URL :** `https://docs.kycaid.com/knowledge-base/business-activities/get-business-activities.md`

# Get business activities

Retrieve a list of business activities and their identifiers from our system to use them while creating a KYB applicant (a company)

Endpoint: GET /business-activities
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `business_category_id` (string)
    A business category identifier for business activities, that may help to faster find a necessary business activity. A business category contains one or several business activities

  - `labels` (array)

  - `labels.label` (string)
    A name of a business category

  - `labels.language_code` (string)
    A language code of a label (name) of a business category. EN is for English, RU is for Russian, UK is for Ukrainian
    Enum: "EN", "RU", "UK"

  - `activities` (array)

  - `activities.business_activity_id` (string)
    A business activity identifier of a an object. The full list of business activities and their identifiers is accessible in “Business activities” section

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Get languages

**URL :** `https://docs.kycaid.com/knowledge-base/languages/get-languages.md`

# Get languages

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: GET /languages
Version: 1.0
Security: API-Key

---
## Get countries

**URL :** `https://docs.kycaid.com/knowledge-base/countries/get-countries.md`

# Get countries

Retrieve a list of countries and their codes from our system to use them for country-specific parameters

Endpoint: GET /countries
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `country_code` (string)
    A two-letter country code according to ISO 3166-2

  - `labels` (array)

  - `labels.language_code` (string)
    A language of an object. A two-letter language code according to ISO 639-1

  - `labels.label` (string)
    A name of a country

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## CPF number

**URL :** `https://docs.kycaid.com/non-doc/brazil/br-cpf.md`

# CPF number

The Brazil CPF verification service allows you to verify the identity of an individual in Brazil using their individual taxpayer identification number (Cadastro de Pessoas Físicas). The service returns the person’s full name, date of birth, and gender

Endpoint: GET /services/br/cpf/{cpf_number}
Version: 1.0
Security: API-Key

## Path parameters:

  - `cpf_number` (string, required)
    Brazilian individual taxpayer identification number (Cadastro de Pessoas Físicas), consisting of 11 numeric digits without formatting (no dots or hyphens)
    Example: "00388415129"

## Response 200 fields (application/json):

  - `validation` (object)

  - `validation.valid` (boolean)
    Example: true

  - `data` (object)

  - `data.number` (string)
    Brazilian individual taxpayer identification number (Cadastro de Pessoas Físicas), consisting of 11 numeric digits without formatting (no dots or hyphens)

  - `data.name` (string,null)
    The full name of a person, which includes a first and last name

  - `data.first_name` (string,null)
    The first name of a person

  - `data.middle_name` (string,null)
    The middle name of a person

  - `data.last_name` (string,null)
    The last name of a person

  - `data.dob` (string,null)
    The date of birth of a person, formatted as “YYYY-MM-DD” according to ISO 8601

  - `data.gender` (string,null)
    The gender of a person. M indicates male; F indicates female
    Enum: "M", "F"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 422 fields (application/json):

  - `validation` (object)

  - `validation.valid` (boolean)

  - `data` (object)

  - `data.cpf_number` (string)
    Example: "00388415129"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## CPF number (alternative)

**URL :** `https://docs.kycaid.com/non-doc/brazil/br-cpf-2.md`

# CPF number (alternative)

The alternative Brazil CPF verification service allows you to verify the identity of an individual in Brazil using their individual taxpayer identification number (Cadastro de Pessoas Físicas). The service returns the person’s full name, date of birth, and CPF registration status, including whether the CPF is active, suspended, or cancelled. No document upload is required for verification. This enables quick and automated identity checks against official records.

Endpoint: GET /services/br/cpf/2/{cpf_number}
Version: 1.0
Security: API-Key

## Path parameters:

  - `cpf_number` (string, required)
    Brazilian individual taxpayer identification number (Cadastro de Pessoas Físicas), consisting of 11 numeric digits without formatting (no dots or hyphens)
    Example: "00388415129"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 422 fields (application/json):

  - `validation` (object)

  - `validation.valid` (boolean)

  - `data` (object)

  - `data.cpf_number` (string)
    Example: "00388415129"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Aadhaar number

**URL :** `https://docs.kycaid.com/non-doc/india/in-aadhaar.md`

# Aadhaar number

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article

Endpoint: POST /services/in/aadhaar/generate-otp
Version: 1.0
Security: API-Key

---
## IIN (basic)

**URL :** `https://docs.kycaid.com/non-doc/kazakhstan/kz-iin-basic.md`

# IIN (basic)

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/kz/iin/request
Version: 1.0
Security: API-Key

---
## IIN (extended)

**URL :** `https://docs.kycaid.com/non-doc/kazakhstan/kz-iin-extended.md`

# IIN (extended)

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/kz/personal-data/request
Version: 1.0
Security: API-Key

---
## CURP

**URL :** `https://docs.kycaid.com/non-doc/mexico/mx-curp.md`

# CURP

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: GET /services/mx/curp/curp_number
Version: 1.0
Security: API-Key

---
## NIN

**URL :** `https://docs.kycaid.com/non-doc/nigeria/ng-nin.md`

# NIN

The Nigeria NIN (National Identification Number) service provides a method for checking and confirming person idenitity using their NIN. It utilizes the provided 11-digit NIN to query the official national database. The service returns a detailed response including the NIN holder's registered identity data (full name, date of birth, address, and gender) upon a successful match.

Endpoint: POST /services/ng/nin
Version: 1.0
Security: API-Key

## Request fields (application/json):

  - `nin_number` (string)
    The Nigerian National Identification Number (NIN), a unique 11-digit identifier issued by the National Identity Management Commission (NIMC)

## Response 200 fields (application/json):

  - `validation` (object)

  - `validation.valid` (boolean)
    Example: true

  - `data` (object)

  - `data.nin` (string)
    The Nigerian National Identification Number (NIN), a unique 11-digit identifier issued by the National Identity Management Commission (NIMC)

  - `data.first_name` (string,null)
    The first name of a person

  - `data.middle_name` (string,null)
    The middle name of a person

  - `data.last_name` (string,null)
    The last name of a person

  - `data.dob` (string,null)
    The date of birth of a person, formatted as “YYYY-MM-DD” according to ISO 8601

  - `data.phone` (string,null)
    The phone number of a person or a company

  - `data.email` (string,null)
    The email address of a person or a company

  - `data.gender` (string,null)
    The gender of a person. M indicates male; F indicates female
    Enum: "M", "F"

  - `data.residence_country` (string,null)
    A residence country of an object. A two-letter country code according to ISO 3166-2

  - `data.profile_image` (string)
    A profile image of a person in base64 binary format

  - `data.address` (object)

  - `data.address.country` (string,null)
    A country of an object. A two-letter country code according to ISO 3166-2

  - `data.address.state` (string,null)
    A state of a person or a company

  - `data.address.district` (string,null)
    The district (an area of a city) of an object

  - `data.address.address` (string,null)
    An address (a street name, a building number, and a unit number) of a person or a company

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 404 fields (application/json):

  - `validation` (object)

  - `validation.valid` (boolean)

  - `data` (object)

  - `data.nin` (string)
    The Nigerian National Identification Number (NIN), a unique 11-digit identifier issued by the National Identity Management Commission (NIMC)

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## DNI number (extended)

**URL :** `https://docs.kycaid.com/non-doc/peru/pe-dni-extended.md`

# DNI number (extended)

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: GET /services/pe/dni-extra/{dni_number}
Version: 1.0
Security: API-Key

## Path parameters:

  - `dni_number` (any, required)

---
## Türkiye Cumhuriyeti Kimlik Numarası

**URL :** `https://docs.kycaid.com/non-doc/turkey/tr-tckn.md`

# Türkiye Cumhuriyeti Kimlik Numarası

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/tr/identity-number
Version: 1.0
Security: API-Key

---
## eIDV

**URL :** `https://docs.kycaid.com/non-doc/usa/us-eidv.md`

# eIDV

The USA eIDV (electronic Identity Verification) service provides automated, remote identity verification for individuals within the United States. It utilizes a person's first name, last name, and date of birth to check against official records. The service returns a match score along with a detailed description of the verification outcome, enabling quick and reliable identity checks.

Endpoint: POST /services/us/eidv
Version: 1.0
Security: API-Key

## Request fields (application/json):

  - `first_name` (string, required)
    The first name of a person
    Example: "Josh"

  - `middle_name` (string,null)
    The middle name of a person

  - `last_name` (string, required)
    The last name of a person
    Example: "Coffey"

  - `dob` (string, required)
    The date of birth of a person, formatted as “YYYY-MM-DD” according to ISO 8601
    Example: "1976-02-21"

  - `address` (string,null)
    An address (a street name, a building number, and a unit number) of a person or a company

  - `city` (string,null)
    A city or a town of a person or a company

  - `state` (string,null)
    A state of a person or a company

  - `postal_code` (string,null)
    A postal code (zip code, postcode) of a person or a company

  - `phone` (string,null)
    The phone number of a person or a company

  - `email` (string,null)
    The email address of a person or a company

  - `ssn` (string,null)
    The US Social Security Number of a person (SSN). The value must be an unformatted string of digits, either 4 digits (partial) or exactly 9 digits (full). No dashes, spaces, or other characters are allowed

  - `drivers_license` (string,null)
    The unique driver identification number issued by a US state or territory. It is a mix of numbers and letters, and its format is state-dependent

## Response 200 fields (application/json):

  - `data` (object)

  - `data.match_score` (number,null)
    Overall identity match score

  - `data.name_match` (string,null)
    The type of match found for the person’s full name during US eIDV verification

- MATCH: The person’s full name has a total match against the record in the database
- PARTIAL_MATCH: The person’s full name address partially matches the record in the database
- NO_MATCH: The person’s full name address did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.dob_match` (string,null)
    The type of match found for the person’s date of birth during US eIDV verification

- MATCH: The person’s date of birth has a total match against the record in the database
- PARTIAL_MATCH: The person’s date of birth partially matches the record in the database
- NO_MATCH: The person’s date of birth did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.address_match` (string,null)
    The type of match found for the person’s address during US eIDV verification

- MATCH: The person’s address has a total match against the record in the database
- PARTIAL_MATCH: The person’s address partially matches the record in the database
- NO_MATCH: The person’s address did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.city_match` (string,null)
    The type of match found for the person’s city during US eIDV verification

- MATCH: The person’s city has a total match against the record in the database
- PARTIAL_MATCH: The person’s city partially matches the record in the database
- NO_MATCH: The person’s city did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.state_match` (string,null)
    The type of match found for the person’s state during US eIDV verification

- MATCH: The person’s state has a total match against the record in the database
- PARTIAL_MATCH: The person’s state partially matches the record in the database
- NO_MATCH: The person’s state did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.postal_code_match` (string,null)
    The type of match found for the person’s postal code (ZIP) during US eIDV verification

- MATCH: The person’s postal code (ZIP) has a total match against the record in the database
- PARTIAL_MATCH: The person’s postal code (ZIP) partially matches the record in the database
- NO_MATCH: The person’s postal code (ZIP) did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.phone_match` (string,null)
    The type of match found for the person’s phone number

- MATCH: The person’s phone number has a total match against the record in the database
- PARTIAL_MATCH: The person’s phone number partially matches the record in the database
- NO_MATCH: The person’s phone number did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.email_match` (string,null)
    The type of match found for the person’s email address during US eIDV verification

- MATCH: The person’s email address has a total match against the record in the database
- PARTIAL_MATCH: The person’s email address partially matches the record in the database
- NO_MATCH: The person’s email address did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.ssn_match` (string,null)
    The type of match found for the person’s Social Security Number (SSN) during US eIDV verification

- MATCH: The person’s SSN has a total match against the record in the database
- PARTIAL_MATCH: The person’s SSN partially matches the record in the database
- NO_MATCH: The person’s SSN did not match a record in the database
- null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

  - `data.drivers_license_match` (string,null)
    |  The type of match found for the person’s driver’s license number during US eIDV verification
- MATCH: The person’s driver’s license number has a total match against the record in the database - PARTIAL_MATCH: The person’s driver’s license number partially matches the record in the database - NO_MATCH: The person’s driver’s license number did not match a record in the database - null: No data was provided in the request
    Enum: "MATCH", "PARTIAL_MATCH", "NO_MATCH", null

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Create an address

**URL :** `https://docs.kycaid.com/objects/addresses/address-create.md`

# Create an address

Create and add an address object to an applicant or an affiliated person. Only one address per type may be added to an object

Endpoint: POST /addresses
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `address_id` (string)
    A unique identifier of an address object, that is assigned by our system after an address entity was created

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Update an address

**URL :** `https://docs.kycaid.com/objects/addresses/address-update.md`

# Update an address

Update records of an address object in our system

In case when an address becomes a part of a created verification, then our system will create a copy of an address object and will provide you with a different address_id in a response

Endpoint: PATCH /addresses/{address_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `address_id` (string, required)
    A unique identifier of an address object, that is assigned by our system after an address entity was created
    Example: "723f46ab04feb64f442946f2953a67eaecf7"

## Request fields (application/json):

  - `type` (string)
    A type of an address object. The possible types are:
* REGISTERED for the residential address of a person or an affiliated person, or the registered address of a company
* BUSINESS for the primary business location of a company
* ADDITIONAL for any other address associated with a person, an affiliated person, or a company
    Enum: "REGISTERED", "BUSINESS", "ADDITIONAL"

  - `full_address` (string,null)
    A full address of an object, including a street address, a unit, a city, a postal code, a country

  - `country` (string,null)
    A country of an object. A two-letter country code according to ISO 3166-2

  - `state` (string,null)
    A state of a person or a company

  - `region` (string,null)
    A region of a country of an object

  - `province` (string,null)
    A province (a sub-region of a country) of an object

  - `city` (string,null)
    A city or a town of a person or a company

  - `district` (string,null)
    The district (an area of a city) of an object

  - `address` (string,null)
    An address (a street name, a building number, and a unit number) of a person or a company

  - `postal_code` (string,null)
    A postal code (zip code, postcode) of a person or a company

  - `street_name` (string,null)
    A street name of an object

  - `building_number` (string,null)
    A number of a building of an object

  - `unit_number` (string,null)
    A number of a unit (flat, apartment) of an object

## Response 200 fields (application/json):

  - `address_id` (string)
    In case when an address becomes a part of a created verification, then our system will create a copy of an address object and provide you with a different address_id in a response

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Delete an address

**URL :** `https://docs.kycaid.com/objects/addresses/address-delete.md`

# Delete an address

Deletes an address object from our system

Please note, that addresses may be deleted only before a verification was created

Endpoint: DELETE /addresses/{address_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `address_id` (string, required)
    A unique identifier of an address object, that is assigned by our system after an address entity was created
    Example: "723f46ab04feb64f442946f2953a67eaecf7"

## Response 200 fields (application/json):

  - `address_id` (string)
    A unique identifier of an address object, that is assigned by our system after an address entity was created

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Create an affiliated person

**URL :** `https://docs.kycaid.com/objects/affiliated-persons/affiliated-person-create.md`

# Create an affiliated person

Create and add an affiliated person for an applicant object

Endpoint: POST /affiliated-persons
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `affiliated_person_id` (string)
    A unique identifier of an affiliated person object, that is assigned by our system after an affiliated person object was created with a “Create an affiliated person” request

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 404 fields (application/json):

  - `type` (string)
    Example: "not_found"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "applicant_id"

  - `errors.message` (string)
    Example: "Applicant was not found"

## Response 422 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "type"

  - `errors.message` (string)
    Example: "Type of affiliated person is required"

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "The authorised person is already exists for that applicant"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Update an affiliated person

**URL :** `https://docs.kycaid.com/objects/affiliated-persons/affiliated-person-update.md`

# Update an affiliated person

Update records of an affiliated person object in our system

Endpoint: PATCH /affiliated-persons/{affiliated_person_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `affiliated_person_id` (string, required)
    A unique identifier of an affiliated person object, that is assigned by our system after an affiliated person object was created with a “Create an affiliated person” request
    Example: "74cec9e50f844748be0bc321a2bf66638f54"

## Request fields (application/json):

  - `first_name` (string,null)
    The first name of a person

  - `last_name` (string,null)
    The last name of a person

  - `title` (string,null)
    A title of an authorised affiliated person object in a company

  - `share` (number,null)
    A share in percents of a beneficial affiliated person object in a company

  - `dob` (string,null)
    The date of birth of a person, formatted as “YYYY-MM-DD” according to ISO 8601

  - `residence_country` (string,null)
    A residence country of an object. A two-letter country code according to ISO 3166-2

  - `nationality` (string,null)
    A nationality country of a person. A two-letter country code according to ISO 3166-2

  - `email` (string,null)
    The email address of a person or a company

## Response 200 fields (application/json):

  - `affiliated_person_id` (string)
    A unique identifier of an affiliated person object, that is assigned by our system after an affiliated person object was created with a “Create an affiliated person” request

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 404 fields (application/json):

  - `type` (string)
    Example: "not_found"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "affiliated_person_id"

  - `errors.message` (string)
    Example: "Affiliated person was not found"

## Response 422 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "*"

  - `errors.message` (string)
    Example: "At least one parameter should be set"

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Delete an affiliated person

**URL :** `https://docs.kycaid.com/objects/affiliated-persons/affiliated-person-delete.md`

# Delete an affiliated person

Delete records of an affiliated person object from our system

Endpoint: DELETE /affiliated-persons/{affiliated_person_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `affiliated_person_id` (string, required)
    A unique identifier of an affiliated person object, that is assigned by our system after an affiliated person object was created with a “Create an affiliated person” request
    Example: "74cec9e50f844748be0bc321a2bf66638f54"

## Response 200 fields (application/json):

  - `affiliated_person_id` (string)
    A unique identifier of an affiliated person object, that is assigned by our system after an affiliated person object was created with a “Create an affiliated person” request

## Response 404 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "affiliated_person_id"

  - `errors.message` (string)
    Example: "Authorised person was not found"

## Response 422 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "affiliated_person_id\""

  - `errors.message` (string)
    Example: "Affiliated Person ID is not valid"

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Create an applicant

**URL :** `https://docs.kycaid.com/objects/applicants/applicant-create.md`

# Create an applicant

Create a new applicant object in the system

Endpoint: POST /applicants
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `applicant_id` (string)
    A unique identifier of an applicant, that is assigned by our system after an applicant object was created with a “Create an applicant” request

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 422 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "parameter_name"

  - `errors.message` (string)
    Example: "parameter_name is not valid"

## Response 429 fields (application/json):

  - `type` (string)
    Example: "limit_exceeded"

  - `errors` (array)

  - `errors.message` (string)
    Example: "The limit for creating applicants has been exceeded (last minute)"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Get an applicant

**URL :** `https://docs.kycaid.com/objects/applicants/applicant-get.md`

# Get an applicant

Get data on a created applicant

Endpoint: GET /applicants/{applicant_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `applicant_id` (string, required)
    A unique identifier of an applicant, that is assigned by our system after an applicant object was created with a “Create an applicant” request
    Example: "723f46ab04feb64f442946f2953a67eaecf7"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Update an applicant

**URL :** `https://docs.kycaid.com/objects/applicants/applicant-update.md`

# Update an applicant

Update data of a created applicant

Endpoint: PATCH /applicants/{applicant_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `applicant_id` (string, required)
    A unique identifier of an applicant, that is assigned by our system after an applicant object was created with a “Create an applicant” request
    Example: "723f46ab04feb64f442946f2953a67eaecf7"

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Create a document

**URL :** `https://docs.kycaid.com/objects/documents/document-create.md`

# Create a document

Create a new document object in our system

Endpoint: POST /documents
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `document_id` (string)
    A unique identifier of a document, that is assigned by our system after a document object was created with a “Create a document” request

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

---
## Get a document

**URL :** `https://docs.kycaid.com/objects/documents/document-get.md`

# Get a document

Get records of a created document object

Endpoint: GET /documents/{document_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `document_id` (string, required)
    A unique identifier of a document, that is assigned by our system after a document object was created with a “Create a document” request
    Example: "5f9aeb5e1f25e2441d182f56b6dcbfac12dd"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 404 fields (application/json):

  - `type` (string)
    Example: "not_found"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "document_id"

  - `errors.message` (string)
    Example: "Document was not found"

## Response 422 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "document_id"

  - `errors.message` (string)
    Example: "Document ID is not valid."

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Update a document

**URL :** `https://docs.kycaid.com/objects/documents/document-update.md`

# Update a document

Update records of a created document object

Endpoint: PATCH /documents/{document_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `document_id` (string, required)
    A unique identifier of a document, that is assigned by our system after a document object was created with a “Create a document” request
    Example: "5f9aeb5e1f25e2441d182f56b6dcbfac12dd"

## Request fields (application/json):

  - `type` (string)
    A type of a document object
    Enum: "ADDRESS_DOCUMENT", "AUTHORISED_PERSON", "BANK_STATEMENT", "COMPANY_LEGAL_ADDRESS", "COMPANY_OWNERSHIP", "CREDIT_CARD", "DOMESTIC_PASSPORT", "DRIVERS_LICENSE", "FINANCIAL_DOCUMENT", "FOREIGN_CITIZEN_PASSPORT", "GOVERNMENT_ID", "PASSPORT", "PERMANENT_RESIDENCE_PERMIT", "REFUGEE_CARD", "REGISTRATION_COMPANY", "SELFIE_IMAGE", "SELFIE_WITH_CREDIT_CARD", "SELFIE_WITH_DOCUMENT", "TAX_ID_NUMBER", "VIDEO"

  - `document_number` (string,null)
    A number of a document

  - `additional_number` (string,null)
    An additional number located on a document (e.g. tax ID number located on an ID card)

  - `issue_date` (string,null)
    An issue date of a document in YYYY-MM-DD format

  - `expiry_date` (string,null)
    The date of document expiration, formatted according to ISO 8601

  - `issuing_authority` (string,null)
    A name of a govenment entity that issues official documents

  - `income_sources` (array)
    Category of a person or an entity earnings
    Enum: "SALARY", "DIVIDENDS", "SALE_PROPERTY", "SAVINGS", "DIVORCE_SETTLEMENTS", "INHERITANCE", "LOAN", "INVESTMENTS", "OTHER"

  - `annual_income` (string,null)
    An annual income group that categorizes persons or entities based on their total yearly income. There are four groups available:
- ANNUAL_INCOME_GROUP_1: less than 50,000 EUR
- ANNUAL_INCOME_GROUP_2: between 50,000 and 100,000 EUR
- ANNUAL_INCOME_GROUP_3: between 100,000 and 300,000 EUR
- ANNUAL_INCOME_GROUP_4: more than 300,000 EUR
    Enum: "ANNUAL_INCOME_GROUP_1", "ANNUAL_INCOME_GROUP_2", "ANNUAL_INCOME_GROUP_3", "ANNUAL_INCOME_GROUP_4", null

  - `transaction_amount` (number,null)
    An amount of a financial transaction

  - `transaction_currency` (string,null)
    An amount of a financial transaction. A three-letter currency code according to ISO 4217. Ticker symbols are also accepted (e.g. BTC, ETH, SOL)

  - `transaction_datetime` (string,null)
    A date and time of a financial transaction in YYYY-MM-DD HH:mm:ss format

  - `transaction_purpose` (string,null)
    A definition of an intended reason or objective for a financial transaction

  - `origin_funds` (string,null)
    A source of financial resources

  - `card_number` (string,null)
    A number of a credit card for payments

  - `account_number` (string,null)
    A bank account number (e.g. IBAN)

  - `front_side_id` (string,null)
    A unique identifier of a document file, that is assigned by our system after a file object was created with a “Create a file” request for a specific side (page) of a document

  - `back_side_id` (string,null)
    A unique identifier of a document file, that is assigned by our system after a file object was created with a “Create a file” request for a specific side (page) of a document

  - `other_side_1_id` (string,null)
    A unique identifier of a document file, that is assigned by our system after a file object was created with a “Create a file” request for a specific side (page) of a document

  - `other_side_2_id` (string,null)
    A unique identifier of a document file, that is assigned by our system after a file object was created with a “Create a file” request for a specific side (page) of a document

  - `other_side_3_id` (string,null)
    A unique identifier of a document file, that is assigned by our system after a file object was created with a “Create a file” request for a specific side (page) of a document

## Response 200 fields (application/json):

  - `document_id` (string)
    A unique identifier of a document, that is assigned by our system after a document object was created with a “Create a document” request

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Delete a document

**URL :** `https://docs.kycaid.com/objects/documents/document-delete.md`

# Delete a document

Delete records of a created document object

Endpoint: DELETE /documents/{document_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `document_id` (string, required)
    A unique identifier of a document, that is assigned by our system after a document object was created with a “Create a document” request
    Example: "5f9aeb5e1f25e2441d182f56b6dcbfac12dd"

## Response 200 fields (application/json):

  - `document_id` (string)
    A unique identifier of a document, that is assigned by our system after a document object was created with a “Create a document” request

## Response 404 fields (application/json):

  - `type` (string)
    Example: "not_found"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "document_id"

  - `errors.message` (string)
    Example: "Document was not found"

## Response 409 fields (application/json):

  - `type` (string)
    Example: "delete_denied"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "document_id"

  - `errors.message` (string)
    Example: "Document under verification can not be deleted"

## Response 422 fields (application/json):

  - `type` (string)
    Example: "validation"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "document_id"

  - `errors.message` (string)
    Example: "Document ID is not valid."

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Create a file

**URL :** `https://docs.kycaid.com/objects/files/file-create.md`

# Create a file

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /files
Version: 1.0
Security: API-Key

---
## Update a file

**URL :** `https://docs.kycaid.com/objects/files/file-update.md`

# Update a file

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: PUT /files/file_id
Version: 1.0
Security: API-Key

---
## Get a form URL

**URL :** `https://docs.kycaid.com/objects/forms/form-get-url.md`

# Get a form URL

Retrieve a URL for a form

Endpoint: POST /forms/{form_id}/urls
Version: 1.0
Security: API-Key

## Path parameters:

  - `form_id` (string,null, required)
    A unique identifier of a form, assigned by our system after it is created in the Dashboard
    Example: "d87132ba092d8148ba1891736832d0451ac2"

## Request fields (application/json):

  - `applicant_id` (string)
    A unique identifier of an applicant, that is assigned by our system after an applicant object was created with a “Create an applicant” request

  - `external_applicant_id` (string,null)
    A unique identifier of your user in your system

  - `redirect_url` (string,null)
    The URL in your system to which a user will be redirected after completing and submitting a form

## Response 200 fields (application/json):

  - `form_id` (string,null)
    A unique identifier of a form, assigned by our system after it is created in the Dashboard

  - `form_url` (string)
    A one-time URL to a form that includes a form token. The form remains open for completion via the URL until a user completes it

  - `verificaiton_id` (string,null)
    A unique identifier for a verification, assigned by our system after a verification is created using the “Create a verification" request

  - `form_token` (string)
    A unique token for a form, generated by our system, and included as part of a form URL

  - `verification_attempts_left` (integer,null)
    A number of verification attempts available for a user, set in form settings in the Dashboard. A null value means “not limited”. It equals 0 if set in the settings

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Get forms

**URL :** `https://docs.kycaid.com/objects/forms/forms-get.md`

# Get forms

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: GET /forms
Version: 1.0
Security: API-Key

---
## Create a verification

**URL :** `https://docs.kycaid.com/objects/verifications/verification-create.md`

# Create a verification

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /verifications
Version: 1.0
Security: API-Key

---
## Get a verification

**URL :** `https://docs.kycaid.com/objects/verifications/verification-get.md`

# Get a verification

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: GET /verifications/{verification_id}
Version: 1.0
Security: API-Key

## Path parameters:

  - `verification_id` (any, required)

---
## Get a report

**URL :** `https://docs.kycaid.com/objects/verifications/verification-report-get.md`

# Get a report

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: GET /verifications/report
Version: 1.0
Security: API-Key

---
## Update verification status

**URL :** `https://docs.kycaid.com/objects/verifications/verification-update-status.md`

# Update verification status

This endpoint is used to programmatically change the status of an existing verification record. This is typically utilised by your systems to finalise or adjust a verification's outcome after review

Endpoint: POST /verifications/{verification_id}/status
Version: 1.0
Security: API-Key

## Path parameters:

  - `verification_id` (string,null, required)
    A unique identifier for a verification, assigned by our system after a verification is created using the “Create a verification" request
    Example: "d2177cdf067d424a221b5d045dc616bf81f9"

## Request fields (application/json):

  - `verification_status` (string, required)
    The status of the verification. This value is set automatically by our system, or manually in the Admin panel or the Dashboard after a review
- approved: a reviewed and approved verification
- declined: a reviewed and declined verification
    Enum: "approved", "declined"

  - `callback_enabled` (boolean)
    If set to true, our system will send the “Verification completed” callback for the specified verification
    Enum: true, false

  - `project_owner_email_enabled` (boolean)
    If set to true, a notification email regarding the status of the verification will be sent by our system to the project owner of the project
    Enum: true, false

  - `applicant_email_enabled` (boolean)
    If set to true, a notification email regarding the status of the verification will be sent by our system directly to the applicant who completed the form
    Enum: true, false

## Response 200 fields (application/json):

  - `status` (string)
    Example: "ok"

  - `data` (object)

  - `data.verification_id` (string,null)
    A unique identifier for a verification, assigned by our system after a verification is created using the “Create a verification" request

  - `data.verification_status` (string)
    The status of the verification. This value is set automatically by our system, or manually in the Admin panel or the Dashboard after a review
- approved: a reviewed and approved verification
- declined: a reviewed and declined verification
    Enum: "approved", "declined"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 404 fields (application/json):

  - `type` (string)
    Example: "not_found"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "verification_id"

  - `errors.message` (string)
    Example: "The verification was not found"

---
## Persons 1

**URL :** `https://docs.kycaid.com/risks-check/blacklist-databases/bdb-persons.md`

# Persons 1

Retrieve information on persons from the Kycaid blacklist databases to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

Endpoint: POST /bdb/persons
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `data` (array)

  - `data.full_name` (string,null)
    The full name of a person, which includes a first and last name

  - `data.origin_full_name` (string,null)
    A full name of an object, which consists of a first name and a last name, set in a native language

  - `data.first_name` (string,null)
    The first name of a person

  - `data.origin_first_name` (string,null)
    A first name of an object, set in a native language

  - `data.last_name` (string,null)
    The last name of a person

  - `data.origin_last_name` (string,null)
    A last name of an entity, set in a native language

  - `data.middle_name` (string,null)
    The middle name of a person

  - `data.origin_middle_name` (string,null)
    A middle name of an object, set in a native language

  - `data.residence_country` (string,null)
    A residence country of an object. A two-letter country code according to ISO 3166-2

  - `data.dob` (string,null)
    The date of birth of a person, formatted as “YYYY-MM-DD” according to ISO 8601

  - `data.gender` (string,null)
    The gender of a person. M indicates male; F indicates female
    Enum: "M", "F"

  - `data.description` (string,null)
    The detailed description of a status in blacklist databases

  - `data.bdb_name` (string,null)
    A name of a blacklist database

  - `data.bdb_type` (array)
    A type of blacklist databases to make a check
* SANCTIONS: Global and local sanctions
databases
* PEP: Databases of politically exposed persons (PEP)
* SELF_RESTICTED: Databases of persons asked for self-exclusion
* WANTED: Databases of persons being searched for by the police
* EXPIRED: Databases of stolen or lost documents
    Enum: "INTERNAL", "SANCTIONS", "PEP", "SELF_RESTICTED", "WANTED", "EXPIRED"

  - `data.accuracy` (integer)
    An accuracy of provided information (in percents)

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Persons 2

**URL :** `https://docs.kycaid.com/risks-check/blacklist-databases/bdb-persons-2.md`

# Persons 2

Retrieve information on persons from the Kycaid blacklist databases using fuzzy search to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

Endpoint: POST /bdb/persons-2
Version: 1.0
Security: API-Key

## Response 200 fields (application/json):

  - `data` (object)

  - `data.parameters` (object)

  - `data.parameters.name_match_threshold` (number)
    The minimum similarity score required to include a name in the search results. A higher value returns fewer, more exact matches, and a lower value returns more results with less similarity

  - `data.parameters.name_match_weight` (number)
    Influence of a name match on the total match score

  - `data.parameters.dob_match_enabled` (boolean)
    Enable or disable inclusion of a date of birth in the total match score
    Enum: true, false

  - `data.parameters.dob_match_weight` (number)
    Influence of a date of birth match on the total match score

  - `data.parameters.residence_country_match_enabled` (boolean)
    Enable or disable inclusion of a residence country match in the total match score
    Enum: true, false

  - `data.parameters.residence_country_match_weight` (number)
    Influence of a residence country match on the total match score

  - `data.parameters.gender_match_enabled` (boolean)
    Enable or disable inclusion of a gender match in the total match score
    Enum: true, false

  - `data.parameters.gender_match_weight` (number)
    Influence of a gender match on the total match score

  - `data.result` (array)

  - `data.result.full_name` (string,null)
    The full name of a person, which includes a first and last name

  - `data.result.origin_full_name` (string,null)
    A full name of an object, which consists of a first name and a last name, set in a native language

  - `data.result.first_name` (string,null)
    The first name of a person

  - `data.result.origin_first_name` (string,null)
    A first name of an object, set in a native language

  - `data.result.last_name` (string,null)
    The last name of a person

  - `data.result.origin_last_name` (string,null)
    A last name of an entity, set in a native language

  - `data.result.middle_name` (string,null)
    The middle name of a person

  - `data.result.origin_middle_name` (string,null)
    A middle name of an object, set in a native language

  - `data.result.dob` (string,null)
    The date of birth of a person, formatted as “YYYY-MM-DD” according to ISO 8601

  - `data.result.residence_country` (string,null)
    A residence country of an object. A two-letter country code according to ISO 3166-2

  - `data.result.gender` (string,null)
    The gender of a person. M indicates male; F indicates female
    Enum: "M", "F"

  - `data.result.description` (string,null)
    The detailed description of a status in blacklist databases

  - `data.result.bdb_name` (string,null)
    A name of a blacklist database

  - `data.result.aliases` (array)

  - `data.result.addresses` (array)

  - `data.result.name_match_score` (number)
    Relevance of a name match in a fuzzy search

  - `data.result.total_match_score` (number)
    The calculated relevance score for a search result

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Documents

**URL :** `https://docs.kycaid.com/risks-check/blacklist-databases/bdb-documents.md`

# Documents

Retrieve information on documents from the Kycaid blacklist databases to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

Endpoint: POST /bdb/documents
Version: 1.0
Security: API-Key

## Request fields (application/json):

  - `document_number` (string, required)
    A number of a document to check with blacklist databases

  - `document_type` (string)
    A type of a document
    Enum: "PASSPORT", "DOMESTIC_PASSPORT", "GOVERNMENT_ID", "DRIVERS_LICENSE", "FOREIGN_CITIZEN_PASSPORT", "PERMANENT_RESIDENCE_PERMIT", "REFUGEE_CARD"

  - `document_country` (string,null)
    An issuing country of a document. A two-letter country code according to ISO 3166-2

  - `bdb_types` (array)
    A type of blacklist databases to make a check
* SANCTIONS: Global and local sanctions
databases
* PEP: Databases of politically exposed persons (PEP)
* SELF_RESTICTED: Databases of persons asked for self-exclusion
* WANTED: Databases of persons being searched for by the police
* EXPIRED: Databases of stolen or lost documents
    Enum: "INTERNAL", "SANCTIONS", "PEP", "SELF_RESTICTED", "WANTED", "EXPIRED"

## Response 200 fields (application/json):

  - `data` (array)

  - `data.document_number` (string)
    A number of a document to check with blacklist databases

  - `data.document_type` (string)
    A type of a document
    Enum: "PASSPORT", "DOMESTIC_PASSPORT", "GOVERNMENT_ID", "DRIVERS_LICENSE", "FOREIGN_CITIZEN_PASSPORT", "PERMANENT_RESIDENCE_PERMIT", "REFUGEE_CARD"

  - `data.document_country` (string,null)
    An issuing country of a document. A two-letter country code according to ISO 3166-2

  - `data.description` (string,null)
    The detailed description of a status in blacklist databases

  - `data.bdb_name` (string,null)
    A name of a blacklist database

  - `data.bdb_type` (array)
    A type of blacklist databases to make a check
* SANCTIONS: Global and local sanctions
databases
* PEP: Databases of politically exposed persons (PEP)
* SELF_RESTICTED: Databases of persons asked for self-exclusion
* WANTED: Databases of persons being searched for by the police
* EXPIRED: Databases of stolen or lost documents
    Enum: "INTERNAL", "SANCTIONS", "PEP", "SELF_RESTICTED", "WANTED", "EXPIRED"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 422 fields (application/json):

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "document_number"

  - `errors.message` (string)
    Example: "document_number must have from 2 to 32 characters and only letters and numbers"

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Tax ID numbers

**URL :** `https://docs.kycaid.com/risks-check/blacklist-databases/bdb-tax-ids.md`

# Tax ID numbers

Retrieve information on tax ID numbers from the Kycaid blacklist databases to check for compliance with laws and regulations. Each response may have several objects, with one object per a blacklist

Endpoint: POST /bdb/tax-ids
Version: 1.0
Security: API-Key

## Request fields (application/json):

  - `tax_id_number` (string, required)
    A tax identification number

  - `tax_id_country` (string,null)
    An issuing country of a tax identification number. A two-letter country code according to ISO 3166-2

  - `bdb_types` (array)
    A type of blacklist databases to make a check
* SANCTIONS: Global and local sanctions
databases
* PEP: Databases of politically exposed persons (PEP)
* SELF_RESTICTED: Databases of persons asked for self-exclusion
* WANTED: Databases of persons being searched for by the police
* EXPIRED: Databases of stolen or lost documents
    Enum: "INTERNAL", "SANCTIONS", "PEP", "SELF_RESTICTED", "WANTED", "EXPIRED"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 429 fields (application/json):

  - `type` (string)
    Example: "flow"

  - `errors` (array)

  - `errors.parameter` (string)
    Example: "limit_exceeded"

  - `errors.message` (string)
    Example: "Rate limit exceeded"

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Adverse media check

**URL :** `https://docs.kycaid.com/risks-check/adverse-media-check/amc.md`

# Adverse media check

The adverse media check screens individuals against news articles. This service may help to identify potential involvement in financial crimes, serious offenses, political exposure, or reputational risks

Endpoint: POST /services/amc
Version: 1.0
Security: API-Key

## Request fields (application/json):

  - `primary_keywords` (array, required)
    A list of primary keywords. Articles must contain at least one of these keywords to be considered relevant to the search. A maximum of 20 primary keywords are permitted (including predefined keywords for individuals’s first name and last name)

  - `secondary_keywords` (array)
    A list of optional secondary keywords. Articles containing these keywords may see improved search result ranking. A maximum of 20 secondary keywords are permitted

  - `callback_url` (string, required)
    The endpoint URL where our system will send real-time webhook notifications via POST request. Your server should respond with a 200 OK status to acknowledge receipt

## Response 200 fields (application/json):

  - `status` (string)
    Example: "ok"

  - `data` (object)
    Example: {"primary_keywords":["John","Smith","corruption","money laundering","murder"],"secondary_keywords":["sanctioned","whistleblower","conviction"],"callback_url":"https://webhook.site/34374c1f-3b2b-4060-ad26-8a556478df03"}

  - `data.primary_keywords` (array)
    A list of primary keywords. Articles must contain at least one of these keywords to be considered relevant to the search. A maximum of 20 primary keywords are permitted (including predefined keywords for individuals’s first name and last name)
    Example: ["John","Smith","corruption","money laundering","murder"]

  - `data.secondary_keywords` (array)
    A list of optional secondary keywords. Articles containing these keywords may see improved search result ranking. A maximum of 20 secondary keywords are permitted
    Example: ["sanctioned","whistleblower","conviction"]

  - `data.callback_url` (string)
    The endpoint URL where our system will send real-time webhook notifications via POST request. Your server should respond with a 200 OK status to acknowledge receipt
    Example: "https://webhook.site/34374c1f-3b2b-4060-ad26-8a556478df03"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## Crypto address

**URL :** `https://docs.kycaid.com/risks-check/crypto/crypto-address-verification.md`

# Crypto address

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/crypto/address-verification
Version: 1.0
Security: API-Key

---
## Crypto transaction

**URL :** `https://docs.kycaid.com/risks-check/crypto/crypto-transaction-verification.md`

# Crypto transaction

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/crypto/transaction-verification
Version: 1.0
Security: API-Key

---
## Send SMS

**URL :** `https://docs.kycaid.com/risks-check/phone-numbers/phone-number-send-sms.md`

# Send SMS

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/phone-number/check/request
Version: 1.0
Security: API-Key

---
## Send PIN code from SMS

**URL :** `https://docs.kycaid.com/risks-check/phone-numbers/phone-number-send-pin-code.md`

# Send PIN code from SMS

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/phone-number/check/submit-pin-code
Version: 1.0
Security: API-Key

---
## Submit transaction for screening

**URL :** `https://docs.kycaid.com/risks-check/transaction-screening/submit-transaction.md`

# Submit transaction for screening

Use this endpoint to submit transaction data for screening. The system analyzes the payment parameters against your selected ruleset_id and delivers the result asynchronously to your callback_url. To identify the customer, you must provide either an internal applicant_id or your external_applicant_id.

Endpoint: POST /services/transaction-screening
Version: 1.0
Security: API-Key

## Request fields (application/json):

  - `applicant_id` (string)
    A unique identifier of an applicant, that is assigned by our system after an applicant object was created with a “Create an applicant” request

  - `external_applicant_id` (string,null)
    A unique identifier of your user in your system

  - `external_applicant_registered_at` (string)
    The date and time of user registration in the customer's system. Must be in UTC and follow the YYYY-MM-DD hh:mm:ss format. Cannot be a future date

  - `transaction` (object)

  - `transaction.direction` (string)
    Direction of the transaction (relative to user's account). Value must be in lowercase
    Enum: "incoming", "outgoing"

  - `transaction.amount` (string)
    Exact amount of the transaction stored as decimal(36,18). Must be sent as a string to preserve 18-decimal precision and prevent floating-point errors

  - `transaction.asset` (string)
    Ticker symbol of the asset. Use ISO 4217 for fiat (e.g., USD) or common ticker symbols for crypto (e.g., BTC, USDT, stETH)

  - `transaction.created_at` (string)
    The date and time when the transaction was created in the customer's system. Must be in UTC and follow the YYYY-MM-DD hh:mm:ss format. Cannot be a future date

  - `ruleset_id` (string)
    The unique 36-character hexadecimal identifier of the screening ruleset. This ID is automatically generated after you create a ruleset in the Dashboard. It determines which ruleset will be applied to the transaction

## Response 200 fields (application/json):

  - `status` (string)
    Example: "ok"

  - `data` (object)

  - `data.service_request_id` (string)
    Example: "6bff21e17da144418b7643267ba4502930a9"

## Response 400 fields (application/json):

  - `type` (string)
    Example: "bad_request"

  - `errors` (array)

## Response 402 fields (application/json):

  - `type` (string)
    Example: "insufficient_funds"

  - `errors` (array)

## Response 500 fields (application/json):

  - `type` (string)
    Example: "internal_server"

  - `errors` (array)

---
## SmartID • Start

**URL :** `https://docs.kycaid.com/risks-check/qes/qes-smartid-start.md`

# SmartID • Start

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/ua/smartid/start
Version: 1.0
Security: API-Key

---
## SmartID • Get status

**URL :** `https://docs.kycaid.com/risks-check/qes/qes-smartid-get-status.md`

# SmartID • Get status

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/ua/smartid/status
Version: 1.0
Security: API-Key

---
## Diia.Signature • Start

**URL :** `https://docs.kycaid.com/risks-check/qes/qes-diia-signature-start.md`

# Diia.Signature • Start

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/ua/diia-signature/start
Version: 1.0
Security: API-Key

---
## Diia.Signature • Get status

**URL :** `https://docs.kycaid.com/risks-check/qes/qes-diia-signature-get-status.md`

# Diia.Signature • Get status

{% admonition type="info" name="Content migration in progress" %}
  Please refer to the legacy documentation for this article
{% /admonition %}

Endpoint: POST /services/ua/diia-signature/status
Version: 1.0
Security: API-Key

---
