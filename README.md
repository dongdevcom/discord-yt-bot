# DiscordYTBot

A Discord bot for playing music from YouTube (and SoundCloud) in your server’s voice channels.

## Features

- Play music from YouTube and SoundCloud
- Slash command support
- Filter banned words and invitation spam
- Dockerized for easy deployment

## Requirements

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- A Discord account with permission to create bots

## Setup & Usage

1. **Create a Discord Application**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications?new_application=true)
   - Create a new application and add a bot user
   - Under "OAuth2 > URL Generator":
     - Scopes: `bot`, `applications.commands`
     - Bot Permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`, `Connect`, `Speak`, `Manage Messages`

2. **Clone this repository**
   ```
   git clone https://github.com/dongcodebmt/discord-yt-bot.git
   cd discord-yt-bot
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your bot token and other required values

4. **Add YouTube cookie**
   - Use [Cookie-Editor](https://github.com/moustachauve/cookie-editor) to export your YouTube cookie and save them as `cookie.txt` in the project root

5. **Build and run with Docker Compose**
   ```
   docker compose up -d --build
   ```

6. **Invite the bot to your server**
   - Use the OAuth2 URL from the Developer Portal with the correct scopes and permissions

7. **Deploy slash commands**
   - Join a voice channel and send `/deploy` in your server to register slash commands

## Documentation

- Send `/help` in your server to view available bot commands
- See `soundcloud.ts` and `youtubei.js` for implementation details

## Credits

- Based on [MisaBot](https://github.com/misa198/misa-bot-discord)
- Uses [discord.js](https://discord.js.org/), [youtubei.js](https://ytjs.dev/), [soundcloud.ts](https://github.com/Moebits/soundcloud.ts)  and other open-source libraries

---
