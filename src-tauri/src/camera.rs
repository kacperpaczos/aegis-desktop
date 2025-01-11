use serde::{Deserialize, Serialize};
use std::{process::Command, path::PathBuf, env};
use tauri::AppHandle;
use image::io::Reader as ImageReader;
use image::ImageFormat;
use std::io::Cursor;

#[derive(Debug, Serialize, Deserialize)]
pub struct CameraResponse {
    status: String,
    path: Option<String>,
    message: Option<String>,
}

fn get_script_path() -> Result<PathBuf, String> {
    let exe_dir = env::current_exe()
        .map_err(|e| format!("Błąd podczas pobierania ścieżki wykonywalnej: {}", e))?
        .parent()
        .ok_or("Nie można znaleźć katalogu wykonawczego")?
        .to_path_buf();
        
    let script_path = exe_dir.join("scripts").join("camera_handler.py");
    
    if !script_path.exists() {
        return Err(format!("Nie znaleziono pliku skryptu: {:?}", script_path));
    }
    
    Ok(script_path)
}

fn execute_python_script(script_path: &PathBuf, args: &[&str]) -> Result<String, String> {
    let script_dir = script_path.parent()
        .ok_or("Nie można uzyskać katalogu nadrzędnego")?;

    let output = Command::new("python3")
        .arg(script_path)
        .args(args)
        .current_dir(script_dir)
        .output()
        .map_err(|e| format!("Błąd wykonania komendy: {}", e))?;

    if !output.status.success() {
        return Err(format!("Błąd wykonania skryptu: {}", 
            String::from_utf8_lossy(&output.stderr)));
    }

    String::from_utf8(output.stdout)
        .map_err(|e| format!("Błąd dekodowania odpowiedzi: {}", e))
        .map(|s| s.trim().to_string())
}

fn parse_response(response: String) -> Result<CameraResponse, String> {
    if response.is_empty() {
        return Err("Otrzymano pustą odpowiedź od skryptu Python".to_string());
    }

    serde_json::from_str(&response)
        .map_err(|e| format!("Błąd parsowania JSON: {}. Otrzymana odpowiedź: {}", e, response))
}

#[tauri::command]
pub async fn take_photo(_app_handle: AppHandle) -> Result<CameraResponse, String> {
    let script_path = get_script_path()?;
    let response = execute_python_script(&script_path, &["photo"])?;
    parse_response(response)
}

#[tauri::command]
pub async fn record_video(_app_handle: AppHandle, duration: u32) -> Result<CameraResponse, String> {
    let script_path = get_script_path()?;
    let response = execute_python_script(&script_path, &["video", &duration.to_string()])?;
    parse_response(response)
}

#[tauri::command]
pub async fn get_media_files(_app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let exe_dir = env::current_exe()
        .map_err(|e| format!("Błąd podczas pobierania ścieżki wykonywalnej: {}", e))?
        .parent()
        .ok_or("Nie można znaleźć katalogu wykonawczego")?
        .to_path_buf();

    let images_dir = exe_dir.join("images");
    let videos_dir = exe_dir.join("videos");

    let mut images = Vec::new();
    let mut videos = Vec::new();

    if images_dir.exists() {
        for entry in std::fs::read_dir(&images_dir)
            .map_err(|e| format!("Błąd odczytu katalogu zdjęć: {}", e))? {
            let entry = entry.map_err(|e| format!("Błąd odczytu wpisu: {}", e))?;
            images.push(entry.path().to_string_lossy().to_string());
        }
    }

    if videos_dir.exists() {
        for entry in std::fs::read_dir(&videos_dir)
            .map_err(|e| format!("Błąd odczytu katalogu wideo: {}", e))? {
            let entry = entry.map_err(|e| format!("Błąd odczytu wpisu: {}", e))?;
            videos.push(entry.path().to_string_lossy().to_string());
        }
    }

    Ok(serde_json::json!({
        "images": images,
        "videos": videos,
        "imagesPath": images_dir.to_string_lossy().to_string(),
        "videosPath": videos_dir.to_string_lossy().to_string()
    }))
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<Vec<u8>, String> {
    let content = std::fs::read(&path)
        .map_err(|e| format!("Nie można odczytać pliku {}: {}", path, e))?;

    if path.ends_with(".jpg") || path.ends_with(".jpeg") || path.ends_with(".png") {
        // Generuj miniaturkę dla zdjęć
        let img = ImageReader::new(Cursor::new(&content))
            .with_guessed_format()
            .map_err(|e| format!("Błąd odczytu formatu obrazu: {}", e))?
            .decode()
            .map_err(|e| format!("Błąd dekodowania obrazu: {}", e))?;

        let thumbnail = img.thumbnail(200, 200);
        
        let mut buffer = Vec::new();
        let mut cursor = Cursor::new(&mut buffer);
        thumbnail
            .write_to(&mut cursor, ImageFormat::Jpeg)
            .map_err(|e| format!("Błąd zapisywania miniatury: {}", e))?;
        
        Ok(buffer)
    } else {
        // Dla innych plików zwróć oryginalną zawartość
        Ok(content)
    }
} 