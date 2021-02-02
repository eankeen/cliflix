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

### Recommenations

I have the following shell alias and config. It streams to VLC, and automatically sets up English subtitles, if they are available

```sh
alias cliflix='cliflix --activeOutputProgram=vlc --subtitles=true --autosubtitles=true'
```

```json
// cliflix.json
{
  "activeLanguage": "English",
  "downloadSave": true
}
```

## Configuration

You can customize `cliflix` to your likings via a `"${XDG_CONFIG_HOME:-$HOME/.config}"/cliflix/cliflix.json` file

```js
{
  // language override to skip the subtitle language selection menu
  "activeLanguage": '',
  // save to downloadPath or just to some dir in $TMP
  "downloadSave": true,
  "downloadPath": path.join(os.homedir(), 'Downloads'),

  "outputs": {
    // favorite apps listed first on prompt to choose output video player
    "favorites": ["VLC"]
  },

  "torrents": {
     // Number of torrents to show
    "limit": 30,
    // Extra columns to show on torrent selection menu
    "details": {
      "seeders": true,
      "leechers": true,
      "size": true,
      "time": true
    },
    "providers": {
       // Providers to list if none is active
      "available": ["1337x", "ThePirateBay", "ExtraTorrent", "Rarbg", "Torrent9", "KickassTorrents", "TorrentProject", "Torrentz2"],
       // Active provider
      "active": "1337x"
    }
  },
  "subtitles": {
    // Number of subtitles to show in subtitles selection menu
    "limit": 30,
    // whether to show downloads in subtitles selection menu
    "showDownloads": true
    "languages": {
       // favorite apps listed first on prompt to choose subtitle language
      "favorites": ["English"
    },
    "opensubtitles": {
       // Your OpenSubtitles username, required for increasing your IP quota
      "username": null,
       // Your OpenSubtitles password, required for increasing your IP quota
      "password": null,
      "ssl": true
    }
  }
}
```

## Possible Improvements

- Make configuration more unified (better naming schema), better `subtitle` options and similar names to command line options
- Use a different prompt library
- Actually have ability to pass command line options directly to WebTorrent

todo:
clean up error console logs
log errors to console during debug / dev mode
