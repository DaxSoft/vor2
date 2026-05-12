use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State, WebviewWindow};

use crate::state::app_state::{with_connection, AppState};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsDto {
    pub start_minimized_to_tray: bool,
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAppSettingsInput {
    pub start_minimized_to_tray: bool,
    pub close_to_tray: bool,
    pub launch_at_startup: bool,
}

fn resolve_user_id(state: &State<'_, AppState>) -> String {
    match state.user_id.lock() {
        Ok(value) => value.clone().unwrap_or_else(|| String::from("local-user")),
        Err(_) => String::from("local-user"),
    }
}

fn load_settings(state: &State<'_, AppState>) -> Result<AppSettingsDto, String> {
    let user_id = resolve_user_id(state);
    with_connection(state.db_path.as_ref(), |connection| {
        let mut stmt = connection
            .prepare(
                "SELECT start_minimized_to_tray, close_to_tray, launch_at_startup
                 FROM app_settings WHERE user_id = ?1",
            )
            .map_err(|err| err.to_string())?;

        let settings = stmt
            .query_row(params![user_id], |row| {
                Ok(AppSettingsDto {
                    start_minimized_to_tray: row.get::<_, i64>(0)? == 1,
                    close_to_tray: row.get::<_, i64>(1)? == 1,
                    launch_at_startup: row.get::<_, i64>(2)? == 1,
                })
            })
            .unwrap_or(AppSettingsDto {
                start_minimized_to_tray: true,
                close_to_tray: true,
                launch_at_startup: false,
            });

        Ok(settings)
    })
}

fn save_settings(state: &State<'_, AppState>, input: &UpdateAppSettingsInput) -> Result<AppSettingsDto, String> {
    let user_id = resolve_user_id(state);
    with_connection(state.db_path.as_ref(), |connection| {
        connection
            .execute(
                "INSERT INTO app_settings (user_id, start_minimized_to_tray, close_to_tray, launch_at_startup)
                 VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(user_id) DO UPDATE
                 SET
                    start_minimized_to_tray = excluded.start_minimized_to_tray,
                    close_to_tray = excluded.close_to_tray,
                    launch_at_startup = excluded.launch_at_startup,
                    updated_at = CURRENT_TIMESTAMP",
                params![
                    user_id,
                    if input.start_minimized_to_tray { 1 } else { 0 },
                    if input.close_to_tray { 1 } else { 0 },
                    if input.launch_at_startup { 1 } else { 0 }
                ],
            )
            .map_err(|err| err.to_string())?;

        Ok(AppSettingsDto {
            start_minimized_to_tray: input.start_minimized_to_tray,
            close_to_tray: input.close_to_tray,
            launch_at_startup: input.launch_at_startup,
        })
    })
}

fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| String::from("main window not found"))
}

#[tauri::command]
pub async fn show_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.show().map_err(|err| err.to_string())?;
    window.unminimize().map_err(|err| err.to_string())?;
    window.set_focus().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn hide_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.hide().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn minimize_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.minimize().map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn toggle_maximize_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    let is_maximized = window.is_maximized().map_err(|err| err.to_string())?;
    if is_maximized {
        window.unmaximize().map_err(|err| err.to_string())?;
    } else {
        window.maximize().map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_app_settings(state: State<'_, AppState>) -> Result<AppSettingsDto, String> {
    load_settings(&state)
}

#[tauri::command]
pub async fn update_app_settings(
    state: State<'_, AppState>,
    input: UpdateAppSettingsInput,
) -> Result<AppSettingsDto, String> {
    save_settings(&state, &input)
}

#[tauri::command]
pub async fn set_startup_enabled(_enabled: bool) -> Result<(), String> {
    Ok(())
}
