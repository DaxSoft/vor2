use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;

use crate::state::app_state::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionDto {
    pub user: SessionUserDto,
    pub expires_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionUserDto {
    pub id: String,
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct R2ConnectionCreateInput {
    pub name: String,
    pub bucket_name: String,
    pub account_id: Option<String>,
    pub endpoint: String,
    pub public_url: Option<String>,
    pub region: String,
    pub access_key_id: String,
    pub secret_access_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct R2ConnectionSafeDto {
    pub id: String,
    pub name: String,
    pub bucket_name: String,
    pub endpoint: String,
    pub public_url: Option<String>,
    pub region: String,
    pub status: String,
    pub last_connected_at: Option<String>,
    pub last_selected_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadQueueItem {
    pub file_name: String,
    pub size_bytes: u64,
    pub source_path: String,
    pub target_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderNodeDto {
    pub key: String,
    pub name: String,
    pub child_count: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileNodeDto {
    pub key: String,
    pub name: String,
    pub size_bytes: u64,
    pub mime_type: Option<String>,
    pub last_modified: Option<String>,
    pub etag: Option<String>,
    pub storage_class: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowseFolderResult {
    pub folders: Vec<FolderNodeDto>,
    pub files: Vec<FileNodeDto>,
}

fn workspace_root() -> Result<PathBuf, String> {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    here.join("..").join("..")
        .canonicalize()
        .map_err(|err| err.to_string())
}

fn run_bridge<T: for<'de> Deserialize<'de>>(action: &str, payload: Value) -> Result<T, String> {
    let root = workspace_root()?;
    let mut child = Command::new("yarn")
        .arg("--silent")
        .arg("workspace")
        .arg("@r2-explorer/database")
        .arg("desktop:bridge")
        .arg(action)
        .current_dir(root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|err| err.to_string())?;

    if let Some(stdin) = child.stdin.as_mut() {
        stdin
            .write_all(payload.to_string().as_bytes())
            .map_err(|err| err.to_string())?;
    }

    let output = child.wait_with_output().map_err(|err| err.to_string())?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        if !stderr.trim().is_empty() {
            return Err(stderr);
        }
    }

    let stdout = String::from_utf8(output.stdout).map_err(|err| err.to_string())?;
    let parsed = stdout
        .lines()
        .rev()
        .find_map(|line| {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                return None;
            }
            serde_json::from_str::<Value>(trimmed).ok()
        })
        .ok_or_else(|| String::from("Invalid backend response from Prisma bridge."))?;
    let ok = parsed
        .get("ok")
        .and_then(|value| value.as_bool())
        .unwrap_or(false);
    if !ok {
        let message = parsed
            .get("error")
            .and_then(|value| value.as_str())
            .unwrap_or("Unknown backend error");
        return Err(message.to_string());
    }
    serde_json::from_value(parsed.get("data").cloned().unwrap_or(Value::Null)).map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn sign_up_with_password(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<SessionDto, String> {
    let session: SessionDto = run_bridge(
        "sign_up_with_password",
        serde_json::json!({ "username": username, "password": password }),
    )?;
    if let Ok(mut user_id) = state.user_id.lock() {
        *user_id = Some(session.user.id.clone());
    }
    Ok(session)
}

#[tauri::command]
pub async fn sign_in_with_password(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<SessionDto, String> {
    let session: SessionDto = run_bridge(
        "sign_in_with_password",
        serde_json::json!({ "username": username, "password": password }),
    )?;
    if let Ok(mut user_id) = state.user_id.lock() {
        *user_id = Some(session.user.id.clone());
    }
    Ok(session)
}

#[tauri::command]
pub async fn get_session(state: State<'_, AppState>) -> Result<Option<SessionDto>, String> {
    let session: Option<SessionDto> = run_bridge("get_session", serde_json::json!({}))?;
    if let Ok(mut user_id) = state.user_id.lock() {
        *user_id = session.as_ref().map(|value| value.user.id.clone());
    }
    Ok(session)
}

#[tauri::command]
pub async fn clear_session(state: State<'_, AppState>) -> Result<(), String> {
    let _: Value = run_bridge("clear_session", serde_json::json!({}))?;
    if let Ok(mut user_id) = state.user_id.lock() {
        *user_id = None;
    }
    Ok(())
}

#[tauri::command]
pub async fn delete_account(state: State<'_, AppState>) -> Result<(), String> {
    let _: Value = run_bridge("delete_account", serde_json::json!({}))?;
    if let Ok(mut user_id) = state.user_id.lock() {
        *user_id = None;
    }
    Ok(())
}

#[tauri::command]
pub async fn list_connections() -> Result<Vec<R2ConnectionSafeDto>, String> {
    run_bridge("list_connections", serde_json::json!({}))
}

#[tauri::command]
pub async fn create_connection(input: R2ConnectionCreateInput) -> Result<R2ConnectionSafeDto, String> {
    run_bridge("create_connection", serde_json::json!({ "input": input }))
}

#[tauri::command]
pub async fn set_active_connection(connection_id: String) -> Result<(), String> {
    let _: Value = run_bridge(
        "set_active_connection",
        serde_json::json!({ "connectionId": connection_id }),
    )?;
    Ok(())
}

#[tauri::command]
pub async fn browse_folder(
    connection_id: String,
    bucket_name: String,
    path: String,
) -> Result<BrowseFolderResult, String> {
    run_bridge(
        "browse_folder",
        serde_json::json!({
            "connectionId": connection_id,
            "bucketName": bucket_name,
            "path": path
        }),
    )
}

#[tauri::command]
pub async fn create_folder(
    connection_id: String,
    bucket_name: String,
    path: String,
    folder_name: String,
) -> Result<(), String> {
    let _: Value = run_bridge(
        "create_folder",
        serde_json::json!({
            "connectionId": connection_id,
            "bucketName": bucket_name,
            "path": path,
            "folderName": folder_name
        }),
    )?;
    Ok(())
}

#[tauri::command]
pub async fn enqueue_uploads(
    connection_id: String,
    bucket_name: String,
    _target_path: String,
    files: Vec<UploadQueueItem>,
) -> Result<(), String> {
    let _: Value = run_bridge(
        "enqueue_uploads",
        serde_json::json!({
            "connectionId": connection_id,
            "bucketName": bucket_name,
            "files": files
        }),
    )?;
    Ok(())
}
