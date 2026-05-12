use rusqlite::params;
use serde::Serialize;
use tauri::State;

use crate::security::encryption;
use crate::security::keyring::get_or_create_master_key;
use crate::state::app_state::{with_connection, AppState};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncryptedSecretResponse {
    pub version: i32,
    pub algorithm: String,
    pub ciphertext: String,
    pub iv: String,
    pub tag: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DecryptedConnectionDto {
    pub connection_id: String,
    pub access_key_id: String,
    pub secret_access_key: String,
}

#[tauri::command]
pub async fn encrypt_secret(
    _state: State<'_, AppState>,
    user_id: String,
    connection_id: String,
    value: String,
) -> Result<EncryptedSecretResponse, String> {
    let master_key = get_or_create_master_key(&user_id)?;
    let encrypted = encryption::encrypt_secret(&master_key, &user_id, &connection_id, &value)?;
    Ok(EncryptedSecretResponse {
        version: encrypted.version,
        algorithm: encrypted.algorithm,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
    })
}

#[tauri::command]
pub async fn decrypt_connection(
    state: State<'_, AppState>,
    connection_id: String,
) -> Result<DecryptedConnectionDto, String> {
    let user_id = state
        .user_id
        .lock()
        .map_err(|_| String::from("failed to read auth state"))?
        .clone()
        .ok_or_else(|| String::from("user session required"))?;

    let (encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag) =
        with_connection(state.db_path.as_ref(), |connection| {
            let mut stmt = connection
                .prepare(
                    "SELECT encrypted_access_key_id, encrypted_secret_access_key, encryption_iv, encryption_tag
                     FROM r2_connections WHERE id = ?1 AND user_id = ?2",
                )
                .map_err(|err| err.to_string())?;

            stmt.query_row(params![connection_id, user_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
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

    Ok(DecryptedConnectionDto {
        connection_id,
        access_key_id,
        secret_access_key,
    })
}
