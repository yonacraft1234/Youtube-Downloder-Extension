# Youtube-Downloder-Extension

## About

This project is a Chrome extension designed to download YouTube videos in MP4 or MP3 format. It includes both the Chrome extension itself and a supporting API, which is likely written in Python. The extension allows users to easily download YouTube content directly from their browser, leveraging the API for processing video/audio downloads.

## Features

- Download YouTube videos as MP4 files.
- Extract and download audio from YouTube videos as MP3 files.
- Simple Chrome extension interface integrated with a Python-based API.

## Installation

### Prerequisites

- Google Chrome browser
- Python 3.13+ (for the API)
- `pip` (Python package manager)
- Git (optional, for cloning the repository)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yonacraft1234/Youtube-Downloder-Extension.git
   cd Youtube-Downloder-Extension
   ```

2. **Set Up the Chrome Extension**
   - Open Google Chrome.
   - Go to `chrome://extensions/`.
   - Enable "Developer mode" (toggle in the top right).
   - Click "Load unpacked" and select the folder containing the Chrome extension files (likely a subfolder like `extension/` in the repository).
   - The extension should now appear in your Chrome toolbar.

3. **Run the API**
  ```bash
   python API.py
   ```

## Usage

1. Navigate to a YouTube video page in Chrome.
2. Click the extension icon in the toolbar.
3. Choose to download the video as MP4 or audio as MP3.
4. The extension will communicate with the API (if set up) to process and download the file to your local machine.

## Notes

- Ensure the API is running locally or hosted appropriately for the extension to function.
- This project may require additional configuration (e.g., API keys, CORS settings) depending on the implementation details not provided here.

## Contributing

Feel free to fork this repository, make improvements, and submit pull requests. Issues and feature requests can be submitted via the GitHub Issues tab.

## License

© 2025 yonacraft1234. All rights reserved unless otherwise specified.

---
