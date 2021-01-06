# cliflix

Watch anything instantaneously, just write its name

It searches a torrent for you and streams it using [WebTorrent](https://github.com/fabiospampinato/webtorrent-cli/tree/iina-pip) to your favorite app. It supports subtitles too

The Code based from Fabio Spampinato's [CLIFlix](https://github.com/fabiospampinato/cliflix). Compared to the original, the code is structured differently, removes (direct) dependencies on old menu/fetching/etc. libraries and removes excess functionality. And rather than checking for WebTorrent arguments and overriding, most behavioral arguments are configured within this app's interface

> **Warning**: If you don't know what a torrent is, or are unsure about the legality of the torrents you're downloading you shouldn't use `cliflix`.

## Install

```sh
$ npm install -g @eankeen/cliflix
```

## Usage

### Wizard

Execute `cliflix` to run a wizard, and prompt for movie, torrent, subtitles, and app you wish to open

<p align="center">
  <img src="resources/wizard.gif" width="631" alt="Wizard Gif">
</p>

### Wizard Bypass

You can bypass certain parts of wizard if you know what you want

- `--title`

  - title of movie
  - ex. `--title=Zootopia`

- `--activeOutputProgram`

  - bypasses output program
  - ex. `--activeOutputProgram=vlc`

- `--subtitles`

  - Automatically enable subtitle searching
  - ex. `--subtitles=true`

- `--autosubtitles`

  - Automaticaly pick the most downloaded subtitles
  - ex. `--autosubtitles=true`

### Other Options

- `--activeTorrentProvider`

  - Override `Config.torrents.providers.active` on the fly

- `--outputDir`

  - Override `downloadPath` on the fly

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

### Advanced

You can also directly pass any of the valid torrent identifiers supported by [parse-torrent](https://github.com/webtorrent/parse-torrent) to stream it:

```sh
cliflix do "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent"
```

You cannot pass arbitrary options to [WebTorrent](https://github.com/fabiospampinato/webtorrent-cli/tree/iina-pip), read more about them [here](https://github.com/fabiospampinato/webtorrent-cli/tree/iina-pip). Note that if you do this, it may interfere with some `cliflix` options (`ex. activeOutputProgram`)

```sh
# does not work

cliflix -- --iina --pip
cliflix -- --vlc --port 1234
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
