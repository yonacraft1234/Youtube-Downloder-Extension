from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import re

app = Flask(__name__)
CORS(app)
app.config['DOWNLOAD_FOLDER'] = 'downloads'
os.makedirs(app.config['DOWNLOAD_FOLDER'], exist_ok=True)

def delete_file(file_path):
    try:
        os.remove(file_path)
    except Exception as e:
        print(f"Failed to delete file: {str(e)}")

def sanitize_filename(title):
    """Clean filename for safe filesystem use"""
    new_title = title.replace(" ", "-")
    return re.sub(r'[\\/*?:"<>|]', "", new_title).strip()


@app.route('/download', methods=['POST'])
def download_video():
    data = request.get_json()
    if not data or 'url' not in data or 'format' not in data:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        video_url = data['url']
        format_type = data['format']
        title = sanitize_filename(data['filename'])

        if format_type == "mp4":
            filename = f"{title}.mp4"
            file_path = os.path.join(app.config['DOWNLOAD_FOLDER'], filename)

            ydl_opts = {
                'format': 'best[ext=mp4]',
                'outtmpl': file_path,
                'quiet': True,
                'no_warnings': True,

            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])

        elif format_type == "mp3":
            filename = f"{title}.mp3"
            file_path = os.path.join(app.config['DOWNLOAD_FOLDER'], filename)

            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.splitext(file_path)[0],
                'ffmpeg_location': 'C:/ffmpeg/ffmpeg.exe',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
                'no_warnings': True
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
        else:
            return jsonify({"error": "Invalid format"}), 400

        # Generate absolute URL for download
        download_url = f"http://localhost:8000/download/{filename}"
        print(f"Download URL: {download_url}")
        return jsonify({
            "downloadUrl": download_url,
            "filename": filename
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/download/<filename>')
def serve_file(filename):
    try:
        file_path = os.path.join(app.config['DOWNLOAD_FOLDER'], filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "File expired or not found"}), 404

        return send_file(
            file_path,
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file_route(filename):
    try:
        file_path = os.path.join(app.config['DOWNLOAD_FOLDER'], filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "File expired or not found"}), 404

        delete_file(file_path)
        return jsonify({"message": "File deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)