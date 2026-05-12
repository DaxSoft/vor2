use rand::RngCore;
use rusqlite::params;
use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::State;

use crate::state::app_state::{with_connection, AppState};

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionDto {
    pub user: SessionUserDto,
    pub expires_at: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SessionUserDto {
    pub id: String,
    pub username: String,
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect::<String>()
}

fn normalize_username(username: &str) -> String {
    username.trim().to_lowercase()
}

fn hash_password(password: &str, salt: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt);
    hasher.update(password.as_bytes());
    to_hex(&hasher.finalize())
}

fn now_plus_days_iso(days: i64) -> String {
    let now = chrono::Utc::now();
    let expires = now + chrono::Duration::days(days);
    expires.to_rfc3339()
}

fn set_current_session(state: &State<'_, AppState>, user_id: String) -> Result<(), String> {
    let mut session = state
        .user_id
        .lock()
        .map_err(|_| String::from("failed to write auth state"))?;
    *session = Some(user_id);
    Ok(())
}

#[tauri::command]
pub async fn sign_up_with_password(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<SessionDto, String> {
    let normalized_username = normalize_username(&username);
    if normalized_username.is_empty() {
        return Err(String::from("Username is required."));
    }
    if password.trim().len() < 6 {
        return Err(String::from("Password must have at least 6 characters."));
    }

    let mut salt = [0_u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    let salt_hex = to_hex(&salt);
    let password_hash = hash_password(&password, &salt);
    let user_id = format!("user-{}", chrono::Utc::now().timestamp_millis());

    with_connection(state.db_path.as_ref(), |connection| {
        let exists = connection
            .query_row(
                "SELECT COUNT(1) FROM auth_users WHERE username = ?1",
                params![normalized_username],
                |row| row.get::<_, i64>(0),
            )
            .unwrap_or(0);

        if exists > 0 {
            return Err(String::from("Username already exists."));
        }

        connection
            .execute(
                "INSERT INTO auth_users (id, username, password_hash, password_salt) VALUES (?1, ?2, ?3, ?4)",
                params![user_id, normalized_username, password_hash, salt_hex],
            )
            .map_err(|err| err.to_string())?;
        Ok(())
    })?;

    set_current_session(&state, user_id.clone())?;

    Ok(SessionDto {
        user: SessionUserDto {
            id: user_id,
            username: normalized_username,
        },
        expires_at: now_plus_days_iso(30),
    })
}

#[tauri::command]
pub async fn sign_in_with_password(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<SessionDto, String> {
    let normalized_username = normalize_username(&username);
    if normalized_username.is_empty() || password.trim().is_empty() {
        return Err(String::from("Username and password are required."));
    }

    let user = with_connection(state.db_path.as_ref(), |connection| {
        let mut stmt = connection
            .prepare(
                "SELECT id, username, password_hash, password_salt FROM auth_users WHERE username = ?1",
            )
            .map_err(|err| err.to_string())?;

        stmt.query_row(params![normalized_username], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
            ))
        })
        .map_err(|_| String::from("Invalid username or password."))
    })?;

    let (user_id, stored_username, stored_hash, stored_salt_hex) = user;
    let salt = hex::decode(stored_salt_hex).map_err(|_| String::from("Invalid username or password."))?;
    let calculated = hash_password(&password, &salt);

    if calculated != stored_hash {
        return Err(String::from("Invalid username or password."));
    }

    set_current_session(&state, user_id.clone())?;

    Ok(SessionDto {
        user: SessionUserDto {
            id: user_id,
            username: stored_username,
        },
        expires_at: now_plus_days_iso(30),
    })
}

#[tauri::command]
pub async fn get_session(state: State<'_, AppState>) -> Result<Option<SessionDto>, String> {
    let user_id = state
        .user_id
        .lock()
        .map_err(|_| String::from("failed to read auth state"))?
        .clone();

    let Some(user_id) = user_id else {
        return Ok(None);
    };

    let username = with_connection(state.db_path.as_ref(), |connection| {
        connection
            .query_row(
                "SELECT username FROM auth_users WHERE id = ?1",
                params![user_id],
                |row| row.get::<_, String>(0),
            )
            .map_err(|_| String::from("session user not found"))
    })?;

    Ok(Some(SessionDto {
        user: SessionUserDto { id: user_id, username },
        expires_at: now_plus_days_iso(30),
    }))
}

#[tauri::command]
pub async fn clear_session(state: State<'_, AppState>) -> Result<(), String> {
    let mut user = state
        .user_id
        .lock()
        .map_err(|_| String::from("failed to write auth state"))?;
    *user = None;
    Ok(())
}
