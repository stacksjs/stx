# Guidance

> Guidance icons for stx from Iconify

## Overview

This package provides access to 360 icons from the Guidance collection through the stx iconify integration.

**Collection ID:** `guidance`
**Total Icons:** 360
**Author:** Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
**License:** CC BY 4.0 ([Details](https://creativecommons.org/licenses/by/4.0/))
**Category:** UI 24px
**Palette:** No (monotone icons)

## Installation

```bash
bun add @stacksjs/iconify-guidance
```

## Quick Start

### Component Usage (Recommended)

Icons are available as .stx components that can be used directly in templates:

```html
<24HoursIcon height="1em" />
<24HoursIcon width="1em" height="1em" />
<24HoursIcon height="24" />
```

### With Properties

```html
<!-- Using size property -->
<24HoursIcon size="24" />
<24HoursIcon size="1em" />

<!-- Using width and height -->
<24HoursIcon width="24" height="32" />

<!-- With color -->
<24HoursIcon size="24" color="red" />
<24HoursIcon size="24" color="#4a90e2" />

<!-- With CSS class -->
<24HoursIcon size="24" class="icon-primary" />

<!-- With all properties -->
<24HoursIcon
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
    <24HoursIcon size="24" />
    <AccesibleRestroomIcon size="24" color="#4a90e2" />
    <AccessForHearingLossIcon size="32" class="my-icon" />
  </div>
</body>
</html>
```

### Data-Only Import

You can also import icon data and use the `renderIcon` function directly:

```typescript
import { 24Hours, accesibleRestroom, accessForHearingLoss } from '@stacksjs/iconify-guidance'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(24Hours, { size: 24 })
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
<24HoursIcon size="24" color="red" />
<24HoursIcon size="24" color="#4a90e2" />

<!-- Via inline style -->
<24HoursIcon size="24" style="color: green;" />

<!-- Via CSS class -->
<24HoursIcon size="24" class="text-primary" />
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
<24HoursIcon height="1em" />
<24HoursIcon width="1em" height="1em" />
<24HoursIcon height="24" />
```

You can also use the `size` property as a shorthand for setting both width and height:

```html
<24HoursIcon size="24" />
<24HoursIcon size="1em" />
```

### CSS Sizing

You can also control icon size via CSS:

```css
.guidance-icon {
  width: 1em;
  height: 1em;
}
```

```html
<24HoursIcon class="guidance-icon" />
```

## Available Icons

This package contains **360** icons:

- `24Hours`
- `accesibleRestroom`
- `accessForHearingLoss`
- `accessToLowVision`
- `accessibleExit`
- `accessibleExit2`
- `accessibleMenRestroom`
- `accessibleWomenRestroom`
- `airplaneMode`
- `airplaneModeOff`
- `alarm`
- `alarmBell`
- `alertOctagon`
- `alertTriangle`
- `ambulanceEntrance`
- `amusementPark`
- `aquarium`
- `arcade`
- `arrival`
- `assistiveListeningDevice`
- `atm`
- `audioDescription`
- `auditorium`
- `bank`
- `bar`
- `bell`
- `bicycle`
- `billingDepartment`
- `bin`
- `binPerson`
- `binThrowPerson`
- `bowling`
- `boxing`
- `braille`
- `bus`
- `cablecar`
- `cafeteria`
- `calendar`
- `camera`
- `campfires`
- `campground`
- `car`
- `carRental`
- `card`
- `careStaffArea`
- `casino`
- `changinRoomDisabled`
- `changinRoomFamily`
- `changinRoomMan`
- `changinRoomWoman`
- `changingRoomHanger`
- `chapel`
- `chargingStation`
- `chat`
- `childrenMustBeSupervised`
- `cleaningRoom`
- `cleaningRoom2`
- `climbingWall`
- `clock`
- `closedCaptioning`
- `cloud`
- `coffeeShop`
- `computerRoom`
- `conferenceRoom`
- `coworkingSpace`
- `crutch`
- `currencyExchange`
- `customs`
- `dangerPoison`
- `departure`
- `deskForLaptop`
- `discotheque`
- `dislike`
- `doNotSit`
- `doNotSkateboardRollerboard`
- `doNotStandHere`
- `down2ShortArrow`
- `downAngleArrow`
- `downArrow`
- `downLeft2ShortArrow`
- `downLeftArrow`
- `downRight2ShortArrow`
- `downRightArrow`
- `drinkingFountain`
- `drinkingWater`
- `droneZone`
- `eBike1`
- `eBike2`
- `elderlyPeoplePrioritySeating`
- `electricScooter`
- `electricWheelchair`
- `elevator`
- `elevatorAccesible`
- `elevatorPerson`
- `emergencyExit`
- `entry`
- `escalator`
- `escalatorDownArrow`
- `escalatorDownPerson`
- `escalatorUpArrow`
- `escalatorUpPerson`
- `exclamationMark`
- `exit`
- `eye`
- `faceScan`
- `fallingRocks`
- `femaleSign`
- `fingerprintScan`
- `fireAlarm`
- `fireExtinguisher`
- `fireHazard`
- `fireHose`
- `firstAid`
- `fishingArea`
- `fishingArea1`
- `fishingArea2`
- `flashAllowed`
- `flashNotAllowed`
- `folder`
- `forbidden`
- `forbidden2`
- `fountain`
- `fragile`
- `funicularRailway`
- `gallery`
- `garden`
- `gasStation`
- `giftShop`
- `glass`
- `globe`
- `golfCourse`
- `groupTraining`
- `guestHeightLimit`
- `guestWithinHeightLimitMustBeSupervised`
- `gym`
- `hairdresser`
- `headphones`
- `healthServices`
- `heart`
- `helicopter`
- `hideEyeCrossbar`
- `highVoltage`
- `hiking`
- `holdTight`
- `home`
- `home2`
- `hospital`
- `hotelRoom`
- `hotelRoom2`
- `hydrant`
- `image`
- `inPatient`
- `informationDeskPeople`
- `informationDeskSymbol`
- `intensiveCare`
- `irisScan`
- `kitchen`
- `laboratory`
- `laundry`
- `laundry2`
- `left2ShortArrow`
- `leftAngleArrow`
- `leftArrow`
- `leftLuggage`
- `lessMinus`
- `lgbtFriendly`
- `library`
- `like`
- `locationOff`
- `locationPin`
- `lock`
- `lockers`
- `lostAndFound`
- `lounge`
- `luggage`
- `luggageCheckIn`
- `luggageConveyorBelt`
- `luggageLockers`
- `luggageTrolley`
- `mail`
- `mailbox`
- `maleSign`
- `map`
- `massage`
- `medicalLaboratory`
- `meetingPoint`
- `meetingPoint2`
- `meetingRoom`
- `menRestroom`
- `money`
- `moreAddPlus`
- `motorcycle`
- `mriPet`
- `museum`
- `musicRoom`
- `muteNotification`
- `newspapers`
- `noAccessForServiceAnimal2`
- `noAccessForServiceAnimal3`
- `noAccessForServiceAnimal4`
- `noAlcohol`
- `noDrinkingWater`
- `noDroneAllowed`
- `noDrugOrSubstance`
- `noElectricScooter`
- `noEntryForPedestrians`
- `noFirearmWeapon`
- `noFishing1`
- `noFood`
- `noLitter2`
- `noLuggageTrolleysBeyondThisPoint`
- `noNoise`
- `noParking`
- `noPetsAllowed`
- `noPictures`
- `noRunning`
- `noSelfieStickAllowed`
- `noSmoking`
- `noTouch`
- `noVideo`
- `noWheelchairAccess`
- `nursery`
- `office`
- `officePod`
- `paper`
- `parentAndInfantPrioritySeating`
- `park`
- `parking`
- `passports`
- `patio`
- `pedestrians`
- `pen`
- `personalTraining`
- `petsAllowed`
- `pharmacy`
- `phone`
- `physicalTherapy`
- `pilates`
- `plane`
- `plastic`
- `play`
- `playRoom`
- `playground`
- `police`
- `port`
- `prayingRoom`
- `pregnantWomanPrioritySeating`
- `printer`
- `projectionRoom`
- `prostheticArm`
- `prostheticLeg`
- `pull`
- `push`
- `questionMark`
- `quietArea`
- `radiation`
- `radiology`
- `rampDown`
- `rampDownArrow`
- `rampUp`
- `rampUpArrow`
- `receptionHotelBell`
- `recordingStudio`
- `recycling`
- `refillForWaterBottle`
- `refrigeration`
- `removeXCross`
- `restaurant`
- `right2ShortArrow`
- `rightAngleArrow`
- `rightArrow`
- `rvTrailer`
- `safeSocialDistancing`
- `sanitizeHands`
- `sauna`
- `schoolZone`
- `search`
- `send`
- `serviceAnimal1`
- `serviceAnimal2`
- `serviceAnimal3`
- `settings`
- `share`
- `shelter`
- `ship`
- `shop`
- `showers`
- `signLanguage`
- `skatePark`
- `smiley`
- `smokingArea`
- `socket`
- `spinning`
- `stadium`
- `staffOnly`
- `stairs`
- `stairsDownArrow`
- `stairsDownPerson`
- `stairsUpArrow`
- `stairsUpPerson`
- `standHere`
- `star`
- `strollerParking`
- `studyRoom`
- `sun`
- `surgery`
- `surveillanceCamera`
- `swimmingPool`
- `taxi`
- `telecoil`
- `terrace`
- `tickets`
- `time`
- `tools`
- `touch`
- `track`
- `trailerSites`
- `train`
- `transgenderSign`
- `tunnel`
- `uiPhone`
- `unisexRestroom`
- `unlock`
- `up2ShortArrow`
- `upAngleArrow`
- `upArrow`
- `upLeft2ShortArrow`
- `upLeftArrow`
- `upRight2ShortArrow`
- `upRightArrow`
- `user1`
- `user2`
- `vendingMachine`
- `video`
- `visualImpairment`
- `voiceScan`
- `volume`
- `volumeControlTelephone`
- `waitingRoom`
- `walker`
- `washHands`
- `waste`
- `wc`
- `wearGasMask`
- `wearGloves`
- `wearGoggles`
- `wearHardHat`
- `wearHeadset`
- `wearMask`
- `weightlifting`
- `wetFloor`
- `wheelchair1`
- `wheelchair2`
- `wheelchairBasketball`
- `wheelchairTennis`
- `wiFi`
- `wifiOff`
- `womenRestroom`
- `yoga`
- `zoo`

## Usage Examples

### Navigation Menu

```html
<nav>
  <a href="/"><24HoursIcon size="20" class="nav-icon" /> Home</a>
  <a href="/about"><AccesibleRestroomIcon size="20" class="nav-icon" /> About</a>
  <a href="/contact"><AccessForHearingLossIcon size="20" class="nav-icon" /> Contact</a>
  <a href="/settings"><AccessToLowVisionIcon size="20" class="nav-icon" /> Settings</a>
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
<24HoursIcon
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
    <24HoursIcon size="16" color="#22c55e" />
    <span>Success</span>
  </div>
  <div class="status-item">
    <AccesibleRestroomIcon size="16" color="#f59e0b" />
    <span>Warning</span>
  </div>
  <div class="status-item">
    <AccessForHearingLossIcon size="16" color="#ef4444" />
    <span>Error</span>
  </div>
</div>
```

## Best Practices

1. **Use Components Directly**: Import and use icon components in your templates
   ```html
   <!-- Recommended -->
   <24HoursIcon size="24" />
   <AccesibleRestroomIcon size="24" color="#4a90e2" />
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
   <24HoursIcon size="24" class="icon" />
   ```

3. **Set Appropriate Sizes**: Use `1em` for inline icons, fixed pixel sizes for standalone icons
   ```html
   <!-- Inline with text -->
   <p>Click the <24HoursIcon height="1em" /> icon to continue</p>

   <!-- Standalone -->
   <24HoursIcon size="24" />
   ```

4. **Use Data Import for Advanced Use Cases**: When you need more control
   ```html
   @js
     import { 24Hours } from '@stacksjs/iconify-guidance'
     import { renderIcon } from '@stacksjs/iconify-core'
     global.customIcon = renderIcon(24Hours, { size: 24 })
   @endjs

   {!! customIcon !!}
   ```

## TypeScript Support

This package includes full TypeScript support with type definitions for all icons.

```typescript
import type { IconData } from '@stacksjs/iconify-core'
import { 24Hours } from '@stacksjs/iconify-guidance'

// Icons are typed as IconData
const myIcon: IconData = 24Hours
```

## Related Packages

- [`@stacksjs/iconify-core`](../iconify-core) - Core rendering functions
- [Main Iconify Documentation](../../docs/iconify.md) - Complete iconify integration guide

## License

CC BY 4.0

See [license details](https://creativecommons.org/licenses/by/4.0/) for more information.

## Credits

- **Icons**: Streamline ([Website](https://github.com/webalys-hq/streamline-vectors))
- **Iconify**: [https://iconify.design/](https://iconify.design/)
- **Icon Set**: [View on Iconify](https://icon-sets.iconify.design/guidance/)

## Resources

- [Browse all icons in this collection](https://icon-sets.iconify.design/guidance/)
- [Iconify documentation](https://iconify.design/docs/)
- [stx iconify integration guide](../../docs/iconify.md)
