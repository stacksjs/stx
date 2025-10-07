import type { IconData } from '@stx/iconify-core'

export const pulse: IconData = {
  "body": "<circle cx=\"12\" cy=\"12\" r=\"0\" fill=\"currentColor\"><animate attributeName=\"r\" calcMode=\"spline\" dur=\"1.2s\" keySplines=\".52,.6,.25,.99\" repeatCount=\"indefinite\" values=\"0;11\"/><animate attributeName=\"opacity\" calcMode=\"spline\" dur=\"1.2s\" keySplines=\".52,.6,.25,.99\" repeatCount=\"indefinite\" values=\"1;0\"/></circle>",
  "width": 24,
  "height": 24,
  "viewBox": "0 0 24 24"
}

export default pulse
