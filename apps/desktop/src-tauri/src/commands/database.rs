use std::time::{SystemTime, UNIX_EPOCH};

use aws_config::{BehaviorVersion, Region};
use aws_sdk_s3::config::Credentials;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::security::encryption;
use crate::security::keyring::get_or_create_master_key;
use crate::state::app_state::{with_connection, AppState};

#[derive(Debug, Deserialize)]
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

#[derive(Debug, Serialize)]
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderNodeDto {
    pub key: String,
    pub name: String,
    pub child_count: Option<u32>,
}

#[derive(Debug, Serialize)]
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BrowseFolderResult {
    pub folders: Vec<FolderNodeDto>,
    pub files: Vec<FileNodeDto>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UploadQueueItem {
    pub file_name: String,
    pub size_bytes: u64,
    pub source_path: String,
    pub target_path: String,
}

fn generate_id(prefix: &str) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();
    format!("{prefix}-{millis}")
}

fn current_user_id(state: &State<AppState>) -> Result<String, String> {
    state
        .user_id
        .lock()
        .map_err(|_| String::from("failed to read auth state"))?
        .clone()
        .ok_or_else(|| String::from("user session required"))
}

async fn make_client(endpoint: &str, region: &str, access_key_id: &str, secret_access_key: &str) -> Result<Client, String> {
    let creds = Credentials::new(
        access_key_id.to_string(),
        secret_access_key.to_string(),
        None,
        None,
        "r2-explorer",
    );

    let shared = aws_config::defaults(BehaviorVersion::latest())
        .region(Region::new(region.to_string()))
        .credentials_provider(creds)
        .load()
        .await;

    let config = aws_sdk_s3::config::Builder::from(&shared)
        .endpoint_url(endpoint.to_string())
        .force_path_style(true)
        .build();

    Ok(Client::from_conf(config))
}

#[tauri::command]
pub async fn list_connections(state: State<'_, AppState>) -> Result<Vec<R2ConnectionSafeDto>, String> {
    let user_id = current_user_id(&state)?;
    with_connection(state.db_path.as_ref(), |connection| {
        let mut stmt = connection
            .prepare(
                "SELECT id, name, bucket_name, endpoint, public_url, region, status, last_connected_at, last_selected_path
                 FROM r2_connections
                 WHERE user_id = ?1
                 ORDER BY created_at ASC",
            )
            .map_err(|err| err.to_string())?;

        let rows = stmt
            .query_map(params![user_id], |row| {
                Ok(R2ConnectionSafeDto {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    bucket_name: row.get(2)?,
                    endpoint: row.get(3)?,
                    public_url: row.get(4)?,
                    region: row.get(5)?,
                    status: row.get(6)?,
                    last_connected_at: row.get(7)?,
                    last_selected_path: row.get(8)?,
                })
            })
            .map_err(|err| err.to_string())?;

        rows.collect::<Result<Vec<_>, _>>().map_err(|err| err.to_string())
    })
}

#[tauri::command]
pub async fn create_connection(
    state: State<'_, AppState>,
    input: R2ConnectionCreateInput,
) -> Result<R2ConnectionSafeDto, String> {
    let user_id = current_user_id(&state)?;
    let connection_id = generate_id("conn");

    let client = make_client(
        &input.endpoint,
        &input.region,
        &input.access_key_id,
        &input.secret_access_key,
    )
    .await?;

    client
        .list_objects_v2()
        .bucket(input.bucket_name.clone())
        .max_keys(1)
        .send()
        .await
        .map_err(|_| {
            String::from(
                "Could not connect to this R2 bucket. Check the endpoint, bucket name, and access key permissions.",
            )
        })?;

    let master_key = get_or_create_master_key(&user_id)?;
    let encrypted_access_key = encryption::encrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &input.access_key_id,
    )?;
    let encrypted_secret_key = encryption::encrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &input.secret_access_key,
    )?;

    with_connection(state.db_path.as_ref(), |connection| {
        connection
            .execute(
                "INSERT INTO r2_connections (
                    id, user_id, name, account_id, bucket_name, endpoint, public_url, region,
                    encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag,
                    encryption_version, status, last_selected_path
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1, 'ACTIVE', '/')",
                params![
                    connection_id,
                    user_id,
                    input.name,
                    input.account_id,
                    input.bucket_name,
                    input.endpoint,
                    input.public_url,
                    input.region,
                    encrypted_access_key.ciphertext,
                    encrypted_secret_key.ciphertext,
                    encrypted_access_key.iv,
                    encrypted_access_key.tag,
                ],
            )
            .map_err(|err| err.to_string())?;

        connection
            .execute(
                "INSERT INTO app_settings (user_id, active_connection_id) VALUES (?1, ?2)
                 ON CONFLICT(user_id) DO UPDATE SET active_connection_id = excluded.active_connection_id, updated_at = CURRENT_TIMESTAMP",
                params![user_id, connection_id],
            )
            .map_err(|err| err.to_string())?;

        Ok(())
    })?;

    Ok(R2ConnectionSafeDto {
        id: connection_id,
        name: input.name,
        bucket_name: input.bucket_name,
        endpoint: input.endpoint,
        public_url: input.public_url,
        region: input.region,
        status: String::from("ACTIVE"),
        last_connected_at: None,
        last_selected_path: String::from("/"),
    })
}

#[tauri::command]
pub async fn set_active_connection(state: State<'_, AppState>, connection_id: String) -> Result<(), String> {
    let user_id = current_user_id(&state)?;
    with_connection(state.db_path.as_ref(), |connection| {
        connection
            .execute(
                "INSERT INTO app_settings (user_id, active_connection_id) VALUES (?1, ?2)
                 ON CONFLICT(user_id) DO UPDATE SET active_connection_id = excluded.active_connection_id, updated_at = CURRENT_TIMESTAMP",
                params![user_id, connection_id],
            )
            .map_err(|err| err.to_string())?;
        Ok(())
    })
}

fn normalize_prefix(path: &str) -> String {
    let clean = path.trim().trim_matches('/');
    if clean.is_empty() {
        String::new()
    } else {
        format!("{clean}/")
    }
}

#[tauri::command]
pub async fn browse_folder(
    state: State<'_, AppState>,
    connection_id: String,
    bucket_name: String,
    path: String,
) -> Result<BrowseFolderResult, String> {
    let user_id = current_user_id(&state)?;

    let (endpoint, region, encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag) =
        with_connection(state.db_path.as_ref(), |connection| {
            let mut stmt = connection
                .prepare(
                    "SELECT endpoint, region, encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag
                     FROM r2_connections WHERE id = ?1 AND user_id = ?2",
                )
                .map_err(|err| err.to_string())?;
            stmt
                .query_row(params![connection_id, user_id], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                    ))
                })
                .map_err(|err| err.to_string())
        })?;

    let master_key = get_or_create_master_key(&user_id)?;
    let access_key_id = encryption::decrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &encrypted_access_key_id,
        &encryption_iv,
        &encryption_tag,
    )?;

    let secret_access_key = encryption::decrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &encrypted_secret_access_key,
        &encryption_iv,
        &encryption_tag,
    )?;

    let client = make_client(&endpoint, &region, &access_key_id, &secret_access_key).await?;

    let output = client
        .list_objects_v2()
        .bucket(bucket_name)
        .prefix(normalize_prefix(&path))
        .delimiter("/")
        .send()
        .await
        .map_err(|err| err.to_string())?;

    let folders = output
        .common_prefixes()
        .iter()
        .filter_map(|item| item.prefix().map(|prefix| prefix.to_string()))
        .map(|prefix| {
            let name = prefix.trim_end_matches('/').split('/').last().unwrap_or(&prefix).to_string();
            FolderNodeDto {
                key: prefix,
                name,
                child_count: None,
            }
        })
        .collect::<Vec<_>>();

    let files = output
        .contents()
        .iter()
        .filter_map(|item| {
            let key = item.key()?.to_string();
            if key.ends_with('/') {
                return None;
            }
            let name = key.split('/').last().unwrap_or(&key).to_string();
            Some(FileNodeDto {
                key,
                name,
                size_bytes: item.size().unwrap_or(0).max(0) as u64,
                mime_type: None,
                last_modified: item
                    .last_modified()
                    .map(|value| value.to_string()),
                etag: item.e_tag().map(|value| value.to_string()),
                storage_class: item.storage_class().map(|value| value.as_str().to_string()),
            })
        })
        .collect::<Vec<_>>();

    Ok(BrowseFolderResult { folders, files })
}

#[tauri::command]
pub async fn create_folder(
    state: State<'_, AppState>,
    connection_id: String,
    bucket_name: String,
    path: String,
    folder_name: String,
) -> Result<(), String> {
    if folder_name.trim().is_empty() {
        return Err(String::from("Folder name cannot be empty"));
    }
    if folder_name.contains('\\') {
        return Err(String::from("Folder name cannot include \\"));
    }

    let user_id = current_user_id(&state)?;

    let (endpoint, region, encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag) =
        with_connection(state.db_path.as_ref(), |connection| {
            let mut stmt = connection
                .prepare(
                    "SELECT endpoint, region, encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag
                     FROM r2_connections WHERE id = ?1 AND user_id = ?2",
                )
                .map_err(|err| err.to_string())?;
            stmt
                .query_row(params![connection_id, user_id], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                        row.get::<_, String>(5)?,
                    ))
                })
                .map_err(|err| err.to_string())
        })?;

    let master_key = get_or_create_master_key(&user_id)?;
    let access_key_id = encryption::decrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &encrypted_access_key_id,
        &encryption_iv,
        &encryption_tag,
    )?;

    let secret_access_key = encryption::decrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &encrypted_secret_access_key,
        &encryption_iv,
        &encryption_tag,
    )?;

    let client = make_client(&endpoint, &region, &access_key_id, &secret_access_key).await?;
    let path_prefix = normalize_prefix(&path);
    let object_key = format!("{}{}/", path_prefix, folder_name.trim().trim_matches('/'));

    client
        .put_object()
        .bucket(bucket_name)
        .key(object_key)
        .body(ByteStream::from(vec![]))
        .send()
        .await
        .map_err(|err| err.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn enqueue_uploads(
    state: State<'_, AppState>,
    connection_id: String,
    bucket_name: String,
    _target_path: String,
    files: Vec<UploadQueueItem>,
) -> Result<(), String> {
    let user_id = current_user_id(&state)?;
    with_connection(state.db_path.as_ref(), |connection| {
        for item in files {
            let upload_id = generate_id("upload");
            connection
                .execute(
                    "INSERT INTO upload_history (
                        id, user_id, connection_id, bucket_name, source_path, object_key,
                        file_name, size_bytes, status, progress
                     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'QUEUED', 0)",
                    params![
                        upload_id,
                        user_id,
                        connection_id,
                        bucket_name,
                        item.source_path,
                        item.target_path,
                        item.file_name,
                        item.size_bytes as i64,
                    ],
                )
                .map_err(|err| err.to_string())?;
        }
        Ok(())
    })
}
