# WaveMonitor Final Design (English UI)

## 📐 Layout (3 Rows)

```
┌─────────────────────────────────────────────────────────────┐
│ WaveMonitor                                                  │
├─────────────────────────────────────────────────────────────┤
│ Row 1:                                                       │
│ [DeviceID] StartTime:[2025103123:27:28] ~:[2]mins ☑Event   │
│ [PlayBack]                                                  │
│                                                              │
│ Row 2:                                                       │
│ [File] [No file selected] Display:[Auto▼] [PlayFile][PlayDe│
│         ↑ Gray italic      or    ↑ Green bold              │
│         [sample.txt]                                        │
│                                                              │
│ Row 3:                                                       │
│ [Pause]|[Stop]: [1x][1.5x][2x]  23:27:28/2min/5min         │
│                  ↑ Speed         ↑ Progress                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Row 1: Query Parameters

**Purpose:** Query historical data from server by DeviceID

**Controls:**
- **DeviceID** - Input field (UUID v4, auto-suggest available)
- **StartTime** - Time input (`2025103123:27:28`)
- **~:** - Separator
- **TimeLong** - Duration input (1-30 mins)
- **☑ Event** - Event mode checkbox (auto 3min)
- **[PlayBack]** - Execute query button

**Enabled when:**
- DeviceID ≠ empty
- StartTime ≠ empty

---

## 🎯 Row 2: File/Demo + Display Radar

**Purpose:** Select data source (file/demo) and display radar

**Controls:**
- **[File]** - File selection button
- **File Display Box** - Shows selected file name
  - Gray: "No file selected" (italic)
  - Green: "sample.txt" (bold, green background)
- **Display:** - Label
- **Display Select** - Radar selection for coordinate conversion
  - Options: Auto, Radar01, Radar02...
- **[PlayFile]** - Play from selected file
- **[PlayDemo]** - Play demo data

**PlayFile enabled when:**
- File selected
- Not playing

**PlayDemo enabled when:**
- Not playing

---

## 🎯 Row 3: Playback Control + Speed + Progress

**Purpose:** Control playback and show progress

**Controls:**
- **[Pause]** / **[Resume]** - Pause/Resume button
- **|** - Separator
- **[Stop]** - Stop button (red)
- **:** - Separator
- **[1x] [1.5x] [2x]** - Speed buttons (inline)
- **Progress** - Time display
  - Format: `23:27:28/2min/5min`
  - Current time (HH:MM:SS) / Elapsed mins / Total mins

**Button states:**
- Pause/Stop: Enabled only when playing
- Speed: Disabled when playing

---

## 📊 Progress Display Format

### Time Components

```
23:27:28 / 2min / 5min
   ↑        ↑      ↑
Current  Elapsed Total
(Blue)   (Green) (Gray)
```

**Examples:**
```
Start:     00:00:00/0min/2min
30s later: 00:00:30/0min/2min  (< 1min, shows 0min)
1min later:00:01:00/1min/2min
2min later:00:02:00/2min/2min
Finish:    00:02:00/2min/2min
```

---

## 🎮 Three Playback Modes

### Mode 1: PlayBack (Server Query)

```
Row 1 input:
  DeviceID: 550e8400-...
  StartTime: 2025103123:27:28
  TimeLong: 2 mins
  
Click [PlayBack]
  ↓
Query server → Get historical data → Start playback
```

### Mode 2: PlayFile (Local File)

```
Row 2 actions:
  1. Click [File]
  2. Select sample.txt
  3. File box shows: sample.txt (green)
  4. Click [PlayFile]
  
  ↓
Parse file → Start playback
```

### Mode 3: PlayDemo (Demo Data)

```
Row 2 action:
  Click [PlayDemo]
  
  ↓
Auto fill parameters → Start playback
```

---

## 🎨 Visual Feedback

### File Selection

**Before:**
```
[File] [No file selected] Display:...
        ↑ Gray box, italic
```

**After:**
```
[File] [sample.txt] Display:...
        ↑ Green box, bold
```

### Playback Control

**Not playing:**
```
[Pause]|[Stop]: [1x][1.5x][2x]
  ↑ Disabled (gray)
               ↑ Enabled (can select)
```

**Playing:**
```
[Pause]|[Stop]: [1x][1.5x][2x]  23:27:28/2min/5min
  ↑ Enabled          ↑ Disabled  ↑ Progress shown
       ↑ Red
```

**Paused:**
```
[Resume]|[Stop]: [1x][1.5x][2x]  23:27:28/2min/5min
   ↑ Changed text
```

---

## ✅ Button Enable Logic

| Button | Enabled When | Disabled When |
|--------|--------------|---------------|
| **PlayBack** | DeviceID + StartTime | - |
| **File** | - | Playing |
| **PlayFile** | File selected | Playing |
| **PlayDemo** | - | Playing |
| **Pause/Resume** | Playing | Not playing |
| **Stop** | Playing | Not playing |
| **Speed (1x/1.5x/2x)** | Not playing | Playing |

---

## 🔄 Complete Workflow

### PlayBack Workflow

```
1. Enter DeviceID
2. Enter StartTime
3. Set TimeLong or check Event
4. Click [PlayBack]
   ↓
5. Query server
   ↓
6. Row 3 shows progress:
   [Pause]|[Stop]: [1x][1.5x][2x]  00:00:00/0min/2min
   ↓
7. Real-time update:
   [Pause]|[Stop]: [1x][1.5x][2x]  00:00:30/0min/2min
   [Pause]|[Stop]: [1x][1.5x][2x]  00:01:00/1min/2min
   ↓
8. Finish or click Stop
```

### PlayFile Workflow

```
1. Click [File]
2. Select sample.txt
   ↓ File box turns green
3. Click [PlayFile]
   ↓
4. Parse file
   ↓
5. Row 3 shows progress
```

### PlayDemo Workflow

```
1. Click [PlayDemo]
   ↓
2. Auto-fill all parameters
   ↓
3. Start playback immediately
```

---

## 🎯 Key Features

### Two-Layer Design
1. **Layer 1 (Data Source)**: DeviceID (UUID) - tells backend which device
2. **Layer 2 (Display)**: Display Radar - tells frontend which coordinate system

### Three Data Sources
1. **PlayBack** - Server query (Row 1 params)
2. **PlayFile** - Local file (Row 2 selection)
3. **PlayDemo** - Demo data (quick start)

### HIPAA Compliance
- ✅ Frontend uses UUID only
- ✅ DeviceCode managed by backend
- ✅ No physical device info exposed

### Real-time Feedback
- ✅ File selection: Gray → Green
- ✅ Progress display: HH:MM:SS/Xmin/Ymin
- ✅ Button states: Auto enable/disable

---

**All UI in English! Clean 3-row layout! HIPAA compliant!** 🎉

