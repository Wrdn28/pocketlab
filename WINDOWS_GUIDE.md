# PocketLab Windows Guide

This guide covers running and configuring **PocketLab** on Microsoft Windows 10 and Windows 11 with the **Sonicake Pocket Master (QME-20)** multi-effects processor.

---

## 1. Running the Application

### Option A: Standalone Desktop Application (Recommended)
You can run PocketLab as a native desktop application with full hardware access:

1. **Development Mode**:
   ```cmd
   npm run electron
   ```

2. **Build Installer / Executable**:
   ```cmd
   npm run dist:win
   ```
   This generates an NSIS installer and a portable executable inside the `release/` directory:
   - `PocketLab Setup 1.0.0.exe` (Installer with desktop shortcuts)
   - `PocketLab 1.0.0.exe` (Portable executable)

> **Windows SmartScreen Note:**
> Because PocketLab is an open-source community application without an expensive commercial code-signing certificate, Windows Defender SmartScreen may display: *"Windows protected your PC"*.
> Click **More info**, then click **Run anyway**.

---

### Option B: Modern Web Browser (Chrome, Edge, Brave)
PocketLab can also run inside any Chromium-based browser supporting the Web MIDI and Web Bluetooth APIs:

1. Start the local server:
   ```cmd
   npm run dev
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```
3. When prompted by the browser, click **Allow** to grant Web MIDI and Web Bluetooth permissions.

---

## 2. Hardware Connection

### A. USB Connection (Class-Compliant USB MIDI)
The Sonicake Pocket Master uses standard class-compliant USB Audio and MIDI protocols. 

1. Plug the pedal into your PC using a USB-C data cable.
2. Windows will automatically detect and configure the device using the built-in `usbaudio.sys` driver. No third-party manufacturer drivers are required.
3. In PocketLab, click **Connect**, select the **USB Connection** tab, and choose `Sonicake Pocket Master`.

> **Important: Exclusive MIDI Port Access on Windows**
> Classic Windows MIDI (MME) does not allow multiple applications to access the same MIDI port at the same time.
> - If a Digital Audio Workstation (such as Reaper, Ableton Live, FL Studio, or Cubase) or another MIDI application is running and holding the Pocket Master MIDI port, PocketLab will not be able to communicate with the pedal.
> - **Solution**: Close any active DAW or disable the Pocket Master MIDI input/output inside your DAW settings before connecting PocketLab.

---

### B. Bluetooth Low Energy (BLE) Connection
If your Windows PC or laptop has Bluetooth 4.2 or 5.0+:

1. Turn on Bluetooth in Windows Settings (`Settings > Bluetooth & devices`).
2. Ensure Bluetooth is active on your Pocket Master pedal.
3. In PocketLab, click **Connect** in the top header and switch to the **Bluetooth** tab.
4. Click **Scan Bluetooth Devices**.
5. Select `Pocket Master` from the Windows pairing prompt and click **Pair**.

---

## 3. Troubleshooting

- **Pedal not detected over USB**:
  - Ensure you are using a data-capable USB-C cable (some cables are charge-only).
  - Try plugging into a direct motherboard USB port rather than an unpowered USB hub.
  - Check Windows Device Manager under *Sound, video and game controllers* to ensure `Pocket Master` appears without yellow warning icons.
- **Parameters do not update on pedal**:
  - Verify that the connection indicator in the PocketLab header shows green (*Pedal Connected*).
  - If you were in *Simulation Mode*, disconnect and reconnect to the physical USB device.
