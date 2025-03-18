document.addEventListener('DOMContentLoaded', function() {
  const videoUrlInput = document.getElementById('video-url');
  const fetchBtn = document.getElementById('fetch-btn');
  const videoInfoSection = document.getElementById('video-info');
  const videoTitleElement = document.getElementById('video-title');
  const thumbnailElement = document.getElementById('thumbnail');
  const filenameInput = document.getElementById('filename');
  const downloadBtn = document.getElementById('download-btn');
  const statusMessage = document.getElementById('status-message');
  const formatOptions = document.getElementsByName('format');
  const qualitySelector = document.getElementById('quality-selector');
  
  let currentVideoId = null;
  let currentVideoTitle = '';
  let currentVideoUrl = '';
  
  // Show status message
  function showStatus(message, type = 'info') {
      statusMessage.textContent = message;
      statusMessage.className = type;
      statusMessage.classList.remove('hidden');
      
      // Hide after 5 seconds
      setTimeout(() => {
          statusMessage.classList.add('hidden');
      }, 5000);
  }
  
  // Update format-dependent options
  function updateFormatOptions() {
      const selectedFormat = document.querySelector('input[name="format"]:checked').value;
      
      // Show/hide quality selector based on format
      if (selectedFormat === 'mp3') {
          qualitySelector.style.display = 'none';
      } else {
          qualitySelector.style.display = 'block';
      }
  }
  
  // Listen for format changes
  formatOptions.forEach(radio => {
      radio.addEventListener('change', updateFormatOptions);
  });
  
  // Initialize format options
  updateFormatOptions();
  
  // Extract video ID from URL
  function getVideoIdFromUrl(url) {
      try {
          // Regular YouTube URL
          if (url.includes('youtube.com/watch')) {
              const urlParams = new URLSearchParams(new URL(url).search);
              return urlParams.get('v');
          }
          // Short YouTube URL
          else if (url.includes('youtu.be/')) {
              const parts = url.split('youtu.be/');
              if (parts.length > 1) {
                  return parts[1].split('?')[0].split('&')[0];
              }
          }
          return null;
      } catch (error) {
          console.error('Invalid URL:', error);
          return null;
      }
  }
  
  // Function to get video information from ID
  function getVideoInfo(videoId) {
      if (!videoId) {
          showStatus('Invalid YouTube URL', 'error');
          return;
      }
      
      currentVideoId = videoId;
      currentVideoTitle = `YouTube Video (${videoId})`;
      
      // Set a default title until we can get the real one
      videoTitleElement.textContent = currentVideoTitle;
      filenameInput.value = currentVideoTitle;
      
      // Set thumbnail
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      thumbnailElement.style.backgroundImage = `url('${thumbnailUrl}')`;
      
      // Show video info section
      videoInfoSection.classList.remove('hidden');
      
      // Enable download button
      downloadBtn.disabled = false;
      
      // Try to fetch the actual title from YouTube's oEmbed API
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
          .then(response => response.json())
          .then(data => {
              if (data && data.title) {
                  currentVideoTitle = data.title.trim();
                  videoTitleElement.textContent = currentVideoTitle;
                  filenameInput.value = currentVideoTitle;
              }
          })
          .catch(error => {
              console.error('Error fetching video title:', error);
              // We already have a fallback title set, so we don't need to show an error
          });
  }
  
  // Handle fetch button click
  fetchBtn.addEventListener('click', function() {
      const videoUrl = videoUrlInput.value.trim();
      
      if (!videoUrl) {
          showStatus('Please enter a YouTube URL', 'error');
          return;
      }
      
      const videoId = getVideoIdFromUrl(videoUrl);
      
      if (videoId) {
          currentVideoUrl = videoUrl;
          showStatus('Video found!', 'success');
          getVideoInfo(videoId);
      } else {
          showStatus('Invalid YouTube URL', 'error');
          videoInfoSection.classList.add('hidden');
          downloadBtn.disabled = true;
      }
  });
  
  // Pre-fill URL and fetch video if the extension was opened from YouTube
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      if (currentTab && currentTab.url && 
          (currentTab.url.includes('youtube.com/watch') || currentTab.url.includes('youtu.be/'))) {
          videoUrlInput.value = currentTab.url;
          fetchBtn.click(); // Automatically fetch the video
      }
  });
  
  // Handle download button click
  downloadBtn.addEventListener('click', function() {
      if (!currentVideoId) {
          showStatus('No video detected', 'error');
          return;
      }
      
      const filename = filenameInput.value.trim() || currentVideoTitle;
      const format = document.querySelector('input[name="format"]:checked').value;
      const quality = document.getElementById('quality').value;
      
      if (!filename) {
          showStatus('Please enter a filename', 'error');
          return;
      }
      
      // Show loading status
      showStatus('Processing download...', 'info');
      downloadBtn.disabled = true;
      downloadBtn.textContent = 'Processing...';
      
      // Send message to background script to handle the download
      chrome.runtime.sendMessage({
          action: 'downloadVideo',
          videoId: currentVideoId,
          format: format,
          filename: filename
      }, function(response) {
          if (response && response.success) {
              showStatus(`Download started: ${filename}.${format}`, 'success');
          } else {
              showStatus(response?.error || 'Download failed', 'error');
          }
          
          // Reset button
          downloadBtn.disabled = false;
          downloadBtn.textContent = 'Download';
      });
  });
});