use serde::Serialize;
use tauri::State;

use crate::state::app_state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionDto {
    pub user_id: String,
}

#[tauri::command]
pub async fn get_session(state: State<'_, AppState>) -> Result<Option<SessionDto>, String> {
    let user_id = state
        .user_id
        .lock()
        .map_err(|_| String::from("failed to read auth state"))?
        .clone();
    Ok(user_id.map(|id| SessionDto { user_id: id }))
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
