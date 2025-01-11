use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub pin: Option<String>,
    pub avatar: String,
    pub photos: Vec<String>,
    pub videos: Vec<String>,
    pub created_at: String,
    pub updated_at: Option<String>,
}

#[tauri::command]
pub async fn save_profile(profile: Profile) -> Result<(), String> {
    let profiles_dir = get_profiles_dir()?;
    let profile_path = profiles_dir.join(format!("{}.json", profile.id));
    
    fs::write(profile_path, serde_json::to_string_pretty(&profile)
        .map_err(|e| format!("Błąd serializacji profilu: {}", e))?)
        .map_err(|e| format!("Błąd zapisu profilu: {}", e))
}

#[tauri::command]
pub async fn get_profiles() -> Result<Vec<Profile>, String> {
    let profiles_dir = get_profiles_dir()?;
    let mut profiles = Vec::new();

    if profiles_dir.exists() {
        for entry in fs::read_dir(&profiles_dir)
            .map_err(|e| format!("Błąd odczytu katalogu profilów: {}", e))? {
            let entry = entry.map_err(|e| format!("Błąd odczytu wpisu: {}", e))?;
            if entry.path().extension().map_or(false, |ext| ext == "json") {
                let content = fs::read_to_string(entry.path())
                    .map_err(|e| format!("Błąd odczytu pliku profilu: {}", e))?;
                let profile: Profile = serde_json::from_str(&content)
                    .map_err(|e| format!("Błąd deserializacji profilu: {}", e))?;
                profiles.push(profile);
            }
        }
    }

    Ok(profiles)
}

fn get_profiles_dir() -> Result<PathBuf, String> {
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Błąd podczas pobierania ścieżki wykonywalnej: {}", e))?
        .parent()
        .ok_or("Nie można znaleźć katalogu wykonawczego")?
        .to_path_buf();
    
    let profiles_dir = exe_dir.join("profiles");
    fs::create_dir_all(&profiles_dir)
        .map_err(|e| format!("Błąd tworzenia katalogu profilów: {}", e))?;
    
    Ok(profiles_dir)
} 