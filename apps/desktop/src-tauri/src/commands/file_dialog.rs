use std::process::Command;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileDialogEntry {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub async fn open_file_dialog() -> Result<Vec<FileDialogEntry>, String> {
    let selected = rfd::FileDialog::new().set_title("Select files").pick_files();
    let files = map_paths_to_entries(
        selected
            .unwrap_or_default()
            .into_iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect(),
    );
    Ok(files)
}

#[tauri::command]
pub async fn open_folder_dialog() -> Result<Option<String>, String> {
    Ok(rfd::FileDialog::new()
        .set_title("Select folder")
        .pick_folder()
        .map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn inspect_file_paths(paths: Vec<String>) -> Result<Vec<FileDialogEntry>, String> {
    Ok(map_paths_to_entries(paths))
}

fn map_paths_to_entries(paths: Vec<String>) -> Vec<FileDialogEntry> {
    paths
        .into_iter()
        .map(|path| {
            let path_buf = std::path::PathBuf::from(path.clone());
            let metadata = std::fs::metadata(&path_buf).ok();
            let size_bytes = metadata.map(|value| value.len()).unwrap_or(0);
            let file_name = path_buf
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("file")
                .to_string();
            FileDialogEntry {
                path,
                file_name,
                size_bytes,
            }
        })
        .collect::<Vec<_>>()
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
