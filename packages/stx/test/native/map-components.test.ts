import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource } from '../../src/native/compiler/render-screen'
import { createTempDir } from '../../src/temp-dir'

describe('portable native map components', () => {
  it('keeps native camera controls, provider credit, colored pins and direction signs through the component pipeline', async () => {
    const { document } = await compileScreenSource(`<Map class="h-[320px] w-full rounded-[20px]" pitch-enabled="false" rotate-enabled="true" shows-compass shows-scale camera-pitch="30" camera-heading="90"
      :tileOverlay="{urlTemplate:'https://example.org/{z}/{y}/{x}.png',attribution:'Test map data'}"
      :edgePadding="{top:32,bottom:180,left:24,right:24}" fit-to-bounds>
      <MapPolyline id="route" geometry="[37,-119,37.01,-119.01]" stroke-color="#24724b" stroke-width="5" />
      <MapMarker id="start" geometry="[37,-119]" pin-color="#24724b" title="Trailhead" @press="selectMarker($event)" />
      <MapMarker id="direction" geometry="[37.005,-119.005]" bearing="90" />
    </Map>`, path.join(import.meta.dir, 'NativeMapComponents.stx'))
    expect(document.root.type).toBe('Map')
    expect(document.root.style).toMatchObject({ height: 320, width: '100%', borderRadius: 20 })
    expect(document.root.props).toMatchObject({
      pitchEnabled: false, rotateEnabled: true, showsCompass: true, showsScale: true, cameraPitch: 30, cameraHeading: 90, fitToBounds: true,
      tileOverlay: { urlTemplate: 'https://example.org/{z}/{y}/{x}.png', attribution: 'Test map data' },
      edgePadding: { top: 32, bottom: 180, left: 24, right: 24 },
    })
    const children = document.root.children.filter(child => typeof child !== 'string')
    expect(children.map(child => child.type)).toEqual(['MapPolyline', 'MapMarker', 'MapMarker'])
    expect(children[0].props).toMatchObject({ geometry: [37, -119, 37.01, -119.01], strokeColor: '#24724b', strokeWidth: 5 })
    expect(children[1].props).toMatchObject({ pinColor: '#24724b', title: 'Trailhead' })
    expect(children[1].events).toEqual({ onPress: 'selectMarker($event)' })
    expect(children[2].props.bearing).toBe(90)
  })

  for (const platform of ['ios', 'android']) {
    it(`updates the ${platform} map through native mutations without browser globals or a replacement screen`, async () => {
      const directory = createTempDir('stx-native-map-')
      const file = path.join(directory, 'MapScreen.stx')
      await Bun.write(file, `<script client>
const tilted = state(true)
const pin = state('#24724b')
const route = state([37,-119,37.01,-119.01])
function updateMap() { tilted.set(false); pin.set('#2878c8'); route.set([37,-119,37.02,-119.02]) }
</script>
<View>
  <Map class="h-[320px]" :pitchEnabled="tilted()" showsCompass>
    <MapPolyline :geometry="route()" strokeColor="#24724b" strokeWidth="5" />
    <MapMarker id="start" geometry="[37,-119]" :pinColor="pin()" />
  </Map>
  <Button @click="updateMap()">Update map</Button>
</View>`)
      const { code } = await compileSharedScreenBundle(file)
      const sent: any[] = []
      let receive: (message: string) => void = () => {}
      vm.runInNewContext(code, {
        console, Promise, Date, Map, Set, WeakMap, WeakSet, setTimeout, clearTimeout,
        __stxNativeBridge: {
          platform,
          mutationProtocolVersion: 1,
          postMessage: (raw: string) => sent.push(JSON.parse(raw)),
          onMessage: (callback: typeof receive) => { receive = callback },
        },
      })
      await Bun.sleep(0)
      const root = sent.find(message => message.type === 'RENDER').payload.document
      const [map, button] = root.children
      const [line, marker] = map.children
      const operations = () => sent.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations)
      expect(operations()).toContainEqual(expect.objectContaining({ id: map.id, patch: { props: { pitchEnabled: true } } }))
      expect(operations()).toContainEqual(expect.objectContaining({ id: marker.id, patch: { props: { pinColor: '#24724b' } } }))
      const handler = operations().find(operation => operation.id === button.id && operation.patch?.events?.onPress).patch.events.onPress
      sent.length = 0
      receive(JSON.stringify({ type: 'EVENT', payload: { handlerId: handler, nativeEvent: {} } }))
      await Bun.sleep(0)
      expect(operations()).toContainEqual(expect.objectContaining({ id: map.id, patch: { props: { pitchEnabled: false } } }))
      expect(operations()).toContainEqual(expect.objectContaining({ id: marker.id, patch: { props: { pinColor: '#2878c8' } } }))
      expect(operations()).toContainEqual(expect.objectContaining({ id: line.id, patch: { props: { geometry: [37, -119, 37.02, -119.02] } } }))
      expect(sent.some(message => message.type === 'RENDER')).toBe(false)
    })
  }
})
