use std::process::Command;

#[tauri::command]
pub async fn open_file_dialog() -> Result<Vec<String>, String> {
    let selected = rfd::FileDialog::new().set_title("Select files").pick_files();
    Ok(selected
        .unwrap_or_default()
        .into_iter()
        .map(|path| path.to_string_lossy().to_string())
        .collect())
}

#[tauri::command]
pub async fn reveal_in_explorer(path: String) -> Result<(), String> {
    Command::new("explorer")
        .arg("/select,")
        .arg(path)
        .spawn()
        .map_err(|err| err.to_string())?;
    Ok(())
}
