// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod camera;

use camera::{take_photo, record_video, get_media_files, read_file_content};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            take_photo, 
            record_video, 
            get_media_files,
            read_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
