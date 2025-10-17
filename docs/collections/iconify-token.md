# Web3 Icons

> Web3 Icons icons for stx from Iconify

## Overview

This package provides access to 1822 icons from the Web3 Icons collection through the stx iconify integration.

**Collection ID:** `token`
**Total Icons:** 1822
**Author:** 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
**License:** MIT ([Details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-token
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
    <10setIcon size="24" color="#4a90e2" />
    <1artIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 0x0, 10set, 1art } from '@stacksjs/iconify-token'
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

### Monotone Icons

Monotone icons use `currentColor` by default, allowing you to change icon color via the `color` property or CSS:

```html
<!-- Via color property -->
<0x0Icon size="24" color="red" />
<0x0Icon size="24" color="#4a90e2" />

<!-- Via inline style -->
<0x0Icon size="24" style="color: green;" />

<!-- Via CSS class -->
<0x0Icon size="24" class="text-primary" />
```

```css
/* In your CSS */
.text-primary {
  color: #4a90e2;
}

.icon:hover {
  color: #357abd;
}
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
.token-icon {
  width: 1em;
  height: 1em;
}
```

```html
<0x0Icon class="token-icon" />
```

## Available Icons

This package contains **1822** icons:

- `0x0`
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
- `act`
- `acx`
- `ada`
- `adapad`
- `adco`
- `adp`
- `ads`
- `adx`
- `ae`
- `aegis`
- `aergo`
- `aero`
- `aevo`
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
- `airi`
- `ait`
- `akt`
- `alcx`
- `aleph`
- `alex`
- `alfa1`
- `algb`
- `algo`
- `algorand`
- `ali`
- `allin`
- `alot`
- `alpaca`
- `alph`
- `alpha`
- `alphaWallet`
- `alu`
- `amb`
- `amkt`
- `amo`
- `amp`
- `ampl`
- `amz`
- `anc`
- `ankr`
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
- `ar`
- `arb`
- `arbi`
- `arbitrum`
- `arbitrumNova`
- `arbitrumOne`
- `arc`
- `ardr`
- `area`
- `argent`
- `ari`
- `ari10`
- `aria20`
- `ark`
- `arkm`
- `arrr`
- `arsw`
- `arv`
- `arweave`
- `ascn`
- `asd`
- `asia`
- `asm`
- `assa`
- `ast`
- `astar`
- `astroc`
- `ath`
- `atlas`
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
- `autonomys`
- `ava`
- `avalanche`
- `avax`
- `avinoc`
- `avt`
- `axe`
- `axel`
- `axl`
- `axs`
- `azero`
- `azit`
- `b2m`
- `backpack`
- `bake`
- `bal`
- `balancer`
- `ban`
- `bancor`
- `band`
- `bao`
- `base`
- `bat`
- `bax`
- `bbank`
- `bbl`
- `bcb`
- `bcd`
- `bcdt`
- `bch`
- `bcmc`
- `bcn`
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
- `biso`
- `bist`
- `bit`
- `bitbox`
- `bitci`
- `bitcoin`
- `bithumb`
- `bitkubChain`
- `bitstamp`
- `blast`
- `bld`
- `blid`
- `block`
- `blox`
- `blp`
- `blt`
- `blur`
- `blx`
- `blxm`
- `blz`
- `bmc`
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
- `bora`
- `boring`
- `boson`
- `botanix`
- `botto`
- `bouncebit`
- `box`
- `bpro`
- `bpt`
- `breed`
- `brg`
- `brick`
- `bridge`
- `brise`
- `brn`
- `brock`
- `bs`
- `bscpad`
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
- `btt`
- `btu`
- `build`
- `bull`
- `bump`
- `burger`
- `busd`
- `buy`
- `bxx`
- `bybit`
- `bzr`
- `bzrx`
- `bzz`
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
- `catheon`
- `cbeth`
- `cbx`
- `cby`
- `ccd`
- `ccv2`
- `cdai`
- `cdt`
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
- `cgo`
- `cgt`
- `chain`
- `chat`
- `chiliz`
- `cho`
- `chr`
- `chrp`
- `chz`
- `cirus`
- `ckp`
- `clave`
- `clh`
- `clore`
- `clover`
- `cls`
- `clv`
- `clxy`
- `cmdx`
- `cmos`
- `cnd`
- `cnfi`
- `cng`
- `cnht`
- `coin98`
- `coinbase`
- `coinexSmartChain`
- `combo`
- `comp`
- `conflux`
- `conv`
- `cope`
- `copi`
- `corn`
- `cos`
- `cosmos`
- `cosmosHub`
- `cosmoshub`
- `cov`
- `cow`
- `cowswap`
- `cph`
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
- `crpt`
- `crts`
- `cru`
- `crwny`
- `cryptoCom`
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
- `cudos`
- `cuminu`
- `cummies`
- `cusd`
- `cusdc`
- `cvc`
- `cvp`
- `cvr`
- `cweb`
- `cws`
- `cxo`
- `cyber`
- `d2t`
- `d3d`
- `dacxi`
- `dad`
- `dafi`
- `dag`
- `dai`
- `dao`
- `dash`
- `data`
- `dbc`
- `dbr`
- `dc`
- `dcb`
- `dck`
- `dcr`
- `defi`
- `defit`
- `defx`
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
- `diode`
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
- `dodo`
- `dog`
- `doga`
- `dola`
- `dome`
- `domi`
- `dose`
- `dot`
- `dpay`
- `dps`
- `dpx`
- `dseth`
- `dsm`
- `dsrun`
- `dtx`
- `dusk`
- `dust`
- `dvf`
- `dvi`
- `dvpn`
- `dweb`
- `dxgm`
- `dxl`
- `dydx`
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
- `ela`
- `eland`
- `elastos`
- `elf`
- `elk`
- `eml`
- `emp`
- `energyWeb`
- `enj`
- `enkrypt`
- `ens`
- `enuls`
- `eos`
- `eosdt`
- `epic`
- `epik`
- `eqb`
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
- `fcon`
- `fct`
- `fctr`
- `fdusd`
- `fear`
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
- `floor`
- `flow`
- `flr`
- `fls`
- `fluence`
- `fluid`
- `flux`
- `flx`
- `fnsa`
- `fold`
- `for`
- `fore`
- `forex`
- `fort`
- `forth`
- `four`
- `fpis`
- `fps`
- `fra`
- `frax`
- `fraxtal`
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
- `gas`
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
- `ggg`
- `ggp`
- `ghny`
- `gho`
- `ghost`
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
- `gmm`
- `gmpd`
- `gmx`
- `gno`
- `gnosis`
- `gns`
- `gny`
- `go`
- `gofx`
- `gog`
- `gora`
- `govi`
- `grai`
- `grail`
- `grain`
- `grav`
- `gravity`
- `grc`
- `grin`
- `grs`
- `grt`
- `gse`
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
- `heart`
- `hederaHashgraph`
- `hegic`
- `hello`
- `hemi`
- `hermes`
- `hero`
- `hez`
- `hft`
- `hgt`
- `hibs`
- `hid`
- `hifi`
- `hilo`
- `hive`
- `hmnd`
- `hmx`
- `hnt`
- `hoge`
- `hon`
- `honey`
- `hook`
- `hop`
- `hopr`
- `hord`
- `hot`
- `hpo`
- `hst`
- `ht`
- `htm`
- `htr`
- `hubbleExchange`
- `hunt`
- `husd`
- `hush`
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
- `idna`
- `idrt`
- `idv`
- `ieth`
- `ignis`
- `igu`
- `ilv`
- `immutable`
- `imo`
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
- `iost`
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
- `itheum`
- `itp`
- `ixo`
- `ixs`
- `ixt`
- `jam`
- `japanOpenChain`
- `jasmy`
- `jkl`
- `jmpt`
- `jones`
- `jop`
- `joy`
- `jst`
- `juld`
- `jungle4eos`
- `juno`
- `jup`
- `k21`
- `kag`
- `kai`
- `kaia`
- `kakarot`
- `kalm`
- `kan`
- `kap`
- `kar`
- `karate`
- `karura`
- `kas`
- `kasta`
- `kat`
- `katana`
- `kau`
- `kava`
- `kcs`
- `kda`
- `keep`
- `keplr`
- `kex`
- `key`
- `kick`
- `kicks`
- `kilt`
- `kin`
- `kine`
- `kint`
- `kit`
- `klay`
- `kleva`
- `klima`
- `klt`
- `klv`
- `kma`
- `kmd`
- `kmon`
- `knc`
- `kndx`
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
- `kunci`
- `kwai`
- `kwenta`
- `kyve`
- `l2`
- `l3x`
- `la`
- `lai`
- `lamb`
- `land`
- `lat`
- `launch`
- `lavaNetwork`
- `layer`
- `lazio`
- `lbr`
- `lbt`
- `lcr`
- `lcs`
- `lcx`
- `ldo`
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
- `linea`
- `ling`
- `link`
- `lisk`
- `lit`
- `litecoin`
- `lith`
- `litt`
- `lixx`
- `lm`
- `lmwr`
- `loc`
- `lode`
- `loka`
- `lon`
- `looks`
- `loom`
- `loopring`
- `lords`
- `lovely`
- `lpnt`
- `lpool`
- `lpt`
- `lqdr`
- `lrc`
- `lsd`
- `lsk`
- `lss`
- `ltc`
- `lto`
- `ltx`
- `lua`
- `luca`
- `lufc`
- `lukso`
- `lumia`
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
- `m87`
- `maha`
- `man`
- `mana`
- `manc`
- `mantaPacific`
- `mantle`
- `mantra`
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
- `meme`
- `met`
- `meta`
- `metav`
- `meter`
- `metf`
- `metfi`
- `metis`
- `metisAndromeda`
- `mex`
- `mf`
- `mft`
- `milkomedaA1`
- `milkomedaC1`
- `mimatic`
- `mimo`
- `min`
- `mina`
- `mind`
- `mint`
- `mir`
- `mkr`
- `ml`
- `mlk`
- `mln`
- `mm`
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
- `mod`
- `mode`
- `mona`
- `monad`
- `moonbase`
- `moonbaseAlpha`
- `moonbeam`
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
- `mts`
- `mtv`
- `multis`
- `multiversx`
- `musd`
- `muse`
- `music`
- `mute`
- `mvd`
- `mvi`
- `mvl`
- `mwc`
- `mx`
- `mxc`
- `mxm`
- `myEtherWallet`
- `myria`
- `myst`
- `mzr`
- `nabox`
- `nahmii`
- `nals`
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
- `neonEvm`
- `nest`
- `nett`
- `neuroni`
- `newo`
- `nex`
- `nexis`
- `nfai`
- `nftart`
- `nftb`
- `nftbs`
- `nftx`
- `ngc`
- `ngm`
- `nht`
- `nibiru`
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
- `obot`
- `obsr`
- `obvious`
- `oce`
- `ocean`
- `oddz`
- `odin`
- `odos`
- `oeth`
- `ogn`
- `okb`
- `okex`
- `okt`
- `okx`
- `olt`
- `om`
- `omax`
- `omg`
- `omi`
- `ommi`
- `omni`
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
- `optimism`
- `optopia`
- `opul`
- `orare`
- `orbs`
- `order`
- `orderly`
- `ordi`
- `ort`
- `os`
- `osmo`
- `osmosis`
- `otk`
- `ousd`
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
- `pawth`
- `paxg`
- `pay`
- `pbr`
- `pbx`
- `pdex`
- `pdt`
- `peaq`
- `pendle`
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
- `pika`
- `pillar`
- `pinksale`
- `pip`
- `pivx`
- `pixel`
- `pkf`
- `pkt`
- `pla`
- `planets`
- `plastik`
- `plex`
- `pli`
- `pln`
- `plr`
- `plt`
- `plu`
- `pnb`
- `png`
- `pnk`
- `pnt`
- `pokt`
- `pol`
- `pola`
- `polkadot`
- `pols`
- `polx`
- `poly`
- `polygon`
- `polygonPos`
- `polygonZkevm`
- `polypad`
- `polyx`
- `pond`
- `poolx`
- `pop`
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
- `qmall`
- `qnt`
- `qr`
- `qrdo`
- `qrl`
- `qsr`
- `qtcon`
- `qtum`
- `quad`
- `quartz`
- `qube`
- `quidd`
- `quint`
- `r`
- `rad`
- `radio`
- `rae`
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
- `rbn`
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
- `reuni`
- `rev`
- `rev3l`
- `revv`
- `reya`
- `rfox`
- `rgen`
- `rgt`
- `ride`
- `rif`
- `rin`
- `ring`
- `rise`
- `rite`
- `rjv`
- `rlb`
- `rlc`
- `rly`
- `rmrk`
- `rndr`
- `rome`
- `ronin`
- `roobee`
- `rook`
- `rootstock`
- `rose`
- `route`
- `rpg`
- `rpl`
- `rsc`
- `rsr`
- `rss3`
- `rtm`
- `rune`
- `rvc`
- `rvn`
- `rvst`
- `rwn`
- `rxd`
- `s`
- `safe`
- `sai`
- `sail`
- `saitama`
- `saito`
- `sakai`
- `salt`
- `sama`
- `san`
- `sand`
- `satt`
- `savg`
- `sbd`
- `sbtc`
- `sc`
- `scb`
- `sclp`
- `scnsol`
- `scp`
- `scroll`
- `scrt`
- `sdex`
- `sdl`
- `sdn`
- `sdt`
- `sei`
- `seiNetwork`
- `seilor`
- `senate`
- `send`
- `sender`
- `sense`
- `sequence`
- `sero`
- `seth`
- `seth2`
- `sfi`
- `sfm`
- `sfp`
- `sfrxeth`
- `sftmx`
- `sfund`
- `shft`
- `shi`
- `shiden`
- `shido`
- `shimmerEvm`
- `shopx`
- `shrap`
- `shroom`
- `shx`
- `si`
- `sidus`
- `signa`
- `silicon`
- `silk`
- `silo`
- `sis`
- `six`
- `skeb`
- `skey`
- `skl`
- `slam`
- `slcl`
- `slg`
- `slnd`
- `slr`
- `smartcredit`
- `smbr`
- `smt`
- `sn`
- `snc`
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
- `source`
- `sov`
- `spa`
- `space`
- `spank`
- `sparta`
- `spc`
- `sph`
- `sphere`
- `spirit`
- `spool`
- `spore`
- `spx`
- `squads`
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
- `stars`
- `stat`
- `statom`
- `status`
- `stbu`
- `steem`
- `stellar`
- `step`
- `stfx`
- `stg`
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
- `ststars`
- `stx`
- `sub`
- `sudo`
- `sui`
- `suip`
- `suku`
- `superSeed`
- `superseed`
- `supraMovevm`
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
- `tao`
- `tara`
- `tarot`
- `tbtc`
- `tdrop`
- `teer`
- `tel`
- `telos`
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
- `thundercore`
- `tia`
- `tidal`
- `tifi`
- `tig`
- `time`
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
- `tt`
- `ttk`
- `tulip`
- `tusd`
- `tut`
- `tvk`
- `twt`
- `txau`
- `u`
- `ubiq`
- `ubsn`
- `ubt`
- `ubxs`
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
- `utk`
- `uw3s`
- `vab`
- `vai`
- `valor`
- `vana`
- `vanar`
- `vara`
- `vaulta`
- `vc`
- `vcore`
- `vee`
- `vega`
- `vela`
- `velas`
- `velo`
- `vemp`
- `venly`
- `vent`
- `verse`
- `vet`
- `veur`
- `vex`
- `vext`
- `vgx`
- `via`
- `vib`
- `viction`
- `vidt`
- `vidya`
- `vine`
- `vita`
- `vite`
- `vix`
- `vlx`
- `vlxpad`
- `vno`
- `voice`
- `voxel`
- `vpad`
- `vr`
- `vra`
- `vrsw`
- `vsp`
- `vsta`
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
- `whales`
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
- `wnxm`
- `wom`
- `wombat`
- `woo`
- `woof`
- `world`
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
- `xlm`
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
- `xtp`
- `xtz`
- `xvg`
- `xvs`
- `xwg`
- `xy`
- `xyo`
- `yak`
- `yam`
- `ycc`
- `ydf`
- `yes`
- `yfi`
- `yfii`
- `yoshi`
- `you`
- `zano`
- `zap`
- `zat`
- `zbc`
- `zcn`
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
- `znn`
- `zoomer`
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
  <a href="/about"><10setIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><1artIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><1inchIcon size="20" class="nav-icon" /> Settings</a>
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
    <10setIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <1artIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <0x0Icon size="24" />
   <10setIcon size="24" color="#4a90e2" />
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
     import { 0x0 } from '@stacksjs/iconify-token'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(0x0, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 0x0 } from '@stacksjs/iconify-token'

// Icons are typed as IconData
const myIcon: IconData = 0x0
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify#installation) - Core rendering functions and utilities
- [Iconify Integration Guide](../iconify) - Complete guide to using Iconify with stx
- [stx Documentation](../) - Main stx documentation

## License

MIT

See [license details](https://github.com/0xa3k5/web3icons/blob/main/LICENCE) for more information.

## Credits

- **Icons**: 0xa3k5 ([Website](https://github.com/0xa3k5/web3icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/token/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/token/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
