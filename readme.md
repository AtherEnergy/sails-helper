### sails-helper

### usage
```
npm install sails-helper
```

### change v3
- cleanup logging
- move kinesis setup to business-stack-generator


### changelog v2:

2.1 - formatNumber added
This can be used to format large numbers into a format that is super easy for humans to read. 
For eg 
- 10000 can be 10,000 or 10k 
- 1000000 can be 1M or 10 lakhs

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