# [![Purinton Dev](https://purinton.us/logos/brand.png)](https://discord.gg/QSBxQnX7PF)

## vclogbot [![npm version](https://img.shields.io/npm/v/@purinton/vclogbot.svg)](https://www.npmjs.com/package/@purinton/vclogbot)[![license](https://img.shields.io/github/license/purinton/vclogbot.svg)](LICENSE)[![build status](https://github.com/purinton/vclogbot/actions/workflows/nodejs.yml/badge.svg)](https://github.com/purinton/vclogbot/actions)

A Discord bot for tracking and rewarding voice channel activity with a leveling system, join/leave messages, and interactive stats commands.

---

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Configuration](#configuration)
- [Running as a Service (systemd)](#running-as-a-service-systemd)
- [Docker](#docker)
- [Customization](#customization)
  - [Commands](#commands)
  - [Events](#events)
  - [Locales](#locales)
- [Testing](#testing)
- [Support](#support)
- [License](#license)

## Features

- **Voice Channel Leveling System**: Tracks user time spent in voice channels and awards levels based on total time.
- **Join/Leave Messages**: Announces when users join or leave voice channels, including late joins (e.g., after bot restarts or mute/unmute events).
- **/stats Command**: Shows your current level, total voice time, and progress to the next level.
- **/leaderboard Command**: Displays the top users in your server by voice channel activity.
- **Automatic Session Recovery**: Handles missed join events and bot restarts, ensuring accurate tracking.
- **Locale Support**: Easily add or edit language files in `locales/`.
- **Logging**: Detailed debug and error logs for troubleshooting.
- **Systemd & Docker Ready**: Templates and instructions for production deployment.
- **Jest for testing**

---

## Getting Started

1. **Clone this project:**

   ```bash
   git clone https://github.com/purinton/vclogbot.git
   cd vclogbot
   npm install
   ```

2. **Set up your environment:**
   - Copy `.env.example` to `.env` and fill in your Discord app token and other secrets.
   - Edit `package.json` (name, description, author, etc.)
   - Update this `README.md` as needed.

3. **Start the app locally:**

   ```bash
   npm start
   # or
   node vclogbot.mjs
   ```

## Usage

### Voice Channel Leveling

- Users earn experience by being in voice channels.
- Levels are calculated using a triangular formula (each level requires more time).
- Level-up messages are sent in the channel when a user advances.

### Join/Leave Messages

- The bot announces when users join or leave a voice channel.
- If the bot was offline or missed a join event, it will detect the user on the next relevant event (e.g., mute/unmute) and start tracking.

### Slash-Commands

- `/stats` — Shows your current level, total time, and progress.
- `/leaderboard` — Shows the top users by voice time in the server.

## Configuration

- All configuration is handled via environment variables in the `.env` file.
- See `.env.example` for required and optional variables.

## Running as a Service (systemd)

1. Copy `vclogbot.service` to `/usr/lib/systemd/system/vclogbot.service`.
2. Edit the paths and user/group as needed.
3. Reload systemd and start the service:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable vclogbot
   sudo systemctl start vclogbot
   sudo systemctl status vclogbot
   ```

## Docker

1. Build the Docker image:

   ```bash
   docker build -t vclogbot .
   ```

2. Run the container:

   ```bash
   docker run --env-file .env vclogbot
   ```

## Customization

### Commands

- Add new commands in the `commands/` directory.
- Each command has a `.json` definition (for Discord registration/localization) and a `.mjs` handler (for logic).

### Events

- Add or modify event handlers in the `events/` directory.
- Each Discord event (e.g., `ready`, `messageCreate`, `interactionCreate`, `voiceStateUpdate`) has its own handler file.

### Locales

- Add or update language files in the `locales/` directory.
- Localize command names, descriptions, and app responses.

## Testing

- Run tests with:

  ```bash
  npm test
  ```

- Add your tests in the `tests/` folder or alongside your code.

## Folder Structure

```text
src/           # Core logic and utilities
commands/      # Slash command definitions and handlers
events/        # Event handlers (voice, message, etc.)
locales/       # Locale JSON files
*.mjs          # Main entry and supporting modules
```

## Best Practices

- **Keep your app token secret!** Never commit your `.env` file or token to version control.
- **Use a dedicated, non-root user** for running your app in production.
- **Monitor logs** for errors or unusual activity.
- **Check Discord.js documentation** for new features: [https://discord.js.org/](https://discord.js.org/)

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://purinton.us/logos/discord_96.png)](https://discord.gg/QSBxQnX7PF)[![Purinton Dev](https://purinton.us/logos/purinton_96.png)](https://discord.gg/QSBxQnX7PF)

**[Purinton Dev on Discord](https://discord.gg/QSBxQnX7PF)**

Email: <russell.purinton@gmail.com>
Discord: laozi101

## License

[MIT © 2025 Russell Purinton](LICENSE)

## Links

- [GitHub (Project)](https://github.com/purinton/vclogbot)
- [GitHub (Org)](https://github.com/purinton)
- [GitHub (Personal)](https://github.com/rpurinton)
- [Discord](https://discord.gg/QSBxQnX7PF)
