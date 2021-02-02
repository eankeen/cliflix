# cliflix

Watch any media instantaneously.

Cliflix searches for torrent and streams the resulting magent using [WebTorrent](https://github.com/fabiospampinato/webtorrent-cli/tree/iina-pip) to your favorite app. Inspired from Fabio Spampinato's [CLIFlix](https://github.com/fabiospampinato/cliflix)

> **Warning**: If you don't know what a torrent is, or are unsure about the legality of the torrents you're downloading you shouldn't use `cliflix`.

## Install

```sh
$ npm install -g @eankeen/cliflix
```

## Usage

### Wizard

Execute `cliflix` to run a wizard, and prompt for movie, torrent, subtitles, and app you wish to open

<p align="center">
  <img src="resources/wizard.gif" width="630" alt="Wizard Gif">
</p>

To skip past repetitive prompts, add options:

```sh
cliflix --torrentProvider 1337x --moviePlayer VLC --subtitleLanguage English
```

Alternatively, add them to the config located at `"${XDG_CONFIG_HOME:-$HOME/.config}"/cliflix/cliflix.json` file. All keys within `./src/config.ts` are configurable

```js
{
	"torrentProvider": "1337x",
	"moviePlayer": "VLC",
	"subtitleLanguage": "English",
	"saveMedia": true,
	"skipNoSubtitles": true,
	"torrentListLength": 30,
	"downloadDir": "~/Dls",
	"webtorrentOptions": ["--no-quit"]
}
```

## Possible Improvements

- Clean up error / warning messages
- print errors in debug / dev mode
- Bug: sigint during webtorrent stream prints messy error
- choose which torrent to get in doWizard mode
