// Background script to handle download operations
// Runs persistently in the background of the extension

// Store information about active downloads
const activeDownloads = {};

// Function to sanitize filenames
function sanitizeFilename(filename) {
  return filename.replace(/[/\\?%*:|"<>]/g, "-");
}

// Function to handle YouTube video downloads
async function downloadYouTubeVideo(videoId, format, filename) {
  try {
    // Update UI to show progress
    chrome.runtime.sendMessage({
      action: "updateStatus",
      status: "Downloading...",
    });

    const response = await fetch("http://localhost:8000/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        format: format,
        filename: sanitizeFilename(filename),
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.downloadUrl) {
      throw new Error(data.error || "Download failed");
    }

    // Start the browser download
    const downloadId = await new Promise((resolve, reject) => {
      chrome.downloads.download(
        {
          url: data.downloadUrl,
          filename: data.filename,
          conflictAction: "uniquify",
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(downloadId);
          }
        }
      );
    });

    // Store download info
    activeDownloads[downloadId] = {
      filename: data.filename,
      format: format,
      videoId: videoId,
    };

    return { success: true, downloadId };
  } catch (error) {
    console.error("Download failed:", error);
    chrome.runtime.sendMessage({
      action: "updateStatus",
      status: "Failed: " + error.message,
    });
    throw error;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "downloadVideo") {
    downloadYouTubeVideo(request.videoId, request.format, request.filename)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({
          success: false,
          error: error.message,
        })
      );

    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Monitor download progress and completion
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.id && activeDownloads[delta.id]) {
    // Handle state changes
    if (delta.state) {
      const downloadInfo = activeDownloads[delta.id];

      if (delta.state.current === "complete") {
        console.log(`Download completed: ${downloadInfo.filename}`);

        // Notify popup about completion
        chrome.runtime.sendMessage({
          action: "downloadComplete",
          filename: downloadInfo.filename,
          format: downloadInfo.format,
        });

        //send a DELETE request to the server
        fetch(`http://localhost:8000/delete/${downloadInfo.filename}`, {
          method: "DELETE",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `Delete request failed with status: ${response.status}`
              );
            }
            return response.json();
          })
          .then((data) => console.log("Delete request successful:", data))
          .catch((error) => console.error("Delete request error:", error));

        // Clean up finished download after 1 minute
        setTimeout(() => {
          delete activeDownloads[delta.id];
        }, 60000);
      } else if (delta.state.current === "interrupted") {
        console.log(`Download failed: ${downloadInfo.filename}`);

        // Notify popup about failure
        chrome.runtime.sendMessage({
          action: "downloadFailed",
          filename: downloadInfo.filename,
          error: "Download was interrupted",
        });
      }
    }

    // Handle progress updates
    if (delta.bytesReceived) {
      const progress = Math.round(
        (delta.bytesReceived.current / delta.totalBytes.current) * 100
      );

      // Optionally send progress updates to popup
      chrome.runtime.sendMessage({
        action: "downloadProgress",
        downloadId: delta.id,
        progress: progress,
      });
    }
  }
});
