# Up Bank - YNAB Transformer

Automatically add your up transactions to YNAB.

## Setup

### Requirements

- AWS Account
- Up Bank Account
- YNAB Account

### Checking out

```bash
git clone https://github.com/daveallie/up-bank-ynab-transformer
cd up-bank-ynab-transformer
yarn
```

### Getting API Keys

#### Up Bank API

If you already have an Up Bank API key, you can skip this section.

Head to https://api.up.com.au/getting_started and follow the instructions to get a key. Note it down.

#### YNAB API Key

Head to https://app.youneedabudget.com/settings/developer and create a new Personal Access Token.
Note it down.

### Setting Up Account Mappings

1. Copy `src/accountMapping.example.json` to `src/accountMapping.json`.
2. In `accountMapping.json`, leave the transactional and catchall account but create one entry per Up Saver you'd like 
   to map out. Any savers you don't explicitly map out will have their transactions go into the catchall account. The 
   names are aesthetic and just help you to connect the accounts, they don't need to match anything else.
3. Run the following, replacing `<UP_API_KEY>` with your Up API Key.
```bash
curl https://api.up.com.au/api/v1/accounts -G -H 'Authorization: Bearer <UP_API_KEY>'
# Response should contain one transactional account, and as many savers as you have.
```
4. For the transactional account and each saver you have in `accountMapping.json`, replace the `upId` with the relevant
   `id` from the curl response.
5. In YNAB, create a new account for the Up Transaction account, each Saver you have mapped and a catchall account.
6. For each mapping in `accountMapping.json`, open the YNAB account, your URL should look like 
   `https://app.youneedabudget.com/zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz/accounts/yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy`.
   Take the `yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy` portion and set the `ynabId` in `accountMapping.json`.

### Env File

1. Copy `.env.example` to `.env`
2. Leave `UP_WEBHOOK_SECRET` unpopulated (we will populate it as part of the first deployment).
3. Populate the other fields.
   - You can get your YNAB Budget ID by visiting you budget in YNAB. Your URL will look like
     `https://app.youneedabudget.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. The `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
     portion is your YNAB Budget ID.

### Deploying

If you have specific AWS credentials for deploying this, please replace the value of `profile` in `serverless.yml`. If
you don't, then remove the `profile` config entirely.

#### First Deployment

You'll need to do an additional deployment the first time you deploy in order to get the API Gateway URL and create the
webhook in Up.

1. Run `yarn sls deploy`.
2. When it succeeds, you'll see:
```
Service Information
service: up-bank-ynab-transformer
stage: prod
region: us-east-1
stack: up-bank-ynab-transformer-prod
resources: 12
api keys:
  None
endpoints:
  POST - https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod/webhook/up
functions:
  upWebhookHandler: up-bank-ynab-transformer-prod-upWebhookHandler
layers:
  None
```
3. Note down the POST endpoint value (e.g. `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod/webhook/up`).
4. Run the following, replacing `<UP_API_KEY>` with your Up API Key, and `<ENDPOINT>` with the POST endpoint.
```bash
curl https://api.up.com.au/api/v1/webhooks \
  -XPOST \
  -H 'Authorization: Bearer <UP_API_KEY>' \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "data": {
      "attributes": {
        "url": "<ENDPOINT>",
        "description": "Prod YNAB webook"
      }
    }
  }'
```
5. The response will contain a `secretKey`. Set the value of `UP_WEBHOOK_SECRET` in `.env` with this value.
6. Run `yarn sls deploy` again.

#### Future Deployments

Run `yarn sls deploy`.

## Development

PRs are welcome 🙂. Feel free to raise an issue if you find any problems/have questions.
