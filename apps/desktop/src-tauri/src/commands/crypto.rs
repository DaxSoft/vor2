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

fn map_decrypt_error(err: String) -> String {
    if err == "decryption failure" {
        return String::from(
            "Saved credentials for this connection could not be decrypted. Recreate this connection to store fresh credentials.",
        );
    }
    err
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

    let (
        encrypted_access_key_id,
        encrypted_secret_access_key,
        encrypted_access_key_iv,
        encrypted_access_key_tag,
        encrypted_secret_access_key_iv,
        encrypted_secret_access_key_tag,
        encryption_iv,
        encryption_tag,
    ) =
        with_connection(state.db_path.as_ref(), |connection| {
            let mut stmt = connection
                .prepare(
                    "SELECT encrypted_access_key_id, encrypted_secret_access_key,
                            encrypted_access_key_iv, encrypted_access_key_tag,
                            encrypted_secret_access_key_iv, encrypted_secret_access_key_tag,
                            encryption_iv, encryption_tag
                     FROM r2_connections WHERE id = ?1 AND user_id = ?2",
                )
                .map_err(|err| err.to_string())?;

            stmt.query_row(params![connection_id, user_id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, String>(6)?,
                    row.get::<_, String>(7)?,
                ))
            })
            .map_err(|err| err.to_string())
        })?;

    let access_iv = if encrypted_access_key_iv.is_empty() {
        encryption_iv.as_str()
    } else {
        encrypted_access_key_iv.as_str()
    };
    let access_tag = if encrypted_access_key_tag.is_empty() {
        encryption_tag.as_str()
    } else {
        encrypted_access_key_tag.as_str()
    };
    let secret_iv = if encrypted_secret_access_key_iv.is_empty() {
        encryption_iv.as_str()
    } else {
        encrypted_secret_access_key_iv.as_str()
    };
    let secret_tag = if encrypted_secret_access_key_tag.is_empty() {
        encryption_tag.as_str()
    } else {
        encrypted_secret_access_key_tag.as_str()
    };

    let master_key = get_or_create_master_key(&user_id)?;
    let access_key_id = encryption::decrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &encrypted_access_key_id,
        access_iv,
        access_tag,
    )
    .map_err(map_decrypt_error)?;

    let secret_access_key = encryption::decrypt_secret(
        &master_key,
        &user_id,
        &connection_id,
        &encrypted_secret_access_key,
        secret_iv,
        secret_tag,
    )
    .map_err(map_decrypt_error)?;

    Ok(DecryptedConnectionDto {
        connection_id,
        access_key_id,
        secret_access_key,
    })
}
