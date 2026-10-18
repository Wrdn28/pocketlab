# PocketLab

> **Unofficial Desktop Editor and Tone Suite for the Sonicake Pocket Master (QME-20)**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-success.svg)](https://github.com/Wrdn28/pocketlab)
[![Author](https://img.shields.io/badge/Author-hirokixd-orange.svg)](https://github.com/Wrdn28)

---

## Disclaimer

> [!IMPORTANT]
> **PocketLab is an independent, third-party open-source companion application created by hirokixd.**
>
> This software is **NOT** an official product of, nor is it endorsed, sponsored, affiliated with, or supported by **Sonicake Technology Co., Ltd.** or any of its respective subsidiaries or affiliates.
>
> All product names, logos, brands, and registered trademarks (including but not limited to *Sonicake*, *Pocket Master*, *QME-20*, and *Neural Amp Modeler*) are the property of their respective trademark holders. They are used in this project solely for device compatibility identification and technical description purposes.

---

## Overview

**PocketLab** is an authentic, studio-grade desktop software editor designed specifically for the **Sonicake Pocket Master (QME-20)** multi-effects processor. 

While official mobile companion apps provide basic tone adjustments on small touchscreens, PocketLab delivers a complete desktop workstation experience for musicians and producers, providing granular, real-time control over their hardware pedal via USB MIDI or Bluetooth Low Energy (BLE).

---

## Key Features

### Real-Time Signal Chain and Parameter Control
- **Interactive Routing**: Visualize and adjust your audio signal chain in real time. PocketLab enforces the authentic hardware fixed-core block (`DRV -> AMP -> IR -> EQ`) while allowing free positioning for pre and post effects.
- **Precision Rotary Knobs and Faders**: Studio-modeled drag-to-turn knurled knobs and vertical faders with calibrated numerical readouts.
- **Instant Hardware Synchronization**: Every knob change, effect toggle, or module bypass sends low-latency SysEx commands directly to the pedal with zero lag.

### Neural Amp Modeler (NAM) Architecture 2 Support
- **Direct Model Import**: Drag and drop or browse `.nam`, `.namb`, and `.json` neural amp profiles.
- **Architecture 2 and V1/V2 Support**: Automatic parsing, sample rate verification (48 kHz), and parameter normalization (0.7.0 format).
- **5 User Profile Slots**: Organize, label, and switch between your favorite custom neural amp models on the fly.

### Custom Cabinet Impulse Response (IR) Loader
- **5 User IR Slots**: Seamlessly upload standard 24-bit / 48 kHz `.wav` cabinet impulse responses into slots 1 through 5.
- **Smart Hardware Protection**: Automatically bypasses and locks Cabinet IR processing when a full-rig NAM model with an integrated cabinet is loaded.

### 100-Slot Preset Library and Bank Manager
- **50 User Presets (P01 to P50)**: Full live switching and hardware EEPROM renaming directly from your keyboard.
- **50 Factory Presets (F01 to F50)**: Instant access to all original factory tone presets.
- **Backup and Share**: Export and import complete preset banks in JSON format to safeguard your library and share tones with others.
- **Hardware Sync**: Fetch and verify preset names and module states straight from the pedal's onboard memory.

### Global Hardware Audio Configuration
- Adjust hardware Master Volume, Input Gain, USB Audio Recording Level, Bluetooth Playback Volume, and Headphone/Monitor Out levels directly from a unified settings panel.

### High-Precision Chromatic Tuner
- Analog VU meter needle response with cent offset indicator (-50 to +50 cents) and frequency readout in Hz.
- Reference pitch calibration range (`A4 = 435 Hz` to `445 Hz`).
- Audio Mute toggle for silent live stage tuning or Audio Thru mode.

### Hands-On Keyboard Shortcuts
- Quick footswitch and preset slot selection via number keys (`1`, `2`, `3`, `4`).
- Arrow key navigation for fast preset switching during practice or live performances.

---

## Hardware Compatibility

| Device | Model Code | Connection Types | Status |
| :--- | :---: | :---: | :---: |
| **Sonicake Pocket Master** | `QME-20` | USB-C (USB MIDI) and Bluetooth LE (BLE) | **Fully Supported** |

---

## User Guide: How to Use PocketLab

Follow this step-by-step guide to get the most out of PocketLab with your Sonicake Pocket Master.

### 1. Connecting Your Hardware

PocketLab supports both wired USB-C and wireless Bluetooth Low Energy (BLE) connections:

1. **Connect via USB (Recommended for Low Latency)**:
   - Connect your Pocket Master to your computer using a high-quality USB-C data cable.
   - Power on the pedal.
   - In PocketLab, click the **Connect** button in the top header.
   - Under the **USB Connection** tab, click **Refresh Devices**.
   - Select your detected `Sonicake Pocket Master` MIDI device and click **Connect**.

2. **Connect via Bluetooth Low Energy (BLE)**:
   - Ensure Bluetooth is enabled on your Pocket Master pedal.
   - Click the **Connect** button in the top header and switch to the **Bluetooth** tab.
   - Click **Scan Bluetooth Devices**.
   - In the browser / system Bluetooth pairing dialog, choose `Pocket Master` and confirm pairing.

3. **Offline Simulation Mode**:
   - If your pedal is not currently plugged in, you can click **Enter Simulation Mode** to preview the interface, explore effect algorithms, or edit preset JSON files offline.

---

### 2. Navigating Presets and Footswitches

- **Footswitch Bar (Bottom Panel)**:
  - The bottom bar shows the active bank's 4 footswitch slots (for example, P01 to P04).
  - Click on any footswitch button or press keyboard keys `1`, `2`, `3`, or `4` to switch slots immediately.
  - Use the `<` and `>` bank arrows to scroll through preset banks.
- **Header Preset Stepper**:
  - Click the left or right arrow buttons next to the preset name in the top bar to step through presets sequentially.
- **Preset Library Drawer**:
  - Click the **Presets** button in the header or press `P` to open the full 100-preset drawer.
  - Filter by **All (100)**, **User Presets (P01-P50)**, or **Factory Presets (F01-F50)**.
  - Use the search bar to locate presets by name or slot number (e.g., `Lead`, `Clean`, `P05`).
  - Click any preset card to immediately activate it on the physical pedal.

---

### 3. Editing Effects and the Signal Chain

- **Selecting a Module**:
  - Click on any block in the upper signal chain (`NR`, `PRE`, `DRV`, `AMP`, `IR`, `EQ`, `MOD`, `DLY`, `RVB`).
  - The editor panel below will display the active module's model selector and parameters.
- **Changing Effect Models**:
  - Click the **Model Selector** dropdown to view all available algorithms for that category (e.g., Tube Drive, Overdrive, Blues Drive).
  - Click on a model name to activate it. The change is instantly communicated to the hardware.
- **Adjusting Parameters**:
  - Click and drag rotary knobs up or down to adjust values.
  - Numerical readouts update continuously, sending real-time parameter changes via SysEx.
- **Bypassing / Engaging Modules**:
  - Click the power button icon on any module card in the signal chain, or click the **Bypass** button in the editor panel to toggle that effect on or off.
- **Reordering Modules**:
  - You can move pre-effects or post-effects across the chain.
  - *Note*: PocketLab enforces the hardware fixed-core constraint (`DRV -> AMP -> IR -> EQ`). These four core processing stages remain locked in order to match the pedal's internal DSP architecture.

---

### 4. Loading Custom Neural Amp Modeler (NAM) Profiles

PocketLab includes a dedicated loader for Neural Amp Modeler models:

1. Select the **AMP** module in the signal chain.
2. In the editor header, switch the mode toggle from **Factory Amps** to **Clone NAM (A2)**.
3. Select which user profile slot (Profile 1 to Profile 5) you wish to assign.
4. **Drag and drop** a `.nam`, `.namb`, or `.json` file directly into the editor canvas, or click **Import Profile** to browse files on your computer.
5. PocketLab automatically verifies:
   - Sample rate compatibility (48 kHz).
   - Neural network architecture (Architecture 2 / WaveNet / Linear).
   - Parameter scaling and normalization (0.7.0 format).
6. The profile name will update automatically and transfer to your pedal.

---

### 5. Loading Custom Cabinet Impulse Responses (IR)

1. Select the **CAB / IR** module in the signal chain.
2. Choose one of the 5 User IR slots (`User IR 1` to `User IR 5`).
3. Click the **Import IR** button and select a 24-bit / 48 kHz `.wav` impulse response file from your computer.
4. The custom name and file will be applied to the pedal's internal memory.
5. *Note*: If a full-rig NAM model (which already contains a baked-in cabinet) is active, PocketLab will automatically lock the IR module to prevent muddy double-cab filtering.

---

### 6. Saving, Renaming, and Backing Up Tones

- **Saving to Pedal Memory**:
  - After tweaking your tone, click the **Save** button in the top header.
  - PocketLab writes all parameter states, bypass toggles, and model selections directly to the pedal's physical EEPROM.
- **Renaming User Presets**:
  - Open the **Preset Library** (`P`).
  - On any User preset card (`P01`-`P50`), click the pencil **Edit** icon.
  - Type your new preset name (up to 10 characters) and press **Enter**.
  - The new name is saved directly to pedal hardware.
- **Exporting Presets**:
  - In the Preset Library, click **Export JSON** to save all 100 preset slots into a backup file on your computer.
- **Importing Presets**:
  - Click **Import** in the Preset Library to restore a previously saved preset pack.
- **Sync From Pedal**:
  - Click **Sync From Pedal** to pull the latest preset names and parameters directly from your connected hardware.

---

### 7. Using the Chromatic Tuner

- Click the **Tuner** button in the header or press `T` on your keyboard.
- Pluck a string on your instrument:
  - The large note display indicates the detected musical pitch (e.g., `E`, `A`, `D`, `G`, `B`, `e`).
  - The analog needle meter shows whether you are flat (left) or sharp (right).
  - The display turns solid green when the string is perfectly in tune (within 3 cents).
- **Reference Pitch**:
  - The default reference pitch is `A4 = 440 Hz`. You can adjust it between `435 Hz` and `445 Hz` via the dropdown.
- **Audio Output Toggle**:
  - Toggle between **Mute Audio Output** (silent tuning on stage) and **Audio Thru** (audible tuning).

---

### 8. Calibrating Global Hardware Levels

Click the gear icon in the top header to open **Hardware Settings**:
- **Master Volume**: Overall output fader.
- **Input Gain**: Calibrate input sensitivity for low-output single coils or high-output active humbuckers.
- **USB Audio Record**: Set digital recording output level when using Pocket Master as an audio interface.
- **Bluetooth Playback**: Adjust backing track volume coming from your phone or tablet.
- **Monitor Out**: Control headphone output volume independently.

---

## Technology Stack

- **Frontend Core**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/)
- **Desktop Runtime**: [Electron](https://www.electronjs.org/)
- **Hardware Interop**: Web MIDI API, Web Bluetooth API (BLE MIDI), Web Audio API
- **Icons and Styling**: [Lucide React](https://lucide.dev/), Custom Pure CSS Studio Design System

---

## Getting Started (Developers)

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` or `yarn` / `pnpm`
- A Sonicake Pocket Master pedal connected via USB-C or Bluetooth

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Wrdn28/pocketlab.git
   cd pocketlab
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser (Google Chrome, Microsoft Edge, or Brave recommended for Web MIDI and Web Bluetooth support) and navigate to `http://localhost:3000`.

---

## Desktop Application (Electron)

You can run PocketLab as a native desktop application with full hardware access without needing a browser:

```bash
# Run Electron in development mode
npm run electron

# Build standalone distribution binaries:
npm run dist:linux    # Builds Linux AppImage in /release
npm run dist:win      # Builds Windows NSIS installer in /release
```

---

## Platform Guides: Windows and Linux

### Windows Guide

1. **Plug-and-Play USB MIDI**:
   - The Sonicake Pocket Master uses standard class-compliant USB Audio/MIDI (`usbaudio.sys`).
   - Windows 10 and Windows 11 will automatically configure the device upon plugging in the USB-C cable. No vendor driver installation is required.

2. **Important: Exclusive MIDI Access (DAW Conflicts)**:
   - Classic Windows MIDI (MME) does not permit multiple applications to share the same MIDI device port simultaneously.
   - If a DAW (such as Reaper, Ableton Live, FL Studio, or Cubase) or mobile emulator is already running and using the Pocket Master MIDI port, PocketLab will not be able to connect.
   - **Solution**: Close any active DAW or disable the Pocket Master MIDI input/output inside your DAW settings before opening PocketLab.

3. **Bluetooth LE on Windows**:
   - Ensure Bluetooth is switched on in Windows Settings (`Settings > Bluetooth & devices`).
   - Pair via the browser or Electron Bluetooth dialog.

4. **Windows SmartScreen Note**:
   - Since PocketLab is a community open-source project without a paid corporate certificate, Windows SmartScreen may show an initial warning (*"Windows protected your PC"*). Click **More info** and then **Run anyway**.

For detailed Windows troubleshooting, see the [Windows Guide](WINDOWS_GUIDE.md).

---

### Linux Guide

1. **User Permissions and Audio Group**:
   - To access USB MIDI devices without root (`sudo`) privileges, ensure your user account belongs to the `audio` group:
     ```bash
     sudo usermod -aG audio $USER
     ```
   - Log out and log back in for changes to take effect.

2. **udev Rules for Seamless USB MIDI**:
   - If your distribution restricts USB device access, add a udev rule in `/etc/udev/rules.d/99-sonicake-midi.rules`:
     ```text
     SUBSYSTEM=="sound", ATTRS{idVendor}=="*", MODE="0666", GROUP="audio"
     SUBSYSTEM=="usb", ATTRS{idVendor}=="*", MODE="0666", GROUP="audio"
     ```
   - Reload udev rules:
     ```bash
     sudo udevadm control --reload-rules && sudo udevadm trigger
     ```

3. **Bluetooth LE (BlueZ)**:
   - Ensure the Bluetooth service is active:
     ```bash
     sudo systemctl enable --now bluetooth
     ```
   - For Chromium-based browsers, enable `chrome://flags/#enable-web-bluetooth` if required.

4. **Running AppImage on Modern Linux**:
   - On Ubuntu 24.04 and Debian, install FUSE 2 compatibility if the AppImage does not launch:
     ```bash
     sudo apt install libfuse2
     ```
   - Make the binary executable: `chmod +x PocketLab-*.AppImage`.

For detailed Linux troubleshooting, see the [Linux Guide](LINUX_GUIDE.md).

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1` | Select Footswitch Slot 1 |
| `2` | Select Footswitch Slot 2 |
| `3` | Select Footswitch Slot 3 |
| `4` | Select Footswitch Slot 4 |
| `ArrowUp` / `ArrowRight` | Jump to Next Preset |
| `ArrowDown` / `ArrowLeft` | Jump to Previous Preset |
| `T` | Open / Close Chromatic Tuner |
| `P` | Open / Close Preset Library Drawer |
| `Escape` | Close any active modal dialog |

---

## Contributing

Contributions, bug reports, and feature requests are welcome!
Feel free to open an issue or submit a pull request on GitHub:
[https://github.com/Wrdn28/pocketlab](https://github.com/Wrdn28/pocketlab)

---

## Author

- **hirokixd** - GitHub: [@Wrdn28](https://github.com/Wrdn28)

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
