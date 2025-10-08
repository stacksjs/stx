# Custom Brand Icons

> Custom Brand Icons icons for stx from Iconify

## Overview

This package provides access to 1490 icons from the Custom Brand Icons collection through the stx iconify integration.

**Collection ID:** `cbi`
**Total Icons:** 1490
**Author:** Emanuele & rchiileea ([Website](https://github.com/elax46/custom-brand-icons))
**License:** CC BY-NC-SA 4.0 ([Details](https://github.com/elax46/custom-brand-icons/blob/main/LICENSE))
**Category:** Logos
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-cbi
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<02tvIcon height="1em" />
<02tvIcon width="1em" height="1em" />
<02tvIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<02tvIcon size="24" />
<02tvIcon size="1em" />

<!-- Using width and height -->
<02tvIcon width="24" height="32" />

<!-- With color -->
<02tvIcon size="24" color="red" />
<02tvIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<02tvIcon size="24" class="icon-primary" />

<!-- With all properties -->
<02tvIcon
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
    <02tvIcon size="24" />
    <10PlayIcon size="24" color="#4a90e2" />
    <17TrackIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 02tv, 10Play, 17Track } from '@stacksjs/iconify-cbi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(02tv, { size: 24 })
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
<02tvIcon size="24" color="red" />
<02tvIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<02tvIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<02tvIcon size="24" class="text-primary" />
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
<02tvIcon height="1em" />
<02tvIcon width="1em" height="1em" />
<02tvIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<02tvIcon size="24" />
<02tvIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.cbi-icon {
  width: 1em;
  height: 1em;
}
```

```html
<02tvIcon class="cbi-icon" />
```

## Available Icons

This package contains **1490** icons:

- `02tv`
- `10Play`
- `17Track`
- `2WayUplighter`
- `3dFilament`
- `3dprinterPrinting`
- `3dprinterStandby`
- `3sat`
- `7plusTv`
- `9Now`
- `a1Mini`
- `abarth`
- `abbRadio`
- `abc`
- `abcIview`
- `abletonlive`
- `acura`
- `adguard`
- `adore`
- `adoreAlt`
- `adoreMirror`
- `ai`
- `airConditioner`
- `airFilter`
- `airPresure`
- `airSourceHeating`
- `airconWindow`
- `airfryer`
- `airgradient`
- `airgradientAlt`
- `airgradientOne`
- `airgradientOpenAir`
- `alarmDotCom`
- `alexaLogo`
- `alfaRomeo`
- `alpine`
- `amarant`
- `amaze`
- `amazeAlt`
- `amazonLogo`
- `amc`
- `ampMeasure`
- `analogue`
- `analogue3d`
- `androidtv`
- `apcUpsBasic`
- `apcUpsUpright`
- `appleAirpods`
- `appleAirpodsMax`
- `appleAirpodsPro`
- `appleIpadPro`
- `appleIphone`
- `appleTv`
- `appleTvBox`
- `appleWatch`
- `appleWatchAlt`
- `appleWatchPro`
- `appletvGen2Remote`
- `appletvSim`
- `aqaraA100`
- `aqaraAirQuality`
- `aqaraBodyfatScale`
- `aqaraCameraG5`
- `aqaraContact`
- `aqaraCube`
- `aqaraCurtain`
- `aqaraDwP2`
- `aqaraE1`
- `aqaraE1RsdM1`
- `aqaraFp1`
- `aqaraFp2`
- `aqaraG2Pro`
- `aqaraG3`
- `aqaraG4`
- `aqaraGasDetector`
- `aqaraH11`
- `aqaraH12`
- `aqaraH13`
- `aqaraH1Dimmer`
- `aqaraH1Switch`
- `aqaraH2DimmerSwitch`
- `aqaraH2Switch`
- `aqaraHiPrecisionMotion`
- `aqaraHubN15G2`
- `aqaraInwall`
- `aqaraM3`
- `aqaraMotion`
- `aqaraN100`
- `aqaraOpple`
- `aqaraPanelS1Plus`
- `aqaraPetFeederC1`
- `aqaraSmokeDetector`
- `aqaraSymphonyT1`
- `aqaraT1`
- `aqaraTemperature`
- `aqaraThermoE1`
- `aqaraU100`
- `aqaraU200`
- `aqaraU300`
- `aqaraVibration`
- `aqaraWaterleak`
- `aqaraWirelessbutton`
- `aqaraZ1Pro1`
- `aqaraZ1Pro2`
- `aqaraZ1Pro3`
- `aqaraZ1Pro4`
- `arcam`
- `ard`
- `ardAlpha`
- `arloAudioDoorbell`
- `arloBaby`
- `arloBaseStation`
- `arloCam`
- `arloEssentialIndoor`
- `arloFloodlight`
- `arloPro3`
- `arloQ`
- `arloSecurityLight`
- `arloUltra2`
- `arloVideoDoorbell`
- `arte`
- `astonMartin`
- `asusNew`
- `asusRp68u`
- `atariConsole`
- `atresPlayer`
- `audi`
- `aura`
- `auraGroup`
- `authentik`
- `avito`
- `bambuLab`
- `bambuLabAlt`
- `bathroom`
- `batteryBackup`
- `batteryCharged`
- `batteryCritical`
- `batteryFull`
- `batteryGood`
- `batteryHalf`
- `batteryLow`
- `batteryTemp`
- `bazarr`
- `bbc`
- `bbcradio2`
- `bedroom`
- `bedroomAltNumbered`
- `bentley`
- `beyond`
- `beyondDown`
- `beyondSolid`
- `beyondUp`
- `bigbrother`
- `binge`
- `bitfocus`
- `bitwarden`
- `bleMesh`
- `blindTiltClosed`
- `blindTiltOpen`
- `blocknet`
- `bloom`
- `bluOs`
- `blueos`
- `bluray`
- `blusoundNode`
- `bmw`
- `bmwAlt`
- `bmwI`
- `bocaJuniors`
- `bollard`
- `boschThermostat`
- `boseSoundtouch`
- `bosesOundwave`
- `br1`
- `bridge`
- `bridgesv1`
- `bridgesv2`
- `btg`
- `bugatti`
- `bulbCandleHung`
- `bulbClassicOff`
- `bulbFilamentAlt`
- `bulbFilamentCandle`
- `bulbGolfballE14`
- `bulbGroupBollard3Off`
- `bulbGroupBollardWallAppear`
- `bulbGroupCeilingFlushCircular`
- `bulbGroupCeilingRound`
- `bulbGroupCeilingSquare`
- `bulbGroupCentura`
- `bulbGroupCenturaRound`
- `bulbGroupClassic3`
- `bulbGroupClassic3Alt`
- `bulbGroupClassic4`
- `bulbGroupClassic4Alt`
- `bulbGroupClassicHung3`
- `bulbGroupClassicHung3Alt`
- `bulbGroupClassicHung4`
- `bulbGroupClassicHung4Alt`
- `bulbGroupFilamentAlt`
- `bulbGroupFilamentCandle`
- `bulbGroupFilamentSpot`
- `bulbGroupFilamentSultan`
- `bulbGroupGolfballE14`
- `bulbGroupLightstrip`
- `bulbGroupLightstripV`
- `bulbGroupPar38`
- `bulbGroupPillarTuracoShortTall`
- `bulbGroupSultanLightstrip`
- `bulbGroupSultanLightstripOff`
- `bulbGroupSultanSpot`
- `bulbGroupSultanSpotOff`
- `bulbGroupWallNyroFlood`
- `bulbLightguideFlask`
- `bulbLightguideOval`
- `bulbLightguideRound`
- `bulbPar38`
- `bulbRefresh`
- `bulbSpotOff`
- `bulbSultanGroupV2`
- `bulbSultanOff`
- `bulbSultanV2`
- `bulbcandle`
- `bulbflood`
- `bulbfoh`
- `bulbgeneralgroup`
- `bulbgroup`
- `bulbsclassic`
- `bulbsfilament`
- `bulbsspot`
- `bulbssultan`
- `button`
- `byd`
- `caiway`
- `cameraCar`
- `cameraNomotion`
- `cameraPerson`
- `cameraPet`
- `carFob`
- `carrier`
- `carrierHome`
- `casaos`
- `cbs`
- `ceilingAdore`
- `ceilingAdoreAlt`
- `ceilingAdoreAltFlush`
- `ceilingAdoreFlush`
- `ceilingAurelle`
- `ceilingAurelleCircle`
- `ceilingBeing`
- `ceilingBuckram`
- `ceilingBuckramThree`
- `ceilingBuckramTwo`
- `ceilingBuratto`
- `ceilingBurattoFour`
- `ceilingBurattoThree`
- `ceilingBurattoTwo`
- `ceilingBurattoTwoOff`
- `ceilingCherSemiflush`
- `ceilingDevere`
- `ceilingExplore`
- `ceilingFair`
- `ceilingFairSemiflush`
- `ceilingFan`
- `ceilingFanAlt`
- `ceilingFanLight`
- `ceilingFlourish`
- `ceilingFlushCircular`
- `ceilingFugatoFour`
- `ceilingFugatoFourAlt`
- `ceilingFugatoThree`
- `ceilingFugatoThreeAlt`
- `ceilingFugatoTwo`
- `ceilingFugatoTwoAlt`
- `ceilingInfuse`
- `ceilingLamp`
- `ceilingLampPlafond`
- `ceilingLampRound`
- `ceilingMuscari`
- `ceilingRunner`
- `ceilingRunnerThree`
- `ceilingRunnerTwo`
- `ceilingSpotLamp`
- `ceilingStill`
- `ceilingSurimu`
- `ceilingXamento`
- `ceilinground`
- `ceilingsquare`
- `centris`
- `centrisFour`
- `centrisThree`
- `centrisTwo`
- `centura`
- `centuraRound`
- `centuraTwo`
- `chandelier`
- `channel4Uk`
- `chargingStation`
- `chevrolet`
- `chicken`
- `chickenCoup`
- `chickenCoupDoorShut`
- `christmasLights`
- `christmasTree`
- `christmasTreeV2`
- `christmasWreath`
- `chromecast`
- `chromecastAlt`
- `chrysler`
- `citroen`
- `cloakroom`
- `clockEuro`
- `cloudflare`
- `cnn`
- `co2`
- `colombiaFcf`
- `compressor`
- `confluence`
- `cookerExtractOff`
- `cookerExtractOn`
- `corinthians`
- `costco`
- `cowboyEbike`
- `cowboyEbikeAlt`
- `crealityCfs`
- `crealityComplete`
- `crealityHi`
- `crestronSwirl`
- `crunchyrol`
- `culturebox`
- `cupra`
- `cync`
- `dacia`
- `daikin`
- `dartboard`
- `daserste`
- `dayloWall`
- `dazn`
- `deezerLogo`
- `delta`
- `denon`
- `deskSit`
- `deskSitAlt`
- `deskStand`
- `deskStandAlt`
- `desklamp`
- `desktopComputer`
- `deutschlandfunk`
- `devicesplug`
- `devicestap`
- `dhl`
- `dimmerswitch`
- `directtv`
- `directvGo`
- `directvGoAlt`
- `discord`
- `discoveryPlus`
- `dishNetwork`
- `dishNetworkAlt`
- `disneyPlus`
- `disneyPlusAlt`
- `dodge`
- `dolbyAtmos`
- `domeLight`
- `doubeWindowBOpen`
- `doubeWindowClosed`
- `doubeWindowLOpen`
- `doubeWindowROpen`
- `doubleSmartPlug`
- `doubleWallSwitch`
- `doubleWindowClosed`
- `doubleWindowOpen`
- `doublespot`
- `downstairs`
- `downstairsBasement`
- `downstairsGround`
- `dreamcast`
- `driveway`
- `drtv`
- `ds`
- `dstv`
- `dts`
- `dtsX`
- `duckdns`
- `duco1`
- `duco2`
- `duco3`
- `ducoAuto`
- `ducoLogo`
- `duneHd`
- `duplicati`
- `duux360`
- `dvd`
- `dysonDesk`
- `dysonFloor`
- `easee`
- `echoDot4Group`
- `echoDotGen3`
- `echoDotGen4`
- `echoDotGen4Clock`
- `echoFlex`
- `echoGen2`
- `echoPlus`
- `echoPop`
- `echoShow10`
- `echoShow15`
- `echoShow5Gen2`
- `echoShow5Group`
- `echoShow8Gen2`
- `echoShow8Group`
- `echoSpot`
- `echoStudio2nd`
- `ecovacs`
- `ecowitt`
- `eero`
- `eggs`
- `elecBlanket`
- `elgatoKeyLight`
- `elgatoKeyLightAir`
- `elgatoRingLight`
- `ellevio`
- `emby`
- `ensis`
- `ensisUp`
- `epson`
- `esphome`
- `esphomeNew`
- `espn`
- `essentialOilDiffuser`
- `essentialOilDiffuserAlt`
- `etc`
- `eufyDoorbell`
- `evCharging`
- `evNotcharging`
- `ewelink`
- `extensionEu`
- `extensionUk`
- `extensionUs`
- `extractorFan`
- `ezviz`
- `f1`
- `f1Alt`
- `fanBlade`
- `fanduel`
- `fastgate`
- `fedex`
- `festavia`
- `fiat`
- `fingerbot`
- `firefox`
- `firetv`
- `firetvCube`
- `fisker`
- `flaresolverr`
- `floorLamp`
- `floorLampDual`
- `floorLanternGroup`
- `floorLanternOff`
- `floorShadesCombo`
- `floorlantern`
- `floorshade`
- `floorspot`
- `flourish`
- `flourishAlt`
- `flow`
- `ford`
- `fortaleza`
- `fortinet`
- `fox`
- `foxNews`
- `foxxEss`
- `france2`
- `france3`
- `france4`
- `france5`
- `franceinfo`
- `friendsOfHueArke`
- `friendsOfHueArkeRound`
- `friendsOfHueAuroraDimmerSwitch`
- `friendsOfHueAuroraDimmerSwitchAlt`
- `friendsOfHueEikon`
- `friendsOfHueFlatP`
- `friendsOfHueFlatPAlt`
- `friendsOfHueIqFlush`
- `friendsOfHueIqPendant`
- `friendsOfHueMarbulSuspended`
- `friendsOfHueRetrotouchBlackChrome`
- `friendsOfHueRetrotouchBlackPlain`
- `friendsOfHueRetrotouchWhiteChrome`
- `friendsOfHueRetrotouchWhitePlain`
- `friendsOfHueRigel`
- `friendsOfHueSenic`
- `friendsofhue`
- `frigate`
- `fritzRepeater`
- `fritzbox7530`
- `froniusInverterGen24`
- `gamecube`
- `garage3Prong`
- `garage4Prong`
- `garage5Prong`
- `garageAltOpen`
- `garageAltShut`
- `garbageCardboard`
- `garbageGlassAlu`
- `garbageOrganic`
- `garbagePlastic`
- `garbageResidual`
- `garden`
- `gardenIrrigation`
- `geely`
- `geko`
- `gemini`
- `genericCarCharger`
- `genesis`
- `genesisVgs`
- `glasspanelDoorClosed`
- `glasspanelDoorOpen`
- `globoplay`
- `go`
- `goGroup`
- `goGroupOff`
- `goOff`
- `goPortableTable`
- `go3`
- `goaccess`
- `googleHome`
- `googleHomeIcon`
- `googleLogoCircle`
- `googlePixel`
- `googleWifiRouter`
- `goplay`
- `goplayAlt`
- `goveeH6046`
- `goveeH6076`
- `gradientTubeLong`
- `gradientTubeShort`
- `grafana`
- `greatWall`
- `grillCeramic`
- `grillCharcoal`
- `grillGas`
- `grogu`
- `guacamole`
- `haBlue`
- `habbitatMartinelli`
- `habbitatRibbon`
- `hbo`
- `heatedMaiden`
- `heb`
- `helium`
- `heliumTot`
- `heos`
- `hermanMillerAeron`
- `hino`
- `hive`
- `hobby`
- `holden`
- `homeMini`
- `homekit`
- `homematiIp`
- `homepod`
- `homepodMini`
- `homey`
- `honda`
- `honeywell`
- `hoodExtraction`
- `hotNet`
- `hoymilesInverter`
- `hr1`
- `huawei`
- `huaweiSolarInverter`
- `hubitat`
- `hueOnly`
- `hueSpotGroupV2`
- `hueSpotV2`
- `hueSyncStrip`
- `hulu`
- `humidity`
- `hyundai`
- `hyundaiAlt`
- `hyundaiIoniq`
- `ikea5Spot`
- `ikeaBlindClosed`
- `ikeaBlindHalf`
- `ikeaBlindOpen`
- `ikeaBlindRemote`
- `ikeaDimmer`
- `ikeaFado`
- `ikeaFelsisk`
- `ikeaFloaltPanel`
- `ikeaFornuftig`
- `ikeaGunnarpPanel`
- `ikeaGunnarpRound`
- `ikeaHaddebo`
- `ikeaHektar3`
- `ikeaHogvind`
- `ikeaJakobsbyn`
- `ikeaKallax1`
- `ikeaKallax16`
- `ikeaKallax2`
- `ikeaKallax2Upright`
- `ikeaKallax4`
- `ikeaKallax8`
- `ikeaPaparlamp`
- `ikeaPiskott`
- `ikeaPs2014`
- `ikeaPs2014Open`
- `ikeaRemote`
- `ikeaSinnerlig`
- `ikeaStarkvind`
- `ikeaTokabo`
- `ikeaUppatvind`
- `ikeaVarmblixt`
- `ikeaVidja`
- `imac`
- `infiniti`
- `infusePro`
- `insteon`
- `intelCpu`
- `intelNuc`
- `intexPoolLight`
- `iosfacetime`
- `iosphotos`
- `iossettings`
- `ipmi2mqtt`
- `iptvx`
- `iris`
- `irisGroup`
- `irobot`
- `itvx`
- `iviTv`
- `jaguar`
- `jeep`
- `jellyfin`
- `jellyseerr`
- `jenkinsLogo`
- `jiocinema`
- `justwatch`
- `kayo`
- `keenetic`
- `kia`
- `kidsRoom`
- `kika`
- `kikaAlt`
- `kinopoisk`
- `kinopub`
- `kionTv`
- `kitchen`
- `kitchenAlt`
- `kitchenGroup`
- `klara`
- `knx`
- `koenigsegg`
- `kpn`
- `kuma`
- `lamborghini`
- `lampBedsideTable`
- `lampBedsideTable2`
- `lampadaParete`
- `lancia`
- `landrover`
- `lapremiere`
- `laptop`
- `laptopWindows`
- `laptopWindowsAlt`
- `lci`
- `lego`
- `letsencrypt`
- `lexus`
- `lg`
- `lgAirPurifier`
- `lgAircon`
- `lgCooker`
- `lgFridge`
- `lgOled55`
- `lgSigniture`
- `liane`
- `lidlCurvedLamp`
- `liftInWindowClosed`
- `liftInWindowOpen1`
- `liftInWindowOpen2`
- `liftOutWindowClose`
- `liftOutWindowOpen`
- `lightString`
- `lightstrip`
- `lightstripOff`
- `lightstripTv`
- `lightstripTvAlt`
- `lightstripTvOff`
- `lightstripWrap`
- `lily`
- `lilyAlt`
- `lilyTwo`
- `lilyXl`
- `lilyXlAlt`
- `linksys`
- `linktap`
- `litHouseNumber`
- `litterRobot`
- `litterRobotEmpty`
- `litterbox`
- `livingRoom`
- `livingroomGroup`
- `lotus`
- `lrDefender`
- `lsSpotIrisGroupV2`
- `lsSultanIrisGroupV2`
- `lucid`
- `lyrion`
- `maLighting`
- `maLighting3`
- `magentatv`
- `magentatvAlt`
- `mainsail`
- `mammotion`
- `marksSparks`
- `marqueeShutter`
- `marvel`
- `maserati`
- `matter`
- `max`
- `maxdome`
- `maybach`
- `mazda`
- `mclaren`
- `mdr1`
- `mealie`
- `mediasetInfinity`
- `mercadona`
- `mercedes`
- `meta`
- `metube`
- `metv`
- `mg`
- `miBedsideLamp2`
- `mieleScout`
- `mikrotik`
- `mini`
- `miniBmw`
- `miniCamera`
- `mitsubishi`
- `mnmRadio`
- `modbus`
- `modelS`
- `modelSCharge`
- `modelSChargeSide`
- `modelSSide`
- `modelXCharge`
- `modelXOpen`
- `moes4way`
- `moesSwitchDual`
- `moesSwitchSingle`
- `moesSwitchTriple`
- `moisture`
- `molotovtv`
- `monit`
- `monzo`
- `moonlight`
- `moreTv`
- `mosquitto`
- `motionSensorLuminance`
- `motionSensorLuminanceAlt`
- `motionSensorTemperature`
- `motionsensor`
- `motogp`
- `moviesAnywhere`
- `moviesAnywhereText`
- `moviesAnywhereTextVertical`
- `movistarPlus`
- `mqtt`
- `mustang`
- `myCanal`
- `myenergi`
- `mysaThermostat`
- `n64`
- `nanoleaf`
- `nanoleafBlackHexagons`
- `nanoleafBlocks`
- `nanoleafBulb`
- `nanoleafCup`
- `nanoleafExpoDisplay`
- `nanoleafFloorlamp`
- `nanoleafHexGrain`
- `nanoleafHolidayString`
- `nanoleafLines`
- `nanoleafMultcolorStrip`
- `nanoleafOutdoorString`
- `nanoleafPegboard`
- `nanoleafPermanentOutdoorLight`
- `nanoleafRecessed`
- `nanoleafRopelight`
- `nanoleafScreenLights`
- `nanoleafSecretlabs`
- `nanoleafSensePlus`
- `nanoleafShapes`
- `nanoleafUmbraCono`
- `nas`
- `nasV2`
- `nbc`
- `ndr1`
- `neon`
- `neonClosed`
- `neonOpen`
- `nesConsole`
- `nestAudio`
- `nestHub`
- `nestMini`
- `nestMiniAlt`
- `nestWifiRepeater`
- `nestWifiRouter`
- `netapp`
- `netflix`
- `netflixAlt`
- `netgearSwitch`
- `nextHubMax`
- `nextcloud`
- `nexxt`
- `nginx`
- `nighthawk`
- `nintendoSwitchLogo`
- `nio`
- `nissan`
- `nodered`
- `noip`
- `nowtv`
- `npo`
- `nrk`
- `nrkradio`
- `nsproPanel`
- `nuki`
- `nut`
- `nvidiaGeforce`
- `nvidiaShield`
- `oauth`
- `octoprint`
- `octopusenergy`
- `odido`
- `odometer`
- `office`
- `oiTv`
- `okkoTv`
- `okoo`
- `okooAlt`
- `ondemandAus`
- `one`
- `onkyo`
- `opel`
- `openhasp`
- `openmediavault`
- `openwrtLogo`
- `opnsense`
- `oqee`
- `orangetv`
- `orbi`
- `otherReading`
- `otherWatchingMovie`
- `ouraO`
- `outdoorMotion`
- `outdoorMotionSensorTemperature`
- `outside`
- `outsideTemp`
- `overseerr`
- `ovhcloud`
- `ovo`
- `p1s`
- `pagani`
- `panasonic`
- `panelDoorClose`
- `panelDoorLocked`
- `panelDoorOpen`
- `panelFrontDoorLocked`
- `panelFrontdoorClose`
- `panelFrontdoorOpen`
- `panelGlassDoor2Locked`
- `panelGlassDoor3Locked`
- `panelGlassDoor4Locked`
- `panelGlassDoorClose`
- `panelGlassDoorLocked`
- `panelGlassDoorOpen`
- `panelGlassDoor2Close`
- `panelGlassDoor2Open`
- `panelGlassDoor3Close`
- `panelGlassDoor3Open`
- `panelGlassSideDoorLocked`
- `panelGlassdoorClose`
- `panelGlassdoorOpen`
- `panelOven`
- `paramount`
- `pathe`
- `patioDoorsClosed`
- `patioDoorsOpen`
- `pbs`
- `peacock`
- `peas`
- `pedastalFan`
- `pedastalFanHollow`
- `pedestal`
- `peloton`
- `pendantBeing`
- `pendantCher`
- `pendantDevoteSolid`
- `pendantDevoteThreeSolid`
- `pendantDevoteTwoSolid`
- `pendantLongUp`
- `pendantMuscari`
- `pendantlong`
- `pendantround`
- `peppers`
- `perfectDraft`
- `perifoSpot`
- `petWaterFountain`
- `petflapClosed`
- `petflapOpen`
- `peugeot`
- `peugeotAlt`
- `pfsenseLogo`
- `phantom`
- `phantomPair`
- `phoenix`
- `phoenixPendant`
- `phoenixPlafond`
- `phoenixSemiflush`
- `phoenixTable`
- `phoscon`
- `piano`
- `picnic`
- `pillarImpress`
- `pillarImpressShort`
- `pillarNyro`
- `pillarSpot`
- `pillarSpot2`
- `pillarSpot3`
- `pillarSpotDouble`
- `pillarTuar`
- `pillarTuracoShort`
- `pillarTuracoTall`
- `pinball`
- `pivUnit`
- `pixelwatch`
- `play`
- `playBarOne`
- `playBarThree`
- `playBarTwo`
- `playBarV`
- `playBarVAlt`
- `playBarVTwo`
- `playBarVTwoIn`
- `playBarVTwoOut`
- `playbackButton`
- `playstation`
- `playstation3`
- `playstation4`
- `playstation5`
- `plex`
- `plexAlt`
- `plexamp`
- `plugEu`
- `plugUk`
- `plutotv`
- `pm`
- `pm25`
- `pocketcasts`
- `polestar`
- `poolClorine`
- `poolDepth`
- `poolDisolved`
- `poolElectricLvl`
- `poolFilter`
- `poolSalinty`
- `porsche`
- `portainer`
- `postnl`
- `powerPanelLogo`
- `primeVideo`
- `primeVideoAlt`
- `prometheusio`
- `prosieben`
- `prowlarr`
- `proxmox`
- `prusaCore`
- `prusaMini`
- `prusaMk3s`
- `prusaMk4`
- `prusaXl`
- `qbittorrent`
- `qmusicRadio`
- `quatt`
- `radarr`
- `radio1`
- `radon`
- `raiPlay`
- `rainBarrel`
- `ram`
- `ramMemory`
- `raspberryPi`
- `rbb1`
- `recessedCeiling`
- `recessedfloor`
- `redbullTv`
- `redeBandeirantes`
- `redeGlobo`
- `regolitArcLamp`
- `renault`
- `renaultInvert`
- `reolink510`
- `reolink811`
- `reolink820`
- `reolink842`
- `reolinkArgus`
- `reolinkDoorbell`
- `reolinkE1`
- `reolinkGo`
- `reolinkTrackmix`
- `resmed`
- `retroArena`
- `ring`
- `ringAlarm`
- `ringAlarmPanel`
- `ringDoorbell`
- `ringDoorbellPro`
- `ringFloodlight`
- `ringSmartLighting`
- `ringSpotlightCam`
- `ringStickUpCam`
- `rituals`
- `rivian`
- `robinhood`
- `roborock`
- `rocketleague`
- `rokuUltra`
- `rollerShutterSwitch`
- `rollsroyce`
- `romaineLettuce`
- `roomsFrontDoor`
- `roomsattic`
- `roomsbalcony`
- `roomsbathroom`
- `roomsbedroom`
- `roomscarport`
- `roomscloset`
- `roomscomputer`
- `roomsdining`
- `roomsdriveway`
- `roomsfrontdoor`
- `roomsgarage`
- `roomsguestroom`
- `roomsgym`
- `roomshallway`
- `roomskidsbedroom`
- `roomskitchen`
- `roomslaundryroom`
- `roomsliving`
- `roomslounge`
- `roomsmancave`
- `roomsnursery`
- `roomsoffice`
- `roomsother`
- `roomsoutdoor`
- `roomsoutdoorsocialtime`
- `roomspool`
- `roomsporch`
- `roomsrecreation`
- `roomsstaircase`
- `roomsstorage`
- `roomsstudio`
- `roomsterrace`
- `roomstoilet`
- `roon`
- `rotaryMop`
- `royalmail`
- `rtl`
- `rtlzwei`
- `rvn`
- `sabnzbd`
- `saic`
- `sainsburys`
- `salt`
- `saltLamp`
- `samba`
- `samsung`
- `sana`
- `sanaAlt`
- `sat1`
- `scart`
- `sceneBright`
- `sceneConcentrate`
- `sceneDimmed`
- `sceneDynamic`
- `sceneEnergize`
- `sceneNightlight`
- `sceneRead`
- `sceneRelax`
- `schneider`
- `scion`
- `seagateSsd`
- `seagateSsdM2`
- `seat`
- `sega`
- `segaSaturn`
- `serieA`
- `shadeRchiileeaV1`
- `shedClosed`
- `shedOpen`
- `shellyLogo`
- `shudder`
- `shutter0`
- `shutter10`
- `shutter100`
- `shutter20`
- `shutter30`
- `shutter40`
- `shutter50`
- `shutter60`
- `shutter70`
- `shutter80`
- `shutter90`
- `sideGlassdoorClose`
- `sideGlassdoorOpen`
- `signe`
- `signeGradientFloor`
- `signeGradientTable`
- `singleWallSwitch`
- `singlespot`
- `skoda`
- `skyAlt`
- `skyQLogo`
- `skyShowtime`
- `skyone`
- `skysportsF1`
- `skysportsFootball`
- `skysportsMainevent`
- `skysportsNews`
- `skysportsPremierleague`
- `sleepTimer`
- `sleepiq`
- `slidingBarndoorClosed`
- `slidingBarndoorOpen`
- `slidingWindowDoorClose`
- `slidingWindowDoorOpen`
- `sllingTv`
- `smallFan`
- `smart`
- `smartCamera`
- `smartDeskLamp`
- `smartPlugIt`
- `smartPlugSchuko`
- `smartPlugSonoff`
- `smartPowerStrip`
- `smartSwitch`
- `smarthomeSolver`
- `smokeDetector`
- `snapcast`
- `snes`
- `sobeys`
- `socketEu`
- `socketUk`
- `socketUs`
- `soilMoisture`
- `soilReading`
- `solanaSol`
- `solarBattery`
- `solarBattery10`
- `solarBattery15`
- `solarBattery5`
- `sonarr`
- `sonnen`
- `sonoff`
- `sonoff0p1`
- `sonos`
- `sonosArc`
- `sonosBeam`
- `sonosBookshelfHorizontal`
- `sonosBookshelfVertical`
- `sonosEra100`
- `sonosEra300`
- `sonosFive`
- `sonosMove`
- `sonosOne`
- `sonosPlay3`
- `sonosPlaybar`
- `sonosPort`
- `sonosRay`
- `sonosRoam`
- `sonosSub`
- `sonosSubMini`
- `sotool`
- `speedtest`
- `spicebottle`
- `splitdoorOpen`
- `spotBulbTop`
- `spotify`
- `spotpearBalV2`
- `spotpearBallV1`
- `spotpearCube`
- `spotpearCustomSpeaker`
- `spotpearRoundN16r8`
- `spotpearRoundSpeakerN16r8`
- `sprinkler`
- `srRadio`
- `stageBacklight`
- `stageLight`
- `stageLightGroup`
- `stageSpotLight`
- `stageUplight`
- `stagelLight2`
- `stagelLight2Group`
- `stan`
- `stanSport`
- `starPlus`
- `starPlusAlt`
- `starbucks`
- `starlink`
- `startTv`
- `stdFloodlight`
- `steam`
- `steamDeck`
- `stereoAlt`
- `stitch`
- `streamz`
- `stremio`
- `stromer`
- `studioBrussel`
- `subaru`
- `sultanGroup`
- `sultanGroupHung`
- `sunsynk`
- `suzuki`
- `svtTv`
- `swr`
- `sxm`
- `sydneyBus`
- `sydneyMetro`
- `symfoniskLampe`
- `syncBox`
- `syncBoxAlt`
- `syncModule`
- `synologyDsm`
- `systenair`
- `tabbarHome`
- `tableCylinderLamp`
- `tableLighting`
- `tableLightingAlt`
- `tableshade`
- `tablet`
- `tablewash`
- `tado`
- `tadoThermostat`
- `tagesschau24`
- `tailscale`
- `tapDial`
- `target`
- `telegram`
- `telenet`
- `telenetBox`
- `tempSensor`
- `tempestWeatherflow`
- `teslaCar`
- `teslaDefrost`
- `teslaDoor`
- `teslaFan`
- `teslaFart`
- `teslaFlash`
- `teslaHood`
- `teslaHorn`
- `teslaIcon`
- `teslaLock`
- `teslaOpen`
- `teslaSentry`
- `teslaStart`
- `teslaTrunk`
- `teslaVent`
- `tet`
- `tetPlus`
- `tf1`
- `tf1SeriesFilms`
- `tfx`
- `thermostat`
- `thermostatV2`
- `threadNet`
- `tibber`
- `tidalLogo`
- `tiltWindowClosed`
- `tiltWindowOpened`
- `timLogo`
- `timLogoAlt`
- `tivo`
- `tmc`
- `tomato`
- `tomatoEnergy`
- `tomorrowland`
- `topRadio`
- `topTechno`
- `topWindowClosed`
- `topWindowOpen`
- `towerFan`
- `toyota`
- `tpLinkTapo`
- `tplinkRe450`
- `tplinkRouter`
- `traccar`
- `traderJoes`
- `trakt`
- `transmissionBt`
- `treadmill`
- `trezor`
- `tripleWallSwitch`
- `tripodLampNorm`
- `tronity`
- `truenasLogo`
- `trx`
- `tubeLights`
- `tuenaero`
- `tuya`
- `tv2tv`
- `tvimate`
- `tvnz`
- `twinkly`
- `twinklyC9`
- `twinklyCandiesCandles`
- `twinklyCandiesHearts`
- `twinklyCandiesPearl`
- `twinklyCandiesStars`
- `twinklyCluster`
- `twinklyCurtain`
- `twinklyDots`
- `twinklyFestoon`
- `twinklyIcicle`
- `twinklyMatrix`
- `twinklySpritzer`
- `twinklySquares`
- `twistThermostat`
- `twitch`
- `twitchAlt`
- `ubiquiti`
- `ubiquitiAp`
- `ubiquitiCamFlex`
- `ubiquitiCamInstant`
- `ubiquitiLogo`
- `ubiquitiUdmPro`
- `ubiquitiUsgP3`
- `ubiquitiUx`
- `ubiquitiWifiAccesspoint`
- `ukScouts`
- `ulanziTc001`
- `umage`
- `umageAcorn`
- `umageCarmina`
- `underfloorHeating`
- `unifi`
- `unifiProtect`
- `unraid`
- `uplighter`
- `upsDlv`
- `upstairs`
- `upstairs1`
- `upstairs2`
- `upstairs3`
- `upstairs4`
- `usbSmartAdaptor`
- `usps`
- `vacFilter`
- `vacMbrush`
- `vacMop`
- `vacSbrush`
- `vaillant`
- `valetudo`
- `vanguard`
- `vaultwarden`
- `vauxhall`
- `versuzRadio`
- `vertBlindClose`
- `vertBlindOpen`
- `viaplay`
- `victoriaM`
- `victronEnergy`
- `videoland`
- `virgin`
- `virginmedia`
- `voc`
- `volkswagen`
- `volvo`
- `volvoAlt`
- `voron`
- `vox`
- `voyah`
- `vrtKlara`
- `vrtLogo`
- `vrtMax`
- `vrtRadio1`
- `vrtStubru`
- `vsc`
- `vtm`
- `vtmAlt`
- `vtmgo`
- `vudu`
- `waiputv`
- `wallAppear`
- `wallAppearGroup`
- `wallEconic`
- `wallEconicLantern`
- `wallEconicLanternBase`
- `wallEconicLanternTop`
- `wallFlood`
- `wallFuzo`
- `wallFuzoH`
- `wallImpress`
- `wallImpressNarrow`
- `wallImpressNarrowThree`
- `wallImpressNarrowTwo`
- `wallInara`
- `wallInaraAlt`
- `wallLucca`
- `wallLuccaAlt`
- `wallLuccaAltBelow`
- `wallMountedTablet`
- `wallNyro`
- `wallResonate`
- `wallRunner`
- `wallSwitch`
- `wallSwitchModule`
- `wallTuar`
- `wallTuraco`
- `walllantern`
- `wallshade`
- `wallspot`
- `walmart`
- `waterReservoir`
- `waterSoftener`
- `wdr1`
- `weatherPageAlt`
- `wellner`
- `wellnerSolid`
- `wellness`
- `wheelLoader`
- `wifiDongle`
- `wifiExtender`
- `windowSensor`
- `windows`
- `winkTv`
- `wiserHeatingCtlOff`
- `wiserHeatingCtlOn`
- `wiserThermostatOff`
- `wiserThermostatOn`
- `worldScout`
- `worldScoutAlt`
- `wow`
- `wppilot`
- `wpsWifi`
- `wyzecam`
- `xbox`
- `xboxAlt`
- `xiaomiLogo`
- `xpeng`
- `xt2Camera`
- `yamahaRxV773`
- `yeelightBesideLamp`
- `yeelightBulb`
- `yeelightBulbGroup`
- `yeelightCeiling`
- `yeelightCube`
- `yeelightCube2`
- `yeelightDesklamp`
- `yeelightMeteorite`
- `yeelightStrip`
- `yourSpotify`
- `youtube`
- `youtubeAlt`
- `youtubeKids`
- `youtubeMusic`
- `youtubeTv`
- `zattoo`
- `zdf`
- `zdfheute`
- `zdfinfo`
- `zdfneo`
- `zdftivi`
- `zen`
- `zeroMotorcycles`
- `zidooo`
- `zigbeeDongle`
- `zigbee2mqtt`
- `ziggo`
- `zonesAreasFirstFloor`
- `zonesAreasGroundFloor`
- `zonesAreasSecondFloor`
- `zonneplan`
- `zucchini`
- `zwaveDongle`
- `zwavejs`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><02tvIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><10PlayIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><17TrackIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><2WayUplighterIcon size="20" class="nav-icon" /> Settings</a>
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
<02tvIcon
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
    <02tvIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <10PlayIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <17TrackIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <02tvIcon size="24" />
   <10PlayIcon size="24" color="#4a90e2" />
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
   <02tvIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <02tvIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <02tvIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 02tv } from '@stacksjs/iconify-cbi'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(02tv, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 02tv } from '@stacksjs/iconify-cbi'

// Icons are typed as IconData
const myIcon: IconData = 02tv
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY-NC-SA 4.0

See [license details](https://github.com/elax46/custom-brand-icons/blob/main/LICENSE) for more information.

## Credits

- **Icons**: Emanuele & rchiileea ([Website](https://github.com/elax46/custom-brand-icons))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/cbi/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/cbi/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
