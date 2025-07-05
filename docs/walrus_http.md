# Walrus Client Daemon Mode & HTTP API

In addition to the CLI and JSON modes, the Walrus client offers a **daemon mode**. In this mode, it runs a simple web server offering HTTP interfaces to store and read blobs in an aggregator and publisher role respectively. We also offer public aggregator and publisher services to try the Walrus HTTP APIs without the need to run a local client. See how to operate an aggregator or publisher in the operator documentation.

---

## HTTP API Usage

For the following examples, we assume you set the `AGGREGATOR` and `PUBLISHER` environment variables to your desired aggregator and publisher, respectively. For example, the instances run by Mysten Labs on Walrus Testnet (see below for further public options):

```sh
AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
PUBLISHER=https://publisher.walrus-testnet.walrus.space
```

---

## API Specification

Walrus aggregators and publishers expose their API specifications at the path `/v1/api`. You can view this in the browser, for example, at:

- [https://aggregator.walrus-testnet.walrus.space/v1/api](https://aggregator.walrus-testnet.walrus.space/v1/api)

---

## Store

You can interact with the daemon through simple HTTP PUT requests. For example, with cURL, you can store blobs using a publisher or daemon as follows:

```sh
# Store the string `some string` for 1 storage epoch
curl -X PUT "$PUBLISHER/v1/blobs" -d "some string"

# Store file `some/file` for 5 storage epochs
curl -X PUT "$PUBLISHER/v1/blobs?epochs=5" --upload-file "some/file"

# Store file `some/file` and send the blob object to $ADDRESS
curl -X PUT "$PUBLISHER/v1/blobs?send_object_to=$ADDRESS" --upload-file "some/file"

# Store file `some/file` as a deletable blob, instead of a permanent one and send the blob object to $ADDRESS
curl -X PUT "$PUBLISHER/v1/blobs?deletable=true&send_object_to=$ADDRESS" --upload-file "some/file"
```

The store HTTP API endpoints return information about the blob stored in JSON format. When a blob is stored for the first time, a `newlyCreated` field contains information about the new blob:

```json
{
  "newlyCreated": {
    "blobObject": {
      "id": "0xe91eee8c5b6f35b9a250cfc29e30f0d9e5463a21fd8d1ddb0fc22d44db4eac50",
      "registeredEpoch": 34,
      "blobId": "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
      "size": 17,
      "encodingType": "RS2",
      "certifiedEpoch": 34,
      "storage": {
        "id": "0x4748cd83217b5ce7aa77e7f1ad6fc5f7f694e26a157381b9391ac65c47815faf",
        "startEpoch": 34,
        "endEpoch": 35,
        "storageSize": 66034000
      },
      "deletable": false
    },
    "resourceOperation": {
      "registerFromScratch": {
        "encodedLength": 66034000,
        "epochsAhead": 1
      }
    },
    "cost": 132300
  }
}
```

When the publisher finds a certified blob with the same blob ID and a sufficient validity period, it returns an `alreadyCertified` JSON structure:

```json
{
  "alreadyCertified": {
    "blobId": "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
    "event": {
      "txDigest": "4XQHFa9S324wTzYHF3vsBSwpUZuLpmwTHYMFv9nsttSs",
      "eventSeq": "0"
    },
    "endEpoch": 35
  }
}
```

The field `event` returns the Sui event ID that can be used to find the transaction that created the Sui Blob object on the Sui explorer or using a Sui SDK.

---

## Read

Blobs may be read from an aggregator or daemon using HTTP GET using their blob ID. For example, the following cURL command reads a blob and writes it to an output file:

```sh
curl "$AGGREGATOR/v1/blobs/<some blob ID>" -o <some file name>
```

Alternatively, you may print the contents of a blob in the terminal with the cURL command:

```sh
curl "$AGGREGATOR/v1/blobs/<some blob ID>"
```

### Content Sniffing

Modern browsers will attempt to sniff the content type for such resources, and will generally do a good job of inferring content types for media. However, the aggregator on purpose prevents such sniffing from inferring dangerous executable types such as JavaScript or style sheet types.

Blobs may also be read by using the object ID of a Sui blob object or a shared blob. For example, the following cURL command downloads the blob corresponding to a Sui blob with a specific object ID:

```sh
curl "$AGGREGATOR/v1/blobs/by-object-id/<object-id>" -o <some file name>
```

Downloading blobs by object ID allows the use of attributes to set some HTTP headers. The aggregator recognizes the attribute keys `content-disposition`, `content-encoding`, `content-language`, `content-location`, `content-type`, and `link`, and when present returns the values in the corresponding HTTP headers.

---

## Using a Public Aggregator or Publisher

For some use cases (e.g., a public website), or to just try out the HTTP API, a publicly accessible aggregator and/or publisher is required. On Walrus Testnet, many entities run public aggregators and publishers. On Mainnet, there are no public publishers without authentication, as they consume both SUI and WAL.

See the following subsections for public aggregators on Mainnet and public aggregators and publishers on Testnet. We also provide the operator lists in JSON format.

---

### Mainnet Aggregators

The following is a list of known public aggregators on Walrus Mainnet; they are checked periodically, but each of them may still be temporarily unavailable:

- https://agg.walrus.eosusa.io
- https://aggregator.mainnet.walrus.mirai.cloud
- https://aggregator.suicore.com
- https://aggregator.walrus-mainnet.tududes.com
- https://aggregator.walrus-mainnet.walrus.space
- https://aggregator.walrus.atalma.io
- https://aggregator.walrus.mainnet.mozcomputing.dev
- https://aggregator.walrus.silentvalidator.com
- https://mainnet-aggregator.hoh.zone
- https://mainnet-aggregator.walrus.graphyte.dev
- https://mainnet-walrus-aggregator.kiliglab.io
- https://sm1-walrus-mainnet-aggregator.stakesquid.com
- https://sui-walrus-mainnet-aggregator.bwarelabs.com
- https://suiftly.mhax.io
- https://wal-aggregator-mainnet.staketab.org
- https://walmain.agg.chainflow.io
- https://walrus-agg.mainnet.obelisk.sh
- https://walrus-aggregator-mainnet.chainode.tech:9002
- https://walrus-aggregator.brightlystake.com
- https://walrus-aggregator.chainbase.online
- https://walrus-aggregator.n1stake.com
- https://walrus-aggregator.natsai.xyz
- https://walrus-aggregator.rockfin.io
- https://walrus-aggregator.rubynodes.io
- https://walrus-aggregator.stakely.io
- https://walrus-aggregator.stakin-nodes.com
- https://walrus-aggregator.staking4all.org
- https://walrus-aggregator.starduststaking.com
- https://walrus-aggregator.talentum.id
- https://walrus-aggregator.thcloud.ai
- https://walrus-aggregator.thepassivetrust.com
- https://walrus-cache-mainnet.latitude.sh
- https://walrus-cache-mainnet.overclock.run
- https://walrus-main-aggregator.4everland.org
- https://walrus-mainnet-aggregator-1.zkv.xyz
- https://walrus-mainnet-aggregator.crouton.digital
- https://walrus-mainnet-aggregator.dzdaic.com
- https://walrus-mainnet-aggregator.everstake.one
- https://walrus-mainnet-aggregator.imperator.co
- https://walrus-mainnet-aggregator.luckyresearch.org
- https://walrus-mainnet-aggregator.nami.cloud
- https://walrus-mainnet-aggregator.nodeinfra.com
- https://walrus-mainnet-aggregator.redundex.com
- https://walrus-mainnet-aggregator.rpc101.org
- https://walrus-mainnet-aggregator.stakecraft.com
- https://walrus-mainnet-aggregator.stakeengine.co.uk
- https://walrus-mainnet-aggregator.stakingdefenseleague.com.
- https://walrus-mainnet-aggregator.trusted-point.com
- https://walrus.aggregator.stakepool.dev.br
- https://walrus.blockscope.net
- https://walrus.globalstake.io
- https://walrus.lakestake.io
- https://walrus.lionscraft.blockscape.network:9000
- https://walrus.prostaking.com:9443
- https://walrus.veera.com
- https://walrusagg.pops.one
- http://walrus-aggregator.winsnip.site:9000
- http://walrus.equinoxdao.xyz:9000
- http://67.220.194.10:9000

---

### Testnet Aggregators

The following is a list of known public aggregators on Walrus Testnet; they are checked periodically, but each of them may still be temporarily unavailable:

- https://agg.test.walrus.eosusa.io
- https://aggregator.testnet.walrus.atalma.io
- https://aggregator.testnet.walrus.mirai.cloud
- https://aggregator.walrus-01.tududes.com
- https://aggregator.walrus-testnet.walrus.space
- https://aggregator.walrus.banansen.dev
- https://aggregator.walrus.testnet.mozcomputing.dev
- https://sm1-walrus-testnet-aggregator.stakesquid.com
- https://sui-walrus-tn-aggregator.bwarelabs.com
- https://suiftly-testnet-agg.mhax.io
- https://testnet-aggregator-walrus.kiliglab.io
- https://testnet-aggregator.walrus.graphyte.dev
- https://testnet-walrus.globalstake.io
- https://testnet.aggregator.walrus.silentvalidator.com
- https://wal-aggregator-testnet.staketab.org
- https://walrus-agg-test.bucketprotocol.io
- https://walrus-agg-testnet.chainode.tech:9002
- https://walrus-agg.testnet.obelisk.sh
- https://walrus-aggregator-testnet.cetus.zone
- https://walrus-aggregator-testnet.haedal.xyz
- https://walrus-aggregator-testnet.n1stake.com
- https://walrus-aggregator-testnet.staking4all.org
- https://walrus-aggregator-testnet.suisec.tech
- https://walrus-aggregator.thcloud.dev
- https://walrus-test-aggregator.thepassivetrust.com
- https://walrus-testnet-aggregator-1.zkv.xyz
- https://walrus-testnet-aggregator.brightlystake.com
- https://walrus-testnet-aggregator.chainbase.online
- https://walrus-testnet-aggregator.chainflow.io
- https://walrus-testnet-aggregator.crouton.digital
- https://walrus-testnet-aggregator.dzdaic.com
- https://walrus-testnet-aggregator.everstake.one
- https://walrus-testnet-aggregator.luckyresearch.org
- https://walrus-testnet-aggregator.natsai.xyz
- https://walrus-testnet-aggregator.nodeinfra.com
- https://walrus-testnet-aggregator.nodes.guru
- https://walrus-testnet-aggregator.redundex.com
- https://walrus-testnet-aggregator.rpc101.org
- https://walrus-testnet-aggregator.rubynodes.io
- https://walrus-testnet-aggregator.stakecraft.com
- https://walrus-testnet-aggregator.stakeengine.co.uk
- https://walrus-testnet-aggregator.stakely.io
- https://walrus-testnet-aggregator.stakeme.pro
- https://walrus-testnet-aggregator.stakin-nodes.com
- https://walrus-testnet-aggregator.stakingdefenseleague.com.
- https://walrus-testnet-aggregator.starduststaking.com
- https://walrus-testnet-aggregator.talentum.id
- https://walrus-testnet-aggregator.trusted-point.com
- https://walrus-testnet.blockscope.net
- https://walrus-testnet.lionscraft.blockscape.network:9000
- https://walrus-testnet.validators.services.kyve.network/aggregate
- https://walrus-testnet.veera.com
- https://walrus-tn.juicystake.io:9443
- https://walrus.testnet.aggregator.stakepool.dev.br
- https://walrusagg.testnet.pops.one
- http://cs74th801mmedkqu25ng.bdnodes.net:8443
- http://walrus-storage.testnet.nelrann.org:9000
- http://walrus-testnet.equinoxdao.xyz:9000
- http://walrus-testnet.suicore.com:9000

---

### Testnet Publishers

The following is a list of known public publishers on Walrus Testnet; they are checked periodically, but each of them may still be temporarily unavailable:

- https://publisher.testnet.walrus.atalma.io
- https://publisher.walrus-01.tududes.com
- https://publisher.walrus-testnet.walrus.space
- https://publisher.walrus.banansen.dev
- https://sm1-walrus-testnet-publisher.stakesquid.com
- https://sui-walrus-testnet-publisher.bwarelabs.com
- https://suiftly-testnet-pub.mhax.io
- https://testnet-publisher-walrus.kiliglab.io
- https://testnet-publisher.walrus.graphyte.dev
- https://testnet.publisher.walrus.silentvalidator.com
- https://wal-publisher-testnet.staketab.org
- https://walrus-publish-testnet.chainode.tech:9003
- https://walrus-publisher-testnet.n1stake.com
- https://walrus-publisher-testnet.staking4all.org
- https://walrus-publisher.rubynodes.io
- https://walrus-publisher.thcloud.dev
- https://walrus-testnet-published.luckyresearch.org
- https://walrus-testnet-publisher-1.zkv.xyz
- https://walrus-testnet-publisher.chainbase.online
- https://walrus-testnet-publisher.crouton.digital
- https://walrus-testnet-publisher.dzdaic.com
- https://walrus-testnet-publisher.everstake.one
- https://walrus-testnet-publisher.nami.cloud
- https://walrus-testnet-publisher.natsai.xyz
- https://walrus-testnet-publisher.nodeinfra.com
- https://walrus-testnet-publisher.nodes.guru
- https://walrus-testnet-publisher.redundex.com
- https://walrus-testnet-publisher.rpc101.org
- https://walrus-testnet-publisher.stakecraft.com
- https://walrus-testnet-publisher.stakeengine.co.uk
- https://walrus-testnet-publisher.stakely.io
- https://walrus-testnet-publisher.stakeme.pro
- https://walrus-testnet-publisher.stakingdefenseleague.com.
- https://walrus-testnet-publisher.starduststaking.com
- https://walrus-testnet-publisher.trusted-point.com
- https://walrus-testnet.blockscope.net:11444
- https://walrus-testnet.validators.services.kyve.network/publish
- https://walrus.testnet.publisher.stakepool.dev.br
- http://walrus-publisher-testnet.cetus.zone:9001
- http://walrus-publisher-testnet.haedal.xyz:9001
- http://walrus-publisher-testnet.suisec.tech:9001
- http://walrus-storage.testnet.nelrann.org:9001
- http://walrus-testnet.equinoxdao.xyz:9001
- http://walrus-testnet.suicore.com:9001
- http://walrus.testnet.pops.one:9001
- http://waltest.chainflow.io:9001

Most of these limit requests to 10 MiB by default. If you want to upload larger files, you need to run your own publisher or use the CLI.
