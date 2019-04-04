### sails-helper

### usage
```
npm install sails-helper
```

###changelog v2:

#### breaking changes
requestLogger requires a config object as argument.

```
// Default
require('sails-helper').requestLogger()

// To initialize with kinesis
require('sails-helper').requestLogger({
    kinesis: {
        enabled: true,
        PartitionKey: 'cb',
        StreamName: 'streamer',
        aws: {
            accessKeyId: 'accesskeyId',
            secretAccessKey: 'secretKey',
            region: "ap-southeast-1"
        }
});
```