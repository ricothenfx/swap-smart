import { Capacitor } from "@capacitor/core"
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics"
import type { PickerEvent } from "../views/PickerSession"

/** Native haptic feedback for picker events — silent no-op on web/unsupported devices. */
export function pickerHaptic(e: PickerEvent): void {
  if (!Capacitor.isNativePlatform()) return
  void (async () => {
    try {
      if (e === "oos") await Haptics.notification({ type: NotificationType.Warning })
      else if (e === "confirm") await Haptics.impact({ style: ImpactStyle.Medium })
      else await Haptics.impact({ style: ImpactStyle.Light })
    } catch {
      // cosmetic only
    }
  })()
}
