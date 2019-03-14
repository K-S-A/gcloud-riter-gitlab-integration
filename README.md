### Deploy

```
gcloud functions deploy http --env-vars-file .env.yml --trigger-http --runtime nodejs8
```

### Functions emulator

##### Start

```
functions-emulator start
```

##### Stop

```
functions-emulator stop
```

##### Call function

```
functions-emulator call http --data '{"object_attributes": {"description": "Description...", "title": "Hello from CLI", "action": "fake", "iid": 101, "source_branch": "meeting-with-the-white-walkers/test-api"}}'
```

##### Deploy locally

```
functions-emulator deploy http --env-vars-file .env.yml --trigger-http
```


##### Read logs

```
functions-emulator logs read
```

##### Inspect in browser console

```
functions-emulator inspect http
```

##### Run tests

```
npm test
```
