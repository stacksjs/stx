# Web3 Icons Branded

> Web3 Icons Branded icons for stx from Iconify

## Overview

This package provides access to 2085 icons from the Web3 Icons Branded collection through the stx iconify integration.

**Collection ID:** `token-branded`
**Total Icons:** 2085
**Author:** 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
**License:** MIT ([Details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE))
**Category:** Logos
**Palette:** Yes (color icons)

## Installation

```bash
bun add @stacksjs/iconify-token-branded
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<0x0Icon height="1em" />
<0x0Icon width="1em" height="1em" />
<0x0Icon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<0x0Icon size="24" />
<0x0Icon size="1em" />

<!-- Using width and height -->
<0x0Icon width="24" height="32" />

<!-- With color -->
<0x0Icon size="24" color="red" />
<0x0Icon size="24" color="#4a90e2" />

<!-- With CSS class -->
<0x0Icon size="24" class="icon-primary" />

<!-- With all properties -->
<0x0Icon
  size="32"
  color="#4a90e2"
  class="my-icon"
  style="opacity: 0.8;"
/>
```

### In stx Templates

```html
<!DOCTYPE html>
<html>
<head>
  <title>Icon Demo</title>
  <style>
    .icon-grid {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="icon-grid">
    <0x0Icon size="24" />
    <0xgasIcon size="24" color="#4a90e2" />
    <10setIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 0x0, 0xgas, 10set } from '@stacksjs/iconify-token-branded'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(0x0, { size: 24 })
```

## Icon Properties

All icon component functions and `renderIcon` accept the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `string \| number` | - | Icon size (sets both width and height) |
| `width` | `string \| number` | - | Icon width (overrides size) |
| `height` | `string \| number` | - | Icon height (overrides size) |
| `color` | `string` | `'currentColor'` | Icon color (CSS color or hex) |
| `hFlip` | `boolean` | `false` | Flip horizontally |
| `vFlip` | `boolean` | `false` | Flip vertically |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotation in degrees |
| `class` | `string` | - | Additional CSS classes |
| `style` | `string` | - | Inline styles |

## Color

### Color Icons

This collection contains color icons. While you can still set a color property, it may override the original colors.

```html
<!-- Via color property -->
<0x0Icon size="24" color="red" />
<0x0Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<0x0Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<0x0Icon size="24" class="text-primary" />
```



## Size

Unlike other components, SVG + CSS components do not set icon size by default. This has advantages and disadvantages.

**Disadvantages:**
- You need to set size yourself.

**Advantages:**
- You have full control over icon size.

You can change icon size by:
- Setting `width` and `height` properties
- Using CSS

### Properties

All icon components support `width` and `height` properties.

Value is a string or number.

You do not need to set both properties. If you set one property, the other property will automatically be calculated from the icon's width/height ratio.

**Examples:**

```html
<0x0Icon height="1em" />
<0x0Icon width="1em" height="1em" />
<0x0Icon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<0x0Icon size="24" />
<0x0Icon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.tokenBranded-icon {
  width: 1em;
  height: 1em;
}
```

```html
<0x0Icon class="tokenBranded-icon" />
```

## Available Icons

This package contains **2085** icons:

- `0x0`
- `0xgas`
- `10set`
- `1art`
- `1inch`
- `2dai`
- `3ull`
- `a`
- `aa`
- `aag`
- `aart`
- `aave`
- `abl`
- `abr`
- `abstract`
- `abt`
- `abyss`
- `acala`
- `ach`
- `acq`
- `acria`
- `acs`
- `act`
- `acx`
- `ada`
- `adapad`
- `adco`
- `adoge`
- `adp`
- `ads`
- `adx`
- `ae`
- `aegis`
- `aergo`
- `aero`
- `aevo`
- `afc`
- `ageur`
- `agi`
- `agix`
- `agla`
- `agld`
- `agrs`
- `aht`
- `ai`
- `aimbot`
- `aimx`
- `ain`
- `aioz`
- `aipad`
- `air`
- `airi`
- `ais`
- `ait`
- `aitech`
- `akt`
- `alcx`
- `aleph`
- `alex`
- `alfa1`
- `algb`
- `algo`
- `algorand`
- `ali`
- `alice`
- `allin`
- `alot`
- `alpaca`
- `alph`
- `alpha`
- `alphaWallet`
- `alu`
- `amb`
- `amp`
- `amz`
- `anc`
- `angle`
- `ankr`
- `ankreth`
- `ant`
- `ape`
- `apechain`
- `apefi`
- `apex`
- `apexLayer`
- `apfc`
- `apl`
- `apm`
- `apollo`
- `apt`
- `aptos`
- `apw`
- `apx`
- `aqt`
- `aqtis`
- `aqua`
- `ar`
- `arb`
- `arbi`
- `arbitrumNova`
- `arbitrumOne`
- `arc`
- `arch`
- `ardr`
- `area`
- `argent`
- `ari`
- `ari10`
- `aria20`
- `arix`
- `ark`
- `arpa`
- `arrr`
- `arsw`
- `arv`
- `arweave`
- `asd`
- `asia`
- `asm`
- `assa`
- `ast`
- `astar`
- `asto`
- `astr`
- `astradao`
- `astrafer`
- `astroc`
- `ata`
- `atd`
- `ath`
- `atlas`
- `atm`
- `atom`
- `atomic`
- `ator`
- `atpay`
- `atr`
- `atri`
- `auction`
- `audio`
- `aura`
- `aurabal`
- `aurora`
- `aury`
- `auto`
- `autonomys`
- `ava`
- `avalanche`
- `avax`
- `avg`
- `avi`
- `avinoc`
- `avl`
- `avt`
- `axe`
- `axel`
- `axl`
- `axs`
- `azero`
- `azit`
- `b2m`
- `babydoge`
- `babyshib`
- `babytrump`
- `backpack`
- `bad`
- `badger`
- `bai`
- `bake`
- `bal`
- `balancer`
- `ban`
- `banana`
- `bancor`
- `band`
- `bao`
- `base`
- `bat`
- `bax`
- `bbank`
- `bbl`
- `bcat`
- `bcb`
- `bcd`
- `bcdt`
- `bch`
- `bcmc`
- `bcn`
- `bcoin`
- `bct`
- `bcube`
- `bdp`
- `bdt`
- `bdx`
- `beam`
- `bean`
- `beets`
- `bel`
- `belt`
- `ben`
- `bend`
- `bepro`
- `berachain`
- `berry`
- `beta`
- `bets`
- `bfic`
- `bfr`
- `bft`
- `bgb`
- `bhat`
- `bico`
- `bidz`
- `bifi`
- `bigsb`
- `binance`
- `binanceSmartChain`
- `bist`
- `bit`
- `bitbox`
- `bitci`
- `bitcoin`
- `bithumb`
- `bitkubChain`
- `bitstamp`
- `bkn`
- `blank`
- `blast`
- `bld`
- `blid`
- `block`
- `blox`
- `blp`
- `blt`
- `blue`
- `bluesparrow`
- `blur`
- `blusd`
- `blx`
- `blxm`
- `blz`
- `bmex`
- `bmx`
- `bnb`
- `bnt`
- `bnx`
- `boa`
- `bob`
- `boba`
- `bolt`
- `bond`
- `bondly`
- `bonk`
- `boot`
- `bora`
- `boring`
- `boson`
- `botanix`
- `botto`
- `bouncebit`
- `bpro`
- `bpt`
- `breed`
- `brg`
- `brick`
- `bridge`
- `brise`
- `brn`
- `brock`
- `brrr`
- `brush`
- `brwl`
- `bs`
- `bscpad`
- `bscs`
- `bsgg`
- `bst`
- `bsv`
- `bsw`
- `bsx`
- `bta`
- `btc`
- `btc2`
- `btcmt`
- `btcp`
- `btcst`
- `btcturk`
- `btg`
- `btm`
- `btrfly`
- `bts`
- `btse`
- `btsg`
- `btu`
- `build`
- `bull`
- `bump`
- `burger`
- `busd`
- `buy`
- `bwo`
- `bxx`
- `bybit`
- `bzr`
- `bzrx`
- `bzz`
- `c3`
- `c98`
- `cah`
- `cake`
- `canto`
- `cap`
- `caps`
- `carat`
- `carbon`
- `card`
- `cardano`
- `cas`
- `cast`
- `cat`
- `catgirl`
- `catheon`
- `caw`
- `cbeth`
- `cbx`
- `cby`
- `ccd`
- `cct`
- `ccv2`
- `cdai`
- `cdt`
- `ceek`
- `cel`
- `cell`
- `celo`
- `celr`
- `cere`
- `cetus`
- `ceur`
- `cfg`
- `cfx`
- `cgg`
- `cgl`
- `cgo`
- `cgpt`
- `cgt`
- `chain`
- `champz`
- `chat`
- `cheems`
- `cheq`
- `chiliz`
- `chmb`
- `cho`
- `chr`
- `chrp`
- `chz`
- `cirus`
- `ckb`
- `ckp`
- `clave`
- `clh`
- `clore`
- `clover`
- `cls`
- `clv`
- `clxy`
- `cly`
- `cmdx`
- `cmos`
- `cnc`
- `cnd`
- `cnfi`
- `cng`
- `cnht`
- `coc`
- `coin98`
- `coinbase`
- `coinexSmartChain`
- `col`
- `collab`
- `combo`
- `comp`
- `cone`
- `conflux`
- `conv`
- `cope`
- `copi`
- `core`
- `corn`
- `cos`
- `cosmos`
- `cosmosHub`
- `cosmoshub`
- `coti`
- `cov`
- `coval`
- `cow`
- `cowswap`
- `cph`
- `cpool`
- `cqt`
- `cre`
- `cream`
- `credi`
- `creo`
- `cro`
- `croid`
- `cronos`
- `cronosZkevm`
- `crowd`
- `crown`
- `crpt`
- `crts`
- `cru`
- `crv`
- `crvusd`
- `crwny`
- `cryptoCom`
- `crystal`
- `csix`
- `cspr`
- `ctc`
- `ctg`
- `cti`
- `ctk`
- `ctr`
- `ctsi`
- `ctx`
- `ctxc`
- `cube`
- `cudos`
- `cult`
- `cuminu`
- `cummies`
- `cusd`
- `cusdc`
- `cvc`
- `cvp`
- `cvr`
- `cwar`
- `cweb`
- `cws`
- `cxo`
- `cyber`
- `d2t`
- `d3d`
- `dacxi`
- `dad`
- `dafi`
- `dai`
- `dao`
- `dash`
- `data`
- `dbc`
- `dbi`
- `dbr`
- `dc`
- `dcb`
- `dck`
- `dcr`
- `dec`
- `defi`
- `defit`
- `defx`
- `degen`
- `dego`
- `del`
- `dent`
- `dep`
- `derc`
- `deri`
- `dero`
- `deso`
- `dexe`
- `dext`
- `dextf`
- `df`
- `dfi`
- `dfx`
- `dfyn`
- `dgb`
- `dgnx`
- `dgx`
- `dht`
- `dia`
- `diko`
- `dimo`
- `dingo`
- `diode`
- `dione`
- `dip`
- `diver`
- `divi`
- `djed`
- `dka`
- `dlc`
- `dmc`
- `dmd`
- `dmt`
- `dmtr`
- `dnt`
- `dnxc`
- `dobo`
- `dodo`
- `dog`
- `doga`
- `doge`
- `dogechain`
- `dogegf`
- `dola`
- `dome`
- `domi`
- `donut`
- `dor`
- `dora`
- `dose`
- `dot`
- `dpay`
- `dpet`
- `dpi`
- `dps`
- `dpx`
- `drep`
- `drgn`
- `dseth`
- `dsla`
- `dsm`
- `dsrun`
- `dtx`
- `dua`
- `dusk`
- `dust`
- `dvf`
- `dvi`
- `dvpn`
- `dweb`
- `dxgm`
- `dxl`
- `dxp`
- `dydx`
- `dyp`
- `dzoo`
- `earn`
- `eco`
- `ecoin`
- `ecox`
- `eden`
- `edg`
- `edge`
- `edgeless`
- `edu`
- `efc`
- `efi`
- `efl`
- `efx`
- `egc`
- `egg`
- `egld`
- `ego`
- `ejs`
- `el`
- `eland`
- `elastos`
- `elf`
- `elk`
- `elon`
- `elu`
- `emagic`
- `emaid`
- `eml`
- `emp`
- `energyWeb`
- `eng`
- `enj`
- `enkrypt`
- `ens`
- `enuls`
- `eos`
- `eosdt`
- `epic`
- `epik`
- `eqb`
- `equ`
- `equad`
- `equal`
- `eqx`
- `erg`
- `ern`
- `ertha`
- `es`
- `etc`
- `ete`
- `eth`
- `ethereum`
- `ethereumClassic`
- `etherlink`
- `ethix`
- `ethm`
- `ethw`
- `ethx`
- `eti`
- `etn`
- `etp`
- `eul`
- `euno`
- `eurc`
- `euroe`
- `eurs`
- `eurt`
- `eusd`
- `eveai`
- `ever`
- `evmos`
- `ewt`
- `exd`
- `exodus`
- `expchain`
- `exrd`
- `extra`
- `factr`
- `fakeai`
- `fantom`
- `fara`
- `farm`
- `fcon`
- `fct`
- `fctr`
- `fdusd`
- `fear`
- `feg`
- `fei`
- `fer`
- `fet`
- `fevr`
- `fida`
- `fil`
- `filecoin`
- `fio`
- `firo`
- `fis`
- `fitfi`
- `flame`
- `flare`
- `flex`
- `flm`
- `floor`
- `flow`
- `flr`
- `fls`
- `fluence`
- `fluid`
- `flux`
- `flx`
- `fnsa`
- `foam`
- `fold`
- `foom`
- `for`
- `fore`
- `forex`
- `forth`
- `four`
- `fps`
- `fra`
- `frax`
- `fraxtal`
- `free`
- `fren`
- `frin`
- `frm`
- `front`
- `fsn`
- `ftc`
- `ftm`
- `ftn`
- `fuel`
- `fun`
- `fund`
- `fuse`
- `future`
- `fwb`
- `fx`
- `fxs`
- `fyn`
- `g`
- `gafi`
- `gai`
- `gains`
- `gal`
- `gala`
- `galeon`
- `game`
- `gamefi`
- `gami`
- `gamma`
- `gari`
- `gas`
- `gat`
- `gateIo`
- `gbex`
- `gbyte`
- `gcoin`
- `gcr`
- `gdcc`
- `geeq`
- `gel`
- `gemini`
- `geni`
- `geod`
- `get`
- `gfal`
- `gft`
- `gg`
- `ggg`
- `ggp`
- `ghny`
- `gho`
- `ghst`
- `ghub`
- `ghx`
- `giv`
- `glc`
- `gleec`
- `glink`
- `glm`
- `glmr`
- `glow`
- `glq`
- `gmee`
- `gmpd`
- `gmx`
- `gno`
- `gnosis`
- `gns`
- `gny`
- `go`
- `gob`
- `gods`
- `gofx`
- `golden`
- `gora`
- `gorilla`
- `govi`
- `goz`
- `gpcx`
- `gq`
- `grai`
- `grail`
- `grain`
- `grav`
- `gravity`
- `grc`
- `grg`
- `grin`
- `grnd`
- `grt`
- `grv`
- `gse`
- `gsts`
- `gswap`
- `gswift`
- `gt`
- `gtc`
- `guild`
- `gulf`
- `gusd`
- `gxa`
- `gxc`
- `gyen`
- `gymnet`
- `gzil`
- `gzone`
- `h2o`
- `hai`
- `hair`
- `haka`
- `handy`
- `hapi`
- `hard`
- `harmony`
- `hashkey`
- `hawk`
- `hbar`
- `hbb`
- `hbot`
- `hbtc`
- `hdx`
- `hederaHashgraph`
- `hegic`
- `hello`
- `hemi`
- `hera`
- `hermes`
- `hero`
- `hez`
- `hft`
- `hgpt`
- `hgt`
- `hibs`
- `hid`
- `hifi`
- `hilo`
- `hipp`
- `hive`
- `hmnd`
- `hmx`
- `hnt`
- `hold`
- `honey`
- `honk`
- `hook`
- `hop`
- `hopr`
- `hoshi`
- `hot`
- `hpo`
- `hst`
- `ht`
- `htm`
- `htr`
- `huahua`
- `hubbleExchange`
- `hunt`
- `husd`
- `hush`
- `husky`
- `hvh`
- `hxd`
- `hxro`
- `hydra`
- `hyve`
- `hzn`
- `ibat`
- `ibit`
- `ice`
- `ichi`
- `icp`
- `icx`
- `id`
- `idea`
- `idex`
- `idia`
- `idle`
- `idrt`
- `idv`
- `ieth`
- `ignis`
- `igu`
- `ilv`
- `imgnai`
- `immutable`
- `imo`
- `impt`
- `imtoken`
- `imx`
- `infra`
- `inj`
- `injective`
- `ink`
- `ins`
- `inst`
- `insur`
- `int`
- `intr`
- `inv`
- `ion`
- `ionx`
- `iota`
- `iotaEvm`
- `iotex`
- `ipad`
- `ipor`
- `iq`
- `iris`
- `iron`
- `isk`
- `isp`
- `ist`
- `itp`
- `ixo`
- `ixt`
- `jam`
- `japanOpenChain`
- `jasmy`
- `jesus`
- `jewel`
- `jim`
- `jkl`
- `jmpt`
- `joe`
- `jones`
- `jop`
- `joy`
- `jst`
- `juld`
- `jungle4eos`
- `juno`
- `jup`
- `k21`
- `kai`
- `kaia`
- `kakarot`
- `kalm`
- `kan`
- `kap`
- `kar`
- `kardia`
- `karura`
- `kas`
- `kasta`
- `kat`
- `kata`
- `katana`
- `kau`
- `kava`
- `kcs`
- `kda`
- `keep`
- `keke`
- `keplr`
- `kex`
- `key`
- `kiba`
- `kibshi`
- `kick`
- `kicks`
- `kilt`
- `kin`
- `kine`
- `kingshib`
- `kint`
- `kishu`
- `kit`
- `kitty`
- `klay`
- `klee`
- `kleva`
- `klima`
- `klt`
- `klv`
- `kma`
- `kmd`
- `kmon`
- `knc`
- `koge`
- `koin`
- `kom`
- `kompete`
- `kp3r`
- `kraken`
- `krl`
- `krom`
- `kroma`
- `ksm`
- `ktc`
- `kub`
- `kucoin`
- `kuji`
- `kujira`
- `kukai`
- `kuma`
- `kunci`
- `kwai`
- `kwenta`
- `kyve`
- `kzen`
- `l2`
- `l3x`
- `la`
- `ladys`
- `lake`
- `lamb`
- `land`
- `lat`
- `launch`
- `lavaNetwork`
- `layer`
- `lazio`
- `lbr`
- `lbt`
- `lcc`
- `lcd`
- `lcr`
- `lcs`
- `lcx`
- `ldo`
- `leash`
- `ledger`
- `lens`
- `leo`
- `leox`
- `let`
- `lever`
- `lgcy`
- `libre`
- `lif3`
- `lightlink`
- `lime`
- `lina`
- `linda`
- `linea`
- `ling`
- `link`
- `linu`
- `lisk`
- `lit`
- `litecoin`
- `lith`
- `litt`
- `lixx`
- `liza`
- `lm`
- `lmwr`
- `loc`
- `lode`
- `loka`
- `lon`
- `looks`
- `loom`
- `loopring`
- `lovely`
- `lpnt`
- `lpool`
- `lpt`
- `lqdr`
- `lqty`
- `lrc`
- `lsd`
- `lsk`
- `ltc`
- `lto`
- `ltx`
- `lua`
- `luca`
- `lufc`
- `lukso`
- `lumia`
- `lumio`
- `luna`
- `lunc`
- `lunr`
- `lusd`
- `lvl`
- `lycan`
- `lym`
- `lyra`
- `lyx`
- `lyxe`
- `lzm`
- `maha`
- `man`
- `mana`
- `manc`
- `mantaPacific`
- `mantle`
- `mantra`
- `map`
- `maps`
- `mars4`
- `marsh`
- `mask`
- `masq`
- `math`
- `matic`
- `maticx`
- `mav`
- `max`
- `mbd`
- `mbl`
- `mbox`
- `mbx`
- `mc`
- `mcade`
- `mcb`
- `mchc`
- `mcontent`
- `mcrt`
- `mdao`
- `mdt`
- `mdx`
- `mean`
- `med`
- `media`
- `meed`
- `megaEth`
- `meld`
- `meme`
- `memeai`
- `met`
- `meta`
- `metal`
- `metamask`
- `metav`
- `meter`
- `metf`
- `metfi`
- `metis`
- `metisAndromeda`
- `mex`
- `mf`
- `mft`
- `mgp`
- `milkomedaA1`
- `milkomedaC1`
- `mim`
- `mimatic`
- `mimo`
- `min`
- `mina`
- `mind`
- `mint`
- `mintme`
- `minu`
- `mir`
- `mix`
- `mkr`
- `ml`
- `mlk`
- `mln`
- `mm`
- `mmf`
- `mmit`
- `mmo`
- `mmpro`
- `mmy`
- `mnb`
- `mnd`
- `mnde`
- `mngo`
- `mnr`
- `mnst`
- `mnt`
- `mntc`
- `mntl`
- `mnw`
- `mobi`
- `mobile`
- `moby`
- `moc`
- `mochi`
- `mod`
- `mode`
- `moe`
- `mog`
- `mona`
- `monad`
- `moon`
- `moonbase`
- `moonbaseAlpha`
- `moonbeam`
- `mooned`
- `moonriver`
- `moov`
- `mork`
- `move`
- `movement`
- `movr`
- `mpl`
- `mplx`
- `mps`
- `mrs`
- `msol`
- `mst`
- `mta`
- `mtd`
- `mth`
- `mtl`
- `mtlx`
- `mtrg`
- `mtrm`
- `mts`
- `mtv`
- `mtvt`
- `mudol2`
- `multiversx`
- `musd`
- `muse`
- `music`
- `mute`
- `mv`
- `mvd`
- `mvi`
- `mvl`
- `mvx`
- `mwc`
- `mx`
- `mxc`
- `mxm`
- `myEtherWallet`
- `myria`
- `myst`
- `mzr`
- `nabox`
- `nada`
- `nahmii`
- `naka`
- `nals`
- `naos`
- `nap`
- `nav`
- `navi`
- `nblu`
- `nbt`
- `ncdt`
- `ncr`
- `nct`
- `near`
- `nearProtocol`
- `nebo`
- `neer`
- `neo`
- `neoX`
- `neon`
- `neonEvm`
- `nest`
- `nett`
- `neuroni`
- `neuros`
- `newo`
- `nex`
- `nexa`
- `nexis`
- `nexo`
- `nfai`
- `nfd`
- `nftart`
- `nftb`
- `nftbs`
- `nftx`
- `ngc`
- `ngl`
- `ngm`
- `nht`
- `nibiru`
- `nim`
- `nkn`
- `nls`
- `nmr`
- `nmx`
- `nodl`
- `noia`
- `nom`
- `nord`
- `nos`
- `npc`
- `npm`
- `npxs`
- `nrch`
- `nrg`
- `nsbt`
- `nsfw`
- `ntx`
- `nuls`
- `num`
- `nvir`
- `nvt`
- `nwc`
- `nxm`
- `nxra`
- `nxt`
- `nym`
- `o3`
- `oas`
- `oasys`
- `oath`
- `oax`
- `obi`
- `obot`
- `obsr`
- `obvious`
- `oce`
- `ocean`
- `octa`
- `oddz`
- `odin`
- `odos`
- `oeth`
- `oggy`
- `ogn`
- `okex`
- `okt`
- `okx`
- `olt`
- `om`
- `omax`
- `omi`
- `ommi`
- `omni`
- `omnom`
- `one`
- `ong`
- `oni`
- `onion`
- `onit`
- `ont`
- `ontology`
- `ooe`
- `ooki`
- `ooks`
- `op`
- `opium`
- `opti`
- `optimism`
- `optopia`
- `orai`
- `orare`
- `orb`
- `orbs`
- `order`
- `orderly`
- `ordi`
- `orn`
- `ort`
- `os`
- `osak`
- `osmo`
- `osmosis`
- `otk`
- `ousd`
- `ovr`
- `ox`
- `oxb`
- `oxen`
- `oxt`
- `oxy`
- `ozean`
- `ozo`
- `paal`
- `pac`
- `pai`
- `paid`
- `pal`
- `palm`
- `pancakeSwap`
- `paper`
- `para`
- `paraSwap`
- `paradex`
- `paraswap`
- `paribu`
- `part`
- `pasg`
- `paw`
- `pawth`
- `paxg`
- `pay`
- `pbr`
- `pbx`
- `pdex`
- `pdt`
- `peaq`
- `peel`
- `pendle`
- `people`
- `pepe`
- `pepes`
- `per`
- `perc`
- `peri`
- `perp`
- `pex`
- `pgx`
- `pha`
- `phantom`
- `phb`
- `phonon`
- `pi`
- `pib`
- `pica`
- `pickle`
- `pika`
- `pillar`
- `pinksale`
- `pinu`
- `pip`
- `pivx`
- `pixel`
- `piza`
- `pkf`
- `pkr`
- `pkt`
- `pla`
- `planets`
- `plastik`
- `pleb`
- `plex`
- `pli`
- `pln`
- `plr`
- `plt`
- `plu`
- `ply`
- `pmon`
- `pnb`
- `png`
- `pnk`
- `pnp`
- `pnt`
- `pokt`
- `pol`
- `pola`
- `polc`
- `polk`
- `polkadot`
- `pols`
- `polx`
- `poly`
- `polydoge`
- `polygon`
- `polygonPos`
- `polygonZkevm`
- `polypad`
- `polyx`
- `pond`
- `pooh`
- `poolx`
- `pop`
- `popcat`
- `pork`
- `portal`
- `portx`
- `powr`
- `ppay`
- `ppc`
- `ppt`
- `pre`
- `premia`
- `primal`
- `prime`
- `prism`
- `pro`
- `prob`
- `prom`
- `propc`
- `props`
- `pros`
- `proteo`
- `prq`
- `prtc`
- `prx`
- `pry`
- `psl`
- `psp`
- `pstake`
- `pswap`
- `pts`
- `ptu`
- `pumlx`
- `pundix`
- `purse`
- `push`
- `pussy`
- `pwr`
- `pxp`
- `pyr`
- `pyth`
- `pyusd`
- `pzp`
- `qanx`
- `qash`
- `qkc`
- `qlc`
- `qnt`
- `qom`
- `qrdo`
- `qrl`
- `qsr`
- `qtcon`
- `qtum`
- `quad`
- `quartz`
- `qube`
- `quick`
- `quidd`
- `quint`
- `r`
- `rabby`
- `rad`
- `radio`
- `rae`
- `rai`
- `rail`
- `rainbow`
- `rake`
- `ram`
- `ramp`
- `rare`
- `rari`
- `raven`
- `ray`
- `razor`
- `rbd`
- `rbif`
- `rbls`
- `rbn`
- `rbw`
- `rbx`
- `rcn`
- `rdd`
- `rdn`
- `rdnt`
- `rdpx`
- `rdt`
- `realm`
- `reef`
- `ref`
- `regen`
- `rei`
- `ren`
- `renbtc`
- `rep`
- `req`
- `ret`
- `reth`
- `reuni`
- `rev`
- `rev3l`
- `revo`
- `revv`
- `reya`
- `rfd`
- `rfox`
- `rgen`
- `rgt`
- `ribbit`
- `ride`
- `rif`
- `rin`
- `ring`
- `rise`
- `risita`
- `rite`
- `rjv`
- `rlb`
- `rlc`
- `rly`
- `rmrk`
- `rndr`
- `roko`
- `rollux`
- `rome`
- `ronin`
- `rootstock`
- `rose`
- `route`
- `rpg`
- `rpl`
- `rsc`
- `rsr`
- `rss3`
- `rtm`
- `rug`
- `rune`
- `rvc`
- `rvf`
- `rvn`
- `rvst`
- `rwn`
- `rxd`
- `s`
- `safe`
- `safemars`
- `sai`
- `sail`
- `saitama`
- `saito`
- `sakai`
- `salt`
- `sam`
- `sama`
- `samo`
- `san`
- `sand`
- `sani`
- `sats`
- `satt`
- `sauce`
- `savg`
- `sbd`
- `sbtc`
- `sc`
- `scar`
- `scb`
- `sclp`
- `scnsol`
- `scp`
- `scroll`
- `scrt`
- `scs`
- `sdao`
- `sdex`
- `sdl`
- `sdn`
- `sdt`
- `seed`
- `sei`
- `seiNetwork`
- `seilor`
- `senate`
- `send`
- `sender`
- `sense`
- `sequence`
- `seth`
- `seth2`
- `sfd`
- `sfi`
- `sfm`
- `sfp`
- `sfrxeth`
- `sftmx`
- `sfund`
- `sha`
- `shdw`
- `shft`
- `shi`
- `shia`
- `shib`
- `shibdoge`
- `shiden`
- `shido`
- `shik`
- `shimmerEvm`
- `shopx`
- `shroom`
- `shx`
- `si`
- `signa`
- `silicon`
- `silk`
- `sipher`
- `sis`
- `six`
- `skeb`
- `skey`
- `skl`
- `slam`
- `slcl`
- `slg`
- `slim`
- `slnd`
- `slp`
- `slr`
- `smartcredit`
- `smbr`
- `smi`
- `smt`
- `sn`
- `snail`
- `snek`
- `snft`
- `sns`
- `snt`
- `snx`
- `socks`
- `sofi`
- `sol`
- `solana`
- `solflare`
- `solid`
- `solo`
- `solve`
- `solx`
- `somm`
- `soneium`
- `songbird`
- `sonic`
- `sonne`
- `soon`
- `soph`
- `soul`
- `souls`
- `source`
- `spa`
- `space`
- `spank`
- `sparta`
- `spc`
- `spe`
- `spell`
- `sph`
- `sphere`
- `spirit`
- `spool`
- `spore`
- `spx`
- `squad`
- `squads`
- `squidgrow`
- `srcx`
- `srk`
- `srlty`
- `srm`
- `srx`
- `ssv`
- `sswp`
- `ssx`
- `stacks`
- `stargaze`
- `starknet`
- `starl`
- `stars`
- `stat`
- `statom`
- `status`
- `stbu`
- `steem`
- `stella`
- `stellar`
- `step`
- `stfx`
- `stg`
- `stima`
- `stjuno`
- `stmx`
- `storj`
- `stos`
- `stosmo`
- `stpt`
- `strax`
- `strd`
- `strk`
- `strong`
- `strp`
- `strx`
- `stsol`
- `ststars`
- `stx`
- `sub`
- `sudo`
- `sui`
- `suip`
- `suku`
- `sun`
- `superSeed`
- `superseed`
- `supraMovevm`
- `sure`
- `susd`
- `sushi`
- `sushiswap`
- `suter`
- `swap`
- `swash`
- `sweat`
- `swell`
- `sweth`
- `swftc`
- `swise`
- `swissborg`
- `swth`
- `sxp`
- `sylo`
- `sync`
- `sys`
- `t`
- `taboo`
- `taiko`
- `taki`
- `tama`
- `tao`
- `tara`
- `tbtc`
- `tdrop`
- `teer`
- `tel`
- `telos`
- `temple`
- `tenet`
- `tet`
- `tetu`
- `tfuel`
- `tgt`
- `thales`
- `the`
- `theo`
- `theta`
- `thol`
- `thor`
- `tht`
- `thundercore`
- `tia`
- `tidal`
- `tifi`
- `tig`
- `time`
- `tin`
- `tips`
- `titan`
- `tkn`
- `tko`
- `tkp`
- `tkx`
- `tlm`
- `tlos`
- `tnt`
- `token`
- `tokenPocket`
- `tomb`
- `tombchain`
- `tomi`
- `ton`
- `tonic`
- `top`
- `topia`
- `tor`
- `torn`
- `toshi`
- `tower`
- `tpad`
- `trac`
- `trade`
- `trava`
- `traxx`
- `trb`
- `trc`
- `trcl`
- `treasure`
- `tree`
- `treeb`
- `trezor`
- `trias`
- `tribe`
- `tron`
- `tronpad`
- `trove`
- `troy`
- `tru`
- `trust`
- `trvl`
- `trx`
- `tryb`
- `tsuka`
- `tt`
- `ttk`
- `tulip`
- `tusd`
- `tut`
- `tvk`
- `twt`
- `txau`
- `tyrant`
- `u`
- `ubiq`
- `ubsn`
- `ubt`
- `ubxs`
- `ucjl`
- `ufi`
- `uft`
- `ultra`
- `ultron`
- `uma`
- `umami`
- `umb`
- `uncx`
- `und`
- `undead`
- `unfi`
- `uni`
- `unibot`
- `unichain`
- `unipass`
- `uniswap`
- `unix`
- `uno`
- `uos`
- `upbit`
- `upp`
- `uqc`
- `urus`
- `usdc`
- `usdd`
- `usdt`
- `usdv`
- `usdx`
- `ush`
- `usn`
- `ustc`
- `utk`
- `uw3s`
- `uwu`
- `vab`
- `vai`
- `valor`
- `vana`
- `vanar`
- `vara`
- `vaulta`
- `vc`
- `vcf`
- `vcore`
- `vee`
- `vega`
- `vela`
- `velas`
- `velo`
- `vemp`
- `venly`
- `versa`
- `verse`
- `vet`
- `veur`
- `vex`
- `vext`
- `vgx`
- `vib`
- `viction`
- `vidt`
- `vidya`
- `vine`
- `vinu`
- `vis`
- `vita`
- `vite`
- `vix`
- `vlx`
- `vlxpad`
- `vno`
- `voice`
- `volt`
- `voxel`
- `vpad`
- `vr`
- `vra`
- `vrsw`
- `vsp`
- `vsys`
- `vtc`
- `vtho`
- `vtx`
- `vv`
- `vvs`
- `vxv`
- `wacme`
- `wagmi`
- `wagmigames`
- `wait`
- `wallet`
- `wallet3`
- `walletConnect`
- `walv`
- `wam`
- `wampl`
- `wan`
- `was`
- `waves`
- `wax`
- `waxp`
- `wbeth`
- `wbt`
- `wbtc`
- `wcfg`
- `wefi`
- `well`
- `welt`
- `wemix`
- `wgc`
- `whale`
- `white`
- `wifi`
- `wigo`
- `wiken`
- `win`
- `wing`
- `winr`
- `wise`
- `witch`
- `wliti`
- `wlkn`
- `wndr`
- `wnk`
- `wnt`
- `wnxm`
- `wojak`
- `wombat`
- `woof`
- `world`
- `wow`
- `wozx`
- `wrld`
- `wrx`
- `wsi`
- `wwy`
- `wxt`
- `xLayer`
- `x2y2`
- `xai`
- `xaur`
- `xaut`
- `xava`
- `xcad`
- `xcfx`
- `xch`
- `xchf`
- `xcm`
- `xcp`
- `xcur`
- `xdata`
- `xdb`
- `xdc`
- `xdefi`
- `xdg`
- `xec`
- `xels`
- `xem`
- `xep`
- `xet`
- `xeta`
- `xft`
- `xfund`
- `xhv`
- `xi`
- `xido`
- `xki`
- `xmon`
- `xmr`
- `xna`
- `xno`
- `xor`
- `xpla`
- `xpnet`
- `xpr`
- `xprt`
- `xpx`
- `xrd`
- `xrp`
- `xrt`
- `xrune`
- `xsgd`
- `xsp`
- `xsushi`
- `xtm`
- `xtp`
- `xtz`
- `xvg`
- `xvs`
- `xwg`
- `xwin`
- `xy`
- `xyo`
- `y2k`
- `yak`
- `yam`
- `ycc`
- `ydf`
- `yes`
- `yfi`
- `yfii`
- `ygg`
- `yoshi`
- `you`
- `zano`
- `zap`
- `zat`
- `zbc`
- `zcx`
- `zec`
- `zee`
- `zen`
- `zengo`
- `zerion`
- `zero`
- `zeroNetwork`
- `zetaChain`
- `zig`
- `zil`
- `zilliqa`
- `zircuit`
- `zkb`
- `zkid`
- `zkp`
- `zksync`
- `zlk`
- `zmn`
- `znn`
- `zoomer`
- `zora`
- `zpay`
- `zrx`
- `ztg`
- `zyn`
- `zyx`
- `zz`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><0x0Icon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><0xgasIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><10setIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><1artIcon size="20" class="nav-icon" /> Settings</a>
</nav>

<style>
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .nav-icon {
    color: currentColor;
  }
</style>
```

### Custom Styling

```html
<0x0Icon
  size="24"
  class="icon icon-primary"
  style="opacity: 0.8; transition: opacity 0.2s;"
/>

<style>
  .icon-primary {
    color: #4a90e2;
  }
  .icon-primary:hover {
    opacity: 1;
  }
</style>
```

### Status Indicators

```html
<div class="status-grid">
  <div class="status-item">
    <0x0Icon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <0xgasIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <10setIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <0x0Icon size="24" />
   <0xgasIcon size="24" color="#4a90e2" />
   ```

2. **Use CSS for Theming**: Apply consistent styling through CSS classes
   ```css
   .icon {
     color: currentColor;
     opacity: 0.8;
     transition: opacity 0.2s;
   }

   .icon:hover {
     opacity: 1;
   }
   ```

   ```html
   <0x0Icon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <0x0Icon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <0x0Icon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 0x0 } from '@stacksjs/iconify-token-branded'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(0x0, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0x0 } from '@stacksjs/iconify-token-branded'

// Icons are typed as IconData
const myIcon: IconData = 0x0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

MIT

See [license details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE) for more information.

## Credits

- **Icons**: 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/token-branded/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/token-branded/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
