# Telnet Chat
This here is my stab at creating a dumb TCP chat server, chat client, and rest server to query/post messages.

## Libraries used
- [Express](https://expressjs.com/) for API server needs
- [Faker](https://github.com/ai/nanoid/) for generating random usernames on the fly
- [Nanoid](https://github.com/marak/Faker.js/) for generating random IDs on the fly
- [Jsonschema](https://github.com/tdegrunt/jsonschema#readme) for that sweet, sweet JSON validation
- [Lodash](https://lodash.com/docs/4.17.15) because working with collections is better in Lodash

## Features
- A chat server that shuttles messages and different events to the correct clients
- A chat client that can send/receive messages, change chat rooms, and change a user's nickname
- Log file support for the chat server. All events get written to it.
- Config file support for determining where the server/client should connect to.
- An HTTP API that allows folks to query/filter messages and even write one to the chat server.

## Usage
First things first, I didn't bake in almost _any_ error handling, connection handling, etc. This is some rough stuff (but it works!). So with that being said, the chat server has to be kicked off first for any clients to work. If you try to connect to the chat server (either through the chat client or API) without it being on, it'll blow up.

### Chat Server
- `node chat-server.js` will bring up your chat server (Note: I developed this using Node 15.14.0; can't say how backwards compatible some of my decisions were). The chat server will spit out logs for events when they happen.
- Currently the server doesn't handle client disconnects — it won't go down, but there is no cleanup involved (which isn't great).

### Chat Client
- `node chat-client.js` will bring up a client.
- You can send a message by typing any ol' string (except if it starts with a slash, `/`) and hitting enter. There's a nice little bug where if you enter some text and backspace, the prompt with the room and user information disappears. Fun!
- You can change your username by entering `/changename [insert name here]`. If somebody else has that username, the server'll spit back an error.
- You can change the room you're in with `/join [insert room here]`. You'll only send/receive messages from others in the room (or server messages).

### HTTP Server
- `node chat-rest-server.js` will bring up the HTTP server. It too will log stuff out. By default it'll start up on port 8080 on your localhost.
- You can `GET /messages` to retrieve all messages. It does this by reading the chat log. Now that I think about it, I haven't tested if this works when the log file doesn't exist :thinking_face:. You can also filter by including various query params in your request. For example, if you wanted all the messages sent to the general channel, you would `GET /messages?chatroom=general`. There's no validation on the query params. You can also filter by _everything_ in an event body in the log.
- You can `POST /messages` to write to the chat server and broadcast it out to a room. Here's an example post body:

```json
{
  "type": "message",
  "payload": "This is pretty shady",
  "username": "I.m.user",
  "chatroom": "general",
  "uid": "I.m.user"
}
```
On success, you should receive the same body back with timestamp and id properties. There _is_ a little validation here, check the chat server source code for more info. When validation fails you should get a 400 response back.

### Config File
If you write a `config.json` that contains `port`,  `ipaddr`, and `logfile` properties, those'll be used for the chat client and chat server connection info. If you don't, the system will fall back to a default. Not much validation or error handling here either. 

## Reflection
This was fun! I had never written up a TCP chat server before. It was interesting how much can go into a relatively "simple" program. I could see the scope of my work getting bigger and bigger with every little feature I wanted to add. And this doesn't include any code quality or quality of life pieces in the code. It is the absolute minimum of a viable chat server.

Things that could have (should have) been done, but weren't:
- Error handling EVERYWHERE. I don't listen for particular stream events, I don't try/catch around critical bits of code, there is virtually no validation/sanitization around user inputs, etc. The list goes on for quality stuff I could have baked in.
- Tests! Writing tests probably would've made my life easier, but I've been so disconnected from the JS world for a while that I don't know what idiomatic testing looks like in that context.
- Nicer UI would've been cool. I tried looking at [blessed](https://github.com/chjj/blessed) but it felt pretty outta my depth. Maybe next time.
- Code scaffolding/structure — it's easy to get lost in the jumble of files. Modularizing some might've made my life easier and the code more legible.
- Consistent style aand conventions are something for v2. Again, I've been pretty divorced from JS land and it shows with the change of.. tone(? for lack of a better word) throughout.
