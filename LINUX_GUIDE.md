# PocketLab Linux Guide

This guide covers running and configuring **PocketLab** on Linux distributions (Ubuntu, Debian, Fedora, Arch Linux, Manjaro, openSUSE, etc.) with the **Sonicake Pocket Master (QME-20)** multi-effects processor.

---

## 1. Running the Application

### Option A: Standalone Desktop Application (Electron / AppImage)

1. **Development Mode**:
   ```bash
   npm run electron
   ```

2. **Build Standalone AppImage**:
   ```bash
   npm run dist:linux
   ```
   The built AppImage binary will be located in the `release/` directory.

3. **Running the AppImage**:
   ```bash
   chmod +x release/PocketLab-*.AppImage
   ./release/PocketLab-*.AppImage
   ```

> **Ubuntu 24.04 and Debian Note (libfuse2):**
> Modern Linux distributions like Ubuntu 24.04 ship with FUSE 3 by default, whereas AppImages often require FUSE 2. If the AppImage fails to launch, install the FUSE 2 compatibility library:
> ```bash
> sudo apt install libfuse2
> ```

---

### Option B: Modern Web Browser (Chrome, Brave, Edge)

1. Start the local development server:
   ```bash
   npm run dev
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

> **Web Bluetooth on Linux:**
> In Chromium-based browsers on Linux, Web Bluetooth may require enabling an experimental flag:
> 1. In your address bar, open: `chrome://flags/#enable-web-bluetooth`
> 2. Set the flag to **Enabled**.
> 3. Click **Relaunch**.

---

## 2. Hardware Configuration on Linux

### A. USB MIDI Permissions & Audio Group
The Sonicake Pocket Master uses the standard ALSA class-compliant USB Audio/MIDI driver (`snd-usb-audio`).

1. **Verify device connection**:
   Plug in the pedal via USB-C and run:
   ```bash
   lsusb
   ```
   You can also check ALSA MIDI ports:
   ```bash
   amidi -l
   ```

2. **Add user to audio group**:
   To access raw audio and MIDI hardware without requiring root (`sudo`) privileges, add your user account to the `audio` group:
   ```bash
   sudo usermod -aG audio $USER
   ```
   *Note*: Log out and log back in for group membership changes to take effect.

3. **Configure udev rules (Optional but Recommended)**:
   If your system still restricts non-root access to raw USB MIDI interfaces, create a udev rule:
   ```bash
   sudo nano /etc/udev/rules.d/99-sonicake-midi.rules
   ```
   Add the following configuration lines:
   ```text
   SUBSYSTEM=="sound", ATTRS{idVendor}=="*", MODE="0666", GROUP="audio"
   SUBSYSTEM=="usb", ATTRS{idVendor}=="*", MODE="0666", GROUP="audio"
   ```
   Reload udev rules:
   ```bash
   sudo udevadm control --reload-rules && sudo udevadm trigger
   ```

---

### B. Bluetooth Low Energy (BlueZ)
1. Ensure the BlueZ daemon service is running:
   ```bash
   sudo systemctl status bluetooth
   ```
   If it is inactive, enable and start it:
   ```bash
   sudo systemctl enable --now bluetooth
   ```

2. Verify that your Bluetooth adapter is unblocked and operational:
   ```bash
   bluetoothctl show
   ```

---

## 3. Audio Server Compatibility
PocketLab is fully compatible with modern Linux audio servers:
- **PipeWire**: Works out of the box with `pipewire-pulse` and `pipewire-alsa`.
- **PulseAudio**: Fully supported via standard Web Audio API output.
- **JACK**: Use `jack-midi` or ALSA MIDI bridges if routing through a professional audio patchbay.
